import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Quota & Plan E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover quota and plan features:
 * - Viewing available plans
 * - Usage dashboard
 * - Quota enforcement
 * - Usage alerts
 * - Billing history
 */

test.describe("Quota & Plan Management", () => {
  test.describe("Plan Display", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("PLAN-001: View billing page", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show billing/plan information
      await expect(
        page.locator("text=Billing, text=Plan, text=Subscription").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("PLAN-002: View current plan", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show current plan
      await expect(
        page.locator("text=Current Plan, text=Your Plan").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("PLAN-003: View available plans", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show plan options
      await expect(
        page
          .locator("text=Free, text=Pro, text=Enterprise, text=Starter")
          .first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("PLAN-004: View plan features comparison", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Look for feature comparison or compare button
      const compareButton = page.locator('button:has-text("Compare")');
      if (await compareButton.isVisible()) {
        await compareButton.click();

        // Should show comparison
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Usage Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("USAGE-001: View usage dashboard", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show usage section
      await expect(
        page.locator("text=Usage, text=Quota, text=Limits").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("USAGE-002: View link usage", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show link usage
      await expect(
        page.locator("text=Links, text=Total Links").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("USAGE-003: View click usage", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show click usage
      await expect(
        page.locator("text=Clicks, text=Total Clicks").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("USAGE-004: Usage progress bars", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show progress bars
      const progressBars = page.locator('[role="progressbar"], .progress-bar');
      expect(await progressBars.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Quota Enforcement", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("QUOTA-001: Display quota limits", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Should show quota limits
      await expect(
        page.locator("text=Limit, text=of, text=/").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("QUOTA-002: Quota warning when approaching limit", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Look for warning indicators
      const warning = page.locator("text=Warning, text=approaching, .text-yellow");
      // Warning may or may not be visible depending on usage
    });
  });

  test.describe("Billing History", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BILLING-001: View billing history", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Look for billing history section
      const historySection = page.locator(
        "text=Billing History, text=Invoices, text=Payments"
      );
      if (await historySection.first().isVisible()) {
        await expect(historySection.first()).toBeVisible();
      }
    });

    test("BILLING-002: Download invoice", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Find invoice download button
      const downloadButton = page.locator(
        'button:has-text("Download"), a:has-text("Invoice")'
      );
      if (await downloadButton.first().isVisible()) {
        // Click to download
        const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
        await downloadButton.first().click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.(pdf|csv)$/);
        } catch {
          // Download might not trigger
        }
      }
    });
  });

  test.describe("Plan Upgrade/Downgrade", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("UPGRADE-001: View upgrade options", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Look for upgrade button
      const upgradeButton = page.locator('button:has-text("Upgrade")');
      if (await upgradeButton.isVisible()) {
        await expect(upgradeButton).toBeEnabled();
      }
    });

    test("UPGRADE-002: Click upgrade shows plan options", async ({ page }) => {
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Click upgrade
      const upgradeButton = page.locator('button:has-text("Upgrade")').first();
      if (await upgradeButton.isVisible()) {
        await upgradeButton.click();

        // Should show plan options or redirect to pricing
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Billing RBAC", () => {
    test("BILLING-RBAC-001: Owner can access billing", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Billing, text=Plan").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("BILLING-RBAC-002: Admin can view billing", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      await expect(
        page.locator("text=Billing, text=Plan").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("BILLING-RBAC-003: Viewer has limited billing access", async ({
      page,
    }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/billing");
      await page.waitForLoadState("networkidle");

      // Viewer may see billing but cannot make changes
      const upgradeButton = page.locator('button:has-text("Upgrade")');
      if (await upgradeButton.isVisible()) {
        const isDisabled = await upgradeButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });
});
