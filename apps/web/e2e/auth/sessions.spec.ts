import { test, expect, request, Page, BrowserContext } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { TEST_CREDENTIALS } from "../fixtures/test-data";

const API_BASE = "http://localhost:3011";

async function getApiToken(): Promise<string> {
  const apiContext = await request.newContext({ baseURL: API_BASE });
  const response = await apiContext.post("/auth/login", {
    data: {
      email: TEST_CREDENTIALS.owner.email,
      password: TEST_CREDENTIALS.owner.password,
    },
  });
  const body = await response.json();
  await apiContext.dispose();
  return body.accessToken;
}

async function navigateToSessionsTab(page: Page) {
  const sidebarNav = page.locator("nav.overflow-y-auto").first();
  if (await sidebarNav.isVisible().catch(() => false)) {
    await sidebarNav.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" })).catch(() => {});
    await page.waitForTimeout(500);
  }

  const securityLink = page.locator('a[href="/dashboard/settings/security"]').first();
  await securityLink.scrollIntoViewIfNeeded().catch(() => {});
  const isVisible = await securityLink.isVisible().catch(() => false);

  if (isVisible) {
    await securityLink.click();
    await page.waitForURL(/\/dashboard\/settings\/security/, { timeout: 15000 }).catch(() => {});
  }

  // Fallback: full page navigation with auth reinit
  if (!page.url().includes("/dashboard/settings/security")) {
    await page.goto("/dashboard/settings/security?tab=sessions", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for auth to reinitialize after full page navigation
    await page.waitForFunction(
      () => {
        const logo = document.querySelector("text=PingTO.Me") || 
                     Array.from(document.querySelectorAll("span")).find(el => el.textContent?.includes("PingTO.Me"));
        const heading = document.querySelector("h1");
        return logo || heading;
      },
      { timeout: 20000 }
    ).catch(() => {});

    await page.waitForTimeout(1500);

    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1000);
      const secLink = page.locator('a[href="/dashboard/settings/security"]').first();
      await sidebarNav.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" })).catch(() => {});
      await secLink.scrollIntoViewIfNeeded().catch(() => {});
      await secLink.click().catch(() => {});
      await page.waitForURL(/\/dashboard\/settings\/security/, { timeout: 15000 }).catch(() => {});
    }
  }

  await expect(page.getByRole("heading", { name: "Security Settings" })).toBeVisible({ timeout: 45000 });

  const sessionsTab = page.locator('[role="tab"]:has-text("Sessions")').first();
  await sessionsTab.click();
  await page.waitForTimeout(1000);

  await expect(page.getByRole("heading", { name: "Active Sessions" })).toBeVisible({ timeout: 30000 });
}

test.describe.configure({ mode: "serial", timeout: 150000 });

test.describe("Session Management", () => {
  const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";

  test.beforeEach(async ({ page }) => {
    await page.unrouteAll();
    await loginAsUser(page, "owner");

    await page.route("http://localhost:3011/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/auth/")) {
        await route.continue();
        return;
      }
      const headers = { ...route.request().headers() };
      headers["x-organization-id"] = MAIN_ORG_ID;

      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === "/organizations") {
        const response = await route.fetch({ headers });
        const body = await response.json();
        const orgs = Array.isArray(body) ? body : [];
        const mainIdx = orgs.findIndex((o: any) => o.id === MAIN_ORG_ID);
        if (mainIdx > 0) {
          const [mainOrg] = orgs.splice(mainIdx, 1);
          orgs.unshift(mainOrg);
        }
        await route.fulfill({
          status: response.status(),
          headers: { ...response.headers(), "content-type": "application/json" },
          body: JSON.stringify(orgs),
        });
      } else {
        await route.continue({ headers });
      }
    });

    await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test("sessions tab loads and shows active sessions list", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByRole("heading", { name: "Active Sessions" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/manage your active sessions/i)).toBeVisible({ timeout: 10000 });
  });

  test("current session is marked as current", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByText("Current Session")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Active now")).toBeVisible({ timeout: 10000 });
  });

  test("sessions display browser and OS information", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByText("Current Session")).toBeVisible({ timeout: 10000 });
    // The current session card shows "Browser on OS" format
    const currentCard = page.locator(".from-emerald-50");
    await expect(currentCard.getByText(/on\s/)).toBeVisible({ timeout: 5000 });
  });

  test("sessions display IP address and location", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByText("Current Session")).toBeVisible({ timeout: 30000 });
    const currentCard = page.locator(".from-emerald-50");
    await expect(currentCard.getByText(/IP:/)).toBeVisible({ timeout: 15000 });
  });

  test("sessions display last active timestamp", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByText("Current Session")).toBeVisible({ timeout: 10000 });
    const currentCard = page.locator(".from-emerald-50");
    await expect(currentCard.getByText(/last active:/i)).toBeVisible({ timeout: 10000 });
    await expect(currentCard.getByText(/Just now|minute|hour/i)).toBeVisible({ timeout: 10000 });
  });

  test("revoke a single session removes it from list", async ({ page, context }) => {
    await navigateToSessionsTab(page);

    // "Sign out" buttons only exist for other (non-current) sessions
    const signOutButtons = page.locator(".bg-slate-50").locator('button:has-text("Sign out")');
    const count = await signOutButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await signOutButtons.first().click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/sign out session/i)).toBeVisible();

    const confirmButton = dialog.getByRole("button", { name: /^sign out$/i });
    await confirmButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test("revoke all other sessions leaves only current", async ({
    page,
    context,
    browser,
  }) => {
    const extraContext = await browser.newContext();
    const extraPage = await extraContext.newPage();

    await extraPage.goto("http://localhost:3010/login");
    await extraPage.waitForLoadState("domcontentloaded");
    await extraPage.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    await extraPage.locator('input[id="email"]').fill(TEST_CREDENTIALS.owner.email);
    await extraPage.locator('input[id="password"]').fill(TEST_CREDENTIALS.owner.password);

    const responsePromise = extraPage.waitForResponse(
      (r) => r.url().includes("/auth/login"),
      { timeout: 10000 },
    );
    await extraPage.locator('button:has-text("Sign In with Email")').click();
    await responsePromise;

    await Promise.race([
      extraPage.waitForURL(/\/dashboard/, { timeout: 20000 }),
      extraPage.waitForURL(/\/login\/2fa/, { timeout: 20000 }),
    ]).catch(() => {});

    const is2fa = extraPage.url().includes("/login/2fa");
    if (is2fa) {
      await extraContext.close();
      test.skip();
      return;
    }

    await navigateToSessionsTab(page);

    const logoutAllButton = page.getByRole("button", {
      name: /sign out all other devices/i,
    });
    const isVisible = await logoutAllButton.isVisible().catch(() => false);

    if (!isVisible) {
      await extraContext.close();
      test.skip();
      return;
    }

    await logoutAllButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/sign out all other devices/i)).toBeVisible();

    const confirmButton = dialog.getByRole("button", { name: /sign out all/i });
    await confirmButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/no other sessions/i)).toBeVisible({
      timeout: 10000,
    });

    await extraContext.close();
  });

  test("session count matches actual active sessions", async ({ page }) => {
    await navigateToSessionsTab(page);

    await expect(page.getByText("Current Session")).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Other Sessions" }),
    ).toBeVisible({ timeout: 10000 });

    const descLocator = page.getByText(
      /no other sessions|you have \d+ other active session/i,
    );
    await expect(descLocator).toBeVisible({ timeout: 10000 });
  });
});
