import { test, expect } from '@playwright/test';

/**
 * DEV-070: RBAC for API Keys - VIEWER Cannot Access API Keys Page
 *
 * Expected Behavior:
 * - VIEWER should NOT see Developer menu in sidebar
 * - VIEWER cannot navigate to /dashboard/developer/api-keys
 * - VIEWER's API request to GET /developer/api-keys returns 403 Forbidden
 *
 * Rationale:
 * According to permission matrix, VIEWER role does NOT have any permissions
 * for "api-key" resource (no create, read, or revoke permissions defined)
 */
test.describe('DEV-070: VIEWER RBAC - Cannot Access API Keys', () => {
  test.beforeEach(async ({ page }) => {
    // Login as VIEWER user
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    await page.fill('input[name="email"]', 'e2e-viewer@pingtome.test');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Click login button
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('DEV-070-1: VIEWER should not see Developer menu in sidebar', async ({ page }) => {
    // Take screenshot of sidebar
    await page.screenshot({ path: 'test-results/dev-070-1-sidebar.png' });

    // Check if Developer menu is visible in sidebar
    const developerMenu = page.locator('text=Developer').first();
    const isDeveloperMenuVisible = await developerMenu.isVisible().catch(() => false);

    console.log('Developer menu visible:', isDeveloperMenuVisible);

    // VIEWER should NOT see Developer menu
    expect(isDeveloperMenuVisible).toBe(false);
  });

  test('DEV-070-2: VIEWER cannot navigate to /dashboard/developer/api-keys', async ({ page }) => {
    // Try to navigate directly to API Keys page
    await page.goto('http://localhost:3010/dashboard/developer/api-keys');
    await page.waitForLoadState('networkidle');

    // Check current URL - should not be on API Keys page
    const currentUrl = page.url();
    console.log('Current URL after navigation attempt:', currentUrl);

    // Either we get redirected or we see an access denied page
    const isOnApiKeysPage = currentUrl.includes('/dashboard/developer/api-keys');

    // Also check for any error or access denied message
    const accessDeniedText = page.locator('text=/Access Denied|Unauthorized|Permission Denied/i');
    const accessDeniedVisible = await accessDeniedText.isVisible().catch(() => false);

    // Either we're redirected away OR we see an error message
    if (isOnApiKeysPage) {
      console.log('Still on API Keys page, checking for error message');
      expect(accessDeniedVisible).toBe(true);
    } else {
      console.log('Redirected away from API Keys page');
      expect(isOnApiKeysPage).toBe(false);
    }

    await page.screenshot({ path: 'test-results/dev-070-2-nav-attempt.png' });
  });

  test('DEV-070-3: VIEWER API request to GET /developer/api-keys returns 403', async ({ page, context }) => {
    // First, get the auth token from cookies
    const cookies = await context.cookies();
    const tokenCookie = cookies.find(c => c.name === 'token' || c.name === 'access_token');

    if (!tokenCookie) {
      throw new Error('No authentication token found');
    }

    const token = tokenCookie.value;

    // Make API request as VIEWER
    const response = await page.request.get(
      'http://localhost:3011/api/developer/api-keys?orgId=e2e00000-0000-0000-0001-000000000001',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API Response Status:', response.status());
    console.log('API Response Status Text:', response.statusText());

    // VIEWER should get 403 Forbidden
    expect(response.status()).toBe(403);

    const responseText = await response.text();
    console.log('API Response Body:', responseText);

    await page.screenshot({ path: 'test-results/dev-070-3-api-response.png' });
  });
});
