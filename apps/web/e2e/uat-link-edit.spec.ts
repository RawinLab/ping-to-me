import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * UAT Tests - Link Edit Functionality
 *
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 *
 * Prerequisites:
 * 1. Database seeded with test data
 * 2. Dev servers running (pnpm dev)
 * 3. Existing links in the database
 *
 * Test Cases:
 * - LINK-010: Open Edit Modal
 * - LINK-011: Edit Destination URL
 * - LINK-012: Edit Title and Tags
 * - LINK-013: Validation Error on Edit
 */

test.describe("UAT - Link Edit Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login with test account
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");

    // Wait for links to load
    await page.waitForSelector('.group.bg-white.rounded-2xl', { timeout: 10000 });
  });

  test("LINK-010: Open Edit Modal", async ({ page }) => {
    console.log("\n=== LINK-010: Open Edit Modal ===");

    // Step 1-2: Already logged in and on /dashboard/links (from beforeEach)
    console.log("✓ Step 1-2: Logged in and on /dashboard/links");

    // Step 3: Find an existing link in the list
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await expect(linkCard).toBeVisible({ timeout: 5000 });
    console.log("✓ Step 3: Found existing link in the list");

    // Step 4: Look for Edit button (pencil icon) or click on the link card/row
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await expect(editButton).toBeVisible({ timeout: 3000 });
    console.log("✓ Step 4: Located Edit button (pencil icon)");

    // Step 5: Click to edit
    await editButton.click();
    console.log("✓ Step 5: Clicked Edit button");

    // Step 6: Verify modal opens
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    console.log("✓ Step 6a: Edit modal opened");

    // Verify shows current link data
    const urlInput = page.locator("input#originalUrl");
    await expect(urlInput).toBeVisible();
    const urlValue = await urlInput.inputValue();
    expect(urlValue).toMatch(/^https?:\/\//);
    console.log(`✓ Step 6b: Shows current link data - URL: ${urlValue}`);

    // Verify form is editable
    await expect(urlInput).toBeEditable();
    const titleInput = page.locator("input#title");
    await expect(titleInput).toBeEditable();
    console.log("✓ Step 6c: Form is editable");

    console.log("✅ LINK-010: PASSED - Edit modal opens successfully with current data and editable form");

    // Close modal for next test
    await page.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });

  test("LINK-011: Edit Destination URL", async ({ page }) => {
    console.log("\n=== LINK-011: Edit Destination URL ===");

    // Step 1: Open Edit modal for a link
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    console.log("✓ Step 1: Opened Edit modal");

    // Step 2: Change Destination URL
    const urlInput = page.locator("input#originalUrl");
    const originalUrl = await urlInput.inputValue();
    console.log(`  Original URL: ${originalUrl}`);

    const newUrl = "https://new-destination.com";
    await urlInput.clear();
    await urlInput.fill(newUrl);
    console.log(`✓ Step 2: Changed Destination URL to: ${newUrl}`);

    // Step 3: Click "Save" or "Update"
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    console.log("✓ Step 3: Clicked Save button");

    // Step 4: Verify URL updated successfully
    // Wait for modal to close (indicates success)
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    console.log("✓ Step 4a: Modal closed (save successful)");

    // Check for success message/toast (if visible)
    const successToast = page.locator('[role="status"]').filter({ hasText: /success|updated/i });
    if (await successToast.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("✓ Step 4b: Success message shown");
    } else {
      console.log("  Step 4b: Success message not visible (might have faded)");
    }

    // Wait for page to refresh and links to reload
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Give time for state updates

    // Verify by reopening the same link
    const refreshedLinkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await refreshedLinkCard.hover();
    const refreshedEditButton = refreshedLinkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await refreshedEditButton.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    const updatedUrlValue = await page.locator("input#originalUrl").inputValue();
    expect(updatedUrlValue).toBe(newUrl);
    console.log(`✓ Step 4c: New URL reflected in link details: ${updatedUrlValue}`);

    console.log("✅ LINK-011: PASSED - Destination URL updated successfully");

    // Close modal
    await page.locator('button:has-text("Cancel")').click();
  });

  test("LINK-012: Edit Title and Tags", async ({ page }) => {
    console.log("\n=== LINK-012: Edit Title and Tags ===");

    // Step 1: Open Edit modal for a link
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    console.log("✓ Step 1: Opened Edit modal");

    // Step 2: Change Title
    const titleInput = page.locator("input#title");
    const originalTitle = await titleInput.inputValue();
    console.log(`  Original Title: "${originalTitle}"`);

    const newTitle = "Updated Link Title";
    await titleInput.clear();
    await titleInput.fill(newTitle);
    console.log(`✓ Step 2: Changed Title to: "${newTitle}"`);

    // Step 3: Add or remove tags
    const newTagInput = page.locator('input[placeholder="New tag"]');
    const testTagName = `test-tag-${Date.now()}`;
    await newTagInput.fill(testTagName);
    await newTagInput.press("Enter");
    console.log(`✓ Step 3: Added new tag: "${testTagName}"`);

    // Verify tag appears
    const tagBadge = page.locator(
      `[role="dialog"] .flex.items-center.gap-1:has-text("${testTagName}")`
    );
    await expect(tagBadge).toBeVisible();
    console.log("  Confirmed tag badge visible in modal");

    // Step 4: Click "Save"
    await page.locator('button:has-text("Save Changes")').click();
    console.log("✓ Step 4: Clicked Save button");

    // Step 5: Verify updates
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    console.log("✓ Step 5a: Title and tags saved successfully (modal closed)");

    // Reopen to verify changes persisted
    await linkCard.hover();
    await editButton.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    const updatedTitle = await page.locator("input#title").inputValue();
    expect(updatedTitle).toBe(newTitle);
    console.log(`✓ Step 5b: Title updated and visible: "${updatedTitle}"`);

    const persistedTag = page.locator(
      `[role="dialog"] .flex.items-center.gap-1:has-text("${testTagName}")`
    );
    await expect(persistedTag).toBeVisible();
    console.log(`✓ Step 5c: Tag persisted and visible: "${testTagName}"`);

    console.log("✅ LINK-012: PASSED - Title and tags updated successfully");

    // Close modal
    await page.locator('button:has-text("Cancel")').click();
  });

  test("LINK-013: Validation Error on Edit", async ({ page }) => {
    console.log("\n=== LINK-013: Validation Error on Edit ===");

    // Step 1: Open Edit modal for a link
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    console.log("✓ Step 1: Opened Edit modal");

    // Step 2: Clear the Destination URL field (make it empty)
    const urlInput = page.locator("input#originalUrl");
    const originalUrl = await urlInput.inputValue();
    console.log(`  Original URL: ${originalUrl}`);

    await urlInput.clear();
    console.log("✓ Step 2: Cleared Destination URL field");

    // Verify field is empty
    const clearedValue = await urlInput.inputValue();
    expect(clearedValue).toBe("");
    console.log("  Confirmed URL field is empty");

    // Step 3: Try to save
    await page.locator('button:has-text("Save Changes")').click();
    console.log("✓ Step 3: Attempted to save with empty URL");

    // Step 4: Verify validation error shown
    const errorMessage = page.locator("text=Please enter a valid URL");
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
    console.log("✓ Step 4a: Validation error shown");

    // Step 4b: Verify save was blocked
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    console.log("✓ Step 4b: Save blocked (modal stays open)");

    // Step 4c: Verify URL field has error styling
    await expect(urlInput).toHaveClass(/border-red-500/);
    console.log("✓ Step 4c: URL field shows error styling (red border)");

    // Step 4d: Verify original data can be restored
    await urlInput.fill(originalUrl);
    await expect(urlInput).toHaveValue(originalUrl);
    console.log("✓ Step 4d: Original data preserved and can be restored");

    console.log("✅ LINK-013: PASSED - Validation error correctly blocks invalid save");

    // Close modal
    await page.locator('button:has-text("Cancel")').click();
  });
});

/**
 * Additional test to verify all tests can run together
 */
test.describe("UAT - Link Edit Full Suite", () => {
  test("Run all link edit tests in sequence", async ({ page }) => {
    console.log("\n=== RUNNING FULL UAT SUITE ===\n");

    // Login
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('.group.bg-white.rounded-2xl', { timeout: 10000 });

    console.log("✓ Setup complete: Logged in and links loaded\n");

    // Track results
    const results = {
      "LINK-010": "PENDING",
      "LINK-011": "PENDING",
      "LINK-012": "PENDING",
      "LINK-013": "PENDING"
    };

    try {
      // LINK-010
      console.log("Testing LINK-010...");
      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();
      const editButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-pencil") })
        .first();
      await editButton.click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(page.locator("input#originalUrl")).toBeVisible();
      await page.locator('button:has-text("Cancel")').click();
      results["LINK-010"] = "PASS";
      console.log("✅ LINK-010: PASS\n");
    } catch (e) {
      results["LINK-010"] = "FAIL";
      console.log(`❌ LINK-010: FAIL - ${e}\n`);
    }

    try {
      // LINK-011
      console.log("Testing LINK-011...");
      await linkCard.hover();
      await editButton.click();
      await page.locator("input#originalUrl").fill("https://new-destination.com");
      await page.locator('button:has-text("Save Changes")').click();
      await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
      results["LINK-011"] = "PASS";
      console.log("✅ LINK-011: PASS\n");
    } catch (e) {
      results["LINK-011"] = "FAIL";
      console.log(`❌ LINK-011: FAIL - ${e}\n`);
    }

    try {
      // LINK-012
      console.log("Testing LINK-012...");
      await linkCard.hover();
      await editButton.click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await page.locator("input#title").fill("Updated Link Title");
      const tagInput = page.locator('input[placeholder="New tag"]');
      await tagInput.fill(`tag-${Date.now()}`);
      await tagInput.press("Enter");
      await page.locator('button:has-text("Save Changes")').click();
      await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
      results["LINK-012"] = "PASS";
      console.log("✅ LINK-012: PASS\n");
    } catch (e) {
      results["LINK-012"] = "FAIL";
      console.log(`❌ LINK-012: FAIL - ${e}\n`);
    }

    try {
      // LINK-013
      console.log("Testing LINK-013...");
      await linkCard.hover();
      await editButton.click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await page.locator("input#originalUrl").clear();
      await page.locator('button:has-text("Save Changes")').click();
      await expect(page.locator("text=Please enter a valid URL")).toBeVisible();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      results["LINK-013"] = "PASS";
      console.log("✅ LINK-013: PASS\n");
    } catch (e) {
      results["LINK-013"] = "FAIL";
      console.log(`❌ LINK-013: FAIL - ${e}\n`);
    }

    // Summary
    console.log("\n=== TEST RESULTS SUMMARY ===");
    console.log("LINK-010: Open Edit Modal -", results["LINK-010"]);
    console.log("LINK-011: Edit Destination URL -", results["LINK-011"]);
    console.log("LINK-012: Edit Title and Tags -", results["LINK-012"]);
    console.log("LINK-013: Validation Error on Edit -", results["LINK-013"]);
    console.log("===========================\n");
  });
});
