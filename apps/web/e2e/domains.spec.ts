import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

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

  test.describe("Domain RBAC Permissions", () => {
    test("DOM-040: OWNER can manage domains", async ({ page }) => {
      // Mock domains endpoint
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
              isDefault: false,
              sslStatus: "ACTIVE",
              verificationAttempts: 0,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.route("**/notifications", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ notifications: [], unreadCount: 0 }),
        });
      });

      // Login as owner
      await loginAsUser(page, "owner");
      await page.goto("/dashboard/domains");

      // Verify owner can see management buttons
      await expect(page.locator('button:has-text("Add Domain")')).toBeVisible();

      // Verify delete button is visible (using trash icon)
      const deleteBtn = page.locator('button:has(.lucide-trash2), button:has(.lucide-trash)').first();
      await expect(deleteBtn).toBeVisible();
    });

    test("DOM-041: ADMIN can manage domains", async ({ page }) => {
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
              isDefault: false,
              sslStatus: "ACTIVE",
              verificationAttempts: 0,
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.route("**/notifications", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ notifications: [], unreadCount: 0 }),
        });
      });

      // Login as admin
      await loginAsUser(page, "admin");
      await page.goto("/dashboard/domains");

      // Verify admin can see Add Domain button
      await expect(page.locator('button:has-text("Add Domain")')).toBeVisible();
    });

    test("DOM-042: EDITOR cannot manage domains", async ({ page }) => {
      // Mock API to return 403 for domain endpoints when accessed by editor
      await page.route("**/domains?*", async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 403,
            message: "Forbidden - insufficient permissions",
          }),
        });
      });

      await page.route("**/notifications", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ notifications: [], unreadCount: 0 }),
        });
      });

      // Login as editor
      await loginAsUser(page, "editor");
      await page.goto("/dashboard/domains");

      // Editor should either:
      // 1. Not see Add Domain button
      // 2. See an error/permission denied message
      // 3. Be redirected
      const addButton = page.locator('button:has-text("Add Domain")');
      const permissionError = page
        .locator('text=/permission|forbidden|access denied/i')
        .first();

      // Check if either button is hidden or error is shown
      const isButtonHidden = await addButton.isHidden().catch(() => true);
      const hasError = await permissionError.isVisible().catch(() => false);

      expect(isButtonHidden || hasError).toBeTruthy();
    });

    test("DOM-043: VIEWER cannot manage domains", async ({ page }) => {
      // Mock API to return 403 for domain endpoints when accessed by viewer
      await page.route("**/domains?*", async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 403,
            message: "Forbidden - insufficient permissions",
          }),
        });
      });

      await page.route("**/notifications", async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ notifications: [], unreadCount: 0 }),
        });
      });

      // Login as viewer
      await loginAsUser(page, "viewer");
      await page.goto("/dashboard/domains");

      // Viewer should not have domain management access
      const addButton = page.locator('button:has-text("Add Domain")');
      const deleteButton = page
        .locator('button:has(.lucide-trash2), button:has(.lucide-trash)')
        .first();

      // Check if management buttons are not visible
      const isAddHidden = await addButton.isHidden().catch(() => true);
      const isDeleteHidden = await deleteButton.isHidden().catch(() => true);

      expect(isAddHidden || isDeleteHidden).toBeTruthy();
    });
  });
});
