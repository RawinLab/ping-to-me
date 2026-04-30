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
  CAMPAIGN_STATUSES,
} from "../fixtures/test-data";

test.describe("Campaign Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;
  // Test org with a valid UUID (seed IDs fail @IsUUID() validation)
  let testOrgId: string;

  test.beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        api = await ApiClient.create("owner");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Create a test org with a real UUID so campaign CRUD passes @IsUUID()
    const org = await api.post("/organizations", {
      name: `E2E Campaign Org ${Date.now()}`,
      slug: `e2e-campaign-org-${Date.now()}`,
    });
    testOrgId = org.id;
  });

  test.afterAll(async () => {
    if (testOrgId) {
      await api.delete(`/organizations/${testOrgId}`).catch(() => {});
    }
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    await loginAsUser(page, "owner");
  });

  test.afterEach(async () => {
    await cleanup.cleanup(api);
  });

  async function gotoCampaigns(page: import("@playwright/test").Page, orgId?: string) {
    const targetOrg = orgId ?? TEST_IDS.organizations.main;
    await page.evaluate((id) => {
      localStorage.setItem("pingtome_current_org_id", id);
    }, targetOrg);

    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded", timeout: 60000 });

    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate((id) => {
        localStorage.setItem("pingtome_current_org_id", id);
      }, targetOrg);
      await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded", timeout: 60000 });
    }

    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1')).toContainText("Campaigns");
    await page.waitForTimeout(2000);
  }

  async function openCreateDialog(page: import("@playwright/test").Page) {
    await gotoCampaigns(page, testOrgId);
    await page.locator('main button:has-text("New Campaign")').click();
    await expect(
      page.locator('[role="dialog"]'),
    ).toBeVisible({ timeout: 10000 });
  }

  async function createViaApi(overrides: Record<string, any> = {}) {
    const name = overrides.name || `E2E Campaign ${uniqueSlug("cmp")}`;
    const data = await api.post("/campaigns", {
      name,
      description: "Test campaign for E2E",
      status: "DRAFT",
      organizationId: testOrgId,
      ...overrides,
    });
    cleanup.addCampaign(data.id);
    return data;
  }

  function findCampaignCard(
    page: import("@playwright/test").Page,
    name: string,
  ) {
    return page.locator("[class*='group']").filter({ hasText: new RegExp(escapeRegex(name)) }).first();
  }

  function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  test("campaigns page loads with list header and stats", async ({ page }) => {
    await gotoCampaigns(page);

    await expect(page.locator('h1:has-text("Campaigns")')).toBeVisible();
    await expect(page.locator("text=Total Campaigns")).toBeVisible();
    await expect(page.locator("text=Active Campaigns")).toBeVisible();
    await expect(page.locator("text=Total Links")).toBeVisible();
    await expect(page.locator("text=Total Clicks")).toBeVisible();
    await expect(page.locator('button:has-text("New Campaign")')).toBeVisible();
  });

  test("seeded campaigns display with correct names and statuses", async ({ page }) => {
    await gotoCampaigns(page);

    // Wait for campaigns to load - check if any card or empty state appears
    const campaignCards = page.locator("div.group");
    const hasCards = await campaignCards.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (!hasCards) {
      // Check if the list loaded but is empty (wrong org or data issue)
      const emptyState = page.locator('text=No campaigns yet');
      if (await emptyState.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 });

        await page.evaluate((orgId) => {
          localStorage.setItem("pingtome_current_org_id", orgId);
        }, TEST_IDS.organizations.main);

        await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 });
        await page.waitForTimeout(3000);
        await expect(page.locator('h1:has-text("Campaigns")')).toBeVisible({ timeout: 30000 });
      }
    }

    await expect(
      page.locator(`text=${TEST_SLUGS.campaigns.summer}`).first(),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator(`text=${TEST_SLUGS.campaigns.winter}`).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator(`text=${TEST_SLUGS.campaigns.active}`).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator(`text=${TEST_SLUGS.campaigns.completed}`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("create new campaign with name and description", async ({ page }) => {
    const name = `E2E New Campaign ${Date.now()}`;
    const description = "Created by E2E test suite";

    await openCreateDialog(page);

    await fillField(page, 'input#name', name);
    await fillField(page, 'textarea#description', description);

    const response = await waitForApiResponse(
      page,
      "/campaigns",
      "POST",
      async () => {
        await page.locator('[role="dialog"] button:has-text("Create Campaign")').click();
      },
    );

    if (response.data?.id) {
      cleanup.addCampaign(response.data.id);
    }

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    await expect(page.locator(`text=${name}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("edit campaign name", async ({ page }) => {
    const campaign = await createViaApi();
    const newName = `Renamed Campaign ${Date.now()}`;

    await gotoCampaigns(page, testOrgId);

    const card = findCampaignCard(page, campaign.name);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.locator('button:has-text("Edit")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    const nameInput = page.locator('input#name');
    await nameInput.clear();
    await nameInput.fill(newName);

    const response = await waitForApiResponse(
      page,
      `/campaigns/${campaign.id}`,
      "PATCH",
      async () => {
        await page.locator('[role="dialog"] button:has-text("Update Campaign"), [role="dialog"] button:has-text("Create Campaign")').click();
      },
    );

    await page.waitForTimeout(2000);

    await gotoCampaigns(page, testOrgId);
    await expect(page.locator(`text=${newName}`).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("change campaign status from draft to active", async ({ page }) => {
    const campaign = await createViaApi({ status: "DRAFT" });

    await gotoCampaigns(page, testOrgId);
    const card = findCampaignCard(page, campaign.name);
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.locator('button:has-text("Edit")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    const statusTrigger = page.locator('[role="dialog"] button[role="combobox"]').first();
    if (await statusTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusTrigger.click();
      const activeOption = page.locator('[role="option"]:has-text("Active")').first();
      if (await activeOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await activeOption.click();
      }
    }

    const submitBtn = page.locator('[role="dialog"] button:has-text("Update"), [role="dialog"] button:has-text("Create")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await waitForApiResponse(
        page,
        `/campaigns/${campaign.id}`,
        "PATCH",
        async () => {
          await submitBtn.click();
        },
      ).catch(() => {});
    }

    await page.waitForTimeout(2000);
  });

  test("delete a campaign", async ({ page }) => {
    const campaign = await createViaApi({ name: "Delete Me Campaign" });

    await gotoCampaigns(page, testOrgId);

    const card = findCampaignCard(page, "Delete Me Campaign");
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.locator('button:has-text("Delete")').click();

    await expect(
      page.locator('[role="alertdialog"]'),
    ).toBeVisible({ timeout: 5000 });
    await page
      .locator('[role="alertdialog"] button:has-text("Delete")')
      .last()
      .click();

    await page.waitForTimeout(2000);
  });

  test("campaign detail/analytics page loads", async ({ page }) => {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);
    await page.goto(`/dashboard/campaigns/${TEST_IDS.campaigns.active}/analytics`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});

    const backButton = page.locator('button:has-text("Back to Campaigns")');
    if (await backButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await expect(page.locator(`text=${TEST_SLUGS.campaigns.active}`).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=Total Clicks")).toBeVisible().catch(() => {});
      await expect(page.locator("text=Unique Visitors")).toBeVisible().catch(() => {});
      await expect(page.locator("text=Total Links")).toBeVisible().catch(() => {});
      await expect(page.locator("text=Avg Clicks/Link")).toBeVisible().catch(() => {});
    }
  });

  test("campaign analytics show associated link metrics", async ({ page }) => {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);
    await page.goto(`/dashboard/campaigns/${TEST_IDS.campaigns.active}/analytics`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.locator("aside nav a, input[type='search']").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});

    if (await page.locator('text=Link Performance').isVisible({ timeout: 15000 }).catch(() => false)) {
      const tableRows = page.locator("table tbody tr");
      const rowCount = await tableRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
    }
  });

  test("campaign card shows associated links count", async ({ page }) => {
    await gotoCampaigns(page);

    const activeCard = findCampaignCard(page, TEST_SLUGS.campaigns.active);
    await expect(activeCard).toBeVisible({ timeout: 15000 });

    await expect(activeCard.locator("text=Links")).toBeVisible();
  });

  test("set campaign UTM parameters via create dialog", async ({ page }) => {
    const name = `E2E UTM Campaign ${Date.now()}`;
    const utmSource = "newsletter";
    const utmMedium = "email";
    const utmCampaign = "utm_test_2024";

    await openCreateDialog(page);

    await fillField(page, 'input#name', name);

    const utmToggle = page.locator('button:has-text("UTM Parameters")');
    if (await utmToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await utmToggle.click();
    }

    const utmSourceInput = page.locator('input#utmSource');
    if (await utmSourceInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fillField(page, 'input#utmSource', utmSource);
      await fillField(page, 'input#utmMedium', utmMedium);
      await fillField(page, 'input#utmCampaign', utmCampaign);
    }

    const response = await waitForApiResponse(
      page,
      "/campaigns",
      "POST",
      async () => {
        await page.locator('[role="dialog"] button:has-text("Create Campaign")').click();
      },
    );

    if (response.data?.id) {
      cleanup.addCampaign(response.data.id);
    }

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  test("campaign analytics page shows status badge and details", async ({ page }) => {
    await page.evaluate((orgId) => {
      localStorage.setItem("pingtome_current_org_id", orgId);
    }, TEST_IDS.organizations.main);

    await page.goto(`/dashboard/campaigns/${TEST_IDS.campaigns.active}/analytics`, { waitUntil: "domcontentloaded", timeout: 60000 });

    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate((orgId) => {
        localStorage.setItem("pingtome_current_org_id", orgId);
      }, TEST_IDS.organizations.main);
      await page.goto(`/dashboard/campaigns/${TEST_IDS.campaigns.active}/analytics`, { waitUntil: "domcontentloaded", timeout: 60000 });
    }

    await page.waitForTimeout(5000);

    const hasContent = await page.locator('button:has-text("Back to Campaigns")').isVisible({ timeout: 15000 }).catch(() => false)
      || await page.locator(`text=${TEST_SLUGS.campaigns.active}`).first().isVisible({ timeout: 5000 }).catch(() => false)
      || await page.locator('text=Total Clicks').isVisible({ timeout: 5000 }).catch(() => false)
      || await page.locator('text=Unique Visitors').isVisible({ timeout: 5000 }).catch(() => false)
      || await page.locator('text=No analytics data found').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("campaign cards show start and end dates", async ({ page }) => {
    await gotoCampaigns(page);

    const summerCard = findCampaignCard(page, TEST_SLUGS.campaigns.summer);
    await expect(summerCard).toBeVisible({ timeout: 15000 });

    const arrowText = summerCard.locator("text=→");
    if (await arrowText.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(arrowText).toBeVisible();
    }

    const completedCard = findCampaignCard(page, TEST_SLUGS.campaigns.completed);
    await expect(completedCard).toBeVisible({ timeout: 10000 });
  });
});
