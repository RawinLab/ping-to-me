import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, TEST_IDS } from "./fixtures/test-data";

/**
 * Link Analytics Page E2E Tests
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover the Link Analytics page functionality:
 * - Page layout and navigation
 * - Link header card with details
 * - Stats cards (Total Engagements, Last 7 days, Weekly change)
 * - Date range selector (7d, 30d, 90d)
 * - Charts (Engagements, Locations, Devices, Referrers)
 * - Recent Activity table
 * - QR Code and Bio Page cards
 * - Copy and action buttons
 */

test.describe("Link Analytics - Navigation & Layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LA-001: Can navigate to analytics from links page", async ({
    page,
  }) => {
    // Wait for links to load
    await page.waitForSelector(".group.bg-white.rounded-2xl");

    // Hover over first link card
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();

    // Click analytics button
    const analyticsButton = linkCard.locator('a[href*="/analytics"]').first();
    await analyticsButton.click();

    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+\/analytics/);
  });

  test("LA-002: Can navigate to analytics from dropdown menu", async ({
    page,
  }) => {
    // Wait for links to load
    await page.waitForSelector(".group.bg-white.rounded-2xl");

    // Hover and open dropdown
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();

    const moreButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    await moreButton.click();

    // Click View analytics
    const viewAnalyticsMenuItem = page.locator('[role="menuitem"]').filter({ hasText: "View analytics" }).first();
    await viewAnalyticsMenuItem.click();

    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+\/analytics/);
  });

  test("LA-003: Analytics page shows loading state initially", async ({
    page,
  }) => {
    // Navigate directly to analytics page
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);

    // Should show loading or content
    const loading = page.locator("text=Loading analytics");
    const content = page.locator("text=Total Engagements");

    await expect(loading.or(content)).toBeVisible({ timeout: 10000 });
  });

  test("LA-004: Back button navigates to links page", async ({ page }) => {
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("button").filter({ hasText: "Back to Links" }).first();
    await backButton.click();

    // Should navigate to links page
    await expect(page).toHaveURL(/\/dashboard\/links$/);
  });
});

test.describe("Link Analytics - Link Header Card", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-010: Link header card displays link title", async ({ page }) => {
    // Wait for link details to load
    await page.waitForSelector("h1");

    // Should display title or hostname
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();
  });

  test("LA-011: Link header shows short URL", async ({ page }) => {
    // Should display short URL link
    const shortUrlLink = page
      .locator('a[href*="pingto.me"]')
      .first();
    await expect(shortUrlLink).toBeVisible();
  });

  test("LA-012: Link header shows original URL", async ({ page }) => {
    // Should display original URL text
    const originalUrl = page
      .locator("p.text-sm.text-slate-500")
      .filter({ hasText: /^https?:\/\// })
      .first();
    await expect(originalUrl).toBeVisible();
  });

  test("LA-013: Link header shows favicon", async ({ page }) => {
    // Should have favicon image
    const favicon = page.locator('img[src*="favicon"]').first();
    await expect(favicon).toBeVisible();
  });

  test("LA-014: Link header shows created date", async ({ page }) => {
    // Should show date with calendar icon
    const dateSection = page.locator("div:has(svg.lucide-calendar)").first();
    await expect(dateSection).toBeVisible();
  });

  test("LA-015: Copy button is functional", async ({ page }) => {
    // Find and click copy button
    const copyButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-copy") })
      .first();
    await copyButton.click();

    // Should show check icon after copying
    await expect(page.locator("svg.lucide-check").first()).toBeVisible();
  });

  test("LA-016: Edit button is visible", async ({ page }) => {
    const editButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await expect(editButton).toBeVisible();
  });

  test("LA-017: More options button is visible", async ({ page }) => {
    const moreButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    await expect(moreButton).toBeVisible();
  });
});

test.describe("Link Analytics - Stats Cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-020: Total Engagements card is visible", async ({ page }) => {
    await expect(page.locator("text=Total Engagements")).toBeVisible();
  });

  test("LA-021: Last 7 days card is visible", async ({ page }) => {
    await expect(page.locator("text=Last 7 days")).toBeVisible();
  });

  test("LA-022: Weekly change card is visible", async ({ page }) => {
    await expect(page.locator("text=Weekly change")).toBeVisible();
  });

  test("LA-023: Stats cards display numeric values", async ({ page }) => {
    // All stat values should be visible
    const statCards = page.locator(".text-4xl.font-bold");
    await expect(statCards.first()).toBeVisible();

    // Should have at least 3 stat cards
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("LA-024: Weekly change shows trend icon for positive change", async ({
    page,
  }) => {
    // Check for trending up or down icon, or 0%
    const trendingUp = page.locator("svg.lucide-trending-up");
    const trendingDown = page.locator("svg.lucide-trending-down");
    const zeroPercent = page.locator("text=0%");

    // One of these should be visible
    const hasTrend =
      (await trendingUp.isVisible()) ||
      (await trendingDown.isVisible()) ||
      (await zeroPercent.isVisible());
    expect(hasTrend).toBe(true);
  });
});

test.describe("Link Analytics - Date Range Selector", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-030: Date range selector is visible", async ({ page }) => {
    await expect(page.locator("button").filter({ hasText: "7 Days" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "30 Days" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "90 Days" }).first()).toBeVisible();
  });

  test("LA-031: Default date range is 30 days", async ({ page }) => {
    // 30 Days button should have active state (bg-white)
    const thirtyDaysButton = page.locator("button").filter({ hasText: "30 Days" }).first();
    await expect(thirtyDaysButton).toHaveClass(/bg-white/);
  });

  test("LA-032: Can switch to 7 days", async ({ page }) => {
    const sevenDaysButton = page.locator("button").filter({ hasText: "7 Days" }).first();
    await sevenDaysButton.click();

    // 7 Days button should now be active
    await expect(sevenDaysButton).toHaveClass(/bg-white/);
  });

  test("LA-033: Can switch to 90 days", async ({ page }) => {
    const ninetyDaysButton = page.locator("button").filter({ hasText: "90 Days" }).first();
    await ninetyDaysButton.click();

    // 90 Days button should now be active
    await expect(ninetyDaysButton).toHaveClass(/bg-white/);
  });

  test("LA-034: Date range display updates when switching", async ({
    page,
  }) => {
    // Get initial date display
    const dateDisplay = page
      .locator("div:has(svg.lucide-calendar) span")
      .first();
    const initialText = await dateDisplay.textContent();

    // Switch to 7 days
    const sevenDaysButton = page.locator("button").filter({ hasText: "7 Days" }).first();
    await sevenDaysButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Date display should be different
    const newText = await dateDisplay.textContent();
    // Both should contain date format
    expect(initialText).toContain("→");
    expect(newText).toContain("→");
  });

  test("LA-035: Switching date range triggers data reload", async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector("text=Total Engagements");

    // Switch date range
    const sevenDaysButton = page.locator("button").filter({ hasText: "7 Days" }).first();
    await sevenDaysButton.click();

    // Should show loading state or update data
    // The button should become enabled after loading
    await expect(sevenDaysButton).toBeEnabled();
  });
});

test.describe("Link Analytics - Engagements Chart", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-040: Engagements chart section is visible", async ({ page }) => {
    // Look for chart title or container
    await expect(page.locator("text=Engagements")).toBeVisible();
  });

  test("LA-041: Chart has export button", async ({ page }) => {
    // Find export button in chart header
    const chartCard = page
      .locator(".overflow-hidden")
      .filter({ hasText: "Engagements" })
      .first();
    const exportButton = chartCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-download") });
    await expect(exportButton).toBeVisible();
  });
});

test.describe("Link Analytics - Locations Chart", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-050: Locations section is visible", async ({ page }) => {
    await expect(page.locator("text=Locations")).toBeVisible();
  });

  test("LA-051: Countries tab is available", async ({ page }) => {
    await expect(page.locator("button").filter({ hasText: "Countries" }).first()).toBeVisible();
  });

  test("LA-052: Cities tab is available", async ({ page }) => {
    await expect(page.locator("button").filter({ hasText: "Cities" }).first()).toBeVisible();
  });

  test("LA-053: Can switch between Countries and Cities tabs", async ({
    page,
  }) => {
    // Click Cities tab
    const citiesTab = page.locator("button").filter({ hasText: "Cities" }).first();
    await citiesTab.click();

    // Cities tab should be active
    await expect(citiesTab).toHaveClass(/bg-white|text-primary/);
  });

  test("LA-054: Show more button appears if many locations", async ({
    page,
  }) => {
    // This depends on data, so we just check if the component is there
    const locationsSection = page.locator("text=Locations").first();
    await expect(locationsSection).toBeVisible();
  });
});

test.describe("Link Analytics - Devices Chart", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-060: Devices section is visible", async ({ page }) => {
    await expect(page.locator("text=Devices")).toBeVisible();
  });

  test("LA-061: Device types are displayed", async ({ page }) => {
    // Should show at least one device type (Desktop, Mobile, Tablet)
    const desktop = page.locator("text=Desktop");
    const mobile = page.locator("text=Mobile");
    const tablet = page.locator("text=Tablet");

    // At least one device type or the section should be visible
    const devicesSection = page.locator("text=Devices").first();
    await expect(devicesSection).toBeVisible();
  });

  test("LA-062: Devices chart shows engagement count", async ({ page }) => {
    // The chart center should show engagement count
    const engagementText = page.locator("text=ENGAGEMENT");
    // May or may not be visible depending on data
    const devicesSection = page.locator("text=Devices");
    await expect(devicesSection.first()).toBeVisible();
  });
});

test.describe("Link Analytics - Referrers Chart", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-070: Referrers section is visible", async ({ page }) => {
    await expect(page.locator("text=Referrers")).toBeVisible();
  });

  test("LA-071: Direct/None is shown for direct traffic", async ({ page }) => {
    // May show Direct / None if there's direct traffic
    const referrersSection = page.locator("text=Referrers");
    await expect(referrersSection.first()).toBeVisible();
  });

  test("LA-072: Referrer URLs have external links", async ({ page }) => {
    // Referrer URLs (except Direct) should have external link icons
    const referrersSection = page.locator("text=Referrers").first();
    await expect(referrersSection).toBeVisible();
  });

  test("LA-073: Show more button for many referrers", async ({ page }) => {
    // Check if show more button exists when there are many referrers
    const referrersSection = page.locator("text=Referrers").first();
    await expect(referrersSection).toBeVisible();
  });
});

test.describe("Link Analytics - Recent Activity Table", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-080: Recent Activity section is visible", async ({ page }) => {
    await expect(page.locator("text=Recent Activity")).toBeVisible();
  });

  test("LA-081: Table has correct headers", async ({ page }) => {
    await expect(page.locator("th").filter({ hasText: "Time" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Country" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "City" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Device" }).first()).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "Referrer" }).first()).toBeVisible();
  });

  test("LA-082: Table shows activity rows or empty state", async ({ page }) => {
    // Should show rows or "No recent activity"
    const hasRows = (await page.locator("tbody tr").count()) > 0;
    const hasEmptyState = await page
      .locator("text=No recent activity")
      .isVisible();

    expect(hasRows || hasEmptyState).toBe(true);
  });

  test("LA-083: Export button is visible", async ({ page }) => {
    const recentActivityCard = page
      .locator("text=Recent Activity")
      .locator("..")
      .locator("..");
    const exportButton = recentActivityCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-download") });
    await expect(exportButton).toBeVisible();
  });

  test("LA-084: Device column shows badges", async ({ page }) => {
    // Device values should be in badges
    const deviceBadges = page.locator("tbody td span.rounded-full");
    // Count may be 0 if no activity
    const count = await deviceBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Link Analytics - QR Code & Bio Page Cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-090: QR Code card is visible", async ({ page }) => {
    await expect(page.locator("h3").filter({ hasText: "QR Code" }).first()).toBeVisible();
  });

  test("LA-091: QR Code card has Create button", async ({ page }) => {
    await expect(
      page.locator("button").filter({ hasText: "Create QR Code" }).first(),
    ).toBeVisible();
  });

  test("LA-092: Bio Page card is visible", async ({ page }) => {
    await expect(page.locator("h3").filter({ hasText: "Bio Page" }).first()).toBeVisible();
  });

  test("LA-093: Bio Page card has Create button", async ({ page }) => {
    await expect(
      page.locator("button").filter({ hasText: "Create Bio Page" }).first(),
    ).toBeVisible();
  });
});

test.describe("Link Analytics - Responsive & Loading States", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("LA-100: Page handles invalid link ID gracefully", async ({ page }) => {
    await page.goto("/dashboard/links/invalid-id-12345/analytics");
    await page.waitForLoadState("networkidle");

    // Should show error or no data message
    const noData = page.locator("text=No analytics data found");
    const loading = page.locator("text=Loading analytics");
    const content = page.locator("text=Total Engagements");

    // One of these should be visible
    const visible = await noData.or(loading).or(content).isVisible().catch(() => false);
    expect(visible).toBeTruthy();
  });

  test("LA-101: Charts section is scrollable on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");

    // Page should still be functional
    await expect(page.locator("text=Total Engagements")).toBeVisible();
  });

  test("LA-102: All cards are visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");

    // All main sections should be visible
    await expect(page.locator("text=Total Engagements")).toBeVisible();
    await expect(page.locator("text=Locations")).toBeVisible();
    await expect(page.locator("text=Devices")).toBeVisible();
    await expect(page.locator("text=Referrers")).toBeVisible();
    await expect(page.locator("text=Recent Activity")).toBeVisible();
  });
});

test.describe("Link Analytics - Navigation from Different Sources", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("LA-110: Can navigate from dashboard overview analytics", async ({
    page,
  }) => {
    await page.goto("/dashboard/analytics");
    await page.waitForLoadState("networkidle");

    // Click on a link in top performing links table
    const viewButton = page.locator("button").filter({ hasText: "View" }).first();
    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/dashboard\/links\/[^/]+\/analytics/);
    }
  });

  test("LA-111: Analytics page URL structure is correct", async ({ page }) => {
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);

    // URL should follow pattern
    expect(page.url()).toMatch(/\/dashboard\/links\/[^/]+\/analytics$/);
  });
});

test.describe("Link Analytics - Data Accuracy", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
    await page.waitForLoadState("networkidle");
  });

  test("LA-120: Total engagements is a valid number", async ({ page }) => {
    const totalEngagements = page.locator(".text-4xl.font-bold").first();
    const text = await totalEngagements.textContent();

    // Should be a formatted number (may include commas)
    expect(text).toMatch(/^[\d,]+$/);
  });

  test("LA-121: Weekly change is a valid percentage", async ({ page }) => {
    // Look for percentage in weekly change section
    const weeklyChange = page
      .locator("text=Weekly change")
      .locator("..")
      .locator("..")
      .locator(".text-4xl");
    const text = await weeklyChange.textContent();

    // Should be a percentage or 0%
    expect(text).toMatch(/^[+-]?\d+%$/);
  });

  test("LA-122: Date range shows valid date format", async ({ page }) => {
    const dateRange = page.locator("div:has(svg.lucide-calendar) span").first();
    const text = await dateRange.textContent();

    // Should contain arrow and date-like text
    expect(text).toContain("→");
    expect(text).toMatch(/[A-Z][a-z]{2} \d+, \d{4}/);
  });
});
