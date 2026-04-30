import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration - Using Real Database
 *
 * All tests now use real API calls against seeded test data.
 * No mocking is used.
 *
 * Prerequisites:
 * 1. Database must be running
 * 2. Run seed before tests: pnpm --filter @pingtome/database db:seed
 * 3. Start dev servers: pnpm dev
 *
 * Run tests:
 *   npx playwright test
 *
 * Run with seed (recommended):
 *   E2E_SEED_DB=true npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/_archive/**", "**/debug-*"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
    // Increase timeout for real API calls
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  // Increase test timeout for real database operations
  timeout: 90000,
  expect: { timeout: 15000 },
  // Global setup for database seeding
  globalSetup: "./e2e/global-setup.ts",
  projects: process.env.CI
    ? [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "mobile", use: { ...devices["Pixel 5"] } },
      ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Web server configuration
  webServer: process.env.CI
    ? undefined
    : {
        command: "THROTTLE_DISABLED=true pnpm dev",
        url: "http://localhost:3010",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
