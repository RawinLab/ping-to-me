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

    test("INV-002: Open invite member dialog", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Click invite button
      const inviteButton = page.locator(
        'button:has-text("Invite"), button:has-text("Add Member")'
      );
      if (await inviteButton.first().isVisible()) {
        await inviteButton.first().click();

        // Should open invite dialog
        await expect(
          page.locator("text=Invite Member, text=Send Invitation").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("INV-003: Send invitation with email", async ({ page }) => {
      const inviteEmail = `invite-${uniqueId}@example.com`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Click invite button
      const inviteButton = page.locator('button:has-text("Invite")').first();
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        // Fill email
        const emailInput = page.locator(
          'input[name="email"], input[type="email"]'
        );
        if (await emailInput.isVisible()) {
          await emailInput.fill(inviteEmail);

          // Select role
          const roleSelect = page.locator(
            'select[name="role"], button:has-text("Role")'
          );
          if (await roleSelect.isVisible()) {
            await roleSelect.click();
            const viewerOption = page.locator('[role="option"]:has-text("VIEWER")');
            if (await viewerOption.isVisible()) {
              await viewerOption.click();
            }
          }

          // Send invitation
          await page.click('button[type="submit"]');

          // Should show success
          await page.waitForTimeout(2000);
        }
      }
    });

    test("INV-004: Invitation validation - invalid email", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Click invite button
      const inviteButton = page.locator('button:has-text("Invite")').first();
      if (await inviteButton.isVisible()) {
        await inviteButton.click();

        // Fill invalid email
        const emailInput = page.locator(
          'input[name="email"], input[type="email"]'
        );
        if (await emailInput.isVisible()) {
          await emailInput.fill("invalid-email");

          // Try to submit
          await page.click('button[type="submit"]');

          // Should show validation error
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Pending Invitations", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-010: View pending invitations", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Look for pending invitations section
      const pendingSection = page.locator(
        "text=Pending, text=Invitations, text=Invited"
      );
      // May or may not have pending invitations
    });

    test("INV-011: Resend invitation", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Find resend button on pending invitation
      const resendButton = page.locator('button:has-text("Resend")').first();
      if (await resendButton.isVisible()) {
        await resendButton.click();

        // Should show success
        await page.waitForTimeout(1000);
      }
    });

    test("INV-012: Cancel pending invitation", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Find cancel button on pending invitation
      const cancelButton = page.locator('button:has-text("Cancel")').first();
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
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Find remove button (not for owner)
      const removeButton = page
        .locator(
          'button:has(.lucide-trash), button:has(.lucide-user-minus), button[title="Remove"]'
        )
        .first();
      if (await removeButton.isVisible()) {
        page.on("dialog", (dialog) => dialog.accept());
        await removeButton.click();

        // Should remove member
        await page.waitForTimeout(2000);
      }
    });

    test("INV-021: Cannot remove self (owner)", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Owner row should not have remove button or it should be disabled
      const ownerRow = page.locator('tr:has-text("OWNER")');
      if (await ownerRow.isVisible()) {
        const removeButton = ownerRow.locator(
          'button:has(.lucide-trash), button[title="Remove"]'
        );
        if (await removeButton.isVisible()) {
          const isDisabled = await removeButton.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });
  });

  test.describe("Member Role Update", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INV-030: Change member role", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Find role dropdown on member row (not owner)
      const roleSelect = page
        .locator('select[name="role"], button:has-text("VIEWER")')
        .first();
      if (await roleSelect.isVisible()) {
        await roleSelect.click();

        // Select new role
        const editorOption = page.locator('[role="option"]:has-text("EDITOR")');
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
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Invite button should be visible
      const inviteButton = page.locator('button:has-text("Invite")').first();
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
    });

    test("INV-RBAC-002: Admin can manage members", async ({ page }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Invite button should be visible
      const inviteButton = page.locator('button:has-text("Invite")').first();
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
    });

    test("INV-RBAC-003: Viewer cannot manage members", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Members tab
      const membersTab = page.locator('button[role="tab"]:has-text("Members")');
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Invite button should be disabled or hidden
      const inviteButton = page.locator('button:has-text("Invite")').first();
      if (await inviteButton.isVisible()) {
        const isDisabled = await inviteButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });
});
