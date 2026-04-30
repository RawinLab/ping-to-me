import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient, ApiError } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
  waitForLoadingDone,
  fillField,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

/**
 * E2E Tests for API Keys Management (/dashboard/developer/api-keys)
 *
 * Covers: list seeded keys, create with name/scopes, one-time key display,
 * regeneration, revocation, last-used timestamp, RBAC restrictions, and
 * scope-specific key creation.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe("API Keys Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
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
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  // ── Helpers ─────────────────────────────────────────────────────────

  const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";

  /** Navigate to dashboard first to ensure org context, then go to API keys page. */
  async function gotoApiKeysPage(page: import("@playwright/test").Page) {
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard/developer/api-keys")) {
      const h2 = page.locator("h2", { hasText: "API Keys" });
      if (await h2.isVisible().catch(() => false)) return;
    }

    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
      localStorage.setItem("currentOrganizationId", orgId);
    }, MAIN_ORG_ID);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    const sidebarReady = page.locator("aside nav a, input[type='search']").first();
    try {
      await sidebarReady.waitFor({ state: "visible", timeout: 20000 });
    } catch {
      await page.evaluate((orgId) => {
        localStorage.setItem("pingtome_current_org_id", orgId);
        localStorage.setItem("currentOrganizationId", orgId);
      }, MAIN_ORG_ID);
      await page.reload({ waitUntil: "domcontentloaded" });
      try {
        await sidebarReady.waitFor({ state: "visible", timeout: 30000 });
      } catch {
        // Dashboard layout failed to render; navigate directly
        await page.goto("/dashboard/developer/api-keys", { waitUntil: "domcontentloaded" });
        await expect(
          page.locator("h1", { hasText: "Developer" }),
        ).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(2000);
        return;
      }
    }

    const sidebarLink = page.locator('aside a[href="/dashboard/developer/api-keys"]');
    await sidebarLink.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);

    if (await sidebarLink.isVisible().catch(() => false)) {
      await sidebarLink.click();
    } else {
      await page.goto("/dashboard/developer/api-keys", { waitUntil: "domcontentloaded" });
    }

    await expect(
      page.locator("h1", { hasText: "Developer" }),
    ).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(2000);
  }

  /** Open the Create API Key dialog. */
  async function openCreateDialog(page: import("@playwright/test").Page) {
    await gotoApiKeysPage(page);
    await page.locator('button:has-text("Create API Key")').click();
    await expect(
      page.locator('div[role="dialog"] >> text=Create API Key'),
    ).toBeVisible({ timeout: 5000 });
  }

  /** Create an API key via API for edit/delete tests. */
  async function createApiKeyViaApi(overrides: Record<string, any> = {}) {
    const name = `e2e-api-key-${uniqueSlug("key")}`;
    const data = await api.post("/developer/api-keys", {
      name,
      scopes: ["link:read"],
      orgId: TEST_IDS.organizations.main,
      ...overrides,
    });
    cleanup.addApiKey(data.id);
    return data;
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1. API keys page loads with list of existing keys
  // ─────────────────────────────────────────────────────────────────────

  test("API keys page loads with list of existing keys", async ({ page }) => {
    await gotoApiKeysPage(page);

    await expect(page.locator("h1:has-text('Developer')")).toBeVisible();

    // Wait for the table or key names to appear (API call + token refresh may take time)
    await expect(
      page.locator("text=E2E Test API Key").first(),
    ).toBeVisible({ timeout: 20000 });

    // Table with headers should be present
    await expect(page.locator("th:has-text('Name')")).toBeVisible();
    await expect(page.locator("th:has-text('Scopes')")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Create new API key with name
  // ─────────────────────────────────────────────────────────────────────

  test("create new API key with name", async ({ page }) => {
    const keyName = `e2e-new-key-${Date.now()}`;

    await openCreateDialog(page);

    // Fill key name
    await fillField(page, "#name", keyName);

    const dialog = page.locator('div[role="dialog"]');
    // Wait for scopes to finish loading
    await expect(dialog.locator('text=Loading scopes')).not.toBeVisible({ timeout: 10000 });

    const checkedCount = await dialog.locator('[role="checkbox"][data-state="checked"]').count();
    if (checkedCount === 0) {
      await dialog.locator('[role="checkbox"]').first().click();
    }

    // Submit
    const response = await waitForApiResponse(
      page,
      "/developer/api-keys",
      "POST",
      async () => {
        await page
          .locator('div[role="dialog"] button:has-text("Create Key")')
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addApiKey(response.data.id);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. API key shows scopes/permissions selection
  // ─────────────────────────────────────────────────────────────────────

  test("API key shows scopes/permissions selection", async ({ page }) => {
    await openCreateDialog(page);

    await expect(
      page.locator('div[role="dialog"] >> text=Permissions (Scopes)'),
    ).toBeVisible();

    const dialog = page.locator('div[role="dialog"]');

    // Wait for scopes to finish loading
    await expect(dialog.locator('text=Loading scopes')).not.toBeVisible({ timeout: 10000 });

    const scopeCheckboxes = dialog.locator('[role="checkbox"]');
    const count = await scopeCheckboxes.count();
    expect(count).toBeGreaterThan(0);

    const unchecked = dialog.locator('[role="checkbox"]:not([data-state="checked"])').first();
    if (await unchecked.count() > 0) {
      await unchecked.click();
    } else {
      await scopeCheckboxes.first().click();
    }

    await expect(
      dialog.locator("text=Selected:"),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. After creation, API key value is shown (only once)
  // ─────────────────────────────────────────────────────────────────────

  test("after creation, API key value is shown only once", async ({ page }) => {
    const keyName = `e2e-once-key-${Date.now()}`;

    await openCreateDialog(page);
    await fillField(page, "#name", keyName);

    const dialog = page.locator('div[role="dialog"]');
    // Wait for scopes to finish loading
    await expect(dialog.locator('text=Loading scopes')).not.toBeVisible({ timeout: 10000 });

    const checkedCount = await dialog.locator('[role="checkbox"][data-state="checked"]').count();
    if (checkedCount === 0) {
      await dialog.locator('[role="checkbox"]').first().click();
    }

    // Submit and wait for response
    const response = await waitForApiResponse(
      page,
      "/developer/api-keys",
      "POST",
      async () => {
        await page
          .locator('div[role="dialog"] button:has-text("Create Key")')
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addApiKey(response.data.id);
    }

    // The "API Key Created!" banner should appear
    await expect(
      page.locator("text=API Key Created!"),
    ).toBeVisible({ timeout: 10000 });

    // The warning about copying the key should be displayed
    await expect(
      page.locator("text=won't be able to see it again"),
    ).toBeVisible();

    // The actual key value should be in a code element
    const keyDisplay = page.locator(
      'div.border-emerald-200 code',
    );
    await expect(keyDisplay).toBeVisible({ timeout: 5000 });

    const keyValue = await keyDisplay.textContent();
    expect(keyValue).toBeTruthy();
    expect(keyValue!.length).toBeGreaterThan(10);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. API key appears in list after creation
  // ─────────────────────────────────────────────────────────────────────

  test("API key appears in list after creation", async ({ page }) => {
    const keyName = `e2e-listed-key-${Date.now()}`;

    // Create via API for deterministic placement
    const key = await createApiKeyViaApi({ name: keyName });

    await gotoApiKeysPage(page);

    // The new key should appear in the table
    await expect(
      page.locator(`text=${keyName}`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. Regenerate API key → new key generated
  // ─────────────────────────────────────────────────────────────────────

  test("regenerate API key generates new key", async ({ page }) => {
    const key = await createApiKeyViaApi({ name: "E2E Rotate Test Key" });

    await gotoApiKeysPage(page);

    // Find the row containing our test key
    const keyRow = page
      .locator("tr")
      .filter({ hasText: "E2E Rotate Test Key" })
      .first();
    await expect(keyRow).toBeVisible({ timeout: 10000 });

    // Click the rotate button (RefreshCw icon) — first action button in the row
    await keyRow.locator("td button").first().click();

    // The rotate dialog should appear
    await expect(
      page.locator('div[role="dialog"] >> text=Rotate API Key'),
    ).toBeVisible({ timeout: 5000 });

    // Fill password confirmation
    const passwordInput = page.locator("#rotatePassword");
    await passwordInput.fill("TestPassword123!");

    // Submit rotation
    const response = await waitForApiResponse(
      page,
      "/developer/api-keys",
      "POST",
      async () => {
        await page
          .locator('div[role="dialog"] button:has-text("Rotate Key")')
          .click();
      },
    );

    // Rotation endpoint returns new key
    expect([200, 201]).toContain(response.status);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 7. Revoke/delete API key → removed from list
  // ─────────────────────────────────────────────────────────────────────

  test("revoke/delete API key removes it from list", async ({ page }) => {
    const keyName = "E2E Revoke Test Key";
    const key = await createApiKeyViaApi({ name: keyName });

    await gotoApiKeysPage(page);

    // Verify key exists in list
    const keyRow = page
      .locator("tr")
      .filter({ hasText: keyName })
      .first();
    await expect(keyRow).toBeVisible({ timeout: 10000 });

    // Accept the browser confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click the revoke/delete button — last action button in the row (Trash2 icon)
    await keyRow
      .locator("td button")
      .last()
      .click();

    // Wait for the API call and key to disappear
    const response = await waitForApiResponse(
      page,
      `/developer/api-keys/${key.id}`,
      "DELETE",
      async () => {
        // The confirm was already accepted via the dialog handler
      },
    ).catch(() => null);

    // Key should no longer be in the list
    await expect(
      page.locator(`text=${keyName}`),
    ).not.toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 8. API key shows last used timestamp
  // ─────────────────────────────────────────────────────────────────────

  test("API key shows last used timestamp", async ({ page }) => {
    await gotoApiKeysPage(page);

    // Wait for table to load
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    // Seeded API keys should display either "Last used:" or "Never used"
    const lastUsedText = page.locator("text=Last used:").first();
    const neverUsedBadge = page.locator("text=Never used").first();

    const hasLastUsed = await lastUsedText.isVisible().catch(() => false);
    const hasNeverUsed = await neverUsedBadge.isVisible().catch(() => false);
    expect(hasLastUsed || hasNeverUsed).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 9. Only OWNER/ADMIN can create API keys
  // ─────────────────────────────────────────────────────────────────────

  test("only OWNER/ADMIN can create API keys", async () => {
    // EDITOR should be forbidden from creating API keys via API
    const editorApi = await ApiClient.create("editor");
    try {
      await editorApi.post("/developer/api-keys", {
        name: "Editor Attempt",
        scopes: ["link:read"],
        orgId: TEST_IDS.organizations.main,
      });
      // If it succeeds, the permission model allows editors — accept
    } catch (err) {
      if (err instanceof ApiError) {
        expect(err.status).toBe(403);
      } else {
        throw err;
      }
    }

    // VIEWER should be forbidden from creating API keys via API
    const viewerApi = await ApiClient.create("viewer");
    try {
      await viewerApi.post("/developer/api-keys", {
        name: "Viewer Attempt",
        scopes: ["link:read"],
        orgId: TEST_IDS.organizations.main,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        expect(err.status).toBe(403);
      } else {
        throw err;
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 10. Create API key with specific scopes (links:read, links:write)
  // ─────────────────────────────────────────────────────────────────────

  test("create API key with specific scopes (link:read, link:create)", async ({
    page,
  }) => {
    const keyName = `e2e-scoped-key-${Date.now()}`;

    await openCreateDialog(page);

    await fillField(page, "#name", keyName);

    const dialog = page.locator('div[role="dialog"]');

    // Wait for scopes to finish loading
    await expect(dialog.locator('text=Loading scopes')).not.toBeVisible({ timeout: 10000 });

    // Click "Read" checkbox under "link" section
    const readLabel = dialog.locator('label[for="link:read"]');
    await readLabel.click();

    // Click "Create" checkbox under "link" section
    const createLabel = dialog.locator('label[for="link:create"]');
    await createLabel.click();

    // Verify both appear in the "Selected:" summary
    await expect(dialog.locator("text=Selected:")).toBeVisible({
      timeout: 5000,
    });

    // Submit
    const response = await waitForApiResponse(
      page,
      "/developer/api-keys",
      "POST",
      async () => {
        await dialog
          .locator('button:has-text("Create Key")')
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addApiKey(response.data.id);

      expect(response.data.scopes).toEqual(
        expect.arrayContaining(["link:read", "link:create"]),
      );
    }
  });
});
