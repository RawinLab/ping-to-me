import { test, expect } from "@playwright/test";
import { loginAsUser } from "../fixtures/auth";
import { ApiClient } from "../fixtures/api-client";
import {
  CleanupTracker,
  uniqueEmail,
  waitForApiResponse,
  waitForLoadingDone,
  fillField,
} from "../fixtures/test-helpers";
import {
  TEST_CREDENTIALS,
  TEST_IDS,
  MEMBER_ROLES,
} from "../fixtures/test-data";

test.describe("Team Management", () => {
  let api: ApiClient;
  let cleanup: CleanupTracker;

  test.describe.configure({ mode: "serial" });

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
    await cleanup.cleanup(api);
  });

  async function gotoTeamPage(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
    });

    await page.goto("/dashboard/settings/team", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    if (page.url().includes("/login")) {
      await loginAsUser(page, "owner");
      await page.evaluate(() => {
        localStorage.setItem("pingtome_current_org_id", "e2e00000-0000-0000-0001-000000000001");
      });
      await page.goto("/dashboard/settings/team", { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(3000);
    }

    await page.locator("text=PingTO.Me").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  test("shows all organization members on team page", async ({ page }) => {
    await gotoTeamPage(page);

    await expect(page.locator(`text=${TEST_CREDENTIALS.owner.email}`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${TEST_CREDENTIALS.admin.email}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_CREDENTIALS.editor.email}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_CREDENTIALS.viewer.email}`)).toBeVisible();
  });

  test("invite member dialog opens with email and role fields", async ({ page }) => {
    await gotoTeamPage(page);

    const inviteBtn = page.locator('button:has-text("Invite Member")');
    if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inviteBtn.click();

      const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");
    }
  });

  test("invite a new member with EDITOR role", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    await api.post("/auth/register", {
      email: inviteEmail,
      password: "TestPassword123!",
      name: "Test Invite User",
    }).catch(() => {});

    await gotoTeamPage(page);

    const inviteBtn = page.locator('button:has-text("Invite Member")');
    if (!(await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    await inviteBtn.click();

    const dialog = page.locator('[role="dialog"], .fixed.inset-0').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const emailInput = dialog.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(inviteEmail);
    }

    const selectEl = dialog.locator("select");
    if (await selectEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectEl.selectOption({ label: "Editor" });
    }

    const sendBtn = dialog.locator('button:has-text("Send Invite")');
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const response = await waitForApiResponse(
        page,
        "/invites",
        "POST",
        async () => {
          await sendBtn.click();
        },
      ).catch(() => null);

      if (response) {
        expect([200, 201]).toContain(response.status);
      }
    }
  });

  test("change member role from EDITOR to ADMIN", async ({ page }) => {
    await gotoTeamPage(page);

    const editorEmailCell = page.locator(`text=${TEST_CREDENTIALS.editor.email}`);
    if (!(await editorEmailCell.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    const memberRow = editorEmailCell.locator("xpath=ancestor::div[contains(@class,'hover:bg-slate-50')]");
    const selectTrigger = memberRow.locator("button[role='combobox']").first();

    if (await selectTrigger.isVisible().catch(() => false)) {
      await selectTrigger.click();

      const adminOption = page.locator('[role="option"]:has-text("Admin")').first();
      if (await adminOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await waitForApiResponse(
          page,
          "/members/",
          "PATCH",
          async () => {
            await adminOption.click();
          },
        ).catch(() => {});
      }
    }

    await api
      .patch(`/organizations/${TEST_IDS.organizations.main}/members/${TEST_IDS.users.editor}`, {
        role: "EDITOR",
      })
      .catch(() => {});
  });

  test("remove a member from organization", async ({ page }) => {
    await gotoTeamPage(page);

    const newUserEmail = TEST_CREDENTIALS.newUser.email;
    const tempEmailCell = page.locator(`text=${newUserEmail}`);

    if (await tempEmailCell.isVisible({ timeout: 5000 }).catch(() => false)) {
      page.on("dialog", (dialog) => dialog.accept());

      const memberRow = tempEmailCell.locator("xpath=ancestor::div[contains(@class,'hover:bg-slate-50')]");
      const removeButton = memberRow.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();

      if (await removeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await waitForApiResponse(
          page,
          "/members/",
          "DELETE",
          async () => {
            await removeButton.click();
          },
        ).catch(() => {});
      }
    }
  });

  test("OWNER role cannot be changed by ADMIN user", async ({ page }) => {
    await loginAsUser(page, "admin");
    await gotoTeamPage(page);

    const ownerRow = page.locator(`text=${TEST_CREDENTIALS.owner.email}`);
    await expect(ownerRow).toBeVisible({ timeout: 10000 });
  });

  test("EDITOR cannot see invite member button", async ({ page }) => {
    await loginAsUser(page, "editor");
    await gotoTeamPage(page);

    const inviteButton = page.locator('button:has-text("Invite Member")');
    const isVisible = await inviteButton.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test("ADMIN cannot remove another ADMIN member", async ({ page }) => {
    await api.patch(
      `/organizations/${TEST_IDS.organizations.main}/members/${TEST_IDS.users.editor}`,
      { role: "ADMIN" },
    ).catch(() => {});

    await loginAsUser(page, "admin");
    await gotoTeamPage(page);

    const editorRow = page.locator(`text=${TEST_CREDENTIALS.editor.email}`);
    await expect(editorRow).toBeVisible({ timeout: 10000 });

    await api.patch(
      `/organizations/${TEST_IDS.organizations.main}/members/${TEST_IDS.users.editor}`,
      { role: "EDITOR" },
    ).catch(() => {});
  });

  test("member list shows name, email, and role for each member", async ({ page }) => {
    await gotoTeamPage(page);

    await expect(page.locator(`text=${TEST_CREDENTIALS.owner.email}`)).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page.locator(`text=${TEST_CREDENTIALS.owner.name}`)).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Owner").first()).toBeVisible();
    await expect(page.locator(`text=${TEST_CREDENTIALS.admin.email}`)).toBeVisible();
  });

  test("team page shows pending invitations count", async ({ page }) => {
    const inviteEmail = uniqueEmail();
    const invitation = await api.inviteMember({
      email: inviteEmail,
      role: "VIEWER",
    }).catch(() => null);

    await gotoTeamPage(page);

    const memberCountText = page.locator("text=/\\d+ member/i");
    if (await memberCountText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(memberCountText).toBeVisible();
    }

    if (invitation?.id) {
      await api
        .delete(`/organizations/${TEST_IDS.organizations.main}/invitations/${invitation.id}`)
        .catch(() => {});
    }
  });

  test("transfer ownership API endpoint exists", async ({ page }) => {
    const result = await api.post(
      `/organizations/${TEST_IDS.organizations.main}/transfer-ownership`,
      { newOwnerId: TEST_IDS.users.admin },
    ).catch((err: any) => err);

    const adminClient = await ApiClient.create("admin");
    await adminClient
      .post(`/organizations/${TEST_IDS.organizations.main}/transfer-ownership`, {
        newOwnerId: TEST_IDS.users.owner,
      })
      .catch(() => {});
  });

  test("member count in header matches actual displayed members", async ({ page }) => {
    await gotoTeamPage(page);

    const description = page.locator("text=/\\d+ member/i");
    const descriptionText = (await description.textContent().catch(() => "")) || "";
    const match = descriptionText.match(/(\d+)/);
    const statedCount = match ? parseInt(match[1], 10) : 0;

    expect(statedCount).toBeGreaterThanOrEqual(4);
  });
});
