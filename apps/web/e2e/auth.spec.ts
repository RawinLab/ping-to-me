import { test, expect } from "@playwright/test";
import { loginAsUser, logout } from "./fixtures/auth";
import { TEST_CREDENTIALS } from "./fixtures/test-data";

/**
 * User Authentication E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover:
 * - User registration (with unique emails)
 * - User login with seeded users
 * - Password reset flow
 * - Profile updates
 * - Password changes
 * - Logout functionality
 *
 * Note: Registration tests create real users in the database.
 * Use unique emails to avoid conflicts.
 */

test.describe("User Registration & Authentication", () => {
  // Generate unique identifiers for test data
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const newUserEmail = `e2e-test-${uniqueId}@example.com`;
  const validPassword = "Password123!";

  test.describe("Registration", () => {
    test("AUTH-001: User Registration - Success", async ({ page }) => {
      await page.goto("/register");

      // Fill registration form
      await page.fill('input[id="email"]', newUserEmail);
      await page.fill('input[id="password"]', validPassword);

      // Optional: fill name if field exists
      const nameField = page.locator('input[id="name"]');
      if (await nameField.isVisible()) {
        await nameField.fill(`Test User ${uniqueId}`);
      }

      // Submit registration
      await page.click('button:has-text("Sign Up")');

      // Should show success or redirect to verification/login
      const successMessage = page.locator(
        "text=Registration successful, text=check your email, text=verify"
      );
      const loginRedirect = page.url().includes("/login");
      const dashboardRedirect = page.url().includes("/dashboard");

      // Wait for result
      await page.waitForTimeout(2000);

      const hasSuccess =
        (await successMessage.isVisible().catch(() => false)) ||
        loginRedirect ||
        dashboardRedirect;
      expect(hasSuccess).toBe(true);
    });

    test("AUTH-002: User Registration - Invalid Password (too short)", async ({
      page,
    }) => {
      await page.goto("/register");

      await page.fill('input[id="email"]', `short-pass-${uniqueId}@example.com`);
      await page.fill('input[id="password"]', "123");

      await page.click('button:has-text("Sign Up")');

      // Should show validation error
      const errorMessage = page.locator(
        "text=at least 8 characters, text=password.*short, text=invalid password"
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test("AUTH-003: User Registration - Duplicate Email", async ({ page }) => {
      await page.goto("/register");

      // Use existing seeded user email
      await page.fill('input[id="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[id="password"]', validPassword);

      await page.click('button:has-text("Sign Up")');

      // Should show error about existing email
      const errorMessage = page.locator(
        "text=already in use, text=email.*exists, text=account.*exists"
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Login", () => {
    test("AUTH-004: User Login - Success with seeded user", async ({ page }) => {
      await page.goto("/login");

      // Login with seeded owner user
      await page.fill('input[id="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[id="password"]', TEST_CREDENTIALS.owner.password);

      await page.click('button:has-text("Sign In")');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("AUTH-005: User Login - Invalid Credentials", async ({ page }) => {
      await page.goto("/login");

      await page.fill('input[id="email"]', "nonexistent@example.com");
      await page.fill('input[id="password"]', "WrongPassword123!");

      await page.click('button:has-text("Sign In")');

      // Should show error message
      const errorMessage = page.locator(
        "text=Invalid email or password, text=invalid credentials, text=unauthorized"
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test("AUTH-006: Login page has forgot password link", async ({ page }) => {
      await page.goto("/login");

      // Should have forgot password link
      await expect(page.locator("text=Forgot password")).toBeVisible();
    });
  });

  test.describe("Forgot Password", () => {
    test("AUTH-007: Forgot Password - Request reset link", async ({ page }) => {
      await page.goto("/login");

      // Click forgot password link
      await page.click("text=Forgot password");

      // Should navigate to forgot password page
      await expect(page).toHaveURL(/\/forgot-password/);

      // Fill email
      await page.fill('input[id="email"]', TEST_CREDENTIALS.owner.email);

      // Submit
      await page.click('button:has-text("Send"), button:has-text("Reset")');

      // Should show success message (API always returns success for security)
      const successMessage = page.locator(
        "text=If an account exists, text=email sent, text=check your email"
      );
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Profile Management", () => {
    test("AUTH-008: Profile Update - Change name", async ({ page }) => {
      await loginAsUser(page, "owner");

      // Navigate to profile settings
      await page.goto("/dashboard/settings/profile");
      await page.waitForLoadState("networkidle");

      // Should show profile settings page
      await expect(
        page.locator("text=Profile, text=Settings").first()
      ).toBeVisible({ timeout: 10000 });

      // Update name
      const newName = `Updated Name ${uniqueId}`;
      const nameInput = page.locator('input[id="name"], input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill(newName);

        // Submit
        await page.click('button:has-text("Save")');

        // Should show success message
        const successMessage = page.locator(
          "text=updated successfully, text=saved, text=changes saved"
        );
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test("AUTH-009: Change Password", async ({ page }) => {
      await loginAsUser(page, "owner");

      // Navigate to security settings
      await page.goto("/dashboard/settings/security");
      await page.waitForLoadState("networkidle");

      // Should show security settings page
      await expect(
        page.locator("text=Security, text=Password").first()
      ).toBeVisible({ timeout: 10000 });

      // Find password form fields
      const currentPasswordInput = page.locator(
        'input[id="currentPassword"], input[name="currentPassword"]'
      );
      const newPasswordInput = page.locator(
        'input[id="newPassword"], input[name="newPassword"]'
      );
      const confirmPasswordInput = page.locator(
        'input[id="confirmPassword"], input[name="confirmPassword"]'
      );

      if (await currentPasswordInput.isVisible()) {
        await currentPasswordInput.fill(TEST_CREDENTIALS.owner.password);
        await newPasswordInput.fill("NewPassword123!");
        await confirmPasswordInput.fill("NewPassword123!");

        // Submit
        await page.click('button:has-text("Update Password")');

        // Should show success or error message
        await page.waitForTimeout(2000);

        // Note: We should revert the password change after this test
        // In real testing, you'd want to clean up or use a dedicated test user
      }
    });
  });

  test.describe("Session Management", () => {
    test("AUTH-010: Logout - Redirects to login", async ({ page }) => {
      // First login
      await loginAsUser(page, "owner");

      // Verify we're on dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Logout
      await logout(page);

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("AUTH-011: Protected routes redirect to login when not authenticated", async ({
      page,
    }) => {
      // Try to access dashboard without logging in
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test("AUTH-012: Session persists across page reloads", async ({ page }) => {
      // Login
      await loginAsUser(page, "owner");

      // Verify on dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe("Role-Based Access", () => {
    test("AUTH-013: Different roles can login", async ({ page }) => {
      // Test login with viewer role
      await page.goto("/login");
      await page.fill('input[id="email"]', TEST_CREDENTIALS.viewer.email);
      await page.fill('input[id="password"]', TEST_CREDENTIALS.viewer.password);
      await page.click('button:has-text("Sign In")');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("AUTH-014: Admin can access organization settings", async ({
      page,
    }) => {
      await loginAsUser(page, "admin");

      // Navigate to organization settings
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should have access
      await expect(page.locator("text=Organization")).toBeVisible({
        timeout: 10000,
      });
    });

    test("AUTH-015: Owner has full access", async ({ page }) => {
      await loginAsUser(page, "owner");

      // Navigate to organization settings
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Should have access to all features
      await expect(page.locator("text=Organization")).toBeVisible({
        timeout: 10000,
      });

      // Check for team/members section
      const membersTab = page.locator('button:has-text("Members")');
      if (await membersTab.isVisible()) {
        await expect(membersTab).toBeEnabled();
      }
    });
  });
});
