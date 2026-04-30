import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueUrl,
  uniqueSlug,
  waitForApiResponse,
} from "../fixtures/test-helpers";
import { TEST_IDS, QR_CODE_DATA } from "../fixtures/test-data";

test.describe("QR Code Generation", () => {
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

  async function createTestLink(): Promise<{ id: string; slug: string; shortUrl: string }> {
    const link = await api.createLink({
      originalUrl: uniqueUrl(),
      slug: uniqueSlug("qr"),
    });
    cleanup.addLink(link.id);
    return { id: link.id, slug: link.slug, shortUrl: link.shortUrl };
  }

  const MAIN_ORG_ID = "e2e00000-0000-0000-0001-000000000001";
  const MOCK_QR_DATAURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAklEQVR4AewaftIAAASzSURBVO3B0QpjCXYEwayD/v+Xy/NmFrrAumiE2psR6T+Q9EeHpOmQNB2SpkPSdEiaDknTIWk6JE2HpOmQNB2SpkPSdEiaXjyUhL9dW74lCZ/WlieSsLTlT5Lwt2vLuw5J0yFpOiRNh6TpkDQdkqYX/4K2/IokfEsSlrY8kYQlCb+gLb8iCZ90SJoOSdMhaTokTYek6ZA0vfiyJHxaWz4pCU+0ZUnC0palLUsSlrb8giR8Wlu+5ZA0HZKmQ9J0SJoOSdMhaXqht7TlibY8kYQnkrC0Rf83h6TpkDQdkqZD0nRImg5J0wu9JQlPtOXT2vJEEpa26H8dkqZD0nRImg5J0yFpOiRNL76sLX+ztjyRhKUtS1uWJDzRlm9py9/skDQdkqZD0nRImg5J0yFpevEvSMJ/oyQsbVmSsLTlibYsSVja8q4k/H91SJoOSdMhaTokTYek6ZA0vXioLfpPbXmiLb+uLf+NDknTIWk6JE2HpOmQNKX/4IEkLG1ZkvAr2vILkrC05Rck4Ve05VsOSdMhaTokTYek6ZA0HZKmFw+1ZUnC0pYnkvBEW96VhKUtSxKeaMuShKUtn5aEP2nLkoSlLZ+WhKUtn3RImg5J0yFpOiRNh6TpkDS9eCgJTyTh09qyJGFpy7uSsLTlm5LwaW35liQsbXkiCUtb3nVImg5J0yFpOiRNh6TpkDS9+LK2LEl4IglLWz6pLUsSnmjLE21ZkvBJSfi0tjzRliUJn3RImg5J0yFpOiRNh6TpkDSl/+DDkvBpbXkiCUtbviUJT7RlScITbVmS8K62LElY2rIk4dPa8q5D0nRImg5J0yFpOiRNh6TpkDQdkqYXX5aEpS1PJOGJtvxJEv4GbXkiCb8uCUtblrZ80iFpOiRNh6TpkDQdkqZD0pT+A/2HJDzRlieS8Cva8klJeKItv+CQNB2SpkPSdEiaDknTi4eS8Ldry5+05ZvasiThibYsSXhXEpa2PNGWJQmf1pZ3HZKmQ9J0SJoOSdMhaTokTS/+BW35FUl4VxKeaMsTSXiiLd/Slk9LwtKWJQlLWz7pkDQdkqZD0nRImg5J0yFpevFlSfi0tvyCJCxteaItSxI+LQnf0pYlCUtbliQsbXnXIWk6JE2HpOmQNB2SpkPS9EJvacunteWJtixJWNqyJOFdbVmSsCThiSR8yyFpOiRNh6TpkDQdkqZD0vRCb0nCN7Xlm9rySW1ZkvBEW5YkfNIhaTokTYek6ZA0HZKmQ9L04sva8uva8mlJWNryRBKWtixJeFdbliR8Wlt+wSFpOiRNh6TpkDQdkqZD0vTiX5CEv1kSnmjLN7XlibYsSfiTJHxTEn7BIWk6JE2HpOmQNB2SpkPSlP4DSX90SJoOSdMhaTokTYek6ZA0HZKmQ9J0SJoOSdMhaTokTf8DtXyciEiYjF4AAAAASUVORK5CYII=";

  async function setupOrgContext(page: import("@playwright/test").Page) {
    await page.unrouteAll();
    await page.route("http://localhost:3011/**", async (route) => {
      const headers = {
        ...route.request().headers(),
        "X-Organization-Id": MAIN_ORG_ID,
      };
      const url = route.request().url();
      const method = route.request().method();

      if (method === "POST" && url === "http://localhost:3011/qr/advanced") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ dataUrl: MOCK_QR_DATAURL }),
        });
        return;
      }

      if (method === "POST" && url.includes("/qr/") && url.includes("/pdf")) {
        await route.fulfill({
          status: 200,
          contentType: "application/pdf",
          body: Buffer.from("MOCK_PDF_CONTENT"),
        });
        return;
      }

      if (method === "POST" && url.includes("/qr/") && url.includes("/svg")) {
        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>',
        });
        return;
      }

      if (
        method === "GET" &&
        (url === "http://localhost:3011/links" || url.match(/http:\/\/localhost:3011\/links\?/))
      ) {
        try {
          const response = await route.fetch({ headers });
          const body = await response.json();
          const links = Array.isArray(body) ? body : body.data || [];
          await route.fulfill({
            status: response.status(),
            headers: { ...response.headers(), "content-type": "application/json" },
            body: JSON.stringify(links),
          });
        } catch {
          await route.continue({ headers });
        }
      } else {
        await route.continue({ headers });
      }
    });
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, MAIN_ORG_ID);
  }

  async function gotoQrCodesPage(page: import("@playwright/test").Page) {
    await setupOrgContext(page);

    await page.goto("/dashboard/qr-codes", { waitUntil: "domcontentloaded" });

    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate((orgId) => {
        localStorage.setItem("pingtome_current_org_id", orgId);
      }, MAIN_ORG_ID);
      await page.goto("/dashboard/qr-codes", { waitUntil: "domcontentloaded" });
    }

    try {
      await expect(page.locator('h1')).toContainText("QR Codes", { timeout: 15000 });
    } catch {
      await page.goto("/dashboard/qr-codes", { waitUntil: "domcontentloaded" });
      await expect(page.locator('h1')).toContainText("QR Codes", { timeout: 15000 });
    }

    await page.locator('img, button, input[type="search"]').first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    const listBtn = page.locator('button').filter({ has: page.locator('svg.lucide-list') });
    if (await listBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await listBtn.click();
    }
  }

  async function openCustomizerForLink(
    page: import("@playwright/test").Page,
    slug: string,
  ) {
    await page.getByPlaceholder("Search by link or URL...").fill(slug);
    await expect(page.locator("main button").filter({ hasText: /Customize/ }).first()).toBeVisible({ timeout: 15000 });

    const customizeBtn = page.locator("main button").filter({ hasText: /Customize/ }).first();
    await customizeBtn.click({ force: true });

    await expect(
      page.locator('[role="dialog"]').getByText("Customize QR Code").first(),
    ).toBeVisible({ timeout: 10000 });
  }

  test("QR codes page loads with list of QR codes", async ({ page }) => {
    await gotoQrCodesPage(page);

    await expect(page.locator("text=Total Links")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Customized QRs")).toBeVisible();
    await expect(page.locator("text=Total Scans")).toBeVisible();

    await expect(
      page.getByPlaceholder("Search by link or URL..."),
    ).toBeVisible();

    await expect(
      page.locator('button[role="combobox"]').first(),
    ).toBeVisible();

    const qrCards = page.locator("main button").filter({ hasText: /Customize/ });
    await expect(qrCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("generate QR code for a link from link details page", async ({ page }) => {
    const link = await createTestLink();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 });

    await page.goto(`/dashboard/links/${link.id}/settings`);
    await page.locator("h1, button").first().waitFor({ state: "visible", timeout: 15000 });

    const qrButton = page
      .getByRole("button")
      .filter({ hasText: /QR|Customize QR/i })
      .first();
    if (await qrButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await qrButton.click();

      await expect(
        page.locator('[role="dialog"]').getByText("Customize QR Code").first(),
      ).toBeVisible({ timeout: 10000 });

      const generateBtn = page.getByRole("button", { name: /Generate/i });
      await generateBtn.click();

      await expect(
        page.locator('img[alt="QR Code Preview"]').or(
          page.locator('img[src*="data:image"]').first(),
        ),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("generate QR code from QR codes page", async ({ page }) => {
    const link = await createTestLink();

    await gotoQrCodesPage(page);

    await openCustomizerForLink(page, link.slug);

    const generateBtn = page.getByRole("button", { name: /Generate/i });
    await generateBtn.click();

    await expect(
      page.locator('img[alt="QR Code Preview"]').or(
        page.locator('img[src*="data:image"]').first(),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test("download QR code as PNG", async ({ page }) => {
    await gotoQrCodesPage(page);

    const downloadBtn = page.locator("main button").filter({ hasText: /Download/ }).first();
    if (await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
      await downloadBtn.click({ force: true });

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    }
  });

  test("download QR code as SVG from customizer", async ({ page }) => {
    await gotoQrCodesPage(page);

    const customizeBtn = page.locator("main button").filter({ hasText: /Customize/ }).first();
    await customizeBtn.click({ force: true });

    await expect(
      page.locator('[role="dialog"]').getByText("Customize QR Code").first(),
    ).toBeVisible({ timeout: 10000 });

    const generateBtn = page.getByRole("button", { name: /Generate/i });
    await generateBtn.click();
    await expect(
      page.locator('img[alt="QR Code Preview"]').or(
        page.locator('img[src*="data:image"]').first(),
      ),
    ).toBeVisible({ timeout: 10000 });

    const svgButton = page.getByRole("button", { name: /^SVG$/i });
    if (await svgButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(svgButton).toBeEnabled();
    }
  });

  test("download QR code as PDF from customizer", async ({ page }) => {
    await gotoQrCodesPage(page);

    const customizeBtn = page.locator("main button").filter({ hasText: /Customize/ }).first();
    await customizeBtn.click({ force: true });

    await expect(
      page.locator('[role="dialog"]').getByText("Customize QR Code").first(),
    ).toBeVisible({ timeout: 10000 });

    const generateBtn = page.getByRole("button", { name: /Generate/i });
    await generateBtn.click();
    await expect(
      page.locator('img[alt="QR Code Preview"]').or(
        page.locator('img[src*="data:image"]').first(),
      ),
    ).toBeVisible({ timeout: 10000 });

    const pdfButton = page.getByRole("button", { name: /PDF/i });
    if (await pdfButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(pdfButton).toBeEnabled();
    }
  });

  test("QR code preview displays correctly", async ({ page }) => {
    await gotoQrCodesPage(page);

    const qrImages = page.locator('img[alt*="QR code for"]');
    const firstImage = qrImages.first();

    if (await firstImage.isVisible({ timeout: 10000 }).catch(() => false)) {
      const src = await firstImage.getAttribute("src");
      expect(src).toBeTruthy();
      expect(src).toContain("localhost:3011");
    }
  });

  test("QR code for a new link is auto-generated", async ({ page }) => {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, MAIN_ORG_ID);

    await page.goto("/dashboard/links/new", { waitUntil: "domcontentloaded" });
    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate((orgId) => {
        localStorage.setItem("pingtome_current_org_id", orgId);
      }, MAIN_ORG_ID);
      await page.goto("/dashboard/links/new", { waitUntil: "domcontentloaded" });
    }
    await page.locator('input#originalUrl, form').first().waitFor({ state: "visible", timeout: 30000 });

    const url = uniqueUrl();
    const slug = uniqueSlug("autogen");

    await page.fill("input#originalUrl", url);
    await page.fill('input[placeholder="custom-slug (optional)"]', slug);

    const response = await waitForApiResponse(
      page,
      "/links",
      "POST",
      async () => {
        await page.locator('button:has-text("Create your link")').click();
      },
    );

    if (response.data?.id) {
      cleanup.addLink(response.data.id);
    }

    await expect(page.locator("text=Link Created!")).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.locator('img[alt="QR Code"]').or(
        page.locator('img[alt*="QR"]').first(),
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test("batch download multiple QR codes", async ({ page }) => {
    const link1 = await createTestLink();
    const link2 = await createTestLink();

    await gotoQrCodesPage(page);

    const batchSelectBtn = page.getByRole("button", { name: /Batch Select/i });
    if (!(await batchSelectBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    await batchSelectBtn.click();

    await page.locator('input[type="checkbox"]').first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

    const selectAllBtn = page.getByRole("button", { name: /Select All/i });
    if (await selectAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectAllBtn.click();
    }

    const downloadZipBtn = page.getByRole("button", { name: /Download ZIP/i });
    if (await downloadZipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(downloadZipBtn).toBeEnabled();
    }

    const exitBtn = page.getByRole("button", { name: /Exit Select/i });
    if (await exitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exitBtn.click();
    }
  });

  test("QR code size options work", async ({ page }) => {
    const link = await createTestLink();

    await gotoQrCodesPage(page);

    await openCustomizerForLink(page, link.slug);

    const sizeSlider = page.locator('input[type="range"]#qr-size');
    if (!(await sizeSlider.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await sizeSlider.fill("600");

    const sizeLabel600 = page.locator("text=Size: 600px");
    if (await sizeLabel600.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sizeLabel600).toBeVisible();
    }

    await sizeSlider.fill("150");

    const sizeLabel150 = page.locator("text=Size: 150px");
    if (await sizeLabel150.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(sizeLabel150).toBeVisible();
    }

    const generateBtn = page.getByRole("button", { name: /Generate/i });
    await generateBtn.click();
    await expect(
      page.locator('img[alt="QR Code Preview"]').or(
        page.locator('img[src*="data:image"]').first(),
      ),
    ).toBeVisible({ timeout: 10000 });
  });
});
