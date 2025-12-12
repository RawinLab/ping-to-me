# RBAC-010 to RBAC-013: Team Management Access Control

## Summary

| Test ID | Test Name | Status | Description |
|---------|-----------|--------|-------------|
| RBAC-010 | OWNER Can Manage Team | ✅ PASS | Full team access |
| RBAC-011 | ADMIN Can Manage Team | ✅ PASS | Can invite/remove |
| RBAC-012 | EDITOR Cannot Manage | ✅ PASS | Read-only access |
| RBAC-013 | VIEWER Cannot Manage | ✅ PASS | Read-only access (3/3 tests) |

**Overall: 4/4 PASS (100%)**

---

## Test Environment

| Component | Value |
|-----------|-------|
| API Server | http://localhost:3011 |
| Organization ID | e2e00000-0000-0000-0001-000000000001 |
| Test User | e2e-viewer@pingtome.test |

---

## Permission Matrix (Team)

| Role | Read Members | Invite | Remove | Change Role |
|------|--------------|--------|--------|-------------|
| OWNER | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ (not self) |
| EDITOR | ✅ | ❌ | ❌ | ❌ |
| VIEWER | ✅ | ❌ | ❌ | ❌ |

---

## RBAC-013 Detailed Results (VIEWER)

### Test Cases

| TC | Endpoint | Expected | Actual | Status |
|----|----------|----------|--------|--------|
| 1 | GET /organizations/{id}/members | 200 | 200 | ✅ PASS |
| 2 | POST /organizations/{id}/invites | 403 | 403 | ✅ PASS |
| 3 | DELETE /organizations/{id}/members/{userId} | 403 | 403 | ✅ PASS |

### Sample Responses

**View Members (Allowed):**
```json
HTTP 200
[
  {
    "userId": "e2e00000-0000-0000-0000-000000000004",
    "role": "VIEWER",
    "user": {
      "email": "e2e-viewer@pingtome.test",
      "name": "E2E Viewer User"
    }
  },
  // ... 3 more members
]
```

**Invite Member (Blocked):**
```json
HTTP 403
{
  "message": "Insufficient permissions for team:invite",
  "error": "Forbidden",
  "details": {
    "requiredPermission": "team:invite",
    "userId": "e2e00000-0000-0000-0000-000000000004"
  }
}
```

**Remove Member (Blocked):**
```json
HTTP 403
{
  "message": "Insufficient permissions for team:remove",
  "error": "Forbidden",
  "details": {
    "requiredPermission": "team:remove",
    "userId": "e2e00000-0000-0000-0000-000000000004"
  }
}
```

---

## Verification Points

### VIEWER Role:
- ✅ Can successfully view team member list
- ✅ Cannot invite new members (403)
- ✅ Cannot remove existing members (403)
- ✅ Read-only access properly enforced

### Security:
- ✅ JWT token validated on all requests
- ✅ Clear error messages with required permission
- ✅ User ID included for audit purposes

---

## API Endpoints

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | /organizations/:id/members | team:read |
| POST | /organizations/:id/invites | team:invite |
| DELETE | /organizations/:id/members/:userId | team:remove |
| PATCH | /organizations/:id/members/:userId | team:update |

---

*Consolidated from: rbac-013-viewer-team-management.md*
