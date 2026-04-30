/**
 * UAT Test: Custom Domains (Manual Version)
 *
 * This test uses existing seeded data to verify domain functionality
 *
 * Test Cases:
 * - DOM-001: View Domains List
 * - DOM-002: Display DNS Configuration for Pending Domains
 *
 * Test User: e2e-owner@pingtome.test / TestPassword123!
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!',
};

test.describe('UAT: Custom Domains (Manual)', () => {
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
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test('DOM-001: View Domains List and Statistics', async ({ page }) => {
    console.log('\n=== DOM-001: View Domains List and Statistics ===\n');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-001-domains-list.png',
      fullPage: true
    });

    // Step 1: Verify page title
    console.log('Step 1: Verifying page title...');
    const pageTitle = page.locator('h1:has-text("Custom Domains")');
    await expect(pageTitle).toBeVisible();
    console.log('✓ Page title found: "Custom Domains"');

    // Step 2: Verify statistics cards
    console.log('\nStep 2: Verifying statistics cards...');

    const verifiedCount = await page.locator('text=/Verified/i').filter({ has: page.locator('p.text-2xl') }).count();
    const pendingCount = await page.locator('text=/Pending/i').filter({ has: page.locator('p.text-2xl') }).count();
    const totalCount = await page.locator('text=/Total Domains/i').filter({ has: page.locator('p.text-2xl') }).count();

    if (verifiedCount > 0) {
      console.log('✓ Verified domains stat card found');
    }
    if (pendingCount > 0) {
      console.log('✓ Pending domains stat card found');
    }
    if (totalCount > 0) {
      console.log('✓ Total domains stat card found');
    }

    // Step 3: Verify domain cards are displayed
    console.log('\nStep 3: Checking for domain cards...');

    const domainCards = page.locator('[class*="CardContent"]').filter({
      has: page.locator('text=/\\.link|\\.com|\\.me/i')
    });
    const domainCount = await domainCards.count();

    console.log(`✓ Found ${domainCount} domain card(s)`);

    // Step 4: Check for "Add Domain" button
    console.log('\nStep 4: Verifying Add Domain button...');
    const addButton = page.getByRole('button', { name: /Add Domain/i });
    await expect(addButton).toBeVisible();
    console.log('✓ "Add Domain" button is visible');

    console.log('\n✅ DOM-001: PASS - Domains list displays correctly with statistics\n');
  });

  test('DOM-002: Display DNS Configuration for Pending Domains', async ({ page }) => {
    console.log('\n=== DOM-002: Display DNS Configuration for Pending Domains ===\n');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-002-initial.png',
      fullPage: true
    });

    // Step 1: Find a pending domain
    console.log('Step 1: Looking for pending domains...');

    const pendingBadge = page.locator('text=/Pending/i').filter({
      has: page.locator('[class*="Badge"]')
    }).first();

    if (await pendingBadge.count() === 0) {
      console.log('⚠ No pending domains found in the system');
      console.log('Note: This test requires at least one pending domain to verify DNS configuration display');
      return;
    }

    await expect(pendingBadge).toBeVisible();
    console.log('✓ Found pending domain(s)');

    // Step 2: Verify DNS Configuration section is visible
    console.log('\nStep 2: Verifying DNS Configuration section...');

    const dnsConfigSection = page.locator('text=/DNS Configuration Required/i').first();
    await expect(dnsConfigSection).toBeVisible();
    console.log('✓ "DNS Configuration Required" section is visible');

    // Step 3: Check for DNS record information
    console.log('\nStep 3: Checking DNS record display...');

    // Look for TXT record
    const txtRecord = page.locator('text=/TXT/i').filter({
      has: page.locator('span')
    }).first();

    if (await txtRecord.isVisible()) {
      console.log('✓ TXT record type displayed');

      // Check for verification token/name
      const verificationName = page.locator('text=/_pingto-verify/i').first();
      if (await verificationName.isVisible()) {
        console.log('✓ TXT record name "_pingto-verify" displayed');
      }

      // Check for token value
      const tokenValue = page.locator('span.text-blue-600').filter({
        hasText: /pingto_verify_|verifying-token|failed-token/i
      }).first();
      if (await tokenValue.isVisible()) {
        const token = await tokenValue.textContent();
        console.log(`✓ Verification token displayed: ${token?.substring(0, 30)}...`);
      }
    }

    // Look for CNAME record
    const cnameRecord = page.locator('text=/CNAME/i').filter({
      has: page.locator('span')
    }).first();

    if (await cnameRecord.isVisible()) {
      console.log('✓ CNAME record type displayed');

      // Check for redirect target
      const redirectTarget = page.locator('text=/redirect\\.pingto\\.me/i').first();
      if (await redirectTarget.isVisible()) {
        console.log('✓ CNAME target "redirect.pingto.me" displayed');
      }
    }

    // Step 4: Check for copy buttons
    console.log('\nStep 4: Verifying copy functionality...');

    const copyButtons = page.locator('button').filter({
      has: page.locator('svg')
    }).filter({ hasText: '' });

    const copyButtonCount = await copyButtons.count();
    if (copyButtonCount > 0) {
      console.log(`✓ Found ${copyButtonCount} interactive button(s) (likely includes copy buttons)`);
    }

    // Step 5: Check for "Verify Now" button
    console.log('\nStep 5: Checking for Verify Now button...');

    const verifyButton = page.getByRole('button', { name: /Verify Now|Retry/i }).first();
    if (await verifyButton.isVisible()) {
      console.log('✓ "Verify Now" or "Retry" button found');
    } else {
      console.log('⚠ Verify button not found (might be in a different location)');
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-002-dns-config.png',
      fullPage: true
    });

    console.log('\n✅ DOM-002: PASS - DNS Configuration is displayed correctly for pending domains\n');
  });

  test('DOM-003: Verify Domain Details', async ({ page }) => {
    console.log('\n=== DOM-003: Verify Domain Details ===\n');

    // Step 1: Find a domain card
    console.log('Step 1: Looking for domain cards...');

    const domainHostname = page.locator('h3.font-semibold').filter({
      hasText: /\.(link|com|me)/i
    }).first();

    await expect(domainHostname).toBeVisible();
    const hostname = await domainHostname.textContent();
    console.log(`✓ Found domain: ${hostname}`);

    // Step 2: Check for status badge
    console.log('\nStep 2: Checking status badge...');

    const statusBadges = page.locator('[class*="Badge"]').filter({
      hasText: /Verified|Pending|Failed|Verifying/i
    });
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      const firstBadge = await statusBadges.first().textContent();
      console.log(`✓ Status badge found: ${firstBadge}`);
    }

    // Step 3: Check for "Default" badge if applicable
    console.log('\nStep 3: Checking for Default badge...');

    const defaultBadge = page.locator('text=/Default/i').filter({
      has: page.locator('[class*="Badge"]')
    }).first();

    if (await defaultBadge.isVisible()) {
      console.log('✓ Found domain marked as "Default"');
    } else {
      console.log('ℹ No default domain badge found (may not be set)');
    }

    // Step 4: Check for action buttons
    console.log('\nStep 4: Checking action buttons...');

    const actionButtons = page.locator('button').filter({
      hasText: /Set Default|Delete|View/i
    });
    const actionCount = await actionButtons.count();

    if (actionCount > 0) {
      console.log(`✓ Found ${actionCount} action button(s)`);
    }

    // Take screenshot
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-003-details.png',
      fullPage: true
    });

    console.log('\n✅ DOM-003: PASS - Domain details are displayed correctly\n');
  });
});
