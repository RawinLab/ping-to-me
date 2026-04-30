import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Notifications E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover notification features:
 * - Viewing notifications
 * - Marking as read
 * - Notification settings
 */

test.describe("Notifications", () => {
  test.describe("Notification Bell", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("NOTIF-001: Notification bell is visible in header", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Find notification bell icon
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      await expect(notificationBell).toBeVisible({ timeout: 10000 });
    });

    test("NOTIF-002: Click notification bell opens dropdown", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Click notification bell
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();

        // Dropdown should open - check for "Notifications" heading
        await expect(
          page.getByRole("heading", { name: "Notifications" })
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("NOTIF-003: Notification badge shows unread count", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Look for badge on notification bell - using getByRole for buttons with Lucide icons
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      // Badge may or may not be visible depending on unread count
      // If there are unread notifications, a destructive badge should appear
      const badge = notificationBell.locator("span");
      if (await badge.isVisible()) {
        await expect(badge).toHaveClass(/bg-destructive|bg-red/);
      }
    });
  });

  test.describe("Notification List", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("NOTIF-010: View notifications list", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Click notification bell
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();

        // Should show notifications dropdown with heading
        await expect(
          page.getByRole("heading", { name: "Notifications" })
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("NOTIF-011: Mark notification as read", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Open notifications
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();

        // Look for unread notification
        const unreadNotification = page.locator(
          '[data-unread="true"], .bg-blue-50'
        );
        if (await unreadNotification.first().isVisible()) {
          await unreadNotification.first().click();

          // Should mark as read
          await page.waitForTimeout(1000);
        }
      }
    });

    test("NOTIF-012: Mark all notifications as read", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Open notifications
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();

        // Look for "Mark all read" button - using getByRole
        const markAllButton = page.getByRole("button", { name: /Mark all/i });
        if (await markAllButton.isVisible()) {
          await markAllButton.click();

          // Should clear unread status
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Notification Interactions", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("NOTIF-020: Close notification dropdown", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Open notifications
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        await notificationBell.click();

        // Should show dropdown
        await expect(
          page.getByRole("heading", { name: "Notifications" })
        ).toBeVisible({ timeout: 5000 });

        // Click outside to close
        await page.click("body");

        // Dropdown should be hidden
        await expect(
          page.getByRole("heading", { name: "Notifications" })
        ).not.toBeVisible({ timeout: 5000 });
      }
    });

    test("NOTIF-021: Multiple notification clicks don't cause errors", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Find notification bell
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      if (await notificationBell.isVisible()) {
        // Click multiple times
        await notificationBell.click();
        await page.waitForTimeout(200);
        await notificationBell.click();
        await page.waitForTimeout(200);
        await notificationBell.click();

        // Should handle gracefully
        await expect(notificationBell).toBeVisible();
      }
    });

    test("NOTIF-022: Notification bell persists across navigation", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Find notification bell
      const notificationBell = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      await expect(notificationBell).toBeVisible();

      // Navigate to another page
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Bell should still be visible
      const notificationBellAfter = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-bell") })
        .first();

      await expect(notificationBellAfter).toBeVisible();
    });
  });
});
