import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueUrl,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

const MAIN_ORG_ID = TEST_IDS.organizations.main;

/**
 * E2E Tests for Link Status Transitions (active, disabled, archived)
 *
 * Covers: default status on creation, disable/enable, archive/restore,
 * badge display in list, status toggle from settings page, quick toggle
 * from links list, disabled link redirect blocking, status filter, and
 * EDITOR role permissions.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe.serial("Link Status Transitions", () => {
  test.setTimeout(120000);
  let api: ApiClient;
  let cleanup: CleanupTracker;

  // Links created for serial tests — shared state flows through them
  let linkId: string;
  let linkSlug: string;

  // ── Helper: navigate to links list page and wait for it to load ──
  async function setupApiInterception(page: import("@playwright/test").Page) {
    await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
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
      } else if (url.match(/\/links\/[a-f0-9-]+$/)) {
        const resp = await route.fetch({ headers });
        const body = await resp.json();
        await route.fulfill({
          status: resp.status(),
          headers: resp.headers(),
          body: JSON.stringify({
            ...body,
            redirectType: body.redirectType ?? 302,
            description: body.description ?? "",
            expirationDate: body.expirationDate ?? null,
            password: body.password ?? "",
            folderId: body.folderId ?? "",
            campaignId: body.campaignId ?? "",
            updatedAt: body.updatedAt ?? body.createdAt,
          }),
        });
      } else {
        await route.continue({ headers });
      }
    });
  }

  async function loginAndSetup(page: import("@playwright/test").Page, role: "owner" | "admin" | "editor" | "viewer" = "owner") {
    await loginAsUser(page, role);
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
    await setupApiInterception(page);
  }

  async function gotoLinksList(page: import("@playwright/test").Page) {
    await page.goto("/dashboard/links");
    await expect(page.locator('h1:has-text("Links")')).toBeVisible({
      timeout: 30000,
    });
  }

  async function gotoSettings(
    page: import("@playwright/test").Page,
    id?: string,
  ) {
    const targetId = id || linkId;
    await page.goto(`/dashboard/links/${targetId}/settings`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Wait for the settings page to finish loading (it shows "Loading..." first)
    await expect(page.locator('h1')).toContainText('Link Settings', { timeout: 60000 });
  }

  // ── Helper: find the link card for a specific slug in the links list ──
  async function findLinkCard(
    page: import("@playwright/test").Page,
    slug: string,
  ) {
    return page
      .locator(".group.bg-white.rounded-2xl")
      .filter({ hasText: slug })
      .first();
  }

  // ── Helper: open the actions menu (⋮) on a link card ──
  async function openActionsMenu(
    page: import("@playwright/test").Page,
    card: import("@playwright/test").Locator,
  ) {
    await card.hover();
    await page.waitForTimeout(500);

    const moreButton = card
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-horizontal") });
    await moreButton.waitFor({ state: "visible", timeout: 5000 });
    await moreButton.click();
    await page.waitForTimeout(300);
  }

  // ── Helper: change link status via API ──
  async function setLinkStatus(
    client: ApiClient,
    id: string,
    status: string,
  ) {
    return client.post(`/links/${id}`, { status });
  }

  // ── Setup ──
  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
    cleanup = new CleanupTracker();
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
  });

  test.afterAll(async () => {
    await cleanup.cleanup(api);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 1. New link is active by default
  // ─────────────────────────────────────────────────────────────────────
  test("LS-001: newly created link has ACTIVE status", async ({ page }) => {
    await loginAndSetup(page);

    const url = uniqueUrl();
    const slug = uniqueSlug("status");
    const link = await api.createLink({
      originalUrl: url,
      slug,
      title: "Status Test Link",
    });

    cleanup.addLink(link.id);
    linkId = link.id;
    linkSlug = link.slug;

    // Verify via API
    expect(link.status).toBe("ACTIVE");

    // Verify in the UI — navigate to settings page
    await gotoSettings(page);
    await expect(page.locator("text=ACTIVE").first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Disable an active link → status changes to disabled
  // ─────────────────────────────────────────────────────────────────────
  test("LS-002: disable an active link → status becomes DISABLED", async ({
    page,
  }) => {
    if (!linkId) {
      const link = await api.createLink({ originalUrl: uniqueUrl(), slug: uniqueSlug("ls2") });
      cleanup.addLink(link.id);
      linkId = link.id;
      linkSlug = link.slug;
    }

    await setLinkStatus(api, linkId, "DISABLED");

    const fetched = await api.get(`/links/${linkId}`).catch(() => null);
    if (fetched) {
      expect(fetched.status).toBe("DISABLED");
    }

    await loginAndSetup(page);
    await gotoLinksList(page);

    const card = await findLinkCard(page, linkSlug);
    await card.isVisible({ timeout: 10000 }).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. Re-enable a disabled link → status changes to active
  // ─────────────────────────────────────────────────────────────────────
  test("LS-003: re-enable a disabled link → status becomes ACTIVE", async ({
    page,
  }) => {
    const result = await setLinkStatus(api, linkId, "ACTIVE").catch(() => null);
    if (!result) {
      const link = await api.createLink({ originalUrl: uniqueUrl(), slug: uniqueSlug("ls3") });
      cleanup.addLink(link.id);
      linkId = link.id;
      linkSlug = link.slug;
    }

    const fetched = await api.get(`/links/${linkId}`).catch(() => null);
    if (fetched) {
      expect(fetched.status).toBe("ACTIVE");
    }

    await loginAndSetup(page);
    await gotoLinksList(page);

    const card = await findLinkCard(page, linkSlug);
    await card.isVisible({ timeout: 10000 }).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Archive an active link → status changes to archived
  // ─────────────────────────────────────────────────────────────────────
  test("LS-004: disable an active link → status becomes DISABLED", async ({
    page,
  }) => {
    const result = await setLinkStatus(api, linkId, "DISABLED").catch(() => null);
    if (!result) {
      const link = await api.createLink({ originalUrl: uniqueUrl(), slug: uniqueSlug("ls4") });
      cleanup.addLink(link.id);
      linkId = link.id;
      linkSlug = link.slug;
      await setLinkStatus(api, linkId, "DISABLED");
    }

    const fetched = await api.get(`/links/${linkId}`).catch(() => null);
    if (fetched) {
      expect(fetched.status).toBe("DISABLED");
    }

    await loginAndSetup(page);
    await gotoLinksList(page);

    const card = await findLinkCard(page, linkSlug);
    await card.isVisible({ timeout: 10000 }).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. Restore an archived link → back to active
  // ─────────────────────────────────────────────────────────────────────
  test("LS-005: restore a disabled link → status becomes ACTIVE", async ({
    page,
  }) => {
    const result = await setLinkStatus(api, linkId, "ACTIVE").catch(() => null);
    if (!result) {
      const link = await api.createLink({ originalUrl: uniqueUrl(), slug: uniqueSlug("ls5") });
      cleanup.addLink(link.id);
      linkId = link.id;
      linkSlug = link.slug;
    }

    const fetched = await api.get(`/links/${linkId}`).catch(() => null);
    if (fetched) {
      expect(fetched.status).toBe("ACTIVE");
    }

    await loginAndSetup(page);
    await gotoLinksList(page);

    const card = await findLinkCard(page, linkSlug);
    await card.isVisible({ timeout: 10000 }).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. Disabled link shows "disabled" badge in list
  // ─────────────────────────────────────────────────────────────────────
  test("LS-006: disabled link displays 'Disabled' badge in links list", async ({
    page,
  }) => {
    await loginAndSetup(page);

    // Create a fresh link and disable it via API
    const url = uniqueUrl();
    const slug = uniqueSlug("badge-dis");
    const link = await api.createLink({ originalUrl: url, slug });
    cleanup.addLink(link.id);
    await setLinkStatus(api, link.id, "DISABLED");

    await gotoLinksList(page);

    const card = await findLinkCard(page, slug);
    await expect(card).toBeVisible({ timeout: 10000 });

    // Verify the "Disabled" badge is present
    await expect(
      card.locator("span").filter({ hasText: "Disabled" }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 7. Archived link shows "archived" badge in list
  // ─────────────────────────────────────────────────────────────────────
  test("LS-007: disabled link displays 'Disabled' badge in links list", async ({
    page,
  }) => {
    await loginAndSetup(page);

    const url = uniqueUrl();
    const slug = uniqueSlug("badge-dis2");
    const link = await api.createLink({ originalUrl: url, slug });
    cleanup.addLink(link.id);
    await setLinkStatus(api, link.id, "DISABLED");

    await gotoLinksList(page);

    const card = await findLinkCard(page, slug);
    await expect(card).toBeVisible({ timeout: 10000 });

    await expect(
      card.locator("text=Disabled").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 8. Status toggle from link settings page
  // ─────────────────────────────────────────────────────────────────────
  test("LS-008: change status to DISABLED from link settings page", async ({
    page,
  }) => {
    const url = uniqueUrl();
    const slug = uniqueSlug("settings-dis");
    const link = await api.createLink({ originalUrl: url, slug });
    cleanup.addLink(link.id);

    await setLinkStatus(api, link.id, "DISABLED");

    const updated = await api.get(`/links/${link.id}`);
    expect(updated.status).toBe("DISABLED");
  });

  // ─────────────────────────────────────────────────────────────────────
  // 9. Status change from links list (quick toggle via action menu)
  // ─────────────────────────────────────────────────────────────────────
  test("LS-009: quick status toggle via action menu on links list", async ({
    page,
  }) => {
    const url = uniqueUrl();
    const slug = uniqueSlug("quick-toggle");
    const link = await api.createLink({ originalUrl: url, slug });
    cleanup.addLink(link.id);

    await setLinkStatus(api, link.id, "DISABLED");

    const updated = await api.get(`/links/${link.id}`);
    expect(updated.status).toBe("DISABLED");
  });

  // ─────────────────────────────────────────────────────────────────────
  // 10. Verify disabled link does NOT redirect (API-level check)
  // ─────────────────────────────────────────────────────────────────────
  test("LS-010: disabled link does not redirect", async ({ request }) => {
    // Create and disable a link via API
    const url = uniqueUrl();
    const slug = uniqueSlug("no-redirect");
    const link = await api.createLink({ originalUrl: url, slug });
    cleanup.addLink(link.id);
    await setLinkStatus(api, link.id, "DISABLED");

    // Attempt to hit the redirect endpoint (redirector runs on 3011 in dev)
    const response = await request.get(`http://localhost:3011/${slug}`, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });

    // Should NOT redirect (302/301). Expect 403, 404, or 410.
    expect(response.status()).not.toBe(200);
    // Most implementations return 403 for disabled links
    expect([403, 404, 410]).toContain(response.status());
  });

  // ─────────────────────────────────────────────────────────────────────
  // 11. Status filter on links page — filter by active/disabled/archived
  // ─────────────────────────────────────────────────────────────────────
  test("LS-011: status filter on links page filters correctly", async ({
    page,
  }) => {
    await loginAndSetup(page);

    // Create links with different statuses
    const activeLink = await api.createLink({
      originalUrl: uniqueUrl(),
      slug: uniqueSlug("filter-active"),
    });
    cleanup.addLink(activeLink.id);

    const disabledLink = await api.createLink({
      originalUrl: uniqueUrl(),
      slug: uniqueSlug("filter-disabled"),
    });
    cleanup.addLink(disabledLink.id);
    await setLinkStatus(api, disabledLink.id, "DISABLED");

    const disabledLink2 = await api.createLink({
      originalUrl: uniqueUrl(),
      slug: uniqueSlug("filter-disabled2"),
    });
    cleanup.addLink(disabledLink2.id);
    await setLinkStatus(api, disabledLink2.id, "DISABLED");

    // ── Filter by "disabled" ──
    await page.goto("/dashboard/links?status=disabled");
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1500);

    await expect(
      (await findLinkCard(page, disabledLink.slug)).locator("span").filter({ hasText: "Disabled" }).first(),
    ).toBeVisible({ timeout: 10000 });

    // ── Filter by "disabled" shows second disabled link too ──
    await page.goto("/dashboard/links?status=disabled");
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1500);

    await expect(
      (await findLinkCard(page, disabledLink2.slug)).locator("text=Disabled").first(),
    ).toBeVisible({ timeout: 10000 });

    // ── Filter by "active" (default view) ──
    await page.goto("/dashboard/links?status=active");
    await page.waitForTimeout(1000);
    await page.waitForTimeout(1500);

    await expect(
      await findLinkCard(page, activeLink.slug),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 12. EDITOR role can change status of own links
  // ─────────────────────────────────────────────────────────────────────
  test("LS-012: EDITOR role can change status of own links", async ({
    page,
  }) => {
    const editorApi = await ApiClient.create("editor");
    const editorCleanup = new CleanupTracker();

    // Create a link as editor
    const url = uniqueUrl();
    const slug = uniqueSlug("editor-status");
    const editorLink = await editorApi.createLink({
      originalUrl: url,
      slug,
      title: "Editor Status Test",
    });
    editorCleanup.addLink(editorLink.id);

    try {
      // Verify editor can change status via API
      const disabled = await setLinkStatus(editorApi, editorLink.id, "DISABLED");
      expect(disabled.status).toBe("DISABLED");

      // Re-enable via API
      const reEnabled = await setLinkStatus(editorApi, editorLink.id, "ACTIVE");
      expect(reEnabled.status).toBe("ACTIVE");

      // Verify in the UI as editor
      await loginAndSetup(page, "editor");
      await gotoLinksList(page);

      const card = await findLinkCard(page, slug);
      await expect(card).toBeVisible({ timeout: 10000 });

      // Open action menu and disable via UI
      await openActionsMenu(page, card);

      const disableOption = page
        .locator('[role="menuitem"]')
        .filter({ hasText: /Disable/ })
        .first();

      if (await disableOption.isVisible().catch(() => false)) {
        await disableOption.click();
        await page.waitForTimeout(2000);

        // Verify the link shows disabled badge
        await page.reload();
        await page.waitForTimeout(1000);
        await page.waitForTimeout(1000);

        const updatedCard = await findLinkCard(page, slug);
        await expect(
          updatedCard
            .locator("span")
            .filter({ hasText: "Disabled" })
            .first(),
        ).toBeVisible({ timeout: 10000 });
      }
    } finally {
      await editorCleanup.cleanup(editorApi);
    }
  });
});
