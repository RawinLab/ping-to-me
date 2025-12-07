import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { TEST_CREDENTIALS } from "./test-data";

type UserRole = "owner" | "admin" | "editor" | "viewer";

interface AuthenticatedTestFixtures {
  authenticatedPage: Page;
  userRole: UserRole;
}

/**
 * Login helper - performs actual login against the API
 */
export async function loginAsUser(
  page: Page,
  role: UserRole = "owner",
): Promise<void> {
  const credentials = TEST_CREDENTIALS[role];

  // Go to login page
  await page.goto("/login");

  // Fill login form
  await page.fill('input[id="email"]', credentials.email);
  await page.fill('input[id="password"]', credentials.password);

  // Click login button
  await page.click('button:has-text("Sign In with Email")');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });

  // Verify we're logged in by checking dashboard elements
  await expect(page.locator("h1, nav").first()).toBeVisible({ timeout: 10000 });
}

/**
 * Quick login using stored auth state (faster for subsequent tests)
 */
export async function quickLogin(
  context: BrowserContext,
  storageStatePath: string,
): Promise<void> {
  await context.storageState({ path: storageStatePath });
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Clear cookies to log out
  await page.context().clearCookies();
  await page.goto("/login");
}

/**
 * Extended test with authenticated page fixture
 */
export const authenticatedTest = base.extend<AuthenticatedTestFixtures>({
  userRole: ["owner", { option: true }],
  authenticatedPage: async ({ page, userRole }, use) => {
    await loginAsUser(page, userRole);
    await use(page);
  },
});

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for dashboard elements that only appear when logged in
    const dashboardElement = await page.locator("text=PingTO.Me").isVisible();
    return dashboardElement;
  } catch {
    return false;
  }
}

/**
 * Wait for auth state to be ready
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for either dashboard or login page to load
  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {}),
    page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {}),
  ]);
}
