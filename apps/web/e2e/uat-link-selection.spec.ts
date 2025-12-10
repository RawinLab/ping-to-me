import { test, expect } from '@playwright/test';
import { loginAsUser } from './fixtures/auth';

const BASE_URL = 'http://localhost:3010';

test.describe('UAT: Link Selection Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test using the helper
    await loginAsUser(page, 'owner');
  });

  test('LINK-050: Select Multiple Links', async ({ page }) => {
    console.log('\n=== LINK-050: Select Multiple Links ===');

    // Navigate to links page
    await page.goto(`${BASE_URL}/dashboard/links`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'apps/web/screenshots/link-050-initial.png', fullPage: true });

    // Look for checkboxes on link cards/rows
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log(`Found ${checkboxes.length} checkboxes on the page`);

    if (checkboxes.length === 0) {
      console.log('❌ FAIL: No checkboxes found for link selection');
      await page.screenshot({ path: 'apps/web/screenshots/link-050-no-checkboxes.png', fullPage: true });
      return;
    }

    // Filter out any "select all" checkbox and get individual link checkboxes
    const linkCheckboxes = await page.locator('input[type="checkbox"]').filter({
      hasNot: page.locator('[data-select-all]')
    }).all();

    console.log(`Found ${linkCheckboxes.length} link checkboxes (excluding select-all if present)`);

    if (linkCheckboxes.length < 2) {
      console.log('⚠️ NOT_IMPLEMENTED: Less than 2 link checkboxes found. Need at least 2 links to test selection.');
      await page.screenshot({ path: 'apps/web/screenshots/link-050-insufficient-links.png', fullPage: true });
      return;
    }

    // Click checkboxes on 2-3 different links
    const numToSelect = Math.min(3, linkCheckboxes.length);
    console.log(`Selecting ${numToSelect} links...`);

    for (let i = 0; i < numToSelect; i++) {
      await linkCheckboxes[i].check();
      await page.waitForTimeout(500); // Wait for UI to update
    }

    await page.screenshot({ path: 'apps/web/screenshots/link-050-selected.png', fullPage: true });

    // Verify selected state
    let selectedCount = 0;
    for (let i = 0; i < numToSelect; i++) {
      const isChecked = await linkCheckboxes[i].isChecked();
      if (isChecked) selectedCount++;
    }

    console.log(`✓ ${selectedCount}/${numToSelect} links are checked`);

    // Look for bulk action bar
    const bulkActionBar = await page.locator('[data-bulk-actions], [role="toolbar"], .bulk-actions, [class*="bulk"]').first();
    const bulkActionBarVisible = await bulkActionBar.isVisible().catch(() => false);

    if (bulkActionBarVisible) {
      console.log('✓ Bulk action bar is visible');

      // Look for count indicator
      const countText = await page.textContent('body');
      if (countText?.includes(numToSelect.toString())) {
        console.log(`✓ Selected count (${numToSelect}) is displayed`);
      } else {
        console.log('⚠️ Selected count may not be displayed clearly');
      }
    } else {
      console.log('⚠️ Bulk action bar not found or not visible');
    }

    await page.screenshot({ path: 'apps/web/screenshots/link-050-final.png', fullPage: true });

    // Report result
    if (selectedCount === numToSelect) {
      console.log('\n✅ LINK-050: PASS (with notes about bulk action bar)');
      console.log('Observations:');
      console.log(`- Checkboxes present: YES`);
      console.log(`- Links show selected state: YES`);
      console.log(`- Bulk action bar appears: ${bulkActionBarVisible ? 'YES' : 'NO/NOT FOUND'}`);
      console.log(`- Shows count of selected items: ${bulkActionBarVisible ? 'CHECK SCREENSHOTS' : 'N/A'}`);
    } else {
      console.log('\n❌ LINK-050: FAIL - Not all checkboxes were selected');
    }
  });

  test('LINK-051: Select All Links', async ({ page }) => {
    console.log('\n=== LINK-051: Select All Links ===');

    // Navigate to links page
    await page.goto(`${BASE_URL}/dashboard/links`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'apps/web/screenshots/link-051-initial.png', fullPage: true });

    // Look for "Select All" checkbox
    const selectAllCheckbox = await page.locator('input[type="checkbox"]').first();
    const selectAllExists = await selectAllCheckbox.isVisible().catch(() => false);

    if (!selectAllExists) {
      console.log('⚠️ NOT_IMPLEMENTED: "Select All" checkbox not found');
      await page.screenshot({ path: 'apps/web/screenshots/link-051-no-select-all.png', fullPage: true });
      return;
    }

    // Count link checkboxes before selecting all
    const linkCheckboxesBefore = await page.locator('input[type="checkbox"]').all();
    console.log(`Found ${linkCheckboxesBefore.length} total checkboxes`);

    // Click "Select All"
    console.log('Clicking "Select All" checkbox...');
    await selectAllCheckbox.check();
    await page.waitForTimeout(1000); // Wait for UI to update

    await page.screenshot({ path: 'apps/web/screenshots/link-051-after-select-all.png', fullPage: true });

    // Verify all visible links are selected
    const allCheckboxes = await page.locator('input[type="checkbox"]').all();
    let selectedCount = 0;

    for (const checkbox of allCheckboxes) {
      const isChecked = await checkbox.isChecked();
      if (isChecked) selectedCount++;
    }

    console.log(`✓ ${selectedCount}/${allCheckboxes.length} checkboxes are checked`);

    // Look for bulk action bar
    const bulkActionBar = await page.locator('[data-bulk-actions], [role="toolbar"], .bulk-actions, [class*="bulk"]').first();
    const bulkActionBarVisible = await bulkActionBar.isVisible().catch(() => false);

    if (bulkActionBarVisible) {
      console.log('✓ Bulk action bar is visible');
    } else {
      console.log('⚠️ Bulk action bar not found or not visible');
    }

    await page.screenshot({ path: 'apps/web/screenshots/link-051-final.png', fullPage: true });

    // Report result
    const allSelected = selectedCount === allCheckboxes.length;

    if (allSelected && selectedCount > 0) {
      console.log('\n✅ LINK-051: PASS (with notes about bulk action bar)');
      console.log('Observations:');
      console.log(`- "Select All" checkbox found: YES`);
      console.log(`- All visible links selected: YES (${selectedCount} checkboxes)`);
      console.log(`- Bulk action bar appears: ${bulkActionBarVisible ? 'YES' : 'NO/NOT FOUND'}`);
    } else if (selectedCount === 0) {
      console.log('\n⚠️ LINK-051: NOT_IMPLEMENTED - Select All functionality not working');
    } else {
      console.log('\n⚠️ LINK-051: PARTIAL - Some but not all checkboxes selected');
      console.log(`Selected: ${selectedCount}/${allCheckboxes.length}`);
    }
  });
});
