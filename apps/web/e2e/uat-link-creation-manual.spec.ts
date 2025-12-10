import { test, expect } from '@playwright/test';
import { loginAsUser } from './fixtures/auth';

/**
 * UAT Manual Test Suite: Link Creation
 * MANUAL EXECUTION - Run each test individually and observe results
 *
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 */

const BASE_URL = 'http://localhost:3010';

// Generate truly unique URLs to avoid duplicate detection
function getUniqueUrl(base: string) {
  return `${base}?t=${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

test.describe('UAT: Link Creation Manual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'owner');
  });

  test('LINK-001: Create Link with Random Slug', async ({ page }) => {
    console.log('\n=== LINK-001: Create Link with Random Slug ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    // Use unique URL to avoid duplicate detection
    const uniqueUrl = getUniqueUrl('https://google.com/search');
    await page.fill('input#originalUrl', uniqueUrl);
    console.log(`✓ Entered Destination URL: ${uniqueUrl}`);

    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]');
    const slugValue = await slugInput.inputValue();
    expect(slugValue).toBe('');
    console.log('✓ Custom Slug is empty');

    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log('✓ Success message "Link Created!" shown');

    await expect(page.locator('text=Your short link is ready to use')).toBeVisible();
    console.log('✓ Success description shown');

    const shortUrlElement = page.locator('text=/localhost:|https?:\/\//').first();
    await expect(shortUrlElement).toBeVisible();
    console.log('✓ Short URL displayed');

    console.log('\n✅ LINK-001: PASS - Link created successfully with random slug\n');
  });

  test('LINK-002: Create Link with Custom Slug', async ({ page }) => {
    console.log('\n=== LINK-002: Create Link with Custom Slug ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    const uniqueUrl = getUniqueUrl('https://example.com/custom-test');
    await page.fill('input#originalUrl', uniqueUrl);
    console.log(`✓ Entered Destination URL: ${uniqueUrl}`);

    const timestamp = Date.now();
    const customSlug = `uat-custom-${timestamp}`;
    await page.fill('input[placeholder="custom-slug (optional)"]', customSlug);
    console.log(`✓ Entered Custom Slug: ${customSlug}`);

    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log('✓ Success message shown');

    const shortUrlElement = page.locator(`text=${customSlug}`).first();
    await expect(shortUrlElement).toBeVisible({ timeout: 5000 });
    console.log(`✓ Short URL shows the custom slug: ${customSlug}`);

    console.log('\n✅ LINK-002: PASS - Link created with custom slug\n');
  });

  test('LINK-003: Create Link with Invalid URL', async ({ page }) => {
    console.log('\n=== LINK-003: Create Link with Invalid URL ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    const invalidUrl = 'invalid-url';
    await page.fill('input#originalUrl', invalidUrl);
    console.log(`✓ Entered invalid URL: ${invalidUrl}`);

    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    await page.waitForTimeout(1000);

    const errorMessage = page.locator('text=Please enter a valid URL');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✓ Validation error shown: "Please enter a valid URL"');

    expect(page.url()).toContain('/dashboard/links/new');
    console.log('✓ Still on create page - link NOT created');

    console.log('\n✅ LINK-003: PASS - Validation error shown, link NOT created\n');
  });

  test('LINK-004: Create Link with Duplicate Slug', async ({ page }) => {
    console.log('\n=== LINK-004: Create Link with Duplicate Slug ===');

    // Step 1: Create first link with a unique slug
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');

    const timestamp = Date.now();
    const existingSlug = `uat-dup-${timestamp}`;
    const uniqueUrl1 = getUniqueUrl('https://example.com/dup-test-1');

    await page.fill('input#originalUrl', uniqueUrl1);
    await page.fill('input[placeholder="custom-slug (optional)"]', existingSlug);
    await page.click('button:has-text("Create your link")');

    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log(`✓ Created first link with slug: ${existingSlug}`);

    // Step 2: Try to create second link with same slug
    await page.click('button:has-text("Create Another")');
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to create form again');

    const uniqueUrl2 = getUniqueUrl('https://example.com/dup-test-2');
    await page.fill('input#originalUrl', uniqueUrl2);
    console.log('✓ Entered different Destination URL');

    await page.fill('input[placeholder="custom-slug (optional)"]', existingSlug);
    console.log(`✓ Entered existing slug: ${existingSlug}`);

    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    await page.waitForTimeout(2000);

    const errorMessage = page.locator('text=/This slug is already taken|already exists|slug is not available/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✓ Error "Slug already taken" shown');

    expect(page.url()).toContain('/dashboard/links/new');
    console.log('✓ Still on create page - link NOT created');

    console.log('\n✅ LINK-004: PASS - Duplicate slug error shown, link NOT created\n');
  });
});

test.describe('UAT: Manual Test Report Summary', () => {
  test('Generate Test Report', async () => {
    console.log('\n' + '='.repeat(70));
    console.log('UAT TEST REPORT: LINK CREATION');
    console.log('='.repeat(70));
    console.log('\nTest Account: e2e-owner@pingtome.test / TestPassword123!');
    console.log('Web URL: http://localhost:3010');
    console.log('Test Date:', new Date().toISOString());
    console.log('\n' + '-'.repeat(70));
    console.log('\nAll tests should have executed. Check the output above for:');
    console.log('- LINK-001: Create Link with Random Slug');
    console.log('- LINK-002: Create Link with Custom Slug');
    console.log('- LINK-003: Create Link with Invalid URL');
    console.log('- LINK-004: Create Link with Duplicate Slug');
    console.log('\n' + '='.repeat(70));
  });
});
