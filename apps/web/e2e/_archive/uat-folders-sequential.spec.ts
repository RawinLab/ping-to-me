import { test, expect } from '@playwright/test';
import path from 'path';

const LOGIN_URL = 'http://localhost:3010/login';
const CREDENTIALS = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!'
};

const SCREENSHOT_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';
const WAIT_TIME = 5000; // 5 seconds wait for async data

let createdFolderId: string | null = null;
let createdFolderName: string | null = null;

test.describe.configure({ mode: 'serial' }); // Run tests sequentially

test.describe('UAT: Folder Management (Sequential)', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Login once for all tests
    await page.goto(LOGIN_URL);
    await page.waitForTimeout(1000);
    await page.fill('input#email', CREDENTIALS.email);
    await page.fill('input#password', CREDENTIALS.password);
    await page.click('button:has-text("Sign In with Email")');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(WAIT_TIME);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('FLD-001: Create Folder', async () => {
    console.log('\n========== Testing FLD-001: Create Folder ==========');

    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-001-create-before.png'),
      fullPage: true
    });

    const createButton = page.locator('button:has-text("New Folder"), button:has-text("Create Folder")').first();
    const isVisible = await createButton.isVisible();

    if (!isVisible) {
      console.log('❌ RESULT: NOT_IMPL - Create Folder button not found');
      return;
    }

    await createButton.click();
    await page.waitForTimeout(1000);

    createdFolderName = `UAT Folder ${Date.now()}`;
    const nameInput = page.locator('input#name').first();
    await nameInput.fill(createdFolderName);

    // Select a color
    const colorButtons = page.locator('button[style*="background"]');
    const colorCount = await colorButtons.count();
    if (colorCount > 0) {
      await colorButtons.nth(2).click();
      console.log('✓ Color selected');
    }

    await page.locator('button:has-text("Create Folder")').last().click();
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-001-create.png'),
      fullPage: true
    });

    const folderCard = page.locator(`text="${createdFolderName}"`);
    const folderExists = await folderCard.isVisible();

    if (folderExists) {
      console.log('✅ RESULT: PASS - Folder created successfully and appears in list');
    } else {
      console.log('❌ RESULT: FAIL - Folder not visible after creation');
    }
  });

  test('FLD-002: View Links in Folder', async () => {
    console.log('\n========== Testing FLD-002: View Links in Folder ==========');

    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    const viewLinksButton = page.locator('button:has-text("View Links")').first();
    const hasFolders = await viewLinksButton.isVisible();

    if (!hasFolders) {
      console.log('❌ RESULT: NOT_IMPL - No folders exist to test viewing links');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-002-view.png'),
        fullPage: true
      });
      return;
    }

    console.log('✓ Found "View Links" button');
    await viewLinksButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-002-view.png'),
      fullPage: true
    });

    const currentUrl = page.url();
    console.log('✓ Navigated to:', currentUrl);

    if (currentUrl.includes('/dashboard/links') && currentUrl.includes('folder=')) {
      console.log('✅ RESULT: PASS - Links page opened with folder filter');
      console.log('✓ URL contains folder filter parameter');
    } else {
      console.log('❌ RESULT: FAIL - Did not navigate to filtered links page');
    }
  });

  test('FLD-003: Move Link to Folder', async () => {
    console.log('\n========== Testing FLD-003: Move Link to Folder ==========');

    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForTimeout(WAIT_TIME);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move-before.png'),
      fullPage: true
    });

    // Count table rows (excluding header)
    const linkRows = page.locator('table tbody tr');
    const linkCount = await linkRows.count();
    console.log(`✓ Found ${linkCount} links`);

    if (linkCount === 0) {
      console.log('❌ RESULT: NOT_IMPL - No links available to test moving to folder');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
        fullPage: true
      });
      return;
    }

    // Try to find three-dot menu or action buttons
    const actionButtons = page.locator('button[aria-label*="actions"], button[aria-label*="menu"], button:has(svg.lucide-more-vertical)');
    const actionButtonCount = await actionButtons.count();
    console.log(`✓ Found ${actionButtonCount} action buttons`);

    if (actionButtonCount === 0) {
      console.log('⚠ WARNING: No action menu buttons found on links');

      // Try looking for edit icon
      const editButtons = page.locator('button:has(svg.lucide-edit), button:has(svg.lucide-pencil), a:has-text("Edit")');
      const editCount = await editButtons.count();
      console.log(`✓ Found ${editCount} edit buttons`);

      if (editCount > 0) {
        await editButtons.first().click();
        await page.waitForTimeout(2000);

        // Look for folder dropdown in edit modal
        const folderSelect = page.locator('select, [role="combobox"]').filter({ hasText: /folder/i }).first();
        const hasFolderField = await folderSelect.isVisible().catch(() => false);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
          fullPage: true
        });

        if (hasFolderField) {
          console.log('✅ RESULT: PARTIAL - Folder field found in edit form (implementation exists)');
        } else {
          console.log('❌ RESULT: NOT_IMPL - No folder assignment field found');
        }
        return;
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-003-move.png'),
      fullPage: true
    });
    console.log('❌ RESULT: NOT_IMPL - Move to folder functionality not clearly exposed in UI');
  });

  test('FLD-004: Delete Folder', async () => {
    console.log('\n========== Testing FLD-004: Delete Folder ==========');

    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    const deleteButton = page.locator('button:has(svg.lucide-trash-2)').first();
    const hasFolders = await deleteButton.isVisible();

    if (!hasFolders) {
      console.log('❌ RESULT: NOT_IMPL - No folders exist to test deletion');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete.png'),
        fullPage: true
      });
      return;
    }

    // Count folders before
    const folderCards = page.locator('[class*="relative group"]').filter({ has: page.locator('svg.lucide-folder') });
    const folderCountBefore = await folderCards.count();
    console.log(`✓ Found ${folderCountBefore} folders before deletion`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete-before.png'),
      fullPage: true
    });

    // Setup dialog handler
    page.on('dialog', async dialog => {
      console.log('✓ Confirm dialog appeared:', dialog.message());
      await dialog.accept();
    });

    console.log('✓ Clicking delete button...');
    await deleteButton.click();
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-004-delete.png'),
      fullPage: true
    });

    // Reload page to ensure we get fresh data
    await page.reload();
    await page.waitForTimeout(2000);

    const folderCountAfter = await folderCards.count();
    console.log(`✓ Found ${folderCountAfter} folders after deletion`);

    if (folderCountAfter < folderCountBefore) {
      console.log('✅ RESULT: PASS - Folder deleted successfully');
      console.log(`✓ Folder count decreased from ${folderCountBefore} to ${folderCountAfter}`);
    } else {
      console.log('❌ RESULT: FAIL - Folder count did not decrease after deletion');
    }
  });

  test('FLD-005: Create Nested Folder (Sub-folder)', async () => {
    console.log('\n========== Testing FLD-005: Create Nested Folder (Sub-folder) ==========');

    await page.goto('http://localhost:3010/dashboard/folders');
    await page.waitForTimeout(WAIT_TIME);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested-before.png'),
      fullPage: true
    });

    const folderCards = page.locator('[class*="relative group"]').filter({ has: page.locator('svg.lucide-folder') });
    const folderCount = await folderCards.count();
    console.log(`✓ Found ${folderCount} folders`);

    if (folderCount === 0) {
      console.log('❌ RESULT: NOT_IMPL - No parent folders exist to test sub-folder creation');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested.png'),
        fullPage: true
      });
      return;
    }

    // Try right-click context menu
    console.log('✓ Attempting right-click on first folder...');
    const firstFolder = folderCards.first();
    await firstFolder.click({ button: 'right' });
    await page.waitForTimeout(1000);

    let subfolderOption = page.locator('text=/sub.*folder/i, text=/child.*folder/i, text=/nested/i');
    let hasSubfolderOption = await subfolderOption.isVisible().catch(() => false);

    if (!hasSubfolderOption) {
      // Try hovering and looking for menu
      console.log('✓ Trying hover menu...');
      await firstFolder.hover();
      await page.waitForTimeout(500);

      const menuButton = firstFolder.locator('button[aria-label*="menu"], button:has(svg.lucide-more-vertical)');
      const hasMenu = await menuButton.isVisible().catch(() => false);

      if (hasMenu) {
        console.log('✓ Found menu button, clicking...');
        await menuButton.click();
        await page.waitForTimeout(1000);
        hasSubfolderOption = await subfolderOption.isVisible().catch(() => false);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'uat-05-02-fld-005-nested.png'),
      fullPage: true
    });

    if (hasSubfolderOption) {
      console.log('✅ RESULT: PARTIAL - Sub-folder option found (implementation exists but not fully tested)');
    } else {
      console.log('❌ RESULT: NOT_IMPL - Nested folder/sub-folder functionality not found in UI');
      console.log('⚠ NOTE: Backend API supports parentId for nested folders (verified in folders.service.ts)');
      console.log('⚠ NOTE: UI may not expose this feature yet');
    }
  });

  test('Summary: Generate Final Report', async () => {
    console.log('\n========================================');
    console.log('UAT FOLDER MANAGEMENT - FINAL REPORT');
    console.log('========================================\n');
    console.log('Test Environment:');
    console.log('  Login URL: http://localhost:3010/login');
    console.log('  Credentials: e2e-owner@pingtome.test / TestPassword123!');
    console.log('  Wait Time: 5 seconds after page loads\n');
    console.log('Screenshots saved to:', SCREENSHOT_DIR);
    console.log('========================================\n');
  });
});
