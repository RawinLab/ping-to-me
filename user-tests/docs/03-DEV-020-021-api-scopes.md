# DEV-020 & DEV-021: API Key Scopes

## Summary

| Test ID | Test Name | Status | Description |
|---------|-----------|--------|-------------|
| DEV-020 | Display All Scopes | ✅ PASS | All 25+ scopes displayed by category |
| DEV-021 | Select/Deselect Scopes | ✅ PASS | Checkbox toggle works correctly |

**Overall: 2/2 PASS (100%)**

---

## Test Environment

- **Web URL**: http://localhost:3010
- **Test User**: e2e-owner@pingtome.test / TestPassword123!
- **Dialog Location**: Create API Key dialog in `/dashboard/developer/api-keys`

---

## DEV-020: Display All Available Scopes

### Objective
Verify that the Create API Key dialog displays all available API scopes organized by resource category.

### Scope Categories

| Resource | Count | Scopes |
|----------|-------|--------|
| Link | 6 | read, create, update, delete, export, bulk |
| Analytics | 2 | read, export |
| Domain | 4 | read, create, verify, delete |
| Campaign | 4 | read, create, update, delete |
| Tag | 4 | read, create, update, delete |
| BioPage | 4 | read, create, update, delete |
| Team | 1 | read |
| **Total** | **25** | |

### UI Verification

| Element | Status |
|---------|--------|
| Section header: "Permissions (Scopes)" with Shield icon | ✅ |
| Description: "Select the permissions this API key should have..." | ✅ |
| Resource categories organized as groups | ✅ |
| Each scope as checkbox with label | ✅ |
| Tooltip on hover with description | ✅ |

### Scope Descriptions (Examples)

| Scope | Description |
|-------|-------------|
| `link:read` | Read access to shortened links |
| `link:create` | Create new shortened links |
| `analytics:read` | Read analytics data for links |
| `domain:verify` | Verify custom domains |

---

## DEV-021: Select/Deselect Scopes

### Objective
Verify that scope checkboxes can be selected and deselected, with UI reflecting the selection state.

### Test Steps
1. Open Create API Key dialog
2. Click on `link:read` scope checkbox
3. Verify checkbox becomes checked
4. Click again to deselect
5. Verify checkbox becomes unchecked
6. Repeat for multiple scopes

### Results
```
✅ Individual scope selection works
✅ Multiple scope selection works
✅ Deselection works correctly
✅ Selection count updates
✅ Visual feedback (checkbox state)
```

### Scope Groups Available

| Group | Description |
|-------|-------------|
| Read-Only | `link:read`, `analytics:read`, `domain:read`, etc. |
| Link Management | `link:create`, `link:update`, `link:delete`, `link:bulk` |
| Content Management | All BioPage, Tag, Campaign scopes |
| Full Analytics | `analytics:read`, `analytics:export` |
| Admin | Full access to all resources |

---

## E2E Test Files

| File | Description |
|------|-------------|
| `apps/web/e2e/uat-dev-api-scopes.spec.ts` | Scopes display and selection tests |

### Run Tests
```bash
cd apps/web
npx playwright test --project=chromium e2e/uat-dev-api-scopes.spec.ts
```

---

## Backend Implementation

**Scopes Definition**: `apps/api/src/developer/api-scopes.ts`

```typescript
export const API_SCOPES = {
  LINK: ['link:read', 'link:create', 'link:update', 'link:delete', 'link:export', 'link:bulk'],
  ANALYTICS: ['analytics:read', 'analytics:export'],
  DOMAIN: ['domain:read', 'domain:create', 'domain:verify', 'domain:delete'],
  CAMPAIGN: ['campaign:read', 'campaign:create', 'campaign:update', 'campaign:delete'],
  TAG: ['tag:read', 'tag:create', 'tag:update', 'tag:delete'],
  BIOPAGE: ['biopage:read', 'biopage:create', 'biopage:update', 'biopage:delete'],
  TEAM: ['team:read'],
  ADMIN: ['admin:full']
};
```

---

*Consolidated from: DEV-020-021-API-Scopes-UAT-Report.md, DEV-020-021-TEST-SUMMARY.md, README-DEV-020-021.md*
