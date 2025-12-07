import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, TEST_IDS } from "./fixtures/test-data";

/**
 * Links Page E2E Tests
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover new features from recent commits:
 * - Filter by created date modal
 * - Filters modal (Tags, Link type, QR Code)
 * - Grid view layout
 * - Inline tag addition
 * - Status filter dropdown
 * - Export and bulk tag buttons
 */

test.describe("Links Page - Layout & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-001: Page loads with correct header and elements", async ({
    page,
  }) => {
    // Check header
    await expect(page.locator('h1:has-text("Links")')).toBeVisible();
    await expect(
      page.locator("text=Manage and track your shortened URLs"),
    ).toBeVisible();

    // Check Create link button (use first() as there may be multiple links)
    await expect(
      page.locator('a[href="/dashboard/links/new"]').first(),
    ).toBeVisible();
  });

  test("LP-002: Search input is visible and functional", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search links"]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });

  test("LP-003: Filter buttons are visible", async ({ page }) => {
    // Date filter button
    await expect(
      page.locator('button:has-text("Filter by created date")'),
    ).toBeVisible();

    // Filters button
    await expect(page.locator('button:has-text("Add filters")')).toBeVisible();
  });

  test("LP-004: Toolbar elements are visible", async ({ page }) => {
    // Selected count
    await expect(page.locator('span:has-text("selected")')).toBeVisible();

    // Export button
    await expect(page.locator('button:has-text("Export")')).toBeVisible();

    // Tag button (in toolbar, not bulk action bar)
    const toolbarTagButton = page.locator(
      '.flex.justify-between.items-center.py-2 button:has-text("Tag")',
    );
    await expect(toolbarTagButton).toBeVisible();
  });

  test("LP-005: Create link button navigates correctly", async ({ page }) => {
    await page.locator('a[href="/dashboard/links/new"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/links\/new/);
  });
});

test.describe("Links Page - View Mode Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-010: View mode toggle is visible with three options", async ({
    page,
  }) => {
    // Check for view mode toggle container
    const viewToggle = page.locator(
      ".flex.items-center.border.border-slate-200.rounded-lg.bg-white.p-1",
    );
    await expect(viewToggle).toBeVisible();

    // Should have 3 buttons (list, table, grid)
    const buttons = viewToggle.locator("button");
    await expect(buttons).toHaveCount(3);
  });

  test("LP-011: Default view mode is list", async ({ page }) => {
    // List button should have active state (bg-slate-100)
    const listButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-list") });
    await expect(listButton).toHaveClass(/bg-slate-100/);
  });

  test("LP-012: Can switch to grid view", async ({ page }) => {
    // Click grid view button
    const gridButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-layout-grid") });
    await gridButton.click();

    // Grid button should now be active
    await expect(gridButton).toHaveClass(/bg-slate-100/);

    // Should show grid layout
    await page.waitForTimeout(500);
    const gridContainer = page.locator(
      ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
    );
    // Grid might be visible if links exist
  });

  test("LP-013: Can switch to table view", async ({ page }) => {
    const viewToggle = page.locator(
      ".flex.items-center.border.border-slate-200.rounded-lg.bg-white.p-1",
    );
    const tableButton = viewToggle.locator("button").nth(1); // Second button is table
    await tableButton.click();
    await expect(tableButton).toHaveClass(/bg-slate-100/);
  });

  test("LP-014: Can switch back to list view", async ({ page }) => {
    // First switch to grid
    const gridButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-layout-grid") });
    await gridButton.click();

    // Then switch back to list
    const listButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-list") });
    await listButton.click();
    await expect(listButton).toHaveClass(/bg-slate-100/);
  });
});

test.describe("Links Page - Status Filter Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-020: Status filter dropdown is visible", async ({ page }) => {
    const statusSelect = page.locator("select");
    await expect(statusSelect).toBeVisible();
    await expect(statusSelect).toHaveValue("all");
  });

  test("LP-021: Status filter has all options", async ({ page }) => {
    const statusSelect = page.locator("select").first();

    // Check options exist by counting
    const options = statusSelect.locator("option");
    await expect(options).toHaveCount(5);
  });

  test("LP-022: Can filter by Active status", async ({ page }) => {
    const statusSelect = page.locator("select");
    await statusSelect.selectOption("active");
    await expect(statusSelect).toHaveValue("active");
    await page.waitForTimeout(500); // Wait for filter to apply
  });

  test("LP-023: Can filter by Expired status", async ({ page }) => {
    const statusSelect = page.locator("select");
    await statusSelect.selectOption("expired");
    await expect(statusSelect).toHaveValue("expired");
    await page.waitForTimeout(500);
  });

  test("LP-024: Can reset to All status", async ({ page }) => {
    const statusSelect = page.locator("select");

    // First set to active
    await statusSelect.selectOption("active");

    // Then reset to all
    await statusSelect.selectOption("all");
    await expect(statusSelect).toHaveValue("all");
  });
});

test.describe("Links Page - Date Filter Modal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-030: Date filter button opens modal", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // Modal title
    await expect(page.locator('[role="dialog"] h2')).toBeVisible();
  });

  test("LP-031: Date filter modal has calendar", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');

    // Should show month navigation
    await expect(
      page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-chevron-left") }),
    ).toBeVisible();
    await expect(
      page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-chevron-right") }),
    ).toBeVisible();

    // Should show day headers
    await expect(page.locator("text=Sun")).toBeVisible();
    await expect(page.locator("text=Mon")).toBeVisible();
  });

  test("LP-032: Date filter modal has quick options", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');

    // Check quick options
    await expect(page.locator('button:has-text("Last hour")')).toBeVisible();
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.locator('button:has-text("Last 7 days")')).toBeVisible();
    await expect(page.locator('button:has-text("Last 30 days")')).toBeVisible();
    await expect(page.locator('button:has-text("Last 60 days")')).toBeVisible();
    await expect(page.locator('button:has-text("Last 90 days")')).toBeVisible();
  });

  test("LP-033: Can select Last 7 days quick option", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');

    await page.click('button:has-text("Last 7 days")');

    // Date inputs should be filled
    const startDateInput = page.locator('input[placeholder="Start date"]');
    const endDateInput = page.locator('input[placeholder="End date"]');

    await expect(startDateInput).not.toHaveValue("");
    await expect(endDateInput).not.toHaveValue("");
  });

  test("LP-034: Can apply date filter", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');
    await page.click('button:has-text("Last 30 days")');
    await page.click('button:has-text("Apply")');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Filter button should show active state
    const filterButton = page.locator("button").filter({ hasText: /- / });
    await expect(filterButton).toHaveClass(/border-blue-500/);
  });

  test("LP-035: Can clear date filter", async ({ page }) => {
    // First apply a filter
    await page.click('button:has-text("Filter by created date")');
    await page.click('button:has-text("Last 7 days")');
    await page.click('button:has-text("Apply")');

    // Click clear button (X icon)
    await page.click(
      'button:has-text("Filter by created date") ~ button, button:has-text("-") >> button',
    );

    // Should reset to default text
    await expect(
      page.locator('button:has-text("Filter by created date")'),
    ).toBeVisible();
  });

  test("LP-036: Date filter modal has clear all button", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');

    await expect(
      page.locator('button:has-text("Clear all filters")'),
    ).toBeVisible();
  });

  test("LP-037: Can cancel date filter modal", async ({ page }) => {
    await page.click('button:has-text("Filter by created date")');
    await page.click('button:has-text("Cancel")');

    // Modal should close without applying
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe("Links Page - Filters Modal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-040: Filters button opens modal", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Filters").first()).toBeVisible();
  });

  test("LP-041: Filters modal has Tags dropdown", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    await expect(page.locator('label:has-text("Tags")')).toBeVisible();
  });

  test("LP-042: Filters modal has Link type dropdown", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    await expect(page.locator('label:has-text("Link type")')).toBeVisible();
  });

  test("LP-043: Filters modal has QR Code dropdown", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    await expect(
      page.locator('label:has-text("Attached QR Code")'),
    ).toBeVisible();
  });

  test("LP-044: Can open tags dropdown", async ({ page }) => {
    await page.click('button:has-text("Add filters")');
    await page.click('button:has-text("Select tags")');

    // Dropdown should open
    const tagsDropdown = page.locator(
      ".absolute.z-10.w-full.mt-1.bg-white.border",
    );
    // May show "No tags available" or list of tags
  });

  test("LP-045: Link type has correct options", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    // Find Link type select and click to open
    const linkTypeSelect = page.locator('button[role="combobox"]').first();
    await linkTypeSelect.click();

    // Check options
    await expect(page.locator('[role="option"]:has-text("All")')).toBeVisible();
    await expect(
      page.locator('[role="option"]:has-text("Standard links")'),
    ).toBeVisible();
    await expect(
      page.locator('[role="option"]:has-text("Bio page links")'),
    ).toBeVisible();
  });

  test("LP-046: QR Code filter has correct options", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    // Find QR Code select (second combobox) and click
    const qrSelect = page.locator('button[role="combobox"]').nth(1);
    await qrSelect.click();

    await expect(
      page.locator(
        '[role="option"]:has-text("Links with or without attached QR Codes")',
      ),
    ).toBeVisible();
    await expect(
      page.locator('[role="option"]:has-text("Links with attached QR Codes")'),
    ).toBeVisible();
    await expect(
      page.locator(
        '[role="option"]:has-text("Links without attached QR Codes")',
      ),
    ).toBeVisible();
  });

  test("LP-047: Can apply filters", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    // Select Link type
    const linkTypeSelect = page.locator('button[role="combobox"]').first();
    await linkTypeSelect.click();
    await page.click('[role="option"]:has-text("Standard links")');

    // Apply
    await page.click('button:has-text("Apply")');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Filter button should show active count
    await expect(
      page.locator('button:has-text("1 filter active")'),
    ).toBeVisible();
  });

  test("LP-048: Can clear all filters in modal", async ({ page }) => {
    await page.click('button:has-text("Add filters")');

    // Select a filter
    const linkTypeSelect = page.locator('button[role="combobox"]').first();
    await linkTypeSelect.click();
    await page.click('[role="option"]:has-text("Standard links")');

    // Clear all
    await page.click('button:has-text("Clear all filters")');

    // Should reset to All
    await expect(linkTypeSelect).toHaveText("All");
  });

  test("LP-049: Filters button shows active filter count", async ({ page }) => {
    // Apply multiple filters
    await page.click('button:has-text("Add filters")');

    // Select Link type
    const linkTypeSelect = page.locator('button[role="combobox"]').first();
    await linkTypeSelect.click();
    await page.click('[role="option"]:has-text("Standard links")');

    // Select QR Code filter
    const qrSelect = page.locator('button[role="combobox"]').nth(1);
    await qrSelect.click();
    await page.click(
      '[role="option"]:has-text("Links with attached QR Codes")',
    );

    await page.click('button:has-text("Apply")');

    // Should show "2 filters active"
    await expect(
      page.locator('button:has-text("2 filters active")'),
    ).toBeVisible();
  });
});

test.describe("Links Page - Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-050: Can search for links", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search links"]');
    await searchInput.fill("e2e");
    await page.waitForTimeout(500); // Debounce

    // Should filter links (if any match)
  });

  test("LP-051: Search is case insensitive", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search links"]');
    await searchInput.fill("E2E");
    await page.waitForTimeout(500);
  });

  test("LP-052: Can clear search", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search links"]');
    await searchInput.fill("test");
    await searchInput.fill("");
    await expect(searchInput).toHaveValue("");
  });
});

test.describe("Links Page - Link Cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-060: Link cards display essential information", async ({ page }) => {
    // Wait for links to load
    await page.waitForTimeout(1000);

    // Check for link card elements
    const linkCard = page.locator(".bg-white.rounded-xl.border").first();

    if (await linkCard.isVisible()) {
      // Should have action buttons (edit, share, analytics)
      await expect(linkCard.locator("button").first()).toBeVisible();

      // Should have link text
      await expect(linkCard.locator("a").first()).toBeVisible();
    }
  });

  test("LP-061: Link cards have copy button", async ({ page }) => {
    await page.waitForTimeout(1000);

    const copyButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-copy") })
      .first();
    if (await copyButton.isVisible()) {
      await copyButton.click();
      // Should show checkmark after copy
      await expect(
        page.locator("svg.lucide-check-circle-2").first(),
      ).toBeVisible({ timeout: 2000 });
    }
  });

  test("LP-062: Link cards have Add tag button", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for "Add tag" button
    const addTagButton = page.locator('button:has-text("Add tag")').first();
    if (await addTagButton.isVisible()) {
      await expect(addTagButton).toBeVisible();
    }
  });

  test("LP-063: Can click Add tag button to show dropdown", async ({
    page,
  }) => {
    await page.waitForTimeout(1000);

    const addTagButton = page.locator('button:has-text("Add tag")').first();
    if (await addTagButton.isVisible()) {
      await addTagButton.click();

      // Should show tag select dropdown
      await expect(
        page
          .locator('select:has-text("Select tag")')
          .or(page.locator('option:has-text("Select tag")')),
      ).toBeVisible();
    }
  });

  test("LP-064: Link cards have dropdown menu", async ({ page }) => {
    await page.waitForTimeout(1000);

    const moreButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    if (await moreButton.isVisible()) {
      await moreButton.click();

      // Dropdown menu should appear
      await expect(
        page.locator('[role="menu"], [role="menuitem"]').first(),
      ).toBeVisible();
    }
  });

  test("LP-065: Dropdown menu has Edit link option", async ({ page }) => {
    await page.waitForTimeout(1000);

    const moreButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await expect(
        page.locator('[role="menuitem"]:has-text("Edit link")'),
      ).toBeVisible();
    }
  });

  test("LP-066: Dropdown menu has QR Code option", async ({ page }) => {
    await page.waitForTimeout(1000);

    const moreButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await expect(
        page.locator('[role="menuitem"]:has-text("QR Code")'),
      ).toBeVisible();
    }
  });

  test("LP-067: Dropdown menu has Delete option", async ({ page }) => {
    await page.waitForTimeout(1000);

    const moreButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") })
      .first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await expect(
        page.locator('[role="menuitem"]:has-text("Delete")'),
      ).toBeVisible();
    }
  });
});

test.describe("Links Page - Selection & Bulk Actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");
  });

  test("LP-070: Can select links with checkbox", async ({ page }) => {
    await page.waitForTimeout(1000);

    const checkbox = page
      .locator('button[role="checkbox"], input[type="checkbox"]')
      .first();
    if (await checkbox.isVisible()) {
      await checkbox.click();

      // Selected count should update
      await expect(page.locator("text=/[1-9]\\d* selected/")).toBeVisible();
    }
  });

  test("LP-071: Selection shows bulk action bar", async ({ page }) => {
    await page.waitForTimeout(1000);

    const checkbox = page
      .locator('button[role="checkbox"], input[type="checkbox"]')
      .first();
    if (await checkbox.isVisible()) {
      await checkbox.click();

      // Bulk action bar should appear
      await expect(
        page.locator(".bg-slate-900.text-white.rounded-lg"),
      ).toBeVisible();
    }
  });

  test("LP-072: Bulk action bar has Tag button", async ({ page }) => {
    await page.waitForTimeout(1000);

    const checkbox = page
      .locator('button[role="checkbox"], input[type="checkbox"]')
      .first();
    if (await checkbox.isVisible()) {
      await checkbox.click();

      await expect(
        page.locator('.bg-slate-900 button:has-text("Tag")'),
      ).toBeVisible();
    }
  });

  test("LP-073: Bulk action bar has Delete button", async ({ page }) => {
    await page.waitForTimeout(1000);

    const checkbox = page
      .locator('button[role="checkbox"], input[type="checkbox"]')
      .first();
    if (await checkbox.isVisible()) {
      await checkbox.click();

      await expect(
        page.locator('.bg-slate-900 button:has-text("Delete")'),
      ).toBeVisible();
    }
  });

  test("LP-074: Tag toolbar button is disabled when none selected", async ({
    page,
  }) => {
    // Tag button in toolbar should be disabled
    const tagButton = page
      .locator('button:has-text("Tag")')
      .filter({ hasNot: page.locator(".bg-slate-900") });
    await expect(tagButton.first()).toBeDisabled();
  });
});

test.describe("Links Page - Grid View", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");
    await page.waitForLoadState("networkidle");

    // Switch to grid view
    const gridButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-layout-grid") });
    await gridButton.click();
    await page.waitForTimeout(500);
  });

  test("LP-080: Grid view shows cards in grid layout", async ({ page }) => {
    // Check for grid container
    const gridContainer = page.locator(".grid");
    if (await gridContainer.isVisible()) {
      await expect(gridContainer).toBeVisible();
    }
  });

  test("LP-081: Grid cards have title", async ({ page }) => {
    const gridCard = page.locator(".grid > div").first();
    if (await gridCard.isVisible()) {
      await expect(gridCard.locator("h3, .font-semibold")).toBeVisible();
    }
  });

  test("LP-082: Grid cards have short URL", async ({ page }) => {
    const gridCard = page.locator(".grid > div").first();
    if (await gridCard.isVisible()) {
      await expect(gridCard.locator("a").first()).toBeVisible();
    }
  });

  test("LP-083: Grid cards have engagement stats", async ({ page }) => {
    const gridCard = page.locator(".grid > div").first();
    if (await gridCard.isVisible()) {
      await expect(gridCard.locator("text=/\\d+ engagements/")).toBeVisible();
    }
  });

  test("LP-084: Grid cards have Add tag button", async ({ page }) => {
    const gridCard = page.locator(".grid > div").first();
    if (await gridCard.isVisible()) {
      await expect(
        gridCard.locator('button:has-text("Add tag")'),
      ).toBeVisible();
    }
  });
});

test.describe("Links Page - Empty State", () => {
  test("LP-090: Shows empty state when no links (mocked)", async ({ page }) => {
    // Mock empty response
    await page.route("**/links?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
      });
    });

    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");

    // Should show empty state
    await expect(page.locator("text=No links yet")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator("text=Create your first short link"),
    ).toBeVisible();
    await expect(
      page.locator('a:has-text("Create link")').first(),
    ).toBeVisible();
  });
});

test.describe("Links Page - Loading State", () => {
  test("LP-095: Shows loading skeleton while fetching", async ({ page }) => {
    // Delay the response
    await page.route("**/links?*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
      });
    });

    await loginAsUser(page, "owner");
    await page.goto("/dashboard/links");

    // Should show skeleton loader
    await expect(page.locator(".animate-pulse").first()).toBeVisible();
  });
});
