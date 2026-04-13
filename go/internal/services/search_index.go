package services

import (
	"container/list"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"gonote/internal/models"
)

// Pre-compiled regex patterns for performance
var (
	cjkRegex = regexp.MustCompile(`[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}]`)
)

// SearchIndex provides fast full-text search using inverted index
// Uses double-buffering for non-blocking index rebuilds
type SearchIndex struct {
	mu            sync.RWMutex
	index         map[string]*list.List // term -> list of IndexEntry
	titleIndex    map[string]*list.List // term -> list of TitleEntry (title-only index)
	titleMap      map[string]string     // notePath -> title (for title lookup)
	notesDir      string
	cache         *Cache
	noteService   *NoteService   // Shared NoteService for reusing cache
	searchService *SearchService // SearchService for disk-scan fallback
}

// TitleEntry represents a title match with score
type TitleEntry struct {
	NotePath string
	Title    string
	Score    float64 // relevance score for ranking
}

// IndexEntry represents a single occurrence of a term in a note
type IndexEntry struct {
	NotePath string
	Position int // byte position in file
}

// NewSearchIndex creates a new search index with shared NoteService
func NewSearchIndex(notesDir string, noteService *NoteService) *SearchIndex {
	return &SearchIndex{
		index:         make(map[string]*list.List),
		titleIndex:    make(map[string]*list.List),
		titleMap:      make(map[string]string),
		notesDir:      notesDir,
		cache:         NewCache(10000, 15*time.Minute), // Cache index entries for 15 minutes
		noteService:   noteService,
		searchService: NewSearchService(notesDir),
	}
}

// BuildIndex builds the full search index from all notes
// Uses double-buffering: builds new index without lock, then swaps atomically
func (si *SearchIndex) BuildIndex() error {
	// Phase 1: Build new index without holding lock (allows concurrent searches)
	newIndex := make(map[string]*list.List)
	newTitleIndex := make(map[string]*list.List)
	newTitleMap := make(map[string]string)

	// Use shared NoteService to leverage its cache
	if si.noteService == nil {
		si.noteService = NewNoteService(si.notesDir)
	}
	notes, _, err := si.noteService.ScanNotes(false)
	if err != nil {
		return err
	}

	// Index each note into the new index
	for _, note := range notes {
		if err := si.indexNoteTo(note.Path, newIndex, newTitleIndex, newTitleMap); err != nil {
			// Log error but continue indexing other notes
			continue
		}
	}

	// Phase 2: Swap index atomically with brief write lock
	si.mu.Lock()
	si.index = newIndex
	si.titleIndex = newTitleIndex
	si.titleMap = newTitleMap
	si.mu.Unlock()

	return nil
}

// indexNoteTo indexes a single note into the provided index map
func (si *SearchIndex) indexNoteTo(notePath string, index map[string]*list.List, titleIndex map[string]*list.List, titleMap map[string]string) error {
	fullPath := filepath.Join(si.notesDir, notePath)
	content, err := readFileContent(fullPath)
	if err != nil {
		return err
	}

	// Extract title from frontmatter or first line
	title := extractTitle(content, notePath)
	titleMap[notePath] = title

	// Tokenize content for full-text index
	terms := tokenize(content)

	// Add each term to full-text index
	for pos, term := range terms {
		if _, ok := index[term]; !ok {
			index[term] = list.New()
		}
		index[term].PushBack(IndexEntry{
			NotePath: notePath,
			Position: pos,
		})
	}

	// Tokenize title for title index
	titleTerms := tokenize(title)
	for _, term := range titleTerms {
		if _, ok := titleIndex[term]; !ok {
			titleIndex[term] = list.New()
		}
		titleIndex[term].PushBack(TitleEntry{
			NotePath: notePath,
			Title:    title,
			Score:    0, // score calculated at query time
		})
	}

	return nil
}

// indexNote indexes a single note into the main index (must hold lock)
func (si *SearchIndex) indexNote(notePath string) error {
	fullPath := filepath.Join(si.notesDir, notePath)
	content, err := readFileContent(fullPath)
	if err != nil {
		return err
	}

	// Extract and store title
	title := extractTitle(content, notePath)
	si.titleMap[notePath] = title

	// Remove old title entries from titleIndex
	for term, entries := range si.titleIndex {
		for e := entries.Front(); e != nil; {
			next := e.Next()
			entry := e.Value.(TitleEntry)
			if entry.NotePath == notePath {
				entries.Remove(e)
			}
			e = next
		}
		if entries.Len() == 0 {
			delete(si.titleIndex, term)
		}
	}

	// Tokenize content for full-text index
	terms := tokenize(content)

	// Remove old content entries from index
	for term, entries := range si.index {
		for e := entries.Front(); e != nil; {
			next := e.Next()
			entry := e.Value.(IndexEntry)
			if entry.NotePath == notePath {
				entries.Remove(e)
			}
			e = next
		}
		if entries.Len() == 0 {
			delete(si.index, term)
		}
	}

	// Add each term to full-text index
	for pos, term := range terms {
		if _, ok := si.index[term]; !ok {
			si.index[term] = list.New()
		}
		si.index[term].PushBack(IndexEntry{
			NotePath: notePath,
			Position: pos,
		})
	}

	// Tokenize title for title index
	titleTerms := tokenize(title)
	for _, term := range titleTerms {
		if _, ok := si.titleIndex[term]; !ok {
			si.titleIndex[term] = list.New()
		}
		si.titleIndex[term].PushBack(TitleEntry{
			NotePath: notePath,
			Title:    title,
			Score:    0,
		})
	}

	return nil
}

// UpdateIndex updates the index for a single note (incremental)
func (si *SearchIndex) UpdateIndex(notePath string) error {
	si.mu.Lock()
	defer si.mu.Unlock()

	si.removeNoteFromIndex(notePath)

	return si.indexNote(notePath)
}

// RemoveFromIndex removes a note from the index
func (si *SearchIndex) RemoveFromIndex(notePath string) {
	si.mu.Lock()
	defer si.mu.Unlock()

	si.removeNoteFromIndex(notePath)
}

// removeNoteFromIndex removes all entries for a note (must hold lock)
func (si *SearchIndex) removeNoteFromIndex(notePath string) {
	for term, entries := range si.index {
		for e := entries.Front(); e != nil; {
			next := e.Next()
			entry := e.Value.(IndexEntry)
			if entry.NotePath == notePath {
				entries.Remove(e)
			}
			e = next
		}

		// Remove term if no entries left
		if entries.Len() == 0 {
			delete(si.index, term)
		}
	}
}

// Search performs a search using the inverted index
// Uses read lock for concurrent search access
// Supports prefix matching for partial searches (e.g., "gol" matches "golang")
func (si *SearchIndex) Search(query string) ([]models.SearchResult, error) {
	si.mu.RLock()
	defer si.mu.RUnlock()

	if query == "" {
		return []models.SearchResult{}, nil
	}

	// Check if query contains CJK characters - use phrase matching for CJK
	if cjkRegex.MatchString(query) {
		return si.searchCJK(query)
	}

	// Tokenize query for non-CJK search
	terms := tokenize(query)
	if len(terms) == 0 {
		return []models.SearchResult{}, nil
	}

	// Find matches using prefix matching
	var results []models.SearchResult
	matchedNotes := make(map[string]bool)

	// Find all notes that match the first term (with prefix matching)
	firstTerm := terms[0]
	candidateNotes := si.findNotesWithPrefix(firstTerm)
	
	if len(candidateNotes) == 0 {
		return []models.SearchResult{}, nil
	}

	// Check each candidate note against all query terms
	for notePath := range candidateNotes {
		// Skip if already matched
		if matchedNotes[notePath] {
			continue
		}

		// Check if note contains all query terms (with prefix matching)
		if si.noteContainsTermsWithPrefix(notePath, terms) {
			matchedNotes[notePath] = true

			// Get note info using shared NoteService
			content, err := si.noteService.GetNoteContent(notePath)
			if err != nil {
				continue
			}

			// Build search result with context
			result := si.buildSearchResult(notePath, content, query)
			results = append(results, result)
		}
	}

	// If no results from index, fall back to scanning all notes from disk
	// This handles cases where the index might not be fully up-to-date
	if len(results) == 0 {
		return si.searchFromDisk(query)
	}

	return results, nil
}

// searchFromDisk searches for non-CJK queries by scanning all notes from disk
// Used as fallback when index search returns no results
func (si *SearchIndex) searchFromDisk(query string) ([]models.SearchResult, error) {
	// Use NoteService to scan all notes
	notes, _, err := si.noteService.ScanNotes(false)
	if err != nil {
		return nil, err
	}

	// Escape the query for regex
	escapedQuery := regexp.QuoteMeta(query)

	// Case-insensitive pattern
	pattern, err := regexp.Compile("(?i)" + escapedQuery)
	if err != nil {
		return nil, err
	}

	return si.searchNotesWithPattern(notes, pattern, query)
}

// searchNotesWithPattern searches notes using a regex pattern and builds results
func (si *SearchIndex) searchNotesWithPattern(notes []models.Note, pattern *regexp.Regexp, query string) ([]models.SearchResult, error) {
	results := []models.SearchResult{}
	matchedNotes := make(map[string]bool)

	for _, note := range notes {
		if matchedNotes[note.Path] {
			continue
		}

		content, err := si.noteService.GetNoteContent(note.Path)
		if err != nil {
			continue
		}

		if pattern.MatchString(content) {
			matchedNotes[note.Path] = true
			result := si.buildSearchResult(note.Path, content, query)
			results = append(results, result)
		}
	}

	return results, nil
}

// findNotesWithPrefix finds all notes that contain terms starting with the given prefix
func (si *SearchIndex) findNotesWithPrefix(prefix string) map[string]bool {
	notes := make(map[string]bool)
	
	for term, entries := range si.index {
		if strings.HasPrefix(term, prefix) {
			for e := entries.Front(); e != nil; e = e.Next() {
				entry := e.Value.(IndexEntry)
				notes[entry.NotePath] = true
			}
		}
	}
	
	return notes
}

// noteContainsTermsWithPrefix checks if a note contains all terms (with prefix matching)
func (si *SearchIndex) noteContainsTermsWithPrefix(notePath string, terms []string) bool {
	for _, term := range terms {
		found := false
		// Check if any indexed term starts with this query term
		for indexedTerm, entries := range si.index {
			if strings.HasPrefix(indexedTerm, term) {
				for e := entries.Front(); e != nil; e = e.Next() {
					entry := e.Value.(IndexEntry)
					if entry.NotePath == notePath {
						found = true
						break
					}
				}
			}
			if found {
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

// SearchByTitle searches only note titles with prefix and fuzzy matching
func (si *SearchIndex) SearchByTitle(query string) ([]models.SearchResult, error) {
	si.mu.RLock()
	defer si.mu.RUnlock()

	if query == "" {
		return []models.SearchResult{}, nil
	}

	queryLower := strings.ToLower(query)
	queryTerms := tokenize(query)

	if len(queryTerms) == 0 {
		// Single character or short query - try prefix matching on titleIndex
		return si.searchTitleByPrefix(queryLower)
	}

	// Multi-term query: find notes whose titles contain all terms (with prefix matching)
	type titleScore struct {
		notePath string
		title    string
		score    float64
	}
	var matches []titleScore
	matchedNotes := make(map[string]bool)

	// Find candidate notes using first term prefix
	candidates := si.findTitlesWithPrefix(queryTerms[0])

	for notePath, title := range candidates {
		if matchedNotes[notePath] {
			continue
		}

		// Check if title contains all query terms (prefix matching)
		if si.titleContainsTerms(title, queryTerms) {
			matchedNotes[notePath] = true
			score := si.calculateTitleScore(title, queryLower)
			matches = append(matches, titleScore{
				notePath: notePath,
				title:    title,
				score:    score,
			})
		}
	}

	// Sort by score descending
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].score > matches[j].score
	})

	// Build search results
	var results []models.SearchResult
	for _, m := range matches {
		result := si.buildTitleResult(m.notePath, m.title, query)
		result.Score = m.score
		results = append(results, result)
	}

	// If no results from index, fall back to scanning all notes from disk
	// This handles cases where the index might not be fully up-to-date
	if len(results) == 0 {
		return si.searchTitleFromDisk(query)
	}

	return results, nil
}

// findTitlesWithPrefix finds all notes whose titles contain terms starting with the prefix
func (si *SearchIndex) findTitlesWithPrefix(prefix string) map[string]string {
	result := make(map[string]string)

	for term, entries := range si.titleIndex {
		if strings.HasPrefix(term, prefix) {
			for e := entries.Front(); e != nil; e = e.Next() {
				entry := e.Value.(TitleEntry)
				if title, ok := si.titleMap[entry.NotePath]; ok {
					result[entry.NotePath] = title
				}
			}
		}
	}

	return result
}

// titleContainsTerms checks if a title contains all terms (with prefix matching)
func (si *SearchIndex) titleContainsTerms(title string, terms []string) bool {
	titleLower := strings.ToLower(title)
	for _, term := range terms {
		found := false
		for indexedTerm := range si.titleIndex {
			if strings.HasPrefix(indexedTerm, term) && strings.Contains(titleLower, indexedTerm) {
				found = true
				break
			}
		}
		// Also try direct containment
		if !found && strings.Contains(titleLower, term) {
			found = true
		}
		if !found {
			return false
		}
	}
	return true
}

// calculateTitleScore calculates relevance score for title matching
func (si *SearchIndex) calculateTitleScore(title string, query string) float64 {
	titleLower := strings.ToLower(title)
	score := 0.0

	// Exact match gets highest score
	if titleLower == query {
		score = 100.0
		return score
	}

	// Starts with query gets high score
	if strings.HasPrefix(titleLower, query) {
		score = 80.0
		return score
	}

	// Contains query gets medium score
	if strings.Contains(titleLower, query) {
		score = 60.0
		// Bonus for word boundary match
		if strings.HasPrefix(titleLower, query) || strings.Contains(titleLower, " "+query) {
			score += 10.0
		}
		return score
	}

	// Fuzzy: count matched terms from tokenized query
	queryTerms := tokenize(query)
	if len(queryTerms) == 0 {
		// For single-char queries, try direct containment
		if strings.Contains(titleLower, query) {
			score = 40.0
		}
		return score
	}

	matchedTerms := 0
	for _, term := range queryTerms {
		if strings.Contains(titleLower, term) {
			matchedTerms++
		}
	}
	if len(queryTerms) > 0 {
		score = float64(matchedTerms) / float64(len(queryTerms)) * 40.0
	}

	return score
}

// searchTitleFromDisk searches titles by scanning all notes from disk
// Used as fallback when title index search returns no results
func (si *SearchIndex) searchTitleFromDisk(query string) ([]models.SearchResult, error) {
	// Use NoteService to scan all notes
	notes, _, err := si.noteService.ScanNotes(false)
	if err != nil {
		return nil, err
	}

	queryLower := strings.ToLower(query)
	var results []models.SearchResult

	for _, note := range notes {
		content, err := si.noteService.GetNoteContent(note.Path)
		if err != nil {
			continue
		}

		// Extract title from content
		title := extractTitle(content, note.Path)
		titleLower := strings.ToLower(title)

		// Check if title contains the query (case-insensitive)
		if strings.Contains(titleLower, queryLower) {
			result := si.buildTitleResult(note.Path, title, query)
			result.Score = si.calculateTitleScore(title, queryLower)
			results = append(results, result)
		}
	}

	// Sort by score descending
	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	return results, nil
}

// searchTitleByPrefix handles single-term or short prefix searches
func (si *SearchIndex) searchTitleByPrefix(prefix string) ([]models.SearchResult, error) {
	type titleScore struct {
		notePath string
		title    string
		score    float64
	}
	var matches []titleScore
	seen := make(map[string]bool)

	prefixLower := strings.ToLower(prefix)

	for term, entries := range si.titleIndex {
		if strings.HasPrefix(term, prefixLower) {
			for e := entries.Front(); e != nil; e = e.Next() {
				entry := e.Value.(TitleEntry)
				if seen[entry.NotePath] {
					continue
				}
				seen[entry.NotePath] = true

				title := entry.Title
				score := si.calculateTitleScore(title, prefixLower)
				matches = append(matches, titleScore{
					notePath: entry.NotePath,
					title:    title,
					score:    score,
				})
			}
		}
	}

	// Sort by score
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].score > matches[j].score
	})

	var results []models.SearchResult
	for _, m := range matches {
		result := si.buildTitleResult(m.notePath, m.title, prefix)
		result.Score = m.score
		results = append(results, result)
	}

	// If no results from index, fall back to scanning all notes from disk
	if len(results) == 0 {
		return si.searchTitleFromDisk(prefix)
	}

	return results, nil
}

// SearchSmart performs smart search: title matches first, content matches as fallback
func (si *SearchIndex) SearchSmart(query string) ([]models.SearchResult, error) {
	si.mu.RLock()
	defer si.mu.RUnlock()

	if query == "" {
		return []models.SearchResult{}, nil
	}

	// Step 1: Search titles (high priority)
	titleResults, _ := si.searchByTitleInternal(query)

	// Step 2: Search full content (fallback)
	contentResults, _ := si.searchInternal(query)

	// Step 3: Merge results, title matches first with boosted score
	seen := make(map[string]bool)
	var results []models.SearchResult

	// Add title matches first (already scored)
	for _, r := range titleResults {
		seen[r.Path] = true
		// Boost title matches by adding 50 to their score
		r.Score += 50.0
		results = append(results, r)
	}

	// Add content matches that weren't in title matches
	for _, r := range contentResults {
		if !seen[r.Path] {
			results = append(results, r)
		}
	}

	return results, nil
}

// searchByTitleInternal is the internal version without lock (caller holds lock)
func (si *SearchIndex) searchByTitleInternal(query string) ([]models.SearchResult, error) {
	if query == "" {
		return []models.SearchResult{}, nil
	}

	queryLower := strings.ToLower(query)
	queryTerms := tokenize(query)

	if len(queryTerms) == 0 {
		return si.searchTitleByPrefixInternal(queryLower)
	}

	type titleScore struct {
		notePath string
		title    string
		score    float64
	}
	var matches []titleScore
	matchedNotes := make(map[string]bool)

	candidates := si.findTitlesWithPrefix(queryTerms[0])

	for notePath, title := range candidates {
		if matchedNotes[notePath] {
			continue
		}

		if si.titleContainsTerms(title, queryTerms) {
			matchedNotes[notePath] = true
			score := si.calculateTitleScore(title, queryLower)
			matches = append(matches, titleScore{
				notePath: notePath,
				title:    title,
				score:    score,
			})
		}
	}

	sort.Slice(matches, func(i, j int) bool {
		return matches[i].score > matches[j].score
	})

	var results []models.SearchResult
	for _, m := range matches {
		result := si.buildTitleResult(m.notePath, m.title, query)
		result.Score = m.score
		results = append(results, result)
	}

	// If no results from index, fall back to scanning all notes from disk
	if len(results) == 0 {
		return si.searchTitleFromDisk(query)
	}

	return results, nil
}

// searchTitleByPrefixInternal is the internal version without lock
func (si *SearchIndex) searchTitleByPrefixInternal(prefix string) ([]models.SearchResult, error) {
	type titleScore struct {
		notePath string
		title    string
		score    float64
	}
	var matches []titleScore
	seen := make(map[string]bool)

	prefixLower := strings.ToLower(prefix)

	for term, entries := range si.titleIndex {
		if strings.HasPrefix(term, prefixLower) {
			for e := entries.Front(); e != nil; e = e.Next() {
				entry := e.Value.(TitleEntry)
				if seen[entry.NotePath] {
					continue
				}
				seen[entry.NotePath] = true

				score := si.calculateTitleScore(entry.Title, prefixLower)
				matches = append(matches, titleScore{
					notePath: entry.NotePath,
					title:    entry.Title,
					score:    score,
				})
			}
		}
	}

	sort.Slice(matches, func(i, j int) bool {
		return matches[i].score > matches[j].score
	})

	var results []models.SearchResult
	for _, m := range matches {
		result := si.buildTitleResult(m.notePath, m.title, prefix)
		result.Score = m.score
		results = append(results, result)
	}

	// If no results from index, fall back to scanning all notes from disk
	if len(results) == 0 {
		return si.searchTitleFromDisk(prefix)
	}

	return results, nil
}

// searchInternal is the internal version of Search without lock (caller holds lock)
func (si *SearchIndex) searchInternal(query string) ([]models.SearchResult, error) {
	if query == "" {
		return []models.SearchResult{}, nil
	}

	if cjkRegex.MatchString(query) {
		return si.searchCJKInternal(query)
	}

	terms := tokenize(query)
	if len(terms) == 0 {
		return []models.SearchResult{}, nil
	}

	var results []models.SearchResult
	matchedNotes := make(map[string]bool)

	firstTerm := terms[0]
	candidateNotes := si.findNotesWithPrefix(firstTerm)

	if len(candidateNotes) == 0 {
		return []models.SearchResult{}, nil
	}

	for notePath := range candidateNotes {
		if matchedNotes[notePath] {
			continue
		}

		if si.noteContainsTermsWithPrefix(notePath, terms) {
			matchedNotes[notePath] = true

			content, err := si.noteService.GetNoteContent(notePath)
			if err != nil {
				continue
			}

			result := si.buildSearchResult(notePath, content, query)
			results = append(results, result)
		}
	}

	if len(results) == 0 {
		return si.searchFromDisk(query)
	}

	return results, nil
}

// searchCJKInternal is the internal version of searchCJK without lock
func (si *SearchIndex) searchCJKInternal(query string) ([]models.SearchResult, error) {
	var results []models.SearchResult
	matchedNotes := make(map[string]bool)

	notePaths := make(map[string]bool)
	for _, entries := range si.index {
		for e := entries.Front(); e != nil; e = e.Next() {
			entry := e.Value.(IndexEntry)
			notePaths[entry.NotePath] = true
		}
	}

	pattern, err := regexp.Compile(regexp.QuoteMeta(query))
	if err != nil {
		return nil, err
	}

	for notePath := range notePaths {
		if matchedNotes[notePath] {
			continue
		}

		content, err := si.noteService.GetNoteContent(notePath)
		if err != nil {
			continue
		}

		if pattern.MatchString(content) {
			matchedNotes[notePath] = true
			result := si.buildSearchResult(notePath, content, query)
			results = append(results, result)
		}
	}

	if len(results) == 0 {
		return si.searchCJKFromDisk(query, pattern)
	}

	return results, nil
}

// buildTitleResult builds a search result for title-only matches
func (si *SearchIndex) buildTitleResult(notePath string, title string, query string) models.SearchResult {
	folder := filepath.Dir(notePath)
	if folder == "." {
		folder = ""
	}

	fileType := getFileType(notePath)

	// Create a match context showing the title is matched
	context := title
	if query != "" {
		// Highlight the query in the title
		escapedQuery := regexp.QuoteMeta(query)
		pattern := regexp.MustCompile("(?i)" + escapedQuery)
		context = pattern.ReplaceAllString(title, "<mark class=\"search-highlight\">$0</mark>")
	}

	return models.SearchResult{
		Name:   title,
		Path:   notePath,
		Folder: folder,
		Type:   fileType,
		Matches: []models.MatchContext{
			{
				LineNumber: 1,
				Context:    context,
			},
		},
	}
}

// searchCJK performs search for CJK queries using phrase matching
func (si *SearchIndex) searchCJK(query string) ([]models.SearchResult, error) {
	var results []models.SearchResult
	matchedNotes := make(map[string]bool)

	// Get all unique note paths from the index
	notePaths := make(map[string]bool)
	for _, entries := range si.index {
		for e := entries.Front(); e != nil; e = e.Next() {
			entry := e.Value.(IndexEntry)
			notePaths[entry.NotePath] = true
		}
	}

	// Build regex pattern for phrase matching (no case-insensitive flag for CJK)
	// CJK characters don't have case, so (?i) is not needed
	pattern, err := regexp.Compile(regexp.QuoteMeta(query))
	if err != nil {
		return nil, err
	}

	// First, search indexed notes
	for notePath := range notePaths {
		if matchedNotes[notePath] {
			continue
		}

		content, err := si.noteService.GetNoteContent(notePath)
		if err != nil {
			continue
		}

		if pattern.MatchString(content) {
			matchedNotes[notePath] = true
			result := si.buildSearchResult(notePath, content, query)
			results = append(results, result)
		}
	}

	// If no results from index, fall back to scanning all notes from disk
	// This handles cases where the index might not be fully up-to-date
	if len(results) == 0 {
		return si.searchCJKFromDisk(query, pattern)
	}

	return results, nil
}

// searchCJKFromDisk searches for CJK queries by scanning all notes from disk
func (si *SearchIndex) searchCJKFromDisk(query string, pattern *regexp.Regexp) ([]models.SearchResult, error) {
	var results []models.SearchResult
	matchedNotes := make(map[string]bool)

	// Use NoteService to scan all notes
	notes, _, err := si.noteService.ScanNotes(false)
	if err != nil {
		return nil, err
	}

	for _, note := range notes {
		if matchedNotes[note.Path] {
			continue
		}

		content, err := si.noteService.GetNoteContent(note.Path)
		if err != nil {
			continue
		}

		if pattern.MatchString(content) {
			matchedNotes[note.Path] = true
			result := si.buildSearchResult(note.Path, content, query)
			results = append(results, result)
		}
	}

	return results, nil
}

// buildSearchResult builds a search result with context
func (si *SearchIndex) buildSearchResult(notePath string, content string, query string) models.SearchResult {
	// Escape query for regex
	escapedQuery := regexp.QuoteMeta(query)
	pattern := regexp.MustCompile("(?i)" + escapedQuery)

	matches := pattern.FindAllStringIndex(content, -1)

	var matchedLines []models.MatchContext
	for i, match := range matches {
		if i >= 3 { // Limit to 3 matches per file
			break
		}

		startIndex := match[0]
		endIndex := match[1]

		// Create context window: ±50 characters
		contextStart := startIndex - 50
		if contextStart < 0 {
			contextStart = 0
		}
		contextEnd := endIndex + 50
		if contextEnd > len(content) {
			contextEnd = len(content)
		}

		// Extract context
		context := content[contextStart:contextEnd]
		context = strings.ReplaceAll(context, "\n", " ")

		// Calculate line number
		lineNumber := strings.Count(content[:startIndex], "\n") + 1

		matchedLines = append(matchedLines, models.MatchContext{
			LineNumber: lineNumber,
			Context:    context,
		})
	}

	// Extract the actual title from content
	title := extractTitle(content, notePath)
	folder := filepath.Dir(notePath)
	if folder == "." {
		folder = ""
	}

	// Determine file type based on extension
	fileType := getFileType(notePath)

	return models.SearchResult{
		Name:    title,
		Path:    notePath,
		Folder:  folder,
		Type:    fileType,
		Matches: matchedLines,
	}
}

// getFileType determines the file type based on extension
func getFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".md":
		return "note"
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp":
		return "image"
	case ".mp3", ".wav", ".ogg", ".m4a", ".flac":
		return "audio"
	case ".mp4", ".webm", ".mov", ".avi", ".mkv":
		return "video"
	case ".pdf":
		return "document"
	default:
		return "note" // Default to note
	}
}

// GetIndexedTerms returns all indexed terms (for debugging)
func (si *SearchIndex) GetIndexedTerms() []string {
	si.mu.RLock()
	defer si.mu.RUnlock()

	terms := make([]string, 0, len(si.index))
	for term := range si.index {
		terms = append(terms, term)
	}
	return terms
}

// GetIndexSize returns the number of unique terms in the index
func (si *SearchIndex) GetIndexSize() int {
	si.mu.RLock()
	defer si.mu.RUnlock()

	return len(si.index)
}

// extractTitle extracts the title from note content or derives it from the filename
func extractTitle(content string, notePath string) string {
	// Try to extract title from frontmatter
	lines := strings.SplitN(content, "\n", 30) // Check first 30 lines for frontmatter
	inFrontmatter := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" {
			if !inFrontmatter {
				inFrontmatter = true
				continue
			}
			break
		}
		if inFrontmatter && strings.HasPrefix(trimmed, "title:") {
			title := strings.TrimPrefix(trimmed, "title:")
			title = strings.TrimSpace(title)
			// Remove quotes if present
			title = strings.Trim(title, "\"'")
			if title != "" {
				return title
			}
		}
	}

	// Fallback: use first non-empty, non-frontmatter line
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || trimmed == "---" || strings.HasPrefix(trimmed, "#") && strings.HasPrefix(trimmed, "##") {
			continue
		}
		// If it's a level-1 heading, use it as title
		if strings.HasPrefix(trimmed, "# ") {
			return strings.TrimPrefix(trimmed, "# ")
		}
		if trimmed != "---" {
			// Return first meaningful line (truncated)
			if len(trimmed) > 100 {
				return trimmed[:100]
			}
			return trimmed
		}
	}

	// Last fallback: derive from filename
	name := filepath.Base(notePath)
	name = strings.TrimSuffix(name, filepath.Ext(name))
	// Replace hyphens/underscores with spaces
	name = strings.ReplaceAll(name, "-", " ")
	name = strings.ReplaceAll(name, "_", " ")
	return name
}

// tokenize splits text into terms, supporting both ASCII and CJK characters
func tokenize(text string) []string {
	// Convert to lowercase for ASCII characters
	text = strings.ToLower(text)

	// Build terms list
	termMap := make(map[string]bool)
	var terms []string

	// Extract ASCII words (alphanumeric sequences)
	asciiWordRE := regexp.MustCompile(`[a-z0-9]+`)
	asciiWords := asciiWordRE.FindAllString(text, -1)
	for _, word := range asciiWords {
		if len(word) >= 2 {
			if !termMap[word] {
				termMap[word] = true
				terms = append(terms, word)
			}
		}
	}

	// Extract CJK characters (Chinese, Japanese, Korean) as individual terms
	// CJK Unified Ideographs range: U+4E00 to U+9FFF
	// CJK Unified Ideographs Extension A: U+3400 to U+4DBF
	// CJK Compatibility Ideographs: U+F900 to U+FAFF
	cjkChars := cjkRegex.FindAllString(text, -1)
	for _, char := range cjkChars {
		if !termMap[char] {
			termMap[char] = true
			terms = append(terms, char)
		}
	}

	// Also extract CJK word sequences (consecutive CJK characters as phrases)
	cjkWordRE := regexp.MustCompile(`[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}]+`)
	cjkWords := cjkWordRE.FindAllString(text, -1)
	for _, word := range cjkWords {
		if len(word) >= 2 && !termMap[word] {
			termMap[word] = true
			terms = append(terms, word)
		}
	}

	return terms
}
