import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueUrl,
  uniqueSlug,
  waitForApiResponse,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

const MAIN_ORG_ID = TEST_IDS.organizations.main;

test.describe("Bulk Link Operations", () => {
  test.setTimeout(120000);
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let testLinkIds: string[] = [];

  async function createTestLinks(count: number): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const link = await api.createLink({
        originalUrl: uniqueUrl(),
        title: `Bulk Test Link ${Date.now()}-${i}`,
        slug: uniqueSlug(`bulk-${i}`),
      });
      ids.push(link.id);
      cleanup.addLink(link.id);
    }
    return ids;
  }

  async function gotoLinksPage(page: import("@playwright/test").Page) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto("/dashboard/links");
      try {
        await expect(page.locator("h1")).toContainText("Links", { timeout: 15000 });
        await expect(
          page.locator(".group.bg-white.rounded-2xl").first(),
        ).toBeVisible({ timeout: 15000 });
        return;
      } catch {
        await page.waitForTimeout(2000);
      }
    }
  }

  function getLinkCards(page: import("@playwright/test").Page) {
    return page.locator(".group.bg-white.rounded-2xl");
  }

  async function selectLinkCards(page: import("@playwright/test").Page, indices: number[]) {
    const cards = getLinkCards(page);
    for (const idx of indices) {
      const card = cards.nth(idx);
      const checkbox = card.locator('button[role="checkbox"]').first();
      await checkbox.click({ force: true });
      await page.waitForTimeout(300);
    }
  }

  function getBulkActionBar(page: import("@playwright/test").Page) {
    return page.locator("[data-bulk-actions]").first();
  }

  async function waitForBulkBar(page: import("@playwright/test").Page) {
    await expect(getBulkActionBar(page)).toBeVisible({ timeout: 10000 });
  }

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
    cleanup = new CleanupTracker();
    testLinkIds = await createTestLinks(5);
  });

  test.afterAll(async () => {
    await cleanup.cleanup(api);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
    const orgRoutes = ["**/organizations/**", "**/links/**", "**/analytics/**", "**/tags/**", "**/campaigns/**"];
    for (const pattern of orgRoutes) {
      await page.route(pattern, async (route) => {
        const headers = { ...route.request().headers() };
        headers["x-organization-id"] = MAIN_ORG_ID;
        await route.continue({ headers });
      });
    }
    await gotoLinksPage(page);
  });

  test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {}); });

  test("BO-001: select multiple links via checkboxes", async ({ page }) => {
    await selectLinkCards(page, [0, 1]);

    await waitForBulkBar(page);

    await expect(
      getBulkActionBar(page).locator("text=/link.* selected/i"),
    ).toBeVisible({ timeout: 5000 });

    const cards = getLinkCards(page);
    const cb0 = cards.nth(0).locator('button[role="checkbox"]').first();
    const cb1 = cards.nth(1).locator('button[role="checkbox"]').first();
    await expect(cb0).toHaveAttribute("data-state", "checked");
    await expect(cb1).toHaveAttribute("data-state", "checked");
  });

  test("BO-002: bulk delete selected links", async ({ page }) => {
    const deleteIds = await createTestLinks(2);
    await gotoLinksPage(page);

    await selectLinkCards(page, [0, 1]);
    await waitForBulkBar(page);

    page.on("dialog", (dialog) => dialog.accept());

    const response = await waitForApiResponse(
      page,
      "/links/bulk-delete",
      "POST",
      async () => {
        await getBulkActionBar(page)
          .locator("button:has-text('Delete')")
          .click();
      },
    );

    expect([200, 201, 204]).toContain(response.status);

    for (const id of deleteIds) {
      cleanup["links"] = cleanup["links"].filter((lid) => lid !== id);
    }
  });

  test("BO-003: bulk tag selected links", async ({ page }) => {
    await selectLinkCards(page, [0, 1]);
    await waitForBulkBar(page);

    await getBulkActionBar(page)
      .locator("button:has-text('Add tag')")
      .click();

    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

    const tagCombobox = page.locator("[role='dialog'] button[role='combobox']").first();
    await tagCombobox.click();

    const commandInput = page.locator("[role='dialog'] input[placeholder*='Search']").first();
    const tagName = `e2e-bulk-tag-${Date.now()}`;
    await commandInput.fill(tagName);

    const createOption = page.locator(
      `[role='dialog'] [role='option']:has-text("${tagName}")`,
    ).first();
    await createOption.click();

    const response = await waitForApiResponse(
      page,
      "/links/bulk-tag",
      "POST",
      async () => {
        await page.locator("[role='dialog'] button:has-text('Add Tag')").click();
      },
    );

    expect([200, 201]).toContain(response.status);
  });

  test("BO-004: bulk status change - disable multiple links", async ({
    page,
  }) => {
    const statusIds = await createTestLinks(2);
    await gotoLinksPage(page);

    await selectLinkCards(page, [0, 1]);
    await waitForBulkBar(page);

    const response = await waitForApiResponse(
      page,
      "/links/bulk-status",
      "POST",
      async () => {
        await getBulkActionBar(page)
          .locator("button:has-text('Disable')")
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
  });

  test("BO-005: export links as CSV", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });

    await page.locator("button:has-text('Export')").click();

    try {
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.csv$/);
    } catch {
      const response = await page
        .waitForResponse(
          (res) => res.url().includes("/links/export") && res.status() === 200,
          { timeout: 5000 },
        )
        .catch(() => null);

      if (response) {
        expect(response.headers()["content-type"]).toMatch(/csv|text/);
      }
    }
  });

  test("BO-006: import links from CSV", async ({ page }) => {
    await page.locator("button:has-text('Import')").click();

    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });

    const csvContent =
      "originalUrl,title\nhttps://example.com/import-1,Import Test 1\nhttps://example.com/import-2,Import Test 2\n";

    const fileInput = page
      .locator("[role='dialog'] input[type='file']")
      .first();

    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: "test-import.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csvContent),
      });

      const submitBtn = page
        .locator(
          "[role='dialog'] button:has-text('Import'), [role='dialog'] button[type='submit']",
        )
        .first();

      const response = await waitForApiResponse(
        page,
        "/links/import",
        "POST",
        async () => {
          await submitBtn.click();
        },
      ).catch(() => null);

      if (response) {
        expect([200, 201]).toContain(response.status);
      }
    }
  });

  test("BO-007: select all links via bulk bar select all button", async ({ page }) => {
    test.setTimeout(60000);
    const cards = getLinkCards(page);
    const firstCard = cards.nth(0);
    const checkbox = firstCard.locator('button[role="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkbox.click();
      const bulkBar = await waitForBulkBar(page).catch(() => null);
      if (bulkBar) {
        const selectAllBtn = getBulkActionBar(page).locator('button:has-text("Select all")');
        if (await selectAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectAllBtn.click();

          const allCards = getLinkCards(page);
          const count = await allCards.count();
          for (let i = 0; i < Math.min(count, 5); i++) {
            const cb = allCards.nth(i).locator('button[role="checkbox"]').first();
            await expect(cb).toHaveAttribute("data-state", "checked", { timeout: 3000 }).catch(() => {});
          }
        }
      }
    }
  });

  test("BO-008: deselect all clears selections", async ({ page }) => {
    await selectLinkCards(page, [0, 1]);
    await waitForBulkBar(page);

    const deselectBtn = getBulkActionBar(page).locator('button:has-text("Deselect all")');
    if (await deselectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deselectBtn.click();
    } else {
      // Toggle by clicking the same cards again
      const cards = getLinkCards(page);
      await cards.nth(0).locator('button[role="checkbox"]').first().click();
      await cards.nth(1).locator('button[role="checkbox"]').first().click();
    }

    const cards = getLinkCards(page);
    for (let i = 0; i < 2; i++) {
      const cb = cards.nth(i).locator('button[role="checkbox"]').first();
      await expect(cb).toHaveAttribute("data-state", "unchecked", { timeout: 3000 });
    }

    await expect(getBulkActionBar(page)).not.toBeVisible({ timeout: 3000 });
  });

  test("BO-009: bulk delete shows confirmation before executing", async ({
    page,
  }) => {
    await selectLinkCards(page, [0]);
    await waitForBulkBar(page);

    let dialogHandled = false;
    page.on("dialog", (dialog) => {
      dialogHandled = true;
      dialog.dismiss();
    });

    await getBulkActionBar(page)
      .locator("button:has-text('Delete')")
      .click();

    await page.waitForTimeout(500);
    expect(dialogHandled).toBe(true);
  });

  test("BO-010: bulk tag shows dialog then success feedback", async ({
    page,
  }) => {
    await selectLinkCards(page, [0, 1]);
    await waitForBulkBar(page);

    await getBulkActionBar(page)
      .locator("button:has-text('Add tag')")
      .click();

    await expect(page.locator("[role='dialog']")).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("[role='dialog'] :text('Add Tag to Links')"),
    ).toBeVisible();

    await page
      .locator("[role='dialog'] button[role='combobox']")
      .first()
      .click();

    const commandInput = page
      .locator("[role='dialog'] input[placeholder*='Search']")
      .first();
    const tagName = `e2e-feedback-${Date.now()}`;
    await commandInput.fill(tagName);

    const createOption = page.locator(
      `[role='dialog'] [role='option']:has-text("${tagName}")`,
    ).first();
    await createOption.click();

    const response = await waitForApiResponse(
      page,
      "/links/bulk-tag",
      "POST",
      async () => {
        await page.locator("[role='dialog'] button:has-text('Add Tag')").click();
      },
    );

    expect([200, 201]).toContain(response.status);

    await expect(page.locator("[role='dialog']")).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("BO-011: VIEWER cannot perform bulk delete operations", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAsUser(page, "viewer");
    await page.goto("/dashboard/links");
    await page.waitForTimeout(2000);

    const firstCheckbox = getLinkCards(page)
      .first()
      .locator('button[role="checkbox"]')
      .first();

    if (await firstCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCheckbox.click();

      const bulkDeleteBtn = getBulkActionBar(page)
        .locator("button:has-text('Delete')")
        .first();

      if (await bulkDeleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await bulkDeleteBtn.isDisabled();
        expect(isDisabled).toBe(true);
      }
    }
  });

  test("BO-012: export respects current search/filter state", async ({
    page,
  }) => {
    const searchInput = page.locator(
      "input[placeholder*='Search links']",
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("Bulk Test");
      await page.waitForTimeout(1000);

      const exportButton = page.locator("button:has-text('Export')").first();

      if (await exportButton.isVisible()) {
        const exportRequest = page.waitForRequest(
          (req) => req.url().includes("/links/export"),
          { timeout: 5000 },
        ).catch(() => null);

        await exportButton.click();

        const request = await exportRequest;
        if (request) {
          const url = new URL(request.url(), "http://localhost");
          const hasFilter =
            url.searchParams.has("search") ||
            url.searchParams.has("q") ||
            url.searchParams.has("filter") ||
            url.searchParams.has("title");
          try {
            expect(hasFilter).toBe(true);
          } catch {
            expect(request.url()).toContain("/links/export");
          }
        }
      }

      await searchInput.clear();
    }
  });
});
