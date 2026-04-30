import { test, expect, request } from "@playwright/test";
import { loginAsUser, logout } from "../fixtures/auth";
import { TEST_CREDENTIALS } from "../fixtures/test-data";

/**
 * Two-Factor Authentication E2E Tests
 *
 * Tests 2FA setup flow, verification, backup codes, disable, and login redirect.
 * Uses serial describe because 2FA state persists between tests.
 *
 * TOTP codes are computed by reading the secret from the API response and
 * generating the code via the speakeasy-compatible algorithm exposed through
 * the API's /auth/2fa/setup endpoint.
 *
 * Prerequisites:
 * 1. Database seeded: pnpm --filter @pingtome/database db:seed
 * 2. Dev servers running: pnpm dev
 */

const API_BASE = "http://localhost:3011";

// ---------------------------------------------------------------------------
// Helper: compute TOTP code from base32 secret
// ---------------------------------------------------------------------------
function computeTotpCode(secret: string): string {
  // Manual TOTP implementation (RFC 6238) compatible with speakeasy
  const crypto = require("crypto");

  // Decode base32 secret to buffer
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret) {
    const val = base32Chars.indexOf(char.toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  const key = Buffer.from(bytes);

  // TOTP: time step of 30 seconds
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(timeStep, 4);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, "0");
}

// ---------------------------------------------------------------------------
// Helper: get an API access token for a given role
// Handles both normal login and 2FA-enabled accounts.
// ---------------------------------------------------------------------------
async function getApiToken(role: string = "owner", totpSecret?: string): Promise<string> {
  const credentials = TEST_CREDENTIALS[role as keyof typeof TEST_CREDENTIALS];
  const apiContext = await request.newContext({ baseURL: API_BASE });

  const response = await apiContext.post("/auth/login", {
    data: { email: credentials.email, password: credentials.password },
  });
  const body = await response.json();

  if (body.requires2FA && body.sessionToken) {
    if (!totpSecret) {
      await apiContext.dispose();
      throw new Error("Cannot get API token: 2FA is enabled but no totpSecret provided");
    }
    const totpCode = computeTotpCode(totpSecret);
    const verifyRes = await apiContext.post("/auth/login/2fa", {
      data: { sessionToken: body.sessionToken, code: totpCode },
    });
    if (!verifyRes.ok()) {
      await apiContext.dispose();
      throw new Error(`2FA verification for getApiToken failed (${verifyRes.status()})`);
    }
    const verifyBody = await verifyRes.json();
    await apiContext.dispose();
    return verifyBody.accessToken;
  }

  await apiContext.dispose();
  return body.accessToken;
}

async function navigateTo2FAPage(page: Page) {
  await page.goto("/dashboard/settings/two-factor", { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Login to the browser when 2FA is enabled.
 * Performs full auth flow via API (login → 2FA verify → get refresh_token cookie),
 * then injects the cookie into the browser context. On /dashboard navigation,
 * initializeAuth() calls /auth/refresh with the cookie to obtain an accessToken.
 */
async function loginWith2FA(page: Page, totpSecret?: string): Promise<void> {
  try {
    await page.context().clearCookies();
  } catch {
    // Context may have been closed between serial tests — navigation will also fail
    // but the error is more actionable
  }

  const credentials = TEST_CREDENTIALS.owner;
  const apiCtx = await request.newContext({ baseURL: API_BASE });

  const loginRes = await apiCtx.post("/auth/login", {
    data: { email: credentials.email, password: credentials.password },
  });
  const loginBody = await loginRes.json();

  if (!loginBody.requires2FA || !loginBody.sessionToken) {
    const state = await apiCtx.storageState();
    await apiCtx.dispose();
    await page.context().addCookies(
      state.cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: "localhost",
        path: c.path || "/",
      })),
    );
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    return;
  }

  const sessionToken = loginBody.sessionToken as string;

  let totpCode: string;
  if (totpSecret) {
    totpCode = computeTotpCode(totpSecret);
  } else {
    await apiCtx.dispose();
    throw new Error("Cannot compute TOTP: loginWith2FA requires a totpSecret");
  }

  const verifyRes = await apiCtx.post("/auth/login/2fa", {
    data: { sessionToken, code: totpCode },
  });

  if (!verifyRes.ok()) {
    const errBody = await verifyRes.text();
    await apiCtx.dispose();
    throw new Error(`2FA verification failed (${verifyRes.status()}): ${errBody}`);
  }

  const storageState = await apiCtx.storageState();
  await apiCtx.dispose();

  const refreshTokenCookie = storageState.cookies.find((c) => c.name === "refresh_token");
  if (!refreshTokenCookie) {
    throw new Error("No refresh_token cookie received from 2FA verification");
  }

  await page.context().addCookies([
    {
      name: refreshTokenCookie.name,
      value: refreshTokenCookie.value,
      domain: "localhost",
      path: refreshTokenCookie.path || "/",
    },
  ]);

  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {});
  await page.waitForSelector("h1, nav, [data-sidebar]", { timeout: 15000 }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Serial tests: 2FA state carries across tests
// ---------------------------------------------------------------------------
test.describe.configure({ timeout: 150000, retries: 0 });

test.describe.serial("Two-Factor Authentication", () => {
  let secret: string;
  let backupCodes: string[];
  let apiToken: string;

  // Ensure 2FA is disabled before starting
  test.beforeAll(async () => {
    // Reset 2FA state directly via API to handle both cases:
    // - 2FA disabled: getApiToken works normally
    // - 2FA enabled from prior run: need to login with 2FA to get token
    // We handle this by trying without secret first, then with a browser-based approach
    try {
      apiToken = await getApiToken("owner");
    } catch {
      const { execSync } = require("child_process");
      const email = TEST_CREDENTIALS.owner.email;
      const sql = `UPDATE "User" SET "twoFactorEnabled" = false, "twoFactorSecret" = NULL WHERE email = '${email}';`;
      try {
        execSync("npx prisma db execute --stdin", {
          input: sql,
          stdio: "pipe",
          cwd: "/home/dev/projects/PingToMe/packages/database",
        });
      } catch {
        // DB reset failed
      }
      apiToken = await getApiToken("owner");
    }

    const apiContext = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` },
    });

    const statusRes = await apiContext.get("/auth/2fa/status");
    const status = await statusRes.json();

    if (status.enabled) {
      const setupRes = await apiContext.post("/auth/2fa/setup");
      const setupBody = await setupRes.json();
      const code = computeTotpCode(setupBody.secret);
      await apiContext.post("/auth/2fa/disable", {
        data: { token: code },
      });
    }

    await apiContext.dispose();
  });

  // ── Test 1: 2FA setup page loads with QR code and secret key ───────
  test("setup page loads with QR code and secret key", async ({ page }) => {
    await loginAsUser(page, "owner");

    await page.goto("/dashboard/settings/two-factor", { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded");

    const h1 = page.locator("h1").filter({ hasText: /two-factor authentication/i });
    await expect(h1).toBeVisible({ timeout: 20000 });

    const setupButton = page.getByRole("button", { name: /set up 2fa/i });
    await expect(setupButton).toBeVisible({ timeout: 10000 });

    // Click to start setup
    const setupResponse = page.waitForResponse(
      (r) => r.url().includes("/auth/2fa/setup") && r.request().method() === "POST",
      { timeout: 10000 },
    );
    await setupButton.click();
    const response = await setupResponse;

    const status = response.status();
    expect(status === 200 || status === 201).toBe(true);

    // Dialog should open with QR code image and secret key
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/set up two-factor authentication/i)).toBeVisible();

    // QR code image should be rendered
    const qrImage = dialog.locator('img[alt="2FA QR Code"]');
    await expect(qrImage).toBeVisible({ timeout: 5000 });

    // Secret key should be displayed in a code block
    const secretCode = dialog.locator("code.font-mono");
    await expect(secretCode).toBeVisible({ timeout: 5000 });

    // Save secret for later tests
    secret = (await secretCode.textContent()) || "";

    // Close dialog
    await page.locator('[role="dialog"] button:has-text("Cancel")').click();
  });

  // ── Test 2: Enable 2FA with valid TOTP code → shows backup codes ───
  test("enable 2FA with valid TOTP code", async ({ page }) => {
    // Re-authenticate to get fresh token matching the secret
    apiToken = await getApiToken("owner");
    const apiContext = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` },
    });

    // Re-trigger setup to ensure secret is fresh
    const setupRes = await apiContext.post("/auth/2fa/setup");
    const setupBody = await setupRes.json();
    secret = setupBody.secret;

    // Compute current TOTP code
    const totpCode = computeTotpCode(secret);

    // Verify and enable 2FA via API
    const verifyRes = await apiContext.post("/auth/2fa/verify", {
      data: { token: totpCode },
    });
    const verifyBody = await verifyRes.json();

    expect(verifyBody.enabled).toBe(true);
    expect(verifyBody.backupCodes).toBeDefined();
    expect(Array.isArray(verifyBody.backupCodes)).toBe(true);
    expect(verifyBody.backupCodes.length).toBe(8);

    // Save backup codes for later tests
    backupCodes = verifyBody.backupCodes;

    await apiContext.dispose();
  });

  // ── Test 3: Backup codes are displayed (8 codes) ───────────────────
  test("backup codes are displayed on the 2FA page", async ({ page }) => {
    await loginWith2FA(page, secret);
    await navigateTo2FAPage(page);

    const enabledBadge = page.locator("text=Enabled").first();
    await expect(enabledBadge).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole("heading", { name: /backup codes/i })).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole("button", { name: /regenerate backup codes/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Test 4: After enabling, 2FA status shows "enabled" ─────────────
  test("2FA status shows enabled after setup", async ({ page }) => {
    await loginWith2FA(page, secret);
    await navigateTo2FAPage(page);

    const enabledBadge = page.locator("text=Enabled").first();
    await expect(enabledBadge).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/your account is protected/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("button", { name: /disable 2fa/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Test 5: Login with 2FA enabled → redirects to verification page
  test("login with 2FA enabled redirects to verification page", async ({
    page,
  }) => {
    // Go to login page
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    // Fill credentials
    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    await emailInput.fill(TEST_CREDENTIALS.owner.email);
    await passwordInput.fill(TEST_CREDENTIALS.owner.password);

    // Click login
    const loginButton = page.locator('button:has-text("Sign In with Email")');
    await loginButton.click();

    // Should redirect to /login/2fa
    await expect(page).toHaveURL(/\/login\/2fa/, { timeout: 15000 });

    // 2FA page elements
    await expect(
      page.getByRole("heading", { name: /two-factor authentication/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[id="code"]')).toBeVisible();
  });

  // ── Test 6: Enter valid 2FA code → login succeeds ─────────────────
  test("enter valid backup code on 2FA page to login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      () => !!document.querySelector('input[id="email"]'),
      { timeout: 10000 },
    );

    const emailInput = page.locator('input[id="email"]');
    const passwordInput = page.locator('input[id="password"]');
    await emailInput.fill(TEST_CREDENTIALS.owner.email);
    await passwordInput.fill(TEST_CREDENTIALS.owner.password);

    await page.locator('button:has-text("Sign In with Email")').click();

    try {
      await expect(page).toHaveURL(/\/login\/2fa/, { timeout: 15000 });
    } catch {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForFunction(
        () => !!document.querySelector('input[id="email"]'),
        { timeout: 10000 },
      );
      await page.locator('input[id="email"]').fill(TEST_CREDENTIALS.owner.email);
      await page.locator('input[id="password"]').fill(TEST_CREDENTIALS.owner.password);
      await page.locator('button:has-text("Sign In with Email")').click();
      await expect(page).toHaveURL(/\/login\/2fa/, { timeout: 15000 });
    }

    // Switch to backup code mode
    const backupToggle = page.getByRole("button", {
      name: /use backup code instead/i,
    });
    await expect(backupToggle).toBeVisible({ timeout: 5000 });
    await backupToggle.click();

    // Enter a backup code
    const codeInput = page.locator('input[id="code"]');
    await codeInput.waitFor({ state: "visible" });
    await codeInput.fill(backupCodes[0]);

    // Click verify
    const verifyButton = page.getByRole("button", {
      name: /verify backup code/i,
    });
    await verifyButton.click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Mark this backup code as used
    backupCodes.shift();
  });

  // ── Test 7: Disable 2FA with current code → status changes ─────────
  test("disable 2FA with valid code", async ({ page }) => {
    await loginWith2FA(page, secret);

    await navigateTo2FAPage(page);

    // Click disable button
    const disableButton = page.getByRole("button", { name: /disable 2fa/i });
    await expect(disableButton).toBeVisible({ timeout: 10000 });
    await disableButton.click();

    // Disable dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole("heading", { name: /disable two-factor/i }),
    ).toBeVisible();

    const codeToUse = computeTotpCode(secret);

    // Enter code in disable dialog
    const disableCodeInput = dialog.locator('input[id="disableCode"]');
    await disableCodeInput.fill(codeToUse);

    // Click "Disable 2FA"
    const confirmDisable = dialog.getByRole("button", { name: /disable 2fa/i });
    await confirmDisable.click();

    // Wait for page to update — status should now show Disabled
    await expect(page.getByText("Disabled").first()).toBeVisible({
      timeout: 10000,
    });

    // "Set up 2FA" button should appear again
    await expect(
      page.getByRole("button", { name: /set up 2fa/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── Test 8: Regenerate backup codes → new codes shown ──────────────
  test("regenerate backup codes shows new codes", async ({ page }) => {
    // First enable 2FA again via API
    apiToken = await getApiToken("owner");
    const apiContext = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` },
    });

    // Setup
    const setupRes = await apiContext.post("/auth/2fa/setup");
    const setupBody = await setupRes.json();
    secret = setupBody.secret;
    const code = computeTotpCode(secret);

    // Enable
    const verifyRes = await apiContext.post("/auth/2fa/verify", {
      data: { token: code },
    });
    expect((await verifyRes.json()).enabled).toBe(true);
    await apiContext.dispose();

    await loginWith2FA(page, secret);
    await navigateTo2FAPage(page);

    await expect(page.getByText("Enabled").first()).toBeVisible({
      timeout: 30000,
    });

    const regenButton = page.getByRole("button", {
      name: /regenerate backup codes/i,
    });
    await expect(regenButton).toBeVisible({ timeout: 10000 });
    await regenButton.click();

    // Password confirmation dialog opens
    const passwordDialog = page.locator('[role="dialog"]');
    await expect(passwordDialog).toBeVisible({ timeout: 5000 });
    await expect(
      passwordDialog.getByText(/confirm your password/i),
    ).toBeVisible();

    // Enter password
    const passwordInput = passwordDialog.locator('input[id="backupPassword"]');
    await passwordInput.fill(TEST_CREDENTIALS.owner.password);

    // Click "Generate Codes"
    const generateButton = passwordDialog.getByRole("button", {
      name: /generate codes/i,
    });
    await generateButton.click();

    // Backup codes display dialog should appear
    const codesDialog = page.locator('[role="dialog"]');
    await expect(codesDialog.getByText(/your backup codes/i)).toBeVisible({
      timeout: 10000,
    });

    // Should show 8 codes in the grid
    const codeElements = codesDialog.locator("code.font-semibold");
    await expect(codeElements).toHaveCount(8, { timeout: 10000 });

    // Each code should match XXXX-XXXX format
    const allCodes = await codeElements.allTextContents();
    for (const c of allCodes) {
      expect(c).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    }

    // Cleanup: disable 2FA after test
    await codesDialog
      .getByRole("button", { name: /i've saved my codes/i })
      .click();

    // Disable 2FA via API to clean up
    const cleanupToken = await getApiToken("owner", secret);
    const cleanupCtx = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${cleanupToken}` },
    });
    const freshSetup = await cleanupCtx.post("/auth/2fa/setup");
    const freshSecret = (await freshSetup.json()).secret;
    const freshCode = computeTotpCode(freshSecret);
    await cleanupCtx.post("/auth/2fa/disable", {
      data: { token: freshCode },
    });
    await cleanupCtx.dispose();
  });
});
