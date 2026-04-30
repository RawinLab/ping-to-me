import { test, expect } from '@playwright/test';
import path from 'path';

const LOGIN_URL = 'http://localhost:3010/login';
const CREDENTIALS = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!'
};

const SCREENSHOT_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';
const WAIT_TIME = 5000; // 5 seconds wait for async data

test.describe('UAT: Folder Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(LOGIN_URL);
    await page.waitForTimeout(1000);
    await page.fill('input#email', CREDENTIALS.email);
    await page.fill('input#password', CREDENTIALS.password);
    await page.click('button:has-text("Sign In with Email")');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(WAIT_TIME); // Wait for async data
  });

  test('FLD-001: Create Folder', async ({ page }) => {
    console.log('Testing FLD-001: Create Folder');

    // Navigate to folders page
    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-001-create-before.png'),
      fullPage: true
    });

    // Look for "New Folder" or "Create Folder" button
    const createButton = page.locator('button:has-text("New Folder"), button:has-text("Create Folder")').first();
    const isVisible = await createButton.isVisible();

    if (!isVisible) {
      console.log('RESULT: NOT_IMPL - Create Folder button not found');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-001-create.png'),
        fullPage: true
      });
      return;
    }

    // Click create folder button
    await createButton.click();
    await page.waitForTimeout(1000);

    // Fill folder name
    const folderName = `UAT Folder ${Date.now()}`;
    const nameInput = page.locator('input#name, input[placeholder*="Folder"], input[placeholder*="folder"]').first();
    await nameInput.fill(folderName);

    // Select a color if available
    const colorButtons = page.locator('button[style*="background"]');
    const colorCount = await colorButtons.count();
    if (colorCount > 0) {
      await colorButtons.nth(2).click(); // Select third color
      console.log('Color selected');
    }

    // Click create/submit button (use more specific selector)
    await page.locator('button:has-text("Create Folder")').last().click();
    await page.waitForTimeout(2000);

    // Take screenshot after creation
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-001-create.png'),
      fullPage: true
    });

    // Verify folder appears in list
    const folderCard = page.locator(`text="${folderName}"`);
    const folderExists = await folderCard.isVisible();

    if (folderExists) {
      console.log('RESULT: PASS - Folder created successfully and appears in list');
    } else {
      console.log('RESULT: FAIL - Folder not visible after creation');
    }
  });

  test('FLD-002: View Links in Folder', async ({ page }) => {
    console.log('Testing FLD-002: View Links in Folder');

    // Navigate to folders page
    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    // Check if any folders exist
    const viewLinksButton = page.locator('button:has-text("View Links")').first();
    const hasFolders = await viewLinksButton.isVisible();

    if (!hasFolders) {
      console.log('RESULT: NOT_IMPL - No folders exist to test viewing links');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-002-view.png'),
        fullPage: true
      });
      return;
    }

    // Click on "View Links" button
    await viewLinksButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-002-view.png'),
      fullPage: true
    });

    // Verify we're on the links page with folder filter
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard/links') && currentUrl.includes('folder=')) {
      console.log('RESULT: PASS - Links page opened with folder filter');
    } else {
      console.log('RESULT: FAIL - Did not navigate to filtered links page');
    }
  });

  test('FLD-003: Move Link to Folder', async ({ page }) => {
    console.log('Testing FLD-003: Move Link to Folder');

    // Navigate to links page
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForTimeout(WAIT_TIME);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move-before.png'),
      fullPage: true
    });

    // Look for links
    const linkRows = page.locator('[role="row"]');
    const linkCount = await linkRows.count();

    if (linkCount <= 1) { // 1 for header row
      console.log('RESULT: NOT_IMPL - No links available to test moving to folder');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
        fullPage: true
      });
      return;
    }

    // Try to find context menu or edit button on first link
    // Look for three-dot menu, edit button, or similar
    const contextMenuButton = page.locator('button[aria-label*="menu"], button:has-text("•••"), button:has-text("⋮")').first();
    const editButton = page.locator('button[aria-label*="edit"], button:has-text("Edit")').first();

    let foundAction = false;

    if (await contextMenuButton.isVisible()) {
      await contextMenuButton.click();
      foundAction = true;
    } else if (await editButton.isVisible()) {
      await editButton.click();
      foundAction = true;
    }

    if (!foundAction) {
      console.log('RESULT: NOT_IMPL - No context menu or edit option found for moving links');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
        fullPage: true
      });
      return;
    }

    await page.waitForTimeout(1000);

    // Look for folder option
    const folderOption = page.locator('text=/folder/i');
    const hasFolderOption = await folderOption.isVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
      fullPage: true
    });

    if (hasFolderOption) {
      console.log('RESULT: PARTIAL - Folder option found in menu (implementation exists but not fully tested)');
    } else {
      console.log('RESULT: NOT_IMPL - Move to folder functionality not found in UI');
    }
  });

  test('FLD-004: Delete Folder', async ({ page }) => {
    console.log('Testing FLD-004: Delete Folder');

    // Navigate to folders page
    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    // Check if any folders exist
    const deleteButton = page.locator('button:has(svg.lucide-trash-2), button[aria-label*="delete"]').first();
    const hasFolders = await deleteButton.isVisible();

    if (!hasFolders) {
      console.log('RESULT: NOT_IMPL - No folders exist to test deletion');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete.png'),
        fullPage: true
      });
      return;
    }

    // Count folders before deletion
    const folderCards = page.locator('[class*="relative group"]');
    const folderCountBefore = await folderCards.count();

    // Take before screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete-before.png'),
      fullPage: true
    });

    // Setup dialog handler for confirmation
    page.on('dialog', async dialog => {
      console.log('Confirm dialog appeared:', dialog.message());
      await dialog.accept();
    });

    // Click delete button
    await deleteButton.click();
    await page.waitForTimeout(2000);

    // Take after screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete.png'),
      fullPage: true
    });

    // Verify folder was deleted
    const folderCountAfter = await folderCards.count();

    if (folderCountAfter < folderCountBefore) {
      console.log('RESULT: PASS - Folder deleted successfully');
    } else {
      console.log('RESULT: FAIL - Folder count did not decrease after deletion');
    }
  });

  test('FLD-005: Create Nested Folder (Sub-folder)', async ({ page }) => {
    console.log('Testing FLD-005: Create Nested Folder (Sub-folder)');

    // Navigate to folders page
    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested-before.png'),
      fullPage: true
    });

    // Check if any folders exist to create sub-folders
    const folderCards = page.locator('[class*="relative group"]');
    const folderCount = await folderCards.count();

    if (folderCount === 0) {
      console.log('RESULT: NOT_IMPL - No parent folders exist to test sub-folder creation');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested.png'),
        fullPage: true
      });
      return;
    }

    // Look for right-click context menu or sub-folder option
    // Try right-clicking on first folder
    const firstFolder = folderCards.first();
    await firstFolder.click({ button: 'right' });
    await page.waitForTimeout(1000);

    // Look for "Create Sub-folder" or similar option
    const subfolderOption = page.locator('text=/sub.*folder/i, text=/create.*folder/i, text=/new.*folder/i');
    const hasSubfolderOption = await subfolderOption.isVisible();

    if (!hasSubfolderOption) {
      // Try looking for a menu icon on the folder card
      await firstFolder.hover();
      const menuButton = firstFolder.locator('button[aria-label*="menu"]');
      const hasMenu = await menuButton.isVisible();

      if (hasMenu) {
        await menuButton.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested.png'),
      fullPage: true
    });

    // Check again for sub-folder option
    const hasSubfolderOptionNow = await subfolderOption.isVisible();

    if (hasSubfolderOptionNow) {
      console.log('RESULT: PARTIAL - Sub-folder option found (implementation exists but not fully tested)');
    } else {
      console.log('RESULT: NOT_IMPL - Nested folder/sub-folder functionality not found in UI');
      console.log('NOTE: Backend API supports parentId for nested folders, but UI may not expose this feature');
    }
  });

  test('Summary: Generate UAT Report', async ({ page }) => {
    console.log('\n========================================');
    console.log('UAT FOLDER MANAGEMENT - TEST SUMMARY');
    console.log('========================================\n');
    console.log('Test Environment:');
    console.log('  Login URL: http://localhost:3010/login');
    console.log('  Credentials: e2e-owner@pingtome.test / TestPassword123!');
    console.log('  Wait Time: 5 seconds after page loads\n');
    console.log('Test Results Summary:');
    console.log('  FLD-001: Create Folder - Check screenshots for result');
    console.log('  FLD-002: View Links in Folder - Check screenshots for result');
    console.log('  FLD-003: Move Link to Folder - Check screenshots for result');
    console.log('  FLD-004: Delete Folder - Check screenshots for result');
    console.log('  FLD-005: Create Nested Folder - Check screenshots for result\n');
    console.log('Screenshots saved to:', SCREENSHOT_DIR);
    console.log('========================================\n');
  });
});
