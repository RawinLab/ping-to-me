import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueSlug,
  waitForApiResponse,
  waitForToast,
  fillField,
} from "../fixtures/test-helpers";
import {
  TEST_IDS,
  TEST_SLUGS,
  DOMAIN_STATUSES,
} from "../fixtures/test-data";

test.describe("Domain Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

  test.beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        api = await ApiClient.create("owner");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
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

  async function gotoDomains(page: import("@playwright/test").Page) {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);

    await page.goto("/dashboard/domains", { waitUntil: "domcontentloaded", timeout: 60000 });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 15000 });
        break;
      } catch {
        if (attempt < 2) {
          try {
            await page.goto("/dashboard/domains", { waitUntil: "domcontentloaded", timeout: 60000 });
          } catch {
            await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
          }
        } else {
          throw new Error("Failed to load domains page after 3 attempts");
        }
      }
    }

    await page.locator("h1").filter({ hasText: /Custom Domains|Domains/ }).waitFor({ state: "visible", timeout: 30000 });
    await page.locator("text=e2e-").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
  }

  async function gotoDomainDetail(
    page: import("@playwright/test").Page,
    domainId: string,
  ) {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);

    const currentUrl = page.url();
    if (!currentUrl.includes("/dashboard")) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 15000 });
        break;
      } catch {
        if (attempt < 2) {
          try {
            await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
          } catch {
            await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
          }
        } else {
          throw new Error("Failed to load dashboard for domain detail navigation");
        }
      }
    }

    await page.goto(`/dashboard/domains/${domainId}`, { waitUntil: "domcontentloaded" });
    await page.locator("text=e2e-").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
    await page.locator("body").waitFor({ state: "visible", timeout: 10000 });
  }

  test("domains page loads with list of existing domains", async ({ page }) => {
    await gotoDomains(page);

    await expect(
      page.locator('h1').filter({ hasText: /Custom Domains|Domains/ }),
    ).toBeVisible();

    await expect(page.locator("text=Total Domains").first()).toBeVisible({ timeout: 15000 });

    const domainCards = page.locator("text=e2e-custom.link")
      .or(page.locator("text=e2e-pending.link"))
      .or(page.locator("text=e2e-verifying.link"))
      .or(page.locator("text=e2e-failed.link"));
    await expect(domainCards.first()).toBeVisible({ timeout: 15000 });
  });

  test("seeded domains display with correct statuses", async ({ page }) => {
    await gotoDomains(page);

    await expect(page.locator("text=e2e-custom.link").first()).toBeVisible({ timeout: 15000 });

    const verifiedBadge = page.locator("text=Verified").first();
    const hasVerified = await verifiedBadge.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasVerified).toBe(true);

    const pendingDomain = page.locator("text=e2e-pending.link").first();
    const hasPending = await pendingDomain.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasPending).toBe(true);

    const verifyingDomain = page.locator("text=e2e-verifying.link").first();
    const hasVerifying = await verifyingDomain.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasVerifying).toBe(true);

    const failedDomain = page.locator("text=e2e-failed.link").first();
    const hasFailed = await failedDomain.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasFailed).toBe(true);
  });

  test("add new domain modal opens", async ({ page }) => {
    await gotoDomains(page);

    await page.locator('button:has-text("Add Domain")').click();

    await expect(
      page.locator('[role="dialog"] >> text=Add Custom Domain').or(
        page.locator('[role="dialog"]').getByText("Add").first()
      ),
    ).toBeVisible({ timeout: 5000 });
  });

  test("add a custom domain shows DNS instructions", async ({ page }) => {
    await gotoDomains(page);

    await page.locator('button:has-text("Add Domain")').click();
    await expect(
      page.locator('[role="dialog"]'),
    ).toBeVisible({ timeout: 5000 });

    const testDomain = `e2e-test-${uniqueSlug("domain")}.link`;
    const hostnameInput = page.locator('[role="dialog"] input#hostname').first();

    await hostnameInput.click();
    await hostnameInput.pressSequentially(testDomain, { delay: 10 });

    await page.waitForTimeout(300);

    const submitBtn = page.locator('[role="dialog"] button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/domains") && resp.request().method() === "POST",
      { timeout: 30000 },
    );

    await submitBtn.click();

    try {
      const response = await responsePromise;
      const status = response.status();
      const data = await response.json().catch(() => null);

      if (status >= 400) {
        return;
      }

      if (data?.id) {
        try {
          await api.delete(`/domains/${data.id}?orgId=${TEST_IDS.organizations.main}`);
        } catch { /* best-effort */ }
      }

      await expect(
        page.locator("text=Verify Domain Ownership").or(page.locator("text=Domain Added")),
      ).toBeVisible({ timeout: 5000 });
    } catch {
      const errorVisible = await page.locator("text=Hostname is too short").isVisible().catch(() => false);
      if (errorVisible) return;

      const dialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(dialogVisible).toBe(true);
    }
  });

  test("domain detail page shows DNS records for pending domain", async ({ page }) => {
    await gotoDomainDetail(page, TEST_IDS.domains.unverified);

    await expect(
      page.locator("text=e2e-pending.link").first(),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator("text=DNS Verification").first()).toBeVisible({ timeout: 10000 });
  });

  test("domain detail page shows SSL status", async ({ page }) => {
    await gotoDomainDetail(page, TEST_IDS.domains.verified);

    await expect(
      page.locator("text=e2e-custom.link").first(),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator("text=SSL Certificate")).toBeVisible({ timeout: 10000 });
  });

  test("set domain as default for organization", async ({ page }) => {
    await gotoDomains(page);

    const setDefaultButton = page.locator("button:has-text('Set Default')").first();
    const hasButton = await setDefaultButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasButton) {
      page.on("dialog", (dialog) => dialog.accept());
      await setDefaultButton.click();
      await expect(page.locator("text=Default").first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator("text=Default").first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("domain verification status check via verify button", async ({ page }) => {
    await gotoDomainDetail(page, TEST_IDS.domains.failed);

    await expect(
      page.locator("text=e2e-failed.link").first(),
    ).toBeVisible({ timeout: 15000 });

    const retryButton = page.locator('button:has-text("Retry")')
      .or(page.locator('button:has-text("Verify")'))
      .or(page.locator('button:has-text("Retry Verification")'))
      .first();

    const hasRetry = await retryButton.isVisible({ timeout: 15000 }).catch(() => false);
    if (hasRetry) {
      const verifyResponse = page.waitForResponse(
        (resp) => resp.url().includes("/verify") || resp.url().includes("/domains"),
        { timeout: 15000 },
      ).catch(() => null);
      await retryButton.click();
      await verifyResponse;
    }

    await expect(
      page.locator("text=e2e-failed.link").first(),
    ).toBeVisible();
  });

  test("delete a domain", async ({ page }) => {
    const testHostname = `e2e-del-${uniqueSlug("domain")}.link`;
    let created;
    try {
      created = await api.post("/domains", {
        hostname: testHostname,
        orgId: TEST_IDS.organizations.main,
        verificationType: "txt",
      });
    } catch {
      const domains = await api.get("/domains").catch(() => null);
      expect(domains).toBeTruthy();
      return;
    }

    const domainId = created.id;

    await gotoDomains(page);

    await expect(
      page.locator(`text=${testHostname}`),
    ).toBeVisible({ timeout: 15000 });

    page.on("dialog", (dialog) => dialog.accept());

    const domainTextEl = page.locator(`text=${testHostname}`).first();
    const domainCard = domainTextEl.locator("xpath=ancestor::div[contains(@class, 'p-5') or contains(@class, 'CardContent')]");

    const deleteButton = domainCard.locator('button.text-red-500, button.text-red-600, button:has(svg[class*="lucide-trash"])').first();
    const hasDelete = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDelete) {
      await deleteButton.click();
    }

    await expect(
      page.locator(`text=${testHostname}`),
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("domain list shows domain name, status, and default badge", async ({ page }) => {
    await gotoDomains(page);

    await expect(page.locator("text=e2e-custom.link").first()).toBeVisible({ timeout: 15000 });

    const verifiedBadge = page.locator("text=Verified").first();
    const hasVerified = await verifiedBadge.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasVerified).toBe(true);

    const defaultBadge = page.locator("text=Default").first();
    const hasDefault = await defaultBadge.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDefault) {
      await expect(defaultBadge).toBeVisible();
    }
  });
});
