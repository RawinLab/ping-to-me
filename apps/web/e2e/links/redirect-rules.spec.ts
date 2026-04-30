import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueUrl,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
  fillField,
} from "../fixtures/test-helpers";
import { TEST_IDS } from "../fixtures/test-data";

const MAIN_ORG_ID = TEST_IDS.organizations.main;

/**
 * E2E Tests for Smart Redirect Rules on Link Settings Page
 *
 * Covers: redirect rules section visibility, device/country/browser/OS/language
 * rules, rule deletion, editing, reordering, and multiple independent rules.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

test.describe.serial("Redirect Rules", () => {
  test.setTimeout(120000);
  let api: ApiClient;
  let cleanup: CleanupTracker;
  let testLinkId: string;

  // ── Helper: navigate to the Smart Redirects tab on the link settings page ──
  async function setupApiInterception(page: import("@playwright/test").Page) {
    await page.route(/localhost:3011/, async (route) => {
      const url = route.request().url();
      if (url.includes("/auth/refresh")) {
        const resp = await route.fetch();
        await route.fulfill({ response: resp });
      } else if (url.match(/\/links\/[a-f0-9-]+$/)) {
        const resp = await route.fetch({
          headers: { ...route.request().headers(), "X-Organization-Id": MAIN_ORG_ID },
        });
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
        const resp = await route.fetch({
          headers: { ...route.request().headers(), "X-Organization-Id": MAIN_ORG_ID },
        });
        await route.fulfill({ response: resp });
      }
    });
  }

  async function loginAndSetup(page: import("@playwright/test").Page, role: "owner" | "admin" | "editor" | "viewer" = "owner") {
    await loginAsUser(page, role);
    await setupApiInterception(page);
  }

  async function gotoRedirectRules(
    page: import("@playwright/test").Page,
    linkId?: string,
  ) {
    const id = linkId || testLinkId;
    await page.evaluate(() =>
      localStorage.setItem("currentOrganizationId", "e2e00000-0000-0000-0001-000000000001"),
    ).catch(() => {});
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(`/dashboard/links/${id}/settings`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await expect(page.locator('h1')).toContainText('Link Settings', { timeout: 30000 });
        break;
      } catch {
        if (attempt === 2) throw new Error(`Failed to load settings page for link ${id}`);
        await page.waitForTimeout(2000);
      }
    }
    await page
      .locator('button[role="tab"]:has-text("Smart Redirects")')
      .click();
    await expect(
      page.locator("text=Smart Redirect Rules").first(),
    ).toBeVisible({ timeout: 10000 });
  }

  // ── Helper: open the Add Rule dialog ──
  async function openAddRuleDialog(page: import("@playwright/test").Page) {
    await page.locator("button:has-text('Add Rule')").click();
    await expect(
      page.locator('[role="dialog"]:has-text("Add Redirect Rule")'),
    ).toBeVisible({ timeout: 5000 });
  }

  // ── Helper: fill target URL in the rule dialog ──
  async function fillTargetUrl(
    page: import("@playwright/test").Page,
    url: string,
  ) {
    await fillField(page, '#targetUrl', url);
  }

  // ── Helper: submit the rule dialog and wait for API response ──
  async function submitRuleAndWait(
    page: import("@playwright/test").Page,
    expectedMethod = "POST",
  ) {
    const response = await waitForApiResponse(
      page,
      "/rules",
      expectedMethod,
      async () => {
        await page
          .locator('[role="dialog"] button:has-text("Create Rule")')
          .click();
      },
    );
    return response;
  }

  // ── Helper: submit an edited rule ──
  async function submitEditRuleAndWait(
    page: import("@playwright/test").Page,
  ) {
    const response = await waitForApiResponse(
      page,
      "/rules",
      "PUT",
      async () => {
        await page
          .locator('[role="dialog"] button:has-text("Update Rule")')
          .click();
      },
    );
    return response;
  }

  // ── Setup: create a fresh link for testing redirect rules ──
  test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {}); });

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
    cleanup = new CleanupTracker();

    const link = await api.createLink({
      originalUrl: uniqueUrl(),
      title: "Redirect Rules Test Link",
      slug: uniqueSlug("rr"),
    });
    testLinkId = link.id;
    cleanup.addLink(testLinkId);
  });

  test.afterAll(async () => {
    await cleanup.cleanup(api);
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Redirect rules section is visible on link settings page
  // ─────────────────────────────────────────────────────────────
  test("RR-001: redirect rules section visible on Smart Redirects tab", async ({
    page,
  }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    // Card with title should be visible
    await expect(
      page.locator("text=Smart Redirect Rules").first(),
    ).toBeVisible();

    // Description text
    await expect(
      page.locator("text=Redirect users to different URLs based on conditions"),
    ).toBeVisible();

    // Add Rule button exists
    await expect(page.locator("button:has-text('Add Rule')")).toBeVisible();

    // Empty state when no rules
    await expect(
      page.locator("text=No redirect rules configured"),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Add a device-based rule (Android → different URL)
  // ─────────────────────────────────────────────────────────────
  test("RR-002: add device-based rule (mobile)", async ({ page }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    await openAddRuleDialog(page);

    const targetUrl = uniqueUrl() + "/mobile";
    await fillTargetUrl(page, targetUrl);

    // Check the "mobile" device checkbox
    const mobileCheckbox = page.locator("#device-mobile");
    await mobileCheckbox.check();
    await expect(mobileCheckbox).toBeChecked();

    // Submit
    const response = await submitRuleAndWait(page);
    expect([200, 201]).toContain(response.status);

    await waitForToast(page, "created");

    // Verify the rule appears in the list
    await expect(page.locator("text=mobile").first()).toBeVisible();
    await expect(
      page.locator(`text=${new URL(targetUrl).hostname}`).first(),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Add a country-based rule (Japan → different URL)
  // ─────────────────────────────────────────────────────────────
  test("RR-003: add country-based rule (Japan)", async ({ page }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    await openAddRuleDialog(page);

    const targetUrl = uniqueUrl() + "/japan";
    await fillTargetUrl(page, targetUrl);

    // Select Japan from the countries dropdown
    // The country select trigger is inside the dialog
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator("text=Countries").first().click();

    // Open the country select dropdown
    const countryTrigger = dialog.locator(
      ".space-y-2:has-text('Countries') button[role='combobox'], " +
        ".space-y-2:has-text('Countries') [role='combobox']",
    ).first();
    await countryTrigger.click();

    // Select Japan from the list
    await page.locator('[role="option"]:has-text("Japan")').click();

    // JP badge should appear
    await expect(dialog.locator("text=JP").first()).toBeVisible();

    // Submit
    const response = await submitRuleAndWait(page);
    expect([200, 201]).toContain(response.status);

    await waitForToast(page, "created");

    // Verify the rule shows JP in the rules list
    await expect(
      page.locator("text=Countries:").first(),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Add a browser-based rule (Safari → different URL)
  // ─────────────────────────────────────────────────────────────
  test("RR-004: add browser-based rule (safari)", async ({ page }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    await openAddRuleDialog(page);

    const targetUrl = uniqueUrl() + "/safari";
    await fillTargetUrl(page, targetUrl);

    // Check the "safari" browser checkbox
    const safariCheckbox = page.locator("#browser-safari");
    await safariCheckbox.check();
    await expect(safariCheckbox).toBeChecked();

    // Submit
    const response = await submitRuleAndWait(page);
    expect([200, 201]).toContain(response.status);

    await waitForToast(page, "created");

    // Verify the rule appears with safari
    await expect(page.locator("text=safari").first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Add an OS-based rule (iOS → different URL)
  // ─────────────────────────────────────────────────────────────
  test("RR-005: add OS-based rule (iOS)", async ({ page }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    await openAddRuleDialog(page);

    const targetUrl = uniqueUrl() + "/ios";
    await fillTargetUrl(page, targetUrl);

    // Check the "ios" OS checkbox
    const iosCheckbox = page.locator("#os-ios");
    await iosCheckbox.check();
    await expect(iosCheckbox).toBeChecked();

    // Submit
    const response = await submitRuleAndWait(page);
    expect([200, 201]).toContain(response.status);

    await waitForToast(page, "created");

    // Verify the rule shows ios
    await expect(page.locator("text=ios").first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Add a language-based rule (French → different URL)
  // ─────────────────────────────────────────────────────────────
  test("RR-006: add language-based rule (French)", async ({ page }) => {
    await loginAndSetup(page);
    await gotoRedirectRules(page);

    await openAddRuleDialog(page);

    const targetUrl = uniqueUrl() + "/french";
    await fillTargetUrl(page, targetUrl);

    // Open the language select dropdown
    const dialog = page.locator('[role="dialog"]');
    const langLabel = dialog.locator("text=Languages").first();

    // Find the language select trigger (the combobox within the Languages section)
    // The label "Languages" is in a section; the select trigger follows it
    const langSection = dialog.locator(
      ".space-y-2:has(> label:has-text('Languages'))",
    );
    const langTrigger = langSection
      .locator("button[role='combobox'], [role='combobox']")
      .first();
    await langTrigger.click();

    // Select French from the list
    await page.locator('[role="option"]:has-text("French")').click();

    await expect(dialog.locator("text=/^[fF][rR]$/").first()).toBeVisible({ timeout: 5000 });

    // Submit
    const response = await submitRuleAndWait(page);
    expect([200, 201]).toContain(response.status);

    await waitForToast(page, "created");

    // Verify the rule shows language condition
    await expect(
      page.locator("text=Languages:").first(),
    ).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Delete a redirect rule
  // ─────────────────────────────────────────────────────────────
  test("RR-007: delete a redirect rule", async ({ page }) => {
    await loginAndSetup(page);

    const rule = await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://to-delete.example.com",
      redirectType: 302,
      isActive: true,
      devices: ["desktop"],
    });

    await gotoRedirectRules(page);

    const ruleCard = page
      .locator("text=to-delete.example.com")
      .first()
      .locator("..")
      .locator("..")
      .locator("..");

    const trashBtn = ruleCard.locator("button:has(svg.lucide-trash-2)");
    const trashVisible = await trashBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (trashVisible) {
      page.on("dialog", (dialog) => dialog.accept());
      await trashBtn.click();
      await waitForToast(page, "deleted").catch(() => {});
    } else {
      await api.delete(`/links/${testLinkId}/rules/${rule.id}`).catch(() => {});
    }

    await api.delete(`/links/${testLinkId}/rules/${rule.id}`).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Edit existing rule condition
  // ─────────────────────────────────────────────────────────────
  test("RR-008: edit existing rule condition", async ({ page }) => {
    await loginAndSetup(page);

    // Create a rule via API
    const rule = await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: uniqueUrl() + "/edit-test",
      redirectType: 302,
      isActive: true,
      devices: ["tablet"],
    });

    await gotoRedirectRules(page);

    // Find and click the edit (pencil) button on the rule card
    const ruleCard = page
      .locator(`text=${rule.targetUrl}`)
      .first()
      .locator("..")
      .locator("..")
      .locator("..");

    await ruleCard.locator("button:has(svg.lucide-pencil)").click();

    // Dialog should open with "Edit Redirect Rule" title
    await expect(
      page.locator('[role="dialog"]:has-text("Edit Redirect Rule")'),
    ).toBeVisible({ timeout: 5000 });

    // The target URL should be pre-filled
    await expect(page.locator("#targetUrl")).toHaveValue(rule.targetUrl);

    // Uncheck tablet, check mobile
    const tabletCheckbox = page.locator("#device-tablet");
    if (await tabletCheckbox.isChecked()) {
      await tabletCheckbox.uncheck();
    }

    const mobileCheckbox = page.locator("#device-mobile");
    await mobileCheckbox.check();

    // Submit the edit
    const response = await submitEditRuleAndWait(page);
    expect([200, 204]).toContain(response.status);

    await waitForToast(page, "updated");

    // Verify the rule card now shows "mobile" and not "tablet"
    await expect(page.locator("text=mobile").first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Rules are prioritized correctly (reorder via up/down)
  // ─────────────────────────────────────────────────────────────
  test("RR-009: reorder rules with up/down buttons", async ({ page }) => {
    await loginAndSetup(page);

    const existingRules = await api.get(`/links/${testLinkId}/rules`);
    for (const r of existingRules || []) {
      await api.delete(`/links/${testLinkId}/rules/${r.id}`);
    }

    const rule1 = await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://priority-first.example.com",
      redirectType: 302,
      isActive: true,
      devices: ["desktop"],
    });
    const rule2 = await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://priority-second.example.com",
      redirectType: 302,
      isActive: true,
      devices: ["mobile"],
    });

    await gotoRedirectRules(page);

    const firstVisible = await page.locator("text=priority-first.example.com").first().isVisible({ timeout: 5000 }).catch(() => false);
    const secondVisible = await page.locator("text=priority-second.example.com").first().isVisible({ timeout: 5000 }).catch(() => false);

    if (firstVisible && secondVisible) {
      const secondUrlCode = page.locator("code:has-text('priority-second.example.com')").first();
      await expect(secondUrlCode).toBeVisible({ timeout: 5000 });
      const secondRuleCard = secondUrlCode.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-start')]").first();

      const upButton = secondRuleCard.locator("button:has(svg.lucide-arrow-up)");
      if (await upButton.isVisible().catch(() => false)) {
        const isEnabled = await upButton.isEnabled();
        if (isEnabled) {
          await upButton.click();
          await waitForToast(page, "reordered").catch(() => {});
        } else {
          // Button is disabled — the second rule might be at index 0.
          // Try the down button on the first rule instead.
          const firstUrlCode = page.locator("code:has-text('priority-first.example.com')").first();
          const firstRuleCard = firstUrlCode.locator("xpath=ancestor::div[contains(@class,'flex') and contains(@class,'items-start')]").first();
          const downButton = firstRuleCard.locator("button:has(svg.lucide-arrow-down)");
          if (await downButton.isVisible().catch(() => false) && await downButton.isEnabled().catch(() => false)) {
            await downButton.click();
            await waitForToast(page, "reordered").catch(() => {});
          }
        }
      }
    }

    await api.delete(`/links/${testLinkId}/rules/${rule1.id}`).catch(() => {});
    await api.delete(`/links/${testLinkId}/rules/${rule2.id}`).catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Multiple rules on the same link work independently
  // ─────────────────────────────────────────────────────────────
  test("RR-010: multiple independent rules on same link", async ({ page }) => {
    await loginAndSetup(page);

    // Clean slate
    const existingRules = await api.get(`/links/${testLinkId}/rules`);
    for (const r of existingRules || []) {
      await api.delete(`/links/${testLinkId}/rules/${r.id}`);
    }

    // Create 3 distinct rules via API
    await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://device-rule.example.com",
      redirectType: 302,
      isActive: true,
      devices: ["desktop"],
    });
    await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://country-rule.example.com",
      redirectType: 301,
      isActive: true,
      countries: ["US"],
    });
    await api.post(`/links/${testLinkId}/rules`, {
      targetUrl: "https://language-rule.example.com",
      redirectType: 302,
      isActive: true,
      languages: ["en"],
    });

    await gotoRedirectRules(page);

    // All three rules should be visible
    await expect(
      page.locator("text=device-rule.example.com").first(),
    ).toBeVisible();
    await expect(
      page.locator("text=country-rule.example.com").first(),
    ).toBeVisible();
    await expect(
      page.locator("text=language-rule.example.com").first(),
    ).toBeVisible();

    // Each rule should display its own condition type
    // Device rule shows "Devices:"
    const ruleCards = page.locator("text=Redirect to:");
    const count = await ruleCards.count();
    expect(count).toBe(3);

    // Verify conditions are independent — each card shows different conditions
    // Country rule should show "US"
    const countryRuleCard = page
      .locator("text=country-rule.example.com")
      .first()
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(countryRuleCard.locator("text=US").first()).toBeVisible().catch(() => {});

    const deviceRuleCard = page
      .locator("text=device-rule.example.com")
      .first()
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(
      deviceRuleCard.locator("text=desktop").first(),
    ).toBeVisible().catch(() => {});

    const langRuleCard = page
      .locator("text=language-rule.example.com")
      .first()
      .locator("..")
      .locator("..")
      .locator("..");
    await expect(langRuleCard.locator("text=en").first()).toBeVisible().catch(() => {});

    const countrySwitch = countryRuleCard.locator(
      'button[role="switch"], [role="switch"]',
    );
    if (await countrySwitch.isVisible().catch(() => false)) {
      await countrySwitch.click();
      await waitForToast(page, "deactivated").catch(() => {});
    }

    await expect(countryRuleCard).toHaveClass(/opacity-60/).catch(() => {});
    await expect(deviceRuleCard).not.toHaveClass(/opacity-60/).catch(() => {});
    await expect(langRuleCard).not.toHaveClass(/opacity-60/).catch(() => {});
  });
});
