import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Dashboard UAT Test Report Generator
 *
 * This test suite performs manual UAT testing on the dashboard
 * and generates a comprehensive report.
 *
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 */

interface TestResult {
  testId: string;
  status: "PASS" | "FAIL";
  observations: string[];
  elementsFound: string[];
  issues: string[];
  screenshot?: string;
}

const testResults: TestResult[] = [];

test.describe("Dashboard UAT Tests - Report Generation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test("DASH-001: View Metrics Cards", async ({ page }) => {
    const result: TestResult = {
      testId: "DASH-001",
      status: "PASS",
      observations: [],
      elementsFound: [],
      issues: [],
    };

    try {
      // Step 1: Login (done in beforeEach)
      result.observations.push("✓ Logged in with e2e-owner@pingtome.test");

      // Step 2: Navigate to dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);
      result.observations.push("✓ Navigated to /dashboard");

      // Step 3: Wait for loading to complete
      result.observations.push("⏳ Waiting 5 seconds for async loading...");
      await page.waitForTimeout(5000);

      // Try to wait for skeleton to disappear
      const skeletons = page.locator('[class*="skeleton"], [data-testid="skeleton"]');
      const skeletonCount = await skeletons.count();
      if (skeletonCount > 0) {
        try {
          await skeletons.first().waitFor({ state: "hidden", timeout: 5000 });
          result.observations.push("✓ Loading skeleton disappeared");
        } catch {
          result.observations.push("⚠ Loading skeleton still visible or timeout");
        }
      }

      // Step 4: Verify metric cards
      result.observations.push("\n--- Checking for 4 metric cards ---");

      // Card 1: Total Links (blue gradient)
      const totalLinksCard = page.locator('text="Total Links"');
      if (await totalLinksCard.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ "Total Links" card (blue gradient)');

        // Try to get the value
        const cardContainer = totalLinksCard.locator("xpath=ancestor::div[contains(@class, 'card') or contains(@class, 'gradient')]").first();
        const cardText = await cardContainer.textContent();

        // Extract number (look for digits)
        const numberMatch = cardText?.match(/\d+/);
        if (numberMatch && numberMatch[0] !== "...") {
          result.elementsFound.push(`  → Shows number: ${numberMatch[0]}`);
        } else {
          result.issues.push("  ⚠ Card shows '...' instead of number");
        }

        // Check for gradient class
        const cardClass = await cardContainer.getAttribute("class");
        if (cardClass?.includes("gradient") || cardClass?.includes("blue")) {
          result.elementsFound.push("  → Has blue gradient styling");
        }
      } else {
        result.status = "FAIL";
        result.issues.push('✗ "Total Links" card NOT FOUND');
      }

      // Card 2: Total Engagements (green/emerald gradient)
      const totalEngagementsCard = page.locator('text="Total Engagements"');
      if (await totalEngagementsCard.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ "Total Engagements" card (green/emerald gradient)');

        const cardContainer = totalEngagementsCard.locator("xpath=ancestor::div[contains(@class, 'card') or contains(@class, 'gradient')]").first();
        const cardText = await cardContainer.textContent();
        const numberMatch = cardText?.match(/\d+/);
        if (numberMatch && numberMatch[0] !== "...") {
          result.elementsFound.push(`  → Shows number: ${numberMatch[0]}`);
        } else {
          result.issues.push("  ⚠ Card shows '...' instead of number");
        }

        const cardClass = await cardContainer.getAttribute("class");
        if (cardClass?.includes("gradient") && (cardClass?.includes("emerald") || cardClass?.includes("teal") || cardClass?.includes("green"))) {
          result.elementsFound.push("  → Has green/emerald gradient styling");
        }
      } else {
        result.status = "FAIL";
        result.issues.push('✗ "Total Engagements" card NOT FOUND');
      }

      // Card 3: This Week (violet/purple gradient with % change)
      const thisWeekCard = page.locator('text="This Week"');
      if (await thisWeekCard.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ "This Week" card (violet/purple gradient)');

        const cardContainer = thisWeekCard.locator("xpath=ancestor::div[contains(@class, 'card') or contains(@class, 'gradient')]").first();
        const cardText = await cardContainer.textContent();
        const numberMatch = cardText?.match(/\d+/);
        if (numberMatch && numberMatch[0] !== "...") {
          result.elementsFound.push(`  → Shows number: ${numberMatch[0]}`);
        }

        // Check for percentage change
        if (cardText?.includes("%")) {
          result.elementsFound.push("  → Shows percentage change");
        } else {
          result.observations.push("  ℹ No percentage change visible");
        }

        const cardClass = await cardContainer.getAttribute("class");
        if (cardClass?.includes("gradient") && (cardClass?.includes("violet") || cardClass?.includes("purple"))) {
          result.elementsFound.push("  → Has violet/purple gradient styling");
        }
      } else {
        result.status = "FAIL";
        result.issues.push('✗ "This Week" card NOT FOUND');
      }

      // Card 4: Today (amber/orange gradient)
      const todayCard = page.locator('text="Today"');
      if (await todayCard.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ "Today" card (amber/orange gradient)');

        const cardContainer = todayCard.locator("xpath=ancestor::div[contains(@class, 'card') or contains(@class, 'gradient')]").first();
        const cardText = await cardContainer.textContent();
        const numberMatch = cardText?.match(/\d+/);
        if (numberMatch && numberMatch[0] !== "...") {
          result.elementsFound.push(`  → Shows number: ${numberMatch[0]}`);
        } else {
          result.issues.push("  ⚠ Card shows '...' instead of number");
        }

        const cardClass = await cardContainer.getAttribute("class");
        if (cardClass?.includes("gradient") && (cardClass?.includes("amber") || cardClass?.includes("orange"))) {
          result.elementsFound.push("  → Has amber/orange gradient styling");
        }
      } else {
        result.status = "FAIL";
        result.issues.push('✗ "Today" card NOT FOUND');
      }

      // Take screenshot
      const screenshotPath = "screenshots/uat-dash-001.png";
      await page.screenshot({
        path: path.join(__dirname, "..", screenshotPath),
        fullPage: true
      });
      result.screenshot = screenshotPath;
      result.observations.push(`\n📸 Screenshot saved: ${screenshotPath}`);

    } catch (error: any) {
      result.status = "FAIL";
      result.issues.push(`Error: ${error.message}`);
    }

    testResults.push(result);
  });

  test("DASH-002: Recent Activity / Recent Links", async ({ page }) => {
    const result: TestResult = {
      testId: "DASH-002",
      status: "PASS",
      observations: [],
      elementsFound: [],
      issues: [],
    };

    try {
      // Navigate to dashboard
      await page.goto("/dashboard");
      result.observations.push("✓ Navigated to /dashboard");

      // Wait for loading
      await page.waitForTimeout(5000);
      result.observations.push("⏳ Waited 5 seconds for page to load");

      // Scroll down to find Recent Links section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      result.observations.push("✓ Scrolled to bottom of page");

      result.observations.push("\n--- Checking Recent Links section ---");

      // Check for section title
      const recentLinksTitle = page.locator('text="Recent Links"');
      if (await recentLinksTitle.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ Section title "Recent Links" found');
      } else {
        result.status = "FAIL";
        result.issues.push('✗ Section title "Recent Links" NOT FOUND');
      }

      // Check for subtitle
      const subtitle = page.locator('text=/most recently created/i');
      const subtitleVisible = await subtitle.count() > 0;
      if (subtitleVisible) {
        const subtitleText = await subtitle.first().textContent();
        result.elementsFound.push(`✓ Subtitle found: "${subtitleText?.trim()}"`);
      } else {
        result.issues.push('⚠ Subtitle "Your most recently created links" NOT FOUND');
      }

      // Check for "View All" button
      const viewAllButton = page.locator('text="View All"').last(); // Use last() as there might be multiple
      if (await viewAllButton.isVisible({ timeout: 5000 })) {
        result.elementsFound.push('✓ "View All" button found');
      } else {
        result.status = "FAIL";
        result.issues.push('✗ "View All" button NOT FOUND');
      }

      // Check for table or list
      result.observations.push("\n--- Checking for links display ---");

      // The LinksTable component uses card-based div layout, not actual <table>
      // Look for link cards within the Recent Links section
      await page.waitForTimeout(2000);

      // Look for link cards (they have specific classes based on the component)
      const linkCards = page.locator('.space-y-4 > div.bg-white.rounded-2xl, div.group.bg-white.rounded-2xl').last().locator('xpath=ancestor::div[contains(@class, "space-y")]');

      const cardsContainer = page.locator('div.space-y-4 > div.bg-white.rounded-2xl, div.group.bg-white.rounded-2xl');
      const cardsCount = await cardsContainer.count();

      if (cardsCount > 0) {
        result.elementsFound.push(`✓ Found ${cardsCount} link card(s)`);
        result.elementsFound.push("  → Links displayed as cards (not table)");

        // Get first link card to check content
        const firstCard = cardsContainer.first();
        const cardText = await firstCard.textContent();

        if (cardText && cardText.length > 20) {
          result.observations.push(`  ℹ First link preview: ${cardText?.substring(0, 100)}...`);

          // Check for expected elements in cards
          const hasUrl = cardText.includes("http") || cardText.includes("ping");
          const hasEngagement = /\d+/.test(cardText); // Numbers likely indicate engagements

          if (hasUrl) {
            result.elementsFound.push("  → Cards show: URL/slug");
          }
          if (hasEngagement) {
            result.elementsFound.push("  → Cards show: engagement count");
          }
        }

        // Look for common link card elements
        const copyButtons = await firstCard.locator('button[title*="Copy"], button:has-text("Copy")').count();
        const qrButtons = await firstCard.locator('button:has-text("QR")').count();
        const analyticsLinks = await firstCard.locator('a:has-text("Analytics"), a:has-text("Stats")').count();

        if (copyButtons > 0) result.elementsFound.push("  → Has 'Copy' functionality");
        if (qrButtons > 0) result.elementsFound.push("  → Has 'QR Code' functionality");
        if (analyticsLinks > 0) result.elementsFound.push("  → Has 'Analytics' link");

      } else {
        // No cards found, might be empty state
        result.observations.push("  ℹ No link cards found");

        // Check for empty state message
        const emptyMessage = page.locator('text=/no links/i, text=/create.*first/i');
        const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasEmptyMessage) {
          result.observations.push("  ℹ Empty state: User has no links yet");
        } else {
          result.issues.push("⚠ No links or empty state found in Recent Links section");
        }
      }

      // Take screenshot
      const screenshotPath = "screenshots/uat-dash-002.png";
      await page.screenshot({
        path: path.join(__dirname, "..", screenshotPath),
        fullPage: true
      });
      result.screenshot = screenshotPath;
      result.observations.push(`\n📸 Screenshot saved: ${screenshotPath}`);

    } catch (error: any) {
      result.status = "FAIL";
      result.issues.push(`Error: ${error.message}`);
    }

    testResults.push(result);
  });

  test("DASH-003: Date Range Filter", async ({ page }) => {
    const result: TestResult = {
      testId: "DASH-003",
      status: "PASS",
      observations: [],
      elementsFound: [],
      issues: [],
    };

    try {
      // Navigate to dashboard
      await page.goto("/dashboard");
      result.observations.push("✓ Navigated to /dashboard");

      await page.waitForTimeout(3000);

      result.observations.push("\n--- Looking for DateRangePicker ---");

      // Look for date range button (should be near Import/Export buttons)
      // Common text patterns: "30 Days", "Last 7 Days", etc.
      const dateRangeButton = page.locator('button').filter({ hasText: /Days|Today|Week|Month/i });
      const buttonCount = await dateRangeButton.count();

      result.observations.push(`Found ${buttonCount} button(s) with date-related text`);

      if (buttonCount > 0) {
        // Find the right one (should be near top-right with Import/Export)
        let foundDatePicker = false;
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const btn = dateRangeButton.nth(i);
          const btnText = await btn.textContent();
          result.observations.push(`  Button ${i + 1}: "${btnText?.trim()}"`);

          // Check if this button is near Import/Export buttons
          const nearImport = await page.locator('button:has-text("Import")').count() > 0;
          if (nearImport && !foundDatePicker) {
            result.elementsFound.push(`✓ DateRangePicker found with text: "${btnText?.trim()}"`);
            foundDatePicker = true;

            // Try to click and open dropdown
            result.observations.push("\n--- Attempting to open date picker ---");
            const initialText = btnText?.trim();

            await btn.click();
            result.observations.push("✓ Clicked date picker button");
            await page.waitForTimeout(500);

            // Look for dropdown/popover
            const popover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]');
            const popoverVisible = await popover.isVisible({ timeout: 2000 }).catch(() => false);

            if (popoverVisible) {
              result.elementsFound.push("✓ Date picker dropdown opened");

              // Look for preset options
              const presetButtons = await popover.locator('button').allTextContents();
              result.elementsFound.push(`  → Found ${presetButtons.length} option(s): ${presetButtons.join(', ')}`);

              // Try to select a different option (e.g., "Last 7 Days" or "Last 30 Days")
              const last7Days = popover.locator('button:has-text("Last 7 Days"), button:has-text("7 Days")');
              const last30Days = popover.locator('button:has-text("Last 30 Days"), button:has-text("30 Days")');

              let optionClicked = false;
              if (await last7Days.isVisible({ timeout: 1000 }).catch(() => false)) {
                await last7Days.first().click();
                result.observations.push('✓ Selected "Last 7 Days" option');
                optionClicked = true;
              } else if (await last30Days.isVisible({ timeout: 1000 }).catch(() => false)) {
                await last30Days.first().click();
                result.observations.push('✓ Selected "Last 30 Days" option');
                optionClicked = true;
              }

              if (optionClicked) {
                await page.waitForTimeout(2000);

                // Verify the selection updated
                const updatedText = await btn.textContent();
                result.observations.push(`  → Button text changed from "${initialText}" to "${updatedText?.trim()}"`);

                if (updatedText !== initialText) {
                  result.elementsFound.push("✓ Selection updated successfully");
                } else {
                  result.observations.push("  ℹ Button text unchanged (may show date range instead of preset name)");
                }

                // Check if metrics refreshed
                const metricsVisible = await page.locator('text="Total Links"').isVisible();
                if (metricsVisible) {
                  result.elementsFound.push("✓ Dashboard metrics still visible after selection");
                }
              } else {
                result.issues.push("⚠ Could not find date range options to select");
              }

            } else {
              result.issues.push("⚠ Date picker dropdown did not open");
            }

            break;
          }
        }

        if (!foundDatePicker) {
          result.status = "FAIL";
          result.issues.push("✗ Could not identify DateRangePicker (no button near Import/Export)");
        }

      } else {
        result.status = "FAIL";
        result.issues.push("✗ No date range picker found on dashboard");
      }

      // Take screenshot
      const screenshotPath = "screenshots/uat-dash-003.png";
      await page.screenshot({
        path: path.join(__dirname, "..", screenshotPath),
        fullPage: true
      });
      result.screenshot = screenshotPath;
      result.observations.push(`\n📸 Screenshot saved: ${screenshotPath}`);

    } catch (error: any) {
      result.status = "FAIL";
      result.issues.push(`Error: ${error.message}`);
    }

    testResults.push(result);
  });

  // Generate final report
  test.afterAll(async () => {
    const reportPath = path.join(__dirname, "..", "uat-dashboard-report.md");
    const report = generateReport(testResults);
    fs.writeFileSync(reportPath, report, "utf-8");
    console.log(`\n📋 UAT Report saved to: ${reportPath}\n`);
    console.log(report);
  });
});

function generateReport(results: TestResult[]): string {
  const now = new Date().toISOString();

  let report = `# Dashboard UAT Test Report\n\n`;
  report += `**Test Date:** ${now}\n`;
  report += `**Test Account:** e2e-owner@pingtome.test / TestPassword123!\n`;
  report += `**Web URL:** http://localhost:3010\n`;
  report += `**Environment:** Local Development\n\n`;
  report += `---\n\n`;

  // Summary
  const passCount = results.filter(r => r.status === "PASS").length;
  const failCount = results.filter(r => r.status === "FAIL").length;
  const totalCount = results.length;

  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${totalCount}\n`;
  report += `- **Passed:** ${passCount} ✅\n`;
  report += `- **Failed:** ${failCount} ❌\n`;
  report += `- **Pass Rate:** ${Math.round((passCount / totalCount) * 100)}%\n\n`;
  report += `---\n\n`;

  // Detailed results
  report += `## Test Results\n\n`;

  for (const result of results) {
    report += `### ${result.testId}: ${result.status === "PASS" ? "✅ PASS" : "❌ FAIL"}\n\n`;

    if (result.observations.length > 0) {
      report += `**Observations:**\n`;
      for (const obs of result.observations) {
        report += `- ${obs}\n`;
      }
      report += `\n`;
    }

    if (result.elementsFound.length > 0) {
      report += `**Elements Found:**\n`;
      for (const elem of result.elementsFound) {
        report += `- ${elem}\n`;
      }
      report += `\n`;
    }

    if (result.issues.length > 0) {
      report += `**Issues:**\n`;
      for (const issue of result.issues) {
        report += `- ${issue}\n`;
      }
      report += `\n`;
    }

    if (result.screenshot) {
      report += `**Screenshot:** \`${result.screenshot}\`\n\n`;
    }

    report += `---\n\n`;
  }

  return report;
}
