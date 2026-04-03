import { test as base, expect, Page, BrowserContext, APIRequestContext } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:9000',
  testPassword: 'test-admin-password',
  autosaveDelay: 800,
  searchDebounceDelay: 400,
  cacheTtl: 3000,
  defaultTimeout: 10000,
  shortTimeout: 3000,
};

function generateUniqueTestPrefix(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

// --- CSRF Helpers ---

async function getCsrfToken(page: Page): Promise<string | null> {
  const context = page.context();
  const cookies = await context.cookies();
  const csrfCookie = cookies.find(c => c.name === 'csrf_');
  return csrfCookie?.value || null;
}

async function ensureCsrfToken(page: Page): Promise<string> {
  let csrfToken = await getCsrfToken(page);
  if (!csrfToken) {
    await page.goto('/');
    await page.waitForTimeout(200);
    csrfToken = await getCsrfToken(page);
  }
  return csrfToken || '';
}

async function apiRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options?: { data?: any, headers?: Record<string, string> }
): Promise<Response> {
  const csrfToken = await getCsrfToken(page);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }
  const response = await page.request.fetch(url, {
    method,
    headers,
    data: options?.data ? JSON.stringify(options.data) : undefined,
  });
  return response as any;
}

async function apiPost(page: Page, url: string, data?: any): Promise<any> {
  const context = page.context();
  const csrfToken = await ensureCsrfToken(page);
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
  };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  return context.request.post(url, {
    headers,
    data: data ? JSON.stringify(data) : undefined,
  });
}

async function apiDelete(page: Page, url: string): Promise<any> {
  const context = page.context();
  const csrfToken = await ensureCsrfToken(page);
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const headers: Record<string, string> = {
    'Cookie': cookieHeader,
  };
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  return context.request.delete(url, { headers });
}

// --- Event-Driven Wait Functions ---

/**
 * Wait for note autosave to complete by intercepting the API response.
 * Falls back to a short timeout if no API call is detected.
 */
async function waitForAutosave(page: Page): Promise<void> {
  try {
    await page.waitForResponse(
      resp => resp.url().includes('/api/notes/') && (resp.status() === 200 || resp.status() === 201),
      { timeout: 3000 }
    );
  } catch {
    // Fallback: no API call detected, wait briefly
    await page.waitForTimeout(300);
  }
}

/**
 * Wait for search debounce and results to load.
 */
async function waitForSearchDebounce(page: Page): Promise<void> {
  await page.waitForTimeout(TEST_CONFIG.searchDebounceDelay);
}

/**
 * Wait for search index to update after creating/editing a note.
 * Uses a page reload with dom ready as the index trigger.
 */
async function waitForSearchIndex(page: Page): Promise<void> {
  try {
    await page.reload({ waitUntil: 'dom', timeout: 5000 });
  } catch {
    await page.waitForTimeout(500);
  }
}

/**
 * Wait for cache TTL to expire.
 */
async function waitForCacheExpiry(page: Page): Promise<void> {
  await page.waitForTimeout(TEST_CONFIG.cacheTtl);
}

/**
 * Wait for page to be fully loaded with Alpine.js initialized.
 * Replaces: goto + waitForTimeout(1000-2000)
 */
async function waitForPageReady(page: Page, timeout?: number): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[x-data]', { timeout: timeout || TEST_CONFIG.defaultTimeout });
  await page.waitForTimeout(200);
}

/**
 * Wait for a specific note to appear in the sidebar/note list.
 * Replaces: create note + waitForTimeout(2000) + reload
 */
async function waitForNoteInSidebar(page: Page, noteName: string, timeout?: number): Promise<void> {
  const noteItem = page.locator(`text="${noteName}"`).first();
  await noteItem.waitFor({ state: 'visible', timeout: timeout || TEST_CONFIG.defaultTimeout });
}

/**
 * Wait for editor to load with expected content after navigating to a note.
 */
async function waitForEditorLoaded(page: Page, expectedContent?: string, timeout?: number): Promise<void> {
  const editor = page.locator('#note-editor').first();
  await editor.waitFor({ state: 'visible', timeout: timeout || TEST_CONFIG.defaultTimeout });
  if (expectedContent) {
    const escaped = expectedContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(editor).toHaveValue(new RegExp(escaped), { timeout: timeout || TEST_CONFIG.defaultTimeout });
  }
}

// --- Navigation Helpers ---

async function login(page: Page, password: string = TEST_CONFIG.testPassword): Promise<void> {
  await page.goto('/login');
  const passwordInput = page.locator('input[type="password"]');
  const isAuthEnabled = await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (!isAuthEnabled) {
    await page.goto('/');
    await page.waitForSelector('#app, [x-data]', { timeout: TEST_CONFIG.defaultTimeout });
    return;
  }

  await passwordInput.fill(password);
  await page.click('button[type="submit"]');

  await Promise.race([
    page.waitForURL('**/', { timeout: 30000 }),
    page.waitForSelector('#app', { timeout: 30000 }),
    page.waitForSelector('[x-data]', { timeout: 30000 })
  ]);

  await page.waitForTimeout(200);
}

async function logout(page: Page): Promise<void> {
  await page.goto('/logout');
  await Promise.race([
    page.waitForURL('**/login', { timeout: 5000 }).catch(() => {}),
    page.waitForURL('**/', { timeout: 5000 }).catch(() => {})
  ]);
}

// --- CRUD Helpers ---

async function createNote(page: Page, name: string, content: string = ''): Promise<void> {
  const newButton = page.locator('button:has-text("New"), [data-testid="new-note-btn"]').first();
  await newButton.click();

  const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[name="noteName"]').first();
  await nameInput.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
  await nameInput.fill(name);
  await nameInput.press('Enter');

  await page.waitForSelector('textarea#note-editor, .editor textarea, [data-testid="note-editor"]', {
    timeout: TEST_CONFIG.defaultTimeout
  });

  if (content) {
    const editor = page.locator('textarea#note-editor, .editor textarea, [data-testid="note-editor"]').first();
    await editor.fill(content);
    await waitForAutosave(page);
  }
}

async function deleteNote(page: Page, noteName: string): Promise<void> {
  const noteItem = page.locator(`text="${noteName}"`).first();
  await noteItem.click({ button: 'right' });

  const deleteOption = page.locator('text=Delete, [data-testid="delete-note"]').first();
  await deleteOption.click();

  const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }

  await page.waitForTimeout(200);
}

async function createFolder(page: Page, name: string, parentFolder?: string): Promise<void> {
  if (parentFolder) {
    const parent = page.locator(`text="${parentFolder}"`).first();
    await parent.click({ button: 'right' });
  } else {
    const newDropdown = page.locator('button:has-text("New")').first();
    await newDropdown.click();
  }

  const newFolderOption = page.locator('text=New Folder, [data-testid="new-folder"]').first();
  await newFolderOption.click();

  const nameInput = page.locator('input[placeholder*="folder"], input[placeholder*="Folder"]').first();
  await nameInput.waitFor({ state: 'visible', timeout: TEST_CONFIG.defaultTimeout });
  await nameInput.fill(name);
  await nameInput.press('Enter');

  await page.waitForTimeout(200);
}

async function deleteFolder(page: Page, folderName: string): Promise<void> {
  const folderItem = page.locator(`text="${folderName}"`).first();
  await folderItem.click({ button: 'right' });

  const deleteOption = page.locator('text=Delete, [data-testid="delete-folder"]').first();
  await deleteOption.click();

  const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }

  await page.waitForTimeout(200);
}

// --- Test Fixtures ---

type TestFixtures = {
  authenticatedPage: Page;
  testPrefix: string;
};

export const test = base.extend<TestFixtures>({
  testPrefix: async ({}, use) => {
    const prefix = generateUniqueTestPrefix();
    await use(prefix);
  },

  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
    await logout(page);
  },
});

// --- Per-test cleanup hook: call this in afterEach to cleanup test data ---

async function cleanupTestData(baseUrl: string, testPrefix: string): Promise<void> {
  try {
    const timeout = setTimeout(() => {
      console.warn(' Cleanup timeout reached');
    }, 10000);

    // Cleanup via API: list all notes and delete those matching test prefix
    // This is best-effort and non-blocking
    const response = await fetch(`${baseUrl}/api/notes`);
    if (response.ok) {
      const notes: Array<{ path: string }> = await response.json();
      for (const note of notes) {
        if (note.path && note.path.includes(testPrefix)) {
          try {
            await fetch(`${baseUrl}/api/notes/${encodeURIComponent(note.path)}`, {
              method: 'DELETE',
            });
          } catch {
            // Ignore individual delete failures
          }
        }
      }
    }

    clearTimeout(timeout);
  } catch {
    // Ignore cleanup failures to not break test reporting
  }
}

/**
 * Cleanup test data matching the given prefix.
 * Usage in test files: afterEach(async ({ testPrefix }) => { await cleanupTest(testPrefix); });
 */
async function cleanupTest(testPrefix: string): Promise<void> {
  await cleanupTestData(TEST_CONFIG.baseUrl, testPrefix);
}

export {
  expect,
  TEST_CONFIG,
  generateUniqueTestPrefix,
  waitForAutosave,
  waitForSearchDebounce,
  waitForCacheExpiry,
  waitForSearchIndex,
  waitForPageReady,
  waitForNoteInSidebar,
  waitForEditorLoaded,
  login,
  logout,
  createNote,
  deleteNote,
  createFolder,
  deleteFolder,
  getCsrfToken,
  ensureCsrfToken,
  apiRequest,
  apiPost,
  apiDelete,
  cleanupTest,
};
