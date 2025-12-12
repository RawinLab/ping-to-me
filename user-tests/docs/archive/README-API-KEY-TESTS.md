# API Key Management UAT Tests (DEV-030 to DEV-036)

## Quick Links

Start here based on your role:

| Role | Start Here |
|------|-----------|
| **Test Executor** | [Quick Start Guide](./DEV-030-036-QUICK-START.md) |
| **QA Lead** | [Test Summary](./DEV-030-036-SUMMARY.md) |
| **Test Developer** | [Test Structure](./TEST-STRUCTURE.md) |
| **Documentation** | [Test Report](./uat-developer-api-keys-report.md) |
| **Code Review** | [Test File](./uat-developer-api-keys.spec.ts) |

---

## Overview

This directory contains comprehensive UAT tests for the API Key Management feature in PingTO.Me.

**Test Coverage:**
- DEV-030: Display API Keys list with metadata
- DEV-031: Copy API Key Preview to clipboard
- DEV-032: Rotate API Key with valid password
- DEV-033: Rotate API Key with wrong password (error case)
- DEV-034: Set expiration date for API Key
- DEV-035: Clear expiration date for API Key
- DEV-036: Revoke/Delete API Key

---

## Files in This Suite

### Test Implementation
- **`uat-developer-api-keys.spec.ts`** (25 KB, 678 lines)
  - Main test file with all test cases
  - Uses Playwright framework
  - TypeScript with full type safety
  - Two test suites: existing DEV tests + new UAT tests

### Documentation
- **`DEV-030-036-SUMMARY.md`** - Executive summary and overview
- **`DEV-030-036-QUICK-START.md`** - Step-by-step execution guide
- **`uat-developer-api-keys-report.md`** - Detailed test specifications
- **`TEST-STRUCTURE.md`** - Architecture and implementation details
- **`README-API-KEY-TESTS.md`** - This file (index)

### Test Fixtures & Utilities
- **`fixtures/auth.ts`** - Authentication helper functions
- **`fixtures/test-data.ts`** - Test constants and data

---

## Quick Start (TL;DR)

### 1. Setup (5 minutes)
```bash
cd /Users/earn/Projects/rawinlab/pingtome

# Seed test database
pnpm --filter @pingtome/database db:seed

# Start development servers
pnpm dev
# Waits for servers to start
```

### 2. Run Tests (4 minutes)
```bash
cd apps/web

# Run all API Key Management tests
npx playwright test uat-developer-api-keys.spec.ts --grep "API Key Management - UAT"

# OR: Interactive UI mode (best for first run)
npx playwright test uat-developer-api-keys.spec.ts --ui
```

### 3. View Results
```bash
# Open HTML report
npx playwright show-report
```

---

## Test Execution Commands

### All Tests
```bash
npx playwright test uat-developer-api-keys.spec.ts --grep "API Key Management"
```

### Individual Tests
```bash
# Display API Keys list
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-030"

# Copy API Key
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-031"

# Rotate API Key (valid)
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-032"

# Rotate API Key (invalid - error case)
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-033"

# Set expiration date
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-034"

# Clear expiration date
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-035"

# Revoke/Delete API Key
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-036"
```

### With Options
```bash
# Interactive UI mode (great for debugging)
npx playwright test uat-developer-api-keys.spec.ts --ui

# Debug mode (step-by-step execution)
npx playwright test uat-developer-api-keys.spec.ts --debug

# Headed mode (see browser window)
npx playwright test uat-developer-api-keys.spec.ts --headed

# Specific browser
npx playwright test uat-developer-api-keys.spec.ts --project=chromium

# With video recording
npx playwright test uat-developer-api-keys.spec.ts --record-video=on

# Verbose output
npx playwright test uat-developer-api-keys.spec.ts -v

# View results
npx playwright show-report
```

---

## Test User Credentials

```
Email: e2e-owner@pingtome.test
Password: TestPassword123!
Role: Organization Owner
```

---

## Environment

- **Web:** http://localhost:3010
- **API:** http://localhost:3001
- **Database:** PostgreSQL (local)
- **Framework:** Playwright (Browser Automation)
- **Language:** TypeScript

---

## Test Status

| Test Case | Status | Duration |
|-----------|--------|----------|
| DEV-030 | Ready | 15-20s |
| DEV-031 | Ready | 15-20s |
| DEV-032 | Ready | 20-30s |
| DEV-033 | Ready | 20-30s |
| DEV-034 | Ready | 20-30s |
| DEV-035 | Ready | 20-30s |
| DEV-036 | Ready | 20-30s |
| **Total** | **Ready** | **3-4 min** |

---

## Document Guide

### For Test Execution
1. Read **DEV-030-036-QUICK-START.md** first
2. Follow the step-by-step instructions
3. Run the provided commands
4. Review results in HTML report

### For Understanding Tests
1. Start with **DEV-030-036-SUMMARY.md**
2. Review **uat-developer-api-keys-report.md** for details
3. Check **TEST-STRUCTURE.md** for architecture

### For Code Review
1. Read **TEST-STRUCTURE.md** for context
2. Review **uat-developer-api-keys.spec.ts** (the actual tests)
3. Check comments in code for specific implementation details

### For Troubleshooting
1. Check **DEV-030-036-QUICK-START.md** troubleshooting section
2. Review test console output for error messages
3. Run in UI mode (`--ui`) to debug visually
4. Check browser console for JavaScript errors

---

## File Manifest

```
apps/web/e2e/
├── uat-developer-api-keys.spec.ts              Main test file
├── uat-developer-api-keys-report.md            Detailed report
├── DEV-030-036-QUICK-START.md                  Execution guide
├── DEV-030-036-SUMMARY.md                      Executive summary
├── TEST-STRUCTURE.md                           Architecture
├── README-API-KEY-TESTS.md                     This file
│
├── fixtures/
│   ├── auth.ts                                 Auth utilities
│   └── test-data.ts                            Test data
│
└── playwright.config.ts                        Configuration
```

---

## Quick Reference

### Prerequisites
- Node.js 20+
- pnpm package manager
- PostgreSQL (local instance)
- 5GB free disk space

### Time Requirements
- Setup: 5 minutes (first time only)
- Test Run: 4 minutes
- Total: 9 minutes

### Resources Required
- Memory: 300MB
- CPU: 1 core
- Disk: 100MB for reports
- Network: Local only

---

## Troubleshooting

### Tests Won't Run?
1. Verify database is seeded: `pnpm --filter @pingtome/database db:seed`
2. Check servers are running: `pnpm dev`
3. Confirm ports are available: 3010 (web), 3001 (api), 5432 (db)

### Tests Timeout?
1. Check CPU/memory usage
2. Increase timeout: `PLAYWRIGHT_TEST_TIMEOUT=120000 npx playwright test ...`
3. Close other applications using ports

### UI Elements Not Found?
1. Run in UI mode to debug: `npx playwright test --ui`
2. Check element selectors in browser DevTools
3. Verify UI hasn't changed since test creation

### Password Errors?
1. Verify test password: `TestPassword123!`
2. Check password requirements haven't changed
3. Ensure user account exists in database

---

## Support

**Getting Started:**
- [Quick Start Guide](./DEV-030-036-QUICK-START.md)

**Understanding Tests:**
- [Test Summary](./DEV-030-036-SUMMARY.md)
- [Test Report](./uat-developer-api-keys-report.md)

**Technical Details:**
- [Test Structure](./TEST-STRUCTURE.md)
- [Test Implementation](./uat-developer-api-keys.spec.ts)

**Playwright Docs:**
- https://playwright.dev/docs/intro

---

## Version Info

- **Version:** 1.0
- **Created:** December 12, 2025
- **Status:** READY FOR TESTING
- **Total Tests:** 7 (1 setup + 6 feature tests)
- **Code Size:** 25 KB
- **Documentation:** 45 KB

---

**Ready to test? Start with [DEV-030-036-QUICK-START.md](./DEV-030-036-QUICK-START.md)**

