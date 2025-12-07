import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.describe("Bulk Link Management", () => {
  const mockLinks = [
    {
      id: "link-1",
      originalUrl: "https://example.com/1",
      slug: "link-1",
      shortUrl: "http://localhost:3000/link-1",
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    {
      id: "link-2",
      originalUrl: "https://example.com/2",
      slug: "link-2",
      shortUrl: "http://localhost:3000/link-2",
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    {
      id: "link-3",
      originalUrl: "https://example.com/3",
      slug: "link-3",
      shortUrl: "http://localhost:3000/link-3",
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.context().addCookies([
      {
        name: "refresh_token",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock dashboard metrics
    await page.route("**/analytics/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalLinks: 10,
          totalClicks: 100,
          recentClicks: [],
          clicksByDate: [],
        }),
      });
    });

    // Mock links list
    await page.route("**/links?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: mockLinks,
          meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    await page.goto("/dashboard");
  });

  test("BULK-001: Import Links via CSV", async ({ page }) => {
    // Mock import endpoint
    await page.route("**/links/import", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          success: 2,
          failed: 0,
          errors: [],
        }),
      });
    });

    // Click Import button
    await page.click('button:has-text("Import")');

    // Expect modal to open
    await expect(page.locator("text=Import Links from CSV")).toBeVisible();

    // Create a dummy CSV file
    const csvContent =
      "originalUrl,slug\nhttps://google.com,google\nhttps://bing.com,bing";
    const csvPath = path.join(__dirname, "test-import.csv");
    fs.writeFileSync(csvPath, csvContent);

    // Upload CSV
    await page.setInputFiles('input[type="file"]', csvPath);

    // Click Import button (in modal)
    await page.click('button:has-text("Import Links")');

    // Expect success report
    await expect(page.locator("text=Import Completed")).toBeVisible();
    await expect(page.locator("text=2").first()).toBeVisible(); // Total

    // Click Done
    await page.click('button:has-text("Done")');
    await expect(page.locator("text=Import Links from CSV")).not.toBeVisible();

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test("BULK-002: Import Links - Validation Error", async ({ page }) => {
    await page.route("**/links/import", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          total: 2,
          success: 1,
          failed: 1,
          errors: [{ row: { originalUrl: "invalid" }, error: "Invalid URL" }],
        }),
      });
    });

    await page.click('button:has-text("Import")');

    const csvContent = "originalUrl\nhttps://valid.com\ninvalid-url";
    const csvPath = path.join(__dirname, "test-import-error.csv");
    fs.writeFileSync(csvPath, csvContent);

    await page.setInputFiles('input[id="file"]', csvPath);

    await page.click('button:has-text("Import Links")');

    // Verify error reporting
    await expect(page.locator("text=Import Completed")).toBeVisible();
    await expect(page.locator("text=Failed")).toBeVisible();
    await expect(page.locator("text=Invalid URL")).toBeVisible();

    fs.unlinkSync(csvPath);
  });

  test("BULK-003: Export Links", async ({ page }) => {
    // Mock export endpoint
    await page.route("**/links/export", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        headers: {
          "Content-Disposition": 'attachment; filename="links.csv"',
        },
        body: "originalUrl,slug\nhttps://example.com/1,link-1",
      });
    });

    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("links.csv");
  });

  test("BULK-004: Bulk Delete", async ({ page }) => {
    // Mock bulk delete endpoint
    await page.route("**/links/bulk-delete", async (route) => {
      const postData = route.request().postDataJSON();
      expect(postData.ids).toHaveLength(2);
      expect(postData.ids).toContain("link-1");
      expect(postData.ids).toContain("link-2");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 2 }),
      });
    });

    // Select first two links using role="checkbox"
    // The first checkbox is "Select All" in header.
    // The subsequent ones are for rows.

    // Find row for link-1 and click its checkbox
    const row1 = page.locator("tr", { hasText: "link-1" });
    await row1.locator('button[role="checkbox"]').click();

    // Select link-2
    const row2 = page.locator("tr", { hasText: "link-2" });
    await row2.locator('button[role="checkbox"]').click();

    // Expect "Delete Selected" button to appear
    await expect(
      page.locator('button:has-text("Delete Selected")'),
    ).toBeVisible();

    // Handle confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Click Delete Selected
    await page.click('button:has-text("Delete Selected")');

    // Verify API called (handled by route assertion)
  });

  test("BULK-005: Bulk Tagging", async ({ page }) => {
    // Mock tags list
    await page.route("**/tags", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "tag-1", name: "Marketing" },
          { id: "tag-2", name: "Social" },
        ]),
      });
    });

    // Mock campaigns (empty)
    await page.route("**/campaigns", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Mock bulk-tag endpoint
    await page.route("**/links/bulk-tag", async (route) => {
      const postData = route.request().postDataJSON();
      expect(postData.ids).toHaveLength(2);
      expect(postData.tagName).toBe("Marketing");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, count: 2, tagName: "Marketing" }),
      });
    });

    // Reload to get tags
    await page.reload();

    // Select first two links
    const row1 = page.locator("tr", { hasText: "link-1" });
    await row1.locator('button[role="checkbox"]').click();

    const row2 = page.locator("tr", { hasText: "link-2" });
    await row2.locator('button[role="checkbox"]').click();

    // Click "Tag Selected" button
    await page.click('button:has-text("Tag Selected")');

    // Dialog should open
    await expect(page.locator("text=Add Tag to Links")).toBeVisible();

    // Select a tag from dropdown
    await page.click('[role="combobox"]:near(:text("Select a tag"))');
    await page.click("text=Marketing");

    // Handle alert
    page.on("dialog", (dialog) => dialog.accept());

    // Click Add Tag
    await page.click('button:has-text("Add Tag")');

    // Verify API called (handled by route assertion)
  });
});
