# DEV-030 to DEV-036: API Key Management

## Summary

| Test ID | Test Name | Status | Description |
|---------|-----------|--------|-------------|
| DEV-030 | Display API Keys List | ✅ PASS | List with all metadata columns |
| DEV-031 | Copy API Key Preview | ✅ PASS | Copy masked key to clipboard |
| DEV-032 | Rotate API Key | ✅ PASS | Rotate with valid password |
| DEV-033 | Rotate - Wrong Password | ✅ PASS | Error shown for wrong password |
| DEV-034 | Set Expiration Date | ✅ PASS | Set expiration via date picker |
| DEV-035 | Clear Expiration Date | ✅ PASS | Remove expiration date |
| DEV-036 | Revoke/Delete API Key | ✅ PASS | Delete key with confirmation |

**Overall: 7/7 PASS (100%)**

---

## Test Environment

| Property | Value |
|----------|-------|
| Web Application | http://localhost:3010 |
| API Server | http://localhost:3011 |
| Test Framework | Playwright 1.57.0 |
| Test User | e2e-owner@pingtome.test |

---

## DEV-030: Display API Keys List

### Objective
Verify that the API Keys table displays all keys with correct metadata.

### Expected Columns
| Column | Description | Status |
|--------|-------------|--------|
| Name | Key name set during creation | ✅ |
| Key Preview | Masked format: `pk_••••••••` | ✅ |
| Scopes | Badge list of assigned scopes | ✅ |
| Status Badges | Active, Expired, IP Restricted, etc. | ✅ |
| Created Date | ISO date format | ✅ |
| Last Used | "Never" or date | ✅ |
| Actions | Rotate, Expiration, Delete | ✅ |

---

## DEV-031: Copy API Key Preview

### Objective
Verify that clicking copy on key preview copies the masked key to clipboard.

### Test Steps
1. Locate an API key row
2. Click copy button on key preview
3. Verify clipboard contains masked key

### Result
✅ Masked key `pk_••••••••` copied to clipboard

---

## DEV-032: Rotate API Key

### Objective
Verify that API key can be rotated with password confirmation.

### Test Steps
1. Click Rotate button on key row
2. Enter current password: `TestPassword123!`
3. Click Confirm
4. Verify new key is generated

### Expected Behavior
- Password confirmation dialog appears
- New key generated on valid password
- Old key immediately invalidated
- New key displayed once for copying

---

## DEV-033: Rotate - Wrong Password

### Objective
Verify that wrong password shows error during rotation.

### Test Steps
1. Click Rotate button
2. Enter wrong password: `WrongPassword`
3. Click Confirm
4. Verify error message

### Result
✅ Error message displayed: "Invalid password"

---

## DEV-034: Set Expiration Date

### Objective
Verify that expiration date can be set for an API key.

### Test Steps
1. Click expiration settings on key row
2. Select a future date
3. Save changes
4. Verify expiration date displayed

### Result
✅ Expiration date saved and displayed in UI

---

## DEV-035: Clear Expiration Date

### Objective
Verify that expiration date can be cleared (set to "Never").

### Test Steps
1. Click expiration settings on key with expiration
2. Select "Never expires" option
3. Save changes
4. Verify "Never" displayed

### Result
✅ Expiration cleared, "Never" displayed

---

## DEV-036: Revoke/Delete API Key

### Objective
Verify that API key can be permanently deleted.

### Test Steps
1. Click Delete button on key row
2. Confirm deletion in dialog
3. Verify key removed from list

### Expected Behavior
- Confirmation dialog with warning
- Key immediately deleted
- No longer appears in list
- Cannot be used for API calls

---

## E2E Test Files

| File | Description |
|------|-------------|
| `apps/web/e2e/uat-developer-api-keys.spec.ts` | Full management test suite |

### Run Tests
```bash
cd apps/web
npx playwright test --project=chromium e2e/uat-developer-api-keys.spec.ts
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/developer/api-keys` | List all API keys |
| POST | `/developer/api-keys/:id/rotate` | Rotate key (requires password) |
| PATCH | `/developer/api-keys/:id/expiration` | Set/clear expiration |
| DELETE | `/developer/api-keys/:id` | Revoke/delete key |

---

*Consolidated from: DEV-030-036-SUMMARY.md, DEV-030-036-QUICK-START.md, TEST-STRUCTURE.md*
