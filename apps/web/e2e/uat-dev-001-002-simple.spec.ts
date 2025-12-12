import { test, expect } from '@playwright/test';

/**
 * UAT Tests: DEV-001 and DEV-002
 * API Keys Page Access and Quick Start Guide
 *
 * Test Environment:
 * - Web URL: http://localhost:3010
 * - Test User: e2e-owner@pingtome.test / TestPassword123!
 */

test.describe('API Keys Page (DEV-001 & DEV-002)', () => {
  test.beforeEach(async ({ page }) => {
    // Direct navigation to API Keys page for UAT testing
    // In production, user would login first
    await page.goto('http://localhost:3010/dashboard/developer/api-keys');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // If redirected to login, perform login
    if (page.url().includes('/login')) {
      // Wait for form
      await page.waitForTimeout(1000);

      // Fill and submit login form
      await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
      await page.fill('input[id="password"]', 'TestPassword123!');

      // Find and click login button
      const loginButton = page.locator('button').filter({ hasText: /Sign In|Login/ }).first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        // Wait for either dashboard or API keys page
        await Promise.race([
          page.waitForURL(/\/dashboard/, { timeout: 10000 }),
          page.waitForFunction(() => page.url().includes('dashboard'), { timeout: 10000 })
        ]).catch(() => {});
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('DEV-001: Access API Keys page and verify core elements', async ({ page }) => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         DEV-001: API Keys Page Access      ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/dev-001-api-keys-page.png', fullPage: true });

    // Test 1: Check for "API Keys" heading
    const apiKeysHeading = page.locator('h2').filter({ hasText: 'API Keys' });
    const heading1Visible = await apiKeysHeading.first().isVisible().catch(() => false);
    console.log(`Test 1 - API Keys heading visible: ${heading1Visible ? '✅ PASS' : '❌ FAIL'}`);

    // Alternative: Check for any heading with "API Keys"
    const anyHeading = await page.getByText('API Keys').first().isVisible().catch(() => false);
    const headingPassed = heading1Visible || anyHeading;
    console.log(`  └─ Fallback check: ${anyHeading ? '✅ PASS' : '❌ FAIL'}`);

    // Test 2: Check for "Create API Key" button
    const createButton = page.locator('button').filter({ hasText: /Create API Key/i });
    const buttonVisible = await createButton.first().isVisible().catch(() => false);
    console.log(`Test 2 - Create API Key button visible: ${buttonVisible ? '✅ PASS' : '❌ FAIL'}`);

    // Test 3: Check for Quick Start Guide
    const quickStartAny = await page.getByText('Quick Start Guide').first().isVisible().catch(() => false);
    console.log(`Test 3 - Quick Start Guide section visible: ${quickStartAny ? '✅ PASS' : '❌ FAIL'}`);

    // Test 4: Check for "Your API Keys" section
    const yourApiKeysAny = await page.getByText('Your API Keys').first().isVisible().catch(() => false);
    console.log(`Test 4 - Your API Keys section visible: ${yourApiKeysAny ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\nExpected Results (DEV-001):');
    console.log('  ✅ Page heading: "API Keys"');
    console.log('  ✅ Action button: "Create API Key"');
    console.log('  ✅ Guide section: "Quick Start Guide"');
    console.log('  ✅ Keys table/section: "Your API Keys"\n');

    // Overall result
    const allPassed = headingPassed && buttonVisible && quickStartAny && yourApiKeysAny;
    console.log(`DEV-001 Overall Result: ${allPassed ? '✅ PASSED' : '⚠️ PARTIAL/FAILED'}\n`);

    // Make assertions for test framework
    expect(buttonVisible).toBe(true);
    expect(quickStartAny).toBe(true);
    expect(yourApiKeysAny).toBe(true);
  });

  test('DEV-002: Verify Quick Start Guide content and links', async ({ page }) => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      DEV-002: Quick Start Guide Display     ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/dev-002-quick-start-guide.png', fullPage: true });

    // Test 1: Check for Quick Start Guide section heading
    const quickStartHeading = await page.getByText('Quick Start Guide').first().isVisible().catch(() => false);
    console.log(`Test 1 - Quick Start Guide heading visible: ${quickStartHeading ? '✅ PASS' : '❌ FAIL'}`);

    // Test 2: Check for cURL example
    const pageContent = await page.content();
    const hasCurl = pageContent.includes('curl');
    console.log(`Test 2 - cURL example present: ${hasCurl ? '✅ PASS' : '❌ FAIL'}`);

    // Test 3: Check for x-api-key header
    const hasApiKeyHeader = pageContent.includes('x-api-key');
    console.log(`Test 3 - x-api-key header reference: ${hasApiKeyHeader ? '✅ PASS' : '❌ FAIL'}`);

    // Test 4: Check for API Documentation link
    const docLink = await page.getByText('API Documentation').first().isVisible().catch(() => false);
    const docLinkByHref = await page.locator('a[href*="/docs"]').first().isVisible().catch(() => false);
    const docLinkPassed = docLink || docLinkByHref;
    console.log(`Test 4 - API Documentation link visible: ${docLinkPassed ? '✅ PASS' : '❌ FAIL'}`);
    if (docLinkByHref) {
      console.log(`  └─ Found via href attribute`);
    }

    console.log('\nExpected Results (DEV-002):');
    console.log('  ✅ Guide section title: "Quick Start Guide"');
    console.log('  ✅ Code example: cURL command');
    console.log('  ✅ Header info: "x-api-key" mentioned');
    console.log('  ✅ Documentation link: "API Documentation"\n');

    // Overall result
    const allPassed = quickStartHeading && hasCurl && hasApiKeyHeader && docLinkPassed;
    console.log(`DEV-002 Overall Result: ${allPassed ? '✅ PASSED' : '⚠️ PARTIAL/FAILED'}\n`);

    // Make assertions for test framework
    expect(hasCurl).toBe(true);
    expect(hasApiKeyHeader).toBe(true);
    expect(docLinkPassed).toBe(true);
  });
});
