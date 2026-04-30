import { test, expect } from '@playwright/test';

test.describe('UAT Analytics Manual Navigation - ANA-002 & ANA-003', () => {
  test('Manual Navigation and Testing', async ({ page }) => {
    console.log('Step 1: Login');
    await page.goto('http://localhost:3010/login');
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');

    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✓ Logged in successfully');

    console.log('Step 2: Navigate to /dashboard/links');
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');

    // Take screenshot of links page
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-links-page.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-links-page.png');

    // Wait a moment and check page content
    await page.waitForTimeout(2000);

    // Get page content to see what's available
    const pageContent = await page.content();
    console.log('Page title:', await page.title());

    // Try to find any links on the page
    const allLinks = await page.locator('a').count();
    console.log(`Found ${allLinks} anchor tags on the page`);

    // Look for any card elements
    const cards = await page.locator('[class*="card"]').count();
    console.log(`Found ${cards} card elements on the page`);

    // Look for analytics-related text or buttons
    const analyticsText = await page.locator('text=/analytics/i').count();
    console.log(`Found ${analyticsText} elements with "analytics" text`);

    // Try to find any chart icons
    const chartIcons = await page.locator('svg').count();
    console.log(`Found ${chartIcons} SVG icons on the page`);

    // Look for any data-testid attributes
    const testIds = await page.locator('[data-testid]').count();
    console.log(`Found ${testIds} elements with data-testid attributes`);

    if (testIds > 0) {
      const testIdElements = await page.locator('[data-testid]').all();
      console.log('Available data-testid values:');
      for (const element of testIdElements.slice(0, 10)) {
        const testId = await element.getAttribute('data-testid');
        console.log(`  - ${testId}`);
      }
    }

    console.log('\nStep 3: Attempting to find analytics button or link...');

    // Try multiple strategies to find analytics button
    const strategies = [
      { name: 'By data-testid', selector: '[data-testid*="analytics"]' },
      { name: 'By button text', selector: 'button:has-text("Analytics")' },
      { name: 'By link text', selector: 'a:has-text("Analytics")' },
      { name: 'By chart icon', selector: 'svg[data-icon*="chart"]' },
      { name: 'By lucide icon', selector: 'svg[class*="lucide-bar-chart"]' },
      { name: 'By aria-label', selector: '[aria-label*="analytics"]' },
    ];

    let foundButton = null;
    for (const strategy of strategies) {
      const count = await page.locator(strategy.selector).count();
      console.log(`  ${strategy.name}: found ${count} elements`);
      if (count > 0 && !foundButton) {
        foundButton = { strategy: strategy.name, selector: strategy.selector };
      }
    }

    if (foundButton) {
      console.log(`\n✓ Found analytics button using: ${foundButton.strategy}`);
      console.log(`  Selector: ${foundButton.selector}`);

      const button = page.locator(foundButton.selector).first();
      await button.click();
      console.log('  Clicked analytics button');

      // Wait for navigation
      await page.waitForURL('**/analytics**', { timeout: 10000 });
      console.log('  Navigated to analytics page');

      // **WAIT 5 SECONDS**
      console.log('  Waiting 5 seconds for page to fully load...');
      await page.waitForTimeout(5000);

      // Take screenshots
      await page.screenshot({
        path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-002-header-loaded.png',
        fullPage: true
      });
      console.log('  ✓ Screenshot saved: uat-ana-002-header-loaded.png');

      await page.screenshot({
        path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-003-stats-loaded.png',
        fullPage: true
      });
      console.log('  ✓ Screenshot saved: uat-ana-003-stats-loaded.png');

      // Test ANA-002: Link Header Card
      console.log('\n=== ANA-002: Link Header Card ===');
      try {
        const shortUrl = await page.locator('text=/pingto\\.me\\/[a-zA-Z0-9]+/').first().textContent({ timeout: 5000 });
        console.log('✓ Short URL:', shortUrl);
      } catch (e) {
        console.log('✗ Short URL not found');
      }

      try {
        const destUrl = await page.locator('text=/https?:\\/\\/.+/').first().textContent({ timeout: 5000 });
        console.log('✓ Destination URL:', destUrl);
      } catch (e) {
        console.log('✗ Destination URL not found');
      }

      try {
        const createdDate = page.locator('text=/created/i').first();
        if (await createdDate.isVisible({ timeout: 5000 })) {
          console.log('✓ Created Date visible');
        }
      } catch (e) {
        console.log('✗ Created Date not found');
      }

      try {
        const copyButton = page.locator('button:has-text("Copy")').first();
        if (await copyButton.isVisible({ timeout: 5000 })) {
          console.log('✓ Copy button visible');
        }
      } catch (e) {
        console.log('✗ Copy button not found');
      }

      // Test ANA-003: Stats Cards
      console.log('\n=== ANA-003: Stats Cards ===');
      try {
        const totalEngagements = page.locator('text=/Total Engagements/i').first();
        if (await totalEngagements.isVisible({ timeout: 5000 })) {
          console.log('✓ Total Engagements card visible');
        }
      } catch (e) {
        console.log('✗ Total Engagements card not found');
      }

      try {
        const last7Days = page.locator('text=/Last 7 days/i').first();
        if (await last7Days.isVisible({ timeout: 5000 })) {
          console.log('✓ Last 7 days card visible');
        }
      } catch (e) {
        console.log('✗ Last 7 days card not found');
      }

      try {
        const weeklyChange = page.locator('text=/Weekly change/i').first();
        if (await weeklyChange.isVisible({ timeout: 5000 })) {
          console.log('✓ Weekly change card visible');
        }
      } catch (e) {
        console.log('✗ Weekly change card not found');
      }

    } else {
      console.log('\n✗ Could not find analytics button with any strategy');
      console.log('  Please check the links page structure manually');
    }
  });
});
