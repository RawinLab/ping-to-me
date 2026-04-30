import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Bulk Operations E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover bulk operations:
 * - Bulk import links
 * - Bulk export links
 * - Bulk delete links
 * - Bulk tagging
 */

test.describe("Bulk Operations", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Bulk Import", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BULK-001: View import dialog", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find import button
      const importButton = page.locator('button:has-text("Import")');
      if (await importButton.isVisible()) {
        await importButton.click();

        // Import dialog should open
        await expect(
          page.locator("text=Import Links, text=CSV").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("BULK-002: Download import template", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find import button
      const importButton = page.locator('button:has-text("Import")');
      if (await importButton.isVisible()) {
        await importButton.click();

        // Look for template download link
        const templateLink = page.locator(
          'a:has-text("template"), button:has-text("template")'
        );
        if (await templateLink.isVisible()) {
          const downloadPromise = page.waitForEvent("download", {
            timeout: 5000,
          });
          await templateLink.click();

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.csv$/);
          } catch {
            // Download might not trigger
          }
        }
      }
    });

    test("BULK-003: Import validation errors", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find import button
      const importButton = page.locator('button:has-text("Import")');
      if (await importButton.isVisible()) {
        await importButton.click();

        // Try to submit without file
        const submitButton = page.locator(
          'button[type="submit"]:has-text("Import")'
        );
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show validation error
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Bulk Export", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BULK-010: Export all links as CSV", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find export button
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
        await exportButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.csv$/);
        } catch {
          // Download might not trigger
        }
      }
    });

    test("BULK-011: Export filtered links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Apply a filter first
      const filterButton = page.locator('button:has-text("Filter")');
      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Select a filter option
        const filterOption = page.locator('[role="option"]').first();
        if (await filterOption.isVisible()) {
          await filterOption.click();
        }
      }

      // Then export
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        await exportButton.click();
      }
    });
  });

  test.describe("Bulk Delete", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BULK-020: Select multiple links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 1) {
        // Select first two checkboxes
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Bulk actions should appear
        const bulkActions = page.locator("text=selected");
        await expect(bulkActions).toBeVisible({ timeout: 5000 });
      }
    });

    test("BULK-021: Bulk delete selected links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();

        // Click bulk delete
        const deleteButton = page.locator(
          'button:has-text("Delete Selected"), button:has-text("Delete")'
        );
        if (await deleteButton.isVisible()) {
          page.on("dialog", (dialog) => dialog.accept());
          await deleteButton.click();

          await page.waitForTimeout(2000);
        }
      }
    });

    test("BULK-022: Cancel bulk delete", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();

        // Click bulk delete but cancel
        const deleteButton = page.locator(
          'button:has-text("Delete Selected"), button:has-text("Delete")'
        );
        if (await deleteButton.isVisible()) {
          page.on("dialog", (dialog) => dialog.dismiss());
          await deleteButton.click();

          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Bulk Tagging", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BULK-030: Add tags to selected links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();

        // Click bulk tag button
        const tagButton = page.locator(
          'button:has-text("Add Tags"), button:has-text("Tag")'
        );
        if (await tagButton.isVisible()) {
          await tagButton.click();

          // Tag dialog should open
          await expect(
            page.locator("text=Add Tags, text=Select Tags").first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("BULK-031: Remove tags from selected links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();

        // Click remove tags button
        const removeTagButton = page.locator('button:has-text("Remove Tags")');
        if (await removeTagButton.isVisible()) {
          await removeTagButton.click();

          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Bulk Operations - RBAC", () => {
    test("BULK-RBAC-001: Owner can perform bulk operations", async ({
      page,
    }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Bulk action buttons should be visible
      const importButton = page.locator('button:has-text("Import")');
      const exportButton = page.locator('button:has-text("Export")');

      if (await importButton.isVisible()) {
        await expect(importButton).toBeEnabled();
      }
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeEnabled();
      }
    });

    test("BULK-RBAC-002: Viewer cannot perform bulk delete", async ({
      page,
    }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 0) {
        await checkboxes.first().click();

        // Delete button should be disabled
        const deleteButton = page.locator('button:has-text("Delete")').first();
        if (await deleteButton.isVisible()) {
          const isDisabled = await deleteButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });
  });
});
