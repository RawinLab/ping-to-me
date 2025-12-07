import { test, expect } from "@playwright/test";

test.describe("QR Code Generation", () => {
  const randomId = Math.random().toString(36).substring(7);
  const mockLink = {
    id: "link-id-qr",
    originalUrl: "https://google.com",
    slug: `qr-${randomId}`,
    shortUrl: `http://localhost:3000/qr-${randomId}`,
    createdAt: new Date().toISOString(),
    status: "ACTIVE",
  };

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
          data: [mockLink],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      });
    });

    // Mock QR generation
    await page.route("**/qr/custom", async (route) => {
      const postData = route.request().postDataJSON();
      // Simple mock returning a data URL (1x1 red pixel for simplicity if color is red)
      // In real app, backend generates it.
      // We can just return a placeholder data URL.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          dataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        }),
      });
    });

    await page.goto("/dashboard");
  });

  test("QR-001: Generate QR Code", async ({ page }) => {
    // Click QR code button for the link
    // The button has a QrCode icon.
    // We can find it by row.
    const row = page.locator("tr", { hasText: mockLink.slug });
    await row.locator("button:has(.lucide-qr-code)").click();

    // Expect modal to open
    await expect(page.locator("text=Customize QR Code")).toBeVisible();

    // Expect QR image to be visible
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
  });

  test("QR-002: Customize QR Code", async ({ page }) => {
    const row = page.locator("tr", { hasText: mockLink.slug });
    await row.locator("button:has(.lucide-qr-code)").click();

    // Change color
    await page.fill('input[id="color"]', "#ff0000");

    // Trigger change (blur or input event might be needed depending on implementation)
    // The implementation uses onChange, so fill should trigger it.
    // But color input might need specific handling.
    // Let's try filling the text input next to it if available, or just the color input.
    // The modal has both color picker and text input.
    // Let's fill the text input which has class "uppercase".
    // Wait, there are two inputs with class "uppercase" (fg and bg).
    // We need to be specific.
    // Label "Foreground Color" -> div -> input.uppercase

    // Find input associated with "Foreground Color"
    // The structure is Label -> div -> [color input, text input]
    // We can target by label text?
    // Or just use the id="color" for the color picker.
    // Playwright fill on color input works.

    // Verify API call was made with new color
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().includes("/qr/custom") &&
        request.postDataJSON().color === "#ff0000",
    );

    // Trigger update. The useEffect depends on [color], so changing state triggers it.
    // We might need to wait a bit or ensure the previous request finished.
    // Let's force a change.
    await page.fill('input[id="color"]', "#ff0000");

    await requestPromise;
  });

  test("QR-003: Download QR Code", async ({ page }) => {
    const row = page.locator("tr", { hasText: mockLink.slug });
    await row.locator("button:has(.lucide-qr-code)").click();

    // Wait for QR to generate
    await expect(page.locator('img[alt="QR Code"]')).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download
    await page.click('button:has-text("Download PNG")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`qr-${mockLink.slug}.png`);
  });
});
