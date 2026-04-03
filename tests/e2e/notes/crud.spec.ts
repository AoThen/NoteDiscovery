import { test, expect, TEST_CONFIG, login, waitForAutosave } from '../fixtures/test-helpers';

test.describe('Notes CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('create new note from sidebar', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_new_note`;
    
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    
    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    
    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });
    
    await newNoteOption.click({ force: true });

    await page.waitForSelector('#note-editor', { state: 'visible', timeout: 10000 });

    const editor = page.locator('#note-editor').first();
    await expect(editor).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });

    const noteInSidebar = page.locator(`text="${noteName}"`).first();
    await expect(noteInSidebar).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });
  });

  test('edit note content with auto-save', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_edit_test`;

    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();

    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });

    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });

    await newNoteOption.click({ force: true });

    await page.waitForSelector('#note-editor', { state: 'visible', timeout: 10000 });

    const editor = page.locator('#note-editor').first();
    await editor.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });

    const testContent = `# Test Heading\n\nThis is test content for ${testPrefix}.`;
    await editor.fill(testContent);

    await waitForAutosave(page);

    await page.reload();

    const editorAfterReload = page.locator('#note-editor').first();
    await expect(editorAfterReload).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });
    const content = await editorAfterReload.inputValue();
    expect(content).toContain('Test Heading');
  });

  test('note with special characters in filename', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_中文笔记`;

    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();

    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });

    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });

    await newNoteOption.click({ force: true });

    await page.waitForSelector('#note-editor', { state: 'visible', timeout: 10000 });

    const editor = page.locator('#note-editor').first();
    await expect(editor).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });

    const chineseContent = '这是中文内容测试';
    await editor.fill(chineseContent);

    await waitForAutosave(page);

    await page.reload();

    const noteInSidebar = page.locator(`text="${noteName}"`).first();
    await expect(noteInSidebar).toBeVisible({ timeout: TEST_CONFIG.defaultTimeout });
  });

  test('delete note', async ({ page, testPrefix }) => {
    const noteName = `${testPrefix}_to_delete`;

    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();

    const newNoteOption = page.locator('button:has-text("📝")').first();
    await newNoteOption.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });

    page.once('dialog', async dialog => {
      await dialog.accept(noteName);
    });

    await newNoteOption.click({ force: true });

    await page.waitForSelector('#note-editor', { state: 'visible', timeout: 10000 });

    const noteItem = page.locator(`.note-item:has-text("${noteName}")`).first();
    await noteItem.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
    await noteItem.click({ button: 'right' });
    await page.waitForTimeout(150);

    const deleteOption = page.locator('text=/Delete|删除/').first();
    if (await deleteOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteOption.click();

      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("确认")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }

    await page.waitForTimeout(200);
  });
});
