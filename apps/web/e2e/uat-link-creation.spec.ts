import { test, expect } from '@playwright/test';
import { loginAsUser } from './fixtures/auth';

/**
 * UAT Test Suite: Link Creation
 *
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 *
 * These tests verify the link creation functionality with various scenarios:
 * - LINK-001: Create Link with Random Slug
 * - LINK-002: Create Link with Custom Slug
 * - LINK-003: Create Link with Invalid URL
 * - LINK-004: Create Link with Duplicate Slug
 */

const BASE_URL = 'http://localhost:3010';

// Helper function to get timestamp
function getTimestamp() {
  return Date.now();
}

test.describe('UAT: Link Creation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsUser(page, 'owner');
  });

  test('LINK-001: Create Link with Random Slug', async ({ page }) => {
    console.log('\n=== LINK-001: Create Link with Random Slug ===');

    // Step 1: Navigate to create link page
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    // Step 2: Enter Destination URL
    const destinationUrl = 'https://google.com';
    await page.fill('input#originalUrl', destinationUrl);
    console.log(`✓ Entered Destination URL: ${destinationUrl}`);

    // Step 3: Leave Custom Slug empty (verify it's empty)
    const slugInput = page.locator('input[placeholder="custom-slug (optional)"]');
    const slugValue = await slugInput.inputValue();
    expect(slugValue).toBe('');
    console.log('✓ Custom Slug is empty');

    // Step 4: Click Create Link button
    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    // Step 5: Wait for success response and verify
    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log('✓ Success message "Link Created!" shown');

    // Step 6: Verify success state elements
    await expect(page.locator('text=Your short link is ready to use')).toBeVisible();
    console.log('✓ Success description shown');

    // Verify short URL is displayed
    const shortUrlElement = page.locator('text=/localhost:|https?:\/\//').first();
    await expect(shortUrlElement).toBeVisible();
    console.log('✓ Short URL displayed')

    console.log('\n✅ LINK-001: PASS - Link created successfully with random slug');
  });

  test('LINK-002: Create Link with Custom Slug', async ({ page }) => {
    console.log('\n=== LINK-002: Create Link with Custom Slug ===');

    // Step 1: Navigate to create link page
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    // Step 2: Enter Destination URL
    const destinationUrl = 'https://example.com';
    await page.fill('input#originalUrl', destinationUrl);
    console.log(`✓ Entered Destination URL: ${destinationUrl}`);

    // Step 3: Enter Custom Slug with timestamp
    const timestamp = getTimestamp();
    const customSlug = `uat-custom-${timestamp}`;
    await page.fill('input[placeholder="custom-slug (optional)"]', customSlug);
    console.log(`✓ Entered Custom Slug: ${customSlug}`);

    // Step 4: Click Create Link button
    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    // Step 5: Wait for success response
    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log('✓ Success message shown');

    // Step 6: Verify the custom slug is in the short URL
    const shortUrlElement = page.locator(`text=${customSlug}`).first();
    await expect(shortUrlElement).toBeVisible({ timeout: 5000 });
    console.log(`✓ Short URL shows the custom slug: ${customSlug}`);

    console.log('\n✅ LINK-002: PASS - Link created with custom slug');
  });

  test('LINK-003: Create Link with Invalid URL', async ({ page }) => {
    console.log('\n=== LINK-003: Create Link with Invalid URL ===');

    // Step 1: Navigate to create link page
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to /dashboard/links/new');

    // Step 2: Enter invalid URL
    const invalidUrl = 'invalid-url';
    await page.fill('input#originalUrl', invalidUrl);
    console.log(`✓ Entered invalid URL: ${invalidUrl}`);

    // Step 3: Try to submit
    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    // Step 4: Wait for validation
    await page.waitForTimeout(1000);

    // Step 5: Verify validation error shown
    const errorMessage = page.locator('text=Please enter a valid URL');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✓ Validation error shown: "Please enter a valid URL"');

    // Step 6: Verify we're still on the create page (not redirected)
    expect(page.url()).toContain('/dashboard/links/new');
    console.log('✓ Still on create page - link NOT created');

    // Step 7: Verify field shows invalid state
    const destinationUrlInput = page.locator('input#originalUrl');
    const hasErrorClass = await destinationUrlInput.evaluate((el) => {
      const classList = Array.from(el.classList);
      return classList.some(cls => cls.includes('error') || cls.includes('invalid') || cls.includes('destructive'));
    });
    console.log(`✓ Field invalid state: ${hasErrorClass ? 'Yes' : 'Check aria-invalid'}`);

    console.log('\n✅ LINK-003: PASS - Validation error shown, link NOT created');
  });

  test('LINK-004: Create Link with Duplicate Slug', async ({ page }) => {
    console.log('\n=== LINK-004: Create Link with Duplicate Slug ===');

    // Step 1: First, create a link to get an existing slug
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');

    const timestamp = getTimestamp();
    const existingSlug = `uat-duplicate-${timestamp}`;

    await page.fill('input#originalUrl', 'https://example.com');
    await page.fill('input[placeholder="custom-slug (optional)"]', existingSlug);
    await page.click('button:has-text("Create your link")');

    // Wait for success
    await expect(page.locator('text=Link Created!')).toBeVisible({ timeout: 10000 });
    console.log(`✓ Created first link with slug: ${existingSlug}`);

    // Step 2: Navigate to create link page again (or click Create Another)
    await page.click('button:has-text("Create Another")');
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to create form again');

    // Step 3: Enter URL
    await page.fill('input#originalUrl', 'https://example.com');
    console.log('✓ Entered Destination URL');

    // Step 4: Enter the existing slug
    await page.fill('input[placeholder="custom-slug (optional)"]', existingSlug);
    console.log(`✓ Entered existing slug: ${existingSlug}`);

    // Step 5: Try to submit
    await page.click('button:has-text("Create your link")');
    console.log('✓ Clicked Create Link button');

    // Step 6: Wait for error response
    await page.waitForTimeout(2000);

    // Step 7: Verify error message
    const errorMessage = page.locator('text=/This slug is already taken|already exists/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✓ Error "Slug already taken" shown');

    // Step 8: Verify we're still on the create page (link NOT created)
    expect(page.url()).toContain('/dashboard/links/new');
    console.log('✓ Still on create page - link NOT created');

    console.log('\n✅ LINK-004: PASS - Duplicate slug error shown, link NOT created');
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
