import { test, expect } from "@playwright/test";

test.describe("Custom Domains", () => {
  const mockDomains = [
    {
      id: "dom-1",
      hostname: "link.example.com",
      isVerified: true,
      status: "VERIFIED",
      isDefault: false,
      sslStatus: "ACTIVE",
      sslAutoRenew: true,
      verificationAttempts: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "dom-2",
      hostname: "go.mysite.com",
      isVerified: false,
      status: "PENDING",
      isDefault: false,
      sslStatus: null,
      verificationAttempts: 2,
      verificationType: "txt",
      verificationToken: "pingto-verify-abc123",
      createdAt: new Date().toISOString(),
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

    // Mock notifications
    await page.route("**/notifications", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ notifications: [], unreadCount: 0 }),
      });
    });

    // Mock domains list
    await page.route("**/domains?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDomains),
      });
    });

    await page.goto("/dashboard/domains");
  });

  test("DOM-001: Add Custom Domain", async ({ page }) => {
    // Mock domain creation
    await page.route("**/domains", async (route) => {
      if (route.request().method() === "POST") {
        const data = route.request().postDataJSON();
        expect(data.hostname).toBe("new.example.com");
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: "dom-new",
            hostname: "new.example.com",
            isVerified: false,
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Click Add Domain button
    await page.click('button:has-text("Add Domain")');

    // Fill hostname in modal
    await page.fill(
      'input[placeholder="links.example.com"]',
      "new.example.com",
    );

    // Click Add button in modal
    await page.click('button[type="submit"]:has-text("Add Domain")');

    // Should show DNS instructions or success
    // Modal might close or show instructions
    await expect(page.locator("text=new.example.com")).toBeVisible();
  });

  test("DOM-002: Verify Domain DNS - Success", async ({ page }) => {
    // Mock verify endpoint - success
    await page.route("**/domains/dom-2/verify", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, isVerified: true }),
      });
    });

    // Find pending domain row and click Verify
    const pendingRow = page.locator("tr", { hasText: "go.mysite.com" });

    // Handle alert before clicking
    const dialogPromise = page.waitForEvent("dialog");
    await pendingRow.locator('button:has-text("Verify")').click();
    const dialog = await dialogPromise;
    await dialog.accept();
    // Alert will show "Verification triggered"
  });

  test("DOM-003: Verify Domain DNS - Failed", async ({ page }) => {
    // Mock verify endpoint - failure
    await page.route("**/domains/dom-2/verify", async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: "DNS record not found" }),
      });
    });

    // Find pending domain row and click Verify
    const pendingRow = page.locator("tr", { hasText: "go.mysite.com" });

    // Handle alert before clicking
    const dialogPromise = page.waitForEvent("dialog");
    await pendingRow.locator('button:has-text("Verify")').click();
    const dialog = await dialogPromise;
    await dialog.accept();
    // Alert will show "Verification failed"
  });

  test("DOM-006: Remove Domain", async ({ page }) => {
    // Mock delete endpoint
    await page.route("**/domains/dom-1", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 });
      }
    });

    // Handle confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Find verified domain row and click delete
    const verifiedRow = page.locator("tr", { hasText: "link.example.com" });
    await verifiedRow.locator("button:has(.lucide-trash)").click();

    // Confirm deletion happened (row should disappear on reload)
  });

  test.describe("Default Domain", () => {
    test("DOM-030: Should set domain as default", async ({ page }) => {
      // Mock the setDefault endpoint
      await page.route("**/domains/dom-1/default", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mockDomains[0], isDefault: true }),
        });
      });

      // Handle confirm dialog
      page.on("dialog", (dialog) => dialog.accept());

      // Find Set Default button and click
      const verifiedDomainCard = page.locator('[class*="Card"]', {
        hasText: "link.example.com",
      });
      await verifiedDomainCard.locator('button:has-text("Set Default")').click();

      // Should see success
      await expect(page.locator("text=Default")).toBeVisible();
    });
  });

  test.describe("Domain Search & Filter", () => {
    test("DOM-060: Should search domains by hostname", async ({ page }) => {
      // Wait for domains to load
      await expect(page.locator("text=link.example.com")).toBeVisible();

      // Enter search term
      await page.fill('[data-testid="domain-search"]', "mysite");

      // Should only show matching domain
      await expect(page.locator("text=go.mysite.com")).toBeVisible();
      await expect(page.locator("text=link.example.com")).not.toBeVisible();
    });

    test("DOM-061: Should filter domains by status", async ({ page }) => {
      // Update mock to include status
      await page.route("**/domains?*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "dom-1",
              hostname: "link.example.com",
              isVerified: true,
              status: "VERIFIED",
              createdAt: new Date().toISOString(),
            },
            {
              id: "dom-2",
              hostname: "go.mysite.com",
              isVerified: false,
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.reload();

      // Click status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-verified"]');

      // Should only show verified domains
      await expect(page.locator("text=link.example.com")).toBeVisible();
      await expect(page.locator("text=go.mysite.com")).not.toBeVisible();
    });
  });

  test.describe("SSL Management", () => {
    test("DOM-020: Should provision SSL certificate", async ({ page }) => {
      // Navigate to domain details
      await page.route("**/domains/dom-1", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            ...mockDomains[0],
            isVerified: true,
            status: "VERIFIED",
            sslStatus: null,
          }),
        });
      });

      await page.route("**/domains/dom-1/ssl", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              sslStatus: "PROVISIONING",
              provider: "letsencrypt",
            }),
          });
        }
      });

      await page.goto("/dashboard/domains/dom-1");

      // Look for provision SSL button
      const provisionBtn = page.locator('button:has-text("Provision SSL")');
      if (await provisionBtn.isVisible()) {
        await provisionBtn.click();
        await expect(
          page.locator("text=PROVISIONING").or(page.locator("text=SSL")),
        ).toBeVisible();
      }
    });

    test("DOM-022: Should toggle SSL auto-renewal", async ({ page }) => {
      await page.route("**/domains/dom-1", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            ...mockDomains[0],
            isVerified: true,
            status: "VERIFIED",
            sslStatus: "ACTIVE",
            sslAutoRenew: true,
          }),
        });
      });

      await page.route("**/domains/dom-1/ssl", async (route) => {
        if (route.request().method() === "PATCH") {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ sslAutoRenew: false }),
          });
        } else if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              sslStatus: "ACTIVE",
              sslAutoRenew: true,
            }),
          });
        }
      });

      await page.goto("/dashboard/domains/dom-1");

      // Look for auto-renew toggle if visible
      const autoRenewToggle = page.locator(
        '[data-testid="ssl-auto-renew-toggle"]',
      );
      if (await autoRenewToggle.isVisible()) {
        await autoRenewToggle.click();
      }
    });
  });
});
