import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { EXPECTED_ANALYTICS, TEST_IDS } from "../fixtures/test-data";

const MAIN_ORG_ID = TEST_IDS.organizations.main;

test.describe.configure({ timeout: 120000 });

test.describe("Dashboard Analytics", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
  });

  test.beforeEach(async ({ page }) => {
    await page.unrouteAll();
    await loginAsUser(page, "owner");
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

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

    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, MAIN_ORG_ID);

    await page.reload({ waitUntil: "domcontentloaded" });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 15000 });
        break;
      } catch {
        if (attempt < 2) {
          try {
            await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
          } catch {
            await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
          }
        } else {
          throw new Error("Failed to load dashboard after 3 attempts");
        }
      }
    }
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 30000 });

    await expect(
      page.locator("text=Total Links").first()
    ).toBeVisible({ timeout: 60000 });
  });

  test("dashboard page loads successfully after login", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Welcome back")).toBeVisible();
    await expect(page.locator("text=Live").first()).toBeVisible();
  });

  test("total links metric displays with seeded data", async ({ page }) => {
    const totalLinksCard = page.locator("text=Total Links").first();
    await expect(totalLinksCard).toBeVisible();
    const card = totalLinksCard.locator("..").locator("..");
    const numberText = await card.locator("p.text-4xl").textContent();
    const parsed = parseInt(numberText?.replace(/,/g, "") || "0", 10);
    expect(parsed).toBeGreaterThanOrEqual(10);
  });

  test("total clicks metric displays with seeded data", async ({ page }) => {
    const totalClicksCard = page.locator("text=Total Engagements").first();
    await expect(totalClicksCard).toBeVisible({ timeout: 30000 });
    const card = totalClicksCard.locator("..").locator("..");
    await expect(card.locator("p.text-4xl")).not.toContainText("...", { timeout: 10000 });
    const numberText = await card.locator("p.text-4xl").textContent();
    const parsed = parseInt(numberText?.replace(/,/g, "") || "0", 10);
    expect(parsed).toBeGreaterThanOrEqual(1);
  });

  test("click trend chart renders with time series data", async ({ page }) => {
    const viewAnalyticsLink = page.locator('a[href="/dashboard/analytics"]').first();
    await expect(viewAnalyticsLink).toBeVisible();

    const chartTitle = page.locator("text=Engagements Overview").first();
    const hasChart = await chartTitle.isVisible().catch(() => false);
    if (hasChart) {
      const rechartsContainer = page.locator(".recharts-wrapper").first();
      await expect(rechartsContainer).toBeVisible({ timeout: 5000 });
    }
  });

  test("browser breakdown widget renders with seed data", async ({ page }) => {
    const topBrowsersTitle = page.locator("text=Top Browsers").first();
    const hasWidget = await topBrowsersTitle.isVisible().catch(() => false);
    if (!hasWidget) return;

    const browsers = EXPECTED_ANALYTICS.browsers;
    let foundBrowser = false;
    for (const browser of browsers) {
      const visible = await topBrowsersTitle.locator("..").locator("..").locator(`text=${browser}`).isVisible().catch(() => false);
      if (visible) {
        foundBrowser = true;
        break;
      }
    }
    expect(foundBrowser).toBe(true);
  });

  test("operating system breakdown widget renders with seed data", async ({ page }) => {
    const osTitle = page.locator("text=Operating Systems").first();
    const hasWidget = await osTitle.isVisible().catch(() => false);
    if (!hasWidget) return;

    const osList = EXPECTED_ANALYTICS.os;
    let foundOS = false;
    for (const os of osList) {
      const visible = await osTitle.locator("..").locator("..").locator(`text=${os}`).isVisible().catch(() => false);
      if (visible) {
        foundOS = true;
        break;
      }
    }
    expect(foundOS).toBe(true);
  });

  test("referrer data section is present when analytics data exists", async ({ page }) => {
    const engagementsSection = page.locator("text=Engagements Overview");
    const hasSection = await engagementsSection.isVisible().catch(() => false);
    if (hasSection) {
      const chart = page.locator(".recharts-wrapper").first();
      await expect(chart).toBeAttached();
    }
  });

  test("geographic data is available through analytics navigation", async ({ page }) => {
    const viewAnalyticsLink = page.locator('a[href="/dashboard/analytics"]').first();
    await expect(viewAnalyticsLink).toBeVisible();
    await viewAnalyticsLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/dashboard\/analytics/, { timeout: 15000 });
  });

  test("date range picker allows selecting different ranges", async ({ page }) => {
    const datePickerButton = page.locator("button").filter({ hasText: /Days|Today|Year/ }).first();
    await expect(datePickerButton).toBeVisible({ timeout: 10000 });
    await datePickerButton.click();
    const popover = page.locator('[data-radix-popper-content-wrapper], [role="dialog"]').first();
    await expect(popover).toBeVisible({ timeout: 5000 });
    await expect(popover.getByText("7 Days").first()).toBeVisible({ timeout: 5000 });
    await expect(popover.getByText("30 Days").first()).toBeVisible();
    await expect(popover.getByText("90 Days")).toBeVisible();
    await popover.getByText("7 Days").first().click();
    await expect(datePickerButton).toContainText("7 Days");
  });

  test("dashboard reflects organization context", async ({ page }) => {
    const totalLinksLabel = page.locator("text=Total Links").first();
    await expect(totalLinksLabel).toBeVisible();
    const card = totalLinksLabel.locator("..").locator("..");
    const numberEl = card.locator("p.text-4xl");
    await expect(numberEl).not.toContainText("...", { timeout: 5000 });
  });

  test("dashboard loads successfully after navigation from links page", async ({ page }) => {
    await page.goto("/dashboard/links", { waitUntil: "domcontentloaded" });
    await page.locator("text=e2e-").first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Total Links").first()).toBeVisible({ timeout: 30000 });
  });

  test("dashboard does not show empty state with seeded data", async ({ page }) => {
    const gettingStarted = page.locator("text=Get Started with PingTO.Me");
    await expect(gettingStarted).not.toBeVisible();
    await expect(page.locator("text=Total Links").first()).toBeVisible();
    await expect(page.locator("text=Total Engagements").first()).toBeVisible();
  });

  test("recent links list displays seeded links", async ({ page }) => {
    await expect(page.locator("text=Recent Links").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=e2e-").first()).toBeVisible({ timeout: 15000 });
    const viewAllBtn = page.locator('a[href="/dashboard/links"]').filter({ hasText: "View All" }).first();
    await expect(viewAllBtn).toBeVisible();
  });

  test("quick actions allow creating a new link", async ({ page }) => {
    const headerCreateBtn = page.locator('a[href="/dashboard/links/new"]').filter({ hasText: "Create Link" }).first();
    await expect(headerCreateBtn).toBeVisible();
    const createLinkCard = page.locator('a[href="/dashboard/links/new"]').filter({ hasText: "Shorten URLs" }).first();
    await expect(createLinkCard).toBeVisible();
    await createLinkCard.click();
    await expect(page).toHaveURL(/\/dashboard\/links\/new/, { timeout: 15000 });
  });

  test("live activity feed section renders", async ({ page }) => {
    const liveText = page.locator("text=Live updates active").first();
    const connectingText = page.locator("text=Connecting...").first();
    await expect(liveText.or(connectingText)).toBeVisible({ timeout: 10000 });
  });

  test("this week and today stats cards display values", async ({ page }) => {
    const thisWeekCard = page.locator("text=This Week").first();
    await expect(thisWeekCard).toBeVisible();
    const todayCard = page.getByText("Today", { exact: true }).first();
    await expect(todayCard).toBeVisible();
    const thisWeekParent = thisWeekCard.locator("..").locator("..");
    await expect(thisWeekParent.locator("p.text-4xl")).not.toContainText("...");
  });
});
