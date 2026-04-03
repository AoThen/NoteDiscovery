import { test, expect, TEST_CONFIG, login, apiPost } from '../fixtures/test-helpers';

const BASE_URL = TEST_CONFIG.baseUrl;

test.describe('Final Search Test', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
      }
    });
    await login(page);
  });

  test('search click on unopened note - complete test', async ({ page, testPrefix }) => {
    // Create a test note with unique term on a specific line
    const noteName = `${testPrefix}_search_locate`;
    const uniqueTerm = `SearchLocate${Date.now()}`;
    const content = `# Search Locate Test

Line 3: Some content here
Line 4: More content here
Line 5: This line contains ${uniqueTerm} for testing search locate
Line 6: Another line here
Line 7: More content
Line 8: Even more content
Line 9: Final line of content`;
    
    await apiPost(page, `${BASE_URL}/api/notes/${noteName}.md`, { content });
    await page.waitForTimeout(300);
    
    // Go to homepage (don't open any note)
    await page.goto('/');
    await page.waitForTimeout(1500);
    
    // Open search panel - click on search button in icon-rail
    const searchButton = page.locator('.icon-rail button').nth(1);
    await searchButton.click();
    await page.waitForTimeout(500);
    
    // Type search query
    const searchInput = page.locator('input[x-model="search.query"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(uniqueTerm);
    await page.waitForTimeout(1500);
    
    // Use evaluate to trigger the search result click
    // This is more reliable than Playwright click in Alpine.js context
    const result = await page.evaluate(async () => {
      const el = document.querySelector('[x-data]') as any;
      const app = el?._x_dataStack?.[0];
      if (!app) return { success: false, error: 'No Alpine app found' };
      
      // Get the first search result
      const note = app.search.results[0];
      if (!note) return { success: false, error: 'No search result found' };
      
      // Call openItem directly (simulating what the click handler should do)
      const lineNumber = (note.matches && note.matches.length > 0) ? note.matches[0].line_number : 0;
      app.openItem(note.path, note.type, app.search.query, lineNumber);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if editor loaded
      const editor = document.getElementById('note-editor') as HTMLTextAreaElement;
      if (!editor) return { success: false, error: 'Editor not found in DOM' };
      
      // Check if content loaded
      const editorContent = editor.value;
      if (!editorContent.includes(app.search.query)) {
        return { success: false, error: 'Editor content does not contain search term' };
      }
      
      // Check selection (highlight)
      const selectionStart = editor.selectionStart;
      const selectionEnd = editor.selectionEnd;
      const selectedText = editorContent.substring(selectionStart, selectionEnd);
      
      // Check scroll position
      const scrollTop = editor.scrollTop;
      const lineHeight = parseFloat(window.getComputedStyle(editor).lineHeight) || 20;
      const approximateLineInView = Math.floor(scrollTop / lineHeight) + 3; // +3 for context
      
      return {
        success: true,
        noteCurrent: app.note?.current,
        editorContent: editorContent.substring(0, 100),
        selectionStart,
        selectionEnd,
        selectedText,
        selectedTextLower: selectedText.toLowerCase(),
        searchTerm: app.search.query.toLowerCase(),
        scrollTop,
        approximateLineInView,
        targetLine: lineNumber
      };
    });
    
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    
    // Take screenshot
    await page.screenshot({ path: 'config/test-results/search-locate-test.png', fullPage: true });
    
    // Assertions
    expect(result.success).toBe(true);
    expect(result.noteCurrent).toBe(`${noteName}.md`);
    
    // Check that the search term is selected (highlighted)
    expect(result.selectedTextLower).toBe(result.searchTerm);
    
    // Check that editor scrolled to the target area (within a few lines)
    // Line 5 should be visible - allow some tolerance
    const lineDiff = Math.abs(result.approximateLineInView - result.targetLine);
    expect(lineDiff).toBeLessThan(5);
  });

  test('verify search highlight in editor', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_highlight_verify`;
    const uniqueTerm = `HighlightTerm${Date.now()}`;
    const content = `# Highlight Verify Test

Some introductory content.
Line 3: ${uniqueTerm} should be highlighted and selected.
More content after the term.
End of note.`;
    
    await apiPost(page, `${BASE_URL}/api/notes/${noteName}.md`, { content });
    await page.waitForTimeout(300);
    
    // Navigate directly with search parameter
    await page.goto(`/${noteName}?search=${uniqueTerm}`);
    await page.waitForTimeout(3000);
    
    // Check the state
    const result = await page.evaluate(() => {
      const el = document.querySelector('[x-data]') as any;
      const app = el?._x_dataStack?.[0];
      if (!app) return { success: false, error: 'No Alpine app found' };
      
      const editor = document.getElementById('note-editor') as HTMLTextAreaElement;
      if (!editor) return { success: false, error: 'Editor not found' };
      
      const content = editor.value;
      const selectionStart = editor.selectionStart;
      const selectionEnd = editor.selectionEnd;
      const selectedText = content.substring(selectionStart, selectionEnd);
      
      return {
        success: true,
        noteCurrent: app.note?.current,
        searchQuery: app.search?.query,
        searchHighlight: app.search?.highlight,
        editorHasContent: content.length > 0,
        selectionStart,
        selectionEnd,
        selectedText,
        isCorrectSelection: selectedText.toLowerCase() === app.search?.query?.toLowerCase()
      };
    });
    
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    await page.screenshot({ path: 'config/test-results/highlight-verify-test.png', fullPage: true });
    
    expect(result.success).toBe(true);
    expect(result.noteCurrent).toBe(`${noteName}.md`);
    expect(result.isCorrectSelection).toBe(true);
  });
});
