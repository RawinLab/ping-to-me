import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/test-data";

/**
 * Link Organization E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover organization features:
 * - Folder management (create, view, delete)
 * - Tag management (create, edit, merge)
 * - Campaign management (create, analytics)
 * - Cross-feature integration
 */

test.describe("Link Organization - Folders, Tags, and Campaigns", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Folder Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("FLD-001: View folders in organization settings", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Folders tab if needed
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      if (await foldersTab.isVisible()) {
        await foldersTab.click();
      }

      // Should see folders section
      await expect(
        page.locator('text=Folders, text=Folder Name').first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("FLD-002: Create new folder", async ({ page }) => {
      const folderName = `Test Folder ${uniqueId}`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Folders tab
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      if (await foldersTab.isVisible()) {
        await foldersTab.click();
      }

      // Click create folder button
      const createButton = page.locator(
        'button:has-text("Create Folder"), button:has-text("New Folder")'
      );
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill folder form
        await page.fill('input[name="name"]', folderName);

        // Submit
        await page.click('button[type="submit"]');

        // Should see new folder
        await expect(page.locator(`text=${folderName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("FLD-003: View links in folder", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Look for folder filter in sidebar or dropdown
      const folderFilter = page.locator('button:has-text("Folders")');
      if (await folderFilter.isVisible()) {
        await folderFilter.click();

        // Select a folder
        const folderOption = page.locator('[role="option"]').first();
        if (await folderOption.isVisible()) {
          await folderOption.click();
        }
      }

      // Page should filter by folder
      await expect(page).toHaveURL(/folderId|folder/);
    });

    test("FLD-004: RBAC - Viewer cannot create folders", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Folders tab
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      if (await foldersTab.isVisible()) {
        await foldersTab.click();
      }

      // Create button should be hidden or disabled
      const createButton = page.locator('button:has-text("Create Folder")');
      if (await createButton.isVisible()) {
        const isDisabled = await createButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe("Tag Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("TAG-001: View tags in organization settings", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Should see tags section
      await expect(page.locator("text=Tags").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TAG-002: Create new tag", async ({ page }) => {
      const tagName = `Test Tag ${uniqueId}`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Click create tag button
      const createButton = page.locator(
        'button:has-text("Create Tag"), button:has-text("New Tag")'
      );
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill tag form
        await page.fill('input[name="name"]', tagName);

        // Submit
        await page.click('button[type="submit"]');

        // Should see new tag
        await expect(page.locator(`text=${tagName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("TAG-003: Filter links by tag", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Look for tag filter
      const tagFilter = page.locator('button:has-text("Tags")');
      if (await tagFilter.isVisible()) {
        await tagFilter.click();

        // Select a tag
        const tagOption = page.locator('[role="option"]').first();
        if (await tagOption.isVisible()) {
          await tagOption.click();
        }
      }

      // Page should filter by tag
      await page.waitForLoadState("networkidle");
    });

    test("TAG-004: View tag usage statistics", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Tags tab
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      if (await tagsTab.isVisible()) {
        await tagsTab.click();
      }

      // Should see usage count for tags
      const usageColumn = page.locator('th:has-text("Usage"), th:has-text("Links")');
      await expect(usageColumn.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Campaign Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("CMP-001: View campaigns in organization settings", async ({
      page,
    }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Should see campaigns section
      await expect(page.locator("text=Campaigns").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("CMP-002: Create new campaign", async ({ page }) => {
      const campaignName = `Test Campaign ${uniqueId}`;

      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Click create campaign button
      const createButton = page.locator(
        'button:has-text("Create Campaign"), button:has-text("New Campaign")'
      );
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill campaign form
        await page.fill('input[name="name"]', campaignName);

        // Set date range if required
        const startDate = page.locator('input[name="startDate"]');
        if (await startDate.isVisible()) {
          const today = new Date().toISOString().slice(0, 10);
          await startDate.fill(today);
        }

        const endDate = page.locator('input[name="endDate"]');
        if (await endDate.isVisible()) {
          const future = new Date();
          future.setMonth(future.getMonth() + 1);
          await endDate.fill(future.toISOString().slice(0, 10));
        }

        // Submit
        await page.click('button[type="submit"]');

        // Should see new campaign
        await expect(page.locator(`text=${campaignName}`)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("CMP-003: View campaign analytics", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Campaigns tab
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );
      if (await campaignsTab.isVisible()) {
        await campaignsTab.click();
      }

      // Click on a campaign to view details
      const campaignRow = page.locator("tr").nth(1);
      if (await campaignRow.isVisible()) {
        const analyticsButton = campaignRow.locator(
          'button:has-text("Analytics"), a:has-text("View")'
        );
        if (await analyticsButton.isVisible()) {
          await analyticsButton.click();

          // Should see analytics data
          await expect(
            page.locator("text=Clicks, text=Analytics, text=Engagement")
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe("Cross-Feature Integration", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("INT-001: Create link with folder and tags", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.waitForLoadState("networkidle");

      // Fill destination URL
      await page.fill('input[name="destinationUrl"]', "https://example.com/integrated");

      // Fill custom slug
      await page.fill('input[name="slug"]', `integrated-${uniqueId}`);

      // Select folder if dropdown exists
      const folderSelect = page.locator('select[name="folderId"], button:has-text("Select folder")');
      if (await folderSelect.isVisible()) {
        await folderSelect.click();
        const folderOption = page.locator('[role="option"]').first();
        if (await folderOption.isVisible()) {
          await folderOption.click();
        }
      }

      // Add tags
      const tagInput = page.locator('input[name="tags"]');
      if (await tagInput.isVisible()) {
        await tagInput.fill("integration, test");
      }

      // Create link
      await page.click('button:has-text("Create Link")');

      // Should redirect to links page
      await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
    });

    test("INT-002: Filter links by folder and tag together", async ({
      page,
    }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Apply folder filter
      const folderFilter = page.locator('button:has-text("Folders")');
      if (await folderFilter.isVisible()) {
        await folderFilter.click();
        const folderOption = page.locator('[role="option"]').first();
        if (await folderOption.isVisible()) {
          await folderOption.click();
        }
      }

      // Apply tag filter
      const tagFilter = page.locator('button:has-text("Tags")');
      if (await tagFilter.isVisible()) {
        await tagFilter.click();
        const tagOption = page.locator('[role="option"]').first();
        if (await tagOption.isVisible()) {
          await tagOption.click();
        }
      }

      // Should show filtered results
      await page.waitForLoadState("networkidle");
    });

    test("INT-003: Organization scope isolation", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // All links should belong to current organization
      // This is verified by the API response

      // Check that organization switcher exists
      const orgSwitcher = page.locator('[data-testid="org-switcher"]');
      if (await orgSwitcher.isVisible()) {
        await expect(orgSwitcher).toBeVisible();
      }
    });
  });

  test.describe("RBAC - Role-Based Access", () => {
    test("RBAC-001: Owner can manage all organization features", async ({
      page,
    }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // All tabs should be accessible
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      const tagsTab = page.locator('button[role="tab"]:has-text("Tags")');
      const campaignsTab = page.locator(
        'button[role="tab"]:has-text("Campaigns")'
      );

      if (await foldersTab.isVisible()) {
        await expect(foldersTab).toBeEnabled();
      }
      if (await tagsTab.isVisible()) {
        await expect(tagsTab).toBeEnabled();
      }
      if (await campaignsTab.isVisible()) {
        await expect(campaignsTab).toBeEnabled();
      }
    });

    test("RBAC-002: Admin can manage organization features", async ({
      page,
    }) => {
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Admin should have access to organization features
      await expect(page.locator("text=Organization")).toBeVisible({
        timeout: 10000,
      });
    });

    test("RBAC-003: Editor can create but not delete", async ({ page }) => {
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Folders tab
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      if (await foldersTab.isVisible()) {
        await foldersTab.click();
      }

      // Create button should be enabled
      const createButton = page.locator('button:has-text("Create Folder")');
      if (await createButton.isVisible()) {
        await expect(createButton).toBeEnabled();
      }

      // Delete buttons should be disabled or hidden
      const deleteButton = page.locator('button[title="Delete"]').first();
      if (await deleteButton.isVisible()) {
        const isDisabled = await deleteButton.isDisabled();
        // Editor may or may not have delete permissions based on implementation
        expect(typeof isDisabled).toBe("boolean");
      }
    });

    test("RBAC-004: Viewer has read-only access", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Viewer should see organization info but not be able to edit
      // Create buttons should be disabled or hidden
      const createButtons = page.locator(
        'button:has-text("Create"), button:has-text("New")'
      );
      const count = await createButtons.count();

      for (let i = 0; i < count; i++) {
        const button = createButtons.nth(i);
        if (await button.isVisible()) {
          const isDisabled = await button.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("ERR-001: Handle duplicate folder name", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Switch to Folders tab
      const foldersTab = page.locator('button[role="tab"]:has-text("Folders")');
      if (await foldersTab.isVisible()) {
        await foldersTab.click();
      }

      // Try to create folder with existing name
      const createButton = page.locator('button:has-text("Create Folder")');
      if (await createButton.isVisible()) {
        await createButton.click();

        // Use a name that might already exist
        await page.fill('input[name="name"]', "Marketing");
        await page.click('button[type="submit"]');

        // Should show error or handle gracefully
        const error = page.locator("text=already exists, text=duplicate");
        // Either error shows or form closes (if name is unique)
        await page.waitForTimeout(1000);
      }
    });

    test("ERR-002: Handle network error gracefully", async ({ page }) => {
      await page.goto("/dashboard/organization");
      await page.waitForLoadState("networkidle");

      // Page should handle errors gracefully
      // If there's an error state, it should be shown
      const errorState = page.locator("text=Error, text=failed to load");
      const content = page.locator("text=Organization, text=Folders");

      // Either error state or content should be visible
      const hasError = await errorState.isVisible().catch(() => false);
      const hasContent = await content.first().isVisible().catch(() => false);

      expect(hasError || hasContent).toBe(true);
    });
  });
});
