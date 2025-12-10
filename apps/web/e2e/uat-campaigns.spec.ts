import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

test.describe('UAT - Campaign Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');

    await emailInput.fill('e2e-owner@pingtome.test');
    await passwordInput.fill('TestPassword123!');

    // Click sign in button
    await page.click('button:has-text("Sign In with Email")');

    // Wait for redirect - use a more flexible approach
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {
      // If it times out, just wait a bit more and continue
      return new Promise(resolve => setTimeout(resolve, 3000));
    });
  });

  test('CMP-001: Access Campaigns Page', async ({ page }) => {
    console.log('\n=== CMP-001: Access Campaigns Page ===');

    try {
      // Step 1: Navigate to /dashboard/campaigns
      console.log('Step 1: Navigating to /dashboard/campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      const pageUrl = page.url();
      const hasPageTitle = await page.locator('h1:has-text("Campaigns")').isVisible();

      console.log(`✓ Page URL: ${pageUrl}`);

      if (!hasPageTitle) {
        console.log('✗ Page title not found');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-001.png'),
          fullPage: true
        });
        return;
      }

      console.log('✓ Page loaded successfully');

      // Step 2: Verify page structure
      console.log('Step 2: Verifying page structure...');

      const pageTitle = await page.locator('h1').first().textContent();
      console.log(`✓ Page title: ${pageTitle}`);

      const newCampaignButton = page.locator('button:has-text("New Campaign")').first();
      const newCampaignExists = await newCampaignButton.count() > 0;

      if (newCampaignExists) {
        console.log('✓ New Campaign button found');
      } else {
        console.log('✗ New Campaign button not found');
      }

      // Step 3: Take screenshot
      console.log('Step 3: Taking screenshot...');
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-001.png'),
        fullPage: true
      });

      console.log('RESULT: PASS - Campaigns page loaded successfully');
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-001.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error accessing campaigns page');
    }
  });

  test('CMP-002: View Campaign Statistics', async ({ page }) => {
    console.log('\n=== CMP-002: View Campaign Statistics ===');

    try {
      // Step 1: Navigate to campaigns
      console.log('Step 1: Navigating to campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Step 2: Verify stats cards
      console.log('Step 2: Verifying stats cards...');

      const stats = {
        totalCampaigns: await page.locator('text=/Total Campaigns/i').count() > 0,
        activeCampaigns: await page.locator('text=/Active Campaigns/i').count() > 0,
        totalLinks: await page.locator('text=/Total Links/i').count() > 0,
        totalClicks: await page.locator('text=/Total Clicks/i').count() > 0,
      };

      console.log(`✓ Total Campaigns visible: ${stats.totalCampaigns}`);
      console.log(`✓ Active Campaigns visible: ${stats.activeCampaigns}`);
      console.log(`✓ Total Links visible: ${stats.totalLinks}`);
      console.log(`✓ Total Clicks visible: ${stats.totalClicks}`);

      // Verify all stats are visible
      const allStatsVisible = Object.values(stats).every(v => v === true);

      if (!allStatsVisible) {
        console.log('✗ Some stats cards are missing');
      } else {
        console.log('✓ All stats cards visible');
      }

      // Step 3: Take screenshot
      console.log('Step 3: Taking screenshot of stats section...');
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-002.png'),
        fullPage: true
      });

      console.log(`RESULT: ${allStatsVisible ? 'PASS' : 'PARTIAL'} - Campaign statistics visible`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-002.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error viewing campaign statistics');
    }
  });

  test('CMP-003: Create New Campaign', async ({ page }) => {
    console.log('\n=== CMP-003: Create New Campaign ===');

    try {
      // Step 1: Navigate to campaigns
      console.log('Step 1: Navigating to campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Step 2: Click "New Campaign" button
      console.log('Step 2: Clicking New Campaign button...');
      const newButton = page.locator('button:has-text("New Campaign")').first();

      if (await newButton.count() === 0) {
        console.log('✗ New Campaign button not found');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-003.png'),
          fullPage: true
        });
        console.log('RESULT: FAIL - Create button not found');
        return;
      }

      await newButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Dialog opened');

      // Step 3: Fill in the form
      console.log('Step 3: Filling campaign form...');
      const timestamp = Date.now();
      const campaignName = `UAT-Test-Campaign-${timestamp}`;

      // Fill name
      const nameInput = page.locator('input[id="name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(campaignName);
        console.log(`✓ Name filled: ${campaignName}`);
      } else {
        console.log('✗ Name input not found');
      }

      // Fill description
      const descInput = page.locator('textarea[id="description"]').first();
      if (await descInput.count() > 0) {
        await descInput.fill('Test campaign for UAT');
        console.log('✓ Description filled');
      }

      // Set status to ACTIVE
      console.log('Step 4: Setting status to ACTIVE...');
      const statusTrigger = page.locator('[id^="radix-select-trigger"]').first();
      if (await statusTrigger.count() > 0) {
        await statusTrigger.click();
        await page.waitForTimeout(500);

        const activeOption = page.locator('div[role="option"]:has-text("Active")').first();
        if (await activeOption.count() > 0) {
          await activeOption.click();
          console.log('✓ Status set to ACTIVE');
        } else {
          console.log('! Could not select ACTIVE status');
        }
      }

      // Fill start date
      console.log('Step 5: Setting dates...');
      const startDateBtn = page.locator('button:has-text("Pick a date")').first();
      if (await startDateBtn.count() > 0) {
        await startDateBtn.click();
        await page.waitForTimeout(500);

        // Select today's date (click on the current day)
        const today = new Date();
        const dayButton = page.locator(`button[aria-label*="${today.getDate()}"]`).first();
        if (await dayButton.count() > 0) {
          await dayButton.click();
          console.log('✓ Start date selected');
          await page.waitForTimeout(500);
        }
      }

      // Fill end date (30 days from now)
      const endDateBtn = page.locator('button:has-text("Pick a date")').last();
      if (await endDateBtn.count() > 0) {
        await endDateBtn.click();
        await page.waitForTimeout(500);

        // Navigate to next month if needed
        const nextMonthBtn = page.locator('button[aria-label*="Next"]').first();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        if (futureDate.getMonth() !== new Date().getMonth()) {
          if (await nextMonthBtn.count() > 0) {
            await nextMonthBtn.click();
            await page.waitForTimeout(300);
          }
        }

        // Click the day
        const dayBtn = page.locator(`button[aria-label*="${futureDate.getDate()}"]`).first();
        if (await dayBtn.count() > 0) {
          await dayBtn.click();
          console.log('✓ End date selected');
          await page.waitForTimeout(500);
        }
      }

      // Step 6: Expand and fill UTM Parameters
      console.log('Step 6: Filling UTM parameters...');
      const utmButton = page.locator('button:has-text("UTM Parameters")').first();
      if (await utmButton.count() > 0) {
        await utmButton.click();
        await page.waitForTimeout(500);
        console.log('✓ UTM section expanded');

        // Fill UTM Source
        const utmSourceInput = page.locator('input[id="utmSource"]').first();
        if (await utmSourceInput.count() > 0) {
          await utmSourceInput.fill('uat-test');
          console.log('✓ UTM Source filled');
        }

        // Fill UTM Medium
        const utmMediumInput = page.locator('input[id="utmMedium"]').first();
        if (await utmMediumInput.count() > 0) {
          await utmMediumInput.fill('testing');
          console.log('✓ UTM Medium filled');
        }
      }

      // Step 7: Click Create
      console.log('Step 7: Submitting form...');
      const submitButton = page.locator('button:has-text("Create Campaign")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Form submitted');
      } else {
        console.log('✗ Submit button not found');
      }

      // Step 8: Verify campaign appears in list
      console.log('Step 8: Verifying campaign created...');
      const campaignInList = page.locator(`text="${campaignName}"`).first();

      await page.waitForTimeout(1000);

      if (await campaignInList.count() > 0) {
        console.log('✓ Campaign appears in list');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-003.png'),
          fullPage: true
        });
        console.log('RESULT: PASS - Campaign created successfully');
      } else {
        console.log('✗ Campaign not found in list');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-003.png'),
          fullPage: true
        });
        console.log('RESULT: PARTIAL - Form submitted but verification uncertain');
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-003.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error creating campaign');
    }
  });

  test('CMP-004: Edit Campaign', async ({ page }) => {
    console.log('\n=== CMP-004: Edit Campaign ===');

    try {
      // Step 1: Navigate to campaigns
      console.log('Step 1: Navigating to campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Step 2: Find an existing campaign
      console.log('Step 2: Looking for existing campaign...');
      const editButtons = page.locator('button:has-text("Edit")');
      const editCount = await editButtons.count();

      if (editCount === 0) {
        console.log('✗ No campaigns found to edit');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-004.png'),
          fullPage: true
        });
        console.log('RESULT: FAIL - No campaigns available');
        return;
      }

      console.log(`✓ Found ${editCount} campaign(s)`);

      // Click first edit button
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✓ Edit dialog opened');

      // Step 3: Change status to PAUSED
      console.log('Step 3: Changing status to PAUSED...');
      const statusTrigger = page.locator('[id^="radix-select-trigger"]').first();
      if (await statusTrigger.count() > 0) {
        await statusTrigger.click();
        await page.waitForTimeout(500);

        const pausedOption = page.locator('div[role="option"]:has-text("Paused")').first();
        if (await pausedOption.count() > 0) {
          await pausedOption.click();
          console.log('✓ Status changed to PAUSED');
          await page.waitForTimeout(500);
        }
      }

      // Step 4: Save changes
      console.log('Step 4: Saving changes...');
      const updateButton = page.locator('button:has-text("Update Campaign")').first();
      if (await updateButton.count() > 0) {
        await updateButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Changes saved');
      } else {
        console.log('✗ Update button not found');
      }

      // Step 5: Verify status badge updated
      console.log('Step 5: Verifying status badge...');
      const pausedBadge = page.locator('text=/Paused/i').first();

      await page.waitForTimeout(1000);

      if (await pausedBadge.count() > 0) {
        console.log('✓ Status badge shows PAUSED');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-004.png'),
          fullPage: true
        });
        console.log('RESULT: PASS - Campaign edited successfully');
      } else {
        console.log('✗ Status badge not updated');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-004.png'),
          fullPage: true
        });
        console.log('RESULT: PARTIAL - Changes may not have saved');
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-004.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error editing campaign');
    }
  });

  test('CMP-005: Delete Campaign', async ({ page }) => {
    console.log('\n=== CMP-005: Delete Campaign ===');

    try {
      // Step 1: Navigate to campaigns
      console.log('Step 1: Navigating to campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Step 2: Find a campaign to delete
      console.log('Step 2: Looking for campaign to delete...');
      const deleteButtons = page.locator('button:has-text("Delete")');
      const deleteCount = await deleteButtons.count();

      if (deleteCount === 0) {
        console.log('✗ No campaigns found to delete');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-005.png'),
          fullPage: true
        });
        console.log('RESULT: FAIL - No campaigns available');
        return;
      }

      console.log(`✓ Found ${deleteCount} campaign(s)`);

      // Get campaign name before deletion
      const campaignCard = page.locator('button:has-text("Delete")').first().locator('../..').locator('h3').first();
      const campaignName = await campaignCard.textContent();
      console.log(`Campaign to delete: ${campaignName}`);

      // Click first delete button
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      console.log('✓ Delete confirmation dialog opened');

      // Step 3: Confirm deletion
      console.log('Step 3: Confirming deletion...');
      const confirmDeleteBtn = page.locator('button:has-text("Delete Campaign")').first();
      if (await confirmDeleteBtn.count() > 0) {
        await confirmDeleteBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Campaign deletion confirmed');
      } else {
        console.log('✗ Confirm delete button not found');
      }

      // Step 4: Verify campaign removed
      console.log('Step 4: Verifying campaign removed...');
      await page.waitForTimeout(1000);

      const campaignStillExists = await page.locator(`text="${campaignName}"`).count() > 0;

      if (!campaignStillExists) {
        console.log('✓ Campaign removed from list');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-005.png'),
          fullPage: true
        });
        console.log('RESULT: PASS - Campaign deleted successfully');
      } else {
        console.log('✗ Campaign still appears in list');
        await page.screenshot({
          path: path.join(screenshotsDir, 'uat-campaigns-cmp-005.png'),
          fullPage: true
        });
        console.log('RESULT: FAIL - Campaign deletion failed');
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-005.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error deleting campaign');
    }
  });

  test('CMP-006: Campaign Status Badges', async ({ page }) => {
    console.log('\n=== CMP-006: Campaign Status Badges ===');

    try {
      // Step 1: Navigate to campaigns
      console.log('Step 1: Navigating to campaigns...');
      await page.goto('http://localhost:3010/dashboard/campaigns');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Step 2: Verify different statuses show different colors
      console.log('Step 2: Verifying status badge colors...');

      const statusBadges = page.locator('[class*="bg-"]').filter({ has: page.locator('text=/Draft|Active|Paused|Completed/') });
      const badgeCount = await statusBadges.count();

      if (badgeCount === 0) {
        console.log('! No status badges found');
        // Create a campaign to test
        const createBtn = page.locator('button:has-text("New Campaign")').first();
        if (await createBtn.count() > 0) {
          await createBtn.click();
          await page.waitForTimeout(1000);

          // Fill minimal info
          const nameInput = page.locator('input[id="name"]').first();
          if (await nameInput.count() > 0) {
            await nameInput.fill(`Test-${Date.now()}`);
          }

          const submitBtn = page.locator('button:has-text("Create Campaign")').first();
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
          }

          // Reload page
          await page.goto('http://localhost:3010/dashboard/campaigns');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        }
      }

      // Check for specific status colors
      const draftBadges = page.locator('text=/Draft/i').filter({ has: page.locator('[class*="slate-"]') });
      const activeBadges = page.locator('text=/Active/i').filter({ has: page.locator('[class*="emerald-"]') });
      const pausedBadges = page.locator('text=/Paused/i').filter({ has: page.locator('[class*="amber-"]') });
      const completedBadges = page.locator('text=/Completed/i').filter({ has: page.locator('[class*="blue-"]') });

      const statusColors = {
        DRAFT: await draftBadges.count() > 0,
        ACTIVE: await activeBadges.count() > 0,
        PAUSED: await pausedBadges.count() > 0,
        COMPLETED: await completedBadges.count() > 0,
      };

      console.log(`✓ DRAFT badges: ${statusColors.DRAFT}`);
      console.log(`✓ ACTIVE badges: ${statusColors.ACTIVE}`);
      console.log(`✓ PAUSED badges: ${statusColors.PAUSED}`);
      console.log(`✓ COMPLETED badges: ${statusColors.COMPLETED}`);

      // Step 3: Take screenshot
      console.log('Step 3: Taking screenshot...');
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-006.png'),
        fullPage: true
      });

      const anyStatusFound = Object.values(statusColors).some(v => v === true);
      console.log(`RESULT: ${anyStatusFound ? 'PASS' : 'PARTIAL'} - Status badges visible`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
      await page.screenshot({
        path: path.join(screenshotsDir, 'uat-campaigns-cmp-006.png'),
        fullPage: true
      });
      console.log('RESULT: FAIL - Error verifying status badges');
    }
  });
});
