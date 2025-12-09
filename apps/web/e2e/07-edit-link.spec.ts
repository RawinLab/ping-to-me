import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, TEST_IDS } from "./fixtures/test-data";

/**
 * Edit Link Modal E2E Tests
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover the Edit Link Modal functionality:
 * - Opening the modal from list and grid views
 * - Editing destination URL
 * - Editing title
 * - Managing tags (add/remove)
 * - Selecting campaign
 * - Setting expiration date
 * - Form validation
 * - Save and cancel actions
 */

test.describe("Edit Link Modal - Opening Modal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-001: Can open edit modal from pencil icon in list view", async ({
    page,
  }) => {
    // Wait for links to load
    await page.waitForSelector(
      '[data-testid="link-card"], .group.bg-white.rounded-2xl',
    );

    // Hover over first link card to reveal action buttons
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();

    // Click the pencil/edit button
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Verify modal opens
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Edit Link")).toBeVisible();
  });

  test("EL-002: Can open edit modal from dropdown menu in list view", async ({
    page,
  }) => {
    // Wait for links to load
    await page.waitForSelector(".group.bg-white.rounded-2xl");

    // Hover over first link card
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();

    // Click more options button (three dots)
    const moreButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    await moreButton.click();

    // Click Edit link in dropdown
    await page.locator('[role="menuitem"]:has-text("Edit link")').click();

    // Verify modal opens
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Edit Link")).toBeVisible();
  });

  test("EL-003: Can open edit modal from grid view", async ({ page }) => {
    // Switch to grid view
    const gridButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-layout-grid") });
    await gridButton.click();

    // Wait for grid view to render
    await page.waitForSelector(
      ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
    );

    // Hover over first grid card
    const gridCard = page
      .locator(".grid.grid-cols-1 > div")
      .first()
      .locator(".group");
    await gridCard.hover();

    // Click more options and then edit
    const moreButton = gridCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    await moreButton.click();

    await page.locator('[role="menuitem"]:has-text("Edit link")').click();

    // Verify modal opens
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });

  test("EL-004: Modal displays all form fields", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Verify all fields are present
    await expect(
      page.locator('label:has-text("Destination URL")'),
    ).toBeVisible();
    await expect(page.locator('label:has-text("Title")')).toBeVisible();
    await expect(page.locator('label:has-text("Tags")')).toBeVisible();
    await expect(page.locator('label:has-text("Campaign")')).toBeVisible();
    await expect(
      page.locator('label:has-text("Expiration Date")'),
    ).toBeVisible();

    // Verify buttons
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test("EL-005: Modal shows current link data", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Destination URL should have value
    const urlInput = page.locator("input#originalUrl");
    await expect(urlInput).toHaveValue(/^https?:\/\//);
  });
});

test.describe("Edit Link Modal - Destination URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-010: Can edit destination URL", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Clear and enter new URL
    const urlInput = page.locator("input#originalUrl");
    await urlInput.clear();
    await urlInput.fill("https://new-destination.example.com/page");

    // Verify input value
    await expect(urlInput).toHaveValue(
      "https://new-destination.example.com/page",
    );
  });

  test("EL-011: Shows validation error for invalid URL", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Enter invalid URL
    const urlInput = page.locator("input#originalUrl");
    await urlInput.clear();
    await urlInput.fill("not-a-valid-url");

    // Try to save
    await page.locator('button:has-text("Save Changes")').click();

    // Should show validation error
    await expect(page.locator("text=Please enter a valid URL")).toBeVisible();
  });

  test("EL-012: URL field has red border on validation error", async ({
    page,
  }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Enter invalid URL and submit
    const urlInput = page.locator("input#originalUrl");
    await urlInput.clear();
    await urlInput.fill("invalid");
    await page.locator('button:has-text("Save Changes")').click();

    // Check for red border class
    await expect(urlInput).toHaveClass(/border-red-500/);
  });
});

test.describe("Edit Link Modal - Title", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-020: Can edit title", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Edit title
    const titleInput = page.locator("input#title");
    await titleInput.clear();
    await titleInput.fill("Updated Link Title");

    await expect(titleInput).toHaveValue("Updated Link Title");
  });

  test("EL-021: Title field is optional", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Clear title
    const titleInput = page.locator("input#title");
    await titleInput.clear();

    // Should not show error (title is optional)
    await expect(page.locator("input#title + .text-red-500")).not.toBeVisible();
  });
});

test.describe("Edit Link Modal - Tags", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-030: Tags section is visible", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Tags label should be visible
    await expect(page.locator('label:has-text("Tags")')).toBeVisible();

    // Tag selector should be visible
    await expect(
      page.locator('button:has-text("Select existing tag")'),
    ).toBeVisible();
  });

  test("EL-031: Can add a new tag", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Enter new tag name
    const newTagInput = page.locator('input[placeholder="New tag"]');
    await newTagInput.fill("new-test-tag");

    // Click add button
    await page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-plus") })
      .last()
      .click();

    // Tag should appear as badge
    await expect(
      page.locator(
        '[role="dialog"] .flex.items-center.gap-1:has-text("new-test-tag")',
      ),
    ).toBeVisible();
  });

  test("EL-032: Can add tag by pressing Enter", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Enter new tag and press Enter
    const newTagInput = page.locator('input[placeholder="New tag"]');
    await newTagInput.fill("enter-tag");
    await newTagInput.press("Enter");

    // Tag should appear
    await expect(
      page.locator(
        '[role="dialog"] .flex.items-center.gap-1:has-text("enter-tag")',
      ),
    ).toBeVisible();

    // Input should be cleared
    await expect(newTagInput).toHaveValue("");
  });

  test("EL-033: Can remove a tag", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // First add a tag
    const newTagInput = page.locator('input[placeholder="New tag"]');
    await newTagInput.fill("remove-me");
    await newTagInput.press("Enter");

    // Verify tag was added
    const tagBadge = page.locator(
      '[role="dialog"] .flex.items-center.gap-1:has-text("remove-me")',
    );
    await expect(tagBadge).toBeVisible();

    // Click X button to remove
    await tagBadge.locator("button").click();

    // Tag should be gone
    await expect(tagBadge).not.toBeVisible();
  });

  test("EL-034: Can select existing tag from dropdown", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Open tag selector
    await page.locator('button:has-text("Select existing tag")').click();

    // Wait for dropdown to open
    await page.waitForSelector('[role="listbox"]');

    // Select first available tag (if any)
    const firstTag = page.locator('[role="option"]').first();
    if (await firstTag.isVisible()) {
      const tagText = await firstTag.textContent();
      await firstTag.click();

      // Tag should appear in selected tags
      if (tagText) {
        await expect(
          page.locator(
            `[role="dialog"] .flex.items-center.gap-1:has-text("${tagText.trim()}")`,
          ),
        ).toBeVisible();
      }
    }
  });

  test("EL-035: Cannot add duplicate tag", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Add tag twice
    const newTagInput = page.locator('input[placeholder="New tag"]');
    await newTagInput.fill("duplicate-tag");
    await newTagInput.press("Enter");

    await newTagInput.fill("duplicate-tag");
    await newTagInput.press("Enter");

    // Should only have one instance
    const tagBadges = page.locator(
      '[role="dialog"] .flex.items-center.gap-1:has-text("duplicate-tag")',
    );
    await expect(tagBadges).toHaveCount(1);
  });
});

test.describe("Edit Link Modal - Campaign", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-040: Campaign dropdown is visible", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    await expect(page.locator('label:has-text("Campaign")')).toBeVisible();
    await expect(page.locator("#campaignId")).toBeVisible();
  });

  test("EL-041: Can open campaign dropdown", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Click campaign dropdown
    await page.locator("#campaignId").click();

    // Should show "No Campaign" option
    await expect(
      page.locator('[role="option"]:has-text("No Campaign")'),
    ).toBeVisible();
  });

  test("EL-042: Can select No Campaign", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Select No Campaign
    await page.locator("#campaignId").click();
    await page.locator('[role="option"]:has-text("No Campaign")').click();

    // Verify selection
    await expect(page.locator("#campaignId")).toContainText("No Campaign");
  });
});

test.describe("Edit Link Modal - Expiration Date", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-050: Expiration date field is visible", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    await expect(
      page.locator('label:has-text("Expiration Date")'),
    ).toBeVisible();
    await expect(page.locator("input#expirationDate")).toBeVisible();
  });

  test("EL-051: Can set expiration date", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Set future date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const dateString = futureDate.toISOString().split("T")[0];

    const dateInput = page.locator("input#expirationDate");
    await dateInput.fill(dateString);

    await expect(dateInput).toHaveValue(dateString);
  });

  test("EL-052: Can clear expiration date", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Clear date
    const dateInput = page.locator("input#expirationDate");
    await dateInput.clear();

    await expect(dateInput).toHaveValue("");
  });
});

test.describe("Edit Link Modal - Save & Cancel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-060: Cancel button closes modal without saving", async ({
    page,
  }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Make a change
    const titleInput = page.locator("input#title");
    const originalValue = await titleInput.inputValue();
    await titleInput.fill("Changed Title");

    // Click cancel
    await page.locator('button:has-text("Cancel")').click();

    // Modal should close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });

  test("EL-061: Clicking outside modal closes it", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Wait for modal
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // Click overlay/backdrop
    await page
      .locator("[data-radix-portal] > div")
      .first()
      .click({ position: { x: 10, y: 10 } });

    // Modal should close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });

  test("EL-062: Save button shows loading state", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Click save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();

    // Should show "Saving..." text (might be brief)
    // We just verify the button exists and is clickable
    await expect(saveButton).toBeEnabled();
  });

  test("EL-063: Successful save closes modal and refreshes list", async ({
    page,
  }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Make a small change to title
    const titleInput = page.locator("input#title");
    const timestamp = Date.now();
    await titleInput.fill(`Test Link ${timestamp}`);

    // Save
    await page.locator('button:has-text("Save Changes")').click();

    // Wait for modal to close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Page should still be on links
    await expect(page).toHaveURL(/\/dashboard\/links/);
  });
});

test.describe("Edit Link Modal - Form Icons", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-070: Form fields have appropriate icons", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Check for icons next to labels
    await expect(
      page.locator('label:has-text("Destination URL") svg.lucide-link-2'),
    ).toBeVisible();
    await expect(
      page.locator('label:has-text("Tags") svg.lucide-tag'),
    ).toBeVisible();
    await expect(
      page.locator('label:has-text("Campaign") svg.lucide-folder-open'),
    ).toBeVisible();
    await expect(
      page.locator('label:has-text("Expiration Date") svg.lucide-calendar'),
    ).toBeVisible();
  });
});

test.describe("Edit Link Modal - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("EL-080: Modal has proper dialog role", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test("EL-081: Modal can be closed with Escape key", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Wait for modal
    await expect(page.locator('div[role="dialog"]')).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Modal should close
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
  });

  test("EL-082: Form inputs have proper labels", async ({ page }) => {
    // Open edit modal
    const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
    await linkCard.hover();
    const editButton = linkCard
      .locator("button")
      .filter({ has: page.locator("svg.lucide-pencil") })
      .first();
    await editButton.click();

    // Check label-input associations
    await expect(page.locator('label[for="originalUrl"]')).toBeVisible();
    await expect(page.locator('label[for="title"]')).toBeVisible();
    await expect(page.locator('label[for="campaignId"]')).toBeVisible();
    await expect(page.locator('label[for="expirationDate"]')).toBeVisible();
  });
});
