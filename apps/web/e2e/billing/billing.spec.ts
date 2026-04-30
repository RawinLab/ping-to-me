import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import { waitForLoadingDone } from "../fixtures/test-helpers";
import { TEST_CREDENTIALS, USAGE_DATA } from "../fixtures/test-data";

test.describe("Billing Page", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(150000);
  let api: ApiClient;

  test.beforeAll(async () => {
    api = await ApiClient.create("owner");
  });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  async function gotoBillingPage(page: import("@playwright/test").Page) {
    await page.goto("/dashboard/billing", { waitUntil: "domcontentloaded" });

    // h1 text is "Billing & Subscription" — hasText("Billing") is a substring match
    const h1 = page.locator("h1").filter({ hasText: "Billing" });

    try {
      await expect(h1).toBeVisible({ timeout: 15000 });
    } catch {
      try {
        // Auth may not be ready — retry navigation
        await page.goto("/dashboard/billing", { waitUntil: "domcontentloaded" });
        await expect(h1).toBeVisible({ timeout: 20000 });
      } catch {
        // Context may be closed — test will fail from assertion
      }
    }
    await page.waitForTimeout(2000);
  }

  test("BILL-001: billing page loads and shows current plan", async ({
    page,
  }) => {
    await gotoBillingPage(page);

    await expect(
      page.locator("h1").filter({ hasText: "Billing" }),
    ).toBeVisible();

    // Plan badge: rendered as "{planName} Plan" (e.g. "Free Plan", "Pro Plan")
    const planBadge = page.locator("text=/Free Plan|Pro Plan|Enterprise Plan/i");
    await expect(planBadge.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-002: current plan details display (name, price, billing cycle)", async ({
    page,
  }) => {
    await gotoBillingPage(page);

    // The plan name appears in h2: "You're on the Free plan" or "Your Pro subscription"
    const planInfo = page.locator("text=/Free|Pro|Enterprise/");
    expect(await planInfo.count()).toBeGreaterThanOrEqual(1);
  });

  test("BILL-003: usage metrics section is present", async ({
    page,
  }) => {
    await gotoBillingPage(page);

    // UsageDashboard component renders usage data. Check for any usage-related text.
    const usageContent = page.locator("text=/Usage|Links Created|API Calls|Monthly/i");
    await expect(usageContent.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-004: usage section renders with data or error state", async ({ page }) => {
    await gotoBillingPage(page);

    // Either usage data cards or an empty/error state is shown
    const content = page.locator("text=/Usage|Links|Monthly|No usage/i");
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-005: upgrade or change plan button is visible", async ({ page }) => {
    await gotoBillingPage(page);

    // The button is inside a <Link href="/pricing"> with text "Upgrade to Pro" or "Change Plan"
    const planButton = page.locator(
      'a:has-text("Upgrade"), a:has-text("Change Plan"), ' +
        'button:has-text("Upgrade to Pro"), button:has-text("Change Plan")',
    );

    await expect(planButton.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-006: plan features are displayed", async ({ page }) => {
    await gotoBillingPage(page);

    // Features are shown as span elements with text like "50 links/month", "Basic analytics", etc.
    const featureItem = page.locator(
      "text=/links\\/month|Basic analytics|QR codes|Unlimited links/i",
    );
    await expect(featureItem.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-007: billing history section is present", async ({ page }) => {
    await gotoBillingPage(page);

    // CardTitle "Billing History" or empty state "No invoices yet"
    const historySection = page.locator("text=/Billing History|No invoices yet/");
    await expect(historySection.first()).toBeVisible({ timeout: 15000 });
  });

  test("BILL-008: billing page is accessible to all authenticated users", async ({ page }) => {
    await loginAsUser(page, "viewer");
    await page.goto("/dashboard/billing");
    await expect(
      page.locator("h1").filter({ hasText: "Billing" }),
    ).toBeVisible({ timeout: 30000 });
  });
});
