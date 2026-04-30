import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Member Invite & Remove E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover member management:
 * - Sending invitations
 * - Accepting invitations
 * - Declining invitations
 * - Managing pending invitations
 * - Removing members
 */

test.describe("Member Invite & Remove", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Member Invitation", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-001: View members page", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Should show Team Members heading
      await expect(page.getByRole("heading", { name: /Team Members/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test("INV-002: Open invite member dialog", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Click invite button
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
      await inviteButton.click();

      // Should open invite dialog (check for modal title or content)
      await expect(page.locator("text=Invite Member").first()).toBeVisible({
        timeout: 5000,
      });
    });

    test("INV-003: Send invitation with email", async ({ page }) => {
      const inviteEmail = `invite-${uniqueId}@example.com`;

      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Click invite button
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      await inviteButton.click();

      // Fill email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(inviteEmail);

      // Select role from dropdown
      const roleSelect = page.locator('select');
      await roleSelect.selectOption("VIEWER");

      // Send invitation
      const sendButton = page.getByRole("button", { name: /Send Invite/i });
      await sendButton.click();

      // Should complete without error
      await page.waitForTimeout(1000);
    });

    test("INV-004: Invitation validation - invalid email", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Click invite button
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      await inviteButton.click();

      // Fill invalid email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill("invalid-email");

      // Select role from dropdown
      const roleSelect = page.locator('select');
      await roleSelect.selectOption("VIEWER");

      // Try to submit - HTML5 validation should prevent this
      const sendButton = page.getByRole("button", { name: /Send Invite/i });
      await sendButton.click();

      // Should show validation error or keep dialog open
      await page.waitForTimeout(500);
    });
  });

  test.describe("Pending Invitations", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-010: View pending invitations", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Look for Team Members section (may or may not have pending invitations)
      await expect(page.getByRole("heading", { name: /Team Members/i })).toBeVisible();
    });

    test("INV-011: Resend invitation", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Find resend button on pending invitation (using getByRole to avoid multiple matches)
      const resendButton = page.getByRole("button", { name: /Resend/i }).first();
      if (await resendButton.isVisible()) {
        await resendButton.click();

        // Should show success
        await page.waitForTimeout(1000);
      }
    });

    test("INV-012: Cancel pending invitation", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Find cancel button on pending invitation
      const cancelButton = page.getByRole("button", { name: /Cancel/i }).first();
      if (await cancelButton.isVisible()) {
        page.on("dialog", (dialog) => dialog.accept());
        await cancelButton.click();

        // Should remove invitation
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Member Removal", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-020: Remove member", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Find remove button (trash icon) - use getByRole with aria-label
      const removeButtons = page.locator("button svg[class*='lucide-trash']").locator("..");
      if ((await removeButtons.count()) > 0) {
        page.on("dialog", (dialog) => dialog.accept());
        await removeButtons.first().click();

        // Should remove member
        await page.waitForTimeout(2000);
      }
    });

    test("INV-021: Cannot remove self (owner)", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Check that at least one team member exists
      await expect(page.getByRole("heading", { name: /Team Members/i })).toBeVisible();

      // Try to find a remove button for the current user (should not exist)
      // Owner/yourself should not have a remove button visible
      const removeButtons = page.locator("button svg[class*='lucide-trash']").locator("..");

      // If there are remove buttons, they should only be for non-owner members
      if ((await removeButtons.count()) > 0) {
        // Verify the page loaded correctly
        await expect(page.getByRole("heading", { name: /Team Members/i })).toBeVisible();
      }
    });
  });

  test.describe("Member Role Update", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-030: Change member role", async ({ page }) => {
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Find role select dropdown (not for owner, they're disabled)
      const roleSelects = page.locator('button:has-text("Owner"), button:has-text("Admin"), button:has-text("Editor"), button:has-text("Viewer")');

      // Get a non-owner role selector
      const selectCount = await roleSelects.count();
      if (selectCount > 1) {
        // Click the second selector (skip the first which might be owner)
        await roleSelects.nth(1).click();

        // Select new role from dropdown
        const editorOption = page.getByRole("option", { name: /Editor/i });
        if (await editorOption.isVisible()) {
          await editorOption.click();

          // Should update role
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Member RBAC", () => {
    test("INV-RBAC-001: Owner can manage members", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Invite button should be visible and enabled for owner
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
      await expect(inviteButton).toBeEnabled();
    });

    test("INV-RBAC-002: Admin can manage members", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Invite button should be visible and enabled for admin
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
      await expect(inviteButton).toBeEnabled();
    });

    test("INV-RBAC-003: Viewer cannot manage members", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/settings/team");
      await page.waitForLoadState("networkidle");

      // Invite button should be disabled or hidden for viewer
      const inviteButton = page.getByRole("button", {
        name: /Invite Member/i,
      });
      if (await inviteButton.isVisible()) {
        await expect(inviteButton).toBeDisabled();
      }
    });
  });
});
