import { test, expect } from '@playwright/test';

/**
 * UAT Tests for API Keys Page Access
 * Test Cases: DEV-001 and DEV-002
 *
 * Test Environment:
 * - Web URL: http://localhost:3010
 * - API URL: http://localhost:3001
 * - Test User: e2e-owner@pingtome.test / TestPassword123!
 *
 * Prerequisites:
 * 1. Database must be seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers must be running: pnpm dev
 */

test.describe('DEV-001 & DEV-002: API Keys Page Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');

    // Wait for form to be ready
    await page.waitForTimeout(1000);

    // Fill credentials
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');

    await emailInput.fill('e2e-owner@pingtome.test');
    await passwordInput.fill('TestPassword123!');

    // Click login button - look for any button with "Sign In"
    const loginButton = page.locator('button').filter({ hasText: /Sign In|Login/i }).first();
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Navigate to API Keys page
    await page.goto('http://localhost:3010/dashboard/developer/api-keys');
    await page.waitForLoadState('networkidle');
  });

  test('DEV-001: Access API Keys page and verify page elements', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/dev-001-initial.png', fullPage: true });

    // Expected results from DEV-001 test case
    console.log('\n=== DEV-001: API Keys Page Access ===\n');

    // 1. Check for "API Keys" heading
    const apiKeysHeading = page.locator('h2').filter({ hasText: /^API Keys$/ });
    const apiKeysHeadingVisible = await apiKeysHeading.first().isVisible();
    console.log(`✓ API Keys heading visible: ${apiKeysHeadingVisible}`);
    expect(apiKeysHeadingVisible).toBe(true);

    // 2. Check for "Create API Key" button
    const createButton = page.locator('button').filter({ hasText: /Create API Key/i }).first();
    const createButtonVisible = await createButton.isVisible();
    console.log(`✓ Create API Key button visible: ${createButtonVisible}`);
    expect(createButtonVisible).toBe(true);

    // 3. Check for Quick Start Guide section
    const quickStartText = page.locator('div').filter({ hasText: /Quick Start Guide/ }).first();
    const quickStartVisible = await quickStartText.isVisible();
    console.log(`✓ Quick Start Guide section visible: ${quickStartVisible}`);
    expect(quickStartVisible).toBe(true);

    // 4. Check for "Your API Keys" section
    const yourApiKeysSection = page.locator('div').filter({ hasText: /Your API Keys/ }).first();
    const yourApiKeysSectionVisible = await yourApiKeysSection.isVisible();
    console.log(`✓ Your API Keys section visible: ${yourApiKeysSectionVisible}`);
    expect(yourApiKeysSectionVisible).toBe(true);

    console.log('\n✅ DEV-001: PASSED - All page elements visible\n');
  });

  test('DEV-002: Display Quick Start Guide with correct content', async ({ page }) => {
    // Take screenshot of page
    await page.screenshot({ path: 'test-results/dev-002-guide.png', fullPage: true });

    console.log('\n=== DEV-002: Quick Start Guide Display ===\n');

    // 1. Check for Quick Start Guide section heading
    const quickStartSection = page.locator('div').filter({ hasText: /Quick Start Guide/ }).first();
    const quickStartVisible = await quickStartSection.isVisible();
    console.log(`✓ Quick Start Guide section visible: ${quickStartVisible}`);
    expect(quickStartVisible).toBe(true);

    // 2. Check for cURL example in the page content
    const pageContent = await page.innerText('body');
    const hasCurlExample = pageContent.includes('curl');
    console.log(`✓ cURL example present: ${hasCurlExample}`);
    expect(hasCurlExample).toBe(true);

    // 3. Check for x-api-key header in page
    const hasApiKeyHeader = pageContent.includes('x-api-key');
    console.log(`✓ x-api-key header reference present: ${hasApiKeyHeader}`);
    expect(hasApiKeyHeader).toBe(true);

    // 4. Check for API Documentation link
    const docLink = page.locator('a, div').filter({ hasText: /API Documentation/ }).first();
    const docLinkVisible = await docLink.isVisible();
    console.log(`✓ API Documentation link visible: ${docLinkVisible}`);
    expect(docLinkVisible).toBe(true);

    console.log('\n✅ DEV-002: PASSED - Quick Start Guide properly displayed\n');
  });

  test('DEV-010: Open Create API Key Dialog and verify dialog elements', async ({ page }) => {
    console.log('\n=== DEV-010: Create API Key Dialog ===\n');

    // Scroll to ensure button is in view
    const createButton = page.locator('button').filter({ hasText: /Create API Key/i }).first();
    await createButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click Create API Key button
    await createButton.click();
    await page.waitForTimeout(800);

    // Take screenshot of dialog
    await page.screenshot({ path: 'test-results/dev-010-dialog.png', fullPage: true });

    // Check dialog is visible
    const dialogHeading = page.locator('*').filter({ hasText: /Create API Key/ }).first();
    const dialogHeadingVisible = await dialogHeading.isVisible();
    console.log(`✓ Create API Key dialog visible: ${dialogHeadingVisible}`);
    expect(dialogHeadingVisible).toBe(true);

    // Check for Name input field
    const nameInput = page.locator('input[placeholder*="Production"]');
    const nameInputVisible = await nameInput.isVisible();
    console.log(`✓ Name input field visible: ${nameInputVisible}`);
    expect(nameInputVisible).toBe(true);

    // Check for "Key Name" label
    const keyNameLabel = page.locator('label').filter({ hasText: /Key Name/ }).first();
    const keyNameLabelVisible = await keyNameLabel.isVisible();
    console.log(`✓ Key Name label visible: ${keyNameLabelVisible}`);
    expect(keyNameLabelVisible).toBe(true);

    // Check for "Permissions (Scopes)" label
    const permissionsLabel = page.locator('label, div').filter({ hasText: /Permissions \(Scopes\)/ }).first();
    const permissionsLabelVisible = await permissionsLabel.isVisible();
    console.log(`✓ Permissions (Scopes) label visible: ${permissionsLabelVisible}`);
    expect(permissionsLabelVisible).toBe(true);

    // Check for Advanced Settings button
    const advancedButton = page.locator('button').filter({ hasText: /Advanced/ }).first();
    const advancedButtonVisible = await advancedButton.isVisible();
    console.log(`✓ Advanced Settings button visible: ${advancedButtonVisible}`);
    expect(advancedButtonVisible).toBe(true);

    // Check for Cancel button
    const cancelButton = page.locator('button').filter({ hasText: /Cancel/ }).first();
    const cancelButtonVisible = await cancelButton.isVisible();
    console.log(`✓ Cancel button visible: ${cancelButtonVisible}`);
    expect(cancelButtonVisible).toBe(true);

    // Check for Create Key button
    const createKeyButton = page.locator('button').filter({ hasText: /Create Key/ }).first();
    const createKeyButtonVisible = await createKeyButton.isVisible();
    console.log(`✓ Create Key button visible: ${createKeyButtonVisible}`);
    expect(createKeyButtonVisible).toBe(true);

    // Close dialog
    await cancelButton.click();
    await page.waitForTimeout(500);

    console.log('\n✅ DEV-010: PASSED - Create API Key dialog fully functional\n');
  });
});
