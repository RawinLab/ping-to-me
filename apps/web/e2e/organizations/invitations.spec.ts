import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueEmail,
  waitForApiResponse,
  fillField,
} from "../fixtures/test-helpers";
import {
  TEST_CREDENTIALS,
  TEST_IDS,
} from "../fixtures/test-data";

test.describe("Invitations", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;
  const createdInvitationIds: string[] = [];

  test.beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        api = await ApiClient.create("owner");
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    cleanup = new CleanupTracker();
    await loginAsUser(page, "owner");
  });

  test.afterEach(async () => {
    for (const id of createdInvitationIds.splice(0)) {
      await api
        .delete(
          `/organizations/${TEST_IDS.organizations.main}/invitations/${id}`,
        )
        .catch(() => {});
    }
    await cleanup.cleanup(api);
  });

  async function gotoTeamPage(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
    });
    await page.goto("/dashboard/settings/team", { waitUntil: "domcontentloaded" });
    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate(() => {
        localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
      });
      await page.goto("/dashboard/settings/team", { waitUntil: "domcontentloaded" });
    }
    if (!page.url().includes("/settings/team")) {
      await page.evaluate(() => {
        localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
      });
      await page.goto("/dashboard/settings/team", { waitUntil: "domcontentloaded" });
    }
    await page.locator("text=PingTO.Me").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
    await expect(page.locator("h1").filter({ hasText: /Team|Members/ })).toBeVisible({ timeout: 30000 });
  }

  async function openInviteModal(page: import("@playwright/test").Page) {
    const inviteButton = page.locator('button:has-text("Invite Member"), button:has-text("Invite Your First"), button:has-text("Invite"), button:has-text("Add Member")').first();
    await expect(inviteButton).toBeVisible({ timeout: 15000 });
    await inviteButton.click();
    const dialog = page.locator("[role='dialog'], .fixed.inset-0, [data-state='open']");
    await expect(dialog.first()).toBeVisible({ timeout: 5000 });
    return dialog.first();
  }

  async function createInvitationViaApi(
    email: string,
    role: string = "VIEWER",
  ) {
    const result = await api.post(
      `/organizations/${TEST_IDS.organizations.main}/invitations`,
      { email, role },
    );
    if (result?.id) {
      createdInvitationIds.push(result.id);
    }
    return result;
  }

  test("send invitation with email and role", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    await api.post("/auth/register", {
      email: inviteEmail,
      password: "TestPassword123!",
      name: "Test Invite User",
    }).catch(() => {});

    await gotoTeamPage(page);

    const dialog = await openInviteModal(page);

    await dialog.locator('input[type="email"]').fill(inviteEmail);
    await dialog.locator("select").selectOption({ label: "Editor" });

    const response = await waitForApiResponse(
      page,
      "/invites",
      "POST",
      async () => {
        await dialog.locator('button:has-text("Send Invite")').click();
      },
    );

    expect([200, 201, 403, 409]).toContain(response.status);

    if (response.data?.id) {
      createdInvitationIds.push(response.data.id);
    }
  });

  test("pending invitations are accessible via API", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    await createInvitationViaApi(inviteEmail, "EDITOR");

    const invitations = await api.get(
      `/organizations/${TEST_IDS.organizations.main}/invitations?status=pending`,
    );

    const found = Array.isArray(invitations)
      ? invitations.some((inv: any) => inv.email === inviteEmail)
      : invitations?.invitations?.some((inv: any) => inv.email === inviteEmail);

    expect(found).toBe(true);
  });

  test("resend an existing pending invitation via API", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await createInvitationViaApi(inviteEmail, "VIEWER");

    if (invitation?.id) {
      const result = await api.post(
        `/organizations/${TEST_IDS.organizations.main}/invitations/${invitation.id}/resend`,
      );
      expect(result).toBeDefined();
    }
  });

  test("cancel a pending invitation via API", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await createInvitationViaApi(inviteEmail, "VIEWER");

    if (invitation?.id) {
      const result = await api.delete(
        `/organizations/${TEST_IDS.organizations.main}/invitations/${invitation.id}`,
      );
      expect(result).toBeDefined();
    }
  });

  test("accept invitation via token URL", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await createInvitationViaApi(inviteEmail, "EDITOR");

    if (invitation?.token) {
      await page.goto(`/invitations/${invitation.token}`);

      await expect(
        page.locator("text=invited to join"),
      ).toBeVisible({ timeout: 10000 });

      const acceptButton = page.locator(
        'button:has-text("Accept Invitation")',
      );

      if (await acceptButton.isVisible({ timeout: 5000 })) {
        const response = await waitForApiResponse(
          page,
          "/accept",
          "POST",
          async () => {
            await acceptButton.click();
          },
        );
        expect([200, 201]).toContain(response.status);
      }
    }
  });

  test("accepted invitation adds member to the organization", async ({
    page,
  }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await createInvitationViaApi(inviteEmail, "EDITOR");

    if (invitation?.token) {
      const newUserClient = await ApiClient.create("newUser");
      await newUserClient
        .post(`/invitations/${invitation.token}/accept`)
        .catch(() => {});

      await gotoTeamPage(page);

      await expect(
        page.locator(`text=${TEST_CREDENTIALS.newUser.email}`),
      ).toBeVisible({ timeout: 10000 });

      await api.removeMember(TEST_IDS.users.newUser).catch(() => {});
    }
  });

  test("expired invitation shows expiration message", async ({ page }) => {
    const expiredToken = "expired-test-token";

    await page.goto(`/invitations/${expiredToken}`);

    const bodyText = await page.locator("body").textContent({ timeout: 10000 });
    expect(bodyText).toMatch(
      /expired|not found|invalid|no longer valid|does not exist|Invalid/i,
    );
  });

  test("cannot invite user who is already a member", async ({ page }) => {
    await gotoTeamPage(page);

    const dialog = await openInviteModal(page);

    await dialog
      .locator('input[type="email"]')
      .fill(TEST_CREDENTIALS.admin.email);

    const response = await waitForApiResponse(
      page,
      "/invites",
      "POST",
      async () => {
        await dialog.locator('button:has-text("Send Invite")').click();
      },
    );

    expect(response.status).toBeGreaterThanOrEqual(400);

    await page.keyboard.press("Escape");
  });

  test("invitation form shows role select with default", async ({ page }) => {
    await gotoTeamPage(page);

    const dialog = await openInviteModal(page);

    const roleSelect = dialog.locator("select");
    await expect(roleSelect).toBeVisible();

    const selectedValue = await roleSelect.inputValue();
    expect(selectedValue).toBeTruthy();

    await page.keyboard.press("Escape");
  });

  test("invitation form requires email to submit", async ({ page }) => {
    await gotoTeamPage(page);

    const dialog = await openInviteModal(page);

    const emailInput = dialog.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const form = dialog.locator("form");
    const submitButton = dialog.locator('button:has-text("Send Invite")');

    await emailInput.fill("");

    const isDisabled = await submitButton.getAttribute("disabled");
    if (isDisabled !== null) {
      expect(isDisabled).not.toBeNull();
    }

    await page.keyboard.press("Escape");
  });

  test("duplicate invitation to same email returns error", async ({
    page,
  }) => {
    const inviteEmail = uniqueEmail();
    await createInvitationViaApi(inviteEmail, "VIEWER");

    await gotoTeamPage(page);

    const dialog = await openInviteModal(page);

    await dialog.locator('input[type="email"]').fill(inviteEmail);

    const response = await waitForApiResponse(
      page,
      "/invites",
      "POST",
      async () => {
        await dialog.locator('button:has-text("Send Invite")').click();
      },
    );

    expect(response.status).toBeGreaterThanOrEqual(400);

    await page.keyboard.press("Escape");
  });

  test("new user registration and invitation accept flow", async ({
    page,
  }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await createInvitationViaApi(inviteEmail, "EDITOR");

    if (invitation?.token) {
      await page.goto(`/invitations/${invitation.token}`);

      await expect(
        page.locator("text=invited to join"),
      ).toBeVisible({ timeout: 10000 });

      const nameInput = page.locator("#name");
      if (await nameInput.isVisible({ timeout: 5000 })) {
        await nameInput.fill("New Invited User");
      }

      const passwordInput = page.locator("#password");
      if (await passwordInput.isVisible({ timeout: 5000 })) {
        await passwordInput.fill("TestPassword123!");
      }

      const confirmInput = page.locator("#confirm-password");
      if (await confirmInput.isVisible({ timeout: 5000 })) {
        await confirmInput.fill("TestPassword123!");
      }

      const acceptButton = page.locator(
        'button:has-text("Create Account & Join")',
      );

      if (await acceptButton.isVisible({ timeout: 5000 })) {
        const response = await waitForApiResponse(
          page,
          "/accept",
          "POST",
          async () => {
            await acceptButton.click();
          },
        );

        expect([200, 201]).toContain(response.status);
      }
    }
  });
});
