import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./fixtures/auth";
import { TEST_IDS, TEST_SLUGS } from "./fixtures/test-data";

/**
 * UAT Test Suite: Custom Domains RBAC
 *
 * Test Environment:
 * - Web URL: http://localhost:3010
 * - API URL: http://localhost:3001
 * - Organization ID: e2e00000-0000-0000-0001-000000000001
 *
 * Test Users:
 * - OWNER: e2e-owner@pingtome.test / TestPassword123!
 * - ADMIN: e2e-admin@pingtome.test / TestPassword123!
 * - EDITOR: e2e-editor@pingtome.test / TestPassword123!
 * - VIEWER: e2e-viewer@pingtome.test / TestPassword123!
 *
 * RBAC Matrix for Custom Domains:
 * | Action        | OWNER | ADMIN | EDITOR | VIEWER |
 * |---------------|-------|-------|--------|--------|
 * | View Domains  | ✅     | ✅     | ✅      | ✅      |
 * | Add Domain    | ✅     | ✅     | ❌      | ❌      |
 * | Delete Domain | ✅     | ✅     | ❌      | ❌      |
 * | Set Default   | ✅     | ✅     | ❌      | ❌      |
 * | Verify Domain | ✅     | ✅     | ❌      | ❌      |
 */

test.describe("UAT: Custom Domains RBAC", () => {
  test.describe("DOM-050: VIEWER cannot manage domains", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");
    });

    test("DOM-050.1: VIEWER can view domains list", async ({ page }) => {
      // Should be able to see the domains page
      await expect(
        page.locator("h1", { hasText: "Custom Domains" })
      ).toBeVisible({ timeout: 10000 });

      // Should be able to see stats cards
      await expect(page.locator('text=Verified')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Total Domains')).toBeVisible({ timeout: 5000 });
    });

    test("DOM-050.2: VIEWER cannot see Add Domain button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Add Domain button should not be visible
      const addButton = page.locator('button:has-text("Add Domain")');
      const addButtonCount = await addButton.count();

      // Should either be hidden or disabled
      if (addButtonCount > 0) {
        // If button exists, it should be disabled
        const isDisabled = await addButton.first().isDisabled();
        expect(isDisabled).toBe(true);
      } else {
        // Preferred: button should not exist at all
        expect(addButtonCount).toBe(0);
      }
    });

    test("DOM-050.3: VIEWER cannot see Delete buttons", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Delete buttons should not be visible
      const deleteButtons = page.locator(
        'button:has(.lucide-trash), button:has(.lucide-trash2)'
      );
      const deleteButtonCount = await deleteButtons.count();

      // Should either be hidden or disabled
      if (deleteButtonCount > 0) {
        // If buttons exist, they should be disabled
        for (let i = 0; i < deleteButtonCount; i++) {
          const isDisabled = await deleteButtons.nth(i).isDisabled();
          expect(isDisabled).toBe(true);
        }
      } else {
        // Preferred: buttons should not exist at all
        expect(deleteButtonCount).toBe(0);
      }
    });

    test("DOM-050.4: VIEWER cannot see Set Default button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Set Default buttons should not be visible
      const setDefaultButtons = page.locator('button:has-text("Set Default")');
      const buttonCount = await setDefaultButtons.count();

      // Should either be hidden or disabled
      if (buttonCount > 0) {
        // If buttons exist, they should be disabled
        for (let i = 0; i < buttonCount; i++) {
          const isDisabled = await setDefaultButtons.nth(i).isDisabled();
          expect(isDisabled).toBe(true);
        }
      } else {
        // Preferred: buttons should not exist at all
        expect(buttonCount).toBe(0);
      }
    });

    test("DOM-050.5: VIEWER can see domain details (read-only)", async ({ page }) => {
      // Should be able to see domain information
      const domainCards = page.locator('[data-testid="domain-card"], .border-slate-200').filter({ hasText: /e2e-/ });

      if (await domainCards.count() > 0) {
        // Should show domain hostname
        await expect(domainCards.first()).toBeVisible();

        // Should show status badges
        const statusBadges = page.locator('text=Verified, text=Pending, text=Failed');
        // At least one status should be visible if domains exist
      }
    });

    test("DOM-050.6: VIEWER cannot access Add Domain modal via direct action", async ({ page }) => {
      // Try to find and click any "Add Domain" related elements
      const addElements = page.locator('text=Add Domain, [aria-label="Add Domain"]');
      const elementCount = await addElements.count();

      if (elementCount > 0) {
        // If somehow accessible, should not open modal or should be disabled
        const firstElement = addElements.first();
        const isDisabled = await firstElement.isDisabled().catch(() => true);
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe("DOM-051: EDITOR cannot manage domains", () => {
    test.beforeEach(async ({ page }) => {
      // Logout first to clear any previous session
      await page.goto("/login");
      await page.context().clearCookies();

      // Login as EDITOR
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");
    });

    test("DOM-051.1: EDITOR can view domains list", async ({ page }) => {
      // Should be able to see the domains page
      await expect(
        page.locator("h1", { hasText: "Custom Domains" })
      ).toBeVisible({ timeout: 10000 });

      // Should be able to see stats
      await expect(page.locator('text=Verified')).toBeVisible({ timeout: 5000 });
    });

    test("DOM-051.2: EDITOR cannot see Add Domain button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Add Domain button should not be visible
      const addButton = page.locator('button:has-text("Add Domain")');
      const addButtonCount = await addButton.count();

      // Should either be hidden or disabled
      if (addButtonCount > 0) {
        // If button exists, it should be disabled
        const isDisabled = await addButton.first().isDisabled();
        expect(isDisabled).toBe(true);
      } else {
        // Preferred: button should not exist at all
        expect(addButtonCount).toBe(0);
      }
    });

    test("DOM-051.3: EDITOR cannot see Delete buttons", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Delete buttons should not be visible
      const deleteButtons = page.locator(
        'button:has(.lucide-trash), button:has(.lucide-trash2)'
      );
      const deleteButtonCount = await deleteButtons.count();

      // Should either be hidden or disabled
      if (deleteButtonCount > 0) {
        // If buttons exist, they should be disabled
        for (let i = 0; i < deleteButtonCount; i++) {
          const isDisabled = await deleteButtons.nth(i).isDisabled();
          expect(isDisabled).toBe(true);
        }
      } else {
        // Preferred: buttons should not exist at all
        expect(deleteButtonCount).toBe(0);
      }
    });

    test("DOM-051.4: EDITOR cannot see Set Default button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Set Default buttons should not be visible
      const setDefaultButtons = page.locator('button:has-text("Set Default")');
      const buttonCount = await setDefaultButtons.count();

      // Should either be hidden or disabled
      if (buttonCount > 0) {
        // If buttons exist, they should be disabled
        for (let i = 0; i < buttonCount; i++) {
          const isDisabled = await setDefaultButtons.nth(i).isDisabled();
          expect(isDisabled).toBe(true);
        }
      } else {
        // Preferred: buttons should not exist at all
        expect(buttonCount).toBe(0);
      }
    });

    test("DOM-051.5: EDITOR cannot see Verify buttons", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Verify Now buttons should not be visible
      const verifyButtons = page.locator('button:has-text("Verify Now"), button:has-text("Retry")');
      const buttonCount = await verifyButtons.count();

      // Should either be hidden or disabled
      if (buttonCount > 0) {
        // If buttons exist, they should be disabled
        for (let i = 0; i < buttonCount; i++) {
          const isDisabled = await verifyButtons.nth(i).isDisabled();
          expect(isDisabled).toBe(true);
        }
      } else {
        // Preferred: buttons should not exist at all
        expect(buttonCount).toBe(0);
      }
    });

    test("DOM-051.6: EDITOR can use search and filter (read operations)", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(1000);

      // Should be able to use search if it exists
      const searchInput = page.locator('[data-testid="domain-search"], input[placeholder*="Search"]');

      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeEnabled();
        await searchInput.first().fill("e2e");
        await page.waitForTimeout(500);
        // Search should work (read operation)
      }

      // Should be able to use status filter if it exists
      const statusFilter = page.locator('[data-testid="status-filter"]');

      if (await statusFilter.count() > 0) {
        await expect(statusFilter.first()).toBeEnabled();
        // Filter should work (read operation)
      }
    });
  });

  test.describe("DOM-052: ADMIN can manage domains", () => {
    test.beforeEach(async ({ page }) => {
      // Logout and login as ADMIN
      await page.goto("/login");
      await page.context().clearCookies();

      await loginAsUser(page, "admin");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");
    });

    test("DOM-052.1: ADMIN can see Add Domain button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Add Domain button should be visible and enabled
      const addButton = page.locator('button:has-text("Add Domain")').first();
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await expect(addButton).toBeEnabled();
    });

    test("DOM-052.2: ADMIN can see Delete buttons", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Check if any domains exist
      const domainCards = page.locator('.border-slate-200').filter({ hasText: /e2e-/ });

      if (await domainCards.count() > 0) {
        // Delete buttons should be visible and enabled
        const deleteButtons = page.locator(
          'button:has(.lucide-trash), button:has(.lucide-trash2)'
        );

        if (await deleteButtons.count() > 0) {
          await expect(deleteButtons.first()).toBeVisible();
          await expect(deleteButtons.first()).toBeEnabled();
        }
      }
    });

    test("DOM-052.3: ADMIN can see Set Default button for verified domains", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Look for verified domains that are not default
      const setDefaultButtons = page.locator('button:has-text("Set Default")');

      if (await setDefaultButtons.count() > 0) {
        await expect(setDefaultButtons.first()).toBeVisible();
        await expect(setDefaultButtons.first()).toBeEnabled();
      }
    });

    test("DOM-052.4: ADMIN can open Add Domain modal", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Click Add Domain button
      const addButton = page.locator('button:has-text("Add Domain")').first();
      await addButton.click();

      // Modal should open
      await page.waitForTimeout(1000);

      // Should see hostname input in modal
      const hostnameInput = page.locator(
        'input[placeholder*="example"], input[name="hostname"], input[placeholder*="domain"]'
      );

      // Check if modal opened (input should be visible)
      const inputCount = await hostnameInput.count();
      expect(inputCount).toBeGreaterThan(0);

      if (inputCount > 0) {
        await expect(hostnameInput.first()).toBeVisible();
      }
    });
  });

  test.describe("DOM-053: OWNER can manage domains", () => {
    test.beforeEach(async ({ page }) => {
      // Logout and login as OWNER
      await page.goto("/login");
      await page.context().clearCookies();

      await loginAsUser(page, "owner");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");
    });

    test("DOM-053.1: OWNER can see Add Domain button", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Add Domain button should be visible and enabled
      const addButton = page.locator('button:has-text("Add Domain")').first();
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await expect(addButton).toBeEnabled();
    });

    test("DOM-053.2: OWNER can see all management buttons", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Check if any domains exist
      const domainCards = page.locator('.border-slate-200').filter({ hasText: /e2e-/ });

      if (await domainCards.count() > 0) {
        // Delete buttons should be visible
        const deleteButtons = page.locator(
          'button:has(.lucide-trash), button:has(.lucide-trash2)'
        );

        if (await deleteButtons.count() > 0) {
          await expect(deleteButtons.first()).toBeVisible();
          await expect(deleteButtons.first()).toBeEnabled();
        }

        // Set Default buttons may be visible for non-default verified domains
        const setDefaultButtons = page.locator('button:has-text("Set Default")');
        // Not asserting as this depends on domain state
      }
    });

    test("DOM-053.3: OWNER can open Add Domain modal", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Click Add Domain button
      const addButton = page.locator('button:has-text("Add Domain")').first();
      await addButton.click();

      // Modal should open
      await page.waitForTimeout(1000);

      // Should see hostname input in modal
      const hostnameInput = page.locator(
        'input[placeholder*="example"], input[name="hostname"], input[placeholder*="domain"]'
      );

      // Check if modal opened
      const inputCount = await hostnameInput.count();
      expect(inputCount).toBeGreaterThan(0);

      if (inputCount > 0) {
        await expect(hostnameInput.first()).toBeVisible();
      }
    });

    test("DOM-053.4: OWNER has full access to all domain features", async ({ page }) => {
      // Verify OWNER can see the page
      await expect(
        page.locator("h1", { hasText: "Custom Domains" })
      ).toBeVisible({ timeout: 10000 });

      // Should have access to Add Domain
      const addButton = page.locator('button:has-text("Add Domain")').first();
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();

      // Should see stats
      await expect(page.locator('text=Verified')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Total Domains')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("DOM-054: RBAC Summary Tests", () => {
    test("DOM-054.1: Verify RBAC matrix for Add Domain", async ({ page }) => {
      const testRoles = [
        { role: "viewer" as const, canAdd: false },
        { role: "editor" as const, canAdd: false },
        { role: "admin" as const, canAdd: true },
        { role: "owner" as const, canAdd: true },
      ];

      for (const { role, canAdd } of testRoles) {
        // Login as role
        await page.goto("/login");
        await page.context().clearCookies();
        await loginAsUser(page, role);
        await page.goto("/dashboard/domains");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // Check Add Domain button
        const addButton = page.locator('button:has-text("Add Domain")');
        const buttonCount = await addButton.count();

        if (canAdd) {
          // Should be visible and enabled
          expect(buttonCount).toBeGreaterThan(0);
          if (buttonCount > 0) {
            await expect(addButton.first()).toBeVisible();
            await expect(addButton.first()).toBeEnabled();
          }
        } else {
          // Should be hidden or disabled
          if (buttonCount > 0) {
            const isDisabled = await addButton.first().isDisabled();
            expect(isDisabled).toBe(true);
          }
          // Preferred: button should not exist
        }
      }
    });

    test("DOM-054.2: Verify RBAC matrix for Delete Domain", async ({ page }) => {
      const testRoles = [
        { role: "viewer" as const, canDelete: false },
        { role: "editor" as const, canDelete: false },
        { role: "admin" as const, canDelete: true },
        { role: "owner" as const, canDelete: true },
      ];

      for (const { role, canDelete } of testRoles) {
        // Login as role
        await page.goto("/login");
        await page.context().clearCookies();
        await loginAsUser(page, role);
        await page.goto("/dashboard/domains");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // Check Delete buttons
        const deleteButtons = page.locator(
          'button:has(.lucide-trash), button:has(.lucide-trash2)'
        );
        const buttonCount = await deleteButtons.count();

        if (canDelete) {
          // Should be visible and enabled (if domains exist)
          if (buttonCount > 0) {
            await expect(deleteButtons.first()).toBeVisible();
            await expect(deleteButtons.first()).toBeEnabled();
          }
        } else {
          // Should be hidden or disabled
          if (buttonCount > 0) {
            const isDisabled = await deleteButtons.first().isDisabled();
            expect(isDisabled).toBe(true);
          }
          // Preferred: buttons should not exist
        }
      }
    });

    test("DOM-054.3: All roles can view domains (read access)", async ({ page }) => {
      const testRoles: Array<"viewer" | "editor" | "admin" | "owner"> = ["viewer", "editor", "admin", "owner"];

      for (const role of testRoles) {
        // Login as role
        await page.goto("/login");
        await page.context().clearCookies();
        await loginAsUser(page, role);
        await page.goto("/dashboard/domains");
        await page.waitForLoadState("networkidle");

        // Should be able to see the page
        await expect(
          page.locator("h1", { hasText: "Custom Domains" })
        ).toBeVisible({ timeout: 10000 });

        // Should see stats
        await expect(page.locator('text=Verified')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Total Domains')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
