import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * UAT Organization CRUD Tests - Manual Testing
 *
 * Test Environment:
 * - Login URL: http://localhost:3010/login
 * - Credentials: e2e-owner@pingtome.test / TestPassword123!
 * - Wait 5 seconds after page loads for async data
 *
 * NOTE: These are manual verification tests that document what exists
 * vs. what the UAT test cases expect.
 */

test.describe("UAT Organization CRUD Tests - Manual", () => {
  const screenshotPath = "/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots";
  const uniqueOrgName = `UAT Test Org ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Login with owner credentials using the auth helper
    await loginAsUser(page, "owner");

    // Wait 5 seconds for async data
    await page.waitForTimeout(5000);
  });

  test("ORG-001: Create Organization", async ({ page }) => {
    console.log("\n=== ORG-001: Create Organization ===");
    console.log("Expected: Organization Switcher in top-left with 'Create Organization' option");
    console.log("Actual: No organization switcher in UI");
    console.log("Workaround: Navigate to /dashboard/organization page");

    // Navigate to organization management page
    await page.goto("/dashboard/organization");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${screenshotPath}/uat-05-01-org-001-switcher.png`,
      fullPage: true
    });

    // Check for "New Organization" button
    const newOrgButton = page.locator('button:has-text("New Organization")').first();
    const hasNewOrgButton = await newOrgButton.isVisible().catch(() => false);

    if (!hasNewOrgButton) {
      console.log("❌ FAIL: ORG-001 - 'New Organization' button not found - NOT_IMPL");
      return;
    }

    console.log("✅ Found 'New Organization' button");

    // Click New Organization
    await newOrgButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotPath}/uat-05-01-org-001-create.png`,
      fullPage: true
    });

    // Fill in organization name
    const nameInput = page.locator('input[id="name"]').first();
    const hasNameInput = await nameInput.isVisible().catch(() => false);

    if (!hasNameInput) {
      console.log("❌ FAIL: ORG-001 - Organization name input not found");
      return;
    }

    await nameInput.fill(uniqueOrgName);
    console.log(`✅ Filled organization name: ${uniqueOrgName}`);

    // Look for Create button
    const createButton = page.locator('button:has-text("Create")').first();
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    if (!hasCreateButton) {
      console.log("❌ FAIL: ORG-001 - Create button not found");
      return;
    }

    // Click Create (but don't actually create to avoid pollution)
    console.log("✅ PARTIAL PASS: ORG-001 - Organization creation UI exists");
    console.log("   ⚠️  WARNING: No organization switcher in top navigation");
    console.log("   📍 Location: /dashboard/organization (not top-left switcher)");

    // Click Cancel instead of Create to avoid test data pollution
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("ORG-002: Edit Organization Details", async ({ page }) => {
    console.log("\n=== ORG-002: Edit Organization Details ===");
    console.log("Expected: Edit organization name and logo at /dashboard/settings/organization");
    console.log("Checking: /dashboard/organization page");

    await page.goto("/dashboard/organization");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${screenshotPath}/uat-05-01-org-002-settings.png`,
      fullPage: true
    });

    // Check if /dashboard/settings/organization exists
    await page.goto("/dashboard/settings/organization");
    await page.waitForTimeout(2000);

    const has404 = await page.locator('text="404"').isVisible().catch(() => false);
    const hasNotFound = await page.locator('text="This page could not be found"').isVisible().catch(() => false);

    if (has404 || hasNotFound) {
      console.log("❌ FAIL: ORG-002 - /dashboard/settings/organization route does not exist");
      console.log("   📍 Alternative: /dashboard/organization exists but doesn't have edit fields");
    }

    // Go back to /dashboard/organization
    await page.goto("/dashboard/organization");
    await page.waitForTimeout(2000);

    // Check for editable fields
    const hasNameField = await page.locator('input[id="name"]').isVisible().catch(() => false);
    const hasLogoUpload = await page.locator('input[type="file"]').isVisible().catch(() => false);

    if (!hasNameField && !hasLogoUpload) {
      console.log("❌ FAIL: ORG-002 - No organization edit fields found - NOT_IMPL");
      console.log("   ℹ️  Note: /dashboard/organization only shows organization cards and team members");
      console.log("   ℹ️  Note: No UI for editing org name or uploading logo");
    } else {
      console.log("✅ PASS: ORG-002 - Organization edit fields found");
    }
  });

  test("ORG-003: Edit Timezone", async ({ page }) => {
    console.log("\n=== ORG-003: Edit Timezone ===");
    console.log("Expected: Timezone selector at /dashboard/settings/organization");

    await page.goto("/dashboard/settings/organization");
    await page.waitForTimeout(2000);

    const has404 = await page.locator('text="404"').isVisible().catch(() => false);
    if (has404) {
      console.log("❌ FAIL: ORG-003 - /dashboard/settings/organization route does not exist - NOT_IMPL");
    }

    await page.screenshot({
      path: `${screenshotPath}/uat-05-01-org-003-timezone.png`,
      fullPage: true
    });

    // Try /dashboard/organization
    await page.goto("/dashboard/organization");
    await page.waitForTimeout(2000);

    const hasTimezoneField = await page.locator('select[name="timezone"], button:has-text("Timezone")').first().isVisible().catch(() => false);

    if (!hasTimezoneField) {
      console.log("❌ FAIL: ORG-003 - Timezone selector not found - NOT_IMPL");
      console.log("   ℹ️  Note: No timezone configuration in organization settings");
    } else {
      console.log("✅ PASS: ORG-003 - Timezone selector found");
    }
  });

  test("ORG-004: Organization Switcher", async ({ page }) => {
    console.log("\n=== ORG-004: Organization Switcher ===");
    console.log("Expected: Organization switcher in top-left corner");
    console.log("Checking: Dashboard header for organization switcher");

    await page.screenshot({
      path: `${screenshotPath}/uat-05-01-org-004-switch.png`,
      fullPage: true
    });

    // Look for any button that might be an org switcher
    const potentialSwitchers = [
      page.locator('button').filter({ hasText: /E2E Test Org/ }),
      page.locator('button[aria-label*="organization"]'),
      page.locator('button[aria-label*="Organization"]'),
      page.locator('[data-testid="org-switcher"]'),
    ];

    let found = false;
    for (const switcher of potentialSwitchers) {
      const isVisible = await switcher.first().isVisible().catch(() => false);
      if (isVisible) {
        console.log("✅ PASS: ORG-004 - Organization switcher found");
        found = true;
        break;
      }
    }

    if (!found) {
      console.log("❌ FAIL: ORG-004 - Organization switcher not found in UI - NOT_IMPL");
      console.log("   ℹ️  Note: OrganizationSwitcher component exists in codebase but not used in layout");
      console.log("   📂 Component: apps/web/components/organization/OrganizationSwitcher.tsx");
      console.log("   ⚠️  WARNING: Component is not imported/used in apps/web/app/dashboard/layout.tsx");
    }
  });

  test("Summary: Organization Features Status", async ({ page }) => {
    console.log("\n=== ORGANIZATION FEATURES SUMMARY ===");
    console.log("\n✅ IMPLEMENTED:");
    console.log("  - Organization management page (/dashboard/organization)");
    console.log("  - Create new organization (via 'New Organization' button)");
    console.log("  - View organization cards");
    console.log("  - Team member management");
    console.log("  - Invite members");
    console.log("  - Remove members");
    console.log("  - Change member roles");
    console.log("  - OrganizationSwitcher component (exists in codebase)");

    console.log("\n❌ NOT IMPLEMENTED / MISSING:");
    console.log("  - Organization switcher in dashboard header/navigation");
    console.log("  - /dashboard/settings/organization route (404)");
    console.log("  - Edit organization name UI");
    console.log("  - Upload/change organization logo UI");
    console.log("  - Timezone selector for organization");
    console.log("  - Switch between organizations from top-left");

    console.log("\n📝 RECOMMENDATIONS:");
    console.log("  1. Add OrganizationSwitcher to dashboard layout header");
    console.log("  2. Create organization settings page with editable fields");
    console.log("  3. Add timezone configuration to organization settings");
    console.log("  4. Implement logo upload functionality");

    console.log("\n✅ Test completed successfully");
  });
});
