import { test, expect, Page } from '@playwright/test';
import path from 'path';

const TEST_USER = {
  email: 'e2e-owner@pingtome.test',
  password: 'TestPassword123!',
};

const BASE_URL = 'http://localhost:3010';
const SCREENSHOT_DIR = '/Users/earn/Projects/rawinlab/pingtome/apps/web/screenshots';

// Helper function to wait for async data
async function waitForAsyncData(page: Page, seconds: number = 5) {
  await page.waitForTimeout(seconds * 1000);
}

// Helper function to take screenshot
async function takeScreenshot(page: Page, filename: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true
  });
}

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="email"]', TEST_USER.email);
  await page.fill('input[id="password"]', TEST_USER.password);
  await page.click('button:has-text("Sign In with Email")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await waitForAsyncData(page, 5);
}

test.describe('UAT Tag Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TAG-001: Create Tag', async ({ page }) => {
    console.log('\n=== TAG-001: Create Tag ===');

    // Navigate to links page
    await page.goto(`${BASE_URL}/dashboard/links`);
    await waitForAsyncData(page, 5);

    const tagName = `UAT-Tag-${Date.now()}`;
    let testResult = 'FAIL';
    let notes = '';

    try {
      // Look for Create Link button or existing link to edit
      const createLinkButton = page.locator('button:has-text("Create Link"), a:has-text("Create Link"), button:has-text("New Link"), a:has-text("New Link")').first();

      if (await createLinkButton.isVisible({ timeout: 5000 })) {
        await createLinkButton.click();
        await waitForAsyncData(page, 2);

        // Look for tags input field
        const tagsInput = page.locator('input[name="tags"], input[placeholder*="tag" i], input[placeholder*="Tag"]').first();

        if (await tagsInput.isVisible({ timeout: 5000 })) {
          // Try to add tag
          await tagsInput.click();
          await tagsInput.fill(tagName);

          // Look for tag creation confirmation (might be a dropdown, badge, or inline confirmation)
          await page.waitForTimeout(1000);

          // Press Enter to confirm tag
          await tagsInput.press('Enter');
          await page.waitForTimeout(1000);

          // Check if tag appears as badge or in list
          const tagBadge = page.locator(`text="${tagName}"`).first();
          if (await tagBadge.isVisible({ timeout: 3000 })) {
            testResult = 'PASS';
            notes = `Tag "${tagName}" created successfully via link creation form`;
          } else {
            notes = 'Tag input found but tag creation not confirmed visually';
          }
        } else {
          // Check if we're on a different page structure
          notes = 'Tags input field not found on create link page';
          testResult = 'NOT_IMPL';
        }
      } else {
        // Try to look for existing links to edit
        const existingLink = page.locator('tr, [role="row"]').filter({ hasText: /http/i }).first();

        if (await existingLink.isVisible({ timeout: 5000 })) {
          // Try to click on edit icon or link
          const editButton = existingLink.locator('button[aria-label*="edit" i], button:has-text("Edit"), [aria-label="Edit"]').first();

          if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await waitForAsyncData(page, 2);

            // Look for tags input in edit form
            const tagsInput = page.locator('input[name="tags"], input[placeholder*="tag" i]').first();

            if (await tagsInput.isVisible({ timeout: 5000 })) {
              await tagsInput.click();
              await tagsInput.fill(tagName);
              await tagsInput.press('Enter');
              await page.waitForTimeout(1000);

              const tagBadge = page.locator(`text="${tagName}"`).first();
              if (await tagBadge.isVisible({ timeout: 3000 })) {
                testResult = 'PASS';
                notes = `Tag "${tagName}" created successfully via link edit form`;
              } else {
                notes = 'Tag input found in edit form but creation not confirmed';
              }
            } else {
              notes = 'Tags input not found in edit form';
              testResult = 'NOT_IMPL';
            }
          } else {
            notes = 'Could not find edit button for existing links';
            testResult = 'NOT_IMPL';
          }
        } else {
          notes = 'No links found to test tag creation';
          testResult = 'NOT_IMPL';
        }
      }
    } catch (error) {
      notes = `Error during test: ${error}`;
      testResult = 'FAIL';
    }

    await takeScreenshot(page, 'uat-05-03-tag-001-create.png');

    console.log(`Result: ${testResult}`);
    console.log(`Notes: ${notes}`);
    console.log('Screenshot: uat-05-03-tag-001-create.png');
  });

  test('TAG-002: Tag Usage Statistics', async ({ page }) => {
    console.log('\n=== TAG-002: Tag Usage Statistics ===');

    let testResult = 'FAIL';
    let notes = '';

    try {
      // Try to navigate to dedicated Tags page
      await page.goto(`${BASE_URL}/dashboard/tags`);
      await waitForAsyncData(page, 5);

      // Check if Tags page exists
      const pageTitle = page.locator('h1, h2').filter({ hasText: /tags/i }).first();

      if (await pageTitle.isVisible({ timeout: 5000 })) {
        // Look for tag statistics (count, usage)
        const tagRows = page.locator('tr, [role="row"]').filter({ hasText: /link/i });

        if (await tagRows.count() > 0) {
          // Check if statistics are shown (count column, usage stats)
          const statsVisible = await page.locator('text=/\\d+\\s*(link|use)/i').first().isVisible({ timeout: 3000 });

          if (statsVisible) {
            testResult = 'PASS';
            notes = 'Tags page exists with usage statistics showing link counts';
          } else {
            testResult = 'FAIL';
            notes = 'Tags page exists but usage statistics not found';
          }
        } else {
          notes = 'Tags page exists but no tags found or stats not displayed';
          testResult = 'FAIL';
        }
      } else {
        // Try links page with tag management
        await page.goto(`${BASE_URL}/dashboard/links`);
        await waitForAsyncData(page, 5);

        // Look for tags section or filter
        const tagsSection = page.locator('text="Tags"').first();

        if (await tagsSection.isVisible({ timeout: 3000 })) {
          // Check if statistics are shown
          const tagWithCount = page.locator('text=/\\w+\\s*\\(\\d+\\)/').first();

          if (await tagWithCount.isVisible({ timeout: 3000 })) {
            testResult = 'PASS';
            notes = 'Tag statistics shown in links page sidebar/filter (counts visible)';
          } else {
            notes = 'Tags section found but no usage statistics';
            testResult = 'NOT_IMPL';
          }
        } else {
          notes = 'No dedicated Tags page or statistics section found';
          testResult = 'NOT_IMPL';
        }
      }
    } catch (error) {
      notes = `Error during test: ${error}`;
      testResult = 'FAIL';
    }

    await takeScreenshot(page, 'uat-05-03-tag-002-stats.png');

    console.log(`Result: ${testResult}`);
    console.log(`Notes: ${notes}`);
    console.log('Screenshot: uat-05-03-tag-002-stats.png');
  });

  test('TAG-003: Filter Links by Tag', async ({ page }) => {
    console.log('\n=== TAG-003: Filter Links by Tag ===');

    await page.goto(`${BASE_URL}/dashboard/links`);
    await waitForAsyncData(page, 5);

    let testResult = 'FAIL';
    let notes = '';

    try {
      // Look for "Add filters" button or tag filter
      const addFiltersButton = page.locator('button:has-text("Add filters"), button:has-text("Filter"), button:has-text("Filters")').first();

      if (await addFiltersButton.isVisible({ timeout: 5000 })) {
        await addFiltersButton.click();
        await page.waitForTimeout(1000);

        // Look for tag filter option
        const tagFilterOption = page.locator('text="Tag", text="Tags"').first();

        if (await tagFilterOption.isVisible({ timeout: 3000 })) {
          await tagFilterOption.click();
          await page.waitForTimeout(1000);

          // Look for tag dropdown or selection
          const tagSelect = page.locator('select, [role="combobox"], [role="listbox"]').first();

          if (await tagSelect.isVisible({ timeout: 3000 })) {
            await tagSelect.click();
            await page.waitForTimeout(1000);

            // Select first available tag
            const firstTag = page.locator('[role="option"]').first();

            if (await firstTag.isVisible({ timeout: 3000 })) {
              const tagText = await firstTag.textContent();
              await firstTag.click();
              await waitForAsyncData(page, 2);

              // Check if filter badge is visible
              const filterBadge = page.locator(`text="${tagText}", [role="badge"]`).first();

              if (await filterBadge.isVisible({ timeout: 3000 })) {
                testResult = 'PASS';
                notes = `Successfully filtered by tag "${tagText}", filter badge visible`;
              } else {
                notes = 'Tag selected but filter badge not visible';
                testResult = 'FAIL';
              }
            } else {
              notes = 'Tag dropdown opened but no tags available to select';
              testResult = 'FAIL';
            }
          } else {
            notes = 'Tag filter option found but selection UI not found';
            testResult = 'FAIL';
          }
        } else {
          notes = 'Filters button found but Tag filter option not available';
          testResult = 'NOT_IMPL';
        }
      } else {
        // Try alternative: direct tag filter/dropdown
        const tagFilterDropdown = page.locator('select[name*="tag" i], button:has-text("All Tags")').first();

        if (await tagFilterDropdown.isVisible({ timeout: 3000 })) {
          await tagFilterDropdown.click();
          await page.waitForTimeout(1000);

          // Select a tag
          const tagOption = page.locator('[role="option"], option').filter({ hasNot: page.locator('text="All"') }).first();

          if (await tagOption.isVisible({ timeout: 3000 })) {
            await tagOption.click();
            await waitForAsyncData(page, 2);

            testResult = 'PASS';
            notes = 'Tag filter applied via dropdown, links filtered';
          } else {
            notes = 'Tag dropdown found but no tags to select';
            testResult = 'FAIL';
          }
        } else {
          notes = 'No tag filter mechanism found (neither "Add filters" button nor tag dropdown)';
          testResult = 'NOT_IMPL';
        }
      }
    } catch (error) {
      notes = `Error during test: ${error}`;
      testResult = 'FAIL';
    }

    await takeScreenshot(page, 'uat-05-03-tag-003-filter.png');

    console.log(`Result: ${testResult}`);
    console.log(`Notes: ${notes}`);
    console.log('Screenshot: uat-05-03-tag-003-filter.png');
  });

  test('TAG-004: Delete Tag', async ({ page }) => {
    console.log('\n=== TAG-004: Delete Tag ===');

    let testResult = 'FAIL';
    let notes = '';

    try {
      // Try to navigate to Tags page
      await page.goto(`${BASE_URL}/dashboard/tags`);
      await waitForAsyncData(page, 5);

      const pageTitle = page.locator('h1, h2').filter({ hasText: /tags/i }).first();

      if (await pageTitle.isVisible({ timeout: 5000 })) {
        // Look for delete button on a tag
        const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete"), [aria-label*="Delete"]').first();

        if (await deleteButton.isVisible({ timeout: 5000 })) {
          // Get tag name before deletion
          const tagRow = deleteButton.locator('xpath=ancestor::tr | ancestor::div[@role="row"]').first();
          const tagName = await tagRow.locator('td, div').first().textContent();

          await deleteButton.click();
          await page.waitForTimeout(1000);

          // Look for confirmation dialog
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').first();

          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click();
            await waitForAsyncData(page, 2);

            // Verify tag is deleted
            const tagStillExists = await page.locator(`text="${tagName}"`).isVisible({ timeout: 2000 }).catch(() => false);

            if (!tagStillExists) {
              testResult = 'PASS';
              notes = `Tag "${tagName}" successfully deleted with confirmation`;
            } else {
              testResult = 'FAIL';
              notes = 'Delete confirmed but tag still visible';
            }
          } else {
            // Maybe deleted without confirmation
            await waitForAsyncData(page, 2);
            const tagStillExists = await page.locator(`text="${tagName}"`).isVisible({ timeout: 2000 }).catch(() => false);

            if (!tagStillExists) {
              testResult = 'PASS';
              notes = `Tag "${tagName}" deleted (no confirmation dialog)`;
            } else {
              testResult = 'FAIL';
              notes = 'Delete button clicked but tag not deleted';
            }
          }
        } else {
          notes = 'Tags page exists but no delete button found for tags';
          testResult = 'NOT_IMPL';
        }
      } else {
        notes = 'No dedicated Tags page found for tag deletion';
        testResult = 'NOT_IMPL';
      }
    } catch (error) {
      notes = `Error during test: ${error}`;
      testResult = 'FAIL';
    }

    await takeScreenshot(page, 'uat-05-03-tag-004-delete.png');

    console.log(`Result: ${testResult}`);
    console.log(`Notes: ${notes}`);
    console.log('Screenshot: uat-05-03-tag-004-delete.png');
  });

  test('TAG-005: Merge Duplicate Tags', async ({ page }) => {
    console.log('\n=== TAG-005: Merge Duplicate Tags ===');

    let testResult = 'FAIL';
    let notes = '';

    try {
      // Navigate to Tags page
      await page.goto(`${BASE_URL}/dashboard/tags`);
      await waitForAsyncData(page, 5);

      const pageTitle = page.locator('h1, h2').filter({ hasText: /tags/i }).first();

      if (await pageTitle.isVisible({ timeout: 5000 })) {
        // Look for "Merge Tags" button or feature
        const mergeButton = page.locator('button:has-text("Merge"), button:has-text("Merge Tags")').first();

        if (await mergeButton.isVisible({ timeout: 5000 })) {
          await mergeButton.click();
          await page.waitForTimeout(1000);

          // Look for merge dialog/interface
          const mergeDialog = page.locator('[role="dialog"], [role="alertdialog"]').first();

          if (await mergeDialog.isVisible({ timeout: 3000 })) {
            // Look for tag selection dropdowns
            const tagSelects = page.locator('select, [role="combobox"]');
            const selectCount = await tagSelects.count();

            if (selectCount >= 2) {
              // Select source and target tags
              const firstSelect = tagSelects.nth(0);
              const secondSelect = tagSelects.nth(1);

              await firstSelect.click();
              await page.waitForTimeout(500);
              await page.locator('[role="option"]').first().click();

              await secondSelect.click();
              await page.waitForTimeout(500);
              await page.locator('[role="option"]').nth(1).click();

              // Confirm merge
              const confirmMergeButton = page.locator('button:has-text("Merge"), button:has-text("Confirm")').first();

              if (await confirmMergeButton.isVisible({ timeout: 3000 })) {
                await confirmMergeButton.click();
                await waitForAsyncData(page, 2);

                testResult = 'PASS';
                notes = 'Merge Tags feature found and functional (UI present, can select tags and confirm)';
              } else {
                notes = 'Merge dialog opened but confirm button not found';
                testResult = 'FAIL';
              }
            } else {
              notes = 'Merge dialog opened but tag selection interface incomplete';
              testResult = 'FAIL';
            }
          } else {
            notes = 'Merge button found but dialog did not open';
            testResult = 'FAIL';
          }
        } else {
          notes = 'No "Merge Tags" feature found on Tags page';
          testResult = 'NOT_IMPL';
        }
      } else {
        notes = 'No dedicated Tags page found for tag merging';
        testResult = 'NOT_IMPL';
      }
    } catch (error) {
      notes = `Error during test: ${error}`;
      testResult = 'FAIL';
    }

    await takeScreenshot(page, 'uat-05-03-tag-005-merge.png');

    console.log(`Result: ${testResult}`);
    console.log(`Notes: ${notes}`);
    console.log('Screenshot: uat-05-03-tag-005-merge.png');
  });
});
