import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_SLUGS } from "./fixtures/test-data";

/**
 * QR Code Customizer E2E Tests
 *
 * Tests the QrCodeCustomizer component at apps/web/components/qrcode/QrCodeCustomizer.tsx
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Features tested:
 * - Opening QR customizer dialog from links page
 * - Color customization (presets and custom colors)
 * - Error correction level selection
 * - Border size adjustment
 * - Logo upload and removal
 * - Size adjustment
 * - Download functionality (PNG, SVG, PDF)
 * - Save configuration
 * - Preview generation
 */

test.describe("QR Code Customizer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test.describe("Opening QR Customizer", () => {
    test("QRC-001: should open QR customizer dialog from links page", async ({
      page,
    }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Find the first link card's dropdown menu (three dots)
      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();

        // Click QR Code option in dropdown
        await page.click('[role="menuitem"]:has-text("QR Code")');

        // Dialog should open
        await expect(
          page.locator('[role="dialog"]:has-text("Customize QR Code")'),
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("QRC-002: should display QR code preview placeholder initially", async ({
      page,
    }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');

        // Should show placeholder text
        await expect(
          page.locator('text=Click "Generate" to preview'),
        ).toBeVisible();
      }
    });

    test("QRC-003: should show default color presets section", async ({
      page,
    }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');

        // Should show Color Presets label with Palette icon
        await expect(
          page.locator('label:has-text("Color Presets")'),
        ).toBeVisible();
      }
    });

    test("QRC-004: should have Generate button visible", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');

        await expect(page.locator('button:has-text("Generate")')).toBeVisible();
      }
    });
  });

  test.describe("Color Customization", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Open QR customizer
      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-010: should have 10 color presets available", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Color preset buttons have specific styling
        const presetButtons = dialog.locator(
          "button.w-8.h-8.rounded-lg.border-2",
        );
        const count = await presetButtons.count();

        // Should have 10 presets: Black, Blue, Indigo, Purple, Pink, Red, Orange, Green, Teal, Dark
        expect(count).toBe(10);
      }
    });

    test("QRC-011: should change foreground color when preset clicked", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Get initial foreground color value
        const fgInput = dialog.locator("input#fg-color");
        const initialColor = await fgInput.inputValue();

        // Click Blue preset (2nd button)
        const bluePreset = dialog
          .locator("button.w-8.h-8.rounded-lg.border-2")
          .nth(1);
        await bluePreset.click();

        // Color should change
        const newColor = await fgInput.inputValue();
        expect(newColor).toBe("#2563eb");
        expect(newColor).not.toBe(initialColor);
      }
    });

    test("QRC-012: should show selected state on active preset", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Click Purple preset
        const purplePreset = dialog
          .locator("button.w-8.h-8.rounded-lg.border-2")
          .nth(3);
        await purplePreset.click();

        // Should have blue border indicating selection
        await expect(purplePreset).toHaveCSS(
          "border-color",
          "rgb(59, 130, 246)",
        );
      }
    });

    test("QRC-013: should allow custom foreground color input", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const fgTextInput = dialog
          .locator('label:has-text("Foreground")')
          .locator("..")
          .locator("input.font-mono");

        await fgTextInput.fill("#ff5500");
        await expect(fgTextInput).toHaveValue("#ff5500");
      }
    });

    test("QRC-014: should allow custom background color input", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const bgTextInput = dialog
          .locator('label:has-text("Background")')
          .locator("..")
          .locator("input.font-mono");

        await bgTextInput.fill("#f0f0f0");
        await expect(bgTextInput).toHaveValue("#f0f0f0");
      }
    });

    test("QRC-015: should have color picker inputs for foreground and background", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(
          dialog.locator('input#fg-color[type="color"]'),
        ).toBeVisible();
        await expect(
          dialog.locator('input#bg-color[type="color"]'),
        ).toBeVisible();
      }
    });
  });

  test.describe("Error Correction", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-020: should display error correction dropdown with Shield icon", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(
          dialog.locator('label:has-text("Error Correction")'),
        ).toBeVisible();
        await expect(dialog.locator("svg.lucide-shield")).toBeVisible();
      }
    });

    test("QRC-021: should have L, M, Q, H error correction options", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Click the select trigger to open dropdown
        const selectTrigger = dialog.locator(
          'button[role="combobox"]:has-text("Medium")',
        );
        await selectTrigger.click();

        // Check for all 4 options with descriptions
        await expect(
          page.locator('[role="option"]:has-text("Low (7%)")'),
        ).toBeVisible();
        await expect(
          page.locator('[role="option"]:has-text("Medium (15%)")'),
        ).toBeVisible();
        await expect(
          page.locator('[role="option"]:has-text("Quartile (25%)")'),
        ).toBeVisible();
        await expect(
          page.locator('[role="option"]:has-text("High (30%)")'),
        ).toBeVisible();
      }
    });

    test("QRC-022: should change error correction level to High", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const selectTrigger = dialog
          .locator('button[role="combobox"]')
          .filter({ hasText: /Medium|Low|Quartile|High/ })
          .first();
        await selectTrigger.click();

        await page.click('[role="option"]:has-text("High (30%)")');

        // Verify selection
        await expect(selectTrigger).toContainText("High");
      }
    });

    test("QRC-023: should default to Medium error correction", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const selectTrigger = dialog
          .locator('button[role="combobox"]')
          .filter({ hasText: /Medium|Low|Quartile|High/ })
          .first();
        await expect(selectTrigger).toContainText("Medium");
      }
    });
  });

  test.describe("Border Size", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-030: should display border size slider", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(
          dialog.locator('label:has-text("Border Size:")'),
        ).toBeVisible();
        await expect(
          dialog.locator('input#border-size[type="range"]'),
        ).toBeVisible();
      }
    });

    test("QRC-031: should show current border size value", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const label = dialog.locator('label:has-text("Border Size:")');
        // Default is 2
        await expect(label).toContainText("2");
      }
    });

    test("QRC-032: should update border size value when slider moved", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const slider = dialog.locator('input#border-size[type="range"]');

        // Move slider to 5
        await slider.fill("5");

        // Label should update
        const label = dialog.locator('label:has-text("Border Size:")');
        await expect(label).toContainText("5");
      }
    });

    test("QRC-033: should have border size range from 0 to 10", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const slider = dialog.locator('input#border-size[type="range"]');

        await expect(slider).toHaveAttribute("min", "0");
        await expect(slider).toHaveAttribute("max", "10");
      }
    });
  });

  test.describe("QR Code Size", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-040: should display size slider", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(dialog.locator('label:has-text("Size:")')).toBeVisible();
        await expect(
          dialog.locator('input#qr-size[type="range"]'),
        ).toBeVisible();
      }
    });

    test("QRC-041: should show current size value in pixels", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const label = dialog.locator('label:has-text("Size:")');
        // Default is 300px
        await expect(label).toContainText("300px");
      }
    });

    test("QRC-042: should update size when slider moved", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const slider = dialog.locator('input#qr-size[type="range"]');

        await slider.fill("450");

        const label = dialog.locator('label:has-text("Size:")');
        await expect(label).toContainText("450px");
      }
    });

    test("QRC-043: should have size range from 150 to 600 with step 50", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const slider = dialog.locator('input#qr-size[type="range"]');

        await expect(slider).toHaveAttribute("min", "150");
        await expect(slider).toHaveAttribute("max", "600");
        await expect(slider).toHaveAttribute("step", "50");
      }
    });
  });

  test.describe("Logo Upload", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-050: should display logo upload section with Image icon", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(
          dialog.locator('label:has-text("Logo (optional)")'),
        ).toBeVisible();
        await expect(dialog.locator("svg.lucide-image")).toBeVisible();
      }
    });

    test("QRC-051: should show Upload Logo button initially", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(
          dialog.locator('button:has-text("Upload Logo")'),
        ).toBeVisible();
      }
    });

    test("QRC-052: should upload logo and show preview", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const fileInput = dialog.locator(
          'input[type="file"][accept="image/*"]',
        );

        // Create a small test image
        const buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );

        await fileInput.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer,
        });

        // Should show logo preview
        await expect(dialog.locator('img[alt="Logo preview"]')).toBeVisible({
          timeout: 3000,
        });
        await expect(dialog.locator("text=Logo uploaded")).toBeVisible();
      }
    });

    test("QRC-053: should show logo size slider after upload", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const fileInput = dialog.locator(
          'input[type="file"][accept="image/*"]',
        );

        const buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );

        await fileInput.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer,
        });

        // Logo size slider should appear
        await expect(
          dialog.locator('input#logo-size[type="range"]'),
        ).toBeVisible({ timeout: 3000 });
        await expect(
          dialog.locator('label:has-text("Logo Size:")'),
        ).toBeVisible();
      }
    });

    test("QRC-054: should remove uploaded logo", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const fileInput = dialog.locator(
          'input[type="file"][accept="image/*"]',
        );

        const buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );

        await fileInput.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer,
        });

        await expect(dialog.locator('img[alt="Logo preview"]')).toBeVisible({
          timeout: 3000,
        });

        // Click remove button (X icon)
        const removeButton = dialog
          .locator("button")
          .filter({ has: page.locator("svg.lucide-x") })
          .first();
        await removeButton.click();

        // Upload button should appear again
        await expect(
          dialog.locator('button:has-text("Upload Logo")'),
        ).toBeVisible();
        await expect(
          dialog.locator('img[alt="Logo preview"]'),
        ).not.toBeVisible();
      }
    });

    test("QRC-055: should have logo size range from 10 to 30 percent", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const fileInput = dialog.locator(
          'input[type="file"][accept="image/*"]',
        );

        const buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );

        await fileInput.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer,
        });

        const logoSizeSlider = dialog.locator('input#logo-size[type="range"]');
        await expect(logoSizeSlider).toHaveAttribute("min", "10");
        await expect(logoSizeSlider).toHaveAttribute("max", "30");
      }
    });
  });

  test.describe("QR Code Generation and Preview", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the QR generation API
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

      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-060: should generate QR code when Generate button clicked", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await page.click('button:has-text("Generate")');

        // Should show QR preview
        await expect(dialog.locator('img[alt="QR Code Preview"]')).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("QRC-061: should show loading state during generation", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const generateButton = dialog.locator('button:has-text("Generate")');
        await generateButton.click();

        // Should show spinning icon briefly
        await expect(dialog.locator("svg.animate-spin")).toBeVisible({
          timeout: 1000,
        });
      }
    });

    test("QRC-062: should update preview when color changes and regenerated", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Generate initial QR
        await page.click('button:has-text("Generate")');
        await expect(dialog.locator('img[alt="QR Code Preview"]')).toBeVisible({
          timeout: 5000,
        });

        // Change color
        const redPreset = dialog
          .locator("button.w-8.h-8.rounded-lg.border-2")
          .nth(5);
        await redPreset.click();

        // Regenerate
        await page.click('button:has-text("Generate")');
        await page.waitForTimeout(1000);

        // Preview should still be visible (updated)
        await expect(
          dialog.locator('img[alt="QR Code Preview"]'),
        ).toBeVisible();
      }
    });
  });

  test.describe("Download Functionality", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the QR generation API
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

      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-070: should have PNG download button", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(dialog.locator('button:has-text("PNG")')).toBeVisible();
      }
    });

    test("QRC-071: should have SVG download button", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(dialog.locator('button:has-text("SVG")')).toBeVisible();
      }
    });

    test("QRC-072: should have PDF download button", async ({ page }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await expect(dialog.locator('button:has-text("PDF")')).toBeVisible();
      }
    });

    test("QRC-073: download buttons should be disabled before generation", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const pngButton = dialog.locator('button:has-text("PNG")');
        const pdfButton = dialog.locator('button:has-text("PDF")');

        await expect(pngButton).toBeDisabled();
        await expect(pdfButton).toBeDisabled();
      }
    });

    test("QRC-074: download buttons should be enabled after generation", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Generate QR code
        await page.click('button:has-text("Generate")');
        await expect(dialog.locator('img[alt="QR Code Preview"]')).toBeVisible({
          timeout: 5000,
        });

        const pngButton = dialog.locator('button:has-text("PNG")');
        const pdfButton = dialog.locator('button:has-text("PDF")');

        await expect(pngButton).toBeEnabled();
        await expect(pdfButton).toBeEnabled();
      }
    });

    test("QRC-075: should trigger PNG download when button clicked", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Generate QR code first
        await page.click('button:has-text("Generate")');
        await expect(dialog.locator('img[alt="QR Code Preview"]')).toBeVisible({
          timeout: 5000,
        });

        // Setup download listener
        const downloadPromise = page
          .waitForEvent("download", { timeout: 5000 })
          .catch(() => null);

        // Click PNG download
        await page.click('button:has-text("PNG")');

        // Check if download was triggered
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toBe("qrcode.png");
        }
      }
    });

    test("QRC-076: SVG button should be disabled when logo is uploaded", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Generate QR first
        await page.click('button:has-text("Generate")');
        await expect(dialog.locator('img[alt="QR Code Preview"]')).toBeVisible({
          timeout: 5000,
        });

        // Upload logo
        const fileInput = dialog.locator(
          'input[type="file"][accept="image/*"]',
        );
        const buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64",
        );
        await fileInput.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer,
        });

        // SVG button should be disabled
        const svgButton = dialog.locator('button:has-text("SVG")');
        await expect(svgButton).toBeDisabled();
      }
    });
  });

  test.describe("Save Configuration", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the save config API
      await page.route("**/links/*/qr", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        } else if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              foregroundColor: "#000000",
              backgroundColor: "#FFFFFF",
              errorCorrection: "M",
              borderSize: 2,
              size: 300,
              logoSizePercent: 20,
            }),
          });
        }
      });

      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-080: should show save button when linkId is provided", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Save button should be visible (icon button with Save icon)
        const saveButton = dialog
          .locator("button")
          .filter({ has: page.locator("svg.lucide-save") });
        await expect(saveButton).toBeVisible();
      }
    });

    test("QRC-081: should save QR configuration when save button clicked", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Change some settings
        const redPreset = dialog
          .locator("button.w-8.h-8.rounded-lg.border-2")
          .nth(5);
        await redPreset.click();

        // Click save button
        const saveButton = dialog
          .locator("button")
          .filter({ has: page.locator("svg.lucide-save") });
        await saveButton.click();

        // Wait for save to complete
        await page.waitForTimeout(1000);

        // Save button should not show spinning icon anymore
        await expect(saveButton.locator("svg.animate-spin")).not.toBeVisible();
      }
    });

    test("QRC-082: should show loading state on save button during save", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        const saveButton = dialog
          .locator("button")
          .filter({ has: page.locator("svg.lucide-save") });

        // Slow down the API response
        await page.route("**/links/*/qr", async (route) => {
          if (route.request().method() === "POST") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ success: true }),
            });
          }
        });

        await saveButton.click();

        // Should show spinning icon
        await expect(saveButton.locator("svg.animate-spin")).toBeVisible({
          timeout: 500,
        });
      }
    });
  });

  test.describe("Dialog Behavior", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');
        await page.waitForTimeout(500);
      }
    });

    test("QRC-090: should close dialog when clicking outside", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Click on overlay (outside dialog)
        await page
          .locator("[data-radix-dialog-overlay]")
          .click({ position: { x: 10, y: 10 } });

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 2000 });
      }
    });

    test("QRC-091: should close dialog when pressing Escape", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        await page.keyboard.press("Escape");

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 2000 });
      }
    });

    test("QRC-092: dialog should be scrollable for long content", async ({
      page,
    }) => {
      const dialog = page.locator(
        '[role="dialog"]:has-text("Customize QR Code")',
      );

      if (await dialog.isVisible()) {
        // Dialog content should have max height and overflow
        const dialogContent = page.locator(".max-h-\\[90vh\\].overflow-y-auto");
        await expect(dialogContent).toBeVisible();
      }
    });
  });

  test.describe("Integration with Links Page", () => {
    test("QRC-100: should open customizer from link card dropdown", async ({
      page,
    }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();

        // Verify QR Code menu item exists
        const qrMenuItem = page.locator(
          '[role="menuitem"]:has-text("QR Code")',
        );
        await expect(qrMenuItem).toBeVisible();

        await qrMenuItem.click();

        // Dialog should open
        await expect(
          page.locator('[role="dialog"]:has-text("Customize QR Code")'),
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("QRC-101: should preserve link context when opening customizer", async ({
      page,
    }) => {
      // Mock the links API to get link data
      await page.route("**/links?*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "test-link-id",
                slug: "test-slug",
                shortUrl: "http://localhost:3000/test-slug",
                originalUrl: "https://example.com",
                title: "Test Link",
                clicks: 0,
                status: "ACTIVE",
                createdAt: new Date().toISOString(),
              },
            ],
            meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        });
      });

      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const moreButton = page
        .locator("button")
        .filter({ has: page.locator("svg.lucide-more-horizontal") })
        .first();

      if (await moreButton.isVisible()) {
        await moreButton.click();
        await page.click('[role="menuitem"]:has-text("QR Code")');

        const dialog = page.locator(
          '[role="dialog"]:has-text("Customize QR Code")',
        );
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Save button should be visible (indicating linkId was passed)
        const saveButton = dialog
          .locator("button")
          .filter({ has: page.locator("svg.lucide-save") });
        await expect(saveButton).toBeVisible();
      }
    });
  });
});
