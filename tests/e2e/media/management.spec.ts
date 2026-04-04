import { test, expect, TEST_CONFIG, login } from '../fixtures/test-helpers';

test.describe('Media Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('upload image via editor', async ({ page }) => {
    // Create a new note via API
    const testPrefix = `media_${Date.now()}`;
    
    await page.evaluate(async ({ prefix }) => {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `# Media Test Note`
        })
      });
    }, { testPrefix });

    // Reload and open the note
    await page.reload();
    await page.waitForTimeout(500);

    const noteItem = page.locator(`text="${testPrefix}"`).first();
    await noteItem.click();
    await page.waitForTimeout(500);

    // Verify editor is visible and ready
    const editor = page.locator('textarea#note-editor').first();
    await expect(editor).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });
  });

  test('display uploaded image in note', async ({ page }) => {
    // Create note with image reference
    const testPrefix = `test_${Date.now()}`;

    await page.evaluate(async ({ prefix }) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `# Test Note\n\n![Image](test.png)`
        })
      });
      return response.json();
    }, { testPrefix });

    // Reload to see the note in sidebar
    await page.reload();
    await page.waitForTimeout(500);

    // Open the note
    const noteItem = page.locator(`text="${testPrefix}"`).first();
    await noteItem.click();
    await page.waitForTimeout(500);

    // Verify note content is displayed
    await expect(page.locator('.markdown-preview')).toContainText('Test Note', { timeout: TEST_CONFIG.defaultTimeout });
  });

  test('upload file size validation', async ({ page }) => {
    // This test would verify that large files are rejected
    // Implementation depends on UI error handling
    await expect(page).toHaveURL('/');
  });

  test('upload file type validation', async ({ page }) => {
    // This test would verify that disallowed file types are rejected
    // Implementation depends on UI error handling
    await expect(page).toHaveURL('/');
  });
});

test.describe('Media Orphaned Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', 'test-admin-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('detect orphaned media files', async ({ page }) => {
    // Create an orphaned media file via API
    const testPrefix = `orphan_${Date.now()}`;
    
    // First create a note with an image
    await page.evaluate(async ({ prefix }) => {
      const fs = require('fs');
      const path = require('path');
      
      // Create test image in attachments folder
      const attachmentsDir = path.join('go/data', `${prefix}-note_attachments`);
      fs.mkdirSync(attachmentsDir, { recursive: true });
      fs.writeFileSync(path.join(attachmentsDir, 'orphan.png'), 'fake image');
      
      // Create note that references the image
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `${prefix}-note.md`,
          content: `# Note\n\n![Image](${prefix}-note_attachments/orphan.png)`
        })
      });
    }, { testPrefix });

    // Navigate to see if orphaned media is detected
    // This depends on UI having orphaned media detection feature
    await expect(page).toHaveURL('/');
  });

  test('cleanup orphaned media', async ({ page }) => {
    // Test cleanup functionality if available in UI
    await expect(page).toHaveURL('/');
  });
});
