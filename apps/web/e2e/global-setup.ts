import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

/**
 * Global setup for E2E tests using real database
 *
 * This script runs before all tests and:
 * 1. Seeds the database with test data (if E2E_SEED_DB=true)
 * 2. Verifies database connection
 *
 * Run with seeding:
 *   E2E_SEED_DB=true npx playwright test
 *
 * Run without seeding (use existing data):
 *   npx playwright test
 */
async function globalSetup(config: FullConfig) {
  console.log("\n========================================");
  console.log("E2E Tests: Using Real Database");
  console.log("========================================\n");

  const shouldSeed = process.env.E2E_SEED_DB === "true";

  if (shouldSeed) {
    try {
      console.log("Seeding database with test data...");
      const rootDir = path.resolve(__dirname, "../../..");

      // Run database seed
      execSync("pnpm --filter @pingtome/database db:seed", {
        cwd: rootDir,
        stdio: "inherit",
        timeout: 60000, // 60 second timeout
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
    console.log("To seed before tests, run:");
    console.log("  E2E_SEED_DB=true npx playwright test\n");
  }

  // Verify test data exists
  console.log("Test Configuration:");
  console.log("- Base URL: " + config.projects[0]?.use?.baseURL || "http://localhost:3010");
  console.log("- Test Directory: ./e2e");
  console.log("- Tests will use real API calls\n");
}

export default globalSetup;
