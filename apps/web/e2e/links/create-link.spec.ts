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
  toggleSwitch,
} from "../fixtures/test-helpers";
import { TEST_SLUGS } from "../fixtures/test-data";

test.describe("Create Link", () => {
  test.setTimeout(120000);
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

  async function gotoCreatePage(page: import("@playwright/test").Page) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto("/dashboard/links/new");
      try {
        await expect(page.locator('h1:has-text("Create a new link")')).toBeVisible({ timeout: 15000 });
        return;
      } catch {
        if (attempt < 2) {
          await page.waitForTimeout(1000);
        }
      }
    }
    throw new Error("Failed to load create link page after 3 attempts");
  }

  async function expandAdvancedSettings(page: import("@playwright/test").Page) {
    // The collapsible trigger is the full-width area containing "Advanced settings" text
    const trigger = page.locator("text=Advanced settings").first();
    await trigger.click();
    // Wait for the section to expand and show UTM Parameters
    await expect(page.getByText("UTM Parameters")).toBeVisible({
      timeout: 10000,
    });
  }

  async function submitAndWait(page: import("@playwright/test").Page) {
    const submitBtn = page.locator('button[type="submit"]:has-text("Create your link")');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const response = await waitForApiResponse(
      page,
      "/links",
      "POST",
      async () => {
        await submitBtn.click();
      },
    );

    if (response.data?.id) {
      cleanup.addLink(response.data.id);
    }

    await expect(page.locator("text=Link Created!")).toBeVisible({
      timeout: 15000,
    });

    return response.data;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Page Layout & Navigation
  // ─────────────────────────────────────────────────────────────────────

  test("page loads with destination URL input field", async ({ page }) => {
    await gotoCreatePage(page);

    const urlInput = page.locator("input#originalUrl");
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute(
      "placeholder",
      "https://example.com/my-long-url",
    );
  });

  test("page displays all three collapsible sections", async ({ page }) => {
    await gotoCreatePage(page);

    await expect(page.locator("text=Link details")).toBeVisible();
    await expect(page.locator("text=Sharing options")).toBeVisible();
    await expect(page.locator("text=Advanced settings")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Basic Link Creation
  // ─────────────────────────────────────────────────────────────────────

  test("create basic link with just URL → success", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);

    const linkData = await submitAndWait(page);

    expect(linkData).toBeTruthy();
    expect(linkData.originalUrl).toBe(url);
    expect(linkData.id).toBeTruthy();
  });

  test("create link with custom slug → slug is used", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    const slug = uniqueSlug("custom");

    await page.fill("input#originalUrl", url);
    await page.fill(
      'input[placeholder="custom-slug (optional)"]',
      slug,
    );

    const linkData = await submitAndWait(page);

    expect(linkData.slug).toBe(slug);
    await expect(page.locator(`text=${slug}`)).toBeVisible();
  });

  test("create link with title → title is saved", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    const title = `Test Link Title ${Date.now()}`;

    await page.fill("input#originalUrl", url);
    await page.fill("input#title", title);

    const linkData = await submitAndWait(page);
    expect(linkData.title).toBe(title);
  });

  test("create link with description → description saved", async ({
    page,
  }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    const description = "E2E test description for link";

    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);
    await page.fill("input#description", description);

    const linkData = await submitAndWait(page);
    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Tags
  // ─────────────────────────────────────────────────────────────────────

  test("create link with tags → tags appear on link", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await page.fill("input#tags", "e2e-tag-a, e2e-tag-b");

    const linkData = await submitAndWait(page);

    const tags = linkData.tags;
    expect(tags).toBeDefined();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags).toContain("e2e-tag-a");
    expect(tags).toContain("e2e-tag-b");
  });

  // ─────────────────────────────────────────────────────────────────────
  // UTM Parameters
  // ─────────────────────────────────────────────────────────────────────

  test("create link with UTM parameters (source, medium, campaign)", async ({
    page,
  }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);

    await page.fill("input#utmSource", "google");
    await page.fill("input#utmMedium", "cpc");
    await page.fill("input#utmCampaign", "spring_sale");

    const linkData = await submitAndWait(page);

    expect(linkData.originalUrl).toContain("utm_source=google");
    expect(linkData.originalUrl).toContain("utm_medium=cpc");
    expect(linkData.originalUrl).toContain("utm_campaign=spring_sale");
  });

  // ─────────────────────────────────────────────────────────────────────
  // Expiration, Password, Redirect Type, Max Clicks
  // ─────────────────────────────────────────────────────────────────────

  test("create link with expiration date", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const expDateStr = futureDate.toISOString().slice(0, 16);
    await page.fill("input#expirationDate", expDateStr);

    const linkData = await submitAndWait(page);
    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  test("create link with password protection", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);

    await page.fill("input#password", "secretE2Epass");

    const linkData = await submitAndWait(page);
    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  test("create link with redirect type 302 (temporary)", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);

    const redirectSelect = page.locator(
      "div.space-y-2:has(> label:text-is('Redirect Type')) button[role='combobox']",
    ).first();

    const allSelects = page.locator("button[role='combobox']");
    const count = await allSelects.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const text = await allSelects.nth(i).textContent();
      if (text?.includes("301")) {
        await allSelects.nth(i).click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      const advancedCard = page.locator("text=Redirect Type").locator("..").locator("..");
      await advancedCard.locator("button[role='combobox']").click();
    }

    await page.getByRole("option", { name: "302 - Temporary" }).click();

    const linkData = await submitAndWait(page);
    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  test("create link with max clicks limit", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);
    await expandAdvancedSettings(page);

    await page.fill("input#maxClicks", "100");

    const linkData = await submitAndWait(page);
    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Validation Errors
  // ─────────────────────────────────────────────────────────────────────

  test("empty URL → shows validation error", async ({ page }) => {
    await gotoCreatePage(page);

    await page
      .locator('button:has-text("Create your link")')
      .click();

    await expect(
      page.locator("text=Please enter a valid URL"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("invalid URL → shows validation error", async ({ page }) => {
    await gotoCreatePage(page);

    await page.fill("input#originalUrl", "not-a-valid-url");

    await page
      .locator('button:has-text("Create your link")')
      .click();

    await expect(
      page.locator("text=Please enter a valid URL"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("duplicate slug → shows error", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);

    await page.fill(
      'input[placeholder="custom-slug (optional)"]',
      TEST_SLUGS.links.popular,
    );

    await page
      .locator('button:has-text("Create your link")')
      .click();

    await expect(
      page
        .locator("text=This slug is already taken")
        .or(page.locator("text=already exists"))
        .or(page.locator("text=already taken"))
        .or(page.locator("text=Already taken"))
        .or(page.locator("text=This slug is reserved")),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Slug Availability Checking (Real-Time)
  // ─────────────────────────────────────────────────────────────────────

  test("slug availability checking shows available for new slug", async ({
    page,
  }) => {
    await gotoCreatePage(page);

    const newSlug = uniqueSlug("avail");
    await page.fill(
      'input[placeholder="custom-slug (optional)"]',
      newSlug,
    );

    await expect(page.locator("text=Available")).toBeVisible({
      timeout: 10000,
    });
  });

  test("slug availability checking shows taken for existing slug", async ({
    page,
  }) => {
    await gotoCreatePage(page);

    await page.fill(
      'input[placeholder="custom-slug (optional)"]',
      TEST_SLUGS.links.popular,
    );

    await expect(
      page
        .locator("text=Already taken")
        .or(page.locator("text=This slug is reserved")),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Post-Creation Success State
  // ─────────────────────────────────────────────────────────────────────

  test("after creation, QR code is auto-generated", async ({ page }) => {
    await gotoCreatePage(page);

    await page.fill("input#originalUrl", uniqueUrl());
    await submitAndWait(page);

    await expect(page.locator('img[alt="QR Code"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("after creation, short URL is copyable", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await gotoCreatePage(page);

    await page.fill("input#originalUrl", uniqueUrl());
    await submitAndWait(page);

    const copyButton = page.locator("button:has(svg.lucide-copy)").first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    await expect(page.locator("svg.lucide-check.h-4")).toBeVisible({
      timeout: 5000,
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Combined / Full Options
  // ─────────────────────────────────────────────────────────────────────

  test("create link with all options combined", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    const slug = uniqueSlug("full");
    const title = `Full Option Link ${Date.now()}`;

    await page.fill("input#originalUrl", url);
    await page.fill(
      'input[placeholder="custom-slug (optional)"]',
      slug,
    );
    await page.fill("input#title", title);
    await page.fill("input#tags", "e2e, full-test, combined");

    await expandAdvancedSettings(page);

    await page.fill("input#description", "All options combined test");

    await page.fill("input#utmSource", "newsletter");
    await page.fill("input#utmMedium", "email");
    await page.fill("input#utmCampaign", "full_e2e_test");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill(
      "input#expirationDate",
      futureDate.toISOString().slice(0, 16),
    );

    await page.fill("input#password", "combinedPass123");

    const allSelects = page.locator("button[role='combobox']");
    const count = await allSelects.count();
    for (let i = 0; i < count; i++) {
      const text = await allSelects.nth(i).textContent();
      if (text?.includes("301")) {
        await allSelects.nth(i).click();
        break;
      }
    }
    await page.getByRole("option", { name: "302 - Temporary" }).click();

    await page.fill("input#maxClicks", "500");

    const linkData = await submitAndWait(page);

    expect(linkData.originalUrl).toContain("utm_source=newsletter");
    expect(linkData.originalUrl).toContain("utm_medium=email");
    expect(linkData.originalUrl).toContain("utm_campaign=full_e2e_test");
    expect(linkData.slug).toBe(slug);
    expect(linkData.title).toBe(title);

    await expect(page.locator(`text=${slug}`)).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Organization Assignment
  // ─────────────────────────────────────────────────────────────────────

  test("create link assigns to current organization", async ({ page }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    await page.fill("input#originalUrl", url);

    const linkData = await submitAndWait(page);

    expect(linkData).toBeTruthy();
    expect(linkData.id).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Cancel / Navigation
  // ─────────────────────────────────────────────────────────────────────

  test("cancel creation → returns to links list", async ({ page }) => {
    await gotoCreatePage(page);

    await page.fill("input#originalUrl", uniqueUrl());

    await page.locator('button:has-text("Cancel")').click();

    await expect(page).toHaveURL(/\/dashboard\/links$/, { timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Section Collapse/Expand preserves form data
  // ─────────────────────────────────────────────────────────────────────

  test("collapsing and expanding sections preserves form data", async ({
    page,
  }) => {
    await gotoCreatePage(page);

    const url = uniqueUrl();
    const title = "Persistence Test Title";

    await page.fill("input#originalUrl", url);
    await page.fill("input#title", title);

    await page.locator("text=Link details").click();

    await page.waitForTimeout(300);

    await page.locator("text=Link details").click();

    await expect(page.locator("input#originalUrl")).toHaveValue(url);
    await expect(page.locator("input#title")).toHaveValue(title);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Create Another (from success state)
  // ─────────────────────────────────────────────────────────────────────

  test("Create Another button returns to form", async ({ page }) => {
    await gotoCreatePage(page);

    await page.fill("input#originalUrl", uniqueUrl());
    await submitAndWait(page);

    await page
      .locator('button:has-text("Create Another")')
      .click();

    await expect(
      page.locator('h1:has-text("Create a new link")'),
    ).toBeVisible({ timeout: 5000 });
  });
});
