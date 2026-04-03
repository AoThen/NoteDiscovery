import { test, expect, TEST_CONFIG, login, waitForAutosave } from '../fixtures/test-helpers';

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('create share link for export', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_export_test`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    await editor.fill('# Export Test\n\nThis is content for export testing.\n\n```javascript\nconsole.log("Hello");\n```');
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const response = await page.request.post(`/api/share/${encodedPath}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.token).toBeTruthy();
    expect(data.url).toContain('/share/');
  });

  test('view shared note renders HTML', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_view_share`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    const uniqueContent = `# Shared Content ${Date.now()}\n\nThis is a shared paragraph.`;
    await editor.fill(uniqueContent);
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const shareResponse = await page.request.post(`/api/share/${encodedPath}`);
    const shareData = await shareResponse.json();
    
    const viewResponse = await page.request.get(shareData.url);
    expect(viewResponse.ok()).toBeTruthy();
    
    const html = await viewResponse.text();
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('shared note includes code highlighting', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_code_share`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    await editor.fill('# Code Test\n\n```python\ndef hello():\n    print("world")\n```');
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const shareResponse = await page.request.post(`/api/share/${encodedPath}`);
    const shareData = await shareResponse.json();
    
    const viewResponse = await page.request.get(shareData.url);
    expect(viewResponse.ok()).toBeTruthy();
    
    const html = await viewResponse.text();
    expect(html).toContain('highlight.js');
  });

  test('shared note includes MathJax for math rendering', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_math_share`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    await editor.fill('# Math Test\n\n$$E = mc^2$$');
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const shareResponse = await page.request.post(`/api/share/${encodedPath}`);
    const shareData = await shareResponse.json();
    
    const viewResponse = await page.request.get(shareData.url);
    expect(viewResponse.ok()).toBeTruthy();
    
    const html = await viewResponse.text();
    expect(html).toContain('MathJax');
  });

  test('revoke share link', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_revoke_share`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    await editor.fill('# Revoke Test\n\nContent to revoke.');
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const shareResponse = await page.request.post(`/api/share/${encodedPath}`);
    expect(shareResponse.ok()).toBeTruthy();
    
    const revokeResponse = await page.request.delete(`/api/share/${encodedPath}`);
    expect(revokeResponse.ok()).toBeTruthy();
    
    const statusResponse = await page.request.get(`/api/share/${encodedPath}`);
    const statusData = await statusResponse.json();
    expect(statusData.shared).toBeFalsy();
  });

  test('share with dark theme', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_dark_share`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });
    await page.waitForTimeout(1500);
    
    const editor = page.locator('#note-editor').first();
    await editor.fill('# Dark Theme Test\n\nContent with dark theme.');
    await waitForAutosave(page);
    
    const notePath = `${noteName}.md`;
    const encodedPath = encodeURIComponent(notePath);
    
    const shareResponse = await page.request.post(`/api/share/${encodedPath}?theme=dark`);
    expect(shareResponse.ok()).toBeTruthy();
    
    const shareData = await shareResponse.json();
    expect(shareData.theme).toBe('dark');
  });
});
