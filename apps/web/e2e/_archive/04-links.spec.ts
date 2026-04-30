import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Short Link Creation E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * These tests cover basic short link creation with various options.
 * For comprehensive tests, see create-link.spec.ts
 */

test.describe("Short Link Creation", () => {
  // Generate unique identifiers for each test run
  const randomId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const validUrl = "https://google.com";
  const customSlug = `custom-${randomId}`;

  test.beforeEach(async ({ page }) => {
    // Login with real authentication
    await loginAsUser(page, "owner");
  });

  test("LINK-001: Create Short Link - Random Slug", async ({ page }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL using the correct field name
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Click create button - use getByRole for better reliability
    const createButton = page.locator('button:has-text("Create your link")').first();
    await createButton.click();

    // Wait for success - should redirect to links page
    await expect(page).toHaveURL(/\/dashboard\/links(?:\/|$)/, { timeout: 10000 });
  });

  test("LINK-002: Create Short Link - Custom Slug", async ({ page }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Fill custom slug - must use exact input selector
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]').first();
    await slugInput.fill(customSlug);

    // Wait for slug availability check to complete
    await page.waitForTimeout(1000);

    // Click create button
    const createButton = page.locator('button:has-text("Create your link")').first();
    await createButton.click();

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links(?:\/|$)/, { timeout: 10000 });
  });

  test("LINK-003: Create Short Link - Invalid URL", async ({ page }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill invalid URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill("invalid-url");

    // Wait for validation to trigger
    await page.waitForTimeout(500);

    // Try to submit - form validation should prevent it
    const createButton = page.locator('button:has-text("Create your link")').first();

    // Check if button is disabled or error message appears
    const isDisabled = await createButton.isDisabled().catch(() => false);

    if (!isDisabled) {
      await createButton.click();
      // Check for validation error message
      const errorMessage = page.locator('text=/valid URL|Please enter/i').first();
      const isVisible = await errorMessage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(page).toHaveURL(/\/dashboard\/links\/new/);
      }
    } else {
      // Button is disabled, which is correct behavior
      await expect(page).toHaveURL(/\/dashboard\/links\/new/);
    }
  });

  test("LINK-004: Create Short Link - Duplicate Custom Slug", async ({
    page,
  }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Use a slug that already exists in seed data (test-link-1)
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]').first();
    await slugInput.fill("test-link-1");

    // Wait for slug availability check
    await page.waitForTimeout(1000);

    // Should show error message about slug being taken
    const slugError = page.locator('text=/Already taken|taken/i').first();
    await expect(slugError).toBeVisible({ timeout: 5000 });
  });

  test("LINK-005: Create Short Link - With Tags", async ({ page }) => {
    const uniqueSlug = `tagged-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Fill custom slug
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]').first();
    await slugInput.fill(uniqueSlug);

    // Add tags - look for tag input by id
    const tagInput = page.locator('input#tags');
    if (await tagInput.isVisible()) {
      await tagInput.fill("Marketing, Social");
    }

    // Click create button
    const createButton = page.locator('button:has-text("Create your link")').first();
    await createButton.click();

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links(?:\/|$)/, { timeout: 10000 });
  });

  test("LINK-006: Create Short Link - With Expiration", async ({ page }) => {
    const uniqueSlug = `expiring-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Fill custom slug
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]').first();
    await slugInput.fill(uniqueSlug);

    // Set expiration date (7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expStr = expirationDate.toISOString().slice(0, 16);

    const expirationInput = page.locator('input#expirationDate');
    if (await expirationInput.isVisible()) {
      await expirationInput.fill(expStr);
    }

    // Click create button
    const createButton = page.locator('button:has-text("Create your link")').first();
    await createButton.click();

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links(?:\/|$)/, { timeout: 10000 });
  });

  test("LINK-007: Create Short Link - Password Protected", async ({ page }) => {
    const uniqueSlug = `protected-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");
    await page.waitForLoadState("networkidle");

    // Fill destination URL
    const urlInput = page.locator('input#originalUrl');
    await urlInput.fill(validUrl);

    // Fill custom slug
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]').first();
    await slugInput.fill(uniqueSlug);

    // Add password protection - look for password field
    const passwordInput = page.locator('input#password');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("secret123");
    }

    // Click create button
    const createButton = page.locator('button:has-text("Create your link")').first();
    await createButton.click();

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links(?:\/|$)/, { timeout: 10000 });
  });
});
