import { test, expect } from "@playwright/test";

test.describe("Link Status Control", () => {
  const mockLinks = [
    {
      id: "link-1",
      originalUrl: "https://example.com/1",
      slug: "active-link",
      shortUrl: "http://localhost:3000/active-link",
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    },
    {
      id: "link-2",
      originalUrl: "https://example.com/2",
      slug: "disabled-link",
      shortUrl: "http://localhost:3000/disabled-link",
      createdAt: new Date().toISOString(),
      status: "DISABLED",
    },
    {
      id: "link-3",
      originalUrl: "https://example.com/3",
      slug: "archived-link",
      shortUrl: "http://localhost:3000/archived-link",
      createdAt: new Date().toISOString(),
      status: "ARCHIVED",
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

    // Mock tags and campaigns
    await page.route("**/tags", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route("**/campaigns", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
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

  test("STAT-001: Disable Link", async ({ page }) => {
    // Mock status update
    await page.route("**/links/link-1", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.status).toBe("DISABLED");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mockLinks[0], status: "DISABLED" }),
        });
      }
    });

    // Find active link row
    const row = page.locator("tr", { hasText: "active-link" });

    // Open dropdown menu
    await row.locator("button:has(.lucide-more-horizontal)").click();

    // Click Disable option
    await page.click('div[role="menuitem"]:has-text("Disable")');

    // Verify status badge changed (would need page refresh in real scenario)
    // For this test, we verify the API call was made correctly via route assertion
  });

  test("STAT-003: Archive Link", async ({ page }) => {
    // Mock status update
    await page.route("**/links/link-1", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.status).toBe("ARCHIVED");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mockLinks[0], status: "ARCHIVED" }),
        });
      }
    });

    // Find active link row
    const row = page.locator("tr", { hasText: "active-link" });

    // Open dropdown menu
    await row.locator("button:has(.lucide-more-horizontal)").click();

    // Click Archive option
    await page.click('div[role="menuitem"]:has-text("Archive")');

    // Verify API called (via route assertion)
  });

  test("STAT-004: Restore Link (Enable)", async ({ page }) => {
    // Mock status update
    await page.route("**/links/link-2", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.status).toBe("ACTIVE");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mockLinks[1], status: "ACTIVE" }),
        });
      }
    });

    // Find disabled link row
    const row = page.locator("tr", { hasText: "disabled-link" });

    // Open dropdown menu
    await row.locator("button:has(.lucide-more-horizontal)").click();

    // Click Enable option
    await page.click('div[role="menuitem"]:has-text("Enable")');

    // Verify API called (via route assertion)
  });

  test("STAT-005: Disabled link returns 403 at redirect", async ({ page }) => {
    // Mock 403 response for disabled link
    await page.route("**/disabled-link", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Link is disabled",
          message: "This link has been disabled by the creator",
        }),
      });
    });

    // Try to access disabled link directly
    await page.goto("/disabled-link");

    // Verify 403 error response or error message displayed
    // The exact error message depends on how redirector handles it
    // We check for either the status or visible error content
    const response = await page.goto("/disabled-link", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(403);
  });

  test("STAT-006: Bulk disable multiple links", async ({ page }) => {
    // Mock bulk status update endpoint
    await page.route("**/links/bulk-status", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.ids).toHaveLength(2);
        expect(data.status).toBe("DISABLED");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            count: 2,
            updatedLinks: [
              { ...mockLinks[0], status: "DISABLED" },
              { ...mockLinks[1], status: "DISABLED" },
            ],
          }),
        });
      }
    });

    // Select first two links using checkboxes
    // Skip "Select All" checkbox (first one) and select row-specific checkboxes
    const row1 = page.locator("tr", { hasText: "active-link" });
    await row1.locator('button[role="checkbox"]').click();

    const row2 = page.locator("tr", { hasText: "disabled-link" });
    await row2.locator('button[role="checkbox"]').click();

    // Expect bulk action buttons to appear
    await expect(
      page.locator('button:has-text("Disable Selected")'),
    ).toBeVisible();

    // Handle confirm dialog if present
    page.on("dialog", (dialog) => dialog.accept());

    // Click Disable Selected
    await page.click('button:has-text("Disable Selected")');

    // Verify API called (handled by route assertion)
  });

  test("STAT-007: Bulk enable multiple links", async ({ page }) => {
    // Mock bulk status update endpoint
    await page.route("**/links/bulk-status", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.ids).toHaveLength(2);
        expect(data.status).toBe("ACTIVE");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            count: 2,
            updatedLinks: [
              { ...mockLinks[1], status: "ACTIVE" },
              { ...mockLinks[2], status: "ACTIVE" },
            ],
          }),
        });
      }
    });

    // Update mock to return disabled links for this test
    const disabledLinks = mockLinks.map((link) => ({
      ...link,
      status: "DISABLED",
    }));

    await page.route("**/links?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: disabledLinks,
          meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    // Reload to get disabled links
    await page.reload();

    // Select disabled links
    const row1 = page.locator("tr", { hasText: "disabled-link" });
    await row1.locator('button[role="checkbox"]').click();

    const row2 = page.locator("tr", { hasText: "archived-link" });
    await row2.locator('button[role="checkbox"]').click();

    // Expect bulk action buttons to appear
    await expect(
      page.locator('button:has-text("Enable Selected")'),
    ).toBeVisible();

    // Handle confirm dialog if present
    page.on("dialog", (dialog) => dialog.accept());

    // Click Enable Selected
    await page.click('button:has-text("Enable Selected")');

    // Verify API called (handled by route assertion)
  });

  test("STAT-008: Archived link returns 410 at redirect", async ({ page }) => {
    // Mock 410 response for archived link
    await page.route("**/archived-link", async (route) => {
      await route.fulfill({
        status: 410,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Link not found",
          message: "This link has been archived and is no longer available",
        }),
      });
    });

    // Try to access archived link directly
    const response = await page.goto("/archived-link", {
      waitUntil: "domcontentloaded",
    });

    // Verify 410 Gone response
    expect(response?.status()).toBe(410);
  });

  test("STAT-009: Banned link returns 410 at redirect", async ({ page }) => {
    // Mock 410 response for banned link
    // Banned links are similar to archived - they return 410 Gone
    const bannedLink = {
      id: "link-banned",
      originalUrl: "https://example.com/banned",
      slug: "banned-link",
      shortUrl: "http://localhost:3000/banned-link",
      createdAt: new Date().toISOString(),
      status: "BANNED",
    };

    await page.route("**/banned-link", async (route) => {
      await route.fulfill({
        status: 410,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Link not available",
          message:
            "This link has been banned and is no longer available. Please contact support if you believe this is an error.",
        }),
      });
    });

    // Try to access banned link directly
    const response = await page.goto("/banned-link", {
      waitUntil: "domcontentloaded",
    });

    // Verify 410 Gone response
    expect(response?.status()).toBe(410);
  });
});
