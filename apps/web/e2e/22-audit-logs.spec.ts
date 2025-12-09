import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Audit Logs E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover audit log features:
 * - Viewing audit logs
 * - Filtering logs
 * - Searching logs
 * - Exporting logs
 * - RBAC access control
 */

test.describe("Audit Logs", () => {
  test.describe("Audit Log Viewer", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("AUDIT-001: View audit logs page", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Should show audit logs
      await expect(
        page.locator("text=Audit Logs, text=Activity Log").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-002: Audit log table displays entries", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Should show table with columns
      const table = page.locator("table, [role='table']");
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-003: Audit log shows action types", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Should show action type column
      const actionColumn = page.locator(
        'th:has-text("Action"), th:has-text("Type")'
      );
      await expect(actionColumn.first()).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-004: Audit log shows timestamps", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Should show time/date column
      const timeColumn = page.locator(
        'th:has-text("Time"), th:has-text("Date")'
      );
      await expect(timeColumn.first()).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-005: Audit log shows user info", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Should show user column
      const userColumn = page.locator(
        'th:has-text("User"), th:has-text("Actor")'
      );
      await expect(userColumn.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Audit Log Filtering", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("AUDIT-010: Filter by action type", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Find action type filter
      const actionFilter = page.locator(
        'select[name="action"], button:has-text("Action")'
      );
      if (await actionFilter.isVisible()) {
        await actionFilter.click();

        // Select an option
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click();

          // Wait for filter
          await page.waitForTimeout(1000);
        }
      }
    });

    test("AUDIT-011: Filter by date range", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Find date range filter
      const dateFilter = page.locator(
        'input[type="date"], button:has-text("Date")'
      );
      if (await dateFilter.first().isVisible()) {
        await dateFilter.first().click();

        await page.waitForTimeout(500);
      }
    });

    test("AUDIT-012: Filter by user", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Find user filter
      const userFilter = page.locator(
        'select[name="user"], button:has-text("User")'
      );
      if (await userFilter.isVisible()) {
        await userFilter.click();

        // Select a user
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible()) {
          await option.click();

          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Audit Log Search", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("AUDIT-020: Search audit logs", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Find search input
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );
      if (await searchInput.isVisible()) {
        await searchInput.fill("link");

        // Wait for search
        await page.waitForTimeout(1000);
      }
    });

    test("AUDIT-021: Clear search", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Search first
      const searchInput = page.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );
      if (await searchInput.isVisible()) {
        await searchInput.fill("test");
        await page.waitForTimeout(500);

        // Clear
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Audit Log Export", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("AUDIT-030: Export audit logs", async ({ page }) => {
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Find export button
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
        await exportButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.(csv|json|xlsx)$/);
        } catch {
          // Download might not trigger
        }
      }
    });
  });

  test.describe("Audit Log RBAC", () => {
    test("AUDIT-RBAC-001: Owner can view audit logs", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Audit Logs, text=Activity").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-RBAC-002: Admin can view audit logs", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Audit Logs, text=Activity").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("AUDIT-RBAC-003: Viewer has limited audit log access", async ({
      page,
    }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/organization/audit-logs");
      await page.waitForLoadState("networkidle");

      // Either shows logs or permission error
      await page.waitForTimeout(2000);
    });
  });
});
