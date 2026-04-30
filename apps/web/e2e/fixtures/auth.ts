import { test as base, expect, Page, BrowserContext, request, APIRequestContext } from "@playwright/test";
import { TEST_CREDENTIALS } from "./test-data";

type UserRole = "owner" | "admin" | "editor" | "viewer";

interface AuthenticatedTestFixtures {
  authenticatedPage: Page;
  userRole: UserRole;
}

/**
 * Login helper - performs UI login with retries and robust wait handling.
 * Uses the actual login form to ensure frontend auth state is fully established.
 */
export async function loginAsUser(
  page: Page,
  role: UserRole = "owner",
): Promise<void> {
  const credentials = TEST_CREDENTIALS[role];
  await page.context().clearCookies();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/login", { timeout: 45000 });
      await page.waitForLoadState("domcontentloaded");

      await page.waitForFunction(() => {
        const form = document.querySelector("form");
        return form && document.querySelector('input[id="email"]');
      }, { timeout: 20000 });

      await page.waitForTimeout(500);

      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');
      const loginButton = page.locator('button:has-text("Sign In with Email")');

      await emailInput.waitFor({ state: "visible" });
      await passwordInput.waitFor({ state: "visible" });
      await loginButton.waitFor({ state: "visible" });

      await emailInput.fill(credentials.email);
      await passwordInput.fill(credentials.password);

      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes("/auth/login"),
        { timeout: 30000 }
      );

      await loginButton.click();
      const response = await responsePromise;

      if (response.status() !== 200 && response.status() !== 201) {
        throw new Error(`Login API returned status ${response.status()}`);
      }

      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await page.waitForLoadState("domcontentloaded");
      return;
    } catch {
      if (attempt < 2) {
        try {
          await page.context().clearCookies();
          await page.waitForTimeout(2000);
        } catch { /* context may be closed — cannot retry */ break; }
      }
    }
  }
  throw new Error(`Failed to login as ${role} after 3 attempts`);
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

/**
 * API-based login - returns tokens without requiring a browser
 */
export async function apiLogin(role: string = "owner"): Promise<{
  accessToken: string;
  cookies: { name: string; value: string; domain: string; path: string }[];
}> {
  const credentials = TEST_CREDENTIALS[role as keyof typeof TEST_CREDENTIALS];

  const apiContext = await request.newContext({
    baseURL: "http://localhost:3011",
  });

  const response = await apiContext.post("/auth/login", {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  if (response.status() !== 200 && response.status() !== 201) {
    await apiContext.dispose();
    throw new Error(`API login failed with status ${response.status()}`);
  }

  const body = await response.json();
  const state = await apiContext.storageState();

  await apiContext.dispose();

  return {
    accessToken: body.accessToken,
    cookies: state.cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
    })),
  };
}

/**
 * Create an authenticated Playwright APIRequestContext with auth headers
 */
export async function createAuthenticatedContext(
  role: string = "owner",
  orgId?: string,
): Promise<APIRequestContext> {
  const { accessToken, cookies } = await apiLogin(role);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (orgId) {
    headers["X-Organization-Id"] = orgId;
  }

  const storageState = {
    cookies: cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
    origins: [] as Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>,
  };

  return await request.newContext({
    baseURL: "http://localhost:3011",
    extraHTTPHeaders: headers,
    storageState,
  });
}

/**
 * Storage state cache for browser login reuse
 */
const storageStateCache = new Map<string, string>();

/**
 * Browser login with storage state caching for faster repeated logins
 */
export async function loginWithCachedState(
  page: Page,
  context: BrowserContext,
  role: string = "owner",
): Promise<void> {
  const cacheKey = `login-state-${role}`;

  const cachedState = storageStateCache.get(cacheKey);

  if (cachedState) {
    const state = JSON.parse(cachedState);
    await context.addCookies(state.cookies);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      storageStateCache.delete(cacheKey);
      await loginWithCachedState(page, context, role);
      return;
    }
  } else {
    await loginAsUser(page, role as UserRole);

    const state = await context.storageState();
    storageStateCache.set(cacheKey, JSON.stringify(state));
  }
}
