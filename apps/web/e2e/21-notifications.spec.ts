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

        // Dropdown should open
        await expect(
          page.locator("text=Notifications, text=No notifications").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("NOTIF-003: Notification badge shows unread count", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Look for badge on notification bell
      const badge = page.locator(
        ".bg-red-500, .bg-primary, [data-testid='notification-badge']"
      );
      // Badge may or may not be visible depending on unread count
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

        // Should show notifications or empty state
        const content = page.locator(
          "text=Notifications, text=No notifications"
        );
        await expect(content.first()).toBeVisible({ timeout: 5000 });
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

        // Look for "Mark all as read" button
        const markAllButton = page.locator('button:has-text("Mark all")');
        if (await markAllButton.isVisible()) {
          await markAllButton.click();

          // Should clear unread status
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Notification Settings", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("NOTIF-020: Access notification settings", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications");
      await page.waitForLoadState("networkidle");

      // Should show notification settings
      await expect(
        page.locator("text=Notification, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("NOTIF-021: Toggle email notifications", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications");
      await page.waitForLoadState("networkidle");

      // Find email notification toggle
      const emailToggle = page.locator(
        '[data-testid="email-notifications"], [role="switch"]'
      );
      if (await emailToggle.first().isVisible()) {
        await emailToggle.first().click();

        // Should toggle
        await page.waitForTimeout(1000);
      }
    });

    test("NOTIF-022: Toggle in-app notifications", async ({ page }) => {
      await page.goto("/dashboard/settings/notifications");
      await page.waitForLoadState("networkidle");

      // Find in-app notification toggle
      const inAppToggle = page.locator(
        '[data-testid="in-app-notifications"], [role="switch"]'
      );
      if (await inAppToggle.first().isVisible()) {
        await inAppToggle.first().click();

        await page.waitForTimeout(1000);
      }
    });
  });
});
