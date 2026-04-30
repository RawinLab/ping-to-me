import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3010";
const TEST_EMAIL = "e2e-owner@pingtome.test";
const TEST_PASSWORD = "TestPassword123!";

test.describe("Organization Switcher UAT - Manual Testing", () => {
  test("Manual: Navigate and test organization switcher", async ({ page }) => {
    // Go directly to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    // Check current URL
    console.log("Current URL:", page.url());

    // If redirected to login, login manually
    if (page.url().includes("/login")) {
      console.log("Redirected to login, logging in...");

      // Wait for email input
      const emailInput = page.locator("input[type='email']");
      await emailInput.waitFor({ timeout: 5000 });

      // Fill login form
      await emailInput.fill(TEST_EMAIL);
      const passwordInput = page.locator("input[type='password']");
      await passwordInput.fill(TEST_PASSWORD);

      // Click Sign In button
      const signInButton = page.locator('button:has-text("Sign In")');
      await signInButton.click();

      // Wait for navigation to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
      await page.waitForLoadState("networkidle");

      console.log("Login successful, now on:", page.url());
    }

    // Take screenshot of header
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-manual-header.png" });

    // Look for organization switcher button (should be visible on desktop)
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();

    try {
      await expect(switcher).toBeVisible({ timeout: 5000 });
      console.log("Organization Switcher found and visible");

      // Get the text
      const text = await switcher.textContent();
      console.log("Switcher text:", text);

      // Click to open dropdown
      await switcher.click();
      await page.waitForTimeout(500);

      // Take screenshot of dropdown
      await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-manual-dropdown.png" });

      // Check for dropdown content
      const dropdownContent = page.locator('[role="menu"]');
      const isVisible = await dropdownContent.isVisible().catch(() => false);
      console.log("Dropdown visible:", isVisible);

      if (isVisible) {
        // Count organizations
        const orgItems = page.locator('[role="menuitem"]:has-text(/members/)');
        const count = await orgItems.count();
        console.log("Number of organizations:", count);

        // Check for expected elements
        const manageLink = page.locator('[role="menuitem"]:has-text("Manage Organization")');
        const teamLink = page.locator('[role="menuitem"]:has-text("Team Members")');
        const createLink = page.locator('[role="menuitem"]:has-text("Create New Organization")');

        console.log("Manage Organization link visible:", await manageLink.isVisible().catch(() => false));
        console.log("Team Members link visible:", await teamLink.isVisible().catch(() => false));
        console.log("Create New Organization link visible:", await createLink.isVisible().catch(() => false));
      }

    } catch (error) {
      console.error("Organization Switcher not found:", error);

      // Try to find any button that might be the switcher
      const allButtons = page.locator('button');
      const count = await allButtons.count();
      console.log("Total buttons on page:", count);

      // Get text of first few buttons
      for (let i = 0; i < Math.min(10, count); i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent().catch(() => "");
        console.log(`Button ${i}: ${text}`);
      }
    }
  });
});
