import { test, expect, Page } from "@playwright/test";

/**
 * E2E Tests for Create Link Page (/dashboard/links/new)
 *
 * Features tested:
 * - Link Details: Destination URL, Custom Slug, Title, Tags
 * - Sharing Options: QR Code customization (colors, logo), Bio Page integration
 * - Advanced Settings: UTM Parameters, Expiration, Password, Redirect Type, Deep Link
 * - Form submission and success state
 */

test.describe("Create Link Page", () => {
  const validUrl = "https://example.com/my-long-url";
  const randomId = Math.random().toString(36).substring(7);

  // Helper to setup authenticated state
  async function setupAuthenticatedState(page: Page) {
    // Set refresh token cookie
    await page.context().addCookies([
      {
        name: "refresh_token",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock auth endpoints
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mock-access-token",
          user: { id: "user-1", email: "test@example.com", role: "OWNER" },
        }),
      });
    });

    await page.route("**/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
        }),
      });
    });

    // Mock notifications
    await page.route("**/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ notifications: [], unreadCount: 0 }),
      });
    });

    // Mock organizations
    await page.route("**/organizations", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "org-1", name: "My Organization", slug: "my-org" },
        ]),
      });
    });

    // Mock domains
    await page.route("**/domains*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "domain-1", hostname: "custom.link", isVerified: true },
        ]),
      });
    });

    // Mock bio pages
    await page.route("**/biopages*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "bio-1", slug: "myprofile", title: "My Profile" },
          ]),
        });
      } else {
        await route.continue();
      }
    });
  }

  // Helper to create successful link response
  function createLinkResponse(postData: any, customSlug?: string) {
    const slug =
      customSlug ||
      postData.slug ||
      `link-${Math.random().toString(36).substring(7)}`;
    return {
      id: `link-${Math.random().toString(36).substring(7)}`,
      originalUrl: postData.originalUrl,
      slug,
      shortUrl: `http://localhost:3000/${slug}`,
      qrCode:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      title: postData.title,
      tags: postData.tags || [],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
  }

  test.describe("Page Navigation & Layout", () => {
    test("should navigate to create link page", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      await expect(
        page.locator('h1:has-text("Create a new link")'),
      ).toBeVisible();
    });

    test("should display all collapsible sections", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Link details section
      await expect(page.locator("text=Link details")).toBeVisible();

      // Sharing options section
      await expect(page.locator("text=Sharing options")).toBeVisible();

      // Advanced settings section
      await expect(page.locator("text=Advanced settings")).toBeVisible();
    });

    test("should have Cancel and Create buttons", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(
        page.locator('button:has-text("Create your link")'),
      ).toBeVisible();
    });
  });

  test.describe("Link Details Section", () => {
    test("CL-001: should create link with destination URL only", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.originalUrl).toBe(validUrl);
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      // Fill destination URL
      await page.fill("input#originalUrl", validUrl);

      // Submit form
      await page.click('button:has-text("Create your link")');

      // Should show success state
      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-002: should create link with custom slug", async ({ page }) => {
      await setupAuthenticatedState(page);
      const customSlug = `my-custom-link-${randomId}`;

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.slug).toBe(customSlug);
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData, customSlug)),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", validUrl);
      await page.fill(
        'input[placeholder="custom-slug (optional)"]',
        customSlug,
      );

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-003: should show error for duplicate slug", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ message: "This slug is already taken" }),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", validUrl);
      await page.fill(
        'input[placeholder="custom-slug (optional)"]',
        "taken-slug",
      );

      await page.click('button:has-text("Create your link")');

      // Should show error message
      await expect(page.locator("text=This slug is already taken")).toBeVisible(
        { timeout: 5000 },
      );
    });

    test("CL-004: should create link with title", async ({ page }) => {
      await setupAuthenticatedState(page);
      const title = "My Awesome Link";

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.title).toBe(title);
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", validUrl);
      await page.fill("input#title", title);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-005: should create link with tags", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.tags).toContain("marketing");
          expect(postData.tags).toContain("social");
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", validUrl);
      await page.fill("input#tags", "marketing, social");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-006: should validate URL format", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Fill invalid URL
      await page.fill("input#originalUrl", "not-a-valid-url");

      // Try to submit
      await page.click('button:has-text("Create your link")');

      // Should show validation error
      await expect(page.locator("text=Please enter a valid URL")).toBeVisible();
    });

    test("CL-007: should show custom domain in dropdown", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Click on domain selector (first combobox in the form)
      await page.locator('[role="combobox"]').first().click();

      // Should show custom domain in the dropdown
      await expect(
        page.getByRole("option", { name: "custom.link" }),
      ).toBeVisible();
    });
  });

  test.describe("Sharing Options - QR Code", () => {
    test("CL-010: should toggle QR code generation", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Sharing options section should already be open by default
      // Find QR code toggle - it's the first switch in the sharing options section
      const qrToggle = page.locator('button[role="switch"]').first();

      // Should be enabled by default
      await expect(qrToggle).toHaveAttribute("data-state", "checked");

      // Toggle off
      await qrToggle.click();
      await expect(qrToggle).toHaveAttribute("data-state", "unchecked");

      // QR customizer should be hidden
      await expect(page.locator("text=Code color")).not.toBeVisible();
    });

    test("CL-011: should display QR color presets", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Sharing options is open by default, should show Code color label
      await expect(page.locator("text=Code color")).toBeVisible();

      // Should have 8 color preset buttons (round buttons with background color)
      const colorButtons = page.locator(".bg-slate-50 button.rounded-full");
      await expect(colorButtons).toHaveCount(8);
    });

    test("CL-012: should change QR color and update preview", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      // Mock QR preview API
      let qrRequestColor = "";
      await page.route("**/qr/advanced", async (route) => {
        const postData = route.request().postDataJSON();
        qrRequestColor = postData.foregroundColor;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      await page.goto("/dashboard/links/new");

      // Fill URL first to trigger preview
      await page.fill("input#originalUrl", validUrl);

      // Click on Blue color preset
      const blueButton = page.locator('button[title="Blue"]');
      await blueButton.click();

      // Wait for API call
      await page.waitForTimeout(1000);

      // Verify the color was sent
      expect(qrRequestColor).toBe("#2563EB");
    });

    test("CL-013: should upload logo for QR code", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/qr/advanced", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Upload logo - file input is inside the QR customizer section
      const fileInput = page
        .locator('input[type="file"][accept="image/*"]')
        .first();

      // Create a small test image
      const buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      await fileInput.setInputFiles({
        name: "logo.png",
        mimeType: "image/png",
        buffer,
      });

      // Should show logo preview with remove button
      await expect(page.locator('img[alt="Logo preview"]').first()).toBeVisible(
        { timeout: 5000 },
      );
    });

    test("CL-014: should remove uploaded logo", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/qr/advanced", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Upload logo first
      const fileInput = page
        .locator('input[type="file"][accept="image/*"]')
        .first();
      const buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      await fileInput.setInputFiles({
        name: "logo.png",
        mimeType: "image/png",
        buffer,
      });

      await expect(page.locator('img[alt="Logo preview"]').first()).toBeVisible(
        { timeout: 5000 },
      );

      // Click remove button (X icon) - it's in the logo preview container
      const logoContainer = page
        .locator('img[alt="Logo preview"]')
        .first()
        .locator("..");
      await logoContainer.locator("button").click();

      // Logo should be removed, Add logo button should appear
      await expect(page.locator('button:has-text("Add logo")')).toBeVisible();
    });

    test("CL-015: should show QR preview when URL is entered", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      await page.route("**/qr/advanced", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      await page.goto("/dashboard/links/new");

      // Initially should show placeholder
      await expect(page.locator("text=Enter URL to preview")).toBeVisible();

      // Fill URL
      await page.fill("input#originalUrl", validUrl);

      // Wait for preview to load (debounced 500ms + request time)
      await page.waitForTimeout(1500);

      // Should show QR preview image
      await expect(page.locator('img[alt="QR Code Preview"]')).toBeVisible();
    });

    test("CL-016: should create link with custom QR color", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      await page.route("**/qr/advanced", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      let linkPayload: any = null;
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          linkPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(linkPayload)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Select red color
      await page.locator('button[title="Red"]').click();

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
      expect(linkPayload.qrColor).toBe("#DC2626");
    });
  });

  test.describe("Sharing Options - Bio Page", () => {
    test("CL-020: should toggle add to bio page", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Find bio page toggle - it's the second switch in the sharing options section
      // First switch is for QR code, second is for bio page
      const bioToggle = page.locator('button[role="switch"]').nth(1);

      // Should be disabled by default
      await expect(bioToggle).toHaveAttribute("data-state", "unchecked");

      // Toggle on
      await bioToggle.click();
      await expect(bioToggle).toHaveAttribute("data-state", "checked");

      // Should show bio page selector dropdown
      await expect(page.locator("text=Select a bio page")).toBeVisible();
    });

    test("CL-021: should select bio page from dropdown", async ({ page }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Toggle bio page on - second switch in the sharing options
      const bioToggle = page.locator('button[role="switch"]').nth(1);
      await bioToggle.click();

      // Click dropdown to open it
      await page
        .locator('[role="combobox"]:has-text("Select a bio page")')
        .click();

      // Select bio page from dropdown options
      await page.getByRole("option", { name: /My Profile/ }).click();
    });
  });

  test.describe("Advanced Settings", () => {
    test("CL-030: should expand advanced settings section", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Click to expand
      await page.locator("text=Advanced settings").click();

      // Should show UTM parameters
      await expect(page.locator("text=UTM Parameters")).toBeVisible();
    });

    test("CL-031: should add description", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.description).toBe("This is my link description");
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#description", "This is my link description");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-032: should add UTM parameters", async ({ page }) => {
      await setupAuthenticatedState(page);

      let capturedUrl = "";
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          capturedUrl = postData.originalUrl;
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      // Fill UTM parameters
      await page.fill("input#utmSource", "google");
      await page.fill("input#utmMedium", "cpc");
      await page.fill("input#utmCampaign", "summer_sale");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Verify UTM parameters were appended to URL
      expect(capturedUrl).toContain("utm_source=google");
      expect(capturedUrl).toContain("utm_medium=cpc");
      expect(capturedUrl).toContain("utm_campaign=summer_sale");
    });

    test("CL-033: should set expiration date", async ({ page }) => {
      await setupAuthenticatedState(page);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expDate = tomorrow.toISOString().slice(0, 16);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.expirationDate).toBeTruthy();
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#expirationDate", expDate);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-034: should set password protection", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.password).toBe("secretpass123");
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#password", "secretpass123");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-035: should change redirect type", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.redirectType).toBe(302);
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      // Click redirect type dropdown (contains "301 - Permanent" by default)
      await page.locator('[role="combobox"]:has-text("301")').click();
      await page.getByRole("option", { name: "302 - Temporary" }).click();

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-036: should set deep link fallback", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON();
          expect(postData.deepLinkFallback).toBe(
            "https://app.example.com/fallback",
          );
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(postData)),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill(
        "input#deepLinkFallback",
        "https://app.example.com/fallback",
      );

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Success State", () => {
    test("CL-040: should display success state after link creation", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      const mockLink = createLinkResponse(
        { originalUrl: validUrl },
        "test-slug",
      );

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      await page.click('button:has-text("Create your link")');

      // Should show success elements
      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator("text=Your short link is ready to use"),
      ).toBeVisible();
    });

    test("CL-041: should display short URL in success state", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      const mockLink = createLinkResponse(
        { originalUrl: validUrl },
        "my-test-link",
      );

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
      await expect(
        page.locator("text=localhost:3000/my-test-link"),
      ).toBeVisible();
    });

    test("CL-042: should copy short URL to clipboard", async ({
      page,
      context,
    }) => {
      await setupAuthenticatedState(page);

      // Grant clipboard permission
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      const mockLink = createLinkResponse(
        { originalUrl: validUrl },
        "copy-test",
      );

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Click copy button
      await page.locator("button:has(svg.lucide-copy)").click();

      // Should show check icon (copied state) - use h-4 w-4 to target the small check in the copy button
      await expect(page.locator("svg.lucide-check.h-4")).toBeVisible();
    });

    test("CL-043: should display QR code in success state", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      const mockLink = createLinkResponse({ originalUrl: validUrl }, "qr-test");

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Should show QR code image
      await expect(page.locator('img[alt="QR Code"]')).toBeVisible();

      // Should show download button
      await expect(page.locator('button:has-text("Download")')).toBeVisible();
    });

    test("CL-044: should have Customize QR button in success state", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      const mockLink = createLinkResponse(
        { originalUrl: validUrl },
        "customize-test",
      );

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Should have customize QR button
      await expect(
        page.locator('button:has-text("Customize QR")'),
      ).toBeVisible();
    });

    test("CL-045: should create another link from success state", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      let createCount = 0;
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          createCount++;
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(
              createLinkResponse(route.request().postDataJSON()),
            ),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Click "Create Another"
      await page.click('button:has-text("Create Another")');

      // Should return to form
      await expect(
        page.locator('h1:has-text("Create a new link")'),
      ).toBeVisible();

      // Create second link
      await page.fill("input#originalUrl", "https://example2.com");
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
      expect(createCount).toBe(2);
    });

    test("CL-046: should navigate to analytics from success state", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      const mockLink = createLinkResponse(
        { originalUrl: validUrl },
        "analytics-test",
      );

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(mockLink),
          });
        }
      });

      // Mock analytics page
      await page.route("**/analytics/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ clicks: 0, data: [] }),
        });
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Click View Analytics
      await page.click('button:has-text("View Analytics")');

      // Should navigate to analytics page
      await expect(page).toHaveURL(/\/dashboard\/analytics\//);
    });
  });

  test.describe("Form Validation & Edge Cases", () => {
    test("CL-050: should show loading state during submission", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);

      // Slow down the response
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(
              createLinkResponse(route.request().postDataJSON()),
            ),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      await page.click('button:has-text("Create your link")');

      // Should show loading text
      await expect(
        page.locator('button:has-text("Creating...")'),
      ).toBeVisible();
    });

    test("CL-051: should handle network error", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.abort("failed");
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", validUrl);

      await page.click('button:has-text("Create your link")');

      // Should show error
      await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
    });

    test("CL-052: should handle blocked domain error", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({ message: "This domain is blocked" }),
          });
        }
      });

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", "https://blocked-domain.com");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=This domain is blocked")).toBeVisible({
        timeout: 5000,
      });
    });

    test("CL-053: should cancel and return to links page", async ({ page }) => {
      await setupAuthenticatedState(page);

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

      await page.goto("/dashboard/links/new");

      await page.click('button:has-text("Cancel")');

      await expect(page).toHaveURL(/\/dashboard\/links$/);
    });

    test("CL-054: should preserve form state when toggling sections", async ({
      page,
    }) => {
      await setupAuthenticatedState(page);
      await page.goto("/dashboard/links/new");

      // Fill some data
      await page.fill("input#originalUrl", validUrl);
      await page.fill("input#title", "My Link Title");

      // Collapse and expand Link details
      await page.locator("text=Link details").click();
      await page.locator("text=Link details").click();

      // Data should be preserved
      await expect(page.locator("input#originalUrl")).toHaveValue(validUrl);
      await expect(page.locator("input#title")).toHaveValue("My Link Title");
    });
  });

  test.describe("Complete Flow", () => {
    test("CL-060: should create link with all options", async ({ page }) => {
      await setupAuthenticatedState(page);

      await page.route("**/qr/advanced", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            dataUrl:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          }),
        });
      });

      let finalPayload: any = null;
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          finalPayload = route.request().postDataJSON();
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify(createLinkResponse(finalPayload)),
          });
        }
      });

      await page.goto("/dashboard/links/new");

      // Link Details (section is open by default)
      await page.fill("input#originalUrl", validUrl);
      await page.fill(
        'input[placeholder="custom-slug (optional)"]',
        `full-test-${randomId}`,
      );
      await page.fill("input#title", "Complete Test Link");
      await page.fill("input#tags", "test, e2e, complete");

      // Sharing Options - QR (section is open by default)
      // Select Indigo color for QR code
      await page.locator('button[title="Indigo"]').click();

      // Advanced Settings - need to expand this section
      await page.locator("text=Advanced settings").click();
      await page.fill("input#description", "Complete test description");
      await page.fill("input#utmSource", "test");
      await page.fill("input#utmMedium", "e2e");
      await page.fill("input#utmCampaign", "full_test");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      await page.fill(
        "input#expirationDate",
        tomorrow.toISOString().slice(0, 16),
      );

      await page.fill("input#password", "testpass123");

      // Submit
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Verify payload
      expect(finalPayload.originalUrl).toContain("utm_source=test");
      expect(finalPayload.slug).toBe(`full-test-${randomId}`);
      expect(finalPayload.title).toBe("Complete Test Link");
      expect(finalPayload.tags).toContain("test");
      expect(finalPayload.tags).toContain("e2e");
      expect(finalPayload.description).toBe("Complete test description");
      expect(finalPayload.password).toBe("testpass123");
      expect(finalPayload.qrColor).toBe("#4F46E5");
      expect(finalPayload.generateQrCode).toBe(true);
    });
  });
});
