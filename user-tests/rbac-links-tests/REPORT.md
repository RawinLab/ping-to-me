# RBAC Links Management Access Test Report
## Test Session: 2025-12-11

### Test Scope
Testing RBAC-030 through RBAC-033: Links management access control

### Test Environment
- API: http://localhost:3011
- Organization ID: `e2e00000-0000-0000-0001-000000000001`
- Test Users:
  - OWNER: `e2e-owner@pingtome.test`
  - ADMIN: `e2e-admin@pingtome.test`
  - EDITOR: `e2e-editor@pingtome.test`
  - VIEWER: `e2e-viewer@pingtome.test`

### Test Results Summary

| Test ID | Status | Expected | Actual | Notes |
|---------|--------|----------|--------|-------|
| **RBAC-030: OWNER Full Links Access** ||||
| RBAC-030.1 | PASS | 200 | 200 | OWNER can list links |
| RBAC-030.2 | PASS | 201 | 201 | OWNER can create links |
| RBAC-030.3 | FAIL | 200 | 403 | OWNER cannot update own links (UNEXPECTED) |
| RBAC-030.4 | FAIL | 200 | 403 | OWNER cannot delete own links (UNEXPECTED) |
| **RBAC-031: ADMIN Full Links Access** ||||
| RBAC-031.1 | PASS | 200 | 200 | ADMIN can list links |
| RBAC-031.2 | PASS | 201 | 201 | ADMIN can create links |
| RBAC-031.3 | FAIL | 200 | 403 | ADMIN cannot update ANY links (UNEXPECTED) |
| RBAC-031.4 | FAIL | 200 | 403 | ADMIN cannot delete ANY links (UNEXPECTED) |
| **RBAC-032: EDITOR Can Create/Edit OWN Links** ||||
| RBAC-032.1 | PASS | 200 | 200 | EDITOR can list links |
| RBAC-032.2 | PASS | 201 | 201 | EDITOR can create links |
| RBAC-032.3 | FAIL | 200 | 403 | EDITOR cannot update OWN links (UNEXPECTED) |
| RBAC-032.4 | PASS | 403 | 403 | EDITOR correctly blocked from updating OTHER's links |
| RBAC-032.5 | FAIL | 200 | 403 | EDITOR cannot delete OWN links (UNEXPECTED) |
| RBAC-032.6 | PASS | 403 | 403 | EDITOR correctly blocked from deleting OTHER's links |
| **RBAC-033: VIEWER Read-Only Links** ||||
| RBAC-033.1 | PASS | 200 | 200 | VIEWER can list links |
| RBAC-033.2 | PASS | 403 | 403 | VIEWER correctly blocked from creating links |
| RBAC-033.3 | PASS | 403 | 403 | VIEWER correctly blocked from updating links |
| RBAC-033.4 | PASS | 403 | 403 | VIEWER correctly blocked from deleting links |

### Overall Results
- **Total Tests**: 20
- **Passed**: 12 (60%)
- **Failed**: 8 (40%)

### Critical Findings

#### 1. OWNER/ADMIN Cannot Update or Delete Links (CRITICAL BUG)
**Status**: CRITICAL - System Not Working as Designed

**Expected Behavior**:
- According to permission matrix (`/apps/api/src/auth/rbac/permission-matrix.ts`):
  - OWNER has `"*"` (full access) for all link operations (create, read, update, delete)
  - ADMIN has `"*"` (full access) for all link operations (create, read, update, delete)
  - The `"*"` scope should bypass ownership checks per the RBAC design

**Actual Behavior**:
- OWNER can create links but gets 403 Forbidden when trying to update or delete their own links
- ADMIN can create links but gets 403 Forbidden when trying to update or delete ANY links (including other users')

**Affected Tests**:
- RBAC-030.3, RBAC-030.4 (OWNER update/delete)
- RBAC-031.3, RBAC-031.4 (ADMIN update/delete)

**Root Cause Analysis**:
This appears to be a potential issue with:
1. **OrganizationMember records**: The RBAC system checks `OrganizationMember.role`, not `User.role`. If OrganizationMember records are missing or incorrect, the permission checks would fail.
2. **Full access check implementation**: The `hasFullAccessPermission()` method may not be working correctly to bypass ownership checks.
3. **Database seeding**: Test database may not be properly seeded with OrganizationMember records.

**Recommendation**:
1. Verify database is seeded by running: `pnpm --filter @pingtome/database db:reset`
2. Check if OrganizationMember records exist for test users
3. Verify the `hasFullAccessPermission()` logic in `/apps/api/src/auth/rbac/permission.service.ts`
4. Check the PermissionGuard's logic for handling `"*"` scopes

#### 2. EDITOR Cannot Update or Delete Own Links (CRITICAL BUG)
**Status**: CRITICAL - System Not Working as Designed

**Expected Behavior**:
- EDITOR should be able to update and delete their own links (context: "own")
- EDITOR should be blocked from modifying other users' links

**Actual Behavior**:
- EDITOR correctly blocked from updating/deleting OTHER users' links (RBAC-032.4, RBAC-032.6 PASS)
- EDITOR blocked from updating/deleting their OWN links (RBAC-032.3, RBAC-032.5 FAIL)

**This indicates the ownership check is working (blocking OTHER's links) but the "own" permission is not being granted correctly.**

#### 3. VIEWER Permissions Working Correctly
**Status**: PASS - Working as Expected

All VIEWER tests passed:
- Can list links (read-only)
- Correctly blocked from create/update/delete operations
- This suggests the basic permission denial logic is working

### Technical Notes

#### API Endpoint Discovery
- The Links update endpoint uses `POST /links/:id`, not `PATCH /links/:id`
- Comment in code: "Using POST for update to avoid CORS preflight issues sometimes, but PATCH is better REST"
- Delete endpoint: `DELETE /links/:id`

#### Permission Matrix Verification
Verified permissions in `/apps/api/src/auth/rbac/permission-matrix.ts`:

**OWNER** (lines 74-82):
```typescript
link: {
  create: "*",
  read: "*",
  update: "*",
  delete: "*",
  bulk: "*",
  export: "*",
}
```

**ADMIN** (lines 149-157):
```typescript
link: {
  create: "*",
  read: "*",
  update: "*",
  delete: "*",
  bulk: "organization",
  export: "*",
}
```

**EDITOR** (lines 209-217):
```typescript
link: {
  create: "own",
  read: "organization",
  update: "own",
  delete: "own",
  bulk: "own",
  export: "own",
}
```

**VIEWER** (lines 259-267):
```typescript
link: {
  read: "organization",
}
```

The permission matrix is correctly defined. The issue is in the enforcement.

### Next Steps

1. **Immediate Action Required**: Fix the RBAC permission enforcement for link updates/deletes
   - Investigate `hasFullAccessPermission()` implementation
   - Verify OrganizationMember records exist
   - Debug the permission check flow for `"*"` and `"own"` scopes

2. **Database Verification**:
   ```bash
   # Reset and reseed the database
   pnpm --filter @pingtome/database db:reset

   # Verify OrganizationMember records exist
   # Run SQL query to check:
   # SELECT * FROM "OrganizationMember" WHERE "organizationId" = 'e2e00000-0000-0000-0001-000000000001';
   ```

3. **Retest After Fix**:
   ```bash
   python3 /Users/earn/Projects/rawinlab/pingtome/user-tests/rbac-links-tests/test_rbac.py
   ```

### Test Artifacts

- Test Script: `/Users/earn/Projects/rawinlab/pingtome/user-tests/rbac-links-tests/test_rbac.py`
- Test Data: `/Users/earn/Projects/rawinlab/pingtome/user-tests/rbac-links-tests/*.json`
- Raw Results: `/tmp/rbac-test-results.txt`

### Conclusion

The RBAC system has **critical bugs** that prevent OWNER, ADMIN, and EDITOR from updating or deleting links, despite having the appropriate permissions in the permission matrix. Only the VIEWER role is working correctly (read-only access).

**System Status**: NOT READY FOR PRODUCTION

The root cause appears to be either:
1. Missing or incorrect OrganizationMember records in the test database
2. Bug in the `hasFullAccessPermission()` or `checkResourceOwnership()` implementation
3. Bug in the PermissionGuard's handling of `"*"` and `"own"` scopes

**Priority**: P0 - Critical - Blocks all link management operations for OWNER, ADMIN, and EDITOR roles
