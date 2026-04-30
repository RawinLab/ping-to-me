import { test, expect } from '@playwright/test';

test.describe('UAT Analytics Re-test - ANA-002 & ANA-003', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3010/login');
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Navigate directly to links page
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');
  });

  test('ANA-002: Link Header Card - Should display link details after 5 second wait', async ({ page }) => {
    console.log('Starting ANA-002 test...');

    // Find and click the Analytics icon on the first link card
    const analyticsButton = page.locator('[data-testid="link-analytics-button"]').first();
    const alternativeAnalyticsButton = page.locator('button:has-text("Analytics")').first();
    const iconButton = page.locator('button:has([data-icon="chart"], [data-icon="bar-chart"])').first();

    let clicked = false;

    // Try different selectors
    if (await analyticsButton.count() > 0) {
      await analyticsButton.click();
      clicked = true;
      console.log('Clicked analytics button via data-testid');
    } else if (await alternativeAnalyticsButton.count() > 0) {
      await alternativeAnalyticsButton.click();
      clicked = true;
      console.log('Clicked analytics button via text');
    } else if (await iconButton.count() > 0) {
      await iconButton.click();
      clicked = true;
      console.log('Clicked analytics button via icon');
    } else {
      // Try finding any link with chart/bar icon
      const chartIcon = page.locator('svg[class*="lucide"]').filter({ hasText: /chart|bar|analytics/i }).first();
      if (await chartIcon.count() > 0) {
        const button = chartIcon.locator('xpath=ancestor::button[1]');
        await button.click();
        clicked = true;
        console.log('Clicked analytics button via SVG icon ancestor');
      } else {
        // Last resort: look for any button in a link card
        const linkCard = page.locator('[data-testid="link-card"]').first();
        const anyAnalyticsButton = linkCard.locator('button').filter({ hasText: /analytics|chart|stats/i }).first();
        if (await anyAnalyticsButton.count() > 0) {
          await anyAnalyticsButton.click();
          clicked = true;
          console.log('Clicked analytics button via link card filter');
        }
      }
    }

    if (!clicked) {
      console.log('Could not find analytics button, trying to navigate directly to analytics page');
      // Get first link ID from the page
      const firstLinkId = await page.locator('[data-testid="link-card"]').first().getAttribute('data-link-id');
      if (firstLinkId) {
        await page.goto(`http://localhost:3010/dashboard/links/${firstLinkId}/analytics`);
      } else {
        throw new Error('Could not find analytics button or link ID');
      }
    }

    // Wait for navigation to analytics page
    await page.waitForURL('**/analytics**', { timeout: 10000 });
    console.log('Navigated to analytics page');

    // **WAIT 5 SECONDS** for page to fully load
    console.log('Waiting 5 seconds for page to fully load...');
    await page.waitForTimeout(5000);

    // Take screenshot AFTER 5-second wait
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-002-header-loaded.png',
      fullPage: true
    });
    console.log('Screenshot saved: uat-ana-002-header-loaded.png');

    // Verify Link Header Card elements
    console.log('Verifying Link Header Card elements...');

    // Check for Short URL
    const shortUrlElement = page.locator('text=/pingto\\.me\\/[a-zA-Z0-9]+/').first();
    await expect(shortUrlElement).toBeVisible({ timeout: 5000 });
    const shortUrl = await shortUrlElement.textContent();
    console.log('✓ Short URL found:', shortUrl);

    // Check for Destination URL
    const destinationUrlElement = page.locator('[data-testid="destination-url"]').first()
      .or(page.locator('text=/https?:\\/\\/.+/').first())
      .or(page.locator('[class*="destination"]').first());
    await expect(destinationUrlElement).toBeVisible({ timeout: 5000 });
    const destinationUrl = await destinationUrlElement.textContent();
    console.log('✓ Destination URL found:', destinationUrl);

    // Check for Created Date
    const createdDateElement = page.locator('[data-testid="created-date"]').first()
      .or(page.locator('text=/Created|Date/i').locator('xpath=following-sibling::*[1]').first())
      .or(page.locator('time').first());
    await expect(createdDateElement).toBeVisible({ timeout: 5000 });
    const createdDate = await createdDateElement.textContent();
    console.log('✓ Created Date found:', createdDate);

    // Check for Copy button
    const copyButton = page.locator('button:has-text("Copy")').first()
      .or(page.locator('button[data-testid="copy-button"]').first())
      .or(page.locator('button:has([data-icon="copy"])').first());
    await expect(copyButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Copy button found');

    console.log('\n✅ ANA-002: PASS - All Link Header Card elements are visible');
  });

  test('ANA-003: Stats Cards - Should display stats after 5 second wait', async ({ page }) => {
    console.log('Starting ANA-003 test...');

    // Find and click the Analytics icon on the first link card
    const analyticsButton = page.locator('[data-testid="link-analytics-button"]').first();
    const alternativeAnalyticsButton = page.locator('button:has-text("Analytics")').first();
    const iconButton = page.locator('button:has([data-icon="chart"], [data-icon="bar-chart"])').first();

    let clicked = false;

    // Try different selectors
    if (await analyticsButton.count() > 0) {
      await analyticsButton.click();
      clicked = true;
      console.log('Clicked analytics button via data-testid');
    } else if (await alternativeAnalyticsButton.count() > 0) {
      await alternativeAnalyticsButton.click();
      clicked = true;
      console.log('Clicked analytics button via text');
    } else if (await iconButton.count() > 0) {
      await iconButton.click();
      clicked = true;
      console.log('Clicked analytics button via icon');
    } else {
      // Try finding any link with chart/bar icon
      const chartIcon = page.locator('svg[class*="lucide"]').filter({ hasText: /chart|bar|analytics/i }).first();
      if (await chartIcon.count() > 0) {
        const button = chartIcon.locator('xpath=ancestor::button[1]');
        await button.click();
        clicked = true;
        console.log('Clicked analytics button via SVG icon ancestor');
      } else {
        // Last resort: look for any button in a link card
        const linkCard = page.locator('[data-testid="link-card"]').first();
        const anyAnalyticsButton = linkCard.locator('button').filter({ hasText: /analytics|chart|stats/i }).first();
        if (await anyAnalyticsButton.count() > 0) {
          await anyAnalyticsButton.click();
          clicked = true;
          console.log('Clicked analytics button via link card filter');
        }
      }
    }

    if (!clicked) {
      console.log('Could not find analytics button, trying to navigate directly to analytics page');
      // Get first link ID from the page
      const firstLinkId = await page.locator('[data-testid="link-card"]').first().getAttribute('data-link-id');
      if (firstLinkId) {
        await page.goto(`http://localhost:3010/dashboard/links/${firstLinkId}/analytics`);
      } else {
        throw new Error('Could not find analytics button or link ID');
      }
    }

    // Wait for navigation to analytics page
    await page.waitForURL('**/analytics**', { timeout: 10000 });
    console.log('Navigated to analytics page');

    // **WAIT 5 SECONDS** for page to fully load
    console.log('Waiting 5 seconds for page to fully load...');
    await page.waitForTimeout(5000);

    // Take screenshot AFTER 5-second wait
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-003-stats-loaded.png',
      fullPage: true
    });
    console.log('Screenshot saved: uat-ana-003-stats-loaded.png');

    // Verify Stats Cards
    console.log('Verifying Stats Cards...');

    // Check for "Total Engagements" card
    const totalEngagementsCard = page.locator('text=/Total Engagements/i').first();
    await expect(totalEngagementsCard).toBeVisible({ timeout: 5000 });

    // Get the number for Total Engagements
    const totalEngagementsNumber = page.locator('text=/Total Engagements/i')
      .locator('xpath=ancestor::div[contains(@class, "card") or @data-testid="stat-card"]')
      .locator('text=/^\\d+$/').first();
    await expect(totalEngagementsNumber).toBeVisible({ timeout: 5000 });
    const totalEngagements = await totalEngagementsNumber.textContent();
    console.log('✓ Total Engagements found:', totalEngagements);

    // Check for "Last 7 days" card
    const last7DaysCard = page.locator('text=/Last 7 days/i').first();
    await expect(last7DaysCard).toBeVisible({ timeout: 5000 });

    // Get the number for Last 7 days
    const last7DaysNumber = page.locator('text=/Last 7 days/i')
      .locator('xpath=ancestor::div[contains(@class, "card") or @data-testid="stat-card"]')
      .locator('text=/^\\d+$/').first();
    await expect(last7DaysNumber).toBeVisible({ timeout: 5000 });
    const last7Days = await last7DaysNumber.textContent();
    console.log('✓ Last 7 days found:', last7Days);

    // Check for "Weekly change" card with percentage and trend icon
    const weeklyChangeCard = page.locator('text=/Weekly change/i').first();
    await expect(weeklyChangeCard).toBeVisible({ timeout: 5000 });

    // Get the percentage for Weekly change
    const weeklyChangePercentage = page.locator('text=/Weekly change/i')
      .locator('xpath=ancestor::div[contains(@class, "card") or @data-testid="stat-card"]')
      .locator('text=/%/').first();
    await expect(weeklyChangePercentage).toBeVisible({ timeout: 5000 });
    const weeklyChange = await weeklyChangePercentage.textContent();
    console.log('✓ Weekly change found:', weeklyChange);

    // Check for trend icon (up/down arrow)
    const trendIcon = page.locator('text=/Weekly change/i')
      .locator('xpath=ancestor::div[contains(@class, "card") or @data-testid="stat-card"]')
      .locator('svg[class*="lucide"]').first();
    await expect(trendIcon).toBeVisible({ timeout: 5000 });
    console.log('✓ Trend icon (arrow) found');

    console.log('\n✅ ANA-003: PASS - All Stats Cards are visible with correct data');
  });
});
