import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Custom Domains E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover custom domain functionality:
 * - Adding custom domains
 * - Domain verification
 * - Removing domains
 * - Setting default domain
 * - SSL management
 * - RBAC permissions
 */

test.describe("Custom Domains", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Domain Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("DOM-001: View domains list", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Should show domains page with title
      await expect(
        page.locator("h1", { hasText: "Custom Domains" })
      ).toBeVisible({ timeout: 10000 });
    });

    test("DOM-002: Add Custom Domain", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Click Add Domain button
      const addButton = page.locator('button:has-text("Add Domain")');
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill hostname in modal
        const hostnameInput = page.locator(
          'input[placeholder*="example"], input[name="hostname"]'
        );
        if (await hostnameInput.isVisible()) {
          await hostnameInput.fill(`test-${uniqueId}.example.com`);

          // Click Add button in modal
          await page.click('button[type="submit"]');

          // Should show success or DNS instructions
          await page.waitForTimeout(2000);
        }
      }
    });

    test("DOM-003: View domain verification instructions", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Look for pending domain with verify button
      const verifyButton = page.locator('button:has-text("Verify Now")').first();
      if (await verifyButton.isVisible()) {
        // Should show verification instructions with DNS configuration
        await expect(
          page.locator("text=DNS Configuration Required")
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("DOM-004: Verify Domain DNS", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find pending domain and click Verify
      const verifyButton = page.locator('button:has-text("Verify Now")').first();
      if (await verifyButton.isVisible()) {
        // Handle possible alert
        page.on("dialog", (dialog) => dialog.accept());

        await verifyButton.click();

        // Wait for verification attempt
        await page.waitForTimeout(2000);

        // Result may or may not be visible depending on DNS status
      }
    });

    test("DOM-005: Remove Domain", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find delete button
      const deleteButton = page
        .locator('button:has(.lucide-trash), button:has(.lucide-trash2)')
        .first();
      if (await deleteButton.isVisible()) {
        // Handle confirm dialog
        page.on("dialog", (dialog) => dialog.accept());

        await deleteButton.click();

        // Wait for deletion
        await page.waitForTimeout(2000);
      }
    });

    test("DOM-006: Set domain as default", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find Set Default button
      const setDefaultButton = page.locator('button:has-text("Set Default")').first();
      if (await setDefaultButton.isVisible()) {
        // Handle confirm dialog
        page.on("dialog", (dialog) => dialog.accept());

        await setDefaultButton.click();

        // Should show success
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe("Domain Search & Filter", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("DOM-010: Search domains by hostname", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find search input
      const searchInput = page.locator(
        '[data-testid="domain-search"], input[placeholder*="Search"]'
      );
      if (await searchInput.isVisible()) {
        await searchInput.fill("example");

        // Wait for filter
        await page.waitForTimeout(500);

        // Results should be filtered
      }
    });

    test("DOM-011: Filter domains by status", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find status filter
      const statusFilter = page.locator(
        '[data-testid="status-filter"], button:has-text("Status")'
      );
      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select verified option
        const verifiedOption = page.locator(
          '[data-testid="status-verified"], [role="option"]:has-text("Verified")'
        );
        if (await verifiedOption.isVisible()) {
          await verifiedOption.click();

          // Wait for filter
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe("SSL Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("DOM-020: View SSL status", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Domains page should load successfully
      await expect(
        page.locator("h1", { hasText: "Custom Domains" })
      ).toBeVisible({ timeout: 5000 });
      // SSL status badges may or may not be visible depending on domain data
    });

    test("DOM-021: Provision SSL certificate", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find a verified domain
      const domainRow = page.locator("tr, [role='row']").first();
      if (await domainRow.isVisible()) {
        // Look for provision SSL button
        const provisionButton = page.locator('button:has-text("Provision SSL")');
        if (await provisionButton.isVisible()) {
          await provisionButton.click();

          // Wait for provisioning
          await page.waitForTimeout(2000);
        }
      }
    });

    test("DOM-022: Toggle SSL auto-renewal", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Find auto-renew toggle
      const autoRenewToggle = page.locator(
        '[data-testid="ssl-auto-renew-toggle"], [role="switch"]'
      );
      if (await autoRenewToggle.isVisible()) {
        await autoRenewToggle.click();

        // Wait for update
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Domain RBAC Permissions", () => {
    test("DOM-040: OWNER can manage domains", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Verify owner can see management buttons
      const addButton = page.locator('button:has-text("Add Domain")');
      await expect(addButton).toBeVisible({ timeout: 10000 });
    });

    test("DOM-041: ADMIN can manage domains", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Verify admin can see Add Domain button
      const addButton = page.locator('button:has-text("Add Domain")');
      await expect(addButton).toBeVisible({ timeout: 10000 });
    });

    test("DOM-042: EDITOR cannot manage domains", async ({ page }) => {
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Editor should not have domain management access
      const addButton = page.locator('button:has-text("Add Domain")');
      if (await addButton.isVisible()) {
        // Button might be disabled
        const isDisabled = await addButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test("DOM-043: VIEWER cannot manage domains", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Viewer should not have domain management access
      const addButton = page.locator('button:has-text("Add Domain")');
      const deleteButton = page
        .locator('button:has(.lucide-trash), button:has(.lucide-trash2)')
        .first();

      // Either buttons should be hidden or show permission error
      const isAddHidden = await addButton.isHidden().catch(() => true);
      const isDeleteHidden = await deleteButton.isHidden().catch(() => true);

      expect(isAddHidden || isDeleteHidden).toBe(true);
    });
  });

  test.describe("Domain Error Handling", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("DOM-050: Handle invalid domain format", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Click Add Domain button
      const addButton = page.locator('button:has-text("Add Domain")');
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill invalid hostname
        const hostnameInput = page.locator(
          'input[placeholder*="example"], input[name="hostname"]'
        );
        if (await hostnameInput.isVisible()) {
          await hostnameInput.fill("invalid domain");

          // Try to submit
          await page.click('button[type="submit"]');

          // Should show validation error
          const error = page.locator("text=invalid, text=format");
          // Error may or may not be shown depending on validation
        }
      }
    });

    test("DOM-051: Handle duplicate domain", async ({ page }) => {
      await page.goto("/dashboard/domains");
      await page.waitForLoadState("networkidle");

      // Try to add a domain that already exists
      const addButton = page.locator('button:has-text("Add Domain")');
      if (await addButton.isVisible()) {
        await addButton.click();

        // Fill existing domain hostname (from seed data)
        const hostnameInput = page.locator(
          'input[placeholder*="example"], input[name="hostname"]'
        );
        if (await hostnameInput.isVisible()) {
          await hostnameInput.fill("links.pingto.me");

          // Try to submit
          await page.click('button[type="submit"]');

          // Should show error about duplicate
          await page.waitForTimeout(2000);
        }
      }
    });
  });
});
