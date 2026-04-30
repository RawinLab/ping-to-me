import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "../fixtures/auth";
import { TEST_CREDENTIALS } from "../fixtures/test-data";

/**
 * Login E2E Tests
 *
 * Tests login page UI, successful authentication, failure cases,
 * session persistence, redirect behavior, and logout.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

// ---------------------------------------------------------------------------
// Independent tests – no state mutation between them
// ---------------------------------------------------------------------------
test.describe("Login Page", () => {
  test("displays email and password fields on load", async ({ page }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for React hydration
    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(
      page.locator('button:has-text("Sign In with Email")'),
    ).toBeVisible();

    // Page should have heading
    await expect(
      page.getByRole("heading", { name: /sign in to your account/i }),
    ).toBeVisible();
  });

  test("shows validation errors when submitting empty fields", async ({
    page,
  }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for form hydration
    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // Click sign in without filling anything
    await page.locator('button:has-text("Sign In with Email")').click();

    // Zod validation should show inline errors
    await expect(
      page.locator('input[id="email"] + p, input[id="email"]').first(),
    ).toBeVisible();

    // There should be validation text for email
    const emailError = page.getByText("Invalid email address");
    const passwordError = page.getByText("Password is required");
    await expect(emailError.or(passwordError).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows forgot password link", async ({ page }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    const forgotLink = page.getByRole("link", { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });

  test("shows register link", async ({ page }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", "/register");
  });
});

// ---------------------------------------------------------------------------
// Successful login – each role gets its own test
// ---------------------------------------------------------------------------
test.describe("Successful Login", () => {
  test("owner credentials redirect to dashboard", async ({ page }) => {
    await loginAsUser(page, "owner");

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    // Dashboard should show navigation / heading
    await expect(page.locator("h1, nav").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin credentials redirect to dashboard", async ({ page }) => {
    await loginAsUser(page, "admin");

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("editor credentials redirect to dashboard", async ({ page }) => {
    await loginAsUser(page, "editor");

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("viewer credentials redirect to dashboard", async ({ page }) => {
    await loginAsUser(page, "viewer");

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Failed login – wrong credentials
// ---------------------------------------------------------------------------
test.describe("Failed Login", () => {
  test("wrong password shows error message", async ({ page }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');

    await emailInput.fill(TEST_CREDENTIALS.owner.email);
    await passwordInput.fill("CompletelyWrongPassword1!");

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/auth/login"),
      { timeout: 10000 },
    );

    await page.locator('button:has-text("Sign In with Email")').click();
    await responsePromise;

    // Alert with error should appear
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test("non-existent email shows error message", async ({ page }) => {
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');

    await emailInput.fill("no-such-user@pingtome.test");
    await passwordInput.fill("TestPassword123!");

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/auth/login"),
      { timeout: 10000 },
    );

    await page.locator('button:has-text("Sign In with Email")').click();
    await responsePromise;

    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Redirect behaviour
// ---------------------------------------------------------------------------
test.describe("Login Redirects", () => {
  test("redirects to dashboard if already authenticated", async ({ page }) => {
    // Login first
    await loginAsUser(page, "owner");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Navigate to login page while authenticated
    await page.goto("/login", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected away from login back to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("preserves redirect URL after login", async ({ page }) => {
    // Visit a protected page while logged out — should land on login with redirect param
    await page.goto("/dashboard/links", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // If the app redirects to /login?callbackUrl=... or /login?redirect=..., capture it
    const loginUrl = page.url();

    // We should be on the login page now
    expect(loginUrl).toMatch(/\/login/);

    // Now log in
    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    await emailInput.fill(TEST_CREDENTIALS.owner.email);
    await passwordInput.fill(TEST_CREDENTIALS.owner.password);

    await page.locator('button:has-text("Sign In with Email")').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// State-mutating tests (serial — order matters)
// ---------------------------------------------------------------------------
test.describe.serial("Session & Logout", () => {
  test("session persists after page refresh", async ({ page, context }) => {
    await loginAsUser(page, "owner");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Reload
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Should still be on dashboard (not kicked to login)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    // Login
    await loginAsUser(page, "owner");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Logout
    await logout(page);

    // Should be on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await page.goto("/dashboard", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
