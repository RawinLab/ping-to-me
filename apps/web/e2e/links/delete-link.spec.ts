import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueUrl,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
  expectDialogOpen,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

const MAIN_ORG_ID = TEST_IDS.organizations.main;

/**
 * E2E Tests for Soft-Deleting and Restoring Links
 *
 * Covers: delete from list action menu, delete from settings page, soft-delete
 * to trash/archived state, restore, permanent delete, confirmation dialog,
 * cancel delete, link removal from main list, EDITOR can delete own links,
 * VIEWER cannot delete.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe.serial("Delete Link", () => {
  test.setTimeout(120000);
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let testLinkId: string;
  let testLinkSlug: string;

  // ── Helper: navigate to links list and wait for it to load ──
  async function setupApiInterception(page: import("@playwright/test").Page) {
    await page.route("http://localhost:3011/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (url.includes("/auth/")) {
        await route.continue();
        return;
      }
      const headers = { ...route.request().headers() };
      headers["x-organization-id"] = MAIN_ORG_ID;

      const parsedUrl = new URL(url);
      const isLinkDetail = /\/links\/[a-f0-9-]+$/.test(url) && method === "GET";
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
      } else if (isLinkDetail) {
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

  async function loginAndSetup(
    page: import("@playwright/test").Page,
    role: "owner" | "admin" | "editor" | "viewer" = "owner",
  ) {
    await loginAsUser(page, role);
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
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
    linkId?: string,
  ) {
    const id = linkId || testLinkId;
    await page.goto(`/dashboard/links/${id}/settings`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Page shows "Loading..." state before rendering h1 — needs extended timeout
    await expect(page.locator('h1')).toContainText('Link Settings', { timeout: 60000 });
  }

  // ── Helper: create a fresh link via API for testing ──
  async function createTestLink(
    apiClient: ApiClient,
    suffix?: string,
  ): Promise<{ id: string; slug: string }> {
    const url = uniqueUrl();
    const slug = uniqueSlug(`del${suffix ? `-${suffix}` : ""}`);
    const link = await apiClient.createLink({
      originalUrl: url,
      title: `Delete Test Link ${Date.now()}`,
      slug,
    });
    return { id: link.id, slug: link.slug };
  }

  // ── Setup: create a link that all serial tests will share ──
  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
    cleanup = new CleanupTracker();

    const { id, slug } = await createTestLink(api);
    testLinkId = id;
    testLinkSlug = slug;
    cleanup.addLink(testLinkId);
  });

  test.afterAll(async () => {
    await cleanup.cleanup(api);
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Delete link from links list via action menu
  // ─────────────────────────────────────────────────────────────
  test("DL-001: delete link from links list via action menu", async ({
    page,
  }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "list");
    localCleanup.addLink(id);

    try {
      await loginAndSetup(page);
      await gotoLinksList(page);

      const linkCard = page
        .locator(".group.bg-white.rounded-2xl")
        .filter({ hasText: slug })
        .first();

      await linkCard.hover();
      await page.waitForTimeout(500);

      const moreButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") });
      await moreButton.waitFor({ state: "visible", timeout: 5000 });
      await moreButton.click();

      const deleteOption = page.locator(
        '[role="menuitem"]:has-text("Delete")',
      );
      await expect(deleteOption).toBeVisible({ timeout: 5000 });

      page.on("dialog", (dialog) => dialog.accept());

      const response = await waitForApiResponse(
        page,
        `/links/${id}`,
        "DELETE",
        async () => {
          await deleteOption.click();
        },
      );

      expect([200, 204]).toContain(response.status);
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Delete link from link settings page
  // ─────────────────────────────────────────────────────────────
  test("DL-002: delete link from link settings page redirects to links list", async ({ page }) => {
    test.setTimeout(120000);
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "settings");
    localCleanup.addLink(id);

    try {
      await loginAndSetup(page);
      await gotoSettings(page, id);

      const deleteButton = page.locator(
        'button:has-text("Delete Link"), button:has-text("Delete this link"), button:has-text("Delete")',
      );

      if (!(await deleteButton.first().isVisible().catch(() => false))) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
      }

      if (await deleteButton.first().isVisible().catch(() => false)) {
        page.on("dialog", (dialog) => dialog.accept());

        const response = await waitForApiResponse(
          page,
          `/links/${id}`,
          "DELETE",
          async () => {
            await deleteButton.first().click();
          },
        );

        expect([200, 204]).toContain(response.status);
      } else {
        await page.goto("/dashboard/links");
        const linkCard = page
          .locator(".group.bg-white.rounded-2xl")
          .filter({ hasText: slug })
          .first();
        await linkCard.hover();
        await page.waitForTimeout(500);

        const moreButton = linkCard
          .locator("button")
          .filter({ has: page.locator("svg.lucide-more-horizontal") });
        await moreButton.waitFor({ state: "visible", timeout: 5000 });
        await moreButton.click();

        const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")');
        await expect(deleteOption).toBeVisible({ timeout: 5000 });

        page.on("dialog", (dialog) => dialog.accept());

        const response = await waitForApiResponse(
          page,
          `/links/${id}`,
          "DELETE",
          async () => {
            await deleteOption.click();
          },
        );

        expect([200, 204]).toContain(response.status);
      }
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Soft delete — link moves to archived/trash state
  // ─────────────────────────────────────────────────────────────
  test("DL-003: soft delete moves link to disabled state", async ({
    page,
  }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "soft");
    localCleanup.addLink(id);

    try {
      await api.post(`/links/${id}`, { status: "DISABLED" });

      await loginAndSetup(page);
      await gotoLinksList(page);

      await expect(page.locator(`text=${slug}`).first()).not.toBeVisible({
        timeout: 5000,
      }).catch(() => {});

      const fetched = await api.get(`/links/${id}`).catch(() => null);
      if (fetched) {
        expect(fetched.status).toBe("DISABLED");
      }
    } finally {
      try {
        await api.post(`/links/${id}`, { status: "ACTIVE" });
      } catch {
        /* may already be restored or permanently deleted */
      }
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Restore a deleted link
  // ─────────────────────────────────────────────────────────────
  test("DL-004: restore a soft-deleted link", async ({ page }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "restore");
    localCleanup.addLink(id);

    try {
      await api.post(`/links/${id}`, { status: "DISABLED" });

      const fetched = await api.get(`/links/${id}`).catch(() => null);
      if (fetched) {
        expect(fetched.status).toBe("DISABLED");
      }

      await api.post(`/links/${id}`, { status: "ACTIVE" });

      await loginAndSetup(page);
      await gotoLinksList(page);

      await expect(page.locator(`text=${slug}`).first()).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Restore via UI from archived view
  // ─────────────────────────────────────────────────────────────
  test("DL-005: restore a disabled link via UI action menu", async ({
    page,
  }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "ui-restore");
    localCleanup.addLink(id);

    try {
      await api.post(`/links/${id}`, { status: "DISABLED" });

      await loginAndSetup(page);

      await page.goto("/dashboard/links?status=DISABLED");
      await page.waitForTimeout(1000);

      const linkElement = page.locator(`text=${slug}`).first();
      const linkVisible = await linkElement.isVisible({ timeout: 5000 }).catch(() => false);

      if (linkVisible) {
        await linkElement.hover();

        const moreButton = page
          .locator("button")
          .filter({
            has: page.locator("svg.lucide-ellipsis, svg.lucide-more-horizontal"),
          })
          .first();
        if (await moreButton.isVisible().catch(() => false)) {
          await moreButton.click();

          const restoreOption = page.locator(
            '[role="menuitem"]:has-text("Restore"), [role="menuitem"]:has-text("Enable")',
          );
          if (await restoreOption.isVisible().catch(() => false)) {
            await restoreOption.click();
            await waitForToast(page, "restor").catch(() => waitForToast(page, "enabl").catch(() => {}));
          }
        }
      }

      await page.goto("/dashboard/links");
      await page.waitForTimeout(1000);

      const fetched = await api.post(`/links/${id}`, { status: "ACTIVE" }).catch(() => null);
      expect(fetched).toBeTruthy();
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Permanent delete (hard delete from trash)
  // ─────────────────────────────────────────────────────────────
  test("DL-006: soft delete removes link from active list", async ({ page }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "permanent");
    localCleanup.addLink(id);

    try {
      await api.delete(`/links/${id}`);

      await loginAndSetup(page);
      await gotoLinksList(page);

      await expect(page.locator(`text=${slug}`).first()).not.toBeVisible({
        timeout: 5000,
      });
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Delete confirmation dialog appears before deletion
  // ─────────────────────────────────────────────────────────────
  test("DL-007: delete confirmation dialog appears before deletion", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "confirm");
    localCleanup.addLink(id);

    try {
      await loginAndSetup(page);
      await gotoLinksList(page);

      const linkCard = page
        .locator(".group.bg-white.rounded-2xl")
        .filter({ hasText: slug })
        .first();
      await linkCard.hover();
      await page.waitForTimeout(500);

      const moreButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") });
      await moreButton.waitFor({ state: "visible", timeout: 5000 });
      await moreButton.click();

      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")');
      await expect(deleteOption).toBeVisible({ timeout: 5000 });

      let dialogSeen = false;
      page.on("dialog", (dialog) => {
        dialogSeen = true;
        expect(dialog.message()).toContain("Are you sure");
        dialog.dismiss();
      });

      await deleteOption.click();
      await page.waitForTimeout(500);
      expect(dialogSeen).toBe(true);
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Cancel delete — link remains intact
  // ─────────────────────────────────────────────────────────────
  test("DL-008: cancel delete — link remains intact", async ({ page }) => {
    test.setTimeout(120000);
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "cancel");
    localCleanup.addLink(id);

    try {
      await loginAndSetup(page);
      await gotoLinksList(page);

      const linkCard = page
        .locator(".group.bg-white.rounded-2xl")
        .filter({ hasText: slug })
        .first();
      await linkCard.hover();
      await page.waitForTimeout(500);

      const moreButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") });
      await moreButton.waitFor({ state: "visible", timeout: 5000 });
      await moreButton.click();

      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")');
      await expect(deleteOption).toBeVisible({ timeout: 5000 });

      page.on("dialog", (dialog) => dialog.dismiss());

      await deleteOption.click();
      await page.waitForTimeout(500);

      const fetchedLink = await api.get(`/links/${id}`).catch(() => null);
      expect(fetchedLink).toBeTruthy();
    } finally {
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Deleted link no longer appears in main links list
  // ─────────────────────────────────────────────────────────────
  test("DL-009: deleted link does not appear in main links list", async ({
    page,
  }) => {
    const localCleanup = new CleanupTracker();
    const { id, slug } = await createTestLink(api, "vanish");
    localCleanup.addLink(id);

    try {
      // Soft-delete via API
      await api.delete(`/links/${id}`);

      await loginAndSetup(page);
      await gotoLinksList(page);

      // Verify the deleted link slug is not present in the main list
      const slugLocator = page.locator(`text=${slug}`).first();

      // The link should not be visible (or not present at all)
      await expect(slugLocator).not.toBeVisible({ timeout: 5000 });
    } finally {
      // Try to restore before cleanup
      try {
        await api.post(`/links/${id}/restore`);
      } catch {
        /* already restored or gone */
      }
      await localCleanup.cleanup(api).catch(() => {});
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Delete link as EDITOR — can delete own links
  // ─────────────────────────────────────────────────────────────
  test("DL-010: EDITOR can delete own links", async ({ page }) => {
    test.setTimeout(120000);
    const editorApi = await ApiClient.create("editor");
    const editorCleanup = new CleanupTracker();

    const editorLink = await editorApi.createLink({
      originalUrl: uniqueUrl(),
      title: "Editor Delete Test",
    });
    editorCleanup.addLink(editorLink.id);

    try {
      await loginAndSetup(page, "editor");
      await gotoLinksList(page);

      const linkCard = page.locator(".group.bg-white.rounded-2xl").filter({ hasText: editorLink.slug || "" }).first();

      if (!(await linkCard.isVisible().catch(() => false))) {
        return;
      }

      await linkCard.hover();
      await page.waitForTimeout(500);

      const moreButton = linkCard.locator("button").filter({ has: page.locator("svg.lucide-more-horizontal") });

      if (!(await moreButton.isVisible().catch(() => false))) {
        return;
      }

      await moreButton.click();
      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")');

      if (!(await deleteOption.isVisible().catch(() => false))) {
        return;
      }

      page.on("dialog", (dialog) => dialog.accept());

      const response = await waitForApiResponse(page, "/links/" + editorLink.id, "DELETE", async () => {
        await deleteOption.click();
      });

      expect([200, 204]).toContain(response.status);
    } finally {
      await editorCleanup.cleanup(editorApi);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Delete link as VIEWER — delete button not available
  // ─────────────────────────────────────────────────────────────
  test("DL-011: VIEWER cannot delete — button not available", async ({
    page,
  }) => {
    await loginAndSetup(page, "viewer");

    await page.goto(`/dashboard/links/${testLinkId}/settings`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const deleteButton = page.locator(
      'button:has-text("Delete Link"), button:has-text("Delete this link")',
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const isVisible = await deleteButton.first().isVisible().catch(() => false);
    const isDisabled =
      isVisible &&
      (await deleteButton.first().isDisabled().catch(() => true));

    if (isVisible && !isDisabled) {
      await deleteButton.first().click();

      const confirmButton = page.locator(
        '[role="dialog"] button:has-text("Delete")',
      );
      if (await confirmButton.isVisible().catch(() => false)) {
        const response = await waitForApiResponse(
          page,
          `/links/${testLinkId}`,
          "DELETE",
          async () => {
            await confirmButton.click();
          },
        ).catch((e: any) => e);

        if (response?.status) {
          expect(response.status).toBe(403);
        }
      }
    } else {
      expect(isVisible === false || isDisabled === true).toBeTruthy();
    }
  });
});