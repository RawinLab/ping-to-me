import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../fixtures/test-helpers";
import { TEST_CREDENTIALS } from "../fixtures/test-data";
import { waitForApiResponse } from "../fixtures/test-helpers";

/**
 * Registration E2E Tests
 *
 * Tests the /register page UI, successful registration, validation errors,
 * duplicate email handling, and navigation links.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

// ---------------------------------------------------------------------------
// Page UI tests
// ---------------------------------------------------------------------------
test.describe("Registration Page", () => {
  test("displays name, email, and password fields on load", async ({ page }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for React hydration
    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // All three fields should be visible
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();

    // Submit button
    await expect(
      page.locator('button:has-text("Sign Up with Email")'),
    ).toBeVisible();

    // Page heading
    await expect(
      page.getByRole("heading", { name: /create an account/i }),
    ).toBeVisible();
  });

  test('shows link to login page with "Already have an account?" text', async ({
    page,
  }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    const loginLink = page.getByRole("link", {
      name: /already have an account/i,
    });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});

// ---------------------------------------------------------------------------
// Validation tests
// ---------------------------------------------------------------------------
test.describe("Registration Validation", () => {
  test("shows validation error for empty required fields", async ({ page }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    // Wait for form hydration
    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // Click sign up without filling anything — triggers validation
    await page.locator('button:has-text("Sign Up with Email")').click();

    // Zod should show inline error for email (required, invalid)
    await expect(page.getByText("Invalid email address")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    await page.locator('input[id="email"]').fill("invalid-email");
    await page.locator('input[id="password"]').fill("ValidPass123!");

    await page.locator("form").evaluate((el: HTMLFormElement) => {
      el.noValidate = true;
    });
    await page.locator('button:has-text("Sign Up with Email")').click();

    await expect(page.getByText("Invalid email address")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows validation error for password shorter than 8 characters", async ({
    page,
  }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // Fill valid email but short password
    await page.locator('input[id="email"]').fill(uniqueEmail());
    await page.locator('input[id="password"]').fill("short");

    // Trigger validation
    await page.locator('button:has-text("Sign Up with Email")').click();

    // Should show password length error
    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Successful registration
// ---------------------------------------------------------------------------
test.describe("Successful Registration", () => {
  test("registers with valid data and shows verification message", async ({
    page,
  }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    const email = uniqueEmail();

    // Fill the form
    await page.locator('input[id="email"]').fill(email);
    await page.locator('input[id="password"]').fill("TestPassword123!");
    await page.locator('input[id="name"]').fill("E2E Test User");

    // Submit and wait for API response
    const { status } = await waitForApiResponse(
      page,
      "/auth/register",
      "POST",
      async () => {
        await page
          .locator('button:has-text("Sign Up with Email")')
          .click();
      },
    );

    // API should accept the registration
    expect(status).toBeLessThan(400);

    // Success UI: green alert with verification message
    await expect(
      page.getByText(/registration successful/i),
    ).toBeVisible({ timeout: 10000 });

    // "Back to Login" link should appear after success
    await expect(
      page.getByRole("link", { name: /back to login/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Duplicate email
// ---------------------------------------------------------------------------
test.describe("Duplicate Email Registration", () => {
  test("shows error when registering with an existing email", async ({
    page,
  }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // Use the seeded owner email which already exists
    await page.locator('input[id="email"]').fill(TEST_CREDENTIALS.owner.email);
    await page
      .locator('input[id="password"]')
      .fill(TEST_CREDENTIALS.owner.password);

    // Submit and wait for API response
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/auth/register"),
      { timeout: 10000 },
    );

    await page.locator('button:has-text("Sign Up with Email")').click();
    await responsePromise;

    // Should show a destructive alert with an error about existing email
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // The alert should mention something about the email already existing
    await expect(
      page.getByText(/already|exist|in use/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
test.describe("Registration Page Navigation", () => {
  test('"Already have an account?" link navigates to login page', async ({
    page,
  }) => {
    await page.goto("/register", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    await page
      .getByRole("link", { name: /already have an account/i })
      .click();

    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
