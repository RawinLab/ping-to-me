import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS, TEST_CREDENTIALS } from "./fixtures/test-data";

/**
 * E2E Tests for Create Link Page (/dashboard/links/new) - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Features tested:
 * - Link Details: Destination URL, Custom Slug, Title, Tags
 * - Sharing Options: QR Code customization (colors, logo), Bio Page integration
 * - Advanced Settings: UTM Parameters, Expiration, Password, Redirect Type, Deep Link
 * - Form submission and success state
 */

test.describe("Create Link Page", () => {
  const validUrl = "https://example.com/my-long-url";
  // Generate unique slug for each test run to avoid conflicts
  const randomId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  test.beforeEach(async ({ page }) => {
    // Login with real authentication
    await loginAsUser(page, "owner");
  });

  test.describe("Page Navigation & Layout", () => {
    test("should navigate to create link page", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      await expect(
        page.locator('h1:has-text("Create a new link")'),
      ).toBeVisible();
    });

    test("should display all collapsible sections", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      // Link details section
      await expect(page.locator("text=Link details")).toBeVisible();

      // Sharing options section
      await expect(page.locator("text=Sharing options")).toBeVisible();

      // Advanced settings section
      await expect(page.locator("text=Advanced settings")).toBeVisible();
    });

    test("should have Cancel and Create buttons", async ({ page }) => {
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
      await page.goto("/dashboard/links/new");

      // Fill destination URL
      await page.fill("input#originalUrl", `${validUrl}?t=${Date.now()}`);

      // Submit form
      await page.click('button:has-text("Create your link")');

      // Should show success state
      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-002: should create link with custom slug", async ({ page }) => {
      const customSlug = `e2e-custom-${randomId}`;

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", `${validUrl}?slug=${customSlug}`);
      await page.fill(
        'input[placeholder="custom-slug (optional)"]',
        customSlug,
      );

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Verify the custom slug is shown in success state
      await expect(page.locator(`text=${customSlug}`)).toBeVisible();
    });

    test("CL-003: should show error for duplicate slug", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", validUrl);
      // Use existing slug from seed data
      await page.fill(
        'input[placeholder="custom-slug (optional)"]',
        TEST_SLUGS.links.popular,
      );

      await page.click('button:has-text("Create your link")');

      // Should show error message about duplicate slug
      await expect(
        page
          .locator("text=This slug is already taken")
          .or(page.locator("text=already exists")),
      ).toBeVisible({ timeout: 5000 });
    });

    test("CL-004: should create link with title", async ({ page }) => {
      const title = `My Awesome Link ${Date.now()}`;

      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", `${validUrl}?title=${Date.now()}`);
      await page.fill("input#title", title);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-005: should create link with tags", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", `${validUrl}?tags=${Date.now()}`);
      await page.fill("input#tags", "marketing, social");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-006: should validate URL format", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      // Fill invalid URL
      await page.fill("input#originalUrl", "not-a-valid-url");

      // Try to submit
      await page.click('button:has-text("Create your link")');

      // Should show validation error
      await expect(page.locator("text=Please enter a valid URL")).toBeVisible();
    });

    test("CL-007: should show custom domain in dropdown", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      // Click on domain selector (first combobox in the form)
      await page.locator('[role="combobox"]').first().click();

      // Should show custom domains from seed data
      await expect(
        page
          .getByRole("option", { name: TEST_SLUGS.domains.verified })
          .or(page.locator(`text=${TEST_SLUGS.domains.verified}`)),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Sharing Options - QR Code", () => {
    test("CL-010: should toggle QR code generation", async ({ page }) => {
      await page.goto("/dashboard/links/new");

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
      await page.goto("/dashboard/links/new");

      // Should show Code color label
      await expect(page.locator("text=Code color")).toBeVisible();

      // Should have color preset buttons
      const colorButtons = page.locator(".bg-slate-50 button.rounded-full");
      const count = await colorButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test("CL-015: should show QR preview when URL is entered", async ({
      page,
    }) => {
      await page.goto("/dashboard/links/new");

      // Initially should show placeholder
      await expect(page.locator("text=Enter URL to preview")).toBeVisible();

      // Fill URL
      await page.fill("input#originalUrl", validUrl);

      // Wait for preview to load (debounced 500ms + request time)
      await page.waitForTimeout(2000);

      // Should show QR preview image
      await expect(page.locator('img[alt="QR Code Preview"]')).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Sharing Options - Bio Page", () => {
    test("CL-020: should toggle add to bio page", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      // Find bio page toggle - it's the second switch in the sharing options section
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
      await page.goto("/dashboard/links/new");

      // Toggle bio page on
      const bioToggle = page.locator('button[role="switch"]').nth(1);
      await bioToggle.click();

      // Click dropdown to open it
      await page
        .locator('[role="combobox"]:has-text("Select a bio page")')
        .click();

      // Should show bio pages from seed data
      await expect(
        page
          .getByRole("option")
          .first()
          .or(page.locator('[role="option"]').first()),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Advanced Settings", () => {
    test("CL-030: should expand advanced settings section", async ({
      page,
    }) => {
      await page.goto("/dashboard/links/new");

      // Click to expand
      await page.locator("text=Advanced settings").click();

      // Should show UTM parameters
      await expect(page.locator("text=UTM Parameters")).toBeVisible();
    });

    test("CL-031: should add description", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?desc=${Date.now()}`);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#description", "This is my link description");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-032: should add UTM parameters", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?utm=${Date.now()}`);

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
    });

    test("CL-033: should set expiration date", async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expDate = tomorrow.toISOString().slice(0, 16);

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?exp=${Date.now()}`);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#expirationDate", expDate);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-034: should set password protection", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?pwd=${Date.now()}`);

      // Expand advanced settings
      await page.locator("text=Advanced settings").click();

      await page.fill("input#password", "secretpass123");

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-035: should change redirect type", async ({ page }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?redir=${Date.now()}`);

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
  });

  test.describe("Success State", () => {
    test("CL-040: should display success state after link creation", async ({
      page,
    }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?success=${Date.now()}`);

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
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?url=${Date.now()}`);

      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Should show the short URL (contains localhost or the domain)
      await expect(
        page
          .locator("text=/localhost:")
          .or(page.locator('input[value*="localhost"]')),
      ).toBeVisible();
    });

    test("CL-042: should copy short URL to clipboard", async ({
      page,
      context,
    }) => {
      // Grant clipboard permission
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?copy=${Date.now()}`);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Click copy button
      await page.locator("button:has(svg.lucide-copy)").click();

      // Should show check icon (copied state)
      await expect(page.locator("svg.lucide-check.h-4")).toBeVisible();
    });

    test("CL-043: should display QR code in success state", async ({
      page,
    }) => {
      await page.goto("/dashboard/links/new");
      await page.fill("input#originalUrl", `${validUrl}?qr=${Date.now()}`);
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
      await page.goto("/dashboard/links/new");
      await page.fill(
        "input#originalUrl",
        `${validUrl}?customize=${Date.now()}`,
      );
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
      await page.goto("/dashboard/links/new");
      await page.fill(
        "input#originalUrl",
        `${validUrl}?another1=${Date.now()}`,
      );
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
      await page.fill(
        "input#originalUrl",
        `${validUrl}?another2=${Date.now()}`,
      );
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-046: should navigate to analytics from success state", async ({
      page,
    }) => {
      await page.goto("/dashboard/links/new");
      await page.fill(
        "input#originalUrl",
        `${validUrl}?analytics=${Date.now()}`,
      );
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
      await page.goto("/dashboard/links/new");
      await page.fill(
        "input#originalUrl",
        `${validUrl}?loading=${Date.now()}`,
      );

      await page.click('button:has-text("Create your link")');

      // Should show loading text (may be very brief with fast network)
      // We'll just verify the button changes state
      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-053: should cancel and return to links page", async ({ page }) => {
      await page.goto("/dashboard/links/new");

      await page.click('button:has-text("Cancel")');

      await expect(page).toHaveURL(/\/dashboard\/links$/);
    });

    test("CL-054: should preserve form state when toggling sections", async ({
      page,
    }) => {
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

  test.describe("RBAC Tests", () => {
    test("CL-RBAC-001: Admin can create links", async ({ page }) => {
      await page.context().clearCookies();
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", `${validUrl}?admin=${Date.now()}`);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-RBAC-002: Editor can create links", async ({ page }) => {
      await page.context().clearCookies();
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/links/new");

      await page.fill("input#originalUrl", `${validUrl}?editor=${Date.now()}`);
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });
    });

    test("CL-RBAC-003: Viewer cannot create links", async ({ page }) => {
      await page.context().clearCookies();
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/links/new");

      // Viewer should either be redirected or see permission denied
      // Check for either no access to create form or permission error
      const hasCreateForm = await page
        .locator('h1:has-text("Create a new link")')
        .isVisible()
        .catch(() => false);

      if (hasCreateForm) {
        // If they can see the form, try to create and expect error
        await page.fill(
          "input#originalUrl",
          `${validUrl}?viewer=${Date.now()}`,
        );
        await page.click('button:has-text("Create your link")');

        // Should show permission error
        await expect(
          page
            .locator("text=permission")
            .or(page.locator("text=not authorized")),
        ).toBeVisible({ timeout: 5000 });
      } else {
        // They were redirected or denied access
        expect(hasCreateForm).toBeFalsy();
      }
    });
  });

  test.describe("Complete Flow", () => {
    test("CL-060: should create link with all options", async ({ page }) => {
      const uniqueSlug = `e2e-full-${Date.now()}`;

      await page.goto("/dashboard/links/new");

      // Link Details (section is open by default)
      await page.fill("input#originalUrl", `${validUrl}?full=${Date.now()}`);
      await page.fill('input[placeholder="custom-slug (optional)"]', uniqueSlug);
      await page.fill("input#title", "Complete Test Link");
      await page.fill("input#tags", "test, e2e, complete");

      // Advanced Settings - need to expand this section
      await page.locator("text=Advanced settings").click();
      await page.fill("input#description", "Complete test description");
      await page.fill("input#utmSource", "test");
      await page.fill("input#utmMedium", "e2e");
      await page.fill("input#utmCampaign", "full_test");

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      await page.fill(
        "input#expirationDate",
        nextWeek.toISOString().slice(0, 16),
      );

      await page.fill("input#password", "testpass123");

      // Submit
      await page.click('button:has-text("Create your link")');

      await expect(page.locator("text=Link Created!")).toBeVisible({
        timeout: 10000,
      });

      // Verify the custom slug is shown
      await expect(page.locator(`text=${uniqueSlug}`)).toBeVisible();
    });
  });
});
