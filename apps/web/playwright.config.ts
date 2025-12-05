import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Default project uses mocked API
      testIgnore: ['**/dashboard-real.spec.ts'],
    },
    {
      name: 'real-db',
      use: { ...devices['Desktop Chrome'] },
      // Real database tests only
      testMatch: ['**/dashboard-real.spec.ts'],
      dependencies: [],
    },
  ],
  // Global setup for database seeding (only runs for real-db project)
  globalSetup: process.env.E2E_USE_REAL_DB === 'true' ? './e2e/global-setup.ts' : undefined,
});
