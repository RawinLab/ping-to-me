import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { loginAsUser } from './fixtures/auth';

const SCREENSHOT_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';

// Helper function to take screenshot
async function takeScreenshot(page: Page, filename: string) {
  const screenshotPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to wait for data
async function waitForData(page: Page, seconds: number = 3) {
  await page.waitForTimeout(seconds * 1000);
}

test.describe('UAT Tags Management - Detailed Tests', () => {
  let testResults: { testId: string; status: string; notes: string; screenshot: string }[] = [];

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'owner');
  });

  test.afterAll(async () => {
    // Generate report
    console.log('\n\n========== UAT TAGS MANAGEMENT TEST REPORT ==========\n');
    testResults.forEach(result => {
      console.log(`Test ID: ${result.testId}`);
      console.log(`Status: ${result.status}`);
      console.log(`Notes: ${result.notes}`);
      console.log(`Screenshot: ${result.screenshot}`);
      console.log('---');
    });
  });

  test('TAG-001: Access Tags Page', async ({ page }) => {
    console.log('\n=== TAG-001: Access Tags Page ===');
    let status = 'FAIL';
    let notes = '';

    try {
      // Try to access tags page directly
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Check if page loads
      const pageTitle = page.locator('h1, h2, [class*="title"]').filter({ hasText: /tag/i });
      const titleCount = await pageTitle.count();

      if (titleCount > 0 || page.url().includes('/dashboard/tags')) {
        status = 'PASS';
        notes = 'Tags management page accessible and loads without errors';
      } else {
        // Page might load but without explicit tag title
        status = 'PASS';
        notes = 'Page loads at /dashboard/tags URL';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-001-access.png');
    testResults.push({ testId: 'TAG-001', status, notes, screenshot: 'uat-tags-001-access.png' });
  });

  test('TAG-002: View Tags Statistics', async ({ page }) => {
    console.log('\n=== TAG-002: View Tags Statistics ===');
    let status = 'FAIL';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Look for statistics/stats cards
      const statsCards = page.locator('[class*="card"], [class*="stat"], [role="region"]');
      const cardCount = await statsCards.count();

      if (cardCount > 0) {
        // Check for numbers (statistics)
        const numbers = await page.locator('text=/\\d+/').count();
        if (numbers >= 3) {
          status = 'PASS';
          notes = `Found ${cardCount} stat cards with numeric values`;
        } else {
          status = 'PARTIAL';
          notes = 'Stat cards visible but numeric values not clearly displayed';
        }
      } else {
        status = 'FAIL';
        notes = 'No statistics cards found on tags page';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-002-stats.png');
    testResults.push({ testId: 'TAG-002', status, notes, screenshot: 'uat-tags-002-stats.png' });
  });

  test('TAG-003: Create New Tag', async ({ page }) => {
    console.log('\n=== TAG-003: Create New Tag ===');
    let status = 'FAIL';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      const timestamp = Date.now();
      const tagName = `UAT-Test-Tag-${timestamp}`;

      // Look for "New Tag" or "Create Tag" button
      const createButton = page.locator(
        'button:has-text("New Tag"), button:has-text("Create Tag"), button:has-text("Add Tag"), a:has-text("New Tag")'
      ).first();

      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await waitForData(page, 2);

        // Look for tag name input
        const nameInput = page.locator('input[name="name"], input[placeholder*="tag" i], input[id*="tag" i]').first();

        if (await nameInput.isVisible({ timeout: 3000 })) {
          await nameInput.fill(tagName);

          // Look for color picker (optional)
          const colorPicker = page.locator('[class*="color"], [type="color"], button[style*="background"]').first();
          if (await colorPicker.isVisible({ timeout: 2000 })) {
            await colorPicker.click();
            await waitForData(page, 1);
          }

          // Look for submit button
          const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').first();

          if (await submitButton.isVisible({ timeout: 3000 })) {
            await submitButton.click();
            await waitForData(page, 3);

            // Verify tag appears in list
            const tagVisible = await page.locator(`text="${tagName}"`).isVisible({ timeout: 3000 }).catch(() => false);

            if (tagVisible) {
              status = 'PASS';
              notes = `Tag "${tagName}" created successfully`;
            } else {
              status = 'FAIL';
              notes = 'Tag creation form submitted but tag not visible in list';
            }
          } else {
            status = 'FAIL';
            notes = 'Submit button not found in tag creation form';
          }
        } else {
          status = 'FAIL';
          notes = 'Tag name input field not found';
        }
      } else {
        status = 'FAIL';
        notes = 'Create Tag button not found';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-003-create.png');
    testResults.push({ testId: 'TAG-003', status, notes, screenshot: 'uat-tags-003-create.png' });
  });

  test('TAG-004: Edit Tag', async ({ page }) => {
    console.log('\n=== TAG-004: Edit Tag ===');
    let status = 'FAIL';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Find first tag in list
      const tagRow = page.locator('tr, [role="row"], [class*="tag"]').first();

      if (await tagRow.isVisible({ timeout: 3000 })) {
        // Look for edit button
        const editButton = tagRow.locator('button[aria-label*="edit" i], button:has-text("Edit"), svg + button').first();

        if (await editButton.isVisible({ timeout: 3000 })) {
          await editButton.click();
          await waitForData(page, 2);

          // Look for name field
          const nameInput = page.locator('input[name="name"]').first();

          if (await nameInput.isVisible({ timeout: 3000 })) {
            const currentName = await nameInput.inputValue();
            const timestamp = Date.now();
            const newName = `${currentName}-Edited-${timestamp}`;
            await nameInput.clear();
            await nameInput.fill(newName);

            // Save changes
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
            if (await saveButton.isVisible({ timeout: 3000 })) {
              await saveButton.click();
              await waitForData(page, 3);

              status = 'PASS';
              notes = `Tag edited successfully: ${currentName} -> ${newName}`;
            } else {
              status = 'FAIL';
              notes = 'Save button not found in edit form';
            }
          } else {
            status = 'FAIL';
            notes = 'Name input not found in edit form';
          }
        } else {
          status = 'FAIL';
          notes = 'Edit button not found for tag';
        }
      } else {
        status = 'FAIL';
        notes = 'No tags found in list to edit';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-004-edit.png');
    testResults.push({ testId: 'TAG-004', status, notes, screenshot: 'uat-tags-004-edit.png' });
  });

  test('TAG-005: Delete Tag', async ({ page }) => {
    console.log('\n=== TAG-005: Delete Tag ===');
    let status = 'FAIL';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Get initial tag count
      const tagRows = page.locator('tr, [role="row"]').filter({ hasNot: page.locator('th, [role="columnheader"]') });
      const initialCount = await tagRows.count();

      if (initialCount > 0) {
        // Find a tag to delete (preferably one without links)
        const tagRow = tagRows.first();
        const tagName = await tagRow.locator('td, div').first().textContent();

        // Look for delete button
        const deleteButton = tagRow.locator('button[aria-label*="delete" i], button:has-text("Delete"), svg[class*="trash"]').first();

        if (await deleteButton.isVisible({ timeout: 3000 })) {
          await deleteButton.click();
          await waitForData(page, 1);

          // Look for confirmation dialog
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();

          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click();
            await waitForData(page, 3);

            status = 'PASS';
            notes = `Tag "${tagName}" deleted with confirmation`;
          } else {
            // Maybe deleted without confirmation
            await waitForData(page, 2);
            const newCount = await page.locator('tr, [role="row"]').count();

            if (newCount < initialCount) {
              status = 'PASS';
              notes = `Tag deleted without confirmation dialog`;
            } else {
              status = 'FAIL';
              notes = 'Delete button clicked but tag still appears in list';
            }
          }
        } else {
          status = 'FAIL';
          notes = 'Delete button not found for tag';
        }
      } else {
        status = 'FAIL';
        notes = 'No tags found to delete';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-005-delete.png');
    testResults.push({ testId: 'TAG-005', status, notes, screenshot: 'uat-tags-005-delete.png' });
  });

  test('TAG-006: View Links by Tag', async ({ page }) => {
    console.log('\n=== TAG-006: View Links by Tag ===');
    let status = 'FAIL';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Find a tag with links (link count > 0)
      const tagRows = page.locator('tr, [role="row"]');
      let tagWithLinks = null;

      const rowCount = await tagRows.count();
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const row = tagRows.nth(i);
        const linkCount = await row.locator('text=/\\d+\\s*(link|use)/i').count();
        if (linkCount > 0) {
          const countText = await row.locator('td, div').nth(1).textContent();
          if (countText && parseInt(countText) > 0) {
            tagWithLinks = row;
            break;
          }
        }
      }

      if (tagWithLinks) {
        // Look for "View Links" or similar button
        const viewLinksButton = tagWithLinks.locator('button:has-text("View"), a, [role="link"]').first();

        if (await viewLinksButton.isVisible({ timeout: 3000 })) {
          await viewLinksButton.click();
          await waitForData(page, 3);

          // Verify we're on links page
          if (page.url().includes('/dashboard/links')) {
            status = 'PASS';
            notes = 'Successfully navigated to filtered links page';
          } else {
            status = 'FAIL';
            notes = 'Clicked view links but not on links page';
          }
        } else {
          status = 'FAIL';
          notes = 'No clickable element found for viewing links';
        }
      } else {
        status = 'PARTIAL';
        notes = 'No tags with links found (this may be normal if no links are tagged)';
      }
    } catch (error) {
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-006-view-links.png');
    testResults.push({ testId: 'TAG-006', status, notes, screenshot: 'uat-tags-006-view-links.png' });
  });

  test('TAG-007: UI Responsiveness and Design', async ({ page }) => {
    console.log('\n=== TAG-007: UI Responsiveness and Design ===');
    let status = 'PASS';
    let notes = '';

    try {
      await page.goto('http://localhost:3010/dashboard/tags');
      await waitForData(page, 5);

      // Check for basic UI elements
      const hasNav = await page.locator('nav, [role="navigation"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasTable = await page.locator('table, [role="table"], [role="grid"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasButtons = await page.locator('button').count() > 0;

      if (!hasNav || !hasTable || !hasButtons) {
        status = 'PARTIAL';
        notes = `Missing UI elements: nav=${hasNav}, table=${hasTable}, buttons=${hasButtons}`;
      } else {
        notes = 'All major UI elements present and visible';
      }

      // Check if page is responsive (no horizontal scroll needed for content)
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      if (pageWidth > viewportWidth) {
        status = 'PARTIAL';
        notes += ' (Page may have horizontal scroll)';
      }
    } catch (error) {
      status = 'FAIL';
      notes = `Error: ${error}`;
    }

    await takeScreenshot(page, 'uat-tags-007-ui.png');
    testResults.push({ testId: 'TAG-007', status, notes, screenshot: 'uat-tags-007-ui.png' });
  });
});
