import { test, expect } from '@playwright/test';

test.describe('UAT Analytics Tests - ANA-002 & ANA-003 (Final)', () => {
  test('ANA-002 & ANA-003: Navigate to link analytics and verify header and stats', async ({ page }) => {
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

    // Step 3: Click on a link card to open its analytics
    console.log('\nStep 3: Click Analytics icon/button on a link card');

    // Try to find the analytics button/icon on the first link
    // Based on the screenshot, we can try clicking on the short URL or finding a clickable element
    let navigated = false;

    // Strategy 1: Look for an explicit analytics link/button
    const analyticsLink = page.locator('a:has-text("Analytics")').first();
    if (await analyticsLink.count() > 0) {
      console.log('  Found "Analytics" link, clicking...');
      await analyticsLink.click();
      navigated = true;
    }

    // Strategy 2: Look for chart/bar icon button within a link card
    if (!navigated) {
      const chartButton = page.locator('button').filter({ has: page.locator('svg[class*="lucide-bar-chart"]') }).first();
      if (await chartButton.count() > 0) {
        console.log('  Found chart icon button, clicking...');
        await chartButton.click();
        navigated = true;
      }
    }

    // Strategy 3: Click on the link title/card itself which might navigate to analytics
    if (!navigated) {
      const linkCard = page.locator('text=/example\\.com|google\\.com|destination\\.com/').first();
      if (await linkCard.count() > 0) {
        console.log('  Found link card, clicking on it...');
        await linkCard.click();
        navigated = true;
      }
    }

    // Strategy 4: Look for the short URL link and click it
    if (!navigated) {
      const shortUrlLink = page.locator('a[href*="/localhost:"]').first();
      if (await shortUrlLink.count() > 0) {
        console.log('  Found short URL link, clicking...');
        await shortUrlLink.click();
        navigated = true;
      }
    }

    // Strategy 5: Direct navigation (last resort)
    if (!navigated) {
      console.log('  Trying direct navigation to a known link analytics page...');
      // Try to get the first link's slug from the page
      const linkElement = page.locator('[href*="/localhost:"]').first();
      if (await linkElement.count() > 0) {
        const href = await linkElement.getAttribute('href');
        if (href) {
          const slug = href.split('/').pop();
          await page.goto(`http://localhost:3010/dashboard/links/${slug}/analytics`);
          navigated = true;
        }
      }
    }

    if (!navigated) {
      throw new Error('Could not navigate to analytics page - no suitable element found');
    }

    // Wait for navigation to analytics page
    try {
      await page.waitForURL('**/analytics**', { timeout: 10000 });
      console.log('✓ Navigated to analytics page');
    } catch (e) {
      console.log('Warning: URL may not contain "analytics", checking page content...');
    }

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
      const shortUrlElement = page.locator('text=/pingto\\.me\\/[a-zA-Z0-9-]+/').first()
        .or(page.locator('text=/localhost:[0-9]+\\/[a-zA-Z0-9-]+/').first());
      await expect(shortUrlElement).toBeVisible({ timeout: 5000 });
      const shortUrl = await shortUrlElement.textContent();
      console.log(`   ✓ PASS: Short URL found: "${shortUrl}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Short URL not found');
      ana002Pass = false;
    }

    // 2. Destination URL (original URL)
    console.log('\n2. Checking for Destination URL...');
    try {
      const destUrlElement = page.locator('text=/https?:\\/\\/[^\\s]+/').first();
      await expect(destUrlElement).toBeVisible({ timeout: 5000 });
      const destUrl = await destUrlElement.textContent();
      console.log(`   ✓ PASS: Destination URL found: "${destUrl}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Destination URL not found');
      ana002Pass = false;
    }

    // 3. Created Date
    console.log('\n3. Checking for Created Date...');
    try {
      // Look for date-like text or "Created" label
      const createdDateElement = page.locator('text=/Created|Date/i').first()
        .or(page.locator('text=/Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov/').first())
        .or(page.locator('time').first());
      await expect(createdDateElement).toBeVisible({ timeout: 5000 });
      const createdDate = await createdDateElement.textContent();
      console.log(`   ✓ PASS: Created Date found: "${createdDate}"`);
    } catch (e) {
      console.log('   ✗ FAIL: Created Date not found');
      ana002Pass = false;
    }

    // 4. Copy button
    console.log('\n4. Checking for Copy button...');
    try {
      const copyButton = page.locator('button:has-text("Copy")').first()
        .or(page.locator('button[aria-label*="Copy"]').first())
        .or(page.locator('button').filter({ has: page.locator('svg[class*="copy"]') }).first());
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
      const totalEngagementsLabel = page.locator('text=/Total Engagements/i').first();
      await expect(totalEngagementsLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Total Engagements" label found');

      // Check for the number
      const totalEngagementsNumber = page.locator('text=/Total Engagements/i')
        .locator('xpath=../..')
        .locator('text=/^[0-9,]+$/').first();
      await expect(totalEngagementsNumber).toBeVisible({ timeout: 5000 });
      const total = await totalEngagementsNumber.textContent();
      console.log(`   ✓ PASS: Total Engagements number found: "${total}"`);
    } catch (e) {
      console.log('   ✗ FAIL: "Total Engagements" card not found or incomplete');
      ana003Pass = false;
    }

    // 2. Last 7 days card
    console.log('\n2. Checking for "Last 7 days" card...');
    try {
      const last7DaysLabel = page.locator('text=/Last 7 days/i').first();
      await expect(last7DaysLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Last 7 days" label found');

      // Check for the number
      const last7DaysNumber = page.locator('text=/Last 7 days/i')
        .locator('xpath=../..')
        .locator('text=/^[0-9,]+$/').first();
      await expect(last7DaysNumber).toBeVisible({ timeout: 5000 });
      const last7 = await last7DaysNumber.textContent();
      console.log(`   ✓ PASS: Last 7 days number found: "${last7}"`);
    } catch (e) {
      console.log('   ✗ FAIL: "Last 7 days" card not found or incomplete');
      ana003Pass = false;
    }

    // 3. Weekly change card with percentage and trend icon
    console.log('\n3. Checking for "Weekly change" card...');
    try {
      const weeklyChangeLabel = page.locator('text=/Weekly change/i').first();
      await expect(weeklyChangeLabel).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: "Weekly change" label found');

      // Check for percentage
      const weeklyChangePercentage = page.locator('text=/Weekly change/i')
        .locator('xpath=../..')
        .locator('text=/%|percent/i').first();
      await expect(weeklyChangePercentage).toBeVisible({ timeout: 5000 });
      const percentage = await weeklyChangePercentage.textContent();
      console.log(`   ✓ PASS: Weekly change percentage found: "${percentage}"`);

      // Check for trend icon (up/down arrow)
      const trendIcon = page.locator('text=/Weekly change/i')
        .locator('xpath=../..')
        .locator('svg').first();
      await expect(trendIcon).toBeVisible({ timeout: 5000 });
      console.log('   ✓ PASS: Trend icon (arrow) found');
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
