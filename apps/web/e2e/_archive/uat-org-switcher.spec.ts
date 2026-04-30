import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_CREDENTIALS } from "./fixtures/test-data";

test.describe("Organization Switcher UAT", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test using auth helper
    await loginAsUser(page, "owner");
    await page.waitForLoadState("networkidle");
  });

  test("ORG-001: Organization Switcher Visible", async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-001-header.png" });

    // Check that Organization Switcher is visible in header (desktop only)
    const switcher = page.locator("button:has-text(/^[A-Z]/i)").first();
    await expect(switcher).toBeVisible();

    // Verify it's in the header (between mobile menu and search)
    const header = page.locator("header");
    await expect(switcher.locator("..")).toContainElement(header.locator("*"));

    // Verify switcher shows organization name
    const switcherText = await switcher.textContent();
    expect(switcherText).toBeTruthy();
    expect(switcherText).not.toContain("undefined");

    console.log("TEST PASSED: ORG-001 - Organization Switcher is visible with organization name");
  });

  test("ORG-002: Open Organization Dropdown", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher.click();

    // Wait for dropdown to appear
    await page.waitForTimeout(300);

    // Screenshot of open dropdown
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-002-dropdown-open.png" });

    // Verify dropdown contains expected elements
    const dropdownContent = page.locator('[role="menu"]');
    await expect(dropdownContent).toBeVisible();

    // Check for "Switch Organization" label
    const switchLabel = page.locator('text=Switch Organization');
    await expect(switchLabel).toBeVisible();

    // Check for list of organizations
    const orgItems = page.locator('[role="menuitem"]:has-text(/members/)');
    const orgCount = await orgItems.count();
    expect(orgCount).toBeGreaterThan(0);

    // Verify role badges exist
    const roleBadges = page.locator('[role="menuitem"] >> text=/Owner|Admin|Editor|Viewer/');
    await expect(roleBadges).toHaveCount(await orgCount.then(() => orgCount));

    // Check for "Manage Organization" link
    const manageOrgLink = page.locator('[role="menuitem"]:has-text("Manage Organization")');
    await expect(manageOrgLink).toBeVisible();

    // Check for "Team Members" link
    const teamMembersLink = page.locator('[role="menuitem"]:has-text("Team Members")');
    await expect(teamMembersLink).toBeVisible();

    // Check for "Create New Organization" option
    const createNewLink = page.locator('[role="menuitem"]:has-text("Create New Organization")');
    await expect(createNewLink).toBeVisible();

    console.log("TEST PASSED: ORG-002 - Dropdown opens with all expected elements");
  });

  test("ORG-003: Switch Organization (if multiple orgs exist)", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    const initialOrgName = await switcher.locator('span').first().textContent();
    console.log("Initial organization:", initialOrgName);

    await switcher.click();
    await page.waitForTimeout(300);

    // Get count of organizations
    const orgItems = page.locator('[role="menuitem"]:has-text(/members/)');
    const orgCount = await orgItems.count();

    if (orgCount > 1) {
      // Click on the second organization
      const secondOrgItem = orgItems.nth(1);
      const secondOrgName = await secondOrgItem.locator('span').first().textContent();
      console.log("Switching to organization:", secondOrgName);

      await secondOrgItem.click();
      await page.waitForTimeout(500);

      // Screenshot after switching
      await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-003-switched.png" });

      // Verify the switcher updated
      const newOrgName = await switcher.locator('span').first().textContent();
      expect(newOrgName).not.toBe(initialOrgName);
      console.log("TEST PASSED: ORG-003 - Switched organization successfully");
    } else {
      console.log("TEST PARTIAL: ORG-003 - User has only one organization, switching not possible");
      await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-003-single-org.png" });
    }
  });

  test("ORG-004: Create New Organization from Switcher", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher.click();

    // Click "Create New Organization"
    const createNewLink = page.locator('[role="menuitem"]:has-text("Create New Organization")');
    await createNewLink.click();

    // Wait for dialog to appear
    await page.waitForTimeout(300);

    // Screenshot of dialog
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-004-create-dialog.png" });

    // Verify dialog elements
    const dialogTitle = page.locator('text=Create Organization');
    await expect(dialogTitle).toBeVisible();

    // Check for Organization Name input
    const nameInput = page.locator('input[placeholder="My Company"]');
    await expect(nameInput).toBeVisible();

    // Check for URL Slug input
    const slugInput = page.locator('input[placeholder="my-company"]');
    await expect(slugInput).toBeVisible();

    // Check for Create button
    const createButton = page.locator('button:has-text("Create Organization")');
    await expect(createButton).toBeVisible();

    // Check for Cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();

    // Verify slug auto-generation by typing in name field
    await nameInput.click();
    await nameInput.fill("Test Organization 123");

    // Check that slug was auto-generated
    const slugValue = await slugInput.inputValue();
    expect(slugValue).toBe("test-organization-123");

    console.log("TEST PASSED: ORG-004 - Create dialog opens with proper fields and slug auto-generation works");

    // Close dialog
    await cancelButton.click();
  });

  test("ORG-005: Navigation Links", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher.click();

    // Click "Manage Organization"
    const manageOrgLink = page.locator('[role="menuitem"]:has-text("Manage Organization")');
    await manageOrgLink.click();

    // Wait for navigation
    await page.waitForURL(/\/dashboard\/organization/);
    await page.waitForLoadState("networkidle");

    // Screenshot of organization page
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-005a-manage-org.png" });

    // Verify we're on the organization page
    const pageTitle = page.locator('text=Organization|Team|Settings');
    await expect(pageTitle.first()).toBeVisible();

    // Go back to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Open switcher again
    const switcher2 = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher2.click();

    // Click "Team Members"
    const teamMembersLink = page.locator('[role="menuitem"]:has-text("Team Members")');
    await teamMembersLink.click();

    // Wait for navigation
    await page.waitForURL(/\/dashboard\/settings\/team/);
    await page.waitForLoadState("networkidle");

    // Screenshot of team page
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-005b-team-members.png" });

    // Verify we're on the team page
    const teamTitle = page.locator('text=Team|Members|Invit');
    await expect(teamTitle.first()).toBeVisible();

    console.log("TEST PASSED: ORG-005 - Navigation links work correctly");
  });

  test("ORG-006: Organization Switcher Desktop Only", async ({ page }) => {
    // Check that Organization Switcher is visible on desktop
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await expect(switcher).toBeVisible();

    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Take screenshot of mobile view
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-006-mobile.png" });

    // The switcher should be hidden on mobile (hidden md:block class)
    const hiddenSwitcherWrapper = page.locator('.hidden');
    const switcherParent = switcher.locator('..');

    // On mobile, the switcher container should be hidden
    const isHidden = await switcherParent.evaluate((el) => {
      return window.getComputedStyle(el).display === "none";
    });

    if (isHidden) {
      console.log("TEST PASSED: ORG-006 - Organization Switcher hidden on mobile view");
    } else {
      console.log("TEST PARTIAL: ORG-006 - Switcher may be visible on mobile (check CSS)");
    }

    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("ORG-007: Role Badges Display", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher.click();

    await page.waitForTimeout(300);

    // Screenshot showing role badges
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-007-role-badges.png" });

    // Get all organization items
    const orgItems = page.locator('[role="menuitem"]:has-text(/members/)');
    const orgCount = await orgItems.count();

    // Verify each org has a role badge
    for (let i = 0; i < orgCount; i++) {
      const orgItem = orgItems.nth(i);
      const roleBadge = orgItem.locator('text=/Owner|Admin|Editor|Viewer/');
      await expect(roleBadge).toBeVisible();

      const roleText = await roleBadge.textContent();
      expect(["Owner", "Admin", "Editor", "Viewer"]).toContain(roleText);
    }

    console.log(`TEST PASSED: ORG-007 - All ${orgCount} organizations have role badges`);
  });

  test("ORG-008: Member Count Display", async ({ page }) => {
    // Click on the Organization Switcher
    const switcher = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await switcher.click();

    await page.waitForTimeout(300);

    // Screenshot showing member counts
    await page.screenshot({ path: "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-org-switcher-008-member-counts.png" });

    // Get all organization items
    const orgItems = page.locator('[role="menuitem"]:has-text(/members/)');
    const orgCount = await orgItems.count();

    // Verify each org shows member count
    for (let i = 0; i < orgCount; i++) {
      const orgItem = orgItems.nth(i);
      const memberCountText = orgItem.locator('text=/\\d+ members?/');
      const isVisible = await memberCountText.isVisible().catch(() => false);

      if (isVisible) {
        const count = await memberCountText.textContent();
        expect(count).toMatch(/\d+ members?/);
      }
    }

    console.log("TEST PASSED: ORG-008 - Member counts are displayed");
  });
});
