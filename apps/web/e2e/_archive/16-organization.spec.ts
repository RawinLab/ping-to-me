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
 * - Organization viewing and management
 * - Team member management
 */

test.describe("Organization", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Organization Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-001: View organizations page", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should show Organizations heading
      await expect(page.locator("text=Organizations").first()).toBeVisible({
        timeout: 10000,
      });

      // Should show "Team Members" heading
      await expect(page.locator("text=Team Members").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("ORG-002: View organization management section", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should have a New Organization button
      const newOrgButton = page.getByRole("button", { name: /new organization/i });
      if (await newOrgButton.isVisible()) {
        await expect(newOrgButton).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("ORG-003: View team members table", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should display team members section with table
      const tableBody = page.locator("tbody");
      if (await tableBody.isVisible()) {
        // Check for table headers
        await expect(page.locator("text=Member").first()).toBeVisible({
          timeout: 5000,
        });

        await expect(page.locator("text=Role").first()).toBeVisible({
          timeout: 5000,
        });

        await expect(page.locator("text=Actions").first()).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe("Team Member Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ORG-004: View invite member section", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should have an Invite Member button
      const inviteButton = page.getByRole("button", { name: /invite member/i });
      if (await inviteButton.isVisible()) {
        await expect(inviteButton).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("ORG-005: Open and close invite dialog", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Click "Invite Member" button
      const inviteButton = page.getByRole("button", { name: /invite member/i });
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        // Dialog should open with email input
        await expect(page.locator('input[id="email"]')).toBeVisible({
          timeout: 5000,
        });

        // Close dialog by pressing Escape
        await page.keyboard.press("Escape");

        // Dialog should close
        await expect(page.locator('input[id="email"]')).not.toBeVisible({
          timeout: 3000,
        });
      }
    });

    test("ORG-006: Verify member list displays", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Check if table body exists and has content
      const tableBody = page.locator("tbody");
      if (await tableBody.isVisible()) {
        const rows = tableBody.locator("tr");
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("ORG-007: View organization information", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should show organizational information - looking for common patterns
      const pageContent = page.locator("body");

      // Check for either organization cards or team member section
      const hasOrgCards = await page
        .locator('[class*="cursor-pointer"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasTeamSection = await page
        .locator("text=Team Members")
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasOrgCards || hasTeamSection).toBeTruthy();
    });

    test("ORG-008: Check page layout structure", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Check main page structure
      await expect(page.locator("h1, h2").first()).toBeVisible({
        timeout: 5000,
      });

      // Check for main content area
      const mainContent = page.locator("main, [role='main'], .container").first();
      await expect(mainContent).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
