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
  await page.waitForLoadState("networkidle");

  // Wait for React to hydrate (check for a React-rendered element)
  await page.waitForFunction(() => {
    const form = document.querySelector("form");
    return form && document.querySelector('input[id="email"]');
  }, { timeout: 10000 });

  // Additional wait for React event handlers to be attached
  await page.waitForTimeout(500);

  // Get input elements
  const emailInput = page.locator('input[id="email"]');
  const passwordInput = page.locator('input[id="password"]');

  // Wait for inputs to be ready
  await emailInput.waitFor({ state: "visible" });
  await passwordInput.waitFor({ state: "visible" });

  // Fill using standard fill() which works after React hydration
  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // Click login button
  const loginButton = page.locator('button:has-text("Sign In with Email")');
  await loginButton.waitFor({ state: "visible" });

  // Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/auth/login"),
    { timeout: 10000 }
  );

  await loginButton.click();

  // Wait for API response
  const response = await responsePromise;
  const status = response.status();

  if (status === 201 || status === 200) {
    // Wait for redirect to dashboard or 2FA page with longer timeout
    // Use waitForURL with a timeout that accounts for Next.js client navigation
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 20000 }),
      page.waitForURL(/\/login\/2fa/, { timeout: 20000 }),
    ]).catch(async () => {
      // If URL doesn't change, wait for dashboard elements to appear (SPA navigation)
      const currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        // Try waiting a bit more for SPA navigation
        await page.waitForTimeout(2000);
        // Force navigation if still on login
        if (page.url().includes("/login")) {
          await page.goto("/dashboard");
        }
      }
    });
  } else {
    throw new Error(`Login API returned status ${status}`);
  }

  // Wait for dashboard to load
  await page.waitForLoadState("networkidle");

  // Verify we're logged in by checking dashboard elements (unless 2FA required)
  if (page.url().includes("/dashboard")) {
    await expect(page.locator("h1, nav").first()).toBeVisible({ timeout: 10000 });
  }
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
