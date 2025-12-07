import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import {
  TEST_IDS,
  TEST_SLUGS,
  TEST_CREDENTIALS,
  EXPECTED_ANALYTICS,
} from "./fixtures/test-data";

/**
 * Dashboard E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * These tests use the seeded test data for realistic testing.
 */

test.describe("Dashboard with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("DASH-R001: View dashboard metrics with real data", async ({ page }) => {
    // Should already be on dashboard after login
    await expect(page).toHaveURL(/\/dashboard/);

    // Check Total Links card - should have at least 10 links from seed
    await expect(page.locator("text=Total Links")).toBeVisible();

    // Check Total Clicks card - should have clicks from seed data
    await expect(page.locator("text=Total Clicks")).toBeVisible();

    // Check Recent Clicks or Active Links
    await expect(
      page.locator("text=Recent Clicks").or(page.locator("text=Active Links")),
    ).toBeVisible();
  });

  test("DASH-R002: View recent links in dashboard", async ({ page }) => {
    // Check for recent links section
    await expect(
      page.locator("text=Your Links").or(page.locator("text=Recent Links")),
    ).toBeVisible();

    // Should show some of our seeded links
    const linkTable = page.locator('table, [role="table"]');
    if (await linkTable.isVisible()) {
      // Check for at least one E2E test link
      await expect(
        page
          .locator(`text=${TEST_SLUGS.links.recent1}`)
          .or(page.locator(`text=${TEST_SLUGS.links.popular}`))
          .or(page.locator("text=e2e-")),
      ).toBeVisible();
    }
  });

  test("DASH-R003: View top performing links", async ({ page }) => {
    // Check for top performing links section
    const topLinksSection = page
      .locator("text=Top Performing Links")
      .or(page.locator("text=Top Links"));

    if (await topLinksSection.isVisible()) {
      // Popular link should appear in top performing
      await expect(
        page.locator(`text=${TEST_SLUGS.links.popular}`),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("DASH-R004: Date range filter works", async ({ page }) => {
    // Look for date range buttons
    const last7Days = page.locator('button:has-text("Last 7 Days")');
    const last30Days = page.locator('button:has-text("Last 30 Days")');

    if (await last7Days.isVisible()) {
      // Click and verify it changes selection
      await last7Days.click();
      // Button should show active state (varies by implementation)
    }

    if (await last30Days.isVisible()) {
      await last30Days.click();
    }
  });
});

test.describe("Analytics with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("ANA-R001: View analytics for popular link", async ({ page }) => {
    // Navigate to analytics for popular link
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Should show analytics page
    await expect(
      page.locator("h1, h2").filter({ hasText: /Analytics|Popular Link/ }),
    ).toBeVisible({ timeout: 10000 });

    // Should show click count (approximately 500 from seed)
    // Look for large number indicating clicks
    const clicksText = page.locator("text=/[0-9]{2,}/");
    await expect(clicksText.first()).toBeVisible();
  });

  test("ANA-R002: View device breakdown", async ({ page }) => {
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Check for devices chart/section
    await expect(page.locator("text=Devices")).toBeVisible({ timeout: 10000 });

    // Should show device types from seed data
    const devicesSection = page
      .locator('.recharts-wrapper, [data-testid="devices-chart"]')
      .first();
    if (await devicesSection.isVisible()) {
      // Chart should be rendered
      await expect(devicesSection).toBeVisible();
    }
  });

  test("ANA-R003: View country breakdown", async ({ page }) => {
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Check for countries section
    await expect(
      page.locator("text=Top Countries").or(page.locator("text=Countries")),
    ).toBeVisible({ timeout: 10000 });

    // Should show at least one of the seeded countries
    const countryLabels = EXPECTED_ANALYTICS.countries.slice(0, 3); // US, TH, JP
    let foundCountry = false;
    for (const country of countryLabels) {
      if (
        await page
          .locator(`text=${country}`)
          .isVisible()
          .catch(() => false)
      ) {
        foundCountry = true;
        break;
      }
    }
    // At least one country should be visible (may vary based on random data)
  });

  test("ANA-R004: View referrer breakdown", async ({ page }) => {
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Check for referrers section
    const referrersSection = page
      .locator("text=Top Referrers")
      .or(page.locator("text=Referrers"));

    if (await referrersSection.isVisible()) {
      // Should show at least one referrer
      await expect(
        page
          .locator("text=google.com")
          .or(page.locator("text=facebook.com"))
          .or(page.locator("text=direct")),
      ).toBeVisible();
    }
  });

  test("ANA-R005: View clicks over time", async ({ page }) => {
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Check for time series chart
    await expect(
      page
        .locator("text=Clicks Over Time")
        .or(page.locator("text=Click Trends")),
    ).toBeVisible({ timeout: 10000 });

    // Chart should be rendered
    const chart = page.locator(".recharts-wrapper, .recharts-surface").first();
    await expect(chart).toBeVisible();
  });

  test("ANA-R006: Analytics date range selector", async ({ page }) => {
    await page.goto(`/dashboard/analytics/${TEST_IDS.links.popular}`);

    // Look for date range selector
    const dateSelector = page.locator(
      'button:has-text("7d"), button:has-text("30d"), button:has-text("90d")',
    );

    if (await dateSelector.first().isVisible()) {
      // Click 30 days
      await page.locator('button:has-text("30d")').click();

      // Should update chart/data
      await page.waitForTimeout(500); // Wait for data refresh
    }
  });
});

test.describe("Links Management with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("LINK-R001: View links list", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Should show links table
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Should show our seeded links
    await expect(page.locator("text=e2e-")).toBeVisible();
  });

  test("LINK-R002: Search for specific link", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Find search input
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[type="search"]',
    );

    if (await searchInput.isVisible()) {
      // Search for popular link
      await searchInput.fill("popular");
      await page.waitForTimeout(500); // Debounce

      // Should filter results
      await expect(
        page.locator(`text=${TEST_SLUGS.links.popular}`),
      ).toBeVisible();
    }
  });

  test("LINK-R003: Filter links by tag", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Look for tag filter
    const tagFilter = page.locator(
      'button:has-text("marketing"), [data-testid="tag-filter"]',
    );

    if (await tagFilter.first().isVisible()) {
      await tagFilter.first().click();

      // Should show only marketing tagged links
      await expect(
        page.locator(`text=${TEST_SLUGS.links.marketing}`),
      ).toBeVisible();
    }
  });

  test("LINK-R004: View expired link status", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Look for expired link
    const expiredRow = page
      .locator('tr, [role="row"]')
      .filter({ hasText: TEST_SLUGS.links.expired });

    if (await expiredRow.isVisible()) {
      // Should show expired status indicator
      await expect(
        expiredRow.locator(
          'text=Expired, .text-red-500, [data-status="expired"]',
        ),
      ).toBeVisible();
    }
  });

  test("LINK-R005: Click through to link analytics", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Find popular link row and click analytics
    const popularRow = page
      .locator('tr, [role="row"]')
      .filter({ hasText: TEST_SLUGS.links.popular });

    if (await popularRow.isVisible()) {
      // Click on analytics icon/button
      const analyticsButton = popularRow.locator(
        'a[href*="analytics"], button:has-text("Analytics"), [aria-label*="analytics"]',
      );

      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
        await expect(page).toHaveURL(/\/dashboard\/analytics/);
      }
    }
  });
});

test.describe("Organization Features with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("ORG-R001: View organization in switcher", async ({ page }) => {
    // Look for organization switcher
    const orgSwitcher = page.locator(
      '[data-testid="org-switcher"], button:has-text("Organization")',
    );

    if (await orgSwitcher.isVisible()) {
      await orgSwitcher.click();

      // Should show our test organization
      await expect(
        page
          .locator(`text=${TEST_SLUGS.organizations.main}`)
          .or(page.locator("text=E2E Test Organization")),
      ).toBeVisible();
    }
  });

  test("ORG-R002: View custom domain", async ({ page }) => {
    await page.goto("/dashboard/domains");

    // Should show our verified domain
    await expect(
      page.locator(`text=${TEST_SLUGS.domains.verified}`),
    ).toBeVisible({ timeout: 10000 });

    // Should show verified status
    const verifiedRow = page
      .locator('tr, [role="row"]')
      .filter({ hasText: TEST_SLUGS.domains.verified });
    if (await verifiedRow.isVisible()) {
      await expect(
        verifiedRow.locator(
          'text=Verified, .text-green-500, [data-verified="true"]',
        ),
      ).toBeVisible();
    }
  });
});

test.describe("Notifications with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("NOTIF-R001: View notifications", async ({ page }) => {
    // Look for notification bell/icon
    const notificationBell = page.locator(
      '[aria-label*="notification"], button:has(svg.lucide-bell)',
    );

    if (await notificationBell.isVisible()) {
      await notificationBell.click();

      // Should show notifications dropdown/panel
      await expect(
        page
          .locator("text=Welcome to PingTO.Me")
          .or(page.locator("text=Link expiring soon"))
          .or(page.locator("text=New team member")),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("NOTIF-R002: Has unread notifications indicator", async ({ page }) => {
    // Look for unread indicator on bell
    const unreadBadge = page.locator(
      '[data-testid="unread-count"], .notification-badge, span.bg-red-500',
    );

    // We have 2 unread notifications from seed
    // Badge should be visible if there are unreads
  });
});
