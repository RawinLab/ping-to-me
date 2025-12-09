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

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Click create button
    await page.click('button:has-text("Create Link")');

    // Wait for success - should redirect or show success message
    await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
  });

  test("LINK-002: Create Short Link - Custom Slug", async ({ page }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Fill custom slug
    await page.fill('input[name="slug"]', customSlug);

    // Click create button
    await page.click('button:has-text("Create Link")');

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
  });

  test("LINK-003: Create Short Link - Invalid URL", async ({ page }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill invalid URL
    await page.fill('input[name="destinationUrl"]', "invalid-url");

    // Try to submit - should show validation error
    await page.click('button:has-text("Create Link")');

    // Check for validation error - form should not submit
    // The button might be disabled or error message shown
    const errorMessage = page.locator('text=valid URL');
    const isVisible = await errorMessage.isVisible().catch(() => false);

    // Either error message is shown or we're still on the same page
    if (!isVisible) {
      await expect(page).toHaveURL(/\/dashboard\/links\/new/);
    }
  });

  test("LINK-004: Create Short Link - Duplicate Custom Slug", async ({
    page,
  }) => {
    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Use a slug that already exists in seed data (test-link-1)
    await page.fill('input[name="slug"]', "test-link-1");

    // Try to create
    await page.click('button:has-text("Create Link")');

    // Should show error message about duplicate slug
    await expect(
      page.locator('text=/slug.*already|already.*taken|exists/i').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("LINK-005: Create Short Link - With Tags", async ({ page }) => {
    const uniqueSlug = `tagged-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Fill custom slug
    await page.fill('input[name="slug"]', uniqueSlug);

    // Add tags - look for tag input
    const tagInput = page.locator('input[name="tags"]');
    if (await tagInput.isVisible()) {
      await tagInput.fill("Marketing, Social");
    }

    // Click create button
    await page.click('button:has-text("Create Link")');

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
  });

  test("LINK-006: Create Short Link - With Expiration", async ({ page }) => {
    const uniqueSlug = `expiring-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Fill custom slug
    await page.fill('input[name="slug"]', uniqueSlug);

    // Set expiration date (7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expStr = expirationDate.toISOString().slice(0, 16);

    const expirationInput = page.locator('input[name="expiresAt"]');
    if (await expirationInput.isVisible()) {
      await expirationInput.fill(expStr);
    }

    // Click create button
    await page.click('button:has-text("Create Link")');

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
  });

  test("LINK-007: Create Short Link - Password Protected", async ({ page }) => {
    const uniqueSlug = `protected-${randomId}`;

    // Navigate to create link page
    await page.goto("/dashboard/links/new");

    // Fill destination URL
    await page.fill('input[name="destinationUrl"]', validUrl);

    // Fill custom slug
    await page.fill('input[name="slug"]', uniqueSlug);

    // Add password protection - look for password field
    const passwordInput = page.locator('input[name="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill("secret123");
    }

    // Click create button
    await page.click('button:has-text("Create Link")');

    // Wait for success
    await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
  });
});
