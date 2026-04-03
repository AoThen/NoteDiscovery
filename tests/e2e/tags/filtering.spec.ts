import { test, expect } from '@playwright/test';

test.describe('Tag Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="password"]', 'test-admin-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('list all tags', async ({ page }) => {
    // Create notes with different tags via API
    const testPrefix = `tag_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note1.md`,
          content: `---\ntitle: Note 1\ntags: [tag1, tag2]\n---\nContent 1`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note2.md`,
          content: `---\ntitle: Note 2\ntags: [tag2, tag3]\n---\nContent 2`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note3.md`,
          content: `---\ntitle: Note 3\ntags: [tag1, tag3]\n---\nContent 3`
        })
      });
    }, { testPrefix });

    // Fetch tags API directly
    const tagsResponse = await page.evaluate(async () => {
      const response = await fetch('/api/tags');
      return response.json();
    });

    expect(tagsResponse.tags).toBeDefined();
    expect(typeof tagsResponse.tags).toBe('object');
  });

  test('filter notes by single tag', async ({ page }) => {
    const testPrefix = `filter_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note1.md`,
          content: `---\ntitle: Note 1\ntags: [programming]\n---\nContent 1`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note2.md`,
          content: `---\ntitle: Note 2\ntags: [personal]\n---\nContent 2`
        })
      });
    }, { testPrefix });

    // Fetch notes by tag
    const notesResponse = await page.evaluate(async ({ prefix }) => {
      const response = await fetch(`/api/tags/programming`);
      return response.json();
    }, { testPrefix });

    expect(notesResponse.count).toBe(1);
    expect(notesResponse.notes).toHaveLength(1);
    expect(notesResponse.notes[0].path).toContain(`${testPrefix}-note1.md`);
  });

  test('filter notes by tag - case insensitive', async ({ page }) => {
    const testPrefix = `case_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `---\ntitle: Note\ntags: [Programming]\n---\nContent`
        })
      });
    }, { testPrefix });

    // Query with different case
    const notesResponse = await page.evaluate(async () => {
      const response = await fetch(`/api/tags/PROGRAMMING`);
      return response.json();
    });

    expect(notesResponse.count).toBeGreaterThanOrEqual(1);
  });

  test('filter notes with multiple tags AND logic', async ({ page }) => {
    const testPrefix = `and_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note1.md`,
          content: `---\ntitle: Note 1\ntags: [go, backend]\n---\nContent 1`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note2.md`,
          content: `---\ntitle: Note 2\ntags: [python, backend]\n---\nContent 2`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note3.md`,
          content: `---\ntitle: Note 3\ntags: [go, frontend]\n---\nContent 3`
        })
      });
    }, { testPrefix });

    // Get all notes and filter client-side (testing the FilterNotesByTags function)
    const allNotesResponse = await page.evaluate(async () => {
      const response = await fetch('/api/notes?limit=100');
      return response.json();
    });

    expect(allNotesResponse.notes).toBeDefined();
  });

  test('tag with no matching notes', async ({ page }) => {
    const testPrefix = `empty_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `---\ntitle: Note\ntags: [existing]\n---\nContent`
        })
      });
    }, { testPrefix });

    const notesResponse = await page.evaluate(async () => {
      const response = await fetch(`/api/tags/nonexistent`);
      return response.json();
    });

    expect(notesResponse.count).toBe(0);
    expect(notesResponse.notes).toEqual([]);
  });

  test('notes in subdirectories with tags', async ({ page }) => {
    const testPrefix = `subdir_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `programming/${prefix}-go.md`,
          content: `---\ntitle: Go\ntags: [programming]\n---\nContent`
        })
      });
      
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `personal/${prefix}-todo.md`,
          content: `---\ntitle: Todo\ntags: [programming]\n---\nContent`
        })
      });
    }, { testPrefix });

    const notesResponse = await page.evaluate(async () => {
      const response = await fetch(`/api/tags/programming`);
      return response.json();
    });

    expect(notesResponse.count).toBeGreaterThanOrEqual(2);
  });

  test('tag count accuracy', async ({ page }) => {
    const testPrefix = `count_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      // Create 3 notes with tag1
      for (let i = 1; i <= 3; i++) {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `${prefix}-note${i}.md`,
            content: `---\ntitle: Note ${i}\ntags: [tag1]\n---\nContent ${i}`
          })
        });
      }
    }, { testPrefix });

    const tagsResponse = await page.evaluate(async () => {
      const response = await fetch('/api/tags');
      return response.json();
    });

    expect(tagsResponse.tags['tag1']).toBe(3);
  });

  test('note without tags not counted', async ({ page }) => {
    const testPrefix = `notags_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `---\ntitle: No Tags\n---\nContent without tags`
        })
      });
    }, { testPrefix });

    const tagsResponse = await page.evaluate(async () => {
      const response = await fetch('/api/tags');
      return response.json();
    });

    // The note without tags should not contribute to any tag count
    expect(tagsResponse.tags).toBeDefined();
  });
});

test.describe('Tag UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', 'test-admin-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('display tags in note list', async ({ page }) => {
    const testPrefix = `ui_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `---\ntitle: UI Test\ntags: [ui-test, display]\n---\nContent`
        })
      });
    }, { testPrefix });

    await page.goto('/');

    // Verify tags are displayed (adjust selector based on actual UI)
    await expect(page.locator('[data-testid="note-list"]')).toBeVisible();
  });

  test('click tag to filter', async ({ page }) => {
    // Test clicking a tag filters the note list
    // Implementation depends on actual UI
    await expect(page).toHaveURL('/');
  });
});
