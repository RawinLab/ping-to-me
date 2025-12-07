# E2E Test Suite - Quick Reference Guide

## Test Files Overview

| File | Tests | Size | Focus |
|------|-------|------|-------|
| `organization-workspace.spec.ts` | 10 | 457 LOC | Organization CRUD, settings, switching |
| `member-invite-remove.spec.ts` | 19 | 903 LOC | Invitations, member management, RBAC |
| **TOTAL** | **29** | **1,360 LOC** | **Complete org & member workflows** |

---

## Organization Workspace Tests (10 tests)

### ORG-WS-001 to ORG-WS-003: Organization CRUD
- **ORG-WS-001**: Create new organization
- **ORG-WS-002**: Update organization name
- **ORG-WS-003**: Switch between organizations

### ORG-WS-010 to ORG-WS-012: Organization Settings
- **ORG-WS-010**: Display organization details
- **ORG-WS-011**: Update organization timezone
- **ORG-WS-012**: Upload organization logo

### ORG-WS-040 to ORG-WS-041: Organization Switcher
- **ORG-WS-040**: Switch between organizations in dropdown
- **ORG-WS-041**: Persist selected organization across pages

### ORG-WS-050 to ORG-WS-051: Members Count
- **ORG-WS-050**: Display member count by role
- **ORG-WS-051**: Handle empty organization

---

## Member Invite/Remove Tests (19 tests)

### MIR-001 to MIR-005: Send Invitations (3 tests)
- **MIR-001**: Send invitation to new email
- **MIR-002**: Cannot invite existing member
- **MIR-005**: Role options filtered by user role

### MIR-010 to MIR-014: Accept Invitations (4 tests)
- **MIR-010**: Accept invitation as existing user
- **MIR-011**: Accept invitation as new user
- **MIR-012**: Cannot accept expired invitation
- **MIR-014**: Invitation shows correct details

### MIR-020: Decline Invitations (1 test)
- **MIR-020**: Decline invitation

### MIR-030 to MIR-032: Manage Invitations (3 tests)
- **MIR-030**: View pending invitations list
- **MIR-031**: Resend invitation
- **MIR-032**: Cancel invitation

### MIR-040 to MIR-044: Remove Members (3 tests)
- **MIR-040**: Remove member from organization
- **MIR-041**: Cannot remove OWNER
- **MIR-044**: Self-removal from organization

### MIR-100 to MIR-104: Error Cases (5 tests)
- **MIR-100**: Handle invalid invitation token
- **MIR-101**: Handle already accepted invitation
- **MIR-102**: Validate email format in invitation form
- **MIR-103**: Password validation in new user registration
- **MIR-104**: Password mismatch validation

---

## Running Tests

### Run All Tests
```bash
# Run all E2E tests
npx playwright test apps/web/e2e/

# Run with specific configuration
npx playwright test --project=chromium
```

### Run Specific Test Suite
```bash
# Organization workspace tests
npx playwright test organization-workspace.spec.ts

# Member invite/remove tests
npx playwright test member-invite-remove.spec.ts
```

### Run Specific Test by ID
```bash
npx playwright test -g "ORG-WS-001"
npx playwright test -g "MIR-010"
```

### Run with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Generate HTML Report
```bash
npx playwright test && npx playwright show-report
```

### Debug Mode
```bash
npx playwright test --debug
```

### Run Single Test in Debug Mode
```bash
npx playwright test -g "MIR-001" --debug
```

---

## Key Mock Data

### Users
```javascript
// OWNER user (can do everything)
{ id: "user-1", email: "owner@example.com", role: "OWNER" }

// ADMIN user (can invite, remove, manage)
{ id: "user-2", email: "admin@example.com", role: "ADMIN" }

// EDITOR user (limited permissions)
{ id: "user-3", email: "editor@example.com", role: "EDITOR" }
```

### Organizations
```javascript
{ id: "org-1", name: "Test Organization", slug: "test-org" }
{ id: "org-2", name: "Tech Startup", slug: "tech-startup" }
```

### Invitations
```javascript
{
  id: "inv-1",
  email: "newmember@example.com",
  role: "EDITOR",
  token: "mock-token-123",
  expiresAt: "2025-12-15", // 7 days from now
  personalMessage: "Welcome to the team!"
}
```

---

## Common Test Patterns

### Fill Form and Submit
```typescript
await page.fill('input[placeholder="colleague@company.com"]', 'test@example.com');
await page.fill('textarea[placeholder="Add a personal note..."]', 'Welcome!');
await page.click('button:has-text("Send Invitation")');
```

### Check API Was Called
```typescript
let apiCalled = false;
await page.route("**/organizations", async (route) => {
  apiCalled = true;
  // ... fulfill response
});
// ... perform action
expect(apiCalled).toBe(true);
```

### Verify Error Message
```typescript
await page.click('button:has-text("Action")');
await expect(page.locator('text=User is already a member')).toBeVisible();
```

### Handle Dialogs
```typescript
page.on("dialog", (dialog) => {
  dialog.accept(); // or dialog.dismiss()
});
await page.click('button:has-text("Delete")');
```

### Select Dropdown Option
```typescript
await page.click('div[role="combobox"]'); // Open dropdown
await page.click('div[role="option"]:has-text("Editor")'); // Select option
```

---

## Mocked API Endpoints

### Organizations
- `GET /organizations` - List organizations
- `POST /organizations` - Create organization
- `GET /organizations/{id}` - Get organization
- `PATCH /organizations/{id}` - Update organization
- `POST /organizations/{id}/logo` - Upload logo

### Members
- `GET /organizations/{id}/members` - List members
- `DELETE /organizations/{id}/members/{userId}` - Remove member

### Invitations
- `GET /organizations/{id}/invitations` - List invitations
- `POST /organizations/{id}/invitations` - Create invitation
- `POST /organizations/{id}/invitations/{invId}` - Resend invitation
- `DELETE /organizations/{id}/invitations/{invId}` - Cancel invitation

### Invitation Actions
- `GET /invitations/{token}` - Get invitation by token
- `POST /invitations/{token}/accept` - Accept invitation
- `POST /invitations/{token}/decline` - Decline invitation

### Auth
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

---

## Selectors Reference

### Common Input Selectors
```typescript
// Email input
'input[placeholder="colleague@company.com"]'

// Name input
'input[id="name"]'

// Password input
'input[id="password"]'

// Confirm password
'input[id="confirm-password"]'

// Message textarea
'textarea[placeholder="Add a personal note to your invitation..."]'
```

### Common Button Selectors
```typescript
// Text-based selector (most reliable)
'button:has-text("Send Invitation")'
'button:has-text("Accept Invitation")'
'button:has-text("Decline Invitation")'
'button:has-text("Delete")'
'button:has-text("Invite Member")'

// By class (less reliable, may change)
'button[class*="text-red"]'
'button.primary-button'
```

### Common Text Selectors
```typescript
// Exact text match
'text=Team Members'
'text=Invite Team Member'

// Pattern match
'text=/Password must be at least 8 characters/'
'text=/Expires/'
```

---

## Troubleshooting Guide

### Tests Are Timing Out
**Problem**: Tests wait too long for elements to appear
**Solution**:
- Verify route mocks are set up before navigation
- Check selector matches actual DOM element
- Increase timeout: `await page.waitForURL(/pattern/, { timeout: 5000 })`

### Elements Not Found
**Problem**: Selectors don't match DOM
**Solution**:
- Use `page.locator().first()` for multiple matches
- Try text-based selectors: `'button:has-text("text")'`
- Use CSS: `'input[name="fieldname"]'`
- Use aria-label: `'[aria-label="Close"]'`

### Flaky Tests
**Problem**: Tests fail intermittently
**Solution**:
- Add explicit waits: `await expect(element).toBeVisible()`
- Don't rely on timeouts for actions
- Use proper selectors (avoid index-based)
- Mock all external API calls

### Dialog/Modal Not Appearing
**Problem**: Button click doesn't open dialog
**Solution**:
- Verify element is clickable: `await element.click()`
- Wait for animation: `await page.waitForTimeout(300)`
- Check z-index issues: Open DevTools to inspect
- Ensure parent button not overlapped

### Navigation Not Happening
**Problem**: After action, page doesn't navigate
**Solution**:
- Mock all required APIs for next page
- Use `page.waitForURL()` to wait for navigation
- Check browser console for JavaScript errors
- Verify API error responses aren't preventing nav

---

## Performance Notes

- **Fastest**: ORG-WS tests (simpler mocks)
- **Slowest**: MIR-011 (new user registration flow)
- **Average Runtime**: ~2-5 seconds per test
- **Total Suite**: ~60-90 seconds

---

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: npx playwright test

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Pre-commit Hook
```bash
#!/bin/bash
# Run tests before commit
npx playwright test --project=chromium

if [ $? -ne 0 ]; then
  echo "E2E tests failed. Commit aborted."
  exit 1
fi
```

---

## Test Development Workflow

### Creating a New Test
1. Create test block: `test("TEST-001: Description", async ({ page }) => { ... })`
2. Add beforeEach setup (copy from existing test)
3. Write test steps (navigate, fill, click, verify)
4. Mock required API endpoints
5. Verify selectors match actual UI
6. Run test: `npx playwright test -g "TEST-001" --ui`
7. Debug with `--debug` flag if needed
8. Add to test group with describe block

### Test Checklist
- [ ] Test has descriptive name with ID
- [ ] All required mocks are set up
- [ ] Selectors are tested and stable
- [ ] Test is independent (doesn't rely on other tests)
- [ ] Error cases are handled
- [ ] API payloads are validated
- [ ] Navigation waits are in place
- [ ] Documentation is updated

---

## Resources

- [Playwright API Docs](https://playwright.dev/docs/intro)
- [Test Selectors Guide](https://playwright.dev/docs/locators)
- [Common Test Patterns](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

---

**Last Updated**: 2025-12-08
**Test Framework**: Playwright 1.48+
**Status**: Ready for development and CI/CD integration
