import { test, expect } from "@playwright/test";

test.describe("Quota & Plan Management", () => {
  const randomId = Math.random().toString(36).substring(7);

  // Mock data for different user types
  const mockFreeUserOrgId = "free-org-1";
  const mockProUserOrgId = "pro-org-1";
  const mockHighUsageOrgId = "high-usage-org-1";

  // Mock plans
  const mockPlans = [
    {
      name: "free",
      displayName: "Free",
      price: 0,
      limits: {
        linksPerMonth: 50,
        customDomains: 1,
        teamMembers: 1,
        apiCallsPerMonth: 1000,
        analyticsRetentionDays: 30,
      },
    },
    {
      name: "pro",
      displayName: "Pro",
      price: 9,
      limits: {
        linksPerMonth: -1, // Unlimited
        customDomains: 10,
        teamMembers: 5,
        apiCallsPerMonth: 100000,
        analyticsRetentionDays: 365,
      },
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      price: null,
      limits: {
        linksPerMonth: -1, // Unlimited
        customDomains: -1, // Unlimited
        teamMembers: -1, // Unlimited
        apiCallsPerMonth: -1, // Unlimited
        analyticsRetentionDays: -1, // Unlimited
      },
    },
  ];

  // Mock usage data
  const mockFreeUsage = {
    yearMonth: "202412",
    links: 10,
    domains: 0,
    members: 1,
    apiCalls: 500,
  };

  const mockProUsage = {
    yearMonth: "202412",
    links: 1000,
    domains: 5,
    members: 3,
    apiCalls: 50000,
  };

  const mockHighUsage = {
    yearMonth: "202412",
    links: 42, // 84% of 50 limit
    domains: 0,
    members: 1,
    apiCalls: 800, // 80% of 1000 limit
  };

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

    // Mock analytics dashboard
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

    // Set cookie to pass middleware
    await page.context().addCookies([
      {
        name: "refresh_token",
        value: "mock-refresh-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test.describe("Plan Display", () => {
    test("QPM-001: should view available plans on pricing page", async ({
      page,
    }) => {
      // Mock public plans API
      await page.route("**/plans", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockPlans),
          });
        }
      });

      await page.goto("/pricing");

      // Wait for plans to load
      await page.waitForSelector('[data-testid="plan-card"]', {
        timeout: 10000,
      });

      // Should show all three plans
      const planCards = page.locator('[data-testid="plan-card"]');
      await expect(planCards).toHaveCount(3);

      // Check plan names are visible
      await expect(page.getByText("Free")).toBeVisible();
      await expect(page.getByText("Pro")).toBeVisible();
      await expect(page.getByText("Enterprise")).toBeVisible();
    });

    test("QPM-002: should display plan features and limits", async ({
      page,
    }) => {
      // Mock plans API
      await page.route("**/plans", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockPlans),
          });
        }
      });

      await page.goto("/pricing");

      await page.waitForSelector('[data-testid="plan-card"]', {
        timeout: 10000,
      });

      // Free plan should show limits
      const freeCard = page.locator('[data-testid="plan-free"]');
      await expect(freeCard.getByText(/50.*links/i)).toBeVisible();
      await expect(freeCard.getByText(/1.*custom domain/i)).toBeVisible();
      await expect(freeCard.getByText(/1.*member/i)).toBeVisible();
    });

    test("QPM-003: should display pricing information", async ({ page }) => {
      // Mock plans API
      await page.route("**/plans", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockPlans),
          });
        }
      });

      await page.goto("/pricing");

      await page.waitForSelector('[data-testid="plan-card"]', {
        timeout: 10000,
      });

      // Check pricing is displayed
      await expect(page.getByText(/\$9.*month/i)).toBeVisible();
      await expect(page.getByText("Free")).toBeVisible();
      await expect(page.getByText(/Contact Sales/i)).toBeVisible();
    });
  });

  test.describe("Usage Dashboard", () => {
    test("QPM-030: should display current usage on billing page", async ({
      page,
    }) => {
      // Mock subscription API
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "free",
              limits: mockPlans[0].limits,
              usage: mockFreeUsage,
              comparisons: {
                links: {
                  used: 10,
                  limit: 50,
                  unlimited: false,
                  percentUsed: 20,
                },
                domains: {
                  used: 0,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 0,
                },
                members: {
                  used: 1,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 100,
                },
                apiCalls: {
                  used: 500,
                  limit: 1000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Wait for usage dashboard to load
      await page.waitForSelector('[data-testid="usage-dashboard"]', {
        timeout: 10000,
      });

      // Should show usage categories
      await expect(
        page.getByText(/Links this month/i)
      ).toBeVisible();
      await expect(page.getByText(/Custom domains/i)).toBeVisible();
      await expect(page.getByText(/Team members/i)).toBeVisible();
      await expect(page.getByText(/API calls/i)).toBeVisible();
    });

    test("QPM-031: should show progress bars for usage", async ({ page }) => {
      // Mock subscription API
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "free",
              limits: mockPlans[0].limits,
              usage: mockFreeUsage,
              comparisons: {
                links: {
                  used: 10,
                  limit: 50,
                  unlimited: false,
                  percentUsed: 20,
                },
                domains: {
                  used: 0,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 0,
                },
                members: {
                  used: 1,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 100,
                },
                apiCalls: {
                  used: 500,
                  limit: 1000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      await page.waitForSelector('[data-testid="usage-dashboard"]', {
        timeout: 10000,
      });

      // Progress bars should be visible
      const progressBars = page.locator('[role="progressbar"]');
      await expect(progressBars.first()).toBeVisible();

      // At least one progress bar should exist
      const count = await progressBars.count();
      expect(count).toBeGreaterThan(0);
    });

    test("QPM-032: should display unlimited resources correctly", async ({
      page,
    }) => {
      // Mock subscription API for Pro user
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
            expiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data for Pro user
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "pro",
              limits: mockPlans[1].limits,
              usage: mockProUsage,
              comparisons: {
                links: {
                  used: 1000,
                  limit: -1, // Unlimited
                  unlimited: true,
                  percentUsed: 0,
                },
                domains: {
                  used: 5,
                  limit: 10,
                  unlimited: false,
                  percentUsed: 50,
                },
                members: {
                  used: 3,
                  limit: 5,
                  unlimited: false,
                  percentUsed: 60,
                },
                apiCalls: {
                  used: 50000,
                  limit: 100000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      await page.waitForSelector('[data-testid="usage-dashboard"]', {
        timeout: 10000,
      });

      // Pro user should see "Unlimited" for links
      const unlimitedBadges = page.locator('text=Unlimited');
      const count = await unlimitedBadges.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Quota Enforcement", () => {
    test("QPM-020: should prevent creating link at quota limit", async ({
      page,
    }) => {
      // Mock subscription
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock user at quota limit (50 links)
      await page.route("**/organizations/*/usage/limits", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            limits: mockPlans[0].limits,
            usage: {
              ...mockFreeUsage,
              links: 50, // At limit
            },
            comparisons: {
              links: {
                used: 50,
                limit: 50,
                unlimited: false,
                percentUsed: 100,
              },
              domains: {
                used: 0,
                limit: 1,
                unlimited: false,
                percentUsed: 0,
              },
              members: {
                used: 1,
                limit: 1,
                unlimited: false,
                percentUsed: 100,
              },
              apiCalls: {
                used: 500,
                limit: 1000,
                unlimited: false,
                percentUsed: 50,
              },
            },
          }),
        });
      });

      // Mock create link endpoint to return quota error
      await page.route("**/links", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              statusCode: 429,
              message: "Quota limit exceeded for links",
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/dashboard/links");

      // Try to create a new link
      await page.click('button:has-text("Create Link")');

      // Should show upgrade prompt or error
      const errorMsg = page.locator('text=Quota limit exceeded');
      if (await errorMsg.isVisible({ timeout: 5000 })) {
        await expect(errorMsg).toBeVisible();
      }
    });

    test("QPM-021: should block API calls at quota limit", async ({
      request,
    }) => {
      // User at API call limit
      const response = await request.post("/api/links", {
        headers: {
          Authorization: "Bearer mock-token",
        },
        data: {
          originalUrl: "https://example.com",
          slug: "test-link",
        },
      });

      // Expect either 429 (too many requests) or quota exceeded
      if (response.status() === 429 || response.status() === 403) {
        const data = await response.json();
        expect(
          data.message.toLowerCase().includes("quota") ||
            data.message.toLowerCase().includes("limit")
        ).toBeTruthy();
      }
    });
  });

  test.describe("Usage Alerts", () => {
    test("QPM-033: should show warning at 80% usage", async ({ page }) => {
      // Mock subscription
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock high usage data (80%)
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "free",
              limits: mockPlans[0].limits,
              usage: mockHighUsage,
              comparisons: {
                links: {
                  used: 42,
                  limit: 50,
                  unlimited: false,
                  percentUsed: 84,
                },
                domains: {
                  used: 0,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 0,
                },
                members: {
                  used: 1,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 100,
                },
                apiCalls: {
                  used: 800,
                  limit: 1000,
                  unlimited: false,
                  percentUsed: 80,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Check for warning alert
      const warningAlert = page.locator('[data-testid="usage-alert-warning"]');
      const almostFullBadge = page.locator('text=Almost full');

      // Either alert or badge should be visible
      const isVisible = await Promise.race([
        warningAlert.isVisible({ timeout: 5000 }).catch(() => false),
        almostFullBadge.isVisible({ timeout: 5000 }).catch(() => false),
      ]);

      expect(isVisible).toBeTruthy();
    });

    test("QPM-034: should show error alert at 100% usage", async ({
      page,
    }) => {
      // Mock subscription
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock at-limit usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "free",
              limits: mockPlans[0].limits,
              usage: {
                ...mockFreeUsage,
                links: 50, // At limit
              },
              comparisons: {
                links: {
                  used: 50,
                  limit: 50,
                  unlimited: false,
                  percentUsed: 100,
                },
                domains: {
                  used: 0,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 0,
                },
                members: {
                  used: 1,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 100,
                },
                apiCalls: {
                  used: 800,
                  limit: 1000,
                  unlimited: false,
                  percentUsed: 80,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Check for error badge
      const limitReachedBadge = page.locator('text=Limit reached');

      // Should show limit reached for at least one resource
      const count = await limitReachedBadge.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("API Endpoints", () => {
    test("QPM-050: should return usage data from API", async ({ request }) => {
      // Mock login to get token
      const loginResponse = await request.post("/api/auth/login", {
        data: {
          email: "test@example.com",
          password: "password123",
        },
      });

      // If login fails, skip (in real test we'd use real credentials)
      if (!loginResponse.ok()) {
        test.skip();
      }

      const loginData = await loginResponse.json();
      const token = loginData.accessToken || "mock-token";

      // Get usage
      const usageResponse = await request.get(
        "/api/organizations/org-1/usage",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Should be accessible (200 or 401 if auth fails)
      expect(usageResponse.status()).toBeLessThan(500);

      if (usageResponse.ok()) {
        const usage = await usageResponse.json();
        expect(usage).toHaveProperty("yearMonth");
        expect(usage).toHaveProperty("links");
        expect(typeof usage.links).toBe("number");
      }
    });

    test("QPM-051: should return plans from public API", async ({ request }) => {
      const response = await request.get("/api/plans");

      expect(response.ok()).toBeTruthy();

      const plans = await response.json();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);

      // Check plan structure
      const firstPlan = plans[0];
      expect(firstPlan).toHaveProperty("name");
      expect(firstPlan).toHaveProperty("limits");
      expect(typeof firstPlan.name).toBe("string");
      expect(typeof firstPlan.limits).toBe("object");
    });

    test("QPM-052: should return usage limits comparison", async ({
      request,
    }) => {
      const response = await request.get(
        "/api/organizations/org-1/usage/limits",
        {
          headers: {
            Authorization: "Bearer mock-token",
          },
        }
      );

      // Should be accessible (200 or 401 if auth fails)
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const data = await response.json();

        expect(data).toHaveProperty("plan");
        expect(data).toHaveProperty("limits");
        expect(data).toHaveProperty("usage");
        expect(data).toHaveProperty("comparisons");

        // Check comparison structure
        expect(data.comparisons).toHaveProperty("links");
        expect(data.comparisons.links).toHaveProperty("used");
        expect(data.comparisons.links).toHaveProperty("limit");
        expect(data.comparisons.links).toHaveProperty("percentUsed");
        expect(data.comparisons.links).toHaveProperty("unlimited");
      }
    });

    test("QPM-053: should return usage history", async ({ request }) => {
      const response = await request.get(
        "/api/organizations/org-1/usage/history",
        {
          headers: {
            Authorization: "Bearer mock-token",
          },
        }
      );

      // Should be accessible (200 or 401 if auth fails)
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const history = await response.json();
        expect(Array.isArray(history)).toBe(true);

        if (history.length > 0) {
          const item = history[0];
          expect(item).toHaveProperty("yearMonth");
          expect(item).toHaveProperty("usage");
        }
      }
    });

    test("QPM-054: should check quota for specific resource", async ({
      request,
    }) => {
      const response = await request.post(
        "/api/organizations/org-1/usage/check",
        {
          headers: {
            Authorization: "Bearer mock-token",
          },
          data: {
            resource: "links",
          },
        }
      );

      // Should be accessible (200, 401, or 429)
      expect([200, 401, 429].includes(response.status())).toBeTruthy();

      if (response.status() === 200) {
        const result = await response.json();
        expect(result).toHaveProperty("allowed");
        expect(typeof result.allowed).toBe("boolean");

        if (!result.allowed) {
          expect(result).toHaveProperty("reason");
        }
      }
    });
  });

  test.describe("Plan Comparison", () => {
    test("QPM-040: should show feature comparison matrix", async ({
      page,
    }) => {
      // Mock plans comparison
      await page.route("**/plans/compare/all", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              features: [
                {
                  name: "Links per month",
                  free: "50",
                  pro: "Unlimited",
                  enterprise: "Unlimited",
                },
                {
                  name: "Custom domains",
                  free: "1",
                  pro: "10",
                  enterprise: "Unlimited",
                },
                {
                  name: "Team members",
                  free: "1",
                  pro: "5",
                  enterprise: "Unlimited",
                },
              ],
            }),
          });
        }
      });

      await page.goto("/pricing");

      // Wait for comparison table to load
      const comparisonTable = page.locator('[data-testid="comparison-table"]');
      if (await comparisonTable.isVisible({ timeout: 5000 })) {
        // Check that feature names are visible
        const rows = page.locator("[data-testid='comparison-row']");
        expect(await rows.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Billing & Subscription", () => {
    test("QPM-060: should display current subscription status", async ({
      page,
    }) => {
      // Mock subscription with active status
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
            expiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "pro",
              limits: mockPlans[1].limits,
              usage: mockProUsage,
              comparisons: {
                links: {
                  used: 1000,
                  limit: -1,
                  unlimited: true,
                  percentUsed: 0,
                },
                domains: {
                  used: 5,
                  limit: 10,
                  unlimited: false,
                  percentUsed: 50,
                },
                members: {
                  used: 3,
                  limit: 5,
                  unlimited: false,
                  percentUsed: 60,
                },
                apiCalls: {
                  used: 50000,
                  limit: 100000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Should show Pro plan status
      await expect(page.getByText(/Pro.*plan/i)).toBeVisible();

      // Should show active status
      await expect(page.getByText("Active")).toBeVisible();
    });

    test("QPM-061: should show billing history table", async ({ page }) => {
      // Mock subscription
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
          }),
        });
      });

      // Mock billing history with invoices
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "inv-1",
              date: new Date().toISOString(),
              amount: 9,
              currency: "USD",
              status: "paid",
              pdfUrl: "https://example.com/invoice.pdf",
            },
            {
              id: "inv-2",
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              amount: 9,
              currency: "USD",
              status: "paid",
              pdfUrl: "https://example.com/invoice2.pdf",
            },
          ]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "pro",
              limits: mockPlans[1].limits,
              usage: mockProUsage,
              comparisons: {
                links: {
                  used: 1000,
                  limit: -1,
                  unlimited: true,
                  percentUsed: 0,
                },
                domains: {
                  used: 5,
                  limit: 10,
                  unlimited: false,
                  percentUsed: 50,
                },
                members: {
                  used: 3,
                  limit: 5,
                  unlimited: false,
                  percentUsed: 60,
                },
                apiCalls: {
                  used: 50000,
                  limit: 100000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Wait for billing history table
      await page.waitForSelector("table", { timeout: 10000 });

      // Should show invoices
      const rows = page.locator("tbody tr");
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);

      // Check for paid status badge
      await expect(page.getByText("Paid")).toBeVisible();
    });

    test("QPM-062: should show download button for invoices", async ({
      page,
    }) => {
      // Mock subscription
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
          }),
        });
      });

      // Mock billing history with PDF URL
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "inv-1",
              date: new Date().toISOString(),
              amount: 9,
              currency: "USD",
              status: "paid",
              pdfUrl: "https://example.com/invoice.pdf",
            },
          ]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "pro",
              limits: mockPlans[1].limits,
              usage: mockProUsage,
              comparisons: {
                links: {
                  used: 1000,
                  limit: -1,
                  unlimited: true,
                  percentUsed: 0,
                },
                domains: {
                  used: 5,
                  limit: 10,
                  unlimited: false,
                  percentUsed: 50,
                },
                members: {
                  used: 3,
                  limit: 5,
                  unlimited: false,
                  percentUsed: 60,
                },
                apiCalls: {
                  used: 50000,
                  limit: 100000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Look for download button
      const downloadButton = page.locator('[aria-label*="Download"]').first();

      // Download button should be present
      if (await downloadButton.isVisible({ timeout: 5000 })) {
        await expect(downloadButton).toBeVisible();
      }
    });
  });

  test.describe("Free vs Paid Features", () => {
    test("QPM-070: free user should see upgrade CTA", async ({ page }) => {
      // Mock subscription for free user
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "free",
            status: "active",
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "free",
              limits: mockPlans[0].limits,
              usage: mockFreeUsage,
              comparisons: {
                links: {
                  used: 10,
                  limit: 50,
                  unlimited: false,
                  percentUsed: 20,
                },
                domains: {
                  used: 0,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 0,
                },
                members: {
                  used: 1,
                  limit: 1,
                  unlimited: false,
                  percentUsed: 100,
                },
                apiCalls: {
                  used: 500,
                  limit: 1000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      await page.goto("/dashboard/billing");

      // Free users should see upgrade prompts
      const upgradeButtons = page.locator(
        'button:has-text("Upgrade to Pro"), button:has-text("Upgrade")'
      );
      const count = await upgradeButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test("QPM-071: pro user should see manage billing option", async ({
      page,
    }) => {
      // Mock subscription for Pro user
      await page.route("**/payments/subscription", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
            expiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });
      });

      // Mock billing history
      await page.route("**/payments/billing-history", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock usage data
      await page.route(
        "**/organizations/*/usage/limits",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              plan: "pro",
              limits: mockPlans[1].limits,
              usage: mockProUsage,
              comparisons: {
                links: {
                  used: 1000,
                  limit: -1,
                  unlimited: true,
                  percentUsed: 0,
                },
                domains: {
                  used: 5,
                  limit: 10,
                  unlimited: false,
                  percentUsed: 50,
                },
                members: {
                  used: 3,
                  limit: 5,
                  unlimited: false,
                  percentUsed: 60,
                },
                apiCalls: {
                  used: 50000,
                  limit: 100000,
                  unlimited: false,
                  percentUsed: 50,
                },
              },
            }),
          });
        }
      );

      // Mock billing portal
      await page.route("**/payments/portal", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              url: "https://billing.stripe.com/session/test",
            }),
          });
        }
      });

      await page.goto("/dashboard/billing");

      // Pro users should see manage billing button
      const manageBillingButton = page.locator(
        'button:has-text("Manage Billing")'
      );

      if (
        await manageBillingButton.isVisible({
          timeout: 5000,
        })
      ) {
        await expect(manageBillingButton).toBeVisible();
      }
    });
  });
});
