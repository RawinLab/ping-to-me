import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Screenshot capture for API Key Status Badges
 * This test navigates to the API keys page and captures screenshots
 * of the badge implementations.
 */

test.describe("API Key Status Badges - Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await loginAsUser(page, "owner");
  });

  test("Capture API keys page with all badges", async ({ page }) => {
    // Navigate to API keys page
    await page.goto("/dashboard/developer/api-keys");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Take a full page screenshot
    await page.screenshot({
      path: "screenshots/dev-040-045-api-keys-page.png",
      fullPage: true,
    });

    // Find the table with API keys
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Take a cropped screenshot of just the table
    const tableBox = await table.boundingBox();
    if (tableBox) {
      await page.screenshot({
        path: "screenshots/dev-040-045-api-keys-table.png",
        clip: {
          x: tableBox.x,
          y: tableBox.y,
          width: tableBox.width,
          height: Math.min(tableBox.height, 600),
        },
      });
    }

    console.log("Screenshots captured successfully");
  });

  test("Verify badge elements exist on page", async ({ page }) => {
    await page.goto("/dashboard/developer/api-keys");
    await page.waitForLoadState("networkidle");

    // Check for any badge elements
    const badges = page.locator('[class*="bg-"][class*="text-"]').filter({
      has: page.locator("text=/Active|Never used|IP Restricted|Rate Limited|Expired/"),
    });

    const badgeCount = await badges.count();
    console.log(`Found ${badgeCount} status badges on the page`);

    // List all badge texts found
    const badgeTexts = await page.locator("text=/Active|Never used|IP Restricted|Rate Limited|Expired/").allTextContents();
    console.log("Badge texts found:", badgeTexts);

    expect(badgeCount).toBeGreaterThan(0);
  });
});
