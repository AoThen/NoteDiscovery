package services

import (
	"container/list"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"gonote/internal/models"
)

// SearchIndex provides fast full-text search using inverted index
// Uses double-buffering for non-blocking index rebuilds
type SearchIndex struct {
	mu            sync.RWMutex
	index         map[string]*list.List // term -> list of IndexEntry
	notesDir      string
	cache         *Cache
	noteService   *NoteService   // Shared NoteService for reusing cache
	searchService *SearchService // SearchService for disk-scan fallback
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
		if err := si.indexNoteTo(note.Path, newIndex); err != nil {
			// Log error but continue indexing other notes
			continue
		}
	}

	// Phase 2: Swap index atomically with brief write lock
	si.mu.Lock()
	si.index = newIndex
	si.mu.Unlock()

	return nil
}

// indexNoteTo indexes a single note into the provided index map
func (si *SearchIndex) indexNoteTo(notePath string, index map[string]*list.List) error {
	fullPath := filepath.Join(si.notesDir, notePath)
	content, err := readFileContent(fullPath)
	if err != nil {
		return err
	}

	// Tokenize content
	terms := tokenize(content)

	// Add each term to index
	for pos, term := range terms {
		if _, ok := index[term]; !ok {
			index[term] = list.New()
		}
		index[term].PushBack(IndexEntry{
			NotePath: notePath,
			Position: pos,
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

	// Tokenize content
	terms := tokenize(content)

	// Add each term to index
	for pos, term := range terms {
		if _, ok := si.index[term]; !ok {
			si.index[term] = list.New()
		}
		si.index[term].PushBack(IndexEntry{
			NotePath: notePath,
			Position: pos,
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
	cjkRE := regexp.MustCompile(`[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}]`)
	if cjkRE.MatchString(query) {
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

	// Extract note name from path
	name := strings.TrimSuffix(filepath.Base(notePath), ".md")
	folder := filepath.Dir(notePath)
	if folder == "." {
		folder = ""
	}

	// Determine file type based on extension
	fileType := getFileType(notePath)

	return models.SearchResult{
		Name:    name,
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
	cjkRE := regexp.MustCompile(`[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}]`)
	cjkChars := cjkRE.FindAllString(text, -1)
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
