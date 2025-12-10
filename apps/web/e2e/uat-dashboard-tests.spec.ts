import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_CREDENTIALS } from "./fixtures/test-data";

/**
 * UAT Dashboard Tests
 *
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe("UAT Dashboard Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login with the test account using the loginAsUser helper
    await loginAsUser(page, "owner");
  });

  test("DASH-007: OS Chart", async ({ page }) => {
    console.log("\n=== DASH-007: OS Chart Test ===");
    console.log("Test Account:", TEST_CREDENTIALS.owner.email);

    // Navigate to dashboard (should already be there)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    console.log("✓ Navigated to dashboard");

    // Wait for dashboard data to load
    await page.waitForTimeout(3000);

    // Look for Operating Systems widget by card title
    const osTitle = page.locator('h3:has-text("Operating Systems"), h2:has-text("Operating Systems")').first();

    const osWidgetVisible = await osTitle.isVisible().catch(() => false);

    if (!osWidgetVisible) {
      console.log("✗ FAIL: Could not find Operating Systems widget");
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/dash-007-no-os-widget.png', fullPage: true });
      throw new Error("Operating Systems widget not found");
    }

    console.log("✓ Found Operating Systems widget");

    // Find the OS widget card
    const osCard = page.locator('div').filter({ has: osTitle }).first();

    // Check for common OS names within the widget
    const osNames = ["Windows", "macOS", "iOS", "Android", "Linux"];
    const foundOS: string[] = [];

    for (const os of osNames) {
      // Look for OS name within the card
      const osElement = osCard.getByText(os, { exact: true });
      if (await osElement.isVisible().catch(() => false)) {
        foundOS.push(os);
        console.log(`✓ Found OS: ${os}`);
      }
    }

    if (foundOS.length === 0) {
      console.log("⚠ Warning: No specific OS names found (may indicate no data)");
      // Check if "No data available" message is shown
      const noDataMessage = osCard.getByText("No data available");
      if (await noDataMessage.isVisible().catch(() => false)) {
        console.log("✓ Empty state shown: 'No data available'");
      }
    } else {
      console.log(`✓ Found ${foundOS.length} operating systems:`, foundOS.join(", "));

      // Check for percentages or counts in the OS card
      // The widget shows percentages like "45.2%" and counts
      const percentagePattern = /\d+\.\d+%/;
      const hasPercentages = await osCard.locator(`text=${percentagePattern}`).count() > 0;

      if (hasPercentages) {
        console.log("✓ OS distribution shows percentages");
      }

      // Check for count numbers
      const countNumbers = await osCard.locator('span.text-muted-foreground').count();
      if (countNumbers > 0) {
        console.log("✓ OS distribution shows click counts");
      }
    }

    console.log("✓ PASS: OS Chart test completed successfully");
  });

  test("DASH-008: Engagements Chart", async ({ page }) => {
    console.log("\n=== DASH-008: Engagements Chart Test ===");
    console.log("Test Account:", TEST_CREDENTIALS.owner.email);

    // Navigate to dashboard (should already be there)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    console.log("✓ Navigated to dashboard");

    // Look for Engagements or Clicks Over Time chart
    const engagementsSelectors = [
      'text=/Engagements?/i',
      'text=/Clicks Over Time/i',
      '[data-testid="engagements-chart"]',
      'h2:has-text("Engagements")',
      'h3:has-text("Engagements")',
      'h2:has-text("Clicks Over Time")',
      'h3:has-text("Clicks Over Time")',
    ];

    let engagementsWidget = null;
    for (const selector of engagementsSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        engagementsWidget = element;
        console.log(`✓ Found Engagements widget using selector: ${selector}`);
        break;
      }
    }

    if (!engagementsWidget) {
      console.log("✗ FAIL: Could not find Engagements or Clicks Over Time widget");
      throw new Error("Engagements chart not found");
    }

    // Verify time series chart is present (line or area chart)
    const chartSelectors = [
      '.recharts-wrapper',
      '.recharts-surface',
      'svg.recharts-surface',
      '[role="img"]',
    ];

    let chartFound = false;
    for (const selector of chartSelectors) {
      const chart = page.locator(selector).first();
      if (await chart.isVisible().catch(() => false)) {
        chartFound = true;
        console.log(`✓ Found time series chart using selector: ${selector}`);
        break;
      }
    }

    if (!chartFound) {
      console.log("✗ FAIL: Time series chart not displayed");
      throw new Error("Time series chart not found");
    }

    // Check for chart elements (line, area, or bars)
    const chartElements = [
      '.recharts-line',
      '.recharts-area',
      '.recharts-bar',
    ];

    let hasChartData = false;
    for (const element of chartElements) {
      if (await page.locator(element).count() > 0) {
        hasChartData = true;
        console.log(`✓ Chart contains data visualization: ${element}`);
        break;
      }
    }

    if (hasChartData) {
      console.log("✓ Time series chart shows clicks data");
    }

    // Test tooltip by hovering over chart area
    const chartArea = page.locator('.recharts-wrapper').first();
    if (await chartArea.isVisible().catch(() => false)) {
      await chartArea.hover();
      await page.waitForTimeout(500); // Wait for tooltip to appear

      // Check for tooltip
      const tooltipSelectors = [
        '.recharts-tooltip',
        '[role="tooltip"]',
        '.recharts-default-tooltip',
      ];

      let tooltipFound = false;
      for (const selector of tooltipSelectors) {
        const tooltip = page.locator(selector);
        if (await tooltip.isVisible().catch(() => false)) {
          tooltipFound = true;
          console.log(`✓ Hover tooltip is displayed: ${selector}`);
          break;
        }
      }

      if (!tooltipFound) {
        console.log("⚠ Warning: Tooltip not detected on hover (may require specific data point)");
      }
    }

    console.log("✓ PASS: Engagements Chart test completed successfully");
  });
});

test.describe("UAT Empty Dashboard Test", () => {
  test("DASH-009: Empty Dashboard State", async ({ page }) => {
    console.log("\n=== DASH-009: Empty Dashboard State Test ===");

    // Register a new empty account
    const timestamp = Date.now();
    const emptyAccountEmail = `empty-dash-${timestamp}@example.com`;
    const emptyAccountPassword = "TestPassword123!";

    console.log("Creating new empty account:", emptyAccountEmail);

    // Go to registration page
    await page.goto("/register");

    // Fill registration form
    await page.fill('input[id="email"]', emptyAccountEmail);
    await page.fill('input[id="password"]', emptyAccountPassword);

    // Optional: fill name if field exists
    const nameField = page.locator('input[id="name"]');
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill("Empty Dash Test User");
    }

    // Submit registration
    await page.click('button:has-text("Sign Up with Email")');

    // Wait for redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 15000 });

    // If redirected to login, login with new account
    if (page.url().includes("/login")) {
      console.log("✓ Registration successful, logging in...");
      await page.fill('input[id="email"]', emptyAccountEmail);
      await page.fill('input[id="password"]', emptyAccountPassword);
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }

    console.log("✓ Successfully logged in with empty account");

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    console.log("✓ Navigated to dashboard");

    // Verify empty state message
    const emptyStateSelectors = [
      'text=/no links/i',
      'text=/get started/i',
      'text=/create your first link/i',
      'text=/start by creating/i',
      '[data-testid="empty-state"]',
    ];

    let emptyStateFound = false;
    for (const selector of emptyStateSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        emptyStateFound = true;
        console.log(`✓ Found empty state message: ${selector}`);
        break;
      }
    }

    if (!emptyStateFound) {
      console.log("✗ FAIL: Empty state message not found");
      console.log("Page content:", await page.textContent("body"));
    } else {
      console.log("✓ Empty state message is displayed");
    }

    // Verify "Create your first link" button or CTA
    const ctaSelectors = [
      'button:has-text("Create Link")',
      'button:has-text("Create your first link")',
      'a:has-text("Create Link")',
      'a:has-text("Get Started")',
      '[data-testid="create-first-link"]',
    ];

    let ctaFound = false;
    for (const selector of ctaSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        ctaFound = true;
        console.log(`✓ Found CTA button: ${selector}`);
        break;
      }
    }

    if (!ctaFound) {
      console.log("✗ FAIL: Create link CTA button not found");
    } else {
      console.log("✓ Create link CTA button is displayed");
    }

    // Verify metrics show 0
    const zeroMetrics = [
      'text=/0[\s]+(links?|engagements?|clicks?|views?)/i',
    ];

    let hasZeroMetrics = false;
    for (const selector of zeroMetrics) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        hasZeroMetrics = true;
        const count = await element.count();
        console.log(`✓ Found ${count} metrics showing 0`);
        break;
      }
    }

    if (hasZeroMetrics) {
      console.log("✓ Metrics show 0 for empty account");
    } else {
      console.log("⚠ Warning: Could not verify metrics show 0");
    }

    // Final verification
    if (emptyStateFound && ctaFound) {
      console.log("✓ PASS: Empty Dashboard State test completed successfully");
    } else {
      console.log("✗ FAIL: Empty Dashboard State test incomplete");
      throw new Error("Empty state not properly displayed");
    }
  });
});
