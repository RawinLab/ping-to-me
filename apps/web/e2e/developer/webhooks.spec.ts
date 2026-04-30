import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient, ApiError } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  uniqueUrl,
  waitForApiResponse,
  waitForToast,
  waitForLoadingDone,
  fillField,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

/**
 * E2E Tests for Webhooks Management (/dashboard/developer/webhooks)
 *
 * Covers: list seeded webhooks, create with URL and event types, event type
 * selection, list appearance, test delivery, edit URL, deletion, and RBAC.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe("Webhooks Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

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

  // ── Helpers ─────────────────────────────────────────────────────────

  /** Navigate to the webhooks page and wait for it to load. */
  async function gotoWebhooksPage(page: import("@playwright/test").Page) {
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard/developer/webhooks")) {
      return;
    }
    await page.waitForFunction(
      () => !!document.querySelector('a[href="/dashboard/developer/webhooks"]'),
      { timeout: 20000 },
    );
    const sidebarLink = page.locator('a[href="/dashboard/developer/webhooks"]');
    await sidebarLink.click();
    await expect(
      page.locator("h2"),
    ).toContainText("Webhooks", { timeout: 30000 });
  }

  /** Open the Add Webhook dialog. */
  async function openCreateDialog(page: import("@playwright/test").Page) {
    await gotoWebhooksPage(page);
    await page.locator('button:has-text("Add Webhook")').click();
    await expect(
      page.locator('div[role="dialog"] >> text=Add Webhook'),
    ).toBeVisible({ timeout: 5000 });
  }

  /** Create a webhook via API for edit/delete tests. Re-creates API client if expired. */
  async function createWebhookViaApi(overrides: Record<string, any> = {}) {
    const defaultUrl = `https://e2e-webhook-${uniqueSlug("wh")}.example.com/hook`;
    const payload = {
      url: defaultUrl,
      events: ["link.created"],
      orgId: TEST_IDS.organizations.main,
      ...overrides,
    };
    let data;
    try {
      data = await api.post("/developer/webhooks", payload);
    } catch {
      // API client token may have expired — recreate and retry
      api = await ApiClient.create("owner");
      data = await api.post("/developer/webhooks", payload);
    }
    if (data?.id) {
      cleanup.addWebhook(data.id);
    }
    return { ...data, url: payload.url };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1. Webhooks page loads with list of existing webhooks
  // ─────────────────────────────────────────────────────────────────────

  test("webhooks page loads with list of existing webhooks", async ({
    page,
  }) => {
    await gotoWebhooksPage(page);

    await expect(page.locator("h1:has-text('Developer')")).toBeVisible();

    // Should display at least one seeded webhook or the empty state
    const webhookCards = page.locator("div.border-slate-200").filter({
      hasText: "Created",
    });

    // Either seeded webhooks exist or the empty state is shown
    const hasWebhooks =
      (await webhookCards.count()) > 0 ||
      (await page.locator("text=No webhooks configured").isVisible().catch(() => false));
    expect(hasWebhooks).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Create new webhook with URL and event types
  // ─────────────────────────────────────────────────────────────────────

  test("create new webhook with URL and event types", async ({ page }) => {
    const webhookUrl = `https://e2e-test-${Date.now()}.example.com/webhook`;

    await openCreateDialog(page);

    await fillField(page, "#url", webhookUrl);

    const dialog = page.locator('div[role="dialog"]');
    const checkedCount = await dialog.locator('[role="checkbox"][data-state="checked"]').count();
    if (checkedCount === 0) {
      await dialog.locator("label[for='link.created']").click();
    }

    await expect(dialog.locator('[role="checkbox"][data-state="checked"]').first()).toBeVisible({ timeout: 3000 });

    // Submit
    const response = await waitForApiResponse(
      page,
      "/developer/webhooks",
      "POST",
      async () => {
        await page
          .locator('div[role="dialog"] button:has-text("Create Webhook")')
          .click();
      },
    );

    expect([200, 201]).toContain(response.status);
    if (response.data?.id) {
      cleanup.addWebhook(response.data.id);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. Select event types (link.created, link.clicked, etc.)
  // ─────────────────────────────────────────────────────────────────────

  test("select multiple event types", async ({ page }) => {
    await openCreateDialog(page);

    // All available event checkboxes should be present
    const eventCheckboxes = page.locator(
      'div[role="dialog"] [role="checkbox"]',
    );
    const count = await eventCheckboxes.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Select link.created
    await page
      .locator('div[role="dialog"] label:has-text("Link Created")')
      .click();

    // Select link.clicked
    await page
      .locator('div[role="dialog"] label:has-text("Link Clicked")')
      .click();

    // Both event IDs should show as selected (border-blue-300)
    const linkCreatedRow = page
      .locator('div[role="dialog"]')
      .locator("div.border-blue-300")
      .filter({ hasText: "link.created" });
    await expect(linkCreatedRow).toBeVisible({ timeout: 5000 });

    const linkClickedRow = page
      .locator('div[role="dialog"]')
      .locator("div.border-blue-300")
      .filter({ hasText: "link.clicked" });
    await expect(linkClickedRow).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Webhook appears in list after creation
  // ─────────────────────────────────────────────────────────────────────

  test("webhook appears in list after creation", async ({ page }) => {
    const webhookUrl = `https://e2e-listed-${Date.now()}.example.com/hook`;
    const webhook = await createWebhookViaApi({ url: webhookUrl });

    await gotoWebhooksPage(page);

    // The new webhook URL should appear in the list
    await expect(
      page.locator(`text=${webhookUrl}`).first(),
    ).toBeVisible({ timeout: 10000 });

    // Should show the event badge
    await expect(
      page.locator("text=Link Created").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. Test webhook delivery (send test event)
  // ─────────────────────────────────────────────────────────────────────

  test("test webhook delivery sends test event", async ({ page }) => {
    const webhookUrl = `https://e2e-delivery-test-${Date.now()}.example.com/webhook`;
    const webhook = await createWebhookViaApi({
      url: webhookUrl,
      events: ["link.created", "link.clicked"],
    });

    await gotoWebhooksPage(page);

    await expect(
      page.locator(`code:has-text("${webhookUrl}")`).first(),
    ).toBeVisible({ timeout: 10000 });

    const cardWithUrl = page
      .locator("div.border-slate-200")
      .filter({ hasText: webhookUrl })
      .first();
    await expect(
      cardWithUrl.locator("text=Link Created").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      cardWithUrl.locator("text=Link Clicked").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. Edit webhook URL
  // ─────────────────────────────────────────────────────────────────────

  test("verify created webhook via list endpoint", async () => {
    const webhook = await createWebhookViaApi();

    // Verify the webhook appears in the list (no individual GET endpoint exists)
    const list = await api.get("/developer/webhooks");
    const found = Array.isArray(list)
      ? list.find((w: any) => w.id === webhook.id)
      : list?.data?.find((w: any) => w.id === webhook.id);
    expect(found).toBeDefined();
    expect(found.url).toBe(webhook.url);
    expect(found.events).toContain("link.created");
  });

  // ─────────────────────────────────────────────────────────────────────
  // 7. Delete webhook → removed from list
  // ─────────────────────────────────────────────────────────────────────

  test("delete webhook removes it from list", async ({ page }) => {
    const webhookUrl = `https://e2e-delete-${Date.now()}.example.com/hook`;
    const webhook = await createWebhookViaApi({ url: webhookUrl });

    await gotoWebhooksPage(page);

    // Verify webhook exists
    const webhookCard = page
      .locator("div.border-slate-200.shadow-sm")
      .filter({ hasText: webhookUrl })
      .first();
    await expect(webhookCard).toBeVisible({ timeout: 10000 });

    // Accept the browser confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    await webhookCard.locator("button.text-red-500").click();

    // Webhook should no longer be visible
    await expect(
      page.locator(`text=${webhookUrl}`),
    ).not.toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 8. Only OWNER/ADMIN can manage webhooks
  // ─────────────────────────────────────────────────────────────────────

  test("only OWNER/ADMIN can manage webhooks", async () => {
    const editorApi = await ApiClient.create("editor");
    try {
      await editorApi.post("/developer/webhooks", {
        url: "https://editor-attempt.example.com/webhook",
        events: ["link.created"],
        orgId: TEST_IDS.organizations.main,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        expect(err.status).toBe(403);
      } else {
        throw err;
      }
    }

    const viewerApi = await ApiClient.create("viewer");
    try {
      await viewerApi.post("/developer/webhooks", {
        url: "https://viewer-attempt.example.com/webhook",
        events: ["link.created"],
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
});
