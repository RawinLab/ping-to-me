import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Global setup for E2E tests using real database
 *
 * This script runs before all tests and:
 * 1. Seeds the database with test data
 * 2. Sets up any required environment
 *
 * To use real database tests, run with:
 *   npx playwright test --project=real-db
 */
async function globalSetup(config: FullConfig) {
  const useRealDb = process.env.E2E_USE_REAL_DB === 'true';

  if (useRealDb) {
    console.log('\n========================================');
    console.log('E2E Tests: Using Real Database');
    console.log('========================================\n');

    try {
      // Run database seed
      console.log('Seeding database with test data...');
      const rootDir = path.resolve(__dirname, '../../..');
      execSync('pnpm --filter @pingtome/database db:seed', {
        cwd: rootDir,
        stdio: 'inherit',
      });
      console.log('Database seeded successfully!\n');
    } catch (error) {
      console.error('Failed to seed database:', error);
      console.log('\nMake sure:');
      console.log('1. Database is running');
      console.log('2. DATABASE_URL is set correctly');
      console.log('3. Migrations are up to date\n');
      throw error;
    }
  } else {
    console.log('\n========================================');
    console.log('E2E Tests: Using Mocked API');
    console.log('========================================\n');
    console.log('To use real database, set E2E_USE_REAL_DB=true\n');
  }
}

export default globalSetup;
