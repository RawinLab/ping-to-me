import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

test.describe("Developer - API Keys and Webhooks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test.describe("API Keys Page", () => {
    test("should load API keys page", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      // Check header
      await expect(page.getByRole("heading", { level: 1, name: /Developer/i })).toBeVisible();

      // Check page title
      await expect(page.getByRole("heading", { level: 2, name: /API Keys/i })).toBeVisible();

      // Check description
      await expect(page.getByText(/Create and manage API keys/i)).toBeVisible();

      // Check navigation
      await expect(page.getByRole("link", { name: /API Keys/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Webhooks/i })).toBeVisible();
    });

    test("should display create API key button", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      const createButton = page.getByRole("button", { name: /Create API Key/i });
      await expect(createButton).toBeVisible();
    });

    test("should open create API key dialog", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      await page.getByRole("button", { name: /Create API Key/i }).click();

      // Check dialog content
      await expect(page.getByRole("heading", { name: /Create API Key/i })).toBeVisible();
      await expect(page.getByText(/Configure your API key/i)).toBeVisible();

      // Check form fields
      await expect(page.getByLabel(/Key Name/i)).toBeVisible();
      await expect(page.getByLabel(/Permissions \(Scopes\)/i)).toBeVisible();
    });

    test("should show API keys table when keys exist", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      // Wait for loading
      await page.waitForLoadState("networkidle");

      // Check table headers
      const tableHeaders = page.locator("thead");
      await expect(tableHeaders.getByText(/Name/i)).toBeVisible();
      await expect(tableHeaders.getByText(/Scopes/i)).toBeVisible();
      await expect(tableHeaders.getByText(/Created/i)).toBeVisible();
      await expect(tableHeaders.getByText(/Status/i)).toBeVisible();
      await expect(tableHeaders.getByText(/Actions/i)).toBeVisible();
    });

    test("should display quick start guide", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      // Check Quick Start Guide section
      await expect(page.getByRole("heading", { name: /Quick Start Guide/i })).toBeVisible();

      // Check Authentication section
      await expect(page.getByText(/Authentication/i)).toBeVisible();
      await expect(page.getByText(/x-api-key/i)).toBeVisible();

      // Check API Documentation link
      const docsLink = page.getByRole("link", { name: /API Documentation/i });
      await expect(docsLink).toBeVisible();
    });

    test("should navigate to API keys from webhooks page", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      await page.getByRole("link", { name: /API Keys/i }).click();

      // Should be on API keys page
      await expect(page).toHaveURL("/dashboard/developer/api-keys");
      await expect(page.getByRole("heading", { level: 2, name: /API Keys/i })).toBeVisible();
    });

    test("should display API key form with all fields", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      await page.getByRole("button", { name: /Create API Key/i }).click();

      // Check name input
      const nameInput = page.getByLabel(/Key Name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveAttribute("placeholder", /e.g., Production Server/i);

      // Check scopes section
      await expect(page.getByText(/Select the permissions this API key/i)).toBeVisible();

      // Check advanced settings button
      const advancedButton = page.getByRole("button", { name: /Advanced Settings/i });
      await expect(advancedButton).toBeVisible();
    });

    test("should expand advanced settings", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      await page.getByRole("button", { name: /Create API Key/i }).click();

      // Click advanced settings
      await page.getByRole("button", { name: /Advanced Settings/i }).click();

      // Check advanced settings fields
      await expect(page.getByLabel(/IP Whitelist/i)).toBeVisible();
      await expect(page.getByLabel(/Rate Limit/i)).toBeVisible();
      await expect(page.getByLabel(/Expiration Date/i)).toBeVisible();
    });

    test("should close create dialog when cancel is clicked", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      await page.getByRole("button", { name: /Create API Key/i }).click();

      // Dialog should be visible
      await expect(page.getByRole("heading", { name: /Create API Key/i })).toBeVisible();

      // Click cancel
      await page.getByRole("button", { name: /Cancel/i }).first().click();

      // Dialog should be closed
      await expect(page.getByRole("heading", { name: /Create API Key/i })).not.toBeVisible();
    });
  });

  test.describe("Webhooks Page", () => {
    test("should load webhooks page", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      // Check header
      await expect(page.getByRole("heading", { level: 1, name: /Developer/i })).toBeVisible();

      // Check page title
      await expect(page.getByRole("heading", { level: 2, name: /Webhooks/i })).toBeVisible();

      // Check description
      await expect(page.getByText(/Receive real-time notifications/i)).toBeVisible();

      // Check navigation
      await expect(page.getByRole("link", { name: /API Keys/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Webhooks/i })).toBeVisible();
    });

    test("should display add webhook button", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      const addButton = page.getByRole("button", { name: /Add Webhook/i });
      await expect(addButton).toBeVisible();
    });

    test("should open add webhook dialog", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      await page.getByRole("button", { name: /Add Webhook/i }).click();

      // Check dialog content
      await expect(page.getByRole("heading", { name: /Add Webhook/i })).toBeVisible();
      await expect(page.getByText(/Configure a webhook endpoint/i)).toBeVisible();

      // Check form fields
      await expect(page.getByLabel(/Endpoint URL/i)).toBeVisible();
      await expect(page.getByLabel(/Events to Subscribe/i)).toBeVisible();
    });

    test("should display webhook form with all event options", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      await page.getByRole("button", { name: /Add Webhook/i }).click();

      // Check URL input
      const urlInput = page.getByLabel(/Endpoint URL/i);
      await expect(urlInput).toBeVisible();
      await expect(urlInput).toHaveAttribute("placeholder", /https:\/\/your-server/i);

      // Check event options
      await expect(page.getByText(/Link Created/i)).toBeVisible();
      await expect(page.getByText(/Link Clicked/i)).toBeVisible();
      await expect(page.getByText(/Link Deleted/i)).toBeVisible();
      await expect(page.getByText(/Link Updated/i)).toBeVisible();
      await expect(page.getByText(/Bio Page Viewed/i)).toBeVisible();
    });

    test("should toggle event selection", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      await page.getByRole("button", { name: /Add Webhook/i }).click();

      // Find the Link Created event checkbox by label
      const linkCreatedCheckbox = page.getByRole("checkbox", { name: /Link Created/i });

      await linkCreatedCheckbox.check();
      await expect(linkCreatedCheckbox).toBeChecked();

      await linkCreatedCheckbox.uncheck();
      await expect(linkCreatedCheckbox).not.toBeChecked();
    });

    test("should display payload format section", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      // Check Payload Format section
      await expect(page.getByRole("heading", { name: /Payload Format/i })).toBeVisible();

      // Check example payload
      await expect(page.getByText(/link\.created/i)).toBeVisible();
      await expect(page.getByText(/timestamp/i)).toBeVisible();

      // Check copy button in payload section
      const payloadCopyButton = page.locator("button").filter({ hasText: /Copy/i }).first();
      await expect(payloadCopyButton).toBeVisible();
    });

    test("should copy webhook payload", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      // Wait for the page to load completely
      await page.waitForLoadState("networkidle");

      // Find the payload copy button (plain button with Copy text)
      const copyButtons = page.locator("button").filter({ hasText: /Copy/i });
      const payloadCopyButton = copyButtons.first();

      await expect(payloadCopyButton).toBeVisible();
      await payloadCopyButton.click();

      // Button text should change to "Copied!" to indicate copy success
      // Look for the Copied text near the copy button
      await expect(page.getByText(/Copied!/i)).toBeVisible({ timeout: 2000 });
    });

    test("should display available events section", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      // Check Available Events section
      await expect(page.getByRole("heading", { name: /Available Events/i })).toBeVisible();

      // Check event items
      const eventItems = [
        "Link Created",
        "Link Clicked",
        "Link Deleted",
        "Link Updated",
        "Bio Page Viewed"
      ];

      for (const event of eventItems) {
        await expect(page.getByText(new RegExp(event, "i"))).toBeVisible();
      }
    });

    test("should display empty state when no webhooks", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      // Wait for loading
      await page.waitForLoadState("networkidle");

      // Check if empty state or list exists
      const emptyState = page.getByText(/No webhooks configured/i);
      const webhooksList = page.locator("code").filter({ hasText: /https:\/\// });

      // One of them should exist
      const isEmpty = await emptyState.isVisible().catch(() => false);
      const hasList = await webhooksList.first().isVisible().catch(() => false);

      expect(isEmpty || hasList).toBeTruthy();
    });

    test("should close add webhook dialog when cancel is clicked", async ({ page }) => {
      await page.goto("/dashboard/developer/webhooks");

      await page.getByRole("button", { name: /Add Webhook/i }).click();

      // Dialog should be visible
      await expect(page.getByRole("heading", { name: /Add Webhook/i })).toBeVisible();

      // Click cancel
      await page.getByRole("button", { name: /Cancel/i }).first().click();

      // Dialog should be closed
      await expect(page.getByRole("heading", { name: /Add Webhook/i })).not.toBeVisible();
    });

    test("should navigate to webhooks from API keys page", async ({ page }) => {
      await page.goto("/dashboard/developer/api-keys");

      await page.getByRole("link", { name: /Webhooks/i }).click();

      // Should be on webhooks page
      await expect(page).toHaveURL("/dashboard/developer/webhooks");
      await expect(page.getByRole("heading", { level: 2, name: /Webhooks/i })).toBeVisible();
    });
  });

  test.describe("Developer Navigation", () => {
    test("should have consistent header on both pages", async ({ page }) => {
      // Test on API Keys page
      await page.goto("/dashboard/developer/api-keys");

      const apiKeysHeader = page.getByRole("heading", { level: 1, name: /Developer/i });
      await expect(apiKeysHeader).toBeVisible();

      const apiKeysSubtext = page.getByText(/Manage API access and integrations/i);
      await expect(apiKeysSubtext).toBeVisible();

      // Test on Webhooks page
      await page.goto("/dashboard/developer/webhooks");

      const webhooksHeader = page.getByRole("heading", { level: 1, name: /Developer/i });
      await expect(webhooksHeader).toBeVisible();

      const webhooksSubtext = page.getByText(/Integrate PingTO.Me with your applications/i);
      await expect(webhooksSubtext).toBeVisible();
    });

    test("should highlight active page in navigation", async ({ page }) => {
      // API Keys page - API Keys nav item should be highlighted
      await page.goto("/dashboard/developer/api-keys");

      const apiKeysLink = page.getByRole("link", { name: /API Keys/i });
      await expect(apiKeysLink).toHaveClass(/from-blue-600/);

      // Webhooks page - Webhooks nav item should be highlighted
      await page.goto("/dashboard/developer/webhooks");

      const webhooksLink = page.getByRole("link", { name: /Webhooks/i });
      await expect(webhooksLink).toHaveClass(/from-blue-600/);
    });
  });
});
