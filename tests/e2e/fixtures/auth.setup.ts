import { test as setup, expect } from '@playwright/test';
import { login, TEST_CONFIG } from './test-helpers';

const authFile = 'tests/fixtures/.auth/user.json';

setup('authenticate as user', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form
  await page.waitForSelector('input[type="password"]', { timeout: TEST_CONFIG.defaultTimeout });
  
  // Login with test password
  await login(page, TEST_CONFIG.testPassword);
  
  // Wait for successful authentication
  await page.waitForURL('**/', { timeout: 30000 });
  await page.waitForSelector('#app', { timeout: 5000 });
  
  // Ensure UI is ready
  await page.waitForTimeout(1000);
  
  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
