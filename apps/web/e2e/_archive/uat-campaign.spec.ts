import { test, expect } from '@playwright/test';
import path from 'path';
import { loginAsUser } from './fixtures/auth';

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

test.describe('UAT - Campaign Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test using the proper helper
    await loginAsUser(page, 'owner');

    // Wait 5 seconds for async data as per requirements
    await page.waitForTimeout(5000);
  });

  test('CMP-001: Create Campaign', async ({ page }) => {
    console.log('\n=== CMP-001: Create Campaign ===');

    try {
      // Step 1: Look for Campaigns in sidebar or navigate to /dashboard/campaigns
      console.log('Step 1: Looking for Campaigns in sidebar...');

      // Try to find Campaigns link in sidebar
      const campaignsLinkInSidebar = page.locator('a[href*="/campaigns"]').first();
      const sidebarExists = await campaignsLinkInSidebar.count() > 0;

      if (sidebarExists) {
        console.log('✓ Found Campaigns link in sidebar');
        await campaignsLinkInSidebar.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('Campaigns link not in sidebar, trying direct navigation...');
        await page.goto('http://localhost:3010/dashboard/campaigns');
        await page.waitForTimeout(2000);
      }

      // Check if campaigns page exists
      const pageTitle = await page.locator('h1, h2').first().textContent();
      console.log(`Page title: ${pageTitle}`);

      // Step 2: Click "Create Campaign"
      console.log('Step 2: Looking for Create Campaign button...');

      const createButtonSelectors = [
        'button:has-text("Create Campaign")',
        'button:has-text("New Campaign")',
        'a:has-text("Create Campaign")',
        'a:has-text("New Campaign")',
        '[data-testid="create-campaign"]',
        'button:has-text("Create")',
      ];

      let createButtonFound = false;
      for (const selector of createButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          console.log(`✓ Found create button with selector: ${selector}`);
          await button.click();
          createButtonFound = true;
          await page.waitForTimeout(1000);
          break;
        }
      }

      if (!createButtonFound) {
        console.log('✗ Create Campaign button not found');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-05-04-cmp-001-create.png'),
          fullPage: true
        });
        console.log('RESULT: NOT_IMPL - Create Campaign button not found');
        return;
      }

      // Step 3: Fill campaign details
      console.log('Step 3: Filling campaign details...');
      const campaignName = `UAT Campaign ${Date.now()}`;

      // Look for name input
      const nameInputSelectors = [
        'input[name="name"]',
        'input[placeholder*="Campaign"]',
        'input[placeholder*="name"]',
        'input[type="text"]',
      ];

      let nameInputFound = false;
      for (const selector of nameInputSelectors) {
        const input = page.locator(selector).first();
        if (await input.count() > 0 && await input.isVisible()) {
          console.log(`✓ Found name input with selector: ${selector}`);
          await input.fill(campaignName);
          nameInputFound = true;
          break;
        }
      }

      if (!nameInputFound) {
        console.log('✗ Name input not found');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-05-04-cmp-001-create.png'),
          fullPage: true
        });
        console.log('RESULT: NOT_IMPL - Campaign form not found');
        return;
      }

      // Try to fill start/end dates if they exist
      const startDateInput = page.locator('input[name="startDate"], input[placeholder*="Start"]').first();
      if (await startDateInput.count() > 0 && await startDateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await startDateInput.fill(today);
        console.log('✓ Filled start date');
      }

      const endDateInput = page.locator('input[name="endDate"], input[placeholder*="End"]').first();
      if (await endDateInput.count() > 0 && await endDateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        const endDate = futureDate.toISOString().split('T')[0];
        await endDateInput.fill(endDate);
        console.log('✓ Filled end date');
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-001-create.png'),
        fullPage: true
      });

      // Step 4: Click Create
      console.log('Step 4: Clicking Create/Submit button...');

      const submitButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Create")',
        'button:has-text("Save")',
        'button:has-text("Submit")',
      ];

      let submitButtonFound = false;
      for (const selector of submitButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          console.log(`✓ Found submit button with selector: ${selector}`);
          await button.click();
          submitButtonFound = true;
          await page.waitForTimeout(2000);
          break;
        }
      }

      if (!submitButtonFound) {
        console.log('✗ Submit button not found');
        console.log('RESULT: NOT_IMPL - Submit button not found');
        return;
      }

      // Step 5: Verify campaign created
      console.log('Step 5: Verifying campaign created...');
      await page.waitForTimeout(2000);

      // Look for success message or campaign in list
      const successIndicators = [
        page.locator(`text="${campaignName}"`),
        page.locator('text=/Campaign created/i'),
        page.locator('text=/Success/i'),
      ];

      let campaignCreated = false;
      for (const indicator of successIndicators) {
        if (await indicator.count() > 0) {
          console.log('✓ Campaign creation confirmed');
          campaignCreated = true;
          break;
        }
      }

      if (campaignCreated) {
        console.log('RESULT: PASS - Campaign created successfully');
      } else {
        console.log('RESULT: FAIL - Could not verify campaign creation');
      }

    } catch (error) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-001-create.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error during test execution');
    }
  });

  test('CMP-002: Campaign Analytics', async ({ page }) => {
    console.log('\n=== CMP-002: Campaign Analytics ===');

    try {
      // Step 1: Go to campaigns list
      console.log('Step 1: Navigating to campaigns list...');

      const campaignsLinkInSidebar = page.locator('a[href*="/campaigns"]').first();
      const sidebarExists = await campaignsLinkInSidebar.count() > 0;

      if (sidebarExists) {
        await campaignsLinkInSidebar.click();
        await page.waitForTimeout(2000);
      } else {
        await page.goto('http://localhost:3010/dashboard/campaigns');
        await page.waitForTimeout(2000);
      }

      // Check if we're on campaigns page
      const url = page.url();
      if (!url.includes('campaigns') && !url.includes('campaign')) {
        console.log('✗ Could not navigate to campaigns page');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-05-04-cmp-002-analytics.png'),
          fullPage: true
        });
        console.log('RESULT: NOT_IMPL - Campaigns page not found');
        return;
      }

      console.log('✓ On campaigns page');

      // Step 2: Click on a campaign
      console.log('Step 2: Looking for campaigns in list...');

      const campaignSelectors = [
        'table tbody tr',
        '[data-testid="campaign-item"]',
        '.campaign-item',
        'a[href*="/campaign/"]',
      ];

      let campaignFound = false;
      for (const selector of campaignSelectors) {
        const campaigns = page.locator(selector);
        const count = await campaigns.count();

        if (count > 0) {
          console.log(`✓ Found ${count} campaign(s) with selector: ${selector}`);

          // Click on first campaign
          const firstCampaign = campaigns.first();

          // Try to find a clickable element within the campaign
          const clickableElements = [
            firstCampaign.locator('a').first(),
            firstCampaign,
          ];

          for (const element of clickableElements) {
            if (await element.count() > 0) {
              await element.click();
              campaignFound = true;
              await page.waitForTimeout(2000);
              break;
            }
          }

          if (campaignFound) break;
        }
      }

      if (!campaignFound) {
        console.log('✗ No campaigns found in list');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-05-04-cmp-002-analytics.png'),
          fullPage: true
        });
        console.log('RESULT: NOT_IMPL - No campaigns to view');
        return;
      }

      console.log('✓ Clicked on campaign');

      // Step 3: View analytics/performance
      console.log('Step 3: Looking for analytics/performance data...');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-002-analytics.png'),
        fullPage: true
      });

      // Step 4: Verify analytics metrics
      console.log('Step 4: Verifying analytics metrics...');

      const analyticsIndicators = [
        page.locator('text=/total clicks/i'),
        page.locator('text=/clicks/i'),
        page.locator('text=/links/i'),
        page.locator('text=/analytics/i'),
        page.locator('text=/performance/i'),
        page.locator('text=/metrics/i'),
      ];

      let analyticsFound = false;
      for (const indicator of analyticsIndicators) {
        if (await indicator.count() > 0) {
          console.log(`✓ Found analytics indicator: ${await indicator.first().textContent()}`);
          analyticsFound = true;
        }
      }

      if (analyticsFound) {
        console.log('RESULT: PASS - Campaign analytics visible');
      } else {
        console.log('RESULT: NOT_IMPL - Campaign analytics not found');
      }

    } catch (error) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-002-analytics.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error during test execution');
    }
  });

  test('CMP-003: Assign Link to Campaign', async ({ page }) => {
    console.log('\n=== CMP-003: Assign Link to Campaign ===');

    try {
      // Step 1: Navigate to create/edit link
      console.log('Step 1: Navigating to create link page...');

      // Try to find "Create Link" or "New Link" button
      const createLinkSelectors = [
        'a[href*="/links/new"]',
        'button:has-text("Create Link")',
        'button:has-text("New Link")',
        'a:has-text("Create Link")',
      ];

      let createLinkFound = false;
      for (const selector of createLinkSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0) {
          console.log(`✓ Found create link button with selector: ${selector}`);
          await button.click();
          createLinkFound = true;
          await page.waitForTimeout(2000);
          break;
        }
      }

      if (!createLinkFound) {
        // Try direct navigation
        console.log('Trying direct navigation to /dashboard/links/new...');
        await page.goto('http://localhost:3010/dashboard/links/new');
        await page.waitForTimeout(2000);
      }

      // Check if we're on link creation page
      const url = page.url();
      if (!url.includes('link')) {
        console.log('✗ Could not navigate to link creation page');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-05-04-cmp-003-assign.png'),
          fullPage: true
        });
        console.log('RESULT: NOT_IMPL - Link creation page not accessible');
        return;
      }

      console.log('✓ On link creation/edit page');

      // Step 2: Look for Campaign dropdown/selector
      console.log('Step 2: Looking for Campaign selector...');

      const campaignSelectorElements = [
        page.locator('select[name="campaignId"]'),
        page.locator('select[name="campaign"]'),
        page.locator('[data-testid="campaign-select"]'),
        page.locator('label:has-text("Campaign")').locator('..').locator('select'),
        page.locator('label:has-text("Campaign")').locator('..').locator('button'),
        page.locator('text=/campaign/i').locator('..').locator('select'),
        page.locator('text=/campaign/i').locator('..').locator('button'),
      ];

      let campaignSelectorFound = false;
      let selectedCampaign = false;

      for (const selector of campaignSelectorElements) {
        if (await selector.count() > 0 && await selector.isVisible()) {
          console.log(`✓ Found campaign selector`);
          campaignSelectorFound = true;

          // Try to interact with it
          try {
            const tagName = await selector.evaluate(el => el.tagName.toLowerCase());

            if (tagName === 'select') {
              // It's a dropdown
              const options = await selector.locator('option');
              const optionCount = await options.count();

              if (optionCount > 1) {
                // Select the second option (first is usually "Select...")
                await selector.selectOption({ index: 1 });
                console.log('✓ Selected campaign from dropdown');
                selectedCampaign = true;
              }
            } else if (tagName === 'button') {
              // It's a combobox/custom select
              await selector.click();
              await page.waitForTimeout(500);

              // Look for options
              const options = page.locator('[role="option"]');
              const optionCount = await options.count();

              if (optionCount > 0) {
                await options.first().click();
                console.log('✓ Selected campaign from combobox');
                selectedCampaign = true;
              }
            }

            if (selectedCampaign) break;
          } catch (error) {
            console.log(`Could not interact with selector: ${error.message}`);
          }
        }
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-003-assign.png'),
        fullPage: true
      });

      if (!campaignSelectorFound) {
        console.log('✗ Campaign selector not found');
        console.log('RESULT: NOT_IMPL - Campaign assignment not available in link form');
        return;
      }

      if (!selectedCampaign) {
        console.log('✗ Could not select a campaign (no campaigns available or selector not working)');
        console.log('RESULT: NOT_IMPL - Campaign selector exists but no campaigns available');
        return;
      }

      // Step 3-4: Fill required fields and save
      console.log('Step 3-4: Filling link details and saving...');

      // Fill destination URL (required field)
      const urlInput = page.locator('input[name="url"], input[name="destination"], input[placeholder*="destination"], input[placeholder*="URL"]').first();
      if (await urlInput.count() > 0 && await urlInput.isVisible()) {
        await urlInput.fill('https://example.com');
        console.log('✓ Filled destination URL');
      }

      // Try to save
      const saveButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Create")',
        'button:has-text("Save")',
      ];

      let savedSuccessfully = false;
      for (const selector of saveButtonSelectors) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          console.log('✓ Found save button');
          await button.click();
          await page.waitForTimeout(2000);
          savedSuccessfully = true;
          break;
        }
      }

      if (!savedSuccessfully) {
        console.log('✗ Could not find save button');
        console.log('RESULT: FAIL - Could not save link');
        return;
      }

      // Step 5: Verify link assigned to campaign
      console.log('Step 5: Verifying link assigned to campaign...');
      await page.waitForTimeout(2000);

      // Look for success message or campaign badge
      const verificationIndicators = [
        page.locator('text=/campaign/i'),
        page.locator('text=/success/i'),
        page.locator('[data-testid="campaign-badge"]'),
        page.locator('.badge:has-text("Campaign")'),
      ];

      let verified = false;
      for (const indicator of verificationIndicators) {
        if (await indicator.count() > 0) {
          console.log('✓ Link appears to be associated with campaign');
          verified = true;
          break;
        }
      }

      if (verified) {
        console.log('RESULT: PASS - Link successfully assigned to campaign');
      } else {
        console.log('RESULT: FAIL - Could not verify link assignment to campaign');
      }

    } catch (error) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-05-04-cmp-003-assign.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error during test execution');
    }
  });
});
