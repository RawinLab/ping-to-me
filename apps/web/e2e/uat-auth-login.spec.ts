import { test, expect } from "@playwright/test";

test.describe("UAT - Authentication Login Tests", () => {
  test("AUTH-004: Login - Success", async ({ page }) => {
    console.log("\n=== AUTH-004: Login - Success ===");

    // Step 1: Go to /login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    console.log("✓ Navigated to /login");

    // Step 2: Fill in Email
    await page.fill('input[id="email"]', "e2e-owner@pingtome.test");
    console.log("✓ Filled email: e2e-owner@pingtome.test");

    // Step 3: Fill in Password
    await page.fill('input[id="password"]', "TestPassword123!");
    console.log("✓ Filled password: TestPassword123!");

    // Step 4: Click "Sign In with Email" button
    await page.click('button:has-text("Sign In with Email")');
    console.log("✓ Clicked Sign In button");

    // Wait for navigation to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Step 5: Verify redirect to /dashboard
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes("/dashboard")) {
      console.log("✓ AUTH-004: PASS - Successfully redirected to /dashboard");
    } else {
      console.log("✗ AUTH-004: FAIL - Failed to redirect to /dashboard");
      // Take screenshot for debugging
      await page.screenshot({
        path: "playwright-report/auth-004-failed.png",
        fullPage: true,
      });
    }

    // Step 6: Verify dashboard content
    await page.locator("h1, nav").first().waitFor({ state: "visible", timeout: 10000 });
    const hasDashboardContent = await page.locator("h1, nav").first().isVisible();
    console.log(`✓ Dashboard content visible: ${hasDashboardContent}`);

    expect(currentUrl).toContain("/dashboard");
    expect(hasDashboardContent).toBeTruthy();
  });

  test("AUTH-005: Login - Wrong Password", async ({ page }) => {
    console.log("\n=== AUTH-005: Login - Wrong Password ===");

    // Step 1: Go to /login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    console.log("✓ Navigated to /login");

    // Step 2: Fill in Email
    await page.fill('input[id="email"]', "e2e-owner@pingtome.test");
    console.log("✓ Filled email: e2e-owner@pingtome.test");

    // Step 3: Fill in Password (wrong)
    await page.fill('input[id="password"]', "WrongPassword");
    console.log("✓ Filled password: WrongPassword");

    // Step 4: Click "Sign In with Email" button
    await page.click('button:has-text("Sign In with Email")');
    console.log("✓ Clicked Sign In button");

    // Wait for error alert to appear
    await page.waitForTimeout(2000);

    // Step 5: Verify error message
    const errorAlert = page.locator('[role="alert"]').first();
    const hasError = await errorAlert.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log(`✓ AUTH-005: PASS - Error message displayed: "${errorText}"`);
    } else {
      console.log("✗ AUTH-005: FAIL - No error message found");
      // Take screenshot for debugging
      await page.screenshot({
        path: "playwright-report/auth-005-failed.png",
        fullPage: true,
      });
    }

    // Step 6: Verify still on /login page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      console.log("✓ Still on /login page");
    } else {
      console.log("✗ Unexpectedly navigated away from /login");
    }

    expect(hasError).toBeTruthy();
    expect(currentUrl).toContain("/login");
  });

  test("AUTH-006: Password Reset Request", async ({ page }) => {
    console.log("\n=== AUTH-006: Password Reset Request ===");

    // Step 1: Go to /login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    console.log("✓ Navigated to /login");

    // Step 2: Click "Forgot password?" link
    await page.click("text=Forgot password?");
    console.log('✓ Clicked "Forgot password?" link');

    // Should navigate to forgot password page
    await page.waitForURL(/\/forgot-password/, { timeout: 5000 });
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Step 3: Fill in Email
    await page.fill('input[id="email"]', "e2e-owner@pingtome.test");
    console.log("✓ Filled email: e2e-owner@pingtome.test");

    // Step 4: Click "Send Reset Link" button
    await page.click('button:has-text("Send Reset Link")');
    console.log("✓ Clicked Send Reset Link button");

    // Wait for success message
    await page.waitForTimeout(2000);

    // Step 5: Verify success message
    const successMessage = page.locator(
      "text=If an account exists with that email, we have sent a password reset link"
    );
    await successMessage.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    const hasSuccess = await successMessage.isVisible().catch(() => false);

    if (hasSuccess) {
      const successText = await successMessage.textContent();
      console.log(
        `✓ AUTH-006: PASS - Success message displayed: "${successText}"`
      );
    } else {
      console.log("✗ AUTH-006: FAIL - No success message found");
      await page.screenshot({
        path: "playwright-report/auth-006-no-success.png",
        fullPage: true,
      });
    }

    expect(currentUrl).toContain("/forgot-password");
    expect(hasSuccess).toBeTruthy();
  });
});
