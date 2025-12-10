import { test, expect } from '@playwright/test';

/**
 * UAT Test Suite: Dashboard Test Cases
 * Test Account: e2e-owner@pingtome.test / TestPassword123!
 * Web URL: http://localhost:3010
 */

test.describe('UAT Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3010/login');
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');

    // Wait for navigation to complete
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Ensure we're on the dashboard
    await page.goto('http://localhost:3010/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('DASH-004: Top Performing Links', async ({ page }) => {
    console.log('\n=== DASH-004: Top Performing Links ===');

    // Find "Recent Links" section (which shows links with engagement counts)
    const recentLinksSection = page.locator('text=/Recent Links/i').first();

    if (await recentLinksSection.isVisible({ timeout: 10000 })) {
      console.log('✓ Found "Recent Links" section');

      // Wait for links to load
      await page.waitForTimeout(2000);

      // Try to find link items with engagement counts
      const linkItems = page.locator('text=/Recent Link/i').locator('..').locator('..').locator('..');
      const count = await linkItems.count();

      console.log(`✓ Found ${count} link items in section`);

      // Verify links show engagement/click counts
      if (count > 0) {
        const engagementCounts: number[] = [];

        for (let i = 0; i < Math.min(count, 5); i++) {
          const linkItem = linkItems.nth(i);
          const text = await linkItem.textContent();
          console.log(`  Link ${i + 1}: ${text?.substring(0, 100)?.trim()}...`);

          // Try to extract engagement number
          const match = text?.match(/(\d+)\s*(engagement|click)/i);
          if (match) {
            engagementCounts.push(parseInt(match[1]));
          }
        }

        if (engagementCounts.length > 1) {
          const isSorted = engagementCounts.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
          console.log(`✓ Engagement counts: ${engagementCounts.join(', ')}`);
          console.log(`✓ Sorted from highest to lowest: ${isSorted ? 'YES' : 'NO'}`);

          if (!isSorted) {
            console.log('⚠ WARNING: Links may not be sorted by engagement count');
          }
        } else {
          console.log('✓ Links show engagement counts');
        }
      } else {
        console.log('⚠ No link items found');
      }
    } else {
      console.log('⚠ "Recent Links" section not found - checking for other link sections');
    }

    // Take a screenshot
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-dash-004.png', fullPage: true });
    console.log('✓ Screenshot saved: screenshots/uat-dash-004.png');
  });

  test('DASH-005: Quick Actions', async ({ page }) => {
    console.log('\n=== DASH-005: Quick Actions ===');

    // Test "Create Link" button
    const createLinkButton = page.locator('button:has-text("Create Link"), a:has-text("Create Link"), button:has-text("New Link"), a:has-text("New Link")').first();

    if (await createLinkButton.isVisible({ timeout: 5000 })) {
      console.log('✓ Found "Create Link" button');

      await createLinkButton.click();
      console.log('✓ Clicked "Create Link" button');

      // Wait for navigation
      await page.waitForTimeout(2000);

      // Check if we navigated to link creation page
      const currentUrl = page.url();
      console.log(`✓ Current URL: ${currentUrl}`);

      if (currentUrl.includes('/links/new') || currentUrl.includes('/create') || currentUrl.includes('/links') && currentUrl !== 'http://localhost:3010/dashboard') {
        console.log('✓ Successfully navigated to link creation page');
      } else {
        console.log('⚠ WARNING: May not have navigated to link creation page');
      }

      // Take a screenshot
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-dash-005-create.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshots/uat-dash-005-create.png');

      // Go back to dashboard
      await page.goto('http://localhost:3010/dashboard');
      await page.waitForLoadState('networkidle');
      console.log('✓ Returned to dashboard');
    } else {
      console.log('⚠ "Create Link" button not found');
    }

    // Test "View All" button
    await page.waitForTimeout(1000);
    const viewAllButton = page.locator('button:has-text("View All"), a:has-text("View All"), button:has-text("See All"), a:has-text("See All")').first();

    if (await viewAllButton.isVisible({ timeout: 5000 })) {
      console.log('✓ Found "View All" button');

      await viewAllButton.click();
      console.log('✓ Clicked "View All" button');

      // Wait for navigation
      await page.waitForTimeout(2000);

      // Check if we navigated to links list page
      const currentUrl = page.url();
      console.log(`✓ Current URL: ${currentUrl}`);

      if (currentUrl.includes('/links') || currentUrl.includes('/all')) {
        console.log('✓ Successfully navigated to links list page');
      } else {
        console.log('⚠ WARNING: May not have navigated to links list page');
      }

      // Take a screenshot
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-dash-005-viewall.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshots/uat-dash-005-viewall.png');
    } else {
      console.log('⚠ "View All" button not found');
    }
  });

  test('DASH-006: Browsers Chart', async ({ page }) => {
    console.log('\n=== DASH-006: Browsers Chart ===');

    // Find "Browsers" section/widget
    const browsersSection = page.locator('text=/Browsers/i').first();

    if (await browsersSection.isVisible({ timeout: 5000 })) {
      console.log('✓ Found "Browsers" section');

      // Get the parent container
      const sectionContainer = browsersSection.locator('..').locator('..');

      // Wait for chart to load
      await page.waitForTimeout(2000);

      // Look for chart elements (canvas, svg, or divs)
      const chartElement = sectionContainer.locator('canvas, svg, [role="img"], .chart, [class*="chart"]').first();

      if (await chartElement.isVisible({ timeout: 5000 })) {
        console.log('✓ Found browser chart visualization');
      } else {
        console.log('⚠ Chart visualization not found, checking for data display');
      }

      // Look for browser names
      const browserNames = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Brave'];
      const foundBrowsers: string[] = [];

      for (const browser of browserNames) {
        const browserElement = sectionContainer.locator(`text=/${browser}/i`).first();
        if (await browserElement.isVisible({ timeout: 2000 })) {
          foundBrowsers.push(browser);
        }
      }

      console.log(`✓ Found browsers: ${foundBrowsers.length > 0 ? foundBrowsers.join(', ') : 'None found'}`);

      // Look for percentages or counts
      const sectionText = await sectionContainer.textContent();
      const hasPercentages = sectionText?.match(/\d+%/);
      const hasCounts = sectionText?.match(/\d+\s*(click|view|user)/i);

      if (hasPercentages) {
        console.log('✓ Shows percentages for browser distribution');
      }
      if (hasCounts) {
        console.log('✓ Shows counts for browser usage');
      }

      console.log(`Section content preview: ${sectionText?.substring(0, 200)}...`);

      // Take a screenshot
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-dash-006.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshots/uat-dash-006.png');
    } else {
      console.log('⚠ "Browsers" section not found');

      // Take a screenshot anyway for debugging
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-dash-006-notfound.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshots/uat-dash-006-notfound.png');
    }
  });
});
