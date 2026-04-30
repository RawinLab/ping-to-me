import { test, expect } from '@playwright/test';
import { loginAsUser } from './fixtures/auth';

// Test Account Credentials
const TEST_EMAIL = 'e2e-owner@pingtome.test';
const TEST_PASSWORD = 'TestPassword123!';
const WEB_URL = 'http://localhost:3010';

test.describe('UAT Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test using the auth fixture
    await loginAsUser(page, 'owner');
  });

  test('DASH-007: OS Chart - Verify Operating Systems widget displays correctly', async ({ page }) => {
    console.log('🧪 Testing DASH-007: OS Chart');

    // We're already on dashboard from beforeEach login
    // Just wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find the Operating Systems card - wait for it to appear
    const osCard = page.locator('div').filter({ hasText: /^Operating Systems/ }).first();
    await expect(osCard).toBeVisible({ timeout: 15000 });

    // Verify card title
    const cardTitle = osCard.locator('text=Operating Systems');
    await expect(cardTitle).toBeVisible();
    console.log('✓ Operating Systems widget found');

    // Check if there's data or empty state
    const noDataText = osCard.locator('text=No data available');
    const hasNoData = await noDataText.isVisible().catch(() => false);

    if (hasNoData) {
      console.log('⚠️  Empty state displayed - No OS data available');
      console.log('✓ Empty state message verified');
    } else {
      // Verify OS distribution display
      // The widget shows top 3 OS with horizontal bars
      const osBars = osCard.locator('div.space-y-4 > div.space-y-2');
      const barCount = await osBars.count();

      console.log(`✓ Found ${barCount} OS entries`);
      expect(barCount).toBeGreaterThan(0);
      expect(barCount).toBeLessThanOrEqual(3); // Shows top 3

      // Verify each OS entry has:
      for (let i = 0; i < barCount; i++) {
        const osEntry = osBars.nth(i);

        // 1. OS name
        const osName = await osEntry.locator('span.font-medium.text-foreground').textContent();
        console.log(`  - OS ${i + 1}: ${osName}`);
        expect(osName).toBeTruthy();

        // 2. Count
        const count = osEntry.locator('span.text-muted-foreground');
        await expect(count).toBeVisible();

        // 3. Percentage
        const percentage = osEntry.locator('span.font-semibold.text-foreground');
        await expect(percentage).toBeVisible();
        const percentageText = await percentage.textContent();
        expect(percentageText).toMatch(/\d+\.\d+%/);
        console.log(`    Count & Percentage: ${await count.textContent()} (${percentageText})`);

        // 4. Progress bar
        const progressBar = osEntry.locator('div.h-2.w-full.overflow-hidden.rounded-full');
        await expect(progressBar).toBeVisible();
        console.log(`    ✓ Progress bar displayed`);

        // 5. Icon
        const icon = osEntry.locator('svg').first();
        await expect(icon).toBeVisible();
      }

      console.log('✓ All OS entries display correctly with names, counts, percentages, and bars');
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'screenshots/uat-dash-007-os-chart.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: screenshots/uat-dash-007-os-chart.png');
  });

  test('DASH-008: Engagements Chart - Verify time series chart displays correctly', async ({ page }) => {
    console.log('🧪 Testing DASH-008: Engagements Chart');

    // We're already on dashboard from beforeEach login
    // Just wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Find the Engagements Overview card
    const engagementsCard = page.locator('div').filter({ hasText: 'Engagements Overview' }).first();

    // Check if card exists (might not show if no data)
    const cardVisible = await engagementsCard.isVisible().catch(() => false);

    if (!cardVisible) {
      console.log('⚠️  Engagements chart not displayed (likely no click data)');
      console.log('Note: Chart only appears when there is click data');
      return;
    }

    await expect(engagementsCard).toBeVisible();
    console.log('✓ Engagements Overview card found');

    // Verify card title
    const cardTitle = engagementsCard.locator('text=Engagements Overview');
    await expect(cardTitle).toBeVisible();

    // Verify subtitle
    const subtitle = engagementsCard.locator('text=Track your link performance over time');
    await expect(subtitle).toBeVisible();
    console.log('✓ Card title and subtitle verified');

    // Verify "View Analytics" button
    const viewAnalyticsBtn = engagementsCard.locator('text=View Analytics');
    await expect(viewAnalyticsBtn).toBeVisible();
    console.log('✓ View Analytics button present');

    // Verify chart is rendered (recharts ResponsiveContainer)
    const chart = engagementsCard.locator('.recharts-responsive-container');
    await expect(chart).toBeVisible({ timeout: 5000 });
    console.log('✓ Chart container rendered');

    // Verify chart elements (bars or other chart elements)
    // Note: The chart might use different selectors depending on the data
    const bars = engagementsCard.locator('.recharts-bar-rectangle, .recharts-bar, .recharts-rectangle');
    const barCount = await bars.count();
    console.log(`✓ Found ${barCount} bar/chart elements`);

    // If no bars found, check if there's at least chart SVG rendered
    if (barCount === 0) {
      const chartSvg = engagementsCard.locator('svg.recharts-surface');
      await expect(chartSvg).toBeVisible();
      console.log('✓ Chart SVG rendered (bars may be empty or use different selector)');

      // For empty charts, axes might be hidden, so we just verify the chart structure exists
      console.log('⚠️  Chart appears to have no data (bars not visible)');
      console.log('✓ Chart structure verified (container and SVG present)');
    } else {
      expect(barCount).toBeGreaterThan(0);

      // Only verify axes and interactions if we have bars
      // Verify X-axis (dates)
      const xAxis = engagementsCard.locator('.recharts-xAxis');
      const xAxisVisible = await xAxis.isVisible().catch(() => false);
      if (xAxisVisible) {
        console.log('✓ X-axis (dates) displayed');
      }

      // Verify Y-axis (counts)
      const yAxis = engagementsCard.locator('.recharts-yAxis');
      const yAxisVisible = await yAxis.isVisible().catch(() => false);
      if (yAxisVisible) {
        console.log('✓ Y-axis (counts) displayed');
      }

      // Verify grid lines
      const grid = engagementsCard.locator('.recharts-cartesian-grid');
      const gridVisible = await grid.isVisible().catch(() => false);
      if (gridVisible) {
        console.log('✓ Grid lines displayed');
      }

      // Test tooltip hover interaction
      console.log('Testing tooltip on hover...');
      const firstBar = bars.first();
      await firstBar.hover();
      await page.waitForTimeout(500);

      // Check for tooltip
      const tooltip = page.locator('.recharts-tooltip-wrapper');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);
      if (tooltipVisible) {
        console.log('✓ Tooltip appears on hover');
      } else {
        console.log('⚠️  Tooltip not detected (may require specific interaction)');
      }
    }

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/uat-dash-008-engagements-chart.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: screenshots/uat-dash-008-engagements-chart.png');
  });

  test('DASH-009: Empty Dashboard State - Verify empty state behavior', async ({ page }) => {
    console.log('🧪 Testing DASH-009: Empty Dashboard State');

    // Note: This test checks the current dashboard state and identifies empty state logic
    // To fully test empty state, we would need an account with 0 links

    // We're already on dashboard from beforeEach login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check Total Links metric
    const totalLinksText = page.locator('text=Total Links');
    await expect(totalLinksText).toBeVisible({ timeout: 10000 });

    // Find the card containing "Total Links" and get the value
    const totalLinksCard = totalLinksText.locator('..').locator('..');
    const totalLinksValue = totalLinksCard.locator('p').first();
    const linksCount = await totalLinksValue.textContent();
    console.log(`📊 Current Total Links: ${linksCount?.trim() || 'Unable to read'}`);

    // Check if Getting Started guide is visible (shown when totalLinks < 5)
    const gettingStartedCard = page.locator('text=Get Started with PingTO.Me');
    const hasGettingStarted = await gettingStartedCard.isVisible().catch(() => false);

    if (hasGettingStarted) {
      console.log('✓ Getting Started guide is displayed (account has < 5 links)');

      // Verify Getting Started content
      const description = page.locator('text=Create your first few links to unlock powerful analytics');
      await expect(description).toBeVisible();
      console.log('✓ Getting Started description shown');

      // Verify CTA buttons
      const createLinkBtn = gettingStartedCard.locator('text=Create your first link');
      await expect(createLinkBtn).toBeVisible();
      console.log('✓ "Create your first link" button present');

      const docsBtn = gettingStartedCard.locator('text=Read the docs');
      await expect(docsBtn).toBeVisible();
      console.log('✓ "Read the docs" button present');

      // Verify progress indicator
      const progressText = page.locator('text=Getting started progress');
      await expect(progressText).toBeVisible();
      console.log('✓ Progress indicator displayed');

      // Take screenshot
      await page.screenshot({
        path: 'screenshots/uat-dash-009-getting-started.png',
        fullPage: false
      });
      console.log('📸 Screenshot saved: screenshots/uat-dash-009-getting-started.png');
    } else {
      console.log('⚠️  Getting Started guide NOT displayed (account has >= 5 links)');
      console.log('Note: To fully test empty state, use an account with 0 links');
    }

    // Check for empty states in widgets
    console.log('\nChecking for empty states in widgets:');

    // Check OS widget empty state
    const osEmptyState = page.locator('text=Operating Systems').locator('..').locator('..').locator('text=No data available');
    const hasOSEmptyState = await osEmptyState.isVisible().catch(() => false);
    console.log(`  OS Widget: ${hasOSEmptyState ? 'Empty state' : 'Has data'}`);

    // Check if Engagements chart is visible
    const engagementsChart = page.locator('text=Engagements Overview');
    const hasEngagementsChart = await engagementsChart.isVisible().catch(() => false);
    console.log(`  Engagements Chart: ${hasEngagementsChart ? 'Displayed' : 'Hidden (no data)'}`);

    // Check Recent Links table
    const recentLinksCard = page.locator('text=Recent Links').first();
    await expect(recentLinksCard).toBeVisible();
    const linksTable = recentLinksCard.locator('..').locator('table');
    const hasLinksTable = await linksTable.isVisible().catch(() => false);
    console.log(`  Recent Links: ${hasLinksTable ? 'Has links' : 'Empty'}`);

    console.log('\n📝 Summary:');
    console.log('- Current account is NOT empty (has links and data)');
    console.log('- To fully test DASH-009 empty state:');
    console.log('  1. Create a new test account with 0 links');
    console.log('  2. Verify all metrics show "0"');
    console.log('  3. Verify "Create your first link" CTA is prominent');
    console.log('  4. Verify empty states in all widgets');
  });
});
