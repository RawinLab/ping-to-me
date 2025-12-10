import { test, expect } from '@playwright/test';

test.describe('UAT Analytics Tests - ANA-002 & ANA-003 (Correct Navigation)', () => {
  test('ANA-002 & ANA-003: Navigate to individual link analytics and verify', async ({ page }) => {
    // Step 1: Login
    console.log('Step 1: Login to the application');
    await page.goto('http://localhost:3010/login');
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✓ Logged in successfully');

    // Step 2: Navigate to /dashboard/links
    console.log('\nStep 2: Navigate to /dashboard/links');
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to links page');

    // Step 3: Hover over first link card and click analytics link
    console.log('\nStep 3: Click Analytics icon on a link card');

    // Wait for link cards to load
    await page.waitForSelector('.group.bg-white.rounded-2xl', { timeout: 10000 });
    console.log('✓ Link cards loaded');

    // Hover over first link card
    const linkCard = page.locator('.group.bg-white.rounded-2xl').first();
    await linkCard.hover();
    console.log('✓ Hovered over link card');

    // Wait a moment for hover effects
    await page.waitForTimeout(500);

    // Click analytics link/button
    const analyticsLink = linkCard.locator('a[href*="/analytics"]').first();
    await analyticsLink.click();
    console.log('✓ Clicked analytics link');

    // Wait for navigation to individual link analytics page
    await page.waitForURL(/\/dashboard\/links\/[^/]+\/analytics/, { timeout: 10000 });
    console.log('✓ Navigated to individual link analytics page');

    // **CRITICAL: WAIT 5 SECONDS for page to fully load**
    console.log('\nStep 4: Waiting 5 seconds for page to fully load...');
    await page.waitForTimeout(5000);
    console.log('✓ Wait completed');

    // Take screenshots AFTER the 5-second wait
    console.log('\nStep 5: Taking screenshots...');
    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-002-header-loaded.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-002-header-loaded.png');

    await page.screenshot({
      path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/uat-ana-003-stats-loaded.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: uat-ana-003-stats-loaded.png');

    // ============================================
    // ANA-002: Link Header Card Verification
    // ============================================
    console.log('\n========================================');
    console.log('ANA-002: Link Header Card Verification');
    console.log('========================================');

    let ana002Pass = true;

    // 1. Short URL (like pingto.me/xxx)
    console.log('\n1. Checking for Short URL...');
    try {
      const shortUrlLink = page.locator('a[href*="pingto.me"]').first()
        .or(page.locator('a[href*="localhost:"]').first());
      await expect(shortUrlLink).toBeVisible({ timeout: 5000 });
      const shortUrl = await shortUrlLink.textContent();
      console.log(`   ✓ PASS: Short URL found: "${shortUrl}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Short URL not found');
      ana002Pass = false;
    }

    // 2. Destination URL (original URL)
    console.log('\n2. Checking for Destination URL...');
    try {
      const originalUrl = page.locator('p.text-sm.text-slate-500').filter({ hasText: /^https?:\/\// }).first();
      await expect(originalUrl).toBeVisible({ timeout: 5000 });
      const destUrl = await originalUrl.textContent();
      console.log(`   ✓ PASS: Destination URL found: "${destUrl}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Destination URL not found');
      ana002Pass = false;
    }

    // 3. Created Date (with calendar icon)
    console.log('\n3. Checking for Created Date...');
    try {
      const dateSection = page.locator('div:has(svg.lucide-calendar)').first();
      await expect(dateSection).toBeVisible({ timeout: 5000 });
      const createdDate = await dateSection.textContent();
      console.log(`   ✓ PASS: Created Date found: "${createdDate}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Created Date not found');
      ana002Pass = false;
    }

    // 4. Copy button (with copy icon)
    console.log('\n4. Checking for Copy button...');
    try {
      const copyButton = page.locator('button').filter({ has: page.locator('svg.lucide-copy') }).first();
      await expect(copyButton).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: Copy button found');
    } catch (e) {
      console.log('   ✗ FAIL: Copy button not found');
      ana002Pass = false;
    }

    // ============================================
    // ANA-003: Stats Cards Verification
    // ============================================
    console.log('\n========================================');
    console.log('ANA-003: Stats Cards Verification');
    console.log('========================================');

    let ana003Pass = true;

    // 1. Total Engagements card
    console.log('\n1. Checking for "Total Engagements" card...');
    try {
      const totalEngagementsLabel = page.locator('text=Total Engagements').first();
      await expect(totalEngagementsLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Total Engagements" label found');

      // Check for the number (using text-4xl font-bold class)
      const statValue = page.locator('text=Total Engagements')
        .locator('xpath=../..')
        .locator('.text-4xl.font-bold').first();
      await expect(statValue).toBeVisible({ timeout: 5000 });
      const total = await statValue.textContent();
      console.log(`   ✓ PASS: Total Engagements number found: "${total}"`);
    } catch (e) {
      console.log('   ✗ FAIL: "Total Engagements" card not found or incomplete');
      ana003Pass = false;
    }

    // 2. Last 7 days card
    console.log('\n2. Checking for "Last 7 days" card...');
    try {
      const last7DaysLabel = page.locator('text=Last 7 days').first();
      await expect(last7DaysLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Last 7 days" label found');

      // Check for the number
      const statValue = page.locator('text=Last 7 days')
        .locator('xpath=../..')
        .locator('.text-4xl.font-bold').first();
      await expect(statValue).toBeVisible({ timeout: 5000 });
      const last7 = await statValue.textContent();
      console.log(`   ✓ PASS: Last 7 days number found: "${last7}"`);
    } catch (e) {
      console.log('   ✗ FAIL: "Last 7 days" card not found or incomplete');
      ana003Pass = false;
    }

    // 3. Weekly change card with percentage and trend icon
    console.log('\n3. Checking for "Weekly change" card...');
    try {
      const weeklyChangeLabel = page.locator('text=Weekly change').first();
      await expect(weeklyChangeLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Weekly change" label found');

      // Check for percentage value
      const statValue = page.locator('text=Weekly change')
        .locator('xpath=../..')
        .locator('.text-4xl.font-bold').first();
      await expect(statValue).toBeVisible({ timeout: 5000 });
      const percentage = await statValue.textContent();
      console.log(`   ✓ PASS: Weekly change percentage found: "${percentage}"`);

      // Check for trend icon (up/down arrow)
      const trendingUp = page.locator('svg.lucide-trending-up').first();
      const trendingDown = page.locator('svg.lucide-trending-down').first();

      const hasUpTrend = await trendingUp.isVisible().catch(() => false);
      const hasDownTrend = await trendingDown.isVisible().catch(() => false);

      if (hasUpTrend || hasDownTrend) {
        const trendType = hasUpTrend ? 'up' : 'down';
        console.log(`   ✓ PASS: Trend icon found (trending ${trendType})`);
      } else {
        // Check for 0% case (might not have trend icon)
        if (percentage.includes('0')) {
          console.log('   ✓ PASS: No trend icon (0% change)');
        } else {
          throw new Error('No trend icon found');
        }
      }
    } catch (e) {
      console.log('   ✗ FAIL: "Weekly change" card not found or incomplete');
      ana003Pass = false;
    }

    // ============================================
    // Final Results
    // ============================================
    console.log('\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================');
    if (ana002Pass) {
      console.log('ANA-002: ✅ PASS - Link Header Card displays all required elements');
    } else {
      console.log('ANA-002: ❌ FAIL - Link Header Card is missing some elements');
    }

    if (ana003Pass) {
      console.log('ANA-003: ✅ PASS - Stats Cards display all required elements');
    } else {
      console.log('ANA-003: ❌ FAIL - Stats Cards are missing some elements');
    }
    console.log('========================================\n');

    // Assert that both tests passed
    expect(ana002Pass, 'ANA-002: Link Header Card verification failed').toBe(true);
    expect(ana003Pass, 'ANA-003: Stats Cards verification failed').toBe(true);
  });
});
