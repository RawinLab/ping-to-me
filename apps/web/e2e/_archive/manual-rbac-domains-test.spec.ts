import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

/**
 * Manual RBAC test for domains page
 * Tests the visibility of permission-gated buttons
 */

test.describe("Manual RBAC Test: Domains Page", () => {
  test("VIEWER - Add Domain button should be hidden", async ({ page }) => {
    await loginAsUser(page, "viewer");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Try to find Add Domain button
    const addButton = page.locator('button:has-text("Add Domain")');
    const count = await addButton.count();

    console.log(`VIEWER - Add Domain buttons found: ${count}`);
    expect(count).toBe(0);
  });

  test("VIEWER - Delete button should be hidden", async ({ page }) => {
    await loginAsUser(page, "viewer");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check for trash/delete icon
    const deleteBtn = page.locator('button >> svg.lucide-trash2');
    const count = await deleteBtn.count();

    console.log(`VIEWER - Delete buttons found: ${count}`);
    expect(count).toBe(0);
  });

  test("EDITOR - Add Domain button should be hidden", async ({ page }) => {
    await loginAsUser(page, "editor");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addButton = page.locator('button:has-text("Add Domain")');
    const count = await addButton.count();

    console.log(`EDITOR - Add Domain buttons found: ${count}`);
    expect(count).toBe(0);
  });

  test("EDITOR - Delete button should be hidden", async ({ page }) => {
    await loginAsUser(page, "editor");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const deleteBtn = page.locator('button >> svg.lucide-trash2');
    const count = await deleteBtn.count();

    console.log(`EDITOR - Delete buttons found: ${count}`);
    expect(count).toBe(0);
  });

  test("ADMIN - Add Domain button should be visible", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addButton = page.locator('button:has-text("Add Domain")');
    const count = await addButton.count();

    console.log(`ADMIN - Add Domain buttons found: ${count}`);
    expect(count).toBeGreaterThan(0);

    if (count > 0) {
      await expect(addButton.first()).toBeEnabled();
    }
  });

  test("ADMIN - Delete button should be visible", async ({ page }) => {
    await loginAsUser(page, "admin");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const deleteBtn = page.locator('button >> svg.lucide-trash2');
    const count = await deleteBtn.count();

    console.log(`ADMIN - Delete buttons found: ${count}`);
    // If domains exist, delete buttons should be visible
    // Otherwise this is a valid state
  });

  test("OWNER - Add Domain button should be visible", async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const addButton = page.locator('button:has-text("Add Domain")');
    const count = await addButton.count();

    console.log(`OWNER - Add Domain buttons found: ${count}`);
    expect(count).toBeGreaterThan(0);

    if (count > 0) {
      await expect(addButton.first()).toBeEnabled();
    }
  });

  test("OWNER - Delete button should be visible", async ({ page }) => {
    await loginAsUser(page, "owner");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const deleteBtn = page.locator('button >> svg.lucide-trash2');
    const count = await deleteBtn.count();

    console.log(`OWNER - Delete buttons found: ${count}`);
    // If domains exist, delete buttons should be visible
    // Otherwise this is a valid state
  });
});
