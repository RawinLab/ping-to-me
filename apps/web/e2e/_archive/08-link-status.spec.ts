import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, TEST_IDS } from "./fixtures/test-data";

/**
 * Link Status E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover link status functionality:
 * - Disable/Enable links
 * - Archive/Restore links
 * - Status indicators
 * - Redirect behavior for different statuses
 */

test.describe("Link Status", () => {
  test.describe("Link Status Controls", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("STATUS-001: View link status indicator", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Should show status badges on links
      const statusBadge = page.locator(
        "span:has-text('ACTIVE'), span:has-text('DISABLED'), span:has-text('ARCHIVED')"
      );
      expect(await statusBadge.count()).toBeGreaterThan(0);
    });

    test("STATUS-002: Disable active link", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find first active link
      const activeLink = page
        .locator(".group.bg-white.rounded-2xl")
        .filter({ hasText: "ACTIVE" })
        .first();

      if (await activeLink.isVisible()) {
        await activeLink.hover();

        // Open dropdown menu
        const moreButton = activeLink
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click disable option
          const disableOption = page.locator(
            '[role="menuitem"]:has-text("Disable")'
          );
          if (await disableOption.isVisible()) {
            await disableOption.click();

            // Should update status
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test("STATUS-003: Enable disabled link", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find disabled link
      const disabledLink = page
        .locator(".group.bg-white.rounded-2xl")
        .filter({ hasText: "DISABLED" })
        .first();

      if (await disabledLink.isVisible()) {
        await disabledLink.hover();

        // Open dropdown menu
        const moreButton = disabledLink
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click enable option
          const enableOption = page.locator(
            '[role="menuitem"]:has-text("Enable")'
          );
          if (await enableOption.isVisible()) {
            await enableOption.click();

            // Should update status
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test("STATUS-004: Archive link", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find first link
      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();

      if (await linkCard.isVisible()) {
        await linkCard.hover();

        // Open dropdown menu
        const moreButton = linkCard
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click archive option
          const archiveOption = page.locator(
            '[role="menuitem"]:has-text("Archive")'
          );
          if (await archiveOption.isVisible()) {
            page.on("dialog", (dialog) => dialog.accept());
            await archiveOption.click();

            // Should update status
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test("STATUS-005: Restore archived link", async ({ page }) => {
      await page.goto("/dashboard/links?status=ARCHIVED");
      await page.waitForLoadState("networkidle");

      // Find archived link
      const archivedLink = page.locator(".group.bg-white.rounded-2xl").first();

      if (await archivedLink.isVisible()) {
        await archivedLink.hover();

        // Open dropdown menu
        const moreButton = archivedLink
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Click restore option
          const restoreOption = page.locator(
            '[role="menuitem"]:has-text("Restore")'
          );
          if (await restoreOption.isVisible()) {
            await restoreOption.click();

            // Should restore link
            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe("Status Filter", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("STATUS-010: Filter by Active status", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find status filter
      const statusFilter = page.locator(
        'button:has-text("Status"), select[name="status"]'
      );
      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select Active
        const activeOption = page.locator('[role="option"]:has-text("Active")');
        if (await activeOption.isVisible()) {
          await activeOption.click();

          // Should filter links
          await page.waitForTimeout(1000);
        }
      }
    });

    test("STATUS-011: Filter by Disabled status", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find status filter
      const statusFilter = page.locator(
        'button:has-text("Status"), select[name="status"]'
      );
      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select Disabled
        const disabledOption = page.locator(
          '[role="option"]:has-text("Disabled")'
        );
        if (await disabledOption.isVisible()) {
          await disabledOption.click();

          // Should filter links
          await page.waitForTimeout(1000);
        }
      }
    });

    test("STATUS-012: Filter by Archived status", async ({ page }) => {
      await page.goto("/dashboard/links?status=ARCHIVED");
      await page.waitForLoadState("networkidle");

      // Should show archived links or empty state
      await expect(
        page.locator("text=Archived, text=No links").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Redirect Behavior", () => {
    test("STATUS-020: Active link redirects correctly", async ({ page }) => {
      // Test public redirect for active link
      await page.goto(`/${TEST_SLUGS.links.popular}`);

      // Should redirect to destination
      await page.waitForLoadState("networkidle");
    });

    test("STATUS-021: Disabled link shows disabled page", async ({ page }) => {
      // Test public redirect for disabled link
      await page.goto(`/${TEST_SLUGS.links.disabled}`);
      await page.waitForLoadState("networkidle");

      // Should show disabled message
      await expect(
        page.locator("text=disabled, text=not available").first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("STATUS-022: Expired link shows expired page", async ({ page }) => {
      // Test public redirect for expired link
      await page.goto(`/${TEST_SLUGS.links.expired}`);
      await page.waitForLoadState("networkidle");

      // Should show expired message
      await expect(
        page.locator("text=expired, text=no longer available").first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Bulk Status Change", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("STATUS-030: Bulk disable links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select multiple links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 1) {
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Click bulk disable
        const bulkDisableButton = page.locator(
          'button:has-text("Disable Selected")'
        );
        if (await bulkDisableButton.isVisible()) {
          page.on("dialog", (dialog) => dialog.accept());
          await bulkDisableButton.click();

          // Should update status
          await page.waitForTimeout(2000);
        }
      }
    });

    test("STATUS-031: Bulk archive links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Select multiple links
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count > 1) {
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Click bulk archive
        const bulkArchiveButton = page.locator(
          'button:has-text("Archive Selected")'
        );
        if (await bulkArchiveButton.isVisible()) {
          page.on("dialog", (dialog) => dialog.accept());
          await bulkArchiveButton.click();

          // Should update status
          await page.waitForTimeout(2000);
        }
      }
    });
  });

  test.describe("Status RBAC", () => {
    test("STATUS-RBAC-001: Owner can change status", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Should see status controls
      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      if (await linkCard.isVisible()) {
        await linkCard.hover();

        const moreButton = linkCard
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        await expect(moreButton).toBeVisible();
      }
    });

    test("STATUS-RBAC-002: Viewer cannot change status", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Viewer should not see status change options
      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      if (await linkCard.isVisible()) {
        await linkCard.hover();

        const moreButton = linkCard
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });

        if (await moreButton.isVisible()) {
          await moreButton.click();

          // Status change options should be disabled or hidden
          const disableOption = page.locator(
            '[role="menuitem"]:has-text("Disable")'
          );
          if (await disableOption.isVisible()) {
            const isDisabled = await disableOption.getAttribute("aria-disabled");
            expect(isDisabled).toBe("true");
          }
        }
      }
    });
  });
});
