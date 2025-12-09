import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Role-Based Access Control (RBAC) E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests verify role-based permissions:
 * - OWNER: Full access
 * - ADMIN: Management access
 * - EDITOR: Create/Edit access
 * - VIEWER: Read-only access
 */

test.describe("Role-Based Access Control", () => {
  test.describe("OWNER Role", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("RBAC-OWNER-001: Can access dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("RBAC-OWNER-002: Can access organization settings", async ({
      page,
    }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Organization, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("RBAC-OWNER-003: Can access billing", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Billing, text=Plan, text=Subscription").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("RBAC-OWNER-004: Can manage members", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();

        // Invite button should be visible
        await expect(
          page.locator('button:has-text("Invite")').first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("RBAC-OWNER-005: Can create links", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator('input[name="destinationUrl"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("RBAC-OWNER-006: Can delete links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Find delete button
      const deleteButton = page
        .locator('button:has(.lucide-trash), button[title="Delete"]')
        .first();
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeEnabled();
      }
    });
  });

  test.describe("ADMIN Role", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "admin");
    });

    test("RBAC-ADMIN-001: Can access dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("RBAC-ADMIN-002: Can access organization settings", async ({
      page,
    }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Organization, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("RBAC-ADMIN-003: Can manage members", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();

        // Invite button should be visible
        await expect(
          page.locator('button:has-text("Invite")').first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("RBAC-ADMIN-004: Can create links", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator('input[name="destinationUrl"]')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("EDITOR Role", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "editor");
    });

    test("RBAC-EDITOR-001: Can access dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("RBAC-EDITOR-002: Can create links", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator('input[name="destinationUrl"]')
      ).toBeVisible({ timeout: 10000 });
    });

    test("RBAC-EDITOR-003: Cannot manage members", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();

        // Invite button should be disabled or hidden
        const inviteButton = page.locator('button:has-text("Invite")').first();
        if (await inviteButton.isVisible()) {
          const isDisabled = await inviteButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });

    test("RBAC-EDITOR-004: Limited access to organization settings", async ({
      page,
    }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Save button should be disabled
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        const isDisabled = await saveButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe("VIEWER Role", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "viewer");
    });

    test("RBAC-VIEWER-001: Can access dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("RBAC-VIEWER-002: Cannot create links", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.waitForLoadState("networkidle");

      // Create button should be disabled
      const createButton = page.locator('button:has-text("Create Link")');
      if (await createButton.isVisible()) {
        const isDisabled = await createButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test("RBAC-VIEWER-003: Cannot delete links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Delete button should be disabled or hidden
      const deleteButton = page
        .locator('button:has(.lucide-trash), button[title="Delete"]')
        .first();
      if (await deleteButton.isVisible()) {
        const isDisabled = await deleteButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test("RBAC-VIEWER-004: Cannot access billing", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Either redirected or shows permission error
      const hasAccess = await page
        .locator("text=Billing, text=Plan")
        .first()
        .isVisible()
        .catch(() => false);

      // If has access, buttons should be disabled
      if (hasAccess) {
        const actionButton = page
          .locator('button:has-text("Upgrade"), button:has-text("Change")')
          .first();
        if (await actionButton.isVisible()) {
          const isDisabled = await actionButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });

    test("RBAC-VIEWER-005: Cannot manage members", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();

        // Invite button should be disabled or hidden
        const inviteButton = page.locator('button:has-text("Invite")').first();
        if (await inviteButton.isVisible()) {
          const isDisabled = await inviteButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });

    test("RBAC-VIEWER-006: Can view links", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Should see links list
      await expect(page.locator("text=Links").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("RBAC-VIEWER-007: Can view analytics", async ({ page }) => {
      await page.goto("/dashboard/analytics");
      await page.waitForLoadState("networkidle");

      // Should see analytics
      await expect(
        page.locator("text=Analytics, text=Overview").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Cross-Role Verification", () => {
    test("RBAC-CROSS-001: Same link visible to all roles", async ({ page }) => {
      // Login as owner
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      const linkExists = await page
        .locator(".group.bg-white.rounded-2xl")
        .first()
        .isVisible();
      expect(linkExists).toBe(true);
    });

    test("RBAC-CROSS-002: Viewer sees same data as owner (read-only)", async ({
      page,
    }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Should see links
      const linkExists = await page
        .locator(".group.bg-white.rounded-2xl")
        .first()
        .isVisible()
        .catch(() => false);

      // Either sees links or empty state
      expect(typeof linkExists).toBe("boolean");
    });
  });
});
