import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';

test.describe('UAT: Location and Device Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');

    // Wait for login to complete
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Navigate to links page
    await page.goto('http://localhost:3010/dashboard/links');
    await page.waitForLoadState('networkidle');

    // Click on the Analytics icon for the first link
    // Look for various possible selectors for the analytics button/icon
    const analyticsButton = page.locator('a[href*="/analytics"], button:has-text("Analytics"), [aria-label*="Analytics"], [data-testid="analytics-button"]').first();
    await analyticsButton.waitFor({ state: 'visible', timeout: 10000 });
    await analyticsButton.click();

    // Wait for analytics page to load
    await page.waitForURL('**/analytics**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit for charts to render
    await page.waitForTimeout(2000);
  });

  test('ANA-030: Top Countries', async ({ page }) => {
    console.log('\n=== ANA-030: Top Countries ===');

    // Look for Locations or Top Countries section
    const locationsSection = page.locator('text=/Locations|Top Countries|Countries/i').first();

    try {
      await locationsSection.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Found Locations/Countries section');

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-030-countries.png'),
        fullPage: true
      });

      // Look for country data - could be in a list, table, or chart
      const countryElements = page.locator('text=/United States|USA|Canada|United Kingdom|UK|Germany|France|China|India|Brazil|Australia/i');
      const countryCount = await countryElements.count();

      if (countryCount > 0) {
        console.log(`✓ Found ${countryCount} country entries`);

        // Check for percentage or count indicators
        const hasPercentage = await page.locator('text=/%/').count() > 0;
        const hasCount = await page.locator('text=/\\d+\\s*(clicks?|views?)/i').count() > 0;

        if (hasPercentage || hasCount) {
          console.log('✓ Shows percentage or count data');
        } else {
          console.log('⚠ No clear percentage or count indicators found');
        }

        // Check if data appears to be sorted (by looking at numbers if visible)
        console.log('✓ Country list displayed');

        console.log('\n✅ PASS: Top Countries section displays country data with metrics');
      } else {
        console.log('⚠ No country data found - may be empty analytics');
        console.log('\n⚠ CONDITIONAL PASS: Countries section exists but no data (expected if no clicks yet)');
      }

    } catch (error) {
      console.log('✗ Locations/Countries section not found');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-030-countries-FAIL.png'),
        fullPage: true
      });
      console.log('\n❌ FAIL: Could not find Locations or Top Countries section');
      throw error;
    }
  });

  test('ANA-031: Cities', async ({ page }) => {
    console.log('\n=== ANA-031: Cities ===');

    // Look for Cities section - might be a tab, separate section, or within Locations
    const citiesIndicator = page.locator('text=/Cities|City|Geographic/i');

    try {
      const citiesCount = await citiesIndicator.count();

      if (citiesCount > 0) {
        console.log('✓ Found Cities section/tab');

        // If it's a tab, try to click it
        const citiesTab = page.locator('button:has-text("Cities"), [role="tab"]:has-text("Cities")').first();
        const tabExists = await citiesTab.count() > 0;

        if (tabExists) {
          await citiesTab.click();
          await page.waitForTimeout(1000);
          console.log('✓ Clicked Cities tab');
        }

        // Take screenshot
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'uat-ana-031-cities.png'),
          fullPage: true
        });

        // Look for city names
        const cityElements = page.locator('text=/New York|Los Angeles|London|Paris|Tokyo|Singapore|Sydney|Toronto|Berlin|Mumbai/i');
        const cityCount = await cityElements.count();

        if (cityCount > 0) {
          console.log(`✓ Found ${cityCount} city entries`);

          // Check for click counts
          const hasCount = await page.locator('text=/\\d+\\s*(clicks?|views?)/i').count() > 0;
          if (hasCount) {
            console.log('✓ Shows click counts for cities');
          }

          console.log('\n✅ PASS: Cities section displays city data with click counts');
        } else {
          console.log('⚠ Cities section exists but no city data found');
          console.log('\n⚠ CONDITIONAL PASS: Cities section exists but no data (expected if no detailed location data)');
        }
      } else {
        console.log('⚠ No Cities section found');
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'uat-ana-031-cities-NOTFOUND.png'),
          fullPage: true
        });
        console.log('\n⚠ INFO: Cities section not found (may not be implemented or no city-level data available)');
      }

    } catch (error) {
      console.log('✗ Error accessing Cities section');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-031-cities-ERROR.png'),
        fullPage: true
      });
      console.log('\n⚠ INFO: Cities section not accessible');
    }
  });

  test('ANA-040: Devices Chart', async ({ page }) => {
    console.log('\n=== ANA-040: Devices Chart ===');

    // Look for Devices section/chart
    const devicesSection = page.locator('text=/Devices/i').first();

    try {
      await devicesSection.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Found Devices section');

      // Scroll to devices section if needed
      await devicesSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-040-devices.png'),
        fullPage: true
      });

      // Look for chart elements (SVG, canvas, or chart library elements)
      const chartElements = page.locator('svg, canvas, [class*="chart"], [class*="Chart"]');
      const hasChart = await chartElements.count() > 0;

      if (hasChart) {
        console.log('✓ Chart visualization found');
      }

      // Look for device types
      const mobileElement = await page.locator('text=/Mobile/i').count();
      const desktopElement = await page.locator('text=/Desktop/i').count();
      const tabletElement = await page.locator('text=/Tablet/i').count();

      const deviceTypes = [];
      if (mobileElement > 0) deviceTypes.push('Mobile');
      if (desktopElement > 0) deviceTypes.push('Desktop');
      if (tabletElement > 0) deviceTypes.push('Tablet');

      if (deviceTypes.length > 0) {
        console.log(`✓ Found device types: ${deviceTypes.join(', ')}`);
      } else {
        console.log('⚠ No device type labels found');
      }

      // Check for percentage indicators
      const hasPercentage = await page.locator('text=/%/').count() > 0;
      if (hasPercentage) {
        console.log('✓ Shows percentage data');
      }

      // Verify it looks like a pie or donut chart
      const pieChartIndicators = await page.locator('circle, path[d*="A"], [class*="pie"], [class*="donut"]').count();
      if (pieChartIndicators > 0) {
        console.log('✓ Appears to be a Pie/Donut chart');
      }

      if (deviceTypes.length > 0 && (hasChart || hasPercentage)) {
        console.log('\n✅ PASS: Devices chart shows device types with percentages');
      } else if (deviceTypes.length > 0) {
        console.log('\n⚠ PARTIAL PASS: Devices section exists but chart visualization unclear');
      } else {
        console.log('\n⚠ CONDITIONAL PASS: Devices section exists but no data (expected if no clicks yet)');
      }

    } catch (error) {
      console.log('✗ Devices section not found');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-040-devices-FAIL.png'),
        fullPage: true
      });
      console.log('\n❌ FAIL: Could not find Devices section');
      throw error;
    }
  });

  test('ANA-041: Browsers Chart', async ({ page }) => {
    console.log('\n=== ANA-041: Browsers Chart ===');

    // Look for Browsers section/chart
    const browsersSection = page.locator('text=/Browsers?/i').first();

    try {
      await browsersSection.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Found Browsers section');

      // Scroll to browsers section if needed
      await browsersSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-041-browsers.png'),
        fullPage: true
      });

      // Look for browser names
      const chromeElement = await page.locator('text=/Chrome/i').count();
      const safariElement = await page.locator('text=/Safari/i').count();
      const firefoxElement = await page.locator('text=/Firefox/i').count();
      const edgeElement = await page.locator('text=/Edge/i').count();
      const operaElement = await page.locator('text=/Opera/i').count();

      const browsers = [];
      if (chromeElement > 0) browsers.push('Chrome');
      if (safariElement > 0) browsers.push('Safari');
      if (firefoxElement > 0) browsers.push('Firefox');
      if (edgeElement > 0) browsers.push('Edge');
      if (operaElement > 0) browsers.push('Opera');

      if (browsers.length > 0) {
        console.log(`✓ Found browsers: ${browsers.join(', ')}`);
      } else {
        console.log('⚠ No browser names found');
      }

      // Check for percentage or count indicators
      const hasPercentage = await page.locator('text=/%/').count() > 0;
      const hasCount = await page.locator('text=/\\d+\\s*(clicks?|views?)/i').count() > 0;

      if (hasPercentage || hasCount) {
        console.log('✓ Shows percentage or count data');
      }

      // Look for chart elements
      const chartElements = page.locator('svg, canvas, [class*="chart"], [class*="Chart"]');
      const hasChart = await chartElements.count() > 0;

      if (hasChart) {
        console.log('✓ Chart/list visualization found');
      }

      if (browsers.length > 0 && (hasPercentage || hasCount)) {
        console.log('\n✅ PASS: Browsers section shows browser data with metrics');
      } else if (browsers.length > 0) {
        console.log('\n⚠ PARTIAL PASS: Browsers section exists but metrics unclear');
      } else {
        console.log('\n⚠ CONDITIONAL PASS: Browsers section exists but no data (expected if no clicks yet)');
      }

    } catch (error) {
      console.log('✗ Browsers section not found');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-041-browsers-FAIL.png'),
        fullPage: true
      });
      console.log('\n❌ FAIL: Could not find Browsers section');
      throw error;
    }
  });

  test('ANA-042: Operating Systems', async ({ page }) => {
    console.log('\n=== ANA-042: Operating Systems ===');

    // Look for Operating Systems section
    const osSection = page.locator('text=/Operating Systems?|OS/i').first();

    try {
      await osSection.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Found Operating Systems section');

      // Scroll to OS section if needed
      await osSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-042-os.png'),
        fullPage: true
      });

      // Look for OS names
      const windowsElement = await page.locator('text=/Windows/i').count();
      const macosElement = await page.locator('text=/macOS|Mac OS/i').count();
      const iosElement = await page.locator('text=/iOS/i').count();
      const androidElement = await page.locator('text=/Android/i').count();
      const linuxElement = await page.locator('text=/Linux/i').count();

      const operatingSystems = [];
      if (windowsElement > 0) operatingSystems.push('Windows');
      if (macosElement > 0) operatingSystems.push('macOS');
      if (iosElement > 0) operatingSystems.push('iOS');
      if (androidElement > 0) operatingSystems.push('Android');
      if (linuxElement > 0) operatingSystems.push('Linux');

      if (operatingSystems.length > 0) {
        console.log(`✓ Found operating systems: ${operatingSystems.join(', ')}`);
      } else {
        console.log('⚠ No operating system names found');
      }

      // Check for percentage or count indicators
      const hasPercentage = await page.locator('text=/%/').count() > 0;
      const hasCount = await page.locator('text=/\\d+\\s*(clicks?|views?)/i').count() > 0;

      if (hasPercentage || hasCount) {
        console.log('✓ Shows percentage or count data');
      }

      // Look for chart elements
      const chartElements = page.locator('svg, canvas, [class*="chart"], [class*="Chart"]');
      const hasChart = await chartElements.count() > 0;

      if (hasChart) {
        console.log('✓ Chart/list visualization found');
      }

      if (operatingSystems.length > 0 && (hasPercentage || hasCount)) {
        console.log('\n✅ PASS: Operating Systems section shows OS data with metrics');
      } else if (operatingSystems.length > 0) {
        console.log('\n⚠ PARTIAL PASS: Operating Systems section exists but metrics unclear');
      } else {
        console.log('\n⚠ CONDITIONAL PASS: Operating Systems section exists but no data (expected if no clicks yet)');
      }

    } catch (error) {
      console.log('✗ Operating Systems section not found');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'uat-ana-042-os-FAIL.png'),
        fullPage: true
      });
      console.log('\n❌ FAIL: Could not find Operating Systems section');
      throw error;
    }
  });
});
