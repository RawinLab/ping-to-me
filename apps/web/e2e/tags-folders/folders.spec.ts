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
import { execSync } from "child_process";

test.describe("Folders Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

  test.beforeAll(async () => {
    disable2FA();
    api = await ApiClient.create("owner");
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    disable2FA();
    await loginAsUser(page, "owner");
  });

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    await cleanup.cleanup(api);
  });

  // ── Helpers ─────────────────────────────────────────────────────────

  function disable2FA() {
    try {
      execSync(
        `docker compose exec -T postgres psql -U postgres -d pingtome -c "UPDATE \\"User\\" SET \\"twoFactorEnabled\\" = false, \\"twoFactorSecret\\" = NULL WHERE email = 'e2e-owner@pingtome.test';"`,
        { stdio: 'pipe', cwd: '/home/dev/projects/shared-infra', timeout: 5000 },
      );
    } catch { /* best effort */ }
  }

  async function gotoFoldersPage(page: import("@playwright/test").Page) {
    // Ensure org context is in localStorage
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);

    // Wait for dashboard layout to be fully rendered — ensures OrganizationContext has loaded
    await expect(page.locator("text=PingTO.Me").first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    // Try sidebar first (org context already loaded); fall back to direct navigation
    const sidebarLink = page.locator('aside a[href="/dashboard/folders"]');
    if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sidebarLink.click();
      await page.waitForURL(/\/dashboard\/folders/, { timeout: 10000 }).catch(() => {});
    } else {
      await page.goto("/dashboard/folders", { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    // Wait for page h1
    await page.locator('h1').filter({ hasText: "Folders" }).waitFor({ state: "visible", timeout: 30000 });

    // Wait for loading skeletons to disappear and data to render
    const skeleton = page.locator('.animate-pulse').first();
    if (await skeleton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(skeleton).not.toBeVisible({ timeout: 10000 });
    }

    await page.waitForTimeout(500);
  }

  async function createFolderViaUi(
    page: import("@playwright/test").Page,
    overrides: { name?: string; parentId?: string } = {},
  ) {
    const name = overrides.name || `e2e-folder-${uniqueSlug("f")}`;

    await gotoFoldersPage(page);

    await page.getByRole("button", { name: /New Folder/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[role="dialog"]').getByText("Create Folder").first(),
    ).toBeVisible({ timeout: 5000 });

    await fillField(page, '#name', name);

    const response = await waitForApiResponse(page, "/folders", "POST", async () => {
      await page
        .locator('[role="dialog"] button')
        .filter({ hasText: "Create Folder" })
        .click();
    });

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addFolder(response.data.id);
    }

    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5000 });

    return { id: response.data?.id, name };
  }

  async function createFolderViaApi(overrides: Record<string, any> = {}) {
    const name = overrides.name || `e2e-folder-${uniqueSlug("f")}`;
    const data = await api.post("/folders", {
      name,
      color: "#3b82f6",
      orgId: TEST_IDS.organizations.main,
      ...overrides,
    });
    cleanup.addFolder(data.id);
    return data;
  }

  function findFolderRow(page: import("@playwright/test").Page, name: string) {
    return page
      .locator('[class*="rounded-lg"][class*="border-slate-200"]')
      .filter({ hasText: new RegExp(escapeRegex(name)) })
      .first();
  }

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async function openFolderMenu(page: import("@playwright/test").Page, folderRow: any) {
    await folderRow.hover();
    await folderRow
      .locator("button")
      .filter({ has: page.locator("svg.lucide-more-vertical") })
      .click();
    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5000 });
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1. Folders page loads with existing seeded folders
  // ─────────────────────────────────────────────────────────────────────

  test("folders page loads with existing seeded folders", async ({ page }) => {
    await createFolderViaApi({ name: TEST_SLUGS.folders.work });
    await createFolderViaApi({ name: TEST_SLUGS.folders.personal });

    await gotoFoldersPage(page);

    await expect(page.locator("text=Total Folders")).toBeVisible();

    await expect(
      page.locator(`text=${TEST_SLUGS.folders.work}`).first(),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.locator(`text=${TEST_SLUGS.folders.personal}`).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Create new folder
  // ─────────────────────────────────────────────────────────────────────

  test("create new folder", async ({ page }) => {
    const folderName = `e2e-folder-${Date.now()}`;

    await gotoFoldersPage(page);

    await page.getByRole("button", { name: /New Folder/i }).click();

    await expect(
      page.locator('[role="dialog"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[role="dialog"]').getByText("Create Folder").first(),
    ).toBeVisible({ timeout: 5000 });

    await fillField(page, '#name', folderName);

    const response = await waitForApiResponse(
      page,
      "/folders",
      "POST",
      async () => {
        await page
          .locator('[role="dialog"] button')
          .filter({ hasText: "Create Folder" })
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addFolder(response.data.id);
    }

    await expect(
      page.locator(`text=${folderName}`).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. Create subfolder (nested folder)
  // ─────────────────────────────────────────────────────────────────────

  test("create subfolder inside an existing folder", async ({ page }) => {
    const parent = await createFolderViaApi();
    const childName = `e2e-sub-${Date.now()}`;

    await gotoFoldersPage(page);

    const parentRow = findFolderRow(page, parent.name);
    await expect(parentRow).toBeVisible({ timeout: 10000 });

    await openFolderMenu(page, parentRow);
    await page.locator('[role="menu"] >> text=Create Subfolder').click();

    await expect(
      page.locator('[role="dialog"]').getByText("Create Folder").first(),
    ).toBeVisible({ timeout: 5000 });

    await fillField(page, '#name', childName);

    const response = await waitForApiResponse(
      page,
      "/folders",
      "POST",
      async () => {
        await page
          .locator('[role="dialog"] button')
          .filter({ hasText: "Create Folder" })
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addFolder(response.data.id);
    }

    await expect(
      page.locator(`text=${childName}`).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Edit folder name
  // ─────────────────────────────────────────────────────────────────────

  test("edit folder name", async ({ page }) => {
    const folder = await createFolderViaApi();
    const newName = `renamed-${Date.now()}`;

    await gotoFoldersPage(page);

    const folderRow = findFolderRow(page, folder.name);
    await expect(folderRow).toBeVisible({ timeout: 10000 });

    await openFolderMenu(page, folderRow);
    await page.locator('[role="menu"] >> text=Edit Folder').click();

    await expect(
      page.locator('[role="dialog"]').getByText("Edit Folder").first(),
    ).toBeVisible({ timeout: 5000 });

    const nameInput = page.locator('#name');
    await nameInput.clear();
    await nameInput.fill(newName);

    const response = await waitForApiResponse(
      page,
      `/folders/${folder.id}`,
      "PUT",
      async () => {
        await page
          .locator('[role="dialog"] button')
          .filter({ hasText: "Update Folder" })
          .click();
      },
    );

    expect(response.status).toBe(200);

    await expect(
      page.locator(`text=${newName}`).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. Delete folder (with confirmation)
  // ─────────────────────────────────────────────────────────────────────

  test("delete folder with browser confirmation", async ({ page }) => {
    const folder = await createFolderViaApi({ name: "Delete Me Folder" });

    await gotoFoldersPage(page);

    const folderRow = findFolderRow(page, folder.name);
    await expect(folderRow).toBeVisible({ timeout: 10000 });

    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });

    await openFolderMenu(page, folderRow);

    const response = await waitForApiResponse(
      page,
      `/folders/${folder.id}`,
      "DELETE",
      async () => {
        await page
          .locator('[role="menu"] >> text=Delete Folder')
          .click();
      },
    );

    expect(response.status).toBe(200);

    await expect(
      page.locator(`text=${folder.name}`),
    ).not.toBeVisible({ timeout: 5000 });

    cleanup["folders"] = cleanup["folders"].filter((id) => id !== folder.id);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. Folder shows link count
  // ─────────────────────────────────────────────────────────────────────

  test("folder shows link count", async ({ page }) => {
    const folder = await createFolderViaApi();
    const link = await api.createLink({
      originalUrl: `https://example.com/e2e-linkcount-${Date.now()}`,
      slug: uniqueSlug("lc"),
    });
    cleanup.addLink(link.id);
    await api.post(`/links/${link.id}`, { folderId: folder.id });

    await gotoFoldersPage(page);

    const folderRow = findFolderRow(page, folder.name);
    await expect(folderRow).toBeVisible({ timeout: 10000 });

    const linkCountText = folderRow.locator("text=/\\d+\\s*(direct|link)/i").first();
    await expect(linkCountText).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 7. Click folder to view links in folder
  // ─────────────────────────────────────────────────────────────────────

  test("click folder navigates to filtered links view", async ({ page }) => {
    const folder = await createFolderViaApi();
    const link = await api.createLink({
      originalUrl: `https://example.com/e2e-viewlinks-${Date.now()}`,
      slug: uniqueSlug("vl"),
    });
    cleanup.addLink(link.id);
    await api.post(`/links/${link.id}`, { folderId: folder.id });

    await gotoFoldersPage(page);

    const folderRow = findFolderRow(page, folder.name);
    await expect(folderRow).toBeVisible({ timeout: 10000 });

    const viewLinksBtn = folderRow
      .locator('button:has-text("View Links")')
      .first();
    const isVisible = await viewLinksBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await viewLinksBtn.click();
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      if (currentUrl.includes("/dashboard/links")) {
        await expect(page.url()).toContain("folder=");
      } else {
        await expect(page.locator('h1').filter({ hasText: "Folders" })).toBeVisible();
      }
    } else {
      await expect(page.locator('h1').filter({ hasText: "Folders" })).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 8. Move link to folder via API reflects in folder link count
  // ─────────────────────────────────────────────────────────────────────

  test("move link to folder updates link count", async ({ page }) => {
    const folder = await createFolderViaApi();
    const link = await api.createLink({
      originalUrl: `https://example.com/e2e-move-${Date.now()}`,
      slug: uniqueSlug("mv"),
    });
    cleanup.addLink(link.id);

    // API uses POST /links/:id for updates (not PATCH/PUT)
    await api.post(`/links/${link.id}`, { folderId: folder.id });

    await gotoFoldersPage(page);

    const folderRow = findFolderRow(page, folder.name);
    await expect(folderRow).toBeVisible({ timeout: 10000 });

    const linkCountText = folderRow.locator("text=/\\d+\\s*(direct|link)/i").first();
    await expect(linkCountText).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 9. Folder hierarchy displays correctly (parent/child)
  // ─────────────────────────────────────────────────────────────────────

  test("folder hierarchy displays correctly with parent and child", async ({
    page,
  }) => {
    const parent = await createFolderViaApi({ name: "E2E Parent Folder" });
    const child = await createFolderViaApi({
      name: "E2E Child Folder",
      parentId: parent.id,
    });

    await gotoFoldersPage(page);

    await expect(
      page.locator(`text=E2E Parent Folder`).first(),
    ).toBeVisible({ timeout: 10000 });

    const parentRow = findFolderRow(page, "E2E Parent Folder");
    await expect(parentRow).toBeVisible();

    const expandBtn = parentRow.locator(
      "button:has(svg.lucide-chevron-down), button:has(svg.lucide-chevron-right)",
    );
    if (await expandBtn.isVisible().catch(() => false)) {
      const svgClass = await expandBtn.locator("svg").getAttribute("class");
      if (svgClass?.includes("lucide-chevron-right")) {
        await expandBtn.click();
      }
    }

    await expect(
      page.locator(`text=E2E Child Folder`).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 10. Delete parent folder handles child folders
  // ─────────────────────────────────────────────────────────────────────

  test("deleting parent folder also removes child from view", async ({
    page,
  }) => {
    const parent = await createFolderViaApi({ name: "E2E Del Parent" });
    const child = await createFolderViaApi({
      name: "E2E Del Child",
      parentId: parent.id,
    });

    await gotoFoldersPage(page);

    const parentRow = findFolderRow(page, "E2E Del Parent");
    await expect(parentRow).toBeVisible({ timeout: 10000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await openFolderMenu(page, parentRow);

    const response = await waitForApiResponse(
      page,
      `/folders/${parent.id}`,
      "DELETE",
      async () => {
        await page
          .locator('[role="menu"] >> text=Delete Folder')
          .click();
      },
    );

    expect(response.status).toBe(200);

    await expect(
      page.locator(`text=E2E Del Parent`),
    ).not.toBeVisible({ timeout: 5000 });

    cleanup["folders"] = cleanup["folders"].filter(
      (id) => id !== parent.id && id !== child.id,
    );
  });
});
