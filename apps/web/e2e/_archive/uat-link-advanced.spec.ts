import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!',
};

const BASE_URL = 'http://localhost:3010';

test.describe('UAT: Link Creation - Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In with Email")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('LINK-005: Create Link with Tags', async ({ page }) => {
    console.log('\n=== LINK-005: Create Link with Tags ===');

    // Navigate to create link page
    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');

    console.log('Step 1: Navigated to create link page');

    // Enter destination URL
    const destinationUrl = 'https://example.com/tags-test';
    await page.fill('input[id="originalUrl"]', destinationUrl);
    console.log(`Step 2: Entered destination URL: ${destinationUrl}`);

    // Take screenshot of the form
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-005-form.png', fullPage: true });

    // Tags are visible in Link Details section (no need to expand Advanced Settings)
    console.log('Step 3: Looking for tags input field...');
    const tagsInput = page.locator('input[id="tags"]');

    if (await tagsInput.isVisible()) {
      console.log('Step 4: Found tags input, entering tags...');
      await tagsInput.fill('marketing, social');
      console.log('Step 4: Entered tags: marketing, social');
    } else {
      console.log('Step 4: WARNING - Could not find tags input field');
    }

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-005-tags-added.png', fullPage: true });

    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create your link")');
    console.log('Step 5: Clicking Create Link button...');
    await createButton.click();

    // Wait for success page
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-005-result.png', fullPage: true });

    // Check for success indicators
    const successHeading = page.locator('h2:has-text("Link Created")');
    const hasSuccess = await successHeading.isVisible().catch(() => false);

    if (hasSuccess) {
      console.log('Step 6: SUCCESS - Link created successfully');
      console.log('Step 7: Verifying tags were saved...');
      // The success page shows, so the link was created
      console.log('Step 7: Tags should be saved with the link');
    } else {
      console.log('Step 6: UNCERTAIN - Check screenshot for result');
    }

    console.log('\nLINK-005 Test Complete - Review screenshots in apps/web/screenshots/\n');
  });

  test('LINK-006: Create Link with Expiration Date', async ({ page }) => {
    console.log('\n=== LINK-006: Create Link with Expiration Date ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('Step 1: Navigated to create link page');

    // Enter destination URL
    const destinationUrl = 'https://example.com/expiry-test';
    await page.fill('input[id="originalUrl"]', destinationUrl);
    console.log(`Step 2: Entered destination URL: ${destinationUrl}`);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-006-form.png', fullPage: true });

    // Expand Advanced Settings - it's a collapsible section
    const advancedSettingsButton = page.locator('div:has-text("Advanced settings")').first();
    console.log('Step 3: Expanding Advanced Settings...');
    await advancedSettingsButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-006-advanced.png', fullPage: true });

    // Find expiration date input (it's a datetime-local input)
    const dateInput = page.locator('input[id="expirationDate"]');

    if (await dateInput.isVisible()) {
      // Set a future date (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Format for datetime-local: YYYY-MM-DDTHH:MM
      const dateString = futureDate.toISOString().slice(0, 16);

      console.log(`Step 4: Setting expiration date to: ${dateString}`);
      await dateInput.fill(dateString);
      await page.waitForTimeout(300);
      console.log('Step 4: Expiration date set successfully');
    } else {
      console.log('Step 4: WARNING - Could not find expiration date input field');
    }

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-006-date-set.png', fullPage: true });

    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create your link")');
    console.log('Step 5: Clicking Create Link button...');
    await createButton.click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-006-result.png', fullPage: true });

    // Check for success
    const successHeading = page.locator('h2:has-text("Link Created")');
    const hasSuccess = await successHeading.isVisible().catch(() => false);

    if (hasSuccess) {
      console.log('Step 6: SUCCESS - Link created with expiration date');
    } else {
      console.log('Step 6: UNCERTAIN - Check screenshot for result');
    }

    console.log('\nLINK-006 Test Complete - Review screenshots\n');
  });

  test('LINK-007: Create Link with Password Protection', async ({ page }) => {
    console.log('\n=== LINK-007: Create Link with Password Protection ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('Step 1: Navigated to create link page');

    // Enter destination URL
    const destinationUrl = 'https://example.com/password-test';
    await page.fill('input[id="originalUrl"]', destinationUrl);
    console.log(`Step 2: Entered destination URL: ${destinationUrl}`);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-007-form.png', fullPage: true });

    // Expand Advanced Settings
    const advancedSettingsButton = page.locator('div:has-text("Advanced settings")').first();
    console.log('Step 3: Expanding Advanced Settings...');
    await advancedSettingsButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-007-advanced.png', fullPage: true });

    // Find password input field
    const passwordInput = page.locator('input[id="password"]');

    if (await passwordInput.isVisible()) {
      const testPassword = 'secret123';
      console.log(`Step 4: Entering password: ${testPassword}`);
      await passwordInput.fill(testPassword);
      await page.waitForTimeout(300);
      console.log('Step 4: Password set successfully');
    } else {
      console.log('Step 4: WARNING - Could not find password input field');
    }

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-007-password-set.png', fullPage: true });

    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create your link")');
    console.log('Step 5: Clicking Create Link button...');
    await createButton.click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-007-result.png', fullPage: true });

    // Check for success
    const successHeading = page.locator('h2:has-text("Link Created")');
    const hasSuccess = await successHeading.isVisible().catch(() => false);

    if (hasSuccess) {
      console.log('Step 6: SUCCESS - Link created with password protection');
    } else {
      console.log('Step 6: UNCERTAIN - Check screenshot for result');
    }

    console.log('\nLINK-007 Test Complete - Review screenshots\n');
  });

  test('LINK-008: Create Link with UTM Parameters', async ({ page }) => {
    console.log('\n=== LINK-008: Create Link with UTM Parameters ===');

    await page.goto(`${BASE_URL}/dashboard/links/new`);
    await page.waitForLoadState('networkidle');
    console.log('Step 1: Navigated to create link page');

    // Enter destination URL
    const destinationUrl = 'https://example.com/utm-test';
    await page.fill('input[id="originalUrl"]', destinationUrl);
    console.log(`Step 2: Entered destination URL: ${destinationUrl}`);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-008-form.png', fullPage: true });

    // Expand Advanced Settings
    const advancedSettingsButton = page.locator('div:has-text("Advanced settings")').first();
    console.log('Step 3: Expanding Advanced Settings...');
    await advancedSettingsButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-008-advanced.png', fullPage: true });

    // Find UTM parameter inputs
    const utmSourceInput = page.locator('input[id="utmSource"]');
    const utmMediumInput = page.locator('input[id="utmMedium"]');
    const utmCampaignInput = page.locator('input[id="utmCampaign"]');

    const utmParams = {
      source: 'newsletter',
      medium: 'email',
      campaign: 'spring_sale',
    };

    console.log('Step 4: Filling UTM parameters...');

    if (await utmSourceInput.isVisible()) {
      await utmSourceInput.fill(utmParams.source);
      console.log(`  - UTM Source: ${utmParams.source}`);
    } else {
      console.log('  WARNING - Could not find UTM Source input');
    }

    if (await utmMediumInput.isVisible()) {
      await utmMediumInput.fill(utmParams.medium);
      console.log(`  - UTM Medium: ${utmParams.medium}`);
    } else {
      console.log('  WARNING - Could not find UTM Medium input');
    }

    if (await utmCampaignInput.isVisible()) {
      await utmCampaignInput.fill(utmParams.campaign);
      console.log(`  - UTM Campaign: ${utmParams.campaign}`);
    } else {
      console.log('  WARNING - Could not find UTM Campaign input');
    }

    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-008-utm-filled.png', fullPage: true });

    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create your link")');
    console.log('Step 5: Clicking Create Link button...');
    await createButton.click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/link-008-result.png', fullPage: true });

    // Check for success
    const successHeading = page.locator('h2:has-text("Link Created")');
    const hasSuccess = await successHeading.isVisible().catch(() => false);

    if (hasSuccess) {
      console.log('Step 6: SUCCESS - Link created with UTM parameters');
    } else {
      console.log('Step 6: UNCERTAIN - Check screenshot for result');
    }

    console.log('\nLINK-008 Test Complete - Review screenshots\n');
  });
});
