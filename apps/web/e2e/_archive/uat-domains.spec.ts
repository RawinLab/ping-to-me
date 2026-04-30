/**
 * UAT Test: Custom Domains
 *
 * Test Cases:
 * - DOM-001: Add Custom Domain
 * - DOM-002: Display DNS Configuration
 *
 * Test User: e2e-owner@pingtome.test / TestPassword123!
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!',
};

const TEST_DOMAIN = 'test-uat-001.example.com';

test.describe('UAT: Custom Domains', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button:has-text("Sign In with Email")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Navigate to domains page
    await page.goto('http://localhost:3010/dashboard/domains');
    await page.waitForLoadState('networkidle');
  });

  test('DOM-001: Add Custom Domain', async ({ page }) => {
    console.log('=== DOM-001: Testing Add Custom Domain ===');

    // Take screenshot of initial state
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-initial.png', fullPage: true });

    // Step 1: Click "Add Domain" button
    console.log('Step 1: Clicking Add Domain button...');
    const addButton = page.getByRole('button', { name: /Add Domain/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-modal-open.png', fullPage: true });

    // Step 2: Fill in domain name
    console.log(`Step 2: Entering domain: ${TEST_DOMAIN}`);
    const hostnameInput = page.locator('input#hostname');
    await expect(hostnameInput).toBeVisible();
    await hostnameInput.fill(TEST_DOMAIN);

    // Take screenshot after filling domain
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-filled.png', fullPage: true });

    // Step 3: Click Add button in modal
    console.log('Step 3: Submitting domain...');
    const submitButton = page.getByRole('button', { name: 'Add Domain' });
    await submitButton.click();

    // Wait a bit for API call
    await page.waitForTimeout(2000);

    // Take screenshot of current state
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-after-submit.png', fullPage: true });

    // Check if we're in the success state or if there's an error
    const successMessage = page.locator('text=Domain Added!');
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|failed/i });

    // Wait for either success or error
    try {
      await Promise.race([
        successMessage.waitFor({ state: 'visible', timeout: 8000 }),
        errorAlert.waitFor({ state: 'visible', timeout: 8000 })
      ]);
    } catch (e) {
      console.log('Neither success nor error message appeared. Taking debug screenshot...');
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-timeout.png', fullPage: true });
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText?.substring(0, 500));
    }

    // Check what state we're in
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log('Error occurred:', errorText);
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-error.png', fullPage: true });
      throw new Error(`Domain creation failed: ${errorText}`);
    }

    // Should be in success state now
    await expect(successMessage).toBeVisible();
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-success.png', fullPage: true });

    // Step 4: Verify DNS instructions are shown
    console.log('Step 4: Verifying DNS instructions...');
    const txtRecordLabel = page.locator('text=Add this TXT record to your DNS:');
    await expect(txtRecordLabel).toBeVisible();

    // Verify TXT record fields
    const txtType = page.locator('text=TXT').first();
    const txtName = page.locator('text=_pingto-verify');
    await expect(txtType).toBeVisible();
    await expect(txtName).toBeVisible();

    // Verify verification token is displayed
    const verificationToken = page.locator('code.text-blue-600').first();
    await expect(verificationToken).toBeVisible();
    const tokenText = await verificationToken.textContent();
    console.log('Verification token displayed:', tokenText);

    // Close modal
    const doneButton = page.getByRole('button', { name: 'Done' });
    await doneButton.click();

    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

    // Step 5: Verify domain appears in list
    console.log('Step 5: Verifying domain in list...');
    await page.waitForTimeout(1000); // Wait for list to refresh

    const domainCard = page.locator(`text=${TEST_DOMAIN}`);
    await expect(domainCard).toBeVisible();

    // Verify status badge
    const pendingBadge = page.locator('text=Pending').first();
    await expect(pendingBadge).toBeVisible();

    // Take final screenshot
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-list.png', fullPage: true });

    console.log('✅ DOM-001: PASS - Domain added successfully with DNS instructions');
  });

  test('DOM-002: Display DNS Configuration', async ({ page }) => {
    console.log('=== DOM-002: Testing DNS Configuration Display ===');

    // First, add a domain (reuse DOM-001 logic)
    const addButton = page.getByRole('button', { name: /Add Domain/i });
    await addButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const hostnameInput = page.locator('input#hostname');
    await hostnameInput.fill(`test-uat-002.example.com`);

    const submitButton = page.getByRole('button', { name: 'Add Domain' });
    await submitButton.click();

    await page.waitForSelector('text=Domain Added!', { timeout: 10000 });

    const doneButton = page.getByRole('button', { name: 'Done' });
    await doneButton.click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    await page.waitForTimeout(1000);

    // Take screenshot of domains list
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-002-list.png', fullPage: true });

    // Step 1: Find the pending domain card
    console.log('Step 1: Locating pending domain...');
    const domainCard = page.locator('text=test-uat-002.example.com').first();
    await expect(domainCard).toBeVisible();

    // Step 2: Verify DNS Configuration section is visible
    console.log('Step 2: Verifying DNS Configuration section...');
    const dnsConfigSection = page.locator('text=DNS Configuration Required');
    await expect(dnsConfigSection).toBeVisible();

    // Step 3: Verify TXT Record display
    console.log('Step 3: Checking TXT Record...');
    const txtRecord = page.locator('span:has-text("TXT")').first();
    await expect(txtRecord).toBeVisible();

    const txtRecordName = page.locator('text=_pingto-verify').first();
    await expect(txtRecordName).toBeVisible();

    // Verify verification token
    const verificationToken = page.locator('span.text-blue-600').filter({ hasText: /pingto_verify_/ }).first();
    await expect(verificationToken).toBeVisible();
    const tokenValue = await verificationToken.textContent();
    console.log('TXT Record token:', tokenValue);

    // Step 4: Verify CNAME Record display (if shown)
    console.log('Step 4: Checking CNAME Record...');
    // Note: The UI shows CNAME by default, but may show TXT if TXT verification is chosen
    const cnameRecord = page.locator('text=redirect.pingto.me').first();
    if (await cnameRecord.isVisible()) {
      console.log('CNAME record visible: redirect.pingto.me');
    }

    // Step 5: Verify Copy buttons are present
    console.log('Step 5: Verifying Copy buttons...');
    const copyButtons = page.locator('button').filter({ has: page.locator('svg') });
    const copyButtonCount = await copyButtons.count();
    console.log(`Found ${copyButtonCount} action buttons (including copy buttons)`);

    // Test copy functionality
    const firstCopyButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    if (await firstCopyButton.isVisible()) {
      await firstCopyButton.click();
      console.log('Clicked copy button - clipboard functionality triggered');
      await page.waitForTimeout(500);
    }

    // Step 6: Verify "Verify Now" button
    console.log('Step 6: Verifying "Verify Now" button...');
    const verifyButton = page.getByRole('button', { name: /Verify Now/i });
    await expect(verifyButton).toBeVisible();

    // Take final screenshot
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-002-dns-config.png', fullPage: true });

    console.log('✅ DOM-002: PASS - DNS Configuration displayed correctly');
  });
});
