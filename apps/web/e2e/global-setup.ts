import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

/**
 * Global setup for E2E tests using real database
 *
 * This script runs before all tests and:
 * 1. Disables rate limiting for test stability
 * 2. Seeds the database with test data (if E2E_SEED_DB=true)
 * 3. Verifies API and web server health
 * 4. Verifies test credentials work
 *
 * Run with seeding:
 *   E2E_SEED_DB=true npx playwright test
 *
 * Run without seeding (use existing data):
 *   npx playwright test
 */

const API_URL = process.env.API_URL || "http://localhost:3011";
const WEB_URL = process.env.WEB_URL || "http://localhost:3010";

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function globalSetup(config: FullConfig) {
  // Disable rate limiting for all E2E tests
  process.env.THROTTLE_DISABLED = "true";

  console.log("\n========================================");
  console.log("E2E Tests: Using Real Database");
  console.log("========================================\n");

  // Step 1: Seed database if requested
  const shouldSeed = process.env.E2E_SEED_DB === "true";

  if (shouldSeed) {
    try {
      console.log("📦 Seeding database with test data...");
      const rootDir = path.resolve(__dirname, "../../..");

      execSync("pnpm --filter @pingtome/database db:seed", {
        cwd: rootDir,
        stdio: "inherit",
        timeout: 60000,
      });

      console.log("✓ Database seeded successfully!\n");
    } catch (error) {
      console.error("✗ Failed to seed database:", error);
      console.log("\nTroubleshooting:");
      console.log("1. Make sure database is running");
      console.log("2. Check DATABASE_URL environment variable");
      console.log("3. Run migrations: pnpm --filter @pingtome/database db:migrate");
      console.log("4. Check seed file for errors\n");
      throw error;
    }
  } else {
    console.log("Skipping database seed (E2E_SEED_DB not set to true)");
    console.log("Using existing database data.\n");
  }

  // Step 2: Health check — API server
  console.log("🏥 Checking API health...");
  try {
    const apiRes = await fetchWithTimeout(`${API_URL}/health`);
    if (!apiRes.ok) {
      throw new Error(`API health check returned status ${apiRes.status}`);
    }
    const body = await apiRes.json().catch(() => null);
    console.log(`✓ API is healthy at ${API_URL} (status: ${apiRes.status})`);
    if (body) {
      console.log(`  Response: ${JSON.stringify(body).slice(0, 120)}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ API health check failed: ${msg}`);
    throw new Error(
      `API server not available at ${API_URL}/health.\n` +
        "Troubleshooting:\n" +
        "  1. Start dev servers: pnpm dev\n" +
        "  2. Check that the API is running on port 3011\n" +
        "  3. Verify the /health endpoint exists"
    );
  }

  // Step 3: Health check — Web app
  console.log("\n🌐 Checking web app...");
  try {
    const webRes = await fetchWithTimeout(WEB_URL);
    if (!webRes.ok) {
      throw new Error(`Web app returned status ${webRes.status}`);
    }
    console.log(`✓ Web app is accessible at ${WEB_URL} (status: ${webRes.status})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Web app check failed: ${msg}`);
    throw new Error(
      `Web app not accessible at ${WEB_URL}.\n` +
        "Troubleshooting:\n" +
        "  1. Start dev servers: pnpm dev\n" +
        "  2. Check that Next.js is running on port 3010"
    );
  }

  // Step 4: Verify test credentials
  console.log("\n🔑 Verifying test credentials...");
  try {
    const loginRes = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "e2e-owner@pingtome.test",
        password: "TestPassword123!",
      }),
    });

    if (!loginRes.ok) {
      const errorBody = await loginRes.text().catch(() => "unknown");
      throw new Error(`Login returned ${loginRes.status}: ${errorBody.slice(0, 200)}`);
    }

    const loginData = await loginRes.json().catch(() => null);
    if (loginData?.accessToken || loginData?.access_token || loginRes.status === 200 || loginRes.status === 201) {
      console.log("✓ Test login successful (e2e-owner@pingtome.test)");
    } else {
      console.log(`⚠ Login responded but response format unexpected: ${JSON.stringify(loginData).slice(0, 150)}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Test credential verification failed: ${msg}`);
    throw new Error(
      `Cannot login with test credentials at ${API_URL}/auth/login.\n` +
        "Troubleshooting:\n" +
        "  1. Seed the database: pnpm --filter @pingtome/database db:seed\n" +
        "  2. Or run: E2E_SEED_DB=true npx playwright test\n" +
        "  3. Verify seed creates e2e-owner@pingtome.test user"
    );
  }

  // Summary
  console.log("\n========================================");
  console.log("✓ All pre-flight checks passed!");
  console.log("========================================");
  console.log("Test Configuration:");
  console.log(`  - API: ${API_URL}`);
  console.log(`  - Web: ${WEB_URL}`);
  console.log("  - Rate limiting: DISABLED");
  console.log("- Tests will use real API calls\n");
}

export default globalSetup;
