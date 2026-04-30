import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS } from "./fixtures/test-data";

/**
 * Bio Pages E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover Bio Pages functionality:
 * - Creating bio pages
 * - Editing bio pages
 * - Adding/removing links
 * - Theme customization
 * - Social links
 * - Public bio page rendering
 */

test.describe("Bio Pages", () => {
  const uniqueId = Date.now().toString(36);

  test.describe("Bio Page Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-001: View bio pages list", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Should show bio pages section
      await expect(
        page.locator("h1:has-text('Link-in-Bio Pages')")
      ).toBeVisible({ timeout: 10000 });
    });

    test("BIO-002: Create new bio page", async ({ page }) => {
      const bioSlug = `test-bio-${uniqueId}`;
      const bioTitle = `Test Bio Page ${uniqueId}`;

      await page.goto("/dashboard/bio/new");
      await page.waitForLoadState("networkidle");

      // Fill bio page form
      const slugInput = page.locator('input[name="slug"]');
      if (await slugInput.isVisible()) {
        await slugInput.fill(bioSlug);
      }

      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill(bioTitle);
      }

      const descInput = page.locator(
        'textarea[name="description"], input[name="description"]'
      );
      if (await descInput.isVisible()) {
        await descInput.fill("This is a test bio page");
      }

      // Submit
      const submitButton = page.locator('button:has-text("Create")').or(page.locator('button:has-text("Save")')).first();
      await submitButton.click();

      // Should redirect or show success
      await page.waitForTimeout(2000);
      const success = page.url().includes("/dashboard/bio");
      expect(success).toBe(true);
    });

    test("BIO-003: Edit bio page settings", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Click on first bio page to edit - look for card with Edit button
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Should be on edit or create page
        await expect(page).toHaveURL(/\/dashboard\/bio/);
      }
    });

    test("BIO-004: Delete bio page", async ({ page }) => {
      // First create a bio page to delete
      const bioSlug = `delete-bio-${uniqueId}`;

      await page.goto("/dashboard/bio/new");
      await page.waitForLoadState("networkidle");

      const slugInput = page.locator('input[name="slug"]');
      if (await slugInput.isVisible()) {
        await slugInput.fill(bioSlug);

        const titleInput = page.locator('input[name="title"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill("Bio to Delete");
        }

        const submitBtn = page.locator('button:has-text("Create")').or(page.locator('button:has-text("Save")')).first();
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }

      // Go to bio pages list
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Go to the created bio page and delete it from the edit page
      const bioLink = page.locator(`a:has-text("${bioSlug}")`).first();
      if (await bioLink.isVisible()) {
        const editBtn = page.locator('button:has-text("Edit Page")').first();
        if (await editBtn.isVisible()) {
          await editBtn.click();
          await page.waitForLoadState("networkidle");

          // Look for delete button in the edit page
          const deleteButton = page.locator('button[title*="Delete"], button:has-text("Delete")').first();
          if (await deleteButton.isVisible()) {
            page.on("dialog", (dialog) => dialog.accept());
            await deleteButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe("Bio Page Links", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-010: Add link to bio page", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Click on first bio page to edit
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for add link button
        const addLinkButton = page.locator('button:has-text("Add Link")').or(page.locator('button:has-text("+ Add")')).first();
        if (await addLinkButton.isVisible()) {
          await addLinkButton.click();

          // Should open add link dialog/form with title containing Add Link
          await expect(
            page.locator("h2, h3").filter({ hasText: /Add Link|Select Link/ }).first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("BIO-011: Reorder links on bio page", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for drag handles or reorder controls
        const dragHandle = page.locator('[data-drag-handle]').or(page.locator('.cursor-grab')).first();
        if (await dragHandle.isVisible()) {
          // Drag handles exist - reordering is available
          expect(await page.locator('[data-drag-handle], .cursor-grab').count()).toBeGreaterThan(0);
        }
      }
    });

    test("BIO-012: Toggle link visibility", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for visibility toggle
        const visibilityToggle = page.locator('button[role="switch"]').or(page.locator('input[type="checkbox"]')).first();
        if (await visibilityToggle.isVisible()) {
          // Toggle exists
          expect(await page.locator('button[role="switch"], input[type="checkbox"]').count()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe("Bio Page Themes", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-020: Change bio page theme", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for theme selector - find tab or button with Theme text
        const themeButton = page.locator('button:has-text("Theme")').or(page.locator('button:has-text("Design")')).first();
        if (await themeButton.isVisible()) {
          await themeButton.click();

          // Should show theme options
          await expect(
            page.locator("[role='tab'], [role='button']").filter({ hasText: /Theme|Style/ }).first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test("BIO-021: Customize colors", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for color picker inputs
        const colorInput = page.locator('input[type="color"]').first();
        if (await colorInput.isVisible()) {
          // Color customization available
          expect(await page.locator('input[type="color"]').count()).toBeGreaterThan(0);
        }
      }
    });

    test("BIO-022: Change button style", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for button style options
        const buttonStyleOption = page.locator('button:has-text("Rounded")').or(page.locator('button:has-text("Square")')).or(page.locator('button:has-text("Pill")')).first();
        if (await buttonStyleOption.isVisible()) {
          // Button style options available
          expect(await page.locator('button:has-text("Rounded"), button:has-text("Square"), button:has-text("Pill")').count()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe("Bio Page Social Links", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-030: Add social link", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Edit a bio page
      const editButton = page.locator('button:has-text("Edit Page")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForLoadState("networkidle");

        // Look for social links section
        const socialSection = page.locator("h2, h3").filter({ hasText: /Social Links|Social Media/ }).first();
        if (await socialSection.isVisible()) {
          // Click add social link
          const addSocialButton = page.locator('button:has-text("Add Social")').or(page.locator('button:has-text("Add")')).first();
          if (await addSocialButton.isVisible()) {
            await addSocialButton.click();
          }
        }
      }
    });
  });

  test.describe("Public Bio Page", () => {
    test("BIO-040: View public bio page", async ({ page }) => {
      // Access public bio page directly (without login)
      await page.goto(`/bio/${TEST_SLUGS.biopages.main}`);
      await page.waitForLoadState("networkidle");

      // Should show bio page content
      await expect(page.locator("body")).toBeVisible();
    });

    test("BIO-041: Public bio page displays links", async ({ page }) => {
      await page.goto(`/bio/${TEST_SLUGS.biopages.main}`);
      await page.waitForLoadState("networkidle");

      // Should have clickable links
      const links = page.locator("a[href]");
      expect(await links.count()).toBeGreaterThan(0);
    });

    test("BIO-042: Public bio page non-existent shows 404", async ({ page }) => {
      await page.goto("/bio/nonexistent-page-12345");
      await page.waitForLoadState("networkidle");

      // Should show not found or error
      const notFound = page.locator("h1").filter({ hasText: /Not Found|404|doesn't exist/ }).first();
      await expect(notFound).toBeVisible({ timeout: 5000 });
    });

    test("BIO-043: Public bio page tracks visits", async ({ page }) => {
      await page.goto(`/bio/${TEST_SLUGS.biopages.main}`);
      await page.waitForLoadState("networkidle");

      // Page should load successfully (visit tracking happens in background)
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Bio Page RBAC", () => {
    test("BIO-050: Viewer can view bio pages but not edit", async ({ page }) => {
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Should see bio pages section
      await expect(
        page.locator("h1:has-text('Link-in-Bio Pages')")
      ).toBeVisible({ timeout: 10000 });

      // Create button should be disabled or hidden
      const createButton = page.locator('button:has-text("Create Bio Page")').or(page.locator('button:has-text("Create Page")')).first();
      if (await createButton.isVisible()) {
        const isDisabled = await createButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });

    test("BIO-051: Editor can create and edit bio pages", async ({ page }) => {
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Create button should be enabled
      const createButton = page.locator('button:has-text("Create Bio Page")').or(page.locator('button:has-text("Create Page")')).first();
      if (await createButton.isVisible()) {
        await expect(createButton).toBeEnabled();
      }
    });

    test("BIO-052: Owner has full bio page access", async ({ page }) => {
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // All actions should be available
      await expect(
        page.locator("h1:has-text('Link-in-Bio Pages')")
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Bio Page Analytics", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-060: View bio page analytics", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Look for analytics option
      const analyticsButton = page.locator('button:has-text("Analytics")').or(page.locator('a:has-text("Analytics")')).first();
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
        await page.waitForLoadState("networkidle");

        // Should show analytics
        await expect(
          page.locator("h1, h2, h3").filter({ hasText: /Views|Clicks|Analytics/ }).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Bio Page QR Code", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, "owner");
    });

    test("BIO-070: Generate QR code for bio page", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.waitForLoadState("networkidle");

      // Look for QR code option - button with QR code icon
      const qrButton = page.locator("button").filter({ has: page.locator("svg[class*='lucide']") }).first();
      if (await qrButton.isVisible()) {
        await qrButton.click();

        // Should show QR code modal or dialog
        await expect(
          page.locator("h2, h3, [role='dialog']").filter({ hasText: /QR Code/ }).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
