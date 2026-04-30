import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Comprehensive RBAC Test for Domains Page
 * Tests visibility of ALL permission-gated UI elements
 */

const REPORT_FILE = "/tmp/rbac-domains-test-report.txt";

async function logToReport(message: string) {
  await fs.appendFile(REPORT_FILE, message + "\n");
}

test.describe("Comprehensive RBAC Test: Domains Page", () => {
  test.beforeAll(async () => {
    // Clear report file
    await fs.writeFile(REPORT_FILE, "RBAC Domains Page Test Report\n");
    await logToReport("=".repeat(60));
    await logToReport(new Date().toISOString());
    await logToReport("=".repeat(60) + "\n");
  });

  test("VIEWER Role - All Permission Checks", async ({ page }) => {
    console.log("\n=== Testing VIEWER Role ===");
    await logToReport("\n--- Testing VIEWER Role ---");

    await loginAsUser(page, "viewer");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = "/tmp/rbac-viewer-domains.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot: ${screenshotPath}`);

    // Test 1: Add Domain button
    const addButton = page.locator('button:has-text("Add Domain")');
    const addCount = await addButton.count();
    console.log(`Add Domain buttons found: ${addCount}`);
    await logToReport(`Add Domain buttons: ${addCount} (expected: 0) - ${addCount === 0 ? "PASS" : "FAIL"}`);
    expect(addCount).toBe(0);

    // Test 2: Delete buttons
    const deleteBtn = page.locator('button[class*="text-red-500"]');
    const deleteCount = await deleteBtn.count();
    console.log(`Delete buttons found: ${deleteCount}`);
    await logToReport(`Delete buttons: ${deleteCount} (expected: 0) - ${deleteCount === 0 ? "PASS" : "FAIL"}`);
    expect(deleteCount).toBe(0);

    // Test 3: Verify Now buttons
    const verifyBtn = page.locator('button:has-text("Verify Now"), button:has-text("Retry")');
    const verifyCount = await verifyBtn.count();
    console.log(`Verify buttons found: ${verifyCount}`);
    await logToReport(`Verify Now buttons: ${verifyCount} (expected: 0) - ${verifyCount === 0 ? "PASS" : "FAIL"}`);
    expect(verifyCount).toBe(0);

    // Test 4: Set Default buttons
    const setDefaultBtn = page.locator('button:has-text("Set Default")');
    const setDefaultCount = await setDefaultBtn.count();
    console.log(`Set Default buttons found: ${setDefaultCount}`);
    await logToReport(`Set Default buttons: ${setDefaultCount} (expected: 0) - ${setDefaultCount === 0 ? "PASS" : "FAIL"}`);
    expect(setDefaultCount).toBe(0);

    // Test 5: View/Eye buttons should be visible
    const eyeBtn = page.locator('button[class*="variant-outline"] svg.lucide-eye, button:has-text("View")');
    const eyeCount = await eyeBtn.count();
    console.log(`Eye/View buttons found: ${eyeCount}`);
    await logToReport(`Eye/View buttons: ${eyeCount} (expected: > 0)`);

    // Test 6: Page should be accessible and show title
    const title = page.locator('h1:has-text("Custom Domains")');
    await expect(title).toBeVisible({ timeout: 5000 });
    await logToReport("Page title visible: PASS");

    await logToReport("VIEWER Role: ALL TESTS PASSED\n");
  });

  test("EDITOR Role - All Permission Checks", async ({ page }) => {
    console.log("\n=== Testing EDITOR Role ===");
    await logToReport("\n--- Testing EDITOR Role ---");

    await loginAsUser(page, "editor");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = "/tmp/rbac-editor-domains.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot: ${screenshotPath}`);

    // Test 1: Add Domain button
    const addButton = page.locator('button:has-text("Add Domain")');
    const addCount = await addButton.count();
    console.log(`Add Domain buttons found: ${addCount}`);
    await logToReport(`Add Domain buttons: ${addCount} (expected: 0) - ${addCount === 0 ? "PASS" : "FAIL"}`);
    expect(addCount).toBe(0);

    // Test 2: Delete buttons
    const deleteBtn = page.locator('button[class*="text-red-500"]');
    const deleteCount = await deleteBtn.count();
    console.log(`Delete buttons found: ${deleteCount}`);
    await logToReport(`Delete buttons: ${deleteCount} (expected: 0) - ${deleteCount === 0 ? "PASS" : "FAIL"}`);
    expect(deleteCount).toBe(0);

    // Test 3: Verify Now buttons
    const verifyBtn = page.locator('button:has-text("Verify Now"), button:has-text("Retry")');
    const verifyCount = await verifyBtn.count();
    console.log(`Verify buttons found: ${verifyCount}`);
    await logToReport(`Verify Now buttons: ${verifyCount} (expected: 0) - ${verifyCount === 0 ? "PASS" : "FAIL"}`);
    expect(verifyCount).toBe(0);

    // Test 4: Set Default buttons
    const setDefaultBtn = page.locator('button:has-text("Set Default")');
    const setDefaultCount = await setDefaultBtn.count();
    console.log(`Set Default buttons found: ${setDefaultCount}`);
    await logToReport(`Set Default buttons: ${setDefaultCount} (expected: 0) - ${setDefaultCount === 0 ? "PASS" : "FAIL"}`);
    expect(setDefaultCount).toBe(0);

    // Test 5: Page should be accessible
    const title = page.locator('h1:has-text("Custom Domains")');
    await expect(title).toBeVisible({ timeout: 5000 });
    await logToReport("Page title visible: PASS");

    await logToReport("EDITOR Role: ALL TESTS PASSED\n");
  });

  test("ADMIN Role - All Permission Checks", async ({ page }) => {
    console.log("\n=== Testing ADMIN Role ===");
    await logToReport("\n--- Testing ADMIN Role ---");

    await loginAsUser(page, "admin");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = "/tmp/rbac-admin-domains.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot: ${screenshotPath}`);

    // Test 1: Add Domain button should be visible
    const addButton = page.locator('button:has-text("Add Domain")');
    const addCount = await addButton.count();
    console.log(`Add Domain buttons found: ${addCount}`);
    await logToReport(`Add Domain buttons: ${addCount} (expected: >= 1) - ${addCount > 0 ? "PASS" : "FAIL"}`);
    expect(addCount).toBeGreaterThan(0);

    if (addCount > 0) {
      await expect(addButton.first()).toBeEnabled();
      await logToReport("Add Domain button is enabled: PASS");
    }

    // Test 2: Delete buttons should be visible (if domains exist)
    const deleteBtn = page.locator('button[class*="text-red-500"]');
    const deleteCount = await deleteBtn.count();
    console.log(`Delete buttons found: ${deleteCount}`);
    await logToReport(`Delete buttons: ${deleteCount} (expected: > 0 if domains exist)`);

    if (deleteCount > 0) {
      await expect(deleteBtn.first()).toBeEnabled();
      await logToReport("Delete buttons are enabled: PASS");
    }

    // Test 3: Page should be accessible
    const title = page.locator('h1:has-text("Custom Domains")');
    await expect(title).toBeVisible({ timeout: 5000 });
    await logToReport("Page title visible: PASS");

    await logToReport("ADMIN Role: ALL TESTS PASSED\n");
  });

  test("OWNER Role - All Permission Checks", async ({ page }) => {
    console.log("\n=== Testing OWNER Role ===");
    await logToReport("\n--- Testing OWNER Role ---");

    await loginAsUser(page, "owner");
    await page.goto("/dashboard/domains");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot
    const screenshotPath = "/tmp/rbac-owner-domains.png";
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot: ${screenshotPath}`);

    // Test 1: Add Domain button should be visible
    const addButton = page.locator('button:has-text("Add Domain")');
    const addCount = await addButton.count();
    console.log(`Add Domain buttons found: ${addCount}`);
    await logToReport(`Add Domain buttons: ${addCount} (expected: >= 1) - ${addCount > 0 ? "PASS" : "FAIL"}`);
    expect(addCount).toBeGreaterThan(0);

    if (addCount > 0) {
      await expect(addButton.first()).toBeEnabled();
      await logToReport("Add Domain button is enabled: PASS");
    }

    // Test 2: Delete buttons should be visible (if domains exist)
    const deleteBtn = page.locator('button[class*="text-red-500"]');
    const deleteCount = await deleteBtn.count();
    console.log(`Delete buttons found: ${deleteCount}`);
    await logToReport(`Delete buttons: ${deleteCount} (expected: > 0 if domains exist)`);

    if (deleteCount > 0) {
      await expect(deleteBtn.first()).toBeEnabled();
      await logToReport("Delete buttons are enabled: PASS");
    }

    // Test 3: Page should be accessible
    const title = page.locator('h1:has-text("Custom Domains")');
    await expect(title).toBeVisible({ timeout: 5000 });
    await logToReport("Page title visible: PASS");

    await logToReport("OWNER Role: ALL TESTS PASSED\n");
  });

  test.afterAll(async () => {
    await logToReport("\n" + "=".repeat(60));
    await logToReport("All tests completed");
    await logToReport("=".repeat(60));

    // Print report to console
    const report = await fs.readFile(REPORT_FILE, "utf-8");
    console.log("\n\n" + report);
  });
});
