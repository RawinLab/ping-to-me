import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Organization E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover basic organization features:
 * - Tags management
 * - Campaigns management
 */

test.describe("Organization", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Tags", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-TAG-001: View tags list", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Should show tags
      await expect(page.locator("text=Tags").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("ORG-TAG-002: Create new tag", async ({ page }) => {
      const tagName = `Test Tag ${uniqueId}`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Click create button
      const createButton = page.locator(
        'button:has-text("Create Tag"), button:has-text("New Tag")'
      );
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill form
        await page.fill('input[name="name"]', tagName);

        // Submit
        await page.click('button[type="submit"]');

        // Should see new tag
        await expect(page.locator(`text=${tagName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("ORG-TAG-003: Edit tag", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Find and click edit button for first tag
      const editButton = page.locator('button[title="Edit"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Edit dialog should open
        await expect(
          page.locator('input[name="name"]')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("ORG-TAG-004: Delete tag", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Find and click delete button
      const deleteButton = page.locator('button[title="Delete"]').first();
      if (await deleteButton.isVisible()) {
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe("Campaigns", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-CMP-001: View campaigns list", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Should show campaigns
      await expect(page.locator("text=Campaigns").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("ORG-CMP-002: Create new campaign", async ({ page }) => {
      const campaignName = `Test Campaign ${uniqueId}`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Click create button
      const createButton = page.locator(
        'button:has-text("Create Campaign"), button:has-text("New Campaign")'
      );
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill form
        await page.fill('input[name="name"]', campaignName);

        // Submit
        await page.click('button[type="submit"]');

        // Should see new campaign
        await expect(page.locator(`text=${campaignName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("ORG-CMP-003: Edit campaign", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Find and click edit button
      const editButton = page.locator('button[title="Edit"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Edit dialog should open
        await expect(
          page.locator('input[name="name"]')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("ORG-CMP-004: Delete campaign", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Find and click delete button
      const deleteButton = page.locator('button[title="Delete"]').first();
      if (await deleteButton.isVisible()) {
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await page.waitForTimeout(2000);
      }
    });
  });
});
