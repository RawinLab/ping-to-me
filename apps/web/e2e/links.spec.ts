import { test, expect } from "@playwright/test";

test.describe("Short Link Creation", () => {
  const randomId = Math.random().toString(36).substring(7);
  const validUrl = "https://google.com";
  const customSlug = `custom-${randomId}`;

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mock-access-token",
          user: {
            id: "mock-user-id",
            email: "test@example.com",
            role: "OWNER",
          },
        }),
      });
    });

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
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
      });
    });

    // Set cookie to pass middleware
    await page.context().addCookies([
      {
        name: "refresh_token",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Login and go to dashboard
    await page.goto("/login");
    // Simulate login success by setting token (if app checks it) or just relying on mock
    // Since we mock refresh, we can just go to dashboard
    await page.goto("/dashboard");
  });

  test("LINK-001: Create Short Link - Random Slug", async ({ page }) => {
    // Mock create API
    await page.route("**/links", async (route) => {
      const postData = route.request().postDataJSON();
      if (postData.slug) return route.continue(); // Pass to next handler if slug present (for other tests)

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "link-id",
          originalUrl: postData.originalUrl,
          slug: "randomSlug",
          shortUrl: "http://localhost:3000/randomSlug",
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        }),
      });
    });

    await page.fill('input[type="url"]', validUrl);
    await page.click('button:has-text("Create Link")');

    // Verify form cleared
    await expect(page.locator('input[type="url"]')).toBeEmpty();

    // Verify link appears in table (we need to mock the table refresh)
    // Since table refresh calls GET /links, we should update that mock or just check if create was called.
    // But checking UI is better.
    // Let's update the GET /links mock to return the new link after create.
    // This is hard with static mocks.
    // We can verify the "Create Link" button enabled state or success message if any.
    // The current implementation just clears the form and alerts on error.
    // It doesn't show success toast.
    // So checking empty form is one way.
  });

  test("LINK-002: Create Short Link - Custom Slug", async ({ page }) => {
    await page.route("**/links", async (route) => {
      const postData = route.request().postDataJSON();
      if (postData.slug !== customSlug) return route.continue();

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "link-id-custom",
          originalUrl: postData.originalUrl,
          slug: customSlug,
          shortUrl: `http://localhost:3000/${customSlug}`,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        }),
      });
    });

    await page.fill('input[type="url"]', validUrl);
    await page.fill('input[placeholder="custom-slug"]', customSlug);
    await page.click('button:has-text("Create Link")');

    await expect(page.locator('input[placeholder="custom-slug"]')).toBeEmpty();
  });

  test("LINK-003: Create Short Link - Invalid URL", async ({ page }) => {
    // Client-side validation usually handles this for type="url"
    await page.fill('input[type="url"]', "invalid-url");
    await page.click('button:has-text("Create Link")');

    // Browser validation message is hard to check with Playwright directly without specific API
    // But we can check if the request was NOT sent.
    // Or check :invalid pseudo-class
    // Check if the input is invalid
    const isInvalid = await page.$eval(
      'input[type="url"]',
      (el: HTMLInputElement) => !el.checkValidity(),
    );
    expect(isInvalid).toBe(true);
  });

  test("LINK-004: Create Short Link - Duplicate Custom Slug", async ({
    page,
  }) => {
    await page.route("**/links", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Slug already taken" }),
      });
    });

    // Mock window.alert
    let dialogMessage = "";
    page.on("dialog", (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });

    await page.fill('input[type="url"]', validUrl);
    await page.fill('input[placeholder="custom-slug"]', "taken");
    await page.click('button:has-text("Create Link")');

    // Expect alert
    // Wait a bit for alert to trigger
    await page.waitForTimeout(500);
    expect(dialogMessage).toBe("Slug already taken");
  });

  test("LINK-006: Create Short Link - With Expiration", async ({ page }) => {
    await page.route("**/links", async (route) => {
      const postData = route.request().postDataJSON();
      if (!postData.expirationDate) return route.continue();

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "link-id-exp",
          originalUrl: postData.originalUrl,
          slug: "expSlug",
          expirationDate: postData.expirationDate,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        }),
      });
    });

    await page.fill('input[type="url"]', validUrl);
    // Set expiration date (datetime-local)
    // Format: YYYY-MM-DDTHH:mm
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expStr = tomorrow.toISOString().slice(0, 16);

    await page.fill('input[type="datetime-local"]', expStr);
    await page.click('button:has-text("Create Link")');

    await expect(page.locator('input[type="datetime-local"]')).toBeEmpty();
  });

  test("LINK-005: Create Short Link - With Tags", async ({ page }) => {
    await page.route("**/links", async (route) => {
      const postData = route.request().postDataJSON();
      if (!postData.tags || postData.tags.length === 0) return route.continue();

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "link-id-tags",
          originalUrl: postData.originalUrl,
          slug: "tagSlug",
          tags: postData.tags,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        }),
      });
    });

    await page.fill('input[type="url"]', validUrl);
    await page.fill('input[placeholder="tag1, tag2"]', "Marketing, Social");
    await page.click('button:has-text("Create Link")');

    await expect(page.locator('input[placeholder="tag1, tag2"]')).toBeEmpty();
  });

  test("LINK-007: Create Short Link - Password Protected", async ({ page }) => {
    await page.route("**/links", async (route) => {
      const postData = route.request().postDataJSON();
      if (!postData.password) return route.continue();

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "link-id-pass",
          originalUrl: postData.originalUrl,
          slug: "passSlug",
          passwordHash: "hashed-password",
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
        }),
      });
    });

    await page.fill('input[type="url"]', validUrl);
    await page.fill('input[type="password"]', "secret123");
    await page.click('button:has-text("Create Link")');

    await expect(page.locator('input[type="password"]')).toBeEmpty();
  });
});
