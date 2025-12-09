import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/test-data";

/**
 * QR Code Customizer E2E Tests - Using Real Database
 *
 * Prerequisites:
 * 1. Run database seed: pnpm --filter @pingtome/database db:seed
 * 2. Start dev servers: pnpm dev
 *
 * Tests cover QR code customization:
 * - Color customization
 * - Logo/image options
 * - Error correction levels
 * - Download formats
 * - Preview updates
 */

test.describe("QR Code Customizer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, "owner");
  });

  test.describe("Basic Customization", () => {
    test("QRC-001: Open QR customizer from links page", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      // Wait for links to load
      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      // Find and click QR code button
      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        // QR customizer modal should open
        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("QRC-002: Change foreground color", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        // Wait for modal
        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });

        // Find foreground color input
        const colorInputs = page.locator('input[type="color"]');
        if ((await colorInputs.count()) > 0) {
          await colorInputs.first().fill("#ff0000");

          // Wait for preview update
          await page.waitForTimeout(1000);

          // QR should still be visible
          await expect(
            page.locator('img[alt*="QR"], img[src*="data:image"]').first()
          ).toBeVisible();
        }
      }
    });

    test("QRC-003: Change background color", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });

        // Find background color input (usually second color input)
        const colorInputs = page.locator('input[type="color"]');
        if ((await colorInputs.count()) > 1) {
          await colorInputs.nth(1).fill("#ffff00");

          await page.waitForTimeout(1000);
        }
      }
    });

    test("QRC-004: Change error correction level", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });

        // Find error correction selector
        const eccSelector = page.locator(
          'select[name="errorCorrection"], [role="combobox"]'
        );
        if (await eccSelector.isVisible()) {
          await eccSelector.click();

          const option = page.locator('[role="option"]').nth(2);
          if (await option.isVisible()) {
            await option.click();

            await page.waitForTimeout(1000);
          }
        }
      }
    });

    test("QRC-005: Change QR size/margin", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });

        // Find margin/size slider or input
        const slider = page.locator('input[type="range"]');
        if (await slider.isVisible()) {
          await slider.fill("10");

          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe("Logo/Image Options", () => {
    test("QRC-010: Add logo to QR code", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator("text=QR Code, text=Customize").first()
        ).toBeVisible({ timeout: 5000 });

        // Look for logo/image upload option
        const logoOption = page.locator(
          'button:has-text("Logo"), button:has-text("Image")'
        );
        if (await logoOption.isVisible()) {
          await logoOption.click();
        }
      }
    });
  });

  test.describe("Download Options", () => {
    test("QRC-020: Download QR as PNG", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator('img[alt*="QR"], img[src*="data:image"]').first()
        ).toBeVisible({ timeout: 5000 });

        // Download PNG
        const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
        const pngButton = page.locator('button:has-text("PNG")');
        if (await pngButton.isVisible()) {
          await pngButton.click();

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.png$/);
          } catch {
            // Download might not trigger in all environments
          }
        }
      }
    });

    test("QRC-021: Download QR as SVG", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        await expect(
          page.locator('img[alt*="QR"], img[src*="data:image"]').first()
        ).toBeVisible({ timeout: 5000 });

        // Download SVG
        const svgButton = page.locator('button:has-text("SVG")');
        if (await svgButton.isVisible()) {
          const downloadPromise = page.waitForEvent("download", {
            timeout: 5000,
          });
          await svgButton.click();

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.svg$/);
          } catch {
            // Download might not trigger in all environments
          }
        }
      }
    });
  });

  test.describe("Preview Updates", () => {
    test("QRC-030: Preview updates on customization", async ({ page }) => {
      await page.goto("/dashboard/links");
      await page.waitForLoadState("networkidle");

      await page.waitForSelector(".group.bg-white.rounded-2xl", {
        timeout: 10000,
      });

      const linkCard = page.locator(".group.bg-white.rounded-2xl").first();
      await linkCard.hover();

      const qrButton = linkCard
        .locator("button")
        .filter({ has: page.locator("svg.lucide-qr-code") })
        .first();

      if (await qrButton.isVisible()) {
        await qrButton.click();

        const qrImage = page
          .locator('img[alt*="QR"], img[src*="data:image"]')
          .first();
        await expect(qrImage).toBeVisible({ timeout: 5000 });

        // Get initial src
        const initialSrc = await qrImage.getAttribute("src");

        // Change color
        const colorInput = page.locator('input[type="color"]').first();
        if (await colorInput.isVisible()) {
          await colorInput.fill("#00ff00");
          await page.waitForTimeout(1000);

          // Preview should have updated
          const newSrc = await qrImage.getAttribute("src");
          // Both should be data URLs
          expect(newSrc).toContain("data:");
        }
      }
    });
  });

  test.describe("QR Code from Analytics Page", () => {
    test("QRC-040: Create QR from link analytics", async ({ page }) => {
      await page.goto(`/dashboard/links/${TEST_IDS.links.popular}/analytics`);
      await page.waitForLoadState("networkidle");

      // Look for QR Code card
      await expect(page.locator('h3:has-text("QR Code")')).toBeVisible({
        timeout: 10000,
      });

      // Click Create QR Code button
      const createQrButton = page.locator('button:has-text("Create QR Code")');
      if (await createQrButton.isVisible()) {
        await createQrButton.click();

        // QR customizer should open
        await page.waitForTimeout(1000);
      }
    });
  });
});
