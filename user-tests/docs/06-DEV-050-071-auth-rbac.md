# DEV-050 to DEV-054 & DEV-070-071: API Key Authentication & RBAC

## Summary

### API Key Authentication (DEV-050 to DEV-054)

| Test ID | Test Name | Status | Description |
|---------|-----------|--------|-------------|
| DEV-050 | API Key Returns 200 OK | ✅ PASS | Valid key authenticates successfully |
| DEV-051 | Insufficient Scope Returns 403 | ✅ PASS | Missing scope blocked |
| DEV-052 | Expired Key Rejection | ⚠️ BLOCKED | Requires manual expired key setup |
| DEV-053 | Invalid Key Returns 401 | ✅ PASS | Wrong key rejected |
| DEV-054 | Revoked Key Returns 401 | ✅ PASS | Deleted key rejected |

### RBAC for API Keys (DEV-070 & DEV-071)

| Test ID | Test Name | Status | Description |
|---------|-----------|--------|-------------|
| DEV-070 | VIEWER Cannot Access | ✅ PASS | 403 Forbidden for VIEWER role |
| DEV-071 | EDITOR Cannot Create | ✅ PASS | 403 Forbidden for EDITOR role |

**Overall: 6/7 PASS + 1 BLOCKED (86%)**

---

## API Key Authentication

### Endpoints with API Key Support

| Controller | Endpoints | Scopes |
|------------|-----------|--------|
| Links | `/links/*` | `link:read`, `link:create`, `link:update`, `link:delete`, `link:export`, `link:bulk` |
| Analytics | `/analytics/*` | `analytics:read`, `analytics:export` |
| Domains | `/domains/*` | `domain:read`, `domain:create`, `domain:verify`, `domain:delete` |
| Campaigns | `/campaigns/*` | `campaign:read`, `campaign:create`, `campaign:update`, `campaign:delete` |
| Tags | `/tags/*` | `tag:read`, `tag:create`, `tag:update`, `tag:delete` |
| BioPages | `/biopages/*` | `biopage:read`, `biopage:create`, `biopage:update`, `biopage:delete` |

### Authentication Flow

```
Request → x-api-key header → ApiScopeGuard
                              ↓
                        Validate Key (SHA256 hash)
                              ↓
                        Check Expiration
                              ↓
                        Check IP Whitelist
                              ↓
                        Check Rate Limit
                              ↓
                        Verify Required Scope
                              ↓
                        Allow Request
```

### DEV-050: Valid API Key Test

```bash
# Create API key with link:read scope
curl -X GET http://localhost:3011/links \
  -H "x-api-key: pk_your_api_key" \
  -H "x-org-id: your_org_id"

# Expected: 200 OK with links data
```

### DEV-051: Insufficient Scope Test

```bash
# API key has only link:read, but trying to create
curl -X POST http://localhost:3011/links \
  -H "x-api-key: pk_read_only_key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Expected: 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient scope. Required: link:create"
}
```

### DEV-053: Invalid Key Test

```bash
curl -X GET http://localhost:3011/links \
  -H "x-api-key: pk_invalid_key_here"

# Expected: 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

### DEV-054: Revoked Key Test

```bash
# After deleting key via DELETE /developer/api-keys/:id
curl -X GET http://localhost:3011/links \
  -H "x-api-key: pk_deleted_key"

# Expected: 401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

---

## RBAC Implementation

### Permission Matrix

| Role | api-key:create | api-key:read | api-key:revoke |
|------|----------------|--------------|----------------|
| OWNER | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ |
| EDITOR | ❌ | ❌ | ❌ |
| VIEWER | ❌ | ❌ | ❌ |

**Location**: `apps/api/src/auth/rbac/permission-matrix.ts`

### API Endpoints Protection

| Endpoint | Permission Required |
|----------|---------------------|
| POST `/developer/api-keys` | `api-key:create` |
| GET `/developer/api-keys` | `api-key:read` |
| DELETE `/developer/api-keys/:id` | `api-key:revoke` |
| POST `/developer/api-keys/:id/rotate` | `api-key:create` |
| PATCH `/developer/api-keys/:id/expiration` | `api-key:create` |

### Frontend Permission Check

```typescript
// apps/web/app/dashboard/layout.tsx (line 165)
requirePermission: (p) => p.canCreateApiKey() || p.can("api-key", "read")
```

Result for VIEWER: `false || false` = Developer menu hidden

### DEV-070: VIEWER Access Test

```bash
# Login as VIEWER
curl -X GET http://localhost:3011/developer/api-keys \
  -H "Authorization: Bearer <VIEWER_JWT>"

# Expected: 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions for api-key:read"
}
```

### DEV-071: EDITOR Create Test

```bash
# Login as EDITOR
curl -X POST http://localhost:3011/developer/api-keys \
  -H "Authorization: Bearer <EDITOR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","scopes":["link:read"]}'

# Expected: 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions for api-key:create"
}
```

---

## E2E Test Files

| File | Description |
|------|-------------|
| `apps/web/e2e/dev-070-rbac-viewer-api-keys.spec.ts` | VIEWER access tests |
| `apps/web/e2e/dev-071-rbac-editor-api-keys.spec.ts` | EDITOR permission tests |

### Run Tests
```bash
cd apps/web
npx playwright test --project=chromium e2e/dev-070*.spec.ts
npx playwright test --project=chromium e2e/dev-071*.spec.ts
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `apps/api/src/developer/api-scopes.guard.ts` | ApiScopeGuard implementation |
| `apps/api/src/developer/api-scopes.decorator.ts` | @RequireScope decorator |
| `apps/api/src/auth/rbac/permission-matrix.ts` | Role permission definitions |
| `apps/api/src/auth/rbac/permission.guard.ts` | PermissionGuard with API key bypass |

---

*Consolidated from: UAT_API_KEY_AUTH_TEST_REPORT.md, TEST_SUMMARY_DEV070_DEV071.md, UAT_Report_DEV-070_DEV-071.md*
