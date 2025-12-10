import { test, expect } from "@playwright/test";

test.describe("UAT - Authentication Tests", () => {
  test("AUTH-001: User Registration - Success", async ({ page }) => {
    const timestamp = Date.now();
    const email = `uat-test-${timestamp}@example.com`;

    // Capture console logs and errors
    const consoleLogs: string[] = [];
    page.on("console", (msg) => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => consoleLogs.push(`ERROR: ${err.message}`));

    // 1. Go to /register
    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);

    // 2-5. Fill in registration form
    await page.fill('input#name', "UAT Test User");
    await page.fill('input#email', email);
    await page.fill('input#password', "Password123!");

    // 6. Click "Sign Up with Email" button
    await page.click('button:has-text("Sign Up with Email")');

    // 7. Verify success (should show success message)
    await page.waitForTimeout(3000);

    const currentUrl = page.url();

    // Get all text on the page for debugging
    const pageContent = await page.textContent("body");

    // Look for success message
    const successAlert = await page
      .locator('text=/registration successful/i')
      .count();

    // Also check for "Back to Login" button which appears on success
    const backToLoginButton = await page
      .locator('text=/back to login/i')
      .count();

    // Check for any error alerts
    const errorAlert = await page
      .locator('[role="alert"]')
      .filter({ hasText: /failed|error|invalid/i })
      .count();

    // Check for any visible errors
    const anyAlert = await page.locator('[role="alert"]').count();

    if (successAlert > 0 && backToLoginButton > 0) {
      console.log("✓ AUTH-001: PASS - Registration successful");
      console.log(`  - Email used: ${email}`);
      const successMessage = await page
        .locator('text=/registration successful/i')
        .first()
        .textContent();
      console.log(`  - Success message: ${successMessage}`);
    } else if (errorAlert > 0) {
      console.log("✗ AUTH-001: FAIL - Registration failed with error");
      console.log(`  - Email used: ${email}`);
      const errorMessage = await page
        .locator('[role="alert"]')
        .first()
        .textContent();
      console.log(`  - Error message: ${errorMessage}`);
      console.log(`  - Final URL: ${currentUrl}`);
    } else {
      console.log("✗ AUTH-001: FAIL - No clear success or error message");
      console.log(`  - Email used: ${email}`);
      console.log(`  - Final URL: ${currentUrl}`);
      console.log(`  - Success alert count: ${successAlert}`);
      console.log(`  - Back to login button count: ${backToLoginButton}`);
      console.log(`  - Any alert count: ${anyAlert}`);
      if (anyAlert > 0) {
        const alertText = await page.locator('[role="alert"]').first().textContent();
        console.log(`  - Alert text: ${alertText}`);
      }
      // Log first 200 chars of page content for debugging
      console.log(`  - Page snippet: ${pageContent?.substring(0, 200)}...`);
      // Log console errors
      if (consoleLogs.length > 0) {
        console.log(`  - Console logs:`);
        consoleLogs.forEach((log) => console.log(`    ${log}`));
      }
    }

    expect(successAlert > 0 && backToLoginButton > 0).toBeTruthy();
  });

  test("AUTH-002: Invalid Password Validation", async ({ page }) => {
    // 1. Go to /register
    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);

    // 2-3. Fill in email and short password
    await page.fill('input#email', "test-invalid@example.com");
    await page.fill('input#password', "123");

    // 4. Try to submit (trigger validation by clicking submit)
    await page.click('button:has-text("Sign Up with Email")');

    // 5. Verify error message
    await page.waitForTimeout(1000);

    const errorMessage = await page
      .locator('text=/password.*8.*character/i')
      .count();

    if (errorMessage > 0) {
      console.log("✓ AUTH-002: PASS - Password validation working");
      const errorText = await page
        .locator('text=/password.*8.*character/i')
        .first()
        .textContent();
      console.log(`  - Error message: ${errorText}`);
    } else {
      console.log("✗ AUTH-002: FAIL - No password validation error shown");
    }

    expect(errorMessage > 0).toBeTruthy();
  });

  test("AUTH-003: Duplicate Email Validation", async ({ page }) => {
    // 1. Go to /register
    await page.goto("/register");
    await expect(page).toHaveURL(/.*register/);

    // 2-5. Fill in form with existing email
    await page.fill('input#name', "Test User");
    await page.fill('input#email', "e2e-owner@pingtome.test");
    await page.fill('input#password', "Password123!");

    // 6. Click register button
    await page.click('button:has-text("Sign Up with Email")');

    // 7. Verify error about duplicate email
    await page.waitForTimeout(2000);

    const duplicateError = await page
      .locator('text=/email.*already.*exist|email.*taken|user.*already|already.*registered/i')
      .count();

    if (duplicateError > 0) {
      console.log("✓ AUTH-003: PASS - Duplicate email validation working");
      const errorText = await page
        .locator('[role="alert"]')
        .first()
        .textContent();
      console.log(`  - Error message: ${errorText}`);
    } else {
      console.log(
        "✗ AUTH-003: FAIL - No duplicate email error shown"
      );
      console.log(`  - Current URL: ${page.url()}`);
      // Take screenshot for debugging
      await page.screenshot({
        path: "/tmp/auth-003-fail.png",
        fullPage: true,
      });
    }

    expect(duplicateError > 0).toBeTruthy();
  });
});
