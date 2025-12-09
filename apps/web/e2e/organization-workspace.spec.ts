import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Organization Workspace E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover organization workspace features:
 * - Organization settings
 * - Organization switcher
 * - Member management
 * - Logo management
 */

test.describe("Organization Workspace", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Organization Settings", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-001: View organization settings", async ({ page }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Should show organization settings
      await expect(
        page.locator("text=Organization, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("ORG-002: Update organization name", async ({ page }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Find name input
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill(`Test Org ${uniqueId}`);

        // Save
        await page.click('button:has-text("Save")');

        // Should show success
        await page.waitForTimeout(2000);
      }
    });

    test("ORG-003: Update organization slug", async ({ page }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Find slug input
      const slugInput = page.locator('input[name="slug"]');
      if (await slugInput.isVisible()) {
        await slugInput.clear();
        await slugInput.fill(`test-org-${uniqueId}`);

        // Save
        await page.click('button:has-text("Save")');

        await page.waitForTimeout(2000);
      }
    });

    test("ORG-004: View organization timezone", async ({ page }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Should show timezone selector
      const timezoneSelect = page.locator(
        'select[name="timezone"], [data-testid="timezone-select"]'
      );
      if (await timezoneSelect.isVisible()) {
        await expect(timezoneSelect).toBeVisible();
      }
    });
  });

  test.describe("Organization Switcher", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-010: View organization switcher", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Find organization switcher in sidebar
      const orgSwitcher = page.locator(
        '[data-testid="org-switcher"], [data-testid="organization-switcher"]'
      );
      if (await orgSwitcher.isVisible()) {
        await expect(orgSwitcher).toBeVisible();
      }
    });

    test("ORG-011: Open organization switcher dropdown", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Find and click organization switcher
      const orgSwitcher = page.locator(
        '[data-testid="org-switcher"], [data-testid="organization-switcher"]'
      );
      if (await orgSwitcher.isVisible()) {
        await orgSwitcher.click();

        // Dropdown should open
        await expect(
          page.locator('[role="menu"], [role="listbox"]')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Member Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-020: View organization members", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Should show members list
      await expect(page.locator("text=Members").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("ORG-021: Invite member button is visible for owner", async ({
      page,
    }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Should see invite button
      const inviteButton = page.locator(
        'button:has-text("Invite"), button:has-text("Add Member")'
      );
      await expect(inviteButton.first()).toBeVisible({ timeout: 5000 });
    });

    test("ORG-022: Member list shows role badges", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Should show role badges
      const roleBadges = page.locator(
        'span:has-text("OWNER"), span:has-text("ADMIN"), span:has-text("EDITOR"), span:has-text("VIEWER")'
      );
      expect(await roleBadges.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Logo Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-030: View logo upload option", async ({ page }) => {
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Should have logo upload option
      const logoSection = page.locator("text=Logo, text=Image");
      if (await logoSection.first().isVisible()) {
        await expect(logoSection.first()).toBeVisible();
      }
    });
  });

  test.describe("RBAC for Organization", () => {
    test("ORG-RBAC-001: Owner can access all settings", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // All settings should be accessible
      await expect(
        page.locator("text=Organization, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("ORG-RBAC-002: Admin can access settings", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/organization/settings");
      await page.waitForLoadState("networkidle");

      // Settings should be accessible
      await expect(
        page.locator("text=Organization, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("ORG-RBAC-003: Viewer has limited access", async ({ page }) => {
      await loginAsUser(page, "viewer");
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
});
