# UAT Test Report: API Key Management (DEV-030 to DEV-036)

**Test Date:** December 12, 2025
**Test Environment:** Development
**Test User:** e2e-owner@pingtome.test
**Tester:** E2E Test Suite (Playwright)

---

## Test Summary

| Test Case | Expected | Status | Notes |
|-----------|----------|--------|-------|
| DEV-030 | Display API Keys list with metadata | READY | Validates all columns visible |
| DEV-031 | Copy API Key Preview to clipboard | READY | Validates copy button & masked key |
| DEV-032 | Rotate API Key with valid password | READY | Validates rotation flow & confirmation |
| DEV-033 | Rotate API Key with wrong password | READY | Validates error handling |
| DEV-034 | Set expiration date for API Key | READY | Validates date picker & persistence |
| DEV-035 | Clear expiration date for API Key | READY | Validates clearing expiration |
| DEV-036 | Revoke/Delete API Key | READY | Validates deletion confirmation |

---

## Detailed Test Cases

### DEV-030: Display API Keys List with All Metadata

**Objective:** Verify that the API Keys table displays all required metadata columns

**Test Steps:**
1. Login to http://localhost:3010 as e2e-owner@pingtome.test
2. Navigate to `/dashboard/developer/api-keys`
3. Wait for API Keys table to load
4. Verify table contains columns with data

**Expected Results:**
- ✅ API Keys table is visible
- ✅ Name column displays API Key name
- ✅ Key Preview column displays masked key (pk_••••••••)
- ✅ Scopes column displays permission scopes (shows first 3 + "+N more" if applicable)
- ✅ Created column displays creation date
- ✅ Last Used column displays last usage (if applicable)

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 177-222

---

### DEV-031: Copy API Key Preview to Clipboard

**Objective:** Verify that clicking the copy button copies the masked API key preview to clipboard with visual feedback

**Test Steps:**
1. Login and navigate to API Keys page
2. Locate the first API Key in the table
3. Click the Copy button on the Key Preview column
4. Observe feedback message

**Expected Results:**
- ✅ Copy button is visible and clickable
- ✅ Clicking copy shows "Copied" feedback message
- ✅ Key preview is masked (pk_••••••••), not full key
- ✅ No security risk - full key is never exposed

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 224-273

---

### DEV-032: Rotate API Key with Valid Password

**Objective:** Verify that API Key rotation flow works correctly with password confirmation

**Test Steps:**
1. Login and navigate to API Keys page
2. Click menu (⋮) button on an API Key row
3. Select "Rotate" option
4. Fill password field with: `TestPassword123!`
5. Click "Rotate Key" button
6. Verify new key is generated and displayed

**Expected Results:**
- ✅ Menu dropdown appears with "Rotate" option
- ✅ Password confirmation dialog appears
- ✅ Password field accepts input
- ✅ "Rotate Key" button submits the form
- ✅ New API Key is generated and displayed in highlighted box
- ✅ Old key becomes invalid immediately
- ✅ Success message appears (or key display confirms completion)

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 275-350

---

### DEV-033: Rotate API Key with Wrong Password - Error Handling

**Objective:** Verify that wrong password prevents API Key rotation and shows clear error message

**Test Steps:**
1. Login and navigate to API Keys page
2. Click menu (⋮) button on an API Key row
3. Select "Rotate" option
4. Fill password field with: `WrongPassword123!`
5. Click "Rotate Key" button
6. Observe error message

**Expected Results:**
- ✅ Password confirmation dialog appears
- ✅ Wrong password is entered (WrongPassword123!)
- ✅ Form is submitted
- ✅ Error message appears: "Invalid password" or similar
- ✅ API Key is NOT rotated
- ✅ Key remains unchanged in the table

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 352-423

---

### DEV-034: Set Expiration Date for API Key

**Objective:** Verify that API Key expiration date can be set and persists

**Test Steps:**
1. Login and navigate to API Keys page
2. Click menu (⋮) button on an API Key row
3. Select "Set Expiration" option
4. Date picker appears - select date 7 days from today
5. Click "Save" button
6. Verify expiration date appears in table

**Expected Results:**
- ✅ Menu dropdown appears with "Set Expiration" option
- ✅ Date picker dialog/input appears
- ✅ Future date (7 days ahead) can be selected
- ✅ "Save" button confirms the change
- ✅ Expiration date appears in the table
- ✅ If approaching expiration (<7 days), "Expiring Soon" badge shows
- ✅ Changes persist after page reload

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 425-497

---

### DEV-035: Clear Expiration Date for API Key

**Objective:** Verify that API Key expiration date can be removed/cleared

**Test Steps:**
1. Login and navigate to API Keys page
2. Find an API Key with expiration set
3. Click menu (⋮) button on that row
4. Select "Set Expiration" option
5. Select "Never expires" option or clear the date
6. Click "Save" button
7. Verify expiration date is removed from table

**Expected Results:**
- ✅ Menu dropdown appears with "Set Expiration" option
- ✅ Date picker dialog shows current expiration
- ✅ "Never expires" option is available
- ✅ Selecting "Never expires" clears the date
- ✅ "Save" button confirms the change
- ✅ Expiration date is removed from table display
- ✅ Key can be used indefinitely going forward

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 499-583

---

### DEV-036: Revoke/Delete API Key

**Objective:** Verify that API Key revocation/deletion removes the key permanently from the list and invalidates it

**Test Steps:**
1. Login and navigate to API Keys page
2. Click menu (⋮) button on an API Key row
3. Select "Revoke" or "Delete" option
4. Confirmation dialog appears
5. Click "Confirm" button to confirm deletion
6. Reload page and verify key is gone

**Expected Results:**
- ✅ Menu dropdown appears with "Revoke" or "Delete" option
- ✅ Confirmation dialog appears asking to confirm deletion
- ✅ Confirmation button triggers deletion
- ✅ API Key is removed from the table
- ✅ Row count decreases
- ✅ Key is not accessible in table after reload
- ✅ API calls using this key become invalid

**Status:** READY FOR TESTING

**Test Implementation:** `/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts` - Line 585-678

---

## Running the Tests

### Prerequisites

1. **Database Setup:**
   ```bash
   pnpm --filter @pingtome/database db:seed
   ```

2. **Start Development Servers:**
   ```bash
   pnpm dev
   ```
   This starts:
   - Web: http://localhost:3010
   - API: http://localhost:3001

### Running All UAT Tests

```bash
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-030|DEV-031|DEV-032|DEV-033|DEV-034|DEV-035|DEV-036"
```

### Running Individual Tests

```bash
# DEV-030: Display API Keys
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-030"

# DEV-031: Copy API Key
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-031"

# DEV-032: Rotate with valid password
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-032"

# DEV-033: Rotate with wrong password
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-033"

# DEV-034: Set expiration
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-034"

# DEV-035: Clear expiration
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-035"

# DEV-036: Revoke/Delete
npx playwright test uat-developer-api-keys.spec.ts --grep "DEV-036"
```

### Running with UI Mode (Visual Testing)

```bash
npx playwright test uat-developer-api-keys.spec.ts --ui
```

### Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

---

## Test Environment Details

**Test User Credentials:**
- Email: `e2e-owner@pingtome.test`
- Password: `TestPassword123!`
- Role: Organization Owner

**Web URL:** http://localhost:3010
**API URL:** http://localhost:3001
**Database:** PostgreSQL (seeded with test data)

---

## Known Limitations

1. **Test Skip Conditions:**
   - Tests will skip if no API Keys exist in the table (setup test must run first)
   - Copy button test skips if copy button element not found
   - Rotation tests skip if rotate menu option not available
   - Expiration tests skip if date picker not accessible

2. **Timing Considerations:**
   - Tests include appropriate waits for network requests and UI updates
   - Default timeout for most operations: 10 seconds
   - Network idle wait ensures data is fully loaded

3. **Selector Flexibility:**
   - Tests use multiple selector strategies to locate buttons/dialogs
   - Fallback selectors for different naming conventions
   - Handles both dialog-based and direct action flows

---

## Test Data

**API Key Setup:**
- Pre-requisite test creates an API Key with name: `UAT Test Key {timestamp}`
- Scopes selected: First 2 available scopes
- This key is used for DEV-030 through DEV-036 tests

---

## Troubleshooting

### Test Fails on Login

**Solution:** Ensure database is seeded and API server is running:
```bash
pnpm --filter @pingtome/database db:seed
pnpm dev
```

### Copy Button Not Found

**Solution:** Check if the UI implementation uses different button attributes. Update selectors in test:
```typescript
const copyButton = firstRow.locator('button[data-action="copy"]'); // Example
```

### Expiration Date Not Persisting

**Solution:** Allow more time for API request to complete:
```typescript
await page.waitForTimeout(3000); // Increase from 2000
```

### Password Dialog Doesn't Appear

**Solution:** Check if password confirmation is required in this environment:
```bash
# Verify backend setting in .env
REQUIRE_PASSWORD_FOR_API_KEY_ROTATION=true
```

---

## Test Maintenance

**Update Schedule:** Quarterly review (or as features change)

**Areas to Monitor:**
- Button/menu element selectors (may change with UI updates)
- Dialog/modal structure (ensure accessibility roles are present)
- Error message text (verify consistent language)
- Password validation rules (ensure test password meets requirements)

---

## Sign-Off

| Role | Name | Date |
|------|------|------|
| Test Automation Engineer | E2E Suite | 2025-12-12 |
| Manual Verification (Optional) | TBD | TBD |
| QA Lead (Optional) | TBD | TBD |

---

## Appendix: Test File Information

**Test File Location:**
```
/Users/earn/Projects/rawinlab/pingtome/apps/web/e2e/uat-developer-api-keys.spec.ts
```

**Total Lines of Test Code:** ~680+ lines
**Number of Test Cases:** 7 (1 setup + 6 feature tests)
**Coverage:** 100% of DEV-030 through DEV-036 requirements

**Dependencies:**
- Playwright Testing Framework
- Auth Fixtures (`./fixtures/auth.ts`)
- Test Data Constants (`./fixtures/test-data.ts`)

