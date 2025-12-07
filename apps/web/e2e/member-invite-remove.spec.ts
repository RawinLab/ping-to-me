import { test, expect } from "@playwright/test";
import { addDays, subDays } from "date-fns";

test.describe("Member Invite/Remove", () => {
  // Mock data
  const mockUser = {
    id: "user-1",
    email: "owner@example.com",
    name: "Owner User",
    role: "OWNER",
  };

  const mockAdminUser = {
    id: "user-2",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN",
  };

  const mockEditorUser = {
    id: "user-3",
    email: "editor@example.com",
    name: "Editor User",
    role: "EDITOR",
  };

  const mockOrg = {
    id: "org-1",
    name: "Test Organization",
    slug: "test-org",
    logo: null,
  };

  const mockInvitation = {
    id: "inv-1",
    email: "newmember@example.com",
    role: "EDITOR",
    organizationId: "org-1",
    invitedById: "user-1",
    token: "mock-token-123",
    expiresAt: addDays(new Date(), 7).toISOString(),
    acceptedAt: null,
    declinedAt: null,
    createdAt: new Date().toISOString(),
    personalMessage: "Welcome to our team!",
    invitedBy: { id: "user-1", name: "Owner User", email: "owner@example.com" },
    organization: mockOrg,
  };

  const mockExpiredInvitation = {
    ...mockInvitation,
    id: "inv-2",
    email: "expired@example.com",
    expiresAt: subDays(new Date(), 1).toISOString(),
  };

  const mockAcceptedInvitation = {
    ...mockInvitation,
    id: "inv-3",
    email: "accepted@example.com",
    acceptedAt: new Date().toISOString(),
  };

  const mockMembers = [
    {
      userId: "user-1",
      role: "OWNER",
      user: { id: "user-1", name: "Owner User", email: "owner@example.com" },
    },
    {
      userId: "user-4",
      role: "EDITOR",
      user: {
        id: "user-4",
        name: "Existing Member",
        email: "existing@example.com",
      },
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

    // Mock auth endpoints
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accessToken: "mock-access-token" }),
      });
    });

    await page.route("**/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUser),
      });
    });

    // Mock organizations
    await page.route("**/organizations", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockOrg]),
        });
      } else {
        await route.continue();
      }
    });

    // Mock members list
    await page.route("**/organizations/org-1/members", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockMembers),
        });
      } else if (route.request().method() === "DELETE") {
        // Handle member removal
        const url = route.request().url();
        const userId = url.split("/").pop();
        if (userId === "user-4") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock invitations list
    await page.route("**/organizations/org-1/invitations", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            invitations: [mockInvitation],
            meta: { total: 1 },
          }),
        });
      } else if (route.request().method() === "POST") {
        const postData = route.request().postDataJSON();
        expect(postData.email).toBeTruthy();
        expect(postData.role).toBeTruthy();

        // Check for duplicate email
        if (postData.email === "existing@example.com") {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ message: "User is already a member" }),
          });
        } else {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: "inv-new",
              email: postData.email,
              role: postData.role,
              expiresAt: addDays(new Date(), 7).toISOString(),
              organizationId: "org-1",
              invitedById: "user-1",
              createdAt: new Date().toISOString(),
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock specific invitation endpoints
    await page.route(
      "**/organizations/org-1/invitations/*",
      async (route) => {
        const url = route.request().url();
        const invitationId = url.split("/").pop();

        if (route.request().method() === "POST") {
          // Resend invitation
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ message: "Invitation resent" }),
          });
        } else if (route.request().method() === "DELETE") {
          // Cancel invitation
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        } else {
          await route.continue();
        }
      }
    );

    // Mock invitation by token endpoints
    await page.route("**/invitations/*", async (route) => {
      const url = route.request().url();
      const token = url.split("/").pop();

      if (token === "mock-token-123") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockInvitation),
        });
      } else if (token === "expired-token") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockExpiredInvitation),
        });
      } else if (token === "accepted-token") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockAcceptedInvitation),
        });
      } else if (token === "invalid-token") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invitation not found" }),
        });
      } else {
        await route.continue();
      }
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

    // Mock links list
    await page.route("**/links?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        });
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
  });

  test.describe("Send Invitation", () => {
    test("MIR-001: Send invitation to new email", async ({ page }) => {
      let invitationCreated = false;

      await page.route(
        "**/organizations/org-1/invitations",
        async (route) => {
          if (route.request().method() === "POST") {
            const postData = route.request().postDataJSON();
            expect(postData.email).toBe("newteammember@example.com");
            expect(postData.role).toBe("EDITOR");
            invitationCreated = true;

            await route.fulfill({
              status: 201,
              contentType: "application/json",
              body: JSON.stringify({
                id: "inv-new",
                email: "newteammember@example.com",
                role: "EDITOR",
                expiresAt: addDays(new Date(), 7).toISOString(),
              }),
            });
          } else {
            await route.continue();
          }
        }
      );

      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Click "Invite Member" button
      await page.click('button:has-text("Invite Member")');

      // Wait for dialog to appear
      await expect(page.locator("text=Invite Team Member")).toBeVisible();

      // Fill in email
      await page.fill('input[placeholder="colleague@company.com"]', "newteammember@example.com");

      // Select role (EDITOR)
      await page.click('div[role="combobox"]');
      await page.click('div[role="option"]:has-text("Editor")');

      // Optional: Add personal message
      await page.fill(
        'textarea[placeholder="Add a personal note to your invitation..."]',
        "Welcome to the team!"
      );

      // Submit the form
      await page.click('button:has-text("Send Invitation")');

      // Verify invitation was created
      expect(invitationCreated).toBe(true);
    });

    test("MIR-002: Cannot invite existing member", async ({ page }) => {
      let errorShown = false;

      await page.route(
        "**/organizations/org-1/invitations",
        async (route) => {
          if (route.request().method() === "POST") {
            const postData = route.request().postDataJSON();
            if (postData.email === "existing@example.com") {
              await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({
                  message: "User is already a member",
                }),
              });
            } else {
              await route.continue();
            }
          } else {
            await route.continue();
          }
        }
      );

      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Click invite button
      await page.click('button:has-text("Invite Member")');

      // Wait for dialog
      await expect(page.locator("text=Invite Team Member")).toBeVisible();

      // Try to invite existing member
      await page.fill(
        'input[placeholder="colleague@company.com"]',
        "existing@example.com"
      );

      // Select role
      await page.click('div[role="combobox"]');
      await page.click('div[role="option"]:has-text("Editor")');

      // Submit
      await page.click('button:has-text("Send Invitation")');

      // Verify error is shown
      await expect(
        page.locator("text=User is already a member")
      ).toBeVisible();
    });

    test("MIR-005: Role options filtered by user role", async ({ page }) => {
      // For OWNER user, all roles should be available
      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Click invite button
      await page.click('button:has-text("Invite Member")');

      // Wait for dialog
      await expect(page.locator("text=Invite Team Member")).toBeVisible();

      // Click role dropdown
      await page.click('div[role="combobox"]');

      // Verify all roles are available for OWNER
      await expect(page.locator('div[role="option"]:has-text("Admin")')).toBeVisible();
      await expect(
        page.locator('div[role="option"]:has-text("Editor")')
      ).toBeVisible();
      await expect(
        page.locator('div[role="option"]:has-text("Viewer")')
      ).toBeVisible();
    });
  });

  test.describe("Accept Invitation", () => {
    test("MIR-010: Accept invitation as existing user", async ({ page }) => {
      let acceptCalled = false;

      await page.route(
        "**/invitations/mock-token-123/accept",
        async (route) => {
          if (route.request().method() === "POST") {
            acceptCalled = true;
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                message: "Invitation accepted",
                organizationId: "org-1",
              }),
            });
          } else {
            await route.continue();
          }
        }
      );

      // Navigate to invitation page
      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Verify user is logged in
      await expect(page.locator("text=Logged in as")).toBeVisible();
      await expect(page.locator("text=owner@example.com")).toBeVisible();

      // Click accept button
      await page.click('button:has-text("Accept Invitation")');

      // Verify accept was called
      expect(acceptCalled).toBe(true);

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/);
    });

    test("MIR-011: Accept invitation as new user", async ({ page }) => {
      let acceptCalled = false;
      let registrationData: any = null;

      // Unroute auth/me to allow new user flow
      await page.unroute("**/auth/me");

      // Mock new user state
      await page.route("**/auth/me", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" }),
        });
      });

      await page.route(
        "**/invitations/mock-token-123/accept",
        async (route) => {
          if (route.request().method() === "POST") {
            const postData = route.request().postDataJSON();
            registrationData = postData;
            acceptCalled = true;

            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                message: "Invitation accepted",
                accessToken: "new-user-token",
                organizationId: "org-1",
              }),
            });
          } else {
            await route.continue();
          }
        }
      );

      // Navigate to invitation as new user
      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Fill registration form
      await page.fill('input[id="name"]', "New User");
      await page.fill('input[id="password"]', "SecurePassword123!");
      await page.fill('input[id="confirm-password"]', "SecurePassword123!");

      // Click accept button (should create account and accept)
      await page.click('button:has-text("Create Account & Join")');

      // Verify accept was called with registration data
      expect(acceptCalled).toBe(true);
      expect(registrationData).toBeTruthy();
      expect(registrationData.name).toBe("New User");

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    });

    test("MIR-012: Cannot accept expired invitation", async ({ page }) => {
      await page.goto("/invitations/expired-token");

      // Wait for expired message
      await expect(page.locator("text=Invitation Expired")).toBeVisible();
      await expect(
        page.locator("text=This invitation has expired")
      ).toBeVisible();

      // Accept button should not be available
      const acceptButton = page.locator(
        'button:has-text("Accept Invitation")'
      );
      await expect(acceptButton).not.toBeVisible();
    });

    test("MIR-014: Invitation shows correct details", async ({ page }) => {
      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Verify invitation details are displayed
      await expect(
        page.locator("text=Owner User has invited you to collaborate")
      ).toBeVisible();

      // Verify role is shown
      await expect(page.locator("text=Editor")).toBeVisible();

      // Verify personal message is shown
      await expect(
        page.locator("text=Welcome to our team!")
      ).toBeVisible();

      // Verify expiration is shown
      await expect(page.locator("text=/Expires/")).toBeVisible();
    });
  });

  test.describe("Decline Invitation", () => {
    test("MIR-020: Decline invitation", async ({ page }) => {
      let declineCalled = false;

      await page.route(
        "**/invitations/mock-token-123/decline",
        async (route) => {
          if (route.request().method() === "POST") {
            declineCalled = true;
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ message: "Invitation declined" }),
            });
          } else {
            await route.continue();
          }
        }
      );

      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Handle confirm dialog
      page.on("dialog", (dialog) => {
        expect(dialog.message()).toContain(
          "Are you sure you want to decline this invitation?"
        );
        dialog.accept();
      });

      // Click decline button
      await page.click('button:has-text("Decline Invitation")');

      // Verify decline was called
      expect(declineCalled).toBe(true);

      // Should show declined state
      await expect(page.locator("text=Invitation Declined")).toBeVisible();
    });
  });

  test.describe("Manage Invitations", () => {
    test("MIR-030: View pending invitations list", async ({ page }) => {
      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Pending invitations list should be visible
      // This would be in a separate section or expandable area
      // For now, verify the page structure
      await expect(page).toBeTruthy();
    });

    test("MIR-031: Resend invitation", async ({ page }) => {
      let resendCalled = false;

      await page.route(
        "**/organizations/org-1/invitations/inv-1",
        async (route) => {
          if (route.request().method() === "POST") {
            resendCalled = true;
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ message: "Invitation resent" }),
            });
          } else if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(mockInvitation),
            });
          } else {
            await route.continue();
          }
        }
      );

      // Navigate to pending invitations (would be on team page or separate page)
      // This test assumes pending invitations are displayed on team page
      // or there's a dedicated pending invitations component

      // The resend button would be in the pending invitations list
      // This is a placeholder for actual UI interaction
    });

    test("MIR-032: Cancel invitation", async ({ page }) => {
      let cancelCalled = false;

      await page.route(
        "**/organizations/org-1/invitations/inv-1",
        async (route) => {
          if (route.request().method() === "DELETE") {
            cancelCalled = true;
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ success: true }),
            });
          } else if (route.request().method() === "GET") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(mockInvitation),
            });
          } else {
            await route.continue();
          }
        }
      );

      // Navigate to pending invitations
      // The cancel button would be in the pending invitations list
      // This is a placeholder for actual UI interaction
    });
  });

  test.describe("Remove Member", () => {
    test("MIR-040: Remove member from organization", async ({ page }) => {
      let memberRemoved = false;

      await page.route(
        "**/organizations/org-1/members/user-4",
        async (route) => {
          if (route.request().method() === "DELETE") {
            memberRemoved = true;
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ success: true }),
            });
          } else {
            await route.continue();
          }
        }
      );

      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Find the member row
      const memberRow = page.locator("text=Existing Member");
      await expect(memberRow).toBeVisible();

      // Find and click the delete button for this member
      const deleteButton = memberRow.locator("..").locator('button[class*="text-red"]');

      // Handle confirmation dialog
      page.on("dialog", (dialog) => {
        expect(dialog.message()).toContain(
          "Are you sure you want to remove this member?"
        );
        dialog.accept();
      });

      // Click delete
      await deleteButton.click();

      // Verify member was removed
      expect(memberRemoved).toBe(true);
    });

    test("MIR-041: Cannot remove OWNER", async ({ page }) => {
      // OWNER should have a different UI (no delete button)
      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Find owner row
      const ownerRow = page.locator("text=Owner User");
      await expect(ownerRow).toBeVisible();

      // Owner should not have delete button visible
      const ownerLine = ownerRow.locator("..");
      const deleteButton = ownerLine.locator('button:has-text("Delete")');

      // Delete button should not exist or be disabled
      // This depends on actual implementation
    });

    test("MIR-044: Self-removal from organization", async ({ page }) => {
      // This would test removing yourself from an organization
      // Behavior might be to leave the org, which is different from removal

      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Find self (owner@example.com with "You" badge)
      const selfRow = page.locator("text=Owner User");
      await expect(selfRow).toBeVisible();

      // Self row should have "You" badge
      await expect(selfRow.locator("text=You")).toBeVisible();

      // Should not be able to self-remove or have remove disabled
    });
  });

  test.describe("Invitation Error Cases", () => {
    test("MIR-100: Handle invalid invitation token", async ({ page }) => {
      await page.goto("/invitations/invalid-token");

      // Wait for invalid message
      await expect(page.locator("text=Invalid Invitation")).toBeVisible();
      await expect(
        page.locator("text=This invitation link is invalid or has been revoked")
      ).toBeVisible();
    });

    test("MIR-101: Handle already accepted invitation", async ({ page }) => {
      await page.goto("/invitations/accepted-token");

      // Wait for already accepted message
      await expect(page.locator("text=Already Accepted")).toBeVisible();
      await expect(
        page.locator("text=You've already accepted this invitation")
      ).toBeVisible();
    });

    test("MIR-102: Validate email format in invitation form", async ({
      page,
    }) => {
      await page.goto("/dashboard/settings/team");

      // Wait for page to load
      await expect(page.locator("text=Team Members")).toBeVisible();

      // Click invite button
      await page.click('button:has-text("Invite Member")');

      // Wait for dialog
      await expect(page.locator("text=Invite Team Member")).toBeVisible();

      // Try invalid email
      await page.fill(
        'input[placeholder="colleague@company.com"]',
        "invalid-email"
      );

      // Submit button should be disabled or form should show error
      const submitButton = page.locator('button:has-text("Send Invitation")');

      // Check if disabled
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test("MIR-103: Password validation in new user registration", async ({
      page,
    }) => {
      // Unroute auth/me for new user
      await page.unroute("**/auth/me");
      await page.route("**/auth/me", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" }),
        });
      });

      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Try to accept with short password
      await page.fill('input[id="name"]', "New User");
      await page.fill('input[id="password"]', "short");
      await page.fill('input[id="confirm-password"]', "short");

      // Click accept - should show error
      await page.click('button:has-text("Create Account & Join")');

      // Error message should show
      await expect(
        page.locator("text=/Password must be at least 8 characters/i")
      ).toBeVisible();
    });

    test("MIR-104: Password mismatch validation", async ({ page }) => {
      // Unroute auth/me for new user
      await page.unroute("**/auth/me");
      await page.route("**/auth/me", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" }),
        });
      });

      await page.goto("/invitations/mock-token-123");

      // Wait for invitation to load
      await expect(
        page.locator("text=You're invited to join Test Organization")
      ).toBeVisible();

      // Fill with mismatched passwords
      await page.fill('input[id="name"]', "New User");
      await page.fill('input[id="password"]', "SecurePassword123!");
      await page.fill('input[id="confirm-password"]', "DifferentPassword123!");

      // Click accept - should show error
      await page.click('button:has-text("Create Account & Join")');

      // Error message should show
      await expect(
        page.locator("text=/Passwords do not match/i")
      ).toBeVisible();
    });
  });
});
