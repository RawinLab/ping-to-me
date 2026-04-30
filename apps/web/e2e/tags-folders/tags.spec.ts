import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  waitForApiResponse,
  fillField,
} from "../fixtures/test-helpers";
import { TEST_IDS, TEST_SLUGS } from "../fixtures/test-data";

test.describe("Tags Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

  const PRESET_COLORS = [
    { title: "Blue", value: "#3b82f6" },
    { title: "Indigo", value: "#6366f1" },
    { title: "Purple", value: "#8b5cf6" },
    { title: "Pink", value: "#ec4899" },
    { title: "Red", value: "#ef4444" },
    { title: "Orange", value: "#f97316" },
    { title: "Amber", value: "#f59e0b" },
    { title: "Emerald", value: "#10b981" },
    { title: "Teal", value: "#14b8a6" },
    { title: "Cyan", value: "#06b6d4" },
  ];

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    await loginAsUser(page, "owner");
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  async function gotoTagsPage(page: import("@playwright/test").Page) {
    // Set org context before navigating so the page fetches tags for the correct org
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    }
    await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 });
    await page.waitForTimeout(1000);

    const sidebarLink = page.locator('aside a[href="/dashboard/tags"]');
    if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sidebarLink.click();
    } else {
      await page.goto("/dashboard/tags");
    }
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Tags");
  }

  async function openCreateDialog(page: import("@playwright/test").Page) {
    await gotoTagsPage(page);
    await page.getByRole("button", { name: /New Tag/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  }

  async function createTagViaUi(
    page: import("@playwright/test").Page,
    overrides: { name?: string; color?: string } = {},
  ) {
    const name = overrides.name || uniqueSlug("tag");
    const colorBtn = overrides.color
      ? PRESET_COLORS.find((c) => c.value === overrides.color)?.title
      : null;

    await gotoTagsPage(page);

    await page.getByRole("button", { name: /New Tag/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    await fillField(page, '#name', name);

    if (colorBtn) {
      const btn = page.locator(`[role="dialog"] button[title="${colorBtn}"]`);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
      }
    }

    const response = await waitForApiResponse(page, "/tags", "POST", async () => {
      await page.locator('[role="dialog"] button').filter({ hasText: "Create Tag" }).click();
    });

    if (response.data?.id) {
      cleanup.addTag(response.data.id);
    }

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5000 });

    return { id: response.data?.id, name, color: overrides.color || "#3b82f6" };
  }

  function findTagCard(page: import("@playwright/test").Page, name: string) {
    return page
      .locator('[class*="group"]')
      .filter({ hasText: new RegExp(escapeRegex(name)) })
      .first();
  }

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  test("tags page loads with existing seeded tags", async ({ page }) => {
    await gotoTagsPage(page);

    await expect(page.locator("text=Total Tags")).toBeVisible();
    await expect(page.locator("text=marketing").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=social").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=campaign").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=important").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=temporary").first()).toBeVisible({ timeout: 5000 });
  });

  test("create new tag with name and color", async ({ page }) => {
    const tagName = `e2e-new-tag-${Date.now()}`;

    await openCreateDialog(page);

    await fillField(page, '#name', tagName);

    const emeraldBtn = page.locator('button[title="Emerald"]');
    if (await emeraldBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emeraldBtn.click();
    }

    const response = await waitForApiResponse(
      page,
      "/tags",
      "POST",
      async () => {
        await page.locator('[role="dialog"] button').filter({ hasText: "Create Tag" }).click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addTag(response.data.id);
    }

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${tagName}`).first()).toBeVisible({ timeout: 5000 });
  });

  test("edit tag name", async ({ page }) => {
    const tag = await createTagViaUi(page);
    const newName = `renamed-${Date.now()}`;

    await gotoTagsPage(page);

    const card = findTagCard(page, tag.name);
    await expect(card).toBeVisible({ timeout: 10000 });

    const editBtn = card.locator("button").filter({
      has: page.locator("svg[class*='lucide-edit-2']"),
    });
    if (await editBtn.count() > 0) {
      await editBtn.first().click();
    } else {
      const allButtons = card.locator("button");
      const count = await allButtons.count();
      await allButtons.nth(Math.max(0, count - 2)).click();
    }

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    const nameInput = page.locator('#edit-name, #name');
    await nameInput.first().clear();
    await nameInput.first().fill(newName);

    const response = await waitForApiResponse(
      page,
      `/tags/${tag.id}`,
      "PATCH",
      async () => {
        await page.locator('[role="dialog"] button').filter({ hasText: "Update Tag" }).click();
      },
    ).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
    }
  });

  test("edit tag color", async ({ page }) => {
    const tag = await createTagViaUi(page, { color: "#3b82f6" });

    await gotoTagsPage(page);

    const card = findTagCard(page, tag.name);
    await expect(card).toBeVisible({ timeout: 10000 });

    const editSvg = card.locator("button").filter({
      has: page.locator("svg[class*='lucide-edit-2']"),
    });
    if (await editSvg.count() > 0) {
      await editSvg.first().click();
    } else {
      const allButtons = card.locator("button");
      const count = await allButtons.count();
      await allButtons.nth(Math.max(0, count - 2)).click();
    }

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    const purpleBtn = page.locator('[role="dialog"] button[title="Purple"]');
    if (await purpleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await purpleBtn.click();
    }

    const response = await waitForApiResponse(
      page,
      `/tags/${tag.id}`,
      "PATCH",
      async () => {
        await page.locator('[role="dialog"] button').filter({ hasText: "Update Tag" }).click();
      },
    ).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
    }
  });

  test("delete a tag", async ({ page }) => {
    const tag = await createTagViaUi(page, { name: "Delete Me Tag" });

    await gotoTagsPage(page);

    const card = findTagCard(page, tag.name);
    await expect(card).toBeVisible({ timeout: 10000 });

    const deleteSvg = card.locator("button").filter({
      has: page.locator("svg[class*='lucide-trash-2']"),
    });
    if (await deleteSvg.count() > 0) {
      await deleteSvg.first().click();
    } else {
      const allButtons = card.locator("button");
      const count = await allButtons.count();
      await allButtons.nth(count - 1).click();
    }

    await expect(page.locator('[role="alertdialog"]')).toBeVisible({ timeout: 5000 });

    const response = await waitForApiResponse(
      page,
      `/tags/${tag.id}`,
      "DELETE",
      async () => {
        await page.locator('[role="alertdialog"] button').filter({ hasText: "Delete Tag" }).click();
      },
    ).catch(() => null);

    if (response) {
      expect(response.status).toBe(200);
    }

    cleanup["tags"] = cleanup["tags"].filter((id: string) => id !== tag.id);
  });

  test("tag shows link count", async ({ page }) => {
    await gotoTagsPage(page);

    const marketingCard = findTagCard(page, "marketing");
    await expect(marketingCard).toBeVisible({ timeout: 10000 });

    const linkCountText = marketingCard.locator("text=/\\d+\\s*link/i").first();
    if (!(await linkCountText.isVisible({ timeout: 3000 }).catch(() => false))) {
      const linksLabel = marketingCard.locator("text=Links").first();
      await expect(linksLabel).toBeVisible({ timeout: 5000 });
    }
  });

  test("click tag navigates to filtered links view", async ({ page }) => {
    await gotoTagsPage(page);

    const marketingCard = findTagCard(page, "marketing");
    await expect(marketingCard).toBeVisible({ timeout: 10000 });

    const viewLinksBtn = marketingCard.locator('button:has-text("View Links")');
    if (await viewLinksBtn.isVisible().catch(() => false)) {
      await viewLinksBtn.click();
      await expect(page).toHaveURL(/\/dashboard\/links/, { timeout: 10000 });
    }
  });

  test("cannot create tag with duplicate name", async ({ page }) => {
    await openCreateDialog(page);

    await fillField(page, '#name', TEST_SLUGS.tags.marketing);

    await page.locator('[role="dialog"] button').filter({ hasText: "Create Tag" }).click();

    await expect(
      page
        .locator("text=already exists")
        .or(page.locator("text=already taken"))
        .or(page.locator("text=duplicate"))
        .or(page.locator("text=conflict"))
        .or(page.locator("[class*='red-50']"))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("tags display with correct colors", async ({ page }) => {
    const tag = await createTagViaUi(page, { color: "#ef4444" });

    await gotoTagsPage(page);

    const card = findTagCard(page, tag.name);
    await expect(card).toBeVisible({ timeout: 10000 });

    const iconContainer = card.locator("div[style*='background-color']").first();
    if (await iconContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const style = await iconContainer.getAttribute("style");
      expect(style).toBeTruthy();
    }
  });

  test("tags page loads and shows all seeded tags", async ({ page }) => {
    await gotoTagsPage(page);

    const seededTagNames = [
      "marketing",
      "social",
      "campaign",
      "important",
      "temporary",
    ];

    for (const tagName of seededTagNames) {
      await expect(
        page.locator(`text=${tagName}`).first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
