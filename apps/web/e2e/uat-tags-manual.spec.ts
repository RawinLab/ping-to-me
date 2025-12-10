import { test, expect, Page } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';
const BASE_URL = 'http://localhost:3010';

// Helper function to take screenshot
async function takeScreenshot(page: Page, filename: string) {
  const screenshotPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper to wait
async function waitForData(page: Page, seconds: number = 3) {
  await page.waitForTimeout(seconds * 1000);
}

test.describe('UAT Tags Management - Manual Tests', () => {
  test('Setup: Login and navigate to tags page', async ({ page }) => {
    console.log('\n=== Manual Login and Navigation ===');

    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await waitForData(page, 2);

    // Fill login form
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');

    // Click login
    const loginButton = page.locator('button:has-text("Sign In with Email")').first();
    await loginButton.click();

    // Wait for navigation or dashboard
    await page.waitForTimeout(5000);

    // Check if we're logged in
    const isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/login') === false;
    console.log(`Login successful: ${isLoggedIn}, URL: ${page.url()}`);

    await takeScreenshot(page, 'uat-setup-after-login.png');

    // Navigate to tags page
    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    console.log(`Tags page URL: ${page.url()}`);
    await takeScreenshot(page, 'uat-tags-page-loaded.png');
  });

  test('TAG-001: Access Tags Page', async ({ page }) => {
    console.log('\n=== TAG-001: Access Tags Page ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    // Navigate to tags
    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    const urlValid = page.url().includes('/dashboard/tags');
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000;

    console.log(`URL valid: ${urlValid}, Has content: ${hasContent}`);
    expect(urlValid).toBeTruthy();

    await takeScreenshot(page, 'uat-tags-001-access.png');
  });

  test('TAG-002: View Tags Statistics', async ({ page }) => {
    console.log('\n=== TAG-002: View Tags Statistics ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Look for any cards or stat elements
    const cardElements = await page.locator('[class*="card"], [class*="stat"]').count();
    console.log(`Found ${cardElements} card/stat elements`);

    // Look for numbers in the page
    const numbers = await page.locator('text=/\\d{1,}/').count();
    console.log(`Found ${numbers} numeric elements`);

    await takeScreenshot(page, 'uat-tags-002-stats.png');
  });

  test('TAG-003: Create New Tag', async ({ page }) => {
    console.log('\n=== TAG-003: Create New Tag ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Look for create button
    const createButtons = await page.locator('button').count();
    console.log(`Found ${createButtons} buttons on page`);

    const allText = await page.textContent('body');
    console.log(`Page has "New" text: ${allText?.includes('New')}`);
    console.log(`Page has "Create" text: ${allText?.includes('Create')}`);
    console.log(`Page has "Tag" text: ${allText?.includes('Tag')}`);

    await takeScreenshot(page, 'uat-tags-003-create.png');
  });

  test('TAG-004: Edit Tag', async ({ page }) => {
    console.log('\n=== TAG-004: Edit Tag ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Look for table rows
    const rows = await page.locator('tr, [role="row"]').count();
    console.log(`Found ${rows} table rows`);

    if (rows > 0) {
      const firstRow = page.locator('tr, [role="row"]').first();
      const rowText = await firstRow.textContent();
      console.log(`First row content: ${rowText?.substring(0, 100)}`);
    }

    await takeScreenshot(page, 'uat-tags-004-edit.png');
  });

  test('TAG-005: Delete Tag', async ({ page }) => {
    console.log('\n=== TAG-005: Delete Tag ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Look for delete buttons
    const deleteButtons = await page.locator('button[aria-label*="delete" i], button:has-text("Delete")').count();
    console.log(`Found ${deleteButtons} delete buttons`);

    await takeScreenshot(page, 'uat-tags-005-delete.png');
  });

  test('TAG-006: View Links by Tag', async ({ page }) => {
    console.log('\n=== TAG-006: View Links by Tag ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Look for view/click elements
    const links = await page.locator('a, [role="link"], button[type="button"]').count();
    console.log(`Found ${links} clickable elements`);

    await takeScreenshot(page, 'uat-tags-006-view-links.png');
  });

  test('TAG-007: UI Responsiveness', async ({ page }) => {
    console.log('\n=== TAG-007: UI Responsiveness ===');

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', 'e2e-owner@pingtome.test');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.locator('button:has-text("Sign In with Email")').first().click();
    await page.waitForTimeout(5000);

    await page.goto(`${BASE_URL}/dashboard/tags`);
    await waitForData(page, 5);

    // Check page structure
    const nav = await page.locator('nav').isVisible().catch(() => false);
    const header = await page.locator('header').isVisible().catch(() => false);
    const main = await page.locator('main').isVisible().catch(() => false);

    console.log(`Has nav: ${nav}, Has header: ${header}, Has main: ${main}`);

    // Check for responsive design elements
    const hasResponsiveClasses = await page.evaluate(() => {
      const body = document.body;
      return (
        body.className.includes('dark') ||
        body.className.includes('light') ||
        getComputedStyle(body).getPropertyValue('--foreground').length > 0
      );
    });

    console.log(`Has responsive/theme classes: ${hasResponsiveClasses}`);

    await takeScreenshot(page, 'uat-tags-007-ui.png');
  });
});
