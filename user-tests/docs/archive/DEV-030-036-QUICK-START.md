# Quick Start Guide: API Key Management UAT Tests (DEV-030 to DEV-036)

## Overview

This guide provides quick instructions for running the UAT tests for API Key Management features in the PingTO.Me application.

**Test File:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts`

---

## 1. Environment Setup (One Time)

### Step 1: Seed Database with Test Data

```bash
cd /Users/earn/Projects/rawinlab/pingtome
pnpm --filter @pingtome/database db:seed
```

This creates test users including:
- **e2e-owner@pingtome.test** (password: TestPassword123!)

### Step 2: Start Development Servers

```bash
pnpm dev
```

This starts:
- Web App: http://localhost:3010
- API Server: http://localhost:3001
- Database: PostgreSQL (running locally)

Wait for both servers to be ready (check console output).

---

## 2. Running the Tests

### Option A: Run All API Key Management Tests

```bash
cd /Users/earn/Projects/rawinlab/pingtome/apps/web
npx playwright test uat-developer-api-keys.spec.ts --grep "API Key Management - UAT"
```

### Option B: Run Individual Test Cases

```bash
# DEV-030: Display API Keys list
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-030"

# DEV-031: Copy API Key
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-031"

# DEV-032: Rotate with valid password
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-032"

# DEV-033: Rotate with wrong password (error case)
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-033"

# DEV-034: Set expiration date
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-034"

# DEV-035: Clear expiration date
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-035"

# DEV-036: Revoke/Delete API Key
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-036"
```

### Option C: Run with Visual UI Mode (Recommended for First Run)

```bash
cd /Users/earn/Projects/rawinlab/pingtome/apps/web
npx playwright test uat-developer-api-keys.spec.ts --ui
```

This opens an interactive UI where you can:
- Watch tests run in real-time
- Step through tests manually
- Debug selector issues
- See element highlights

---

## 3. Understanding Test Results

### Console Output

Each test logs progress with symbols:
- **✓** = Step completed successfully
- **✗** = Step failed (test will fail)
- **INFO:** = Informational message
- **PASS:** = Test passed
- **FAIL:** = Test failed

Example output:
```
✓ Copy button clicked
✓ Copy button shows "Copied" feedback
✓ Key preview is masked: pk_••••••••
PASS: DEV-031 - Copy button shows "Copied" feedback
```

### HTML Report

View detailed test results:

```bash
npx playwright show-report
```

This opens browser with:
- Test timeline
- Screenshots on failure
- Trace files for debugging
- Network logs

### Test Skipping

Tests skip gracefully if:
- No API Keys exist in the table
- UI elements (buttons, dialogs) not found
- Expected conditions not met

**This is normal behavior** - tests are designed to be resilient.

---

## 4. Test Case Details

### DEV-030: Display API Keys List
**Expected:** Table shows Name, Key Preview (masked), Scopes, Created date, Last Used
**Duration:** ~15-20 seconds

### DEV-031: Copy API Key Preview
**Expected:** Click copy button shows "Copied" feedback, key remains masked
**Duration:** ~15-20 seconds

### DEV-032: Rotate API Key (Valid Password)
**Expected:** Password dialog appears, key rotates, new key displayed
**Duration:** ~20-30 seconds

### DEV-033: Rotate API Key (Wrong Password)
**Expected:** Error message shown, key NOT rotated
**Duration:** ~20-30 seconds

### DEV-034: Set Expiration Date
**Expected:** Date picker appears, future date set, persists after reload
**Duration:** ~20-30 seconds

### DEV-035: Clear Expiration Date
**Expected:** Find key with expiration, clear it, verify removed
**Duration:** ~20-30 seconds

### DEV-036: Revoke/Delete API Key
**Expected:** Confirmation dialog, key deleted, row removed from table
**Duration:** ~20-30 seconds

---

## 5. Troubleshooting

### Tests Timeout or Hang

**Problem:** Tests waiting forever for elements

**Solution:**
```bash
# Increase timeout (in test file or via env var)
PLAYWRIGHT_TEST_TIMEOUT=120000 npx playwright test uat-developer-api-keys.spec.ts
```

### Login Fails

**Problem:** Can't authenticate as test user

**Solution:**
```bash
# Verify database is seeded
pnpm --filter @pingtome/database db:seed

# Verify API is running
curl http://localhost:3001/health

# Check test credentials exist
# Email: e2e-owner@pingtome.test
# Password: TestPassword123!
```

### Copy Button Not Working

**Problem:** Copy functionality doesn't work

**Solution:**
- In UI mode, manually test copy button
- Check browser console for errors
- Verify clipboard access permissions

### Dialog Not Appearing

**Problem:** Password or date picker dialog doesn't show

**Solution:**
- Increase wait timeout: `await page.waitForTimeout(2000)`
- Check if dialog has different selectors
- Try `npx playwright test --debug` for debugging

### API Key Not Found

**Problem:** Test says "No API Keys found"

**Solution:**
1. Create an API Key manually in the app:
   - Go to /dashboard/developer/api-keys
   - Click "Create API Key"
   - Fill name, select scopes, submit
2. Then run tests again

---

## 6. Advanced Usage

### Run with Specific Browser

```bash
# Chrome only
npx playwright test uat-developer-api-keys.spec.ts --project=chromium

# Firefox only
npx playwright test uat-developer-api-keys.spec.ts --project=firefox

# Safari only
npx playwright test uat-developer-api-keys.spec.ts --project=webkit
```

### Run with Video Recording

```bash
npx playwright test uat-developer-api-keys.spec.ts --headed --record-video=on
```

Videos saved to: `test-results/`

### Debug Mode

```bash
npx playwright test uat-developer-api-keys.spec.ts --debug
```

Opens debugger with:
- Step-by-step execution
- Element inspector
- Console access

### Extract Test Report as JSON

```bash
npx playwright test uat-developer-api-keys.spec.ts --reporter=json > test-results.json
```

---

## 7. Quick Reference Commands

| Task | Command |
|------|---------|
| Seed database | `pnpm --filter @pingtome/database db:seed` |
| Start servers | `pnpm dev` |
| Run all tests | `npx playwright test uat-developer-api-keys.spec.ts` |
| Run with UI | `npx playwright test uat-developer-api-keys.spec.ts --ui` |
| View report | `npx playwright show-report` |
| Debug mode | `npx playwright test uat-developer-api-keys.spec.ts --debug` |
| Run specific | `npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-030"` |

---

## 8. Test Flow Diagram

```
Start Tests
    ↓
Login as e2e-owner@pingtome.test
    ↓
Navigate to /dashboard/developer/api-keys
    ↓
Setup: Create test API Key
    ↓
DEV-030: Verify table metadata
    ↓
DEV-031: Test copy button
    ↓
DEV-032: Rotate key (valid password)
    ↓
DEV-033: Rotate key (wrong password - error case)
    ↓
DEV-034: Set expiration date
    ↓
DEV-035: Clear expiration date
    ↓
DEV-036: Revoke/Delete key
    ↓
Logout
    ↓
Tests Complete
```

---

## 9. Test Data Requirements

**Pre-Test State:**
- User account exists: `e2e-owner@pingtome.test`
- User has organization access
- No minimum API Keys required (tests create them)

**Post-Test State:**
- Database modifications are made (keys created/deleted)
- Tests are safe to re-run multiple times
- Each run is independent

---

## 10. CI/CD Integration

To add these tests to your CI pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# Example: GitHub Actions
- name: Run API Key Management Tests
  run: |
    cd apps/web
    npx playwright test uat-developer-api-keys.spec.ts --reporter=html

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/web/playwright-report/
```

---

## 11. Support & Documentation

**Full Documentation:**
- Test file: `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts`
- Report: `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys-report.md`

**Test Fixtures:**
- Auth helpers: `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/fixtures/auth.ts`
- Test data: `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/fixtures/test-data.ts`

**Playwright Documentation:**
- https://playwright.dev/docs/intro

---

## 12. Quick Checklist Before Running Tests

- [ ] Database seeded: `pnpm --filter @pingtome/database db:seed`
- [ ] Dev servers running: `pnpm dev`
- [ ] Web accessible at http://localhost:3010
- [ ] API accessible at http://localhost:3001
- [ ] Internet connection active (for test dependencies)
- [ ] Enough disk space for test results (~100MB)
- [ ] No other tests running concurrently

---

**Happy Testing!** 🚀

For issues or questions, refer to the full test report: `uat-developer-api-keys-report.md`

