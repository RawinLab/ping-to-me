import { test } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

test("Debug API Keys Page Structure", async ({ page }) => {
  // Login
  await loginAsUser(page, "owner");

  // Navigate to API keys page
  await page.goto("/dashboard/developer/api-keys");
  await page.waitForLoadState("networkidle");

  // Take full page screenshot
  await page.screenshot({ path: "screenshots/debug-api-keys-page.png", fullPage: true });

  // Check what elements are on the page
  const heading = await page.locator("h2, h1").first().textContent();
  console.log("Page heading:", heading);

  // Check for "Create API Key" button
  const createButton = await page.locator('button:has-text("Create")').first();
  const createButtonVisible = await createButton.isVisible().catch(() => false);
  console.log("Create button visible:", createButtonVisible);

  // Look for any table elements
  const tableHeaders = await page.locator("thead, [role='rowgroup']").count();
  console.log("Table headers found:", tableHeaders);

  // Look for any badge-like elements
  const badges = await page.locator('[class*="bg-"][class*="text"]').count();
  console.log("Badge-like elements:", badges);

  // Look for text content
  const allText = await page.locator("body").textContent();
  const hasApiKey = allText?.includes("API Key") || false;
  const hasNeverUsed = allText?.includes("Never used") || false;
  const hasActive = allText?.includes("Active") || false;

  console.log("Has 'API Key' text:", hasApiKey);
  console.log("Has 'Never used' text:", hasNeverUsed);
  console.log("Has 'Active' text:", hasActive);

  // Check if there are any API keys at all
  const noKeysMessage = await page.locator("text=No API keys yet").isVisible().catch(() => false);
  console.log("No API keys message visible:", noKeysMessage);

  if (noKeysMessage) {
    console.log("No test data available - would need to create API keys first");
  }
});
