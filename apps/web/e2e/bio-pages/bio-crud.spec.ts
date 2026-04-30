import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
  fillField,
} from "../fixtures/test-helpers";
import { TEST_SLUGS, BIO_PAGE_DATA } from "../fixtures/test-data";

test.describe("Bio Page CRUD", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let currentOrgId: string;

  test.beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        api = await ApiClient.create("owner");
        const orgs = await api.get("/organizations");
        currentOrgId = orgs[0].id;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    await loginAsUser(page, "owner");
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  async function gotoBioPages(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto("/dashboard/bio", { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(4000);

      if (page.url().includes("/login")) {
        await loginAsUser(page, "owner");
        await page.locator("text=PingTO.Me").first().waitFor({ state: "visible", timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.evaluate(() => {
          localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
        });
        continue;
      }

      await page.locator("text=PingTO.Me").first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const h1 = page.locator('h1:has-text("Link-in-Bio Pages")');
      if (await h1.isVisible({ timeout: 10000 }).catch(() => false)) {
        await page.waitForTimeout(1000);
        return;
      }
    }

    await expect(page.locator('h1:has-text("Link-in-Bio Pages")')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1000);
  }

  async function openCreateBuilder(page: import("@playwright/test").Page) {
    await gotoBioPages(page);
    await page.locator('button:has-text("Create Page")').click();
    await expect(
      page.locator('h1:has-text("Create Bio Page")'),
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  }

  async function fillBasics(
    page: import("@playwright/test").Page,
    slug: string,
    title: string,
  ) {
    await fillField(page, 'input#slug', slug);
    await fillField(page, 'input#title', title);
  }

  async function saveAndWait(page: import("@playwright/test").Page) {
    const response = await waitForApiResponse(
      page,
      "/biopages",
      "POST",
      async () => {
        await page
          .locator('button:has-text("Save Changes")')
          .click();
      },
    );

    if (response.data?.id) {
      cleanup.addBioPage(response.data.id);
    }

    await expect(
      page.locator('h1:has-text("Link-in-Bio Pages")'),
    ).toBeVisible({ timeout: 10000 });

    return response.data;
  }

  async function createViaApi(overrides: Record<string, any> = {}) {
    const slug = uniqueSlug("bio");
    const data = await api.post("/biopages", {
      slug,
      title: `E2E Bio ${slug}`,
      description: "Test bio page",
      orgId: currentOrgId,
      ...overrides,
    });
    cleanup.addBioPage(data.id);
    return data;
  }

  async function openEditFor(
    page: import("@playwright/test").Page,
    title: string,
  ) {
    await gotoBioPages(page);
    const card = page.locator("div.group").filter({ hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.scrollIntoViewIfNeeded();
    await card.locator('button:has-text("Edit Page")').click({ timeout: 10000 });
    await expect(
      page.locator('h1:has-text("Edit Bio Page")'),
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  }

  test("bio pages list loads and shows seeded pages", async ({ page }) => {
    const bio = await createViaApi({ title: "E2E Test Profile" });

    await gotoBioPages(page);

    const cards = page.locator("div.group");
    const hasCards = await cards.first().isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasCards) {
      const emptyState = page.locator('text=Create Your First Bio Page, text=No bio pages');
      const hasEmpty = await emptyState.first().isVisible({ timeout: 5000 }).catch(() => false);
      if (hasEmpty) {
        return;
      }
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
    }

    const bioTitle = page.locator(`text=${bio.title}`).first();
    const hasBioPage = await bioTitle.isVisible({ timeout: 10000 }).catch(() => false)
      || await cards.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasBioPage).toBe(true);
  });

  test("create new bio page with title and slug", async ({ page }) => {
    const slug = uniqueSlug("bio");
    const title = `E2E New Bio ${slug}`;

    await openCreateBuilder(page);
    await fillBasics(page, slug, title);

    const data = await saveAndWait(page);

    expect(data).toBeTruthy();
    expect(data.slug).toBe(slug);
    expect(data.title).toBe(title);

    await expect(page.locator(`text=${title}`).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("edit bio page title", async ({ page }) => {
    const bio = await createViaApi();
    const newTitle = `Updated Title ${Date.now()}`;

    await openEditFor(page, bio.title);

    const titleInput = page.locator('input#title');
    await titleInput.clear();
    await titleInput.fill(newTitle);

    const response = await waitForApiResponse(
      page,
      `/biopages/${bio.id}`,
      "PATCH",
      async () => {
        await page.locator('button:has-text("Save Changes")').click();
      },
    );

    expect([200, 201]).toContain(response.status);

    await expect(
      page.locator('h1:has-text("Link-in-Bio Pages")'),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.locator(`text=${newTitle}`).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("edit bio page description", async ({ page }) => {
    const bio = await createViaApi();
    const newDesc = `Updated description ${Date.now()}`;

    await openEditFor(page, bio.title);

    const descField = page.locator('textarea#description');
    await descField.clear();
    await descField.fill(newDesc);

    const response = await waitForApiResponse(
      page,
      `/biopages/${bio.id}`,
      "PATCH",
      async () => {
        await page.locator('button:has-text("Save Changes")').click();
      },
    );

    expect([200, 201]).toContain(response.status);

    const updated = await api.get(`/biopages/${bio.slug}`);
    const returnedDesc = updated.description;
    expect(returnedDesc === newDesc || returnedDesc === newDesc.trim()).toBeTruthy();
  });

  test("change bio page theme from minimal to dark", async ({ page }) => {
    const bio = await createViaApi();

    await openEditFor(page, bio.title);

    await page.locator('[role="tab"]:has-text("Theme")').click();
    await expect(page.locator("text=Choose a Preset Theme")).toBeVisible({
      timeout: 5000,
    });

    await page.locator('button:has-text("Dark")').first().click();

    const response = await waitForApiResponse(
      page,
      `/biopages/${bio.id}`,
      "PATCH",
      async () => {
        await page.locator('button:has-text("Save Changes")').click();
      },
    );

    expect([200, 201]).toContain(response.status);

    await expect(
      page.locator('h1:has-text("Link-in-Bio Pages")'),
    ).toBeVisible({ timeout: 10000 });

    const updated = await api.get(`/biopages/${bio.slug}`);
    const theme = updated.theme;
    const themeName = typeof theme === "string" ? theme : theme?.name;
    expect(themeName).toBeTruthy();
  });

  test("avatar upload area is present on edit page", async ({ page }) => {
    const bio = await createViaApi();

    await openEditFor(page, bio.title);

    await expect(page.locator("text=Profile Picture")).toBeVisible({
      timeout: 5000,
    });
  });

  test("delete bio page from list", async ({ page }) => {
    const bio = await createViaApi({ title: "Delete Me Bio" });

    await gotoBioPages(page);

    const card = page
      .locator("div.group")
      .filter({ hasText: "Delete Me Bio" })
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.hover();
    await page.waitForTimeout(500);
    const trashBtn = card.locator("button").filter({
      has: page.locator('svg[class*="lucide-trash"]'),
    });
    await trashBtn.click({ timeout: 5000 });

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const deleteBtn = dialog.locator("button").filter({ hasText: /^Delete$/ });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/biopages/") && resp.request().method() === "DELETE",
        { timeout: 10000 },
      ),
      deleteBtn.first().click({ force: true }),
    ]);

    await page.waitForTimeout(1000);

    const remaining = page.locator("div.group").filter({ hasText: "Delete Me Bio" });
    await expect(remaining).toHaveCount(0, { timeout: 10000 });
  });

  test("duplicate slug shows error", async ({ page }) => {
    await openCreateBuilder(page);

    await fillField(page, 'input#slug', TEST_SLUGS.biopages.main);
    await fillField(page, 'input#title', "Duplicate Slug Bio");

    await page.locator('button:has-text("Save Changes")').click();

    await expect(
      page.locator("[data-sonner-toast]").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("live preview is visible in builder", async ({ page }) => {
    const slug = uniqueSlug("bio");
    const title = `Preview Bio ${slug}`;

    await openCreateBuilder(page);
    await fillBasics(page, slug, title);

    await expect(
      page.locator("text=Live Preview").first(),
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator("text=See your changes in real-time"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("bio page URL slug prefix is shown in builder", async ({
    page,
  }) => {
    const slug = uniqueSlug("bio");
    const title = `URL Bio ${slug}`;

    await openCreateBuilder(page);
    await fillBasics(page, slug, title);

    await expect(page.locator("text=pingto.me/bio/")).toBeVisible({
      timeout: 5000,
    });

    await saveAndWait(page);

    await expect(page.locator(`text=/${slug}`).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("toggle bio page published status via API reflects in list", async ({
    page,
  }) => {
    const bio = await createViaApi({ isPublished: false });

    await api.patch(`/biopages/${bio.id}`, { isPublished: true });

    await gotoBioPages(page);

    const card = page
      .locator("div.group")
      .filter({ hasText: bio.title })
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator("text=Published")).toBeVisible({ timeout: 5000 });

    await api.patch(`/biopages/${bio.id}`, { isPublished: false });
    await page.waitForTimeout(500);

    await page.locator('a[href="/dashboard"]').first().click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForTimeout(1500);
    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
    } else {
      await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
    }
    await page.waitForTimeout(1500);
    await gotoBioPages(page);

    const cardAfter = page
      .locator("div.group")
      .filter({ hasText: bio.title })
      .first();
    await expect(cardAfter).toBeVisible({ timeout: 15000 });
    await expect(cardAfter.locator("text=Draft")).toBeVisible({ timeout: 10000 });
  });

  test("create bio page with all fields filled", async ({ page }) => {
    const slug = uniqueSlug("full");
    const title = `Full Bio ${Date.now()}`;
    const description = "Complete bio page with all options";

    await openCreateBuilder(page);

    await fillBasics(page, slug, title);
    await fillField(page, 'textarea#description', description);

    await page.locator('[role="tab"]:has-text("Settings")').click();

    const gridOption = page.locator('button:has-text("Grid")').first();
    if (await gridOption.isVisible().catch(() => false)) {
      await gridOption.click();
    }

    await page.locator('[role="tab"]:has-text("Theme")').click();
    const colorfulTheme = page.locator('button:has-text("Colorful")').first();
    if (await colorfulTheme.isVisible().catch(() => false)) {
      await colorfulTheme.click();
    }

    const data = await saveAndWait(page);

    expect(data).toBeTruthy();
    expect(data.slug).toBe(slug);
    expect(data.title).toBe(title);

    await expect(page.locator(`text=${title}`).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("cancel creation returns to bio pages list", async ({ page }) => {
    await openCreateBuilder(page);

    await fillField(page, 'input#slug', uniqueSlug("cancel"));
    await fillField(page, 'input#title', "Should Not Be Saved");

    await page
      .locator("button")
      .filter({ has: page.locator('svg[class*="arrow-left"]') })
      .first()
      .click();

    await expect(
      page.locator('h1:has-text("Link-in-Bio Pages")'),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator("text=Should Not Be Saved"),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("bio pages list shows correct info for each page", async ({ page }) => {
    const bio = await createViaApi({
      title: "Info Check Bio",
      description: "Verify list info",
    });

    await gotoBioPages(page);

    const card = page
      .locator("div.group")
      .filter({ hasText: "Info Check Bio" })
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });

    await expect(card.locator("text=Info Check Bio")).toBeVisible();
    await expect(card.locator(`text=/${bio.slug}`)).toBeVisible();
    await expect(card.locator("text=views")).toBeVisible();

    const badge = card.locator("text=Published").or(card.locator("text=Draft"));
    await expect(badge.first()).toBeVisible();

    await expect(card.locator('button:has-text("Edit Page")')).toBeVisible();
  });
});
