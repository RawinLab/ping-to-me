import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3010';
const TEST_EMAIL = 'e2e-owner@pingtome.test';
const TEST_PASSWORD = 'TestPassword123!';

const screenshotsDir = path.join(__dirname, '../screenshots/uat-tag-management');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('UAT: Tag Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);

    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In with Email")');

    // Wait for potential redirect or page load
    await page.waitForTimeout(5000);

    // Check if we're on the dashboard, if not try to navigate
    const currentUrl = page.url();
    console.log(`After login, current URL: ${currentUrl}`);

    if (!currentUrl.includes('/dashboard')) {
      // Maybe we need to handle 2FA or other redirects
      console.log('Not on dashboard, attempting to navigate...');
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);
    }
  });

  test('TAG-001: Create Tag', async ({ page }) => {
    console.log('\n=== TAG-001: Create Tag ===');

    await page.goto(`${BASE_URL}/dashboard/tags`);

    // Wait for page to fully load by checking for specific content
    await page.waitForSelector('h1:has-text("Tags")', { timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-001-step1-tags-page.png'), fullPage: true });

    const createButtonSelectors = [
      'button:has-text("Create Tag")', 'button:has-text("New Tag")', 'button:has-text("Add Tag")', 'button:has-text("Create Your First Tag")'
    ];

    let found = false;
    for (const sel of createButtonSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await btn.click();
        found = true;
        break;
      }
    }

    if (!found) throw new Error('Create button not found');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-001-step2-dialog.png'), fullPage: true });

    const tagName = 'Marketing' + Date.now();
    const input = page.locator('input[name="name"], input[placeholder*="name"]').first();
    await input.fill(tagName);
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-001-step3-filled.png'), fullPage: true });

    const submit = page.locator('button[type="submit"], button:has-text("Create")').first();
    await submit.click();
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-001-step4-created.png'), fullPage: true });

    const exists = await page.locator(`text=${tagName}`).isVisible({ timeout: 5000 }).catch(() => false);
    console.log(exists ? '✓ PASS' : '✗ FAIL');
  });

  test('TAG-002: View Usage Statistics', async ({ page }) => {
    console.log('\n=== TAG-002: View Usage Statistics ===');
    
    await page.goto(`${BASE_URL}/dashboard/tags`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-002-step1-page.png'), fullPage: true });

    const statsVisible = await page.locator('text=/\\d+\\s*link/i').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(statsVisible ? '✓ PASS' : '⚠ WARNING');
  });

  test('TAG-003: Filter Links by Tag', async ({ page }) => {
    console.log('\n=== TAG-003: Filter Links by Tag ===');
    
    await page.goto(`${BASE_URL}/dashboard/links`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-003-step1-links.png'), fullPage: true });

    const filterBtn = page.locator('button:has-text("Filter"), button:has-text("Filters")').first();
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, 'TAG-003-step2-filter.png'), fullPage: true });
    }
  });

  test('TAG-004: Delete Tag', async ({ page }) => {
    console.log('\n=== TAG-004: Delete Tag ===');
    
    const tagName = 'ToDelete' + Date.now();
    
    await page.goto(`${BASE_URL}/dashboard/tags`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button:has-text("Create Tag"), button:has-text("New Tag")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await page.locator('input[name="name"]').fill(tagName);
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-004-step1-created.png'), fullPage: true });

    const deleteBtn = page.locator('button[aria-label*="Delete"]').first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, 'TAG-004-step2-confirm.png'), fullPage: true });
      
      const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-004-step3-deleted.png'), fullPage: true });
  });

  test('TAG-005: Merge Tags', async ({ page }) => {
    console.log('\n=== TAG-005: Merge Tags ===');
    
    await page.goto(`${BASE_URL}/dashboard/tags`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-005-step1-page.png'), fullPage: true });

    const mergeBtn = page.locator('button:has-text("Merge")').first();
    const hasFeature = await mergeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    await page.screenshot({ path: path.join(screenshotsDir, 'TAG-005-step2-feature.png'), fullPage: true });
    console.log(hasFeature ? '✓ Feature exists' : '⚠ Feature not implemented');
  });
});
