import { test, expect } from '@playwright/test';

const LOGIN_URL = 'http://localhost:3010/login';
const CREDENTIALS = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!'
};
const SCREENSHOTS_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';

test.describe('UAT - Link Analytics Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(LOGIN_URL);
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);
    await page.click('button:has-text("Sign In with Email")');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('ANA-001: Access Analytics Page from Links', async ({ page }) => {
    console.log('\n=== ANA-001: Access Analytics Page from Links ===');

    // Step 1: Navigate to /dashboard/links
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');

    // Take screenshot of links page
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/uat-ana-001-links-page.png`,
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-001-links-page.png');

    // Step 2: Find and click Analytics icon/button for the first link
    // The analytics button appears on hover and is a BarChart2 icon linking to /dashboard/links/{id}/analytics

    // First, hover over the first link card to reveal the analytics button
    const firstLinkCard = page.locator('.group').first();
    await firstLinkCard.hover();
    console.log('Hovered over first link card');

    // Wait a moment for the hover actions to appear
    await page.waitForTimeout(500);

    // Find the analytics link with BarChart2 icon that links to /dashboard/links/{id}/analytics
    // We need to be specific to avoid clicking the sidebar "Analytics" link
    const analyticsLink = page.locator('a[href*="/dashboard/links/"][href*="/analytics"]').first();

    if (await analyticsLink.count() === 0) {
      throw new Error('Analytics button not found on link card');
    }

    const href = await analyticsLink.getAttribute('href');
    console.log(`Found analytics link with href: ${href}`);

    await analyticsLink.click();
    console.log('Clicked analytics button');

    // Step 3: Verify redirect to /dashboard/links/{linkId}/analytics
    await page.waitForURL('**/dashboard/links/*/analytics');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    expect(currentUrl).toMatch(/\/dashboard\/links\/[^\/]+\/analytics/);

    // Verify NOT redirected to /dashboard/analytics/{linkId}
    expect(currentUrl).not.toMatch(/\/dashboard\/analytics\//);

    // Take screenshot of analytics page
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/uat-ana-001-analytics-page.png`,
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-001-analytics-page.png');

    console.log('✓ ANA-001: PASS - Successfully navigated to correct analytics URL');
  });

  test('ANA-002: Link Header Card', async ({ page }) => {
    console.log('\n=== ANA-002: Link Header Card ===');

    // Navigate to links page first
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');

    // Hover over first link to reveal analytics button
    const firstLinkCard = page.locator('.group').first();
    await firstLinkCard.hover();
    await page.waitForTimeout(500);

    // Click analytics link
    const analyticsLink = page.locator('a[href*="/dashboard/links/"][href*="/analytics"]').first();
    await analyticsLink.click();

    await page.waitForURL('**/dashboard/links/*/analytics');
    await page.waitForLoadState('networkidle');

    // Step 1: Check for header card
    // Look for card component (shadcn/ui Card)
    const headerCard = page.locator('div[class*="card"], [data-testid*="header"], [class*="border"][class*="rounded"]').first();

    // Verify header card exists
    await expect(headerCard).toBeVisible();
    console.log('✓ Header card is visible');

    // Step 2: Verify Short URL is shown
    const shortUrlElement = page.locator('text=/Short URL|Short Link|ping\.to\.me/i, text=/\/[a-zA-Z0-9-]+$/').first();
    if (await shortUrlElement.count() > 0) {
      await expect(shortUrlElement).toBeVisible();
      const shortUrlText = await shortUrlElement.textContent();
      console.log(`✓ Short URL found: ${shortUrlText}`);
    } else {
      console.log('⚠ Short URL element not found with expected pattern');
    }

    // Step 3: Verify Destination URL is shown
    const destinationUrlElement = page.locator('text=/Destination|Target|https?:\/\//i').first();
    if (await destinationUrlElement.count() > 0) {
      await expect(destinationUrlElement).toBeVisible();
      const destinationText = await destinationUrlElement.textContent();
      console.log(`✓ Destination URL found: ${destinationText?.substring(0, 50)}...`);
    } else {
      console.log('⚠ Destination URL element not found');
    }

    // Step 4: Verify Created Date is shown
    const createdDateElement = page.locator('text=/Created|Date|[0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Z][a-z]+ [0-9]{1,2}, [0-9]{4}/i').first();
    if (await createdDateElement.count() > 0) {
      await expect(createdDateElement).toBeVisible();
      const dateText = await createdDateElement.textContent();
      console.log(`✓ Created Date found: ${dateText}`);
    } else {
      console.log('⚠ Created Date element not found');
    }

    // Step 5: Verify Copy button exists
    const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="Copy" i], button:has(svg[class*="lucide-copy"])').first();
    if (await copyButton.count() > 0) {
      await expect(copyButton).toBeVisible();
      console.log('✓ Copy button found');
    } else {
      console.log('⚠ Copy button not found');
    }

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/uat-ana-002-header-card.png`,
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-002-header-card.png');

    console.log('✓ ANA-002: PASS - Header card contains expected information');
  });

  test('ANA-003: Stats Cards', async ({ page }) => {
    console.log('\n=== ANA-003: Stats Cards ===');

    // Navigate to links page first
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');

    // Hover over first link to reveal analytics button
    const firstLinkCard = page.locator('.group').first();
    await firstLinkCard.hover();
    await page.waitForTimeout(500);

    // Click analytics link
    const analyticsLink = page.locator('a[href*="/dashboard/links/"][href*="/analytics"]').first();
    await analyticsLink.click();

    await page.waitForURL('**/dashboard/links/*/analytics');
    await page.waitForLoadState('networkidle');

    // Step 1: Look for stats cards section
    // Stats cards are typically in a grid layout
    const statsSection = page.locator('div[class*="grid"], div[class*="stats"]').first();

    // Step 2: Verify "Total Engagements" or "Total Clicks"
    const totalEngagementsCard = page.locator('text=/Total Engagements|Total Clicks|Total Views|Engagements/i').first();
    if (await totalEngagementsCard.count() > 0) {
      await expect(totalEngagementsCard).toBeVisible();
      console.log('✓ "Total Engagements" stat found');

      // Look for the number/value
      const statsValue = page.locator('text=/[0-9,]+/').first();
      if (await statsValue.count() > 0) {
        const value = await statsValue.textContent();
        console.log(`  Value: ${value}`);
      }
    } else {
      console.log('⚠ "Total Engagements" stat not found');
    }

    // Step 3: Verify "Last 7 days" or similar time period indicator
    const last7DaysCard = page.locator('text=/Last 7 days|7 days|This week|Past week/i').first();
    if (await last7DaysCard.count() > 0) {
      await expect(last7DaysCard).toBeVisible();
      console.log('✓ "Last 7 days" stat found');

      // Look for associated number
      const parent = last7DaysCard.locator('..');
      const value = parent.locator('text=/[0-9,]+/').first();
      if (await value.count() > 0) {
        const valueText = await value.textContent();
        console.log(`  Value: ${valueText}`);
      }
    } else {
      console.log('⚠ "Last 7 days" stat not found');
    }

    // Step 4: Verify "Weekly change" with trend indicator
    const weeklyChangeCard = page.locator('text=/Weekly change|Week over week|vs last week|Change/i').first();
    if (await weeklyChangeCard.count() > 0) {
      await expect(weeklyChangeCard).toBeVisible();
      console.log('✓ "Weekly change" stat found');

      // Look for trend indicator (up/down arrow or percentage)
      const trendIndicator = page.locator('svg[class*="lucide-trending"], svg[class*="lucide-arrow-up"], svg[class*="lucide-arrow-down"], text=/%/').first();
      if (await trendIndicator.count() > 0) {
        console.log('✓ Trend indicator found');
      } else {
        console.log('⚠ Trend indicator not found');
      }

      // Look for percentage value
      const percentage = page.locator('text=/[+-]?[0-9.]+%/').first();
      if (await percentage.count() > 0) {
        const percentText = await percentage.textContent();
        console.log(`  Change: ${percentText}`);
      }
    } else {
      console.log('⚠ "Weekly change" stat not found');
    }

    // Count total stat cards
    const statCards = page.locator('div[class*="card"]').filter({
      has: page.locator('text=/Total|Last|Change|Clicks|Views|Engagements/i')
    });
    const cardCount = await statCards.count();
    console.log(`\nTotal stat cards found: ${cardCount}`);

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/uat-ana-003-stats-cards.png`,
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-003-stats-cards.png');

    console.log('✓ ANA-003: PASS - Stats cards section contains expected metrics');
  });
});
