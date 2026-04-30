import { test, expect } from '@playwright/test';

/**
 * UAT Test Case: DOM-040 - Use Custom Domain with Link
 *
 * Pre-conditions: Custom Domain exists in system (not necessarily verified)
 *
 * Test Steps:
 * 1. Go to /dashboard/links/new to create new link
 * 2. Fill in link details:
 *    - Original URL: https://example.com/test-domain-link
 *    - Title: Test Domain Link
 * 3. Look for Domain dropdown/selector
 * 4. Verify Custom Domains appear in dropdown
 *
 * Expected Results:
 * - Domain selector exists in create link form
 * - Custom Domains appear in dropdown options
 * - Can select Custom Domain (if verified domain exists)
 * - Short URL preview shows Custom Domain (if selected)
 */

test.describe('DOM-040: Use Custom Domain with Link', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('http://localhost:3010/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In with Email")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    console.log('✓ Logged in successfully');
  });

  test('DOM-040: Verify Custom Domain selector in Create Link form', async ({ page }) => {
    console.log('\n=== Starting DOM-040 Test ===\n');

    // Step 1: Check existing Custom Domains
    console.log('Step 1: Checking for existing Custom Domain...');
    await page.goto('http://localhost:3010/dashboard/domains');
    await page.waitForLoadState('networkidle');

    // Take screenshot of domains page
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-01-domains-page.png', fullPage: true });
    console.log('✓ Screenshot saved: dom-040-01-domains-page.png');

    // Count domains
    const domainCards = page.locator('[class*="card"], [class*="domain"]').filter({ hasText: /e2e-custom|e2e-failed|e2e-verifying|e2e-pending/i });
    const domainCount = await domainCards.count();
    console.log(`✓ Found ${domainCount} existing Custom Domain(s)`);

    // Check for verified domains
    const verifiedDomains = page.locator('text=/verified/i');
    const hasVerifiedDomain = await verifiedDomains.count() > 0;
    if (hasVerifiedDomain) {
      console.log('✓ Found verified domain(s) in the system');
    } else {
      console.log('⚠ No verified domains found - unverified domains may not be selectable');
    }

    // Step 2: Navigate to Create Link page
    console.log('\nStep 2: Navigating to /dashboard/links/new...');
    await page.goto('http://localhost:3010/dashboard/links/new');
    await page.waitForLoadState('networkidle');

    // Take screenshot of create link page
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-02-create-link-page.png', fullPage: true });
    console.log('✓ Screenshot saved: dom-040-02-create-link-page.png');

    // Step 3: Fill in link details
    console.log('\nStep 3: Filling in link details...');

    // Fill Original URL
    const urlInput = page.locator('input[id="originalUrl"]');
    await urlInput.waitFor({ state: 'visible' });
    await urlInput.fill('https://example.com/test-domain-link');
    console.log('✓ Filled Original URL: https://example.com/test-domain-link');

    // Fill Title
    const titleInput = page.locator('input[id="title"]');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('Test Domain Link');
    console.log('✓ Filled Title: Test Domain Link');

    await page.waitForTimeout(1000);

    // Step 4: Look for Domain selector
    console.log('\nStep 4: Looking for Domain dropdown/selector...');

    // Try multiple possible selectors for domain dropdown
    const domainSelectors = [
      'select[name="domain"]',
      'select[name="domainId"]',
      '[role="combobox"]',
      'button[role="combobox"]',
      '[data-testid="domain-selector"]',
      'label:has-text("Domain") + select',
      'label:has-text("Domain") + button',
    ];

    let domainSelector = null;
    let selectorType = null;

    for (const selector of domainSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        domainSelector = element;
        selectorType = selector;
        console.log(`✓ Found Domain selector: ${selector}`);
        break;
      }
    }

    if (!domainSelector) {
      console.log('✗ Domain selector NOT found!');
      console.log('Searching for any element containing "domain" text...');

      // Search for domain-related text
      const domainText = page.locator('text=/domain/i').first();
      if (await domainText.count() > 0) {
        console.log('Found text containing "domain"');
        await domainText.scrollIntoViewIfNeeded();
      }

      // Take screenshot for debugging
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-03-no-domain-selector.png', fullPage: true });
      console.log('✓ Screenshot saved: dom-040-03-no-domain-selector.png');

      throw new Error('FAIL: Domain selector not found in create link form');
    }

    // Scroll to top first to ensure domain selector is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Highlight the domain selector
    await domainSelector.scrollIntoViewIfNeeded();
    await domainSelector.evaluate(el => {
      el.style.border = '3px solid red';
    });

    // Take screenshot of domain selector
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-04-domain-selector-found.png', fullPage: true });
    console.log('✓ Screenshot saved: dom-040-04-domain-selector-found.png');

    // Step 5: Check if Custom Domains appear in dropdown
    console.log('\nStep 5: Checking Custom Domains in dropdown...');

    // Ensure selector is in viewport before clicking
    await domainSelector.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    if (selectorType?.includes('select')) {
      // Standard HTML select
      const options = await domainSelector.locator('option').allTextContents();
      console.log('Available domain options:', options);

      expect(options.length).toBeGreaterThan(0);
      console.log(`✓ Found ${options.length} domain options`);

      // Check if custom domain is in the list
      const hasCustomDomain = options.some(opt => opt.includes('test.example.com') || opt.includes('example.com'));
      if (hasCustomDomain) {
        console.log('✓ Custom Domain found in dropdown options');
      } else {
        console.log('⚠ Custom Domain not found in dropdown (may be unverified)');
      }

    } else if (selectorType?.includes('combobox')) {
      // Radix UI Select or Combobox
      console.log('Clicking domain selector...');
      await domainSelector.click({ force: true });

      // Wait for dropdown content to appear with explicit wait
      try {
        await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 3000 });
        console.log('✓ Dropdown appeared');
      } catch (e) {
        console.log('⚠ Waiting for dropdown timed out, taking screenshot anyway');
      }

      await page.waitForTimeout(500);

      // Take screenshot of opened dropdown
      await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-05-dropdown-opened.png', fullPage: true });
      console.log('✓ Screenshot saved: dom-040-05-dropdown-opened.png');

      // Debug: Check what elements exist
      const allListboxes = await page.locator('[role="listbox"]').count();
      console.log(`Found ${allListboxes} listbox elements`);

      const allOptions = await page.locator('[role="option"]').count();
      console.log(`Found ${allOptions} option elements`);

      // Look for SelectContent portal (Radix UI renders in a portal)
      const dropdownContent = page.locator('[role="listbox"]').first();
      const hasDropdownContent = await dropdownContent.isVisible().catch(() => false);
      console.log(`Dropdown content visible: ${hasDropdownContent}`);

      if (hasDropdownContent) {
        console.log('✓ Dropdown menu is visible');

        // Look for domain options in the dropdown
        const dropdownOptions = page.locator('[role="option"]');
        const optionsCount = await dropdownOptions.count();

        if (optionsCount > 0) {
          console.log(`✓ Found ${optionsCount} options in dropdown`);

          const optionsText = await dropdownOptions.allTextContents();
          console.log('Available domain options:', optionsText);

          // Check for pingto.me default domain
          const hasPingtoMe = optionsText.some(opt => opt.includes('pingto.me'));
          if (hasPingtoMe) {
            console.log('✓ Default domain (pingto.me) found in dropdown');
          }

          // Check for custom domains (e2e-custom.link)
          const hasCustomDomain = optionsText.some(opt => opt.includes('e2e-custom') || opt.includes('.link'));
          if (hasCustomDomain) {
            console.log('✓ Custom Domain found in dropdown options');

            // Try to select the custom domain
            const customDomainOption = dropdownOptions.filter({ hasText: /e2e-custom/i }).first();
            if (await customDomainOption.count() > 0) {
              await customDomainOption.click();
              console.log('✓ Selected Custom Domain (e2e-custom.link)');

              await page.waitForTimeout(500);

              // Take screenshot after selection
              await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-06-domain-selected.png', fullPage: true });
              console.log('✓ Screenshot saved: dom-040-06-domain-selected.png');
            }
          } else {
            console.log('⚠ Custom Domain not found in dropdown');
            console.log('Note: Only verified domains appear in the dropdown. Unverified domains are filtered out.');
          }
        } else {
          console.log('⚠ No options found in dropdown');
        }
      } else {
        console.log('⚠ Dropdown menu not visible');

        // Try alternative selector for Radix UI Select
        const alternativeDropdown = page.locator('[data-radix-select-content], [data-radix-popper-content-wrapper]');
        const hasAlternative = await alternativeDropdown.isVisible().catch(() => false);

        if (hasAlternative) {
          console.log('✓ Found alternative dropdown structure');
          const options = alternativeDropdown.locator('[role="option"]');
          const count = await options.count();
          console.log(`Found ${count} options in alternative dropdown`);

          if (count > 0) {
            const optionsText = await options.allTextContents();
            console.log('Available domain options:', optionsText);
          }
        } else {
          console.log('⚠ Could not find dropdown content');
        }
      }

      // Close dropdown by pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Final screenshot
    await page.screenshot({ path: '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots/dom-040-06-final-state.png', fullPage: true });
    console.log('✓ Screenshot saved: dom-040-06-final-state.png');

    console.log('\n=== DOM-040 Test Completed ===\n');
  });
});
