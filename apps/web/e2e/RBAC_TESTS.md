# RBAC E2E Tests Documentation

Complete end-to-end test suite for Role-Based Access Control (RBAC) system covering all 4 roles and their permissions.

## Overview

This test suite (`rbac.spec.ts`) validates the RBAC implementation across the PingTO.Me application. It ensures that users can only access features and data they're authorized to access based on their role.

**File Location**: `/apps/web/e2e/rbac.spec.ts`

**Total Tests**: 26 test cases across 5 test suites

## Test Coverage

### 1. OWNER Role Tests (RBAC-001 to RBAC-004)

Tests that verify OWNER role has full access to all features.

#### RBAC-001: Can access organization settings
- **Description**: OWNER users should be able to navigate to and view organization settings
- **Expected**: Access allowed, no 403 or redirect
- **Validates**: Org settings page is accessible to OWNER

#### RBAC-002: Can manage all members
- **Description**: OWNER users should be able to view and manage all team members
- **Expected**: Team management page loads, invite button visible
- **Validates**: Full member management capabilities

#### RBAC-003: Can access billing
- **Description**: OWNER users should be able to view and manage billing
- **Expected**: Billing page accessible with plan information
- **Validates**: Subscription and payment management access

#### RBAC-004: Can manage all links
- **Description**: OWNER users should be able to create, edit, and delete any link in the organization
- **Expected**: Links page accessible, create/edit/delete actions visible
- **Validates**: Full link management capabilities

### 2. ADMIN Role Tests (RBAC-010 to RBAC-013)

Tests that verify ADMIN role has most access but cannot manage billing.

#### RBAC-010: Can access limited organization settings
- **Description**: ADMIN users should access org settings but with limitations
- **Expected**: Organization settings page accessible
- **Validates**: Settings access with role-based constraints

#### RBAC-011: Can manage non-OWNER members
- **Description**: ADMIN users should manage team members but cannot remove OWNER
- **Expected**: Team management page accessible
- **Validates**: Member management with role hierarchy enforcement

#### RBAC-012: Cannot access billing management
- **Description**: ADMIN users should NOT be able to access billing
- **Expected**: 403 Forbidden or redirect from billing page
- **Validates**: Billing access restricted to OWNER only

#### RBAC-013: Can manage organization links
- **Description**: ADMIN users should be able to manage all organization links
- **Expected**: Links page accessible with full link management
- **Validates**: Organization-wide link management access

### 3. EDITOR Role Tests (RBAC-020 to RBAC-025)

Tests that verify EDITOR role has limited access - create own content, view org content.

#### RBAC-020: Cannot access organization settings
- **Description**: EDITOR users should NOT be able to access organization settings
- **Expected**: 403 Forbidden or redirect
- **Validates**: Org settings restricted to OWNER/ADMIN

#### RBAC-021: Cannot manage team
- **Description**: EDITOR users should NOT be able to access team management
- **Expected**: 403 Forbidden or redirect
- **Validates**: Team management restricted to OWNER/ADMIN

#### RBAC-022: Can create links
- **Description**: EDITOR users should be able to create new links
- **Expected**: Create link page accessible
- **Validates**: Link creation capability

#### RBAC-023: Can only edit own links
- **Description**: EDITOR users should be able to edit links they created
- **Expected**: Links page accessible, can edit own links
- **Validates**: Ownership-based edit permissions

#### RBAC-024: Can only delete own links
- **Description**: EDITOR users should be able to delete links they created
- **Expected**: Can delete own links, cannot delete others'
- **Validates**: Ownership-based delete permissions

#### RBAC-025: Can view organization analytics
- **Description**: EDITOR users should be able to view analytics for links they can access
- **Expected**: Analytics page accessible
- **Validates**: Analytics read access for organization content

### 4. VIEWER Role Tests (RBAC-030 to RBAC-033)

Tests that verify VIEWER role has read-only access.

#### RBAC-030: Has read-only access
- **Description**: VIEWER users should be able to view dashboard but cannot create
- **Expected**: Dashboard accessible, create buttons hidden
- **Validates**: Read-only access to dashboard

#### RBAC-031: Cannot create links
- **Description**: VIEWER users should NOT be able to create links
- **Expected**: 403 Forbidden or redirect from create link page
- **Validates**: Link creation restricted

#### RBAC-032: Can view analytics
- **Description**: VIEWER users should be able to view analytics
- **Expected**: Analytics page accessible
- **Validates**: Analytics read access

#### RBAC-033: Can view team members
- **Description**: VIEWER users should be able to view team but not modify
- **Expected**: Team members visible, no invite/edit buttons
- **Validates**: Team member list read-only access

### 5. Permission Enforcement Tests (RBAC-040 to RBAC-043)

Tests that verify backend permission enforcement and protection mechanisms.

#### RBAC-040: API returns 403 for unauthorized action
- **Description**: API endpoints should reject unauthorized requests with 403 status
- **Expected**: 403 Forbidden status code
- **Validates**: API-level permission enforcement

#### RBAC-041: Direct URL access is blocked
- **Description**: Direct navigation to protected URLs should be blocked
- **Expected**: Access denied or redirect
- **Validates**: Frontend route protection

#### RBAC-042: Role change takes effect immediately
- **Description**: Permission changes should take effect immediately
- **Expected**: Permissions updated without re-login
- **Validates**: Real-time permission updates

#### RBAC-043: Multi-org permission isolation
- **Description**: Users should only see data from their organization
- **Expected**: Data isolation between organizations
- **Validates**: Multi-tenant data segregation

### 6. API Token Scope Tests (RBAC-050 to RBAC-053)

Tests that verify API key scoping and permissions.

#### RBAC-050: API key with read scope cannot write
- **Description**: Read-only API keys should be unable to modify resources
- **Expected**: Write operations rejected
- **Validates**: API key scope enforcement for reads

#### RBAC-051: API key with write scope can create
- **Description**: Write-enabled API keys should be able to create resources
- **Expected**: Write operations allowed
- **Validates**: API key scope enforcement for writes

#### RBAC-052: API key respects organization scope
- **Description**: API keys should be limited to their organization
- **Expected**: Cannot access other organizations' resources
- **Validates**: Organization-level API key scoping

#### RBAC-053: Expired API key is rejected
- **Description**: Expired API keys should be rejected
- **Expected**: 401 Unauthorized for expired keys
- **Validates**: API key expiration enforcement

## Test Structure

### Helper Functions

#### `setupAuthMocks(page, role)`
Sets up all necessary API mocks for a specific role including:
- Authentication endpoints (auth/refresh, auth/me)
- Organization endpoints
- Links, analytics, team members, settings, billing
- Role-based response handling

#### `loginAsRole(page, role)`
Performs full login flow for a specific role:
1. Sets up auth mocks
2. Navigates to login page
3. Fills credentials from TEST_CREDENTIALS
4. Clicks login button
5. Waits for dashboard redirect

#### `isPathAccessible(page, path)`
Checks if a path is accessible by:
1. Navigating to the path
2. Checking for 403/access denied indicators
3. Verifying no redirect occurred
4. Restoring previous URL

#### `hasVisibleText(page, text)`
Checks if specific text is visible on the page using regex or string matching.

## Test Credentials

The tests use predefined credentials from `fixtures/test-data.ts`:

```typescript
TEST_CREDENTIALS = {
  owner: {
    email: 'e2e-owner@pingtome.test',
    password: 'TestPassword123!',
    name: 'E2E Owner User',
  },
  admin: {
    email: 'e2e-admin@pingtome.test',
    password: 'TestPassword123!',
    name: 'E2E Admin User',
  },
  editor: {
    email: 'e2e-editor@pingtome.test',
    password: 'TestPassword123!',
    name: 'E2E Editor User',
  },
  viewer: {
    email: 'e2e-viewer@pingtome.test',
    password: 'TestPassword123!',
    name: 'E2E Viewer User',
  },
}
```

## Running the Tests

### Run all RBAC tests
```bash
pnpm --filter web test:e2e rbac
```

### Run specific role tests
```bash
# OWNER tests only
pnpm --filter web test:e2e rbac -- --grep "OWNER Role"

# ADMIN tests only
pnpm --filter web test:e2e rbac -- --grep "ADMIN Role"

# EDITOR tests only
pnpm --filter web test:e2e rbac -- --grep "EDITOR Role"

# VIEWER tests only
pnpm --filter web test:e2e rbac -- --grep "VIEWER Role"
```

### Run specific test
```bash
pnpm --filter web test:e2e rbac -- --grep "RBAC-001"
```

### Run with UI mode (interactive)
```bash
npx playwright test --ui apps/web/e2e/rbac.spec.ts
```

### Run with debug mode
```bash
npx playwright test --debug apps/web/e2e/rbac.spec.ts
```

### List all tests
```bash
npx playwright test --list apps/web/e2e/rbac.spec.ts
```

## API Mocking Strategy

The test suite uses Playwright's route interception to mock API responses. Each role gets role-specific responses:

### Mock Routes

1. **Auth Endpoints** (`**/auth/**`)
   - Returns user data with correct role
   - User ID and email based on role

2. **Organizations** (`**/organizations/**`)
   - GET: Returns org list with user's role in it
   - POST/PATCH: Responds based on role permissions

3. **Team Members** (`**/organizations/*/members**`)
   - GET: Returns full member list for all roles
   - POST (invite): 201 for OWNER/ADMIN, 403 for others

4. **Billing** (`**/billing**`)
   - GET: 200 with data for OWNER, 403 for others

5. **Links** (`**/links**`)
   - GET: Returns empty list (can be enhanced)
   - POST: Route continues (real API or additional mock)

6. **Settings** (`**/organizations/*`)
   - GET: Returns org data for all roles
   - PATCH/PUT: 200 for OWNER/ADMIN, 403 for others

7. **Analytics** (`**/analytics/**`)
   - Returns dashboard data for authorized roles

## Frontend Route Protection

Tests validate that the frontend blocks access to restricted routes through:

1. **Route Redirects**: React Router guards redirect to dashboard
2. **Conditional Rendering**: Buttons/links hidden based on role
3. **Component-Level Checks**: Components check permissions before rendering

## Key Test Assertions

All tests use these patterns:

1. **No Access Denied**: Check that "Access Denied" text doesn't appear
2. **URL Validation**: Verify current URL matches expected page
3. **Element Visibility**: Check for presence of key page elements
4. **HTTP Status**: Verify correct 403/401 for unauthorized requests

## Mocking Philosophy

The test suite uses **API mocking** rather than real database interactions:

**Advantages**:
- Fast test execution
- No database setup required
- Predictable test data
- Works in CI/CD environments
- Tests UI and route protection logic

**Limitations**:
- Doesn't test actual API permission logic
- API logic should be tested separately via API integration tests
- Can miss edge cases in real API

## Enhancement Opportunities

Future improvements to the test suite:

1. **Real Database Tests**: Add separate suite using real auth/database
2. **API Integration Tests**: Test actual API permission matrix separately
3. **Cross-Role Tests**: Test transitions between roles
4. **Data Ownership Tests**: More comprehensive ownership-based access tests
5. **Error Messages**: Validate user-friendly error messages
6. **Performance**: Measure response times for permission checks

## Integration with CI/CD

The tests are designed to run in CI/CD pipelines:

```bash
# In CI environment
CI=true npx playwright test --project=chromium apps/web/e2e/rbac.spec.ts
```

**CI-Specific Behavior**:
- Single worker for consistent test order
- HTML report generated in `playwright-report/`
- Retries failed tests twice
- No interactive mode

## Troubleshooting

### Test Times Out
- Check if mock routes are matching correctly
- Ensure page.waitForLoadState() is called
- Increase timeout in test if needed

### Element Not Found
- Verify CSS/XPath selectors match actual DOM
- Check if element is visible or hidden
- Use page.locator().isVisible() to debug

### Login Fails
- Check TEST_CREDENTIALS match your setup
- Verify auth endpoints are mocked
- Check browser console for errors

### Permission Not Enforced
- Verify mock routes return 403 for unauthorized
- Check frontend route guards are in place
- Validate Redux/state management stores permission correctly

## Related Files

- **Test File**: `/apps/web/e2e/rbac.spec.ts`
- **Test Data**: `/apps/web/e2e/fixtures/test-data.ts`
- **Auth Helpers**: `/apps/web/e2e/fixtures/auth.ts`
- **Config**: `/apps/web/playwright.config.ts`
- **RBAC Implementation**: `/apps/api/src/auth/rbac/`
- **Permission Matrix**: `/apps/api/src/auth/rbac/permission-matrix.ts`
