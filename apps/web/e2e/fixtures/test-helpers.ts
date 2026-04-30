import { Page, expect } from "@playwright/test";
import { ApiClient } from "./api-client";

export function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueEmail(): string {
  return `e2e-test-${uniqueId()}@pingtome.test`;
}

export function uniqueSlug(prefix = "test"): string {
  return `e2e-${prefix}-${uniqueId()}`;
}

export function uniqueUrl(): string {
  return `https://example.com/e2e-test-${uniqueId()}`;
}

export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  method = "POST",
  trigger: () => Promise<void>,
): Promise<{ status: number; data: any; headers: Record<string, string> }> {
  const responsePromise = page.waitForResponse(
    (response) => {
      const urlMatch =
        typeof urlPattern === "string"
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());
      return urlMatch && response.request().method() === method;
    },
    { timeout: 15000 },
  );

  await trigger();
  const response = await responsePromise;
  return {
    status: response.status(),
    data: await response.json().catch(() => null),
    headers: response.headers(),
  };
}

export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  trigger: () => Promise<void>,
): Promise<void> {
  await Promise.all([page.waitForURL(urlPattern, { timeout: 15000 }), trigger()]);
}

export async function waitForToast(page: Page, text?: string): Promise<void> {
  if (text) {
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: text })
        .first(),
    ).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({
      timeout: 10000,
    });
  }
}

export async function waitForLoadingDone(page: Page): Promise<void> {
  const spinner = page
    .locator('[data-loading="true"], .animate-spin, svg.animate-spin')
    .first();
  if (await spinner.isVisible().catch(() => false)) {
    await expect(spinner).not.toBeVisible({ timeout: 15000 });
  }
}

export async function expectNotVisible(page: Page, selector: string): Promise<void> {
  const locator = page.locator(selector).first();
  const visible = await locator.isVisible().catch(() => false);
  expect(visible).toBe(false);
}

export async function expectAlert(page: Page, text: string): Promise<void> {
  await expect(
    page
      .locator("[role='alert']")
      .filter({ hasText: text })
      .first(),
  ).toBeVisible({ timeout: 5000 });
}

export async function expectDialogOpen(page: Page, title?: string): Promise<void> {
  const dialog = page.locator("[role='dialog']").first();
  await expect(dialog).toBeVisible({ timeout: 5000 });
  if (title) {
    await expect(dialog.locator(`text=${title}`).first()).toBeVisible();
  }
}

export async function expectTableRowCount(
  page: Page,
  selector: string,
  count: number,
): Promise<void> {
  const rows = page.locator(selector).locator("tbody tr");
  await expect(rows).toHaveCount(count, { timeout: 5000 });
}

export class CleanupTracker {
  private links: string[] = [];
  private tags: string[] = [];
  private folders: string[] = [];
  private bioPages: string[] = [];
  private organizations: string[] = [];
  private apiKeys: string[] = [];
  private webhooks: string[] = [];
  private campaigns: string[] = [];

  addLink(id: string) {
    this.links.push(id);
  }
  addTag(id: string) {
    this.tags.push(id);
  }
  addFolder(id: string) {
    this.folders.push(id);
  }
  addBioPage(id: string) {
    this.bioPages.push(id);
  }
  addOrganization(id: string) {
    this.organizations.push(id);
  }
  addApiKey(id: string) {
    this.apiKeys.push(id);
  }
  addWebhook(id: string) {
    this.webhooks.push(id);
  }
  addCampaign(id: string) {
    this.campaigns.push(id);
  }

  async cleanup(api: ApiClient): Promise<void> {
    const silent = async (fn: () => Promise<void>) => {
      try {
        await fn();
      } catch {
        /* best-effort */
      }
    };

    for (const id of [...this.apiKeys].reverse())
      await silent(() => api.delete(`/developer/api-keys/${id}`));
    for (const id of [...this.webhooks].reverse())
      await silent(() => api.delete(`/developer/webhooks/${id}`));
    for (const id of [...this.campaigns].reverse())
      await silent(() => api.delete(`/campaigns/${id}`));
    for (const id of [...this.bioPages].reverse())
      await silent(() => api.delete(`/biopages/${id}`));
    for (const id of [...this.folders].reverse())
      await silent(() => api.delete(`/folders/${id}`));
    for (const id of [...this.tags].reverse())
      await silent(() => api.delete(`/tags/${id}`));
    for (const id of [...this.links].reverse())
      await silent(() => api.deleteLink(id));
    for (const id of [...this.organizations].reverse())
      await silent(() => api.deleteOrganization(id));

    this.links = [];
    this.tags = [];
    this.folders = [];
    this.bioPages = [];
    this.organizations = [];
    this.apiKeys = [];
    this.webhooks = [];
    this.campaigns = [];
  }
}

export async function fillField(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector).first();
  await field.click();
  await field.fill(value);
  await field.blur();
}

export async function selectOption(
  page: Page,
  triggerSelector: string,
  optionText: string,
): Promise<void> {
  await page.locator(triggerSelector).click();
  await page.getByRole("option", { name: optionText }).click();
}

export async function toggleSwitch(
  page: Page,
  selector: string,
  desiredState: "on" | "off",
): Promise<void> {
  const toggle = page.locator(selector).first();
  const currentState = await toggle.getAttribute("data-state");
  if (
    (desiredState === "on" && currentState !== "checked") ||
    (desiredState === "off" && currentState === "checked")
  ) {
    await toggle.click();
  }
}

export async function dismissDialog(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

export async function waitForDashboard(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.locator('aside nav a, input[type="search"]').first()
    .waitFor({ state: "visible", timeout: 30000 });
}
