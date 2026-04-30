import { test, expect } from "@playwright/test";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  uniqueUrl,
} from "../fixtures/test-helpers";

test.describe("Public Bio Page Viewing", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let bioPageId: string;
  let bioPageSlug: string;
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

  test.beforeEach(async () => {
    cleanup = new CleanupTracker();
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  async function createPublishedBioPage(
    overrides: Record<string, any> = {},
    links: Array<{ title: string; url?: string }> = [],
  ) {
    const slug = uniqueSlug("pubbio");
    const data = await api.post("/biopages", {
      slug,
      title: `Public Bio ${slug}`,
      isPublished: true,
      layout: "stacked",
      orgId: currentOrgId,
      ...overrides,
    });
    cleanup.addBioPage(data.id);
    bioPageId = data.id;
    bioPageSlug = data.slug;

    // PATCH to set fields that POST ignores (description, theme)
    const patchPayload: Record<string, any> = {};
    if (overrides.description) patchPayload.description = overrides.description;
    if (overrides.theme) patchPayload.theme = overrides.theme;
    if (Object.keys(patchPayload).length > 0) {
      await api.patch(`/biopages/${bioPageId}`, patchPayload);
    }

    for (let i = 0; i < links.length; i++) {
      await api.post(`/biopages/${bioPageId}/links`, {
        title: links[i].title,
        externalUrl: links[i].url || uniqueUrl(),
        order: i,
      });
    }

    return data;
  }

  async function gotoPublicBioPage(page: import("@playwright/test").Page) {
    await page.goto(`/bio/${bioPageSlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
  }

  test("public bio page loads at /bio/{slug}", async ({ page }) => {
    await createPublishedBioPage();

    await gotoPublicBioPage(page);

    await expect(
      page.locator("text=Page Not Found"),
    ).not.toBeVisible({ timeout: 5000 });

    await expect(
      page.locator("text=Powered by PingTO.Me").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("bio page shows title and description", async ({ page }) => {
    await createPublishedBioPage({
      title: "My Test Profile",
      description: "Welcome to my bio page with custom description",
    });

    await gotoPublicBioPage(page);

    await expect(
      page.locator("h1", { hasText: "My Test Profile" }),
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.locator("text=Welcome to my bio page with custom description"),
    ).toBeVisible({ timeout: 15000 });
  });

  test("bio page shows avatar with initials fallback", async ({ page }) => {
    await createPublishedBioPage({ title: "AB" });

    await gotoPublicBioPage(page);

    const avatar = page.locator('span[class*="rounded-full"][class*="overflow-hidden"]').first();
    await expect(avatar).toBeVisible({ timeout: 10000 });

    await expect(page.locator("text=AB").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("bio page shows all visible links", async ({ page }) => {
    await createPublishedBioPage({}, [
      { title: "Portfolio", url: "https://portfolio.example.com" },
      { title: "Blog Posts", url: "https://blog.example.com" },
      { title: "Contact Me", url: "https://contact.example.com" },
    ]);

    await gotoPublicBioPage(page);

    await expect(
      page.locator("text=Portfolio").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Blog Posts").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("text=Contact Me").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("click a link on bio page navigates to external URL", async ({
    page,
  }) => {
    await createPublishedBioPage({}, [
      { title: "External Site", url: "https://example.com/target" },
    ]);

    await gotoPublicBioPage(page);

    const linkEl = page.locator("a", { hasText: "External Site" }).first();
    await expect(linkEl).toBeVisible({ timeout: 10000 });

    const href = await linkEl.getAttribute("href");
    expect(href).toBeTruthy();

    const target = await linkEl.getAttribute("target");
    expect(target).toBe("_blank");
  });

  test("bio page with custom dark theme renders correctly", async ({ page }) => {
    await createPublishedBioPage({
      title: "Dark Theme Bio",
      description: "Testing dark theme",
      theme: {
        name: "dark",
        primaryColor: "#8B5CF6",
        buttonColor: "#1F2937",
        buttonTextColor: "#F9FAFB",
        textColor: "#F9FAFB",
        backgroundColor: "#111827",
        backgroundType: "solid",
        buttonStyle: "rounded",
        buttonShadow: "lg",
        fontFamily: "sans-serif",
      },
    }, [
      { title: "Dark Link", url: "https://dark.example.com" },
    ]);

    await gotoPublicBioPage(page);

    await expect(
      page.locator("h1", { hasText: "Dark Theme Bio" }),
    ).toBeVisible({ timeout: 10000 });

    const linkEl = page.locator("text=Dark Link").first();
    await expect(linkEl).toBeVisible({ timeout: 10000 });
  });
});
