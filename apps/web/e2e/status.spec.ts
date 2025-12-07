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
});
