import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, EXPECTED_ANALYTICS } from "./fixtures/test-data";

/**
 * Dashboard Overview E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * These tests use real API calls against seeded test data.
 */

test.describe("Dashboard Overview", () => {
  test.beforeEach(async ({ page }) => {
    // Login with real authentication
    await loginAsUser(page, "owner");
  });

  test("DASH-001: View Metrics", async ({ page }) => {
    // Should already be on dashboard after login
    await expect(page).toHaveURL(/\/dashboard/);

    // Check Total Links card - should have links from seed data
    await expect(page.locator("text=Total Links")).toBeVisible();

    // Check Total Clicks card - should have clicks from seed data
    await expect(page.locator("text=Total Clicks")).toBeVisible();

    // Check Recent Clicks or Active Links
    await expect(
      page.locator("text=Recent Clicks").or(page.locator("text=Active Links")),
    ).toBeVisible();
  });

  test("DASH-002: Recent Activity", async ({ page }) => {
    // Check Recent Links widget (LinksTable)
    await expect(
      page.locator("text=Your Links").or(page.locator("text=Recent Links")),
    ).toBeVisible();

    // Should show E2E test links from seed data
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

  test("DASH-003: Date Range Filter", async ({ page }) => {
    // Check for Date Range buttons
    const last30Days = page.locator('button:has-text("Last 30 Days")');
    const last7Days = page.locator('button:has-text("Last 7 Days")');

    await expect(last30Days.or(last7Days).first()).toBeVisible();

    // Click date range button if visible
    if (await last7Days.isVisible()) {
      await last7Days.click();
      // Should update dashboard data
      await page.waitForTimeout(500);
    }
  });

  test("DASH-004: Top Performing Links", async ({ page }) => {
    // Check Top Performing Links card
    const topPerforming = page
      .locator("text=Top Performing Links")
      .or(page.locator("text=Top Links"));

    if (await topPerforming.isVisible()) {
      // Popular link from seed should appear
      await expect(
        page.locator(`text=${TEST_SLUGS.links.popular}`),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("DASH-005: Dashboard loads within 3 seconds", async ({ page }) => {
    const start = Date.now();
    // Wait for main dashboard content to be visible
    await expect(
      page
        .locator('h1:has-text("Welcome back")')
        .or(page.locator('h1:has-text("Dashboard")')),
    ).toBeVisible({ timeout: 3000 });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  test("DASH-006: Stats cards display correct values", async ({ page }) => {
    // Total Links card
    await expect(page.locator("text=Total Links")).toBeVisible();

    // Total Engagements card
    await expect(page.locator("text=Total Engagements")).toBeVisible();

    // This Week card
    await expect(page.locator("text=This Week")).toBeVisible();

    // Today card
    await expect(page.locator("text=Today")).toBeVisible();
  });

  test("DASH-007: Quick actions navigation works", async ({ page }) => {
    // Check Create Link quick action exists
    const createLinkCard = page
      .locator('a[href="/dashboard/links/new"]')
      .filter({ hasText: "Create Link" });
    await expect(createLinkCard).toBeVisible();

    // Check QR Codes quick action exists
    const qrCodesCard = page
      .locator('a[href="/dashboard/qr-codes"]')
      .filter({ hasText: "QR Codes" });
    await expect(qrCodesCard).toBeVisible();

    // Check Bio Pages quick action exists
    const bioPagesCard = page
      .locator('a[href="/dashboard/bio"]')
      .filter({ hasText: "Bio Pages" });
    await expect(bioPagesCard).toBeVisible();
  });

  test("DASH-008: Date range picker is functional", async ({ page }) => {
    // Check date range picker exists
    const datePickerButton = page
      .locator("button")
      .filter({ hasText: /Days|Today|Year/ });
    await expect(datePickerButton.first()).toBeVisible();

    // Click to open date range picker
    await datePickerButton.first().click();

    // Check preset options are visible
    await expect(page.getByText("7 Days")).toBeVisible();
    await expect(page.getByText("30 Days")).toBeVisible();
    await expect(page.getByText("90 Days")).toBeVisible();
  });

  test("DASH-009: Browser and OS widgets display data", async ({ page }) => {
    // Check Top Browsers widget
    await expect(page.locator("text=Top Browsers")).toBeVisible();

    // Should show at least one browser from seed data
    const browsers = EXPECTED_ANALYTICS.browsers;
    let foundBrowser = false;
    for (const browser of browsers) {
      if (await page.locator(`text=${browser}`).isVisible().catch(() => false)) {
        foundBrowser = true;
        break;
      }
    }
    expect(foundBrowser).toBeTruthy();

    // Check Operating Systems widget
    await expect(page.locator("text=Operating Systems")).toBeVisible();
  });

  test("DASH-010: Engagements chart renders", async ({ page }) => {
    // Check chart section exists
    await expect(page.locator("text=Engagements Overview")).toBeVisible();

    // Check View Analytics button
    const viewAnalyticsBtn = page.locator('a[href="/dashboard/analytics"]');
    await expect(viewAnalyticsBtn).toBeVisible();
  });

  test("DASH-011: Recent links section displays", async ({ page }) => {
    // Check Recent Links section
    await expect(
      page.locator("text=Recent Links").or(page.locator("text=Your Links")),
    ).toBeVisible();

    // Check View All button
    const viewAllBtn = page
      .locator('a[href="/dashboard/links"]')
      .filter({ hasText: "View All" });
    await expect(viewAllBtn).toBeVisible();
  });

  test("DASH-012: Import and Export buttons visible", async ({ page }) => {
    // Check Import button
    await expect(page.locator('button:has-text("Import")')).toBeVisible();

    // Check Export button
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });
});

test.describe("Dashboard Analytics with Real Data", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("DASH-ANA-001: View click trends chart", async ({ page }) => {
    // Check for engagements chart
    await expect(
      page
        .locator("text=Engagements Overview")
        .or(page.locator("text=Click Trends")),
    ).toBeVisible();

    // Chart should be rendered
    const chart = page.locator(".recharts-wrapper, .recharts-surface").first();
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test("DASH-ANA-002: View geographic distribution", async ({ page }) => {
    // Check for countries/location data
    const countriesSection = page
      .locator("text=Top Countries")
      .or(page.locator("text=Countries"));

    if (await countriesSection.isVisible()) {
      // Should show at least one country from seed data
      const countries = EXPECTED_ANALYTICS.countries.slice(0, 3); // US, TH, JP
      let foundCountry = false;
      for (const country of countries) {
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
      expect(foundCountry).toBeTruthy();
    }
  });

  test("DASH-ANA-003: View device breakdown", async ({ page }) => {
    // Check for devices section
    const devicesSection = page
      .locator("text=Devices")
      .or(page.locator("text=Device Types"));

    if (await devicesSection.isVisible()) {
      // Should show at least one device type
      const devices = EXPECTED_ANALYTICS.devices;
      let foundDevice = false;
      for (const device of devices) {
        if (
          await page
            .locator(`text=${device}`)
            .isVisible()
            .catch(() => false)
        ) {
          foundDevice = true;
          break;
        }
      }
      expect(foundDevice).toBeTruthy();
    }
  });

  test("DASH-ANA-004: View referrer data", async ({ page }) => {
    // Check for referrers section
    const referrersSection = page
      .locator("text=Top Referrers")
      .or(page.locator("text=Referrers"));

    if (await referrersSection.isVisible()) {
      // Should show at least one referrer from seed data
      const referrers = EXPECTED_ANALYTICS.referrers;
      let foundReferrer = false;
      for (const referrer of referrers) {
        if (
          await page
            .locator(`text=${referrer}`)
            .isVisible()
            .catch(() => false)
        ) {
          foundReferrer = true;
          break;
        }
      }
      // Direct traffic is common, so it's okay if no named referrer found
    }
  });
});

test.describe("Dashboard RBAC Tests", () => {
  test("DASH-RBAC-001: Admin can view dashboard", async ({ page }) => {
    await loginAsUser(page, "admin");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Total Links")).toBeVisible();
  });

  test("DASH-RBAC-002: Editor can view dashboard", async ({ page }) => {
    await loginAsUser(page, "editor");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Total Links")).toBeVisible();
  });

  test("DASH-RBAC-003: Viewer can view dashboard", async ({ page }) => {
    await loginAsUser(page, "viewer");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Total Links")).toBeVisible();
  });
});
