# UAT Test Report: Custom Domains RBAC

**Test Date:** 2025-12-11
**Test Environment:** http://localhost:3010
**Test Suite:** `/apps/web/e2e/uat-domains-rbac.spec.ts`

## Executive Summary

**OVERALL RESULT: ❌ FAIL**

The Custom Domains page (**NOT** implementing RBAC controls properly. VIEWER and EDITOR roles can see management buttons (Add Domain, Delete, Set Default) that should be hidden or disabled according to the RBAC matrix.

## Test Environment

- **Web URL:** http://localhost:3010
- **API URL:** http://localhost:3001
- **Organization ID:** `e2e00000-0000-0000-0001-000000000001`

## Test Users

| Role | Email | Password | Expected Access |
|------|-------|----------|----------------|
| OWNER | e2e-owner@pingtome.test | TestPassword123! | Full access |
| ADMIN | e2e-admin@pingtome.test | TestPassword123! | Full access |
| EDITOR | e2e-editor@pingtome.test | TestPassword123! | Read-only |
| VIEWER | e2e-viewer@pingtome.test | TestPassword123! | Read-only |

## RBAC Matrix (Expected Behavior)

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|--------|-------|-------|--------|--------|
| View Domains | ✅ | ✅ | ✅ | ✅ |
| Add Domain | ✅ | ✅ | ❌ | ❌ |
| Delete Domain | ✅ | ✅ | ❌ | ❌ |
| Set Default | ✅ | ✅ | ❌ | ❌ |
| Verify Domain | ✅ | ✅ | ❌ | ❌ |

## Test Results Summary

**Total Tests:** 23
**Passed:** 11
**Failed:** 12

### Failed Tests

#### DOM-050: VIEWER Role Tests (6 failures)

1. ❌ **DOM-050.1:** VIEWER can view domains list
   - **Issue:** Selector returned multiple elements
   - **Impact:** Minor selector issue, not RBAC related

2. ❌ **DOM-050.2:** VIEWER cannot see Add Domain button
   - **Issue:** Button is **ENABLED** for VIEWER (should be disabled/hidden)
   - **Impact:** **CRITICAL** - RBAC violation

3. ❌ **DOM-050.3:** VIEWER cannot see Delete buttons
   - **Issue:** Delete buttons are **ENABLED** for VIEWER (should be disabled/hidden)
   - **Impact:** **CRITICAL** - RBAC violation

#### DOM-051: EDITOR Role Tests (5 failures)

4. ❌ **DOM-051.1:** EDITOR can view domains list
   - **Issue:** Selector returned multiple elements
   - **Impact:** Minor selector issue, not RBAC related

5. ❌ **DOM-051.2:** EDITOR cannot see Add Domain button
   - **Issue:** Button is **ENABLED** for EDITOR (should be disabled/hidden)
   - **Impact:** **CRITICAL** - RBAC violation

6. ❌ **DOM-051.3:** EDITOR cannot see Delete buttons
   - **Issue:** Delete buttons are **ENABLED** for EDITOR (should be disabled/hidden)
   - **Impact:** **CRITICAL** - RBAC violation

7. ❌ **DOM-051.5:** EDITOR cannot see Verify buttons
   - **Issue:** Verify buttons are **ENABLED** for EDITOR (should be disabled/hidden)
   - **Impact:** **CRITICAL** - RBAC violation

8. ❌ **DOM-051.6:** EDITOR can use search and filter
   - **Issue:** Test assertion issue
   - **Impact:** Minor

#### DOM-053: OWNER Role Tests (1 failure)

9. ❌ **DOM-053.4:** OWNER has full access
   - **Issue:** Selector returned multiple elements
   - **Impact:** Minor selector issue, not RBAC related

#### DOM-054: RBAC Summary Tests (3 failures)

10. ❌ **DOM-054.1:** Verify RBAC matrix for Add Domain
    - **Issue:** VIEWER and EDITOR can see enabled Add Domain button
    - **Impact:** **CRITICAL** - RBAC violation

11. ❌ **DOM-054.2:** Verify RBAC matrix for Delete Domain
    - **Issue:** VIEWER and EDITOR can see enabled Delete buttons
    - **Impact:** **CRITICAL** - RBAC violation

12. ❌ **DOM-054.3:** All roles can view domains
    - **Issue:** Selector returned multiple elements
    - **Impact:** Minor selector issue, not RBAC related

### Passed Tests (11)

✅ DOM-050.4: VIEWER cannot see Set Default button
✅ DOM-050.5: VIEWER can see domain details (read-only)
✅ DOM-050.6: VIEWER cannot access Add Domain modal
✅ DOM-051.4: EDITOR cannot see Set Default button
✅ DOM-052.1: ADMIN can see Add Domain button
✅ DOM-052.2: ADMIN can see Delete buttons
✅ DOM-052.3: ADMIN can see Set Default button
✅ DOM-052.4: ADMIN can open Add Domain modal
✅ DOM-053.1: OWNER can see Add Domain button
✅ DOM-053.2: OWNER can see all management buttons
✅ DOM-053.3: OWNER can open Add Domain modal

## Critical Issues Found

### 1. Missing RBAC Controls on Domains Page ⚠️

**File:** `/apps/web/app/dashboard/domains/page.tsx`

**Issue:** The domains page does not check user permissions before rendering management buttons.

**Current Code (Line 229-233):**
```tsx
<AddDomainModal orgId={currentOrg.id} onSuccess={fetchDomains}>
  <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
    <Plus className="mr-2 h-4 w-4" /> Add Domain
  </Button>
</AddDomainModal>
```

**Problem:** No permission check - button is always visible.

**Expected Code:**
```tsx
import { PermissionGate } from '@/components/PermissionGate';

<PermissionGate resource="domain" action="create">
  <AddDomainModal orgId={currentOrg.id} onSuccess={fetchDomains}>
    <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
      <Plus className="mr-2 h-4 w-4" /> Add Domain
    </Button>
  </AddDomainModal>
</PermissionGate>
```

### 2. Delete Button Missing RBAC ⚠️

**Current Code (Line 436-452):**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleDelete(domain.id, domain.hostname)}
  disabled={actionLoading === domain.id}
  className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Expected Code:**
```tsx
<PermissionGate resource="domain" action="delete">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleDelete(domain.id, domain.hostname)}
    disabled={actionLoading === domain.id}
    className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</PermissionGate>
```

### 3. Set Default Button Missing RBAC ⚠️

**Current Code (Line 418-434):**
```tsx
{domain.isVerified && !domain.isDefault && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleSetDefault(domain.id, domain.hostname)}
    disabled={actionLoading === domain.id}
    className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
  >
    {actionLoading === domain.id ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Star className="mr-2 h-4 w-4" />
    )}
    Set Default
  </Button>
)}
```

**Expected Code:**
```tsx
<PermissionGate resource="domain" action="update">
  {domain.isVerified && !domain.isDefault && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleSetDefault(domain.id, domain.hostname)}
      disabled={actionLoading === domain.id}
      className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
    >
      {actionLoading === domain.id ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Star className="mr-2 h-4 w-4" />
      )}
      Set Default
    </Button>
  )}
</PermissionGate>
```

### 4. Verify Button Missing RBAC ⚠️

**Current Code (Line 468-483):**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => handleVerify(domain.id, domain.verificationType as any)}
  disabled={actionLoading === domain.id}
  className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
>
  {actionLoading === domain.id ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : domain.status === "FAILED" ? (
    <RefreshCw className="mr-2 h-4 w-4" />
  ) : (
    <RefreshCw className="mr-2 h-4 w-4" />
  )}
  {domain.status === "FAILED" ? "Retry" : "Verify Now"}
</Button>
```

**Expected Code:**
```tsx
<PermissionGate resource="domain" action="verify">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleVerify(domain.id, domain.verificationType as any)}
    disabled={actionLoading === domain.id}
    className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
  >
    {actionLoading === domain.id ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : domain.status === "FAILED" ? (
      <RefreshCw className="mr-2 h-4 w-4" />
    ) : (
      <RefreshCw className="mr-2 h-4 w-4" />
    )}
    {domain.status === "FAILED" ? "Retry" : "Verify Now"}
  </Button>
</PermissionGate>
```

### 5. Empty State Add Button Missing RBAC ⚠️

**Current Code (Line 335-339):**
```tsx
<AddDomainModal orgId={currentOrg.id} onSuccess={fetchDomains}>
  <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
    <Plus className="mr-2 h-4 w-4" /> Add Your First Domain
  </Button>
</AddDomainModal>
```

**Expected Code:**
```tsx
<PermissionGate resource="domain" action="create">
  <AddDomainModal orgId={currentOrg.id} onSuccess={fetchDomains}>
    <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
      <Plus className="mr-2 h-4 w-4" /> Add Your First Domain
    </Button>
  </AddDomainModal>
</PermissionGate>
```

## Backend API RBAC Status

According to the RBAC documentation (`/refs/rbac.md`), the backend API should have proper RBAC guards. However, the **frontend is not enforcing these permissions in the UI**.

**Expected Backend Permissions (from RBAC matrix):**
- `domain:create` - OWNER ✅, ADMIN ✅, EDITOR ❌, VIEWER ❌
- `domain:read` - OWNER ✅, ADMIN ✅, EDITOR ✅, VIEWER ✅
- `domain:update` - OWNER ✅, ADMIN ✅, EDITOR ❌, VIEWER ❌
- `domain:delete` - OWNER ✅, ADMIN ✅, EDITOR ❌, VIEWER ❌
- `domain:verify` - OWNER ✅, ADMIN ✅, EDITOR ❌, VIEWER ❌

## Security Impact

**Severity: HIGH**

While the backend API should enforce permissions, the frontend is showing unauthorized users buttons they shouldn't see. This creates:

1. **Poor User Experience:** Users see buttons that will fail when clicked
2. **Security Confusion:** Users may think they have permissions they don't
3. **Potential API Bypass:** If backend RBAC is not properly implemented, this could allow unauthorized actions

## Recommendations

### Immediate Actions Required

1. **Add PermissionGate to all management buttons** in `/apps/web/app/dashboard/domains/page.tsx`
2. **Import PermissionGate component:** `import { PermissionGate } from '@/components/PermissionGate';`
3. **Wrap all action buttons with appropriate permissions:**
   - Add Domain: `<PermissionGate resource="domain" action="create">`
   - Delete: `<PermissionGate resource="domain" action="delete">`
   - Set Default: `<PermissionGate resource="domain" action="update">`
   - Verify: `<PermissionGate resource="domain" action="verify">`

4. **Verify backend RBAC is implemented** in domains controller
5. **Re-run UAT tests** to confirm fixes

### Code Changes Required

See **Critical Issues Found** section above for exact code changes needed.

### Reference Documentation

- RBAC Documentation: `/refs/rbac.md`
- Permission Matrix: Lines 114-118 in `/refs/rbac.md`
- Frontend Usage: Lines 250-357 in `/refs/rbac.md`
- PermissionGate Component: `/apps/web/components/PermissionGate.tsx`
- usePermission Hook: `/apps/web/hooks/usePermission.ts`

## Test Command

To re-run these tests after fixes:

```bash
cd apps/web
npx playwright test e2e/uat-domains-rbac.spec.ts --project=chromium
```

To run with UI mode for debugging:

```bash
cd apps/web
npx playwright test e2e/uat-domains-rbac.spec.ts --project=chromium --ui
```

## Conclusion

The Custom Domains page requires **immediate RBAC implementation** to properly restrict access based on user roles. The backend permissions may be in place, but the frontend is not enforcing them in the UI, leading to a poor user experience and potential security issues.

**Action Required:** Wrap all management buttons with `PermissionGate` component as shown in the recommendations above.

---

**Tested By:** Claude (UAT Tester)
**Test Suite:** `/apps/web/e2e/uat-domains-rbac.spec.ts`
**Total Test Cases:** 23
**Failed:** 12 (52% failure rate)
**Status:** ❌ **CRITICAL - RBAC NOT IMPLEMENTED**
