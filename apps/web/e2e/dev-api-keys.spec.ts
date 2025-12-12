import { test, expect } from '@playwright/test';
import { loginAsUser } from './fixtures/auth';

test.describe.serial('DEV-010 to DEV-014: API Key Creation', () => {
  const APP_URL = 'http://localhost:3010';

  test.beforeEach(async ({ page }) => {
    // Login using fixture function
    await loginAsUser(page, 'owner');

    // Navigate to API Keys page
    await page.goto(`${APP_URL}/dashboard/developer/api-keys`);
    await page.waitForLoadState('networkidle');
  });

  test('DEV-010: Open Create API Key Dialog', async ({ page }) => {
    // Scroll to ensure button is in view
    await page.locator('button:has-text("Create API Key")').first().scrollIntoViewIfNeeded();

    // Click Create API Key button
    const createButton = page.locator('button:has-text("Create API Key")').first();
    await createButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(800);

    // Verify dialog heading
    const dialogHeading = page.locator('text=Create API Key').first();
    const dialogHeadingVisible = await dialogHeading.isVisible().catch(() => false);
    console.log('Dialog heading visible:', dialogHeadingVisible);
    expect(dialogHeadingVisible).toBe(true);

    // Verify Name input field
    const nameInput = page.locator('input[placeholder*="Production Server"]').first();
    const nameInputVisible = await nameInput.isVisible().catch(() => false);
    console.log('Name input visible:', nameInputVisible);
    expect(nameInputVisible).toBe(true);

    // Verify Key Name label
    const keyNameLabel = page.locator('text=Key Name').first();
    const keyNameLabelVisible = await keyNameLabel.isVisible().catch(() => false);
    console.log('Key Name label visible:', keyNameLabelVisible);
    expect(keyNameLabelVisible).toBe(true);

    // Verify Permissions (Scopes) section
    const permissionsLabel = page.locator('text=Permissions (Scopes)').first();
    const permissionsLabelVisible = await permissionsLabel.isVisible().catch(() => false);
    console.log('Permissions (Scopes) label visible:', permissionsLabelVisible);
    expect(permissionsLabelVisible).toBe(true);

    // Verify Advanced Settings button
    const advancedButton = page.locator('button:has-text("Advanced Settings")').first();
    const advancedButtonVisible = await advancedButton.isVisible().catch(() => false);
    console.log('Advanced Settings button visible:', advancedButtonVisible);
    expect(advancedButtonVisible).toBe(true);

    // Verify Cancel button
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    const cancelButtonVisible = await cancelButton.isVisible().catch(() => false);
    console.log('Cancel button visible:', cancelButtonVisible);
    expect(cancelButtonVisible).toBe(true);

    // Verify Create Key button
    const createKeyButton = page.locator('button:has-text("Create Key")').first();
    const createKeyButtonVisible = await createKeyButton.isVisible().catch(() => false);
    console.log('Create Key button visible:', createKeyButtonVisible);
    expect(createKeyButtonVisible).toBe(true);

    console.log('✅ DEV-010 PASSED: Dialog opened with all required elements');

    // Close dialog
    await cancelButton.click();
  });

  test('DEV-011: Create basic API Key', async ({ page }) => {
    // Scroll to ensure button is in view
    await page.locator('button:has-text("Create API Key")').first().scrollIntoViewIfNeeded();

    // Click Create API Key button
    const createButton = page.locator('button:has-text("Create API Key")').first();
    await createButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(800);

    // Enter Name
    const nameInput = page.locator('input[placeholder*="Production Server"]').first();
    await nameInput.fill('Test API Key UAT');

    // Wait for the scopes section to be visible
    await page.waitForTimeout(500);

    // Find all scope checkboxes by looking for parent divs with "flex items-start gap-2 p-2"
    const scopeCheckboxContainers = await page.locator('.flex.items-start.gap-2.p-2').all();

    // Click on the first scope container (link:read)
    if (scopeCheckboxContainers.length > 0) {
      await scopeCheckboxContainers[0].click();
    }

    // Click on the second scope container (link:create)
    if (scopeCheckboxContainers.length > 1) {
      await scopeCheckboxContainers[1].click();
    }

    // Wait a moment for the selected scopes display to appear
    await page.waitForTimeout(500);

    // Click Create button
    const createKeyButton = page.locator('button:has-text("Create Key")').first();
    await createKeyButton.click();

    // Wait for success - the new key display card should appear
    await page.waitForSelector('text=API Key Created!', { timeout: 8000 });

    // Verify the success card
    const successCard = page.locator('text=Copy this key now').first();
    const successVisible = await successCard.isVisible().catch(() => false);
    console.log('Success card visible:', successVisible);
    expect(successVisible).toBe(true);

    // Get the API key from the display
    const keyDisplay = page.locator('code').first();
    const keyText = await keyDisplay.innerText().catch(() => '');
    console.log('API Key format:', keyText.substring(0, 10) + '...');
    expect(keyText).toBeTruthy();
    expect(keyText.startsWith('pk_')).toBeTruthy();

    // Verify Copy button exists
    const copyButton = page.locator('button:has-text("Copy")').first();
    const copyButtonVisible = await copyButton.isVisible().catch(() => false);
    console.log('Copy button visible:', copyButtonVisible);
    expect(copyButtonVisible).toBe(true);

    // Verify warning message
    const warningText = page.locator('text=You won\'t be able to see it again').first();
    const warningVisible = await warningText.isVisible().catch(() => false);
    console.log('Warning message visible:', warningVisible);
    expect(warningVisible).toBe(true);

    // Wait a moment for the key to appear in the table
    await page.waitForTimeout(2000);

    // Verify key appears in the table
    const tableRow = page.locator('text=Test API Key UAT').nth(1); // Second occurrence (in table, not dialog)
    const tableRowVisible = await tableRow.isVisible().catch(() => false);
    console.log('Key in table visible:', tableRowVisible);
    expect(tableRowVisible).toBe(true);

    console.log('✅ DEV-011 PASSED: Basic API Key created successfully');
  });

  test('DEV-012: Create API Key with advanced settings', async ({ page }) => {
    // Scroll to ensure button is in view
    await page.locator('button:has-text("Create API Key")').first().scrollIntoViewIfNeeded();

    // Click Create API Key button
    const createButton = page.locator('button:has-text("Create API Key")').first();
    await createButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(800);

    // Enter Name
    const nameInput = page.locator('input[placeholder*="Production Server"]').first();
    await nameInput.fill('Advanced Key UAT');

    // Wait for the scopes section to be visible
    await page.waitForTimeout(500);

    // Select link:read scope by clicking the container
    const scopeCheckboxContainers = await page.locator('.flex.items-start.gap-2.p-2').all();
    if (scopeCheckboxContainers.length > 0) {
      await scopeCheckboxContainers[0].click();
    }

    // Click "Show Advanced Settings"
    const advancedButton = page.locator('button:has-text("Advanced Settings")').first();
    await advancedButton.click();

    // Wait for advanced settings to expand
    await page.waitForTimeout(500);

    // Enter IP Whitelist
    const ipWhitelistTextarea = page.locator('textarea').first();
    await ipWhitelistTextarea.fill('192.168.1.0/24');

    // Enter Rate Limit
    const rateLimitInput = page.locator('input[type="number"]').first();
    await rateLimitInput.fill('100');

    // Set expiration date using the calendar picker
    const expirationButton = page.locator('button:has-text("No expiration")').first();
    await expirationButton.click();

    // Wait for calendar to appear
    await page.waitForTimeout(500);

    // Find and click a date in the calendar (click the first available clickable date)
    const dateButtons = await page.locator('button[role="button"]').all();
    if (dateButtons.length > 10) {
      // Click a date button (skip header buttons)
      await dateButtons[15].click();
    }

    // Wait for calendar to close
    await page.waitForTimeout(300);

    // Click Create button
    const createKeyButton = page.locator('button:has-text("Create Key")').first();
    await createKeyButton.click();

    // Wait for success
    await page.waitForSelector('text=API Key Created!', { timeout: 8000 });

    // Wait for key to appear in table
    await page.waitForTimeout(2000);

    // Verify key appears in the table
    const tableRow = page.locator('text=Advanced Key UAT').nth(1); // Second occurrence
    const tableRowVisible = await tableRow.isVisible().catch(() => false);
    console.log('Advanced key in table visible:', tableRowVisible);
    expect(tableRowVisible).toBe(true);

    // Verify badges appear for advanced settings
    const ipBadge = page.locator('text=IP Restricted').first();
    const rateBadge = page.locator('text=Rate Limited').first();

    const ipBadgeVisible = await ipBadge.isVisible().catch(() => false);
    const rateBadgeVisible = await rateBadge.isVisible().catch(() => false);

    console.log('IP Restricted badge visible:', ipBadgeVisible);
    console.log('Rate Limited badge visible:', rateBadgeVisible);

    expect(ipBadgeVisible).toBe(true);
    expect(rateBadgeVisible).toBe(true);

    console.log('✅ DEV-012 PASSED: Advanced API Key created with settings');
  });

  test('DEV-013: Validation - Missing Name error', async ({ page }) => {
    // Scroll to ensure button is in view
    await page.locator('button:has-text("Create API Key")').first().scrollIntoViewIfNeeded();

    // Click Create API Key button
    const createButton = page.locator('button:has-text("Create API Key")').first();
    await createButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(800);

    // Do NOT enter Name - leave it empty

    // Wait for the scopes section to be visible
    await page.waitForTimeout(500);

    // Select at least one scope by clicking the container
    const scopeCheckboxContainers = await page.locator('.flex.items-start.gap-2.p-2').all();
    if (scopeCheckboxContainers.length > 0) {
      await scopeCheckboxContainers[0].click();
    }

    // Wait a moment
    await page.waitForTimeout(300);

    // Verify Create button is disabled when name is empty
    const createKeyButton = page.locator('button:has-text("Create Key")').first();
    const isDisabled = await createKeyButton.isDisabled();
    console.log('Create button disabled when name is empty:', isDisabled);
    expect(isDisabled).toBe(true);

    console.log('✅ DEV-013 PASSED: Validation prevents key creation without Name');

    // Close dialog
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
  });

  test('DEV-014: Validation - Missing Scope error', async ({ page }) => {
    // Scroll to ensure button is in view
    await page.locator('button:has-text("Create API Key")').first().scrollIntoViewIfNeeded();

    // Click Create API Key button
    const createButton = page.locator('button:has-text("Create API Key")').first();
    await createButton.click();

    // Wait for dialog to appear
    await page.waitForTimeout(800);

    // Enter Name
    const nameInput = page.locator('input[placeholder*="Production Server"]').first();
    await nameInput.fill('No Scope Key');

    // Do NOT select any scopes - leave them all unchecked

    // Wait a moment
    await page.waitForTimeout(300);

    // Verify Create button is disabled when no scopes selected
    const createKeyButton = page.locator('button:has-text("Create Key")').first();
    const isDisabled = await createKeyButton.isDisabled();
    console.log('Create button disabled when no scopes selected:', isDisabled);
    expect(isDisabled).toBe(true);

    console.log('✅ DEV-014 PASSED: Validation prevents key creation without Scopes');

    // Close dialog
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
  });
});
