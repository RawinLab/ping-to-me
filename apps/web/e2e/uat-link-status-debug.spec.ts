import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

test.describe("UAT Debug: Link Status", () => {
  test("Debug: Check links page structure", async ({ page }) => {
    console.log("\n=== Debugging Links Page ===");

    // Login
    await loginAsUser(page, "owner");
    console.log("✓ Logged in as owner");

    // Navigate to links page
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    console.log("✓ Navigated to /dashboard/links");

    // Take screenshot
    await page.screenshot({
      path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/debug-links-page.png",
      fullPage: true
    });
    console.log("✓ Screenshot saved");

    // Check page content
    const pageText = await page.textContent("body");
    console.log(`\nPage contains "ACTIVE": ${pageText?.includes("ACTIVE")}`);
    console.log(`Page contains "DISABLED": ${pageText?.includes("DISABLED")}`);
    console.log(`Page contains "Links": ${pageText?.includes("Links")}`);

    // Check for any link cards with different selectors
    const linkCards1 = await page.locator(".group.bg-white.rounded-2xl").count();
    console.log(`\nLink cards (.group.bg-white.rounded-2xl): ${linkCards1}`);

    const linkCards2 = await page.locator('[data-testid*="link"]').count();
    console.log(`Link cards (data-testid): ${linkCards2}`);

    const linkCards3 = await page.locator('article, [role="article"]').count();
    console.log(`Articles: ${linkCards3}`);

    // Look for status badges
    const statusBadges = await page.locator('span, badge, div').filter({ hasText: /ACTIVE|DISABLED|ARCHIVED/i }).count();
    console.log(`Status badges: ${statusBadges}`);

    // Try to get first few links
    const allLinks = page.locator('a[href*="/dashboard/links/"]');
    const linkCount = await allLinks.count();
    console.log(`\nLinks to dashboard/links/*: ${linkCount}`);

    if (linkCount > 0) {
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        const linkText = await allLinks.nth(i).textContent();
        console.log(`  Link ${i + 1}: ${linkText?.substring(0, 50)}`);
      }
    }

    // Check for table rows
    const tableRows = await page.locator('tr, tbody > *').count();
    console.log(`\nTable rows: ${tableRows}`);

    // Print first few div classes to understand structure
    const divs = page.locator('div[class*="group"]');
    const divCount = await divs.count();
    console.log(`\nDivs with "group" class: ${divCount}`);

    if (divCount > 0) {
      for (let i = 0; i < Math.min(3, divCount); i++) {
        const className = await divs.nth(i).getAttribute('class');
        console.log(`  Div ${i + 1} classes: ${className}`);
      }
    }

    console.log("\n=== Debug Complete ===");
  });
});
