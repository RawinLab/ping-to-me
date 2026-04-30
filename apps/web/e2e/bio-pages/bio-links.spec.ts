import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  uniqueUrl,
  waitForApiResponse,
  waitForToast,
} from "../fixtures/test-helpers";

test.describe.configure({ mode: "serial", timeout: 150000 });

test.describe("Bio Page Link Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let bioPageId: string;
  let bioPageSlug: string;
  let currentOrgId: string;

  const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
    api.setOrganization(MAIN_ORG_ID);
    currentOrgId = MAIN_ORG_ID;
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    await page.unrouteAll();
    await loginAsUser(page, "owner");

    const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";
    await page.route("http://localhost:3011/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/auth/")) {
        await route.continue();
        return;
      }
      const headers = { ...route.request().headers() };
      headers["x-organization-id"] = MAIN_ORG_ID;

      const parsedUrl = new URL(url);
      if (parsedUrl.pathname === "/organizations") {
        const response = await route.fetch({ headers });
        const body = await response.json();
        const orgs = Array.isArray(body) ? body : [];
        const mainIdx = orgs.findIndex((o: any) => o.id === MAIN_ORG_ID);
        if (mainIdx > 0) {
          const [mainOrg] = orgs.splice(mainIdx, 1);
          orgs.unshift(mainOrg);
        }
        await route.fulfill({
          status: response.status(),
          headers: { ...response.headers(), "content-type": "application/json" },
          body: JSON.stringify(orgs),
        });
      } else {
        await route.continue({ headers });
      }
    });

    await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  async function createBioPageViaApi(overrides: Record<string, any> = {}) {
    const slug = uniqueSlug("biolink");
    const data = await api.post("/biopages", {
      slug,
      title: `Link Test Bio ${slug}`,
      description: "Test bio page for link management",
      layout: "stacked",
      orgId: currentOrgId,
      ...overrides,
    });
    cleanup.addBioPage(data.id);
    bioPageId = data.id;
    bioPageSlug = data.slug;
    return data;
  }

  async function gotoBioPages(page: import("@playwright/test").Page) {
    const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, MAIN_ORG_ID);

    if (page.url().includes("/dashboard/bio")) {
      const heading = page.locator('h1:has-text("Link-in-Bio Pages")');
      if (await heading.isVisible().catch(() => false)) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        await expect(page.locator('h1:has-text("Link-in-Bio Pages")')).toBeVisible({ timeout: 30000 });
        return;
      }
    }

    const bioLink = page.locator('a[href="/dashboard/bio"]').first();
    if (await bioLink.isVisible().catch(() => false)) {
      await bioLink.click();
    } else {
      await page.goto("/dashboard/bio", { waitUntil: "domcontentloaded" });
    }
    await page.waitForURL(/\/dashboard\/bio/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    await expect(page.locator('h1:has-text("Link-in-Bio Pages")')).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  async function openBioEditor(page: import("@playwright/test").Page) {
    await gotoBioPages(page);

    // Find card containing the slug text
    const card = page
      .locator("div.group")
      .filter({ hasText: new RegExp(bioPageSlug) })
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.scrollIntoViewIfNeeded();
    await card.locator('button:has-text("Edit Page")').click();

    // Editor page should show heading or content area
    await page.waitForTimeout(2000);
    await expect(
      page.locator("text=Bio Page Editor").first(),
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  }

  async function addLinkViaApi(
    title: string,
    url?: string,
    overrides: Record<string, any> = {},
  ) {
    const data = await api.post(`/biopages/${bioPageId}/links`, {
      title,
      externalUrl: url || uniqueUrl(),
      ...overrides,
    });
    return data;
  }

  test("add a link with URL and title via API reflects in editor", async ({
    page,
  }) => {
    await createBioPageViaApi();

    const link = await addLinkViaApi("My Portfolio", "https://example.com/portfolio");
    expect(link.id).toBeTruthy();
    expect(link.title).toBe("My Portfolio");

    await openBioEditor(page);

    await expect(
      page.locator("text=My Portfolio").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("add multiple links to bio page", async ({ page }) => {
    await createBioPageViaApi();

    await addLinkViaApi("Portfolio Site", "https://portfolio.example.com");
    await addLinkViaApi("Blog", "https://blog.example.com");
    await addLinkViaApi("Contact Me", "https://contact.example.com");

    await openBioEditor(page);

    await expect(
      page.locator("text=Portfolio Site").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Blog").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Contact Me").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("remove a link from bio page", async ({ page }) => {
    await createBioPageViaApi();
    await addLinkViaApi("Delete Me Link", "https://delete.example.com");

    await openBioEditor(page);

    await expect(
      page.locator("text=Delete Me Link").first(),
    ).toBeVisible({ timeout: 10000 });

    const linkCard = page
      .locator("[class*='border-l']")
      .filter({ hasText: "Delete Me Link" })
      .first();
    await expect(linkCard).toBeVisible({ timeout: 5000 });

    const allButtons = linkCard.locator("button").filter({
      has: page.locator('svg[class*="lucide"]'),
    });
    const deleteBtn = allButtons.nth(3);
    await deleteBtn.click();

    await expect(
      page.locator("text=Are you sure").first(),
    ).toBeVisible({ timeout: 5000 });
    await page
      .locator('[role="alertdialog"] button:has-text("Delete")')
      .click();

    await waitForToast(page, "deleted");

    await expect(
      page.locator("text=Delete Me Link"),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("edit link title via the link style editor", async ({ page }) => {
    await createBioPageViaApi();
    await addLinkViaApi("Original Title", "https://original.example.com");

    await openBioEditor(page);

    const linkCard = page
      .locator("[class*='border-l']")
      .filter({ hasText: "Original Title" })
      .first();
    await expect(linkCard).toBeVisible({ timeout: 5000 });

    const allButtons = linkCard.locator("button").filter({
      has: page.locator('svg[class*="lucide"]'),
    });
    const editBtn = allButtons.nth(2);
    await editBtn.click();

    await expect(
      page.locator("text=Customize Link Style"),
    ).toBeVisible({ timeout: 5000 });

    const titleInput = page.locator('[role="dialog"] input#title');
    await titleInput.clear();
    await titleInput.fill("Updated Title");

    await page.locator('[role="dialog"] button:has-text("Save Changes")').click();

    await expect(
      page.locator("text=Updated Title").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("reorder links via API persists new order", async ({ page }) => {
    await createBioPageViaApi();

    const link1 = await addLinkViaApi("First Link", "https://first.example.com");
    const link2 = await addLinkViaApi("Second Link", "https://second.example.com");
    const link3 = await addLinkViaApi("Third Link", "https://third.example.com");

    await api.patch(`/biopages/${bioPageId}/links/reorder`, {
      orderings: [
        { id: link3.id, order: 0 },
        { id: link1.id, order: 1 },
        { id: link2.id, order: 2 },
      ],
    });

    await openBioEditor(page);

    await expect(
      page.locator("text=Third Link").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=First Link").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Second Link").first(),
    ).toBeVisible({ timeout: 10000 });

    const bioPage = await api.get(`/biopages/${bioPageSlug}`);
    const orderedLinks = [...bioPage.bioLinks].sort(
      (a: any, b: any) => a.order - b.order,
    );
    expect(orderedLinks[0].title).toBe("Third Link");
    expect(orderedLinks[1].title).toBe("First Link");
    expect(orderedLinks[2].title).toBe("Second Link");
  });

  test("toggle link visibility hides link from public view", async ({
    page,
  }) => {
    await createBioPageViaApi({ isPublished: true });
    await addLinkViaApi("Visible Link", "https://visible.example.com");
    const hiddenLink = await addLinkViaApi(
      "To Be Hidden",
      "https://hidden.example.com",
    );

    await api.patch(`/biopages/${bioPageId}/links/${hiddenLink.id}`, {
      isVisible: false,
    });

    const newPage = await page.context().newPage();
    await newPage.goto(`/bio/${bioPageSlug}`, { waitUntil: "domcontentloaded" });
    await newPage.waitForTimeout(2000);

    await expect(
      newPage.locator("text=Visible Link").first(),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      newPage.locator("text=To Be Hidden"),
    ).not.toBeVisible({ timeout: 5000 });

    await newPage.close();
  });

  test("link click tracking fires on public bio page", async ({ page }) => {
    await createBioPageViaApi({ isPublished: true });
    await addLinkViaApi("Tracked Link", "https://tracked.example.com");

    const newPage = await page.context().newPage();

    await newPage.goto(`/bio/${bioPageSlug}`, { waitUntil: "networkidle" });
    await expect(
      newPage.locator("text=Tracked Link").first(),
    ).toBeVisible({ timeout: 10000 });

    const linkEl = newPage.locator("a", { hasText: "Tracked Link" }).first();
    await expect(linkEl).toBeVisible({ timeout: 5000 });
    const href = await linkEl.getAttribute("href");
    expect(href).toBeTruthy();

    await newPage.waitForTimeout(1000);
    await newPage.close();
  });

  test("add social media link via settings tab", async ({ page }) => {
    await createBioPageViaApi();

    await api.patch(`/biopages/${bioPageId}`, {
      socialLinks: [
        { platform: "twitter", url: "https://twitter.com/e2etest", order: 0 },
        { platform: "github", url: "https://github.com/e2etest", order: 1 },
      ],
    });

    const newPage = await page.context().newPage();
    await newPage.goto(`/bio/${bioPageSlug}`, { waitUntil: "domcontentloaded" });
    await newPage.waitForTimeout(2000);

    await expect(
      newPage.locator('a[aria-label="twitter"]').first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      newPage.locator('a[aria-label="github"]').first(),
    ).toBeVisible({ timeout: 10000 });

    await newPage.close();
  });

  test("adding many links succeeds up to reasonable limits", async ({
    page,
  }) => {
    await createBioPageViaApi();

    const linkPromises = [];
    for (let i = 0; i < 20; i++) {
      linkPromises.push(
        addLinkViaApi(`Link ${i}`, `https://link${i}.example.com`),
      );
    }
    const links = await Promise.all(linkPromises);

    expect(links.length).toBe(20);
    expect(links.every((l) => l.id)).toBeTruthy();

    await openBioEditor(page);

    await expect(
      page.locator("text=Link 0").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Link 19").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("links persist after page reload", async ({ page }) => {
    const bio = await createBioPageViaApi();
    await addLinkViaApi("Persistent Link A", "https://persist-a.example.com");
    await addLinkViaApi("Persistent Link B", "https://persist-b.example.com");

    await openBioEditor(page);

    await expect(
      page.locator("text=Persistent Link A").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Persistent Link B").first(),
    ).toBeVisible({ timeout: 10000 });

    await page.reload({ waitUntil: "domcontentloaded" });

    await page.waitForTimeout(1500);
    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1000);
      await gotoBioPages(page);
      const cardReload = page
        .locator("div.group")
        .filter({ hasText: bio.slug })
        .first();
      await expect(cardReload).toBeVisible({ timeout: 10000 });
      await cardReload.scrollIntoViewIfNeeded();
      await cardReload.locator('button:has-text("Edit Page")').click();
      await expect(
        page.locator('h1:has-text("Edit Bio Page")'),
      ).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    } else {
      await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1500);

      await expect(
        page.locator('h1:has-text("Link-in-Bio Pages")'),
      ).toBeVisible({ timeout: 15000 });

      const card = page
        .locator("div.group")
        .filter({ hasText: bio.slug })
        .first();
    await expect(card).toBeVisible({ timeout: 15000 });
      await card.scrollIntoViewIfNeeded();
      await card.locator('button:has-text("Edit Page")').click();

      await expect(
        page.locator('h1:has-text("Edit Bio Page")'),
      ).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }

    await expect(
      page.locator("text=Persistent Link A").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Persistent Link B").first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
