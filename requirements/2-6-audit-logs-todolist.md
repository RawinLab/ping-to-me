# Module 2.6: Audit/Activity Logs - Development Todolist

## Document Information
- **Module**: 2.6 Audit/Activity Logs
- **Source**: `2-6-audit-logs-plan.md`
- **Generated**: 2025-12-07
- **For**: Claude Code Subagent Development
- **Current Implementation**: ~30% Complete

---

## Quick Reference

### Commands
```bash
# Database migration
pnpm --filter @pingtome/database db:push
pnpm --filter @pingtome/database db:generate

# Run API
pnpm --filter api dev

# Run Web
pnpm --filter web dev

# Unit tests
pnpm --filter api test

# E2E tests
npx playwright test apps/web/e2e/audit-logs.spec.ts
```

### Key Files
- `packages/database/prisma/schema.prisma` - AuditLog model (ready)
- `apps/api/src/audit/audit.service.ts` - Core service (ready)
- `apps/api/src/audit/audit.controller.ts` - Endpoints (partial)
- `apps/web/app/dashboard/settings/audit-logs/page.tsx` - UI (functional)

### Critical Gap
**Infrastructure exists but NO actual audit logging calls in any business logic services!**

---

## Phase 1: Database Schema Enhancement (Week 1)

### TASK-2.6.1: Enhance AuditLog Model
**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `status` field (String, default 'success' - 'success' | 'failure')
- [ ] Add `changes` field (Json?, for before/after tracking)
- [ ] Add `geoLocation` field (String?, 'US, California')
- [ ] Add `requestId` field (String?, for request correlation)
- [ ] Verify existing indexes are sufficient
- [ ] Run migration

**Acceptance Criteria**:
- Schema updated with new fields
- Migration successful
- No breaking changes

---

## Phase 1: Event Logging Integration (Week 1-2)

### TASK-2.6.2: Create Audit Logging Helper Methods
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Create `logLinkEvent(userId, orgId, action, link, changes?)` method
- [ ] Create `logDomainEvent(userId, orgId, action, domain, changes?)` method
- [ ] Create `logTeamEvent(userId, orgId, action, member, changes?)` method
- [ ] Create `logOrgEvent(userId, orgId, action, details?)` method
- [ ] Create `logSecurityEvent(userId, action, details?)` method
- [ ] Create `logApiKeyEvent(userId, orgId, action, apiKey?)` method
- [ ] Create `logBillingEvent(userId, orgId, action, details?)` method
- [ ] All methods should handle errors gracefully (not block main operation)

**Acceptance Criteria**:
- Helper methods simplify audit logging
- Error handling doesn't break calling service
- Consistent log format

---

### TASK-2.6.3: Integrate Audit Logging in Links Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/links/links.service.ts`

**Events to Log**:
- [ ] `link.created` - on successful link creation
  - Include: slug, targetUrl, organizationId
- [ ] `link.updated` - on link update
  - Include: changes (before/after values)
- [ ] `link.deleted` - on link deletion
  - Include: slug, id
- [ ] `link.archived` - if archive feature exists
- [ ] `link.restored` - if restore feature exists
- [ ] `link.bulk_created` - on bulk import
- [ ] `link.bulk_deleted` - on bulk delete

**Acceptance Criteria**:
- All link operations logged
- Before/after captured for updates
- No performance impact on main operations

---

### TASK-2.6.4: Integrate Audit Logging in Domains Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Events to Log**:
- [ ] `domain.added` - on domain creation
  - Include: hostname, organizationId
- [ ] `domain.verified` - on successful verification
  - Include: hostname, verification type
- [ ] `domain.failed` - on verification failure
  - Include: hostname, error reason
- [ ] `domain.removed` - on domain deletion
  - Include: hostname
- [ ] `domain.ssl_updated` - on SSL status change
  - Include: hostname, status

**Acceptance Criteria**:
- All domain operations logged
- Verification results captured

---

### TASK-2.6.5: Integrate Audit Logging in Organization Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Events to Log**:
- [ ] `org.created` - on organization creation
  - Include: name, slug
- [ ] `org.updated` - on organization update
  - Include: changes (before/after)
- [ ] `org.settings_changed` - on settings change
  - Include: setting name, old value, new value
- [ ] `org.deleted` - on organization deletion
- [ ] `member.invited` - on invitation sent
  - Include: email, role
- [ ] `member.joined` - on invitation accepted
  - Include: userId, invitedByUserId
- [ ] `member.role_changed` - on role update
  - Include: targetUserId, oldRole, newRole
- [ ] `member.removed` - on member removal
  - Include: targetUserId

**Acceptance Criteria**:
- All org/team operations logged
- Role changes include old and new values

---

### TASK-2.6.6: Integrate Audit Logging in Auth Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/auth/auth.service.ts`

**Events to Log**:
- [ ] `auth.login` - on successful login
  - Include: ipAddress, userAgent, success: true
- [ ] `auth.logout` - on logout
- [ ] `auth.2fa_enabled` - when 2FA enabled
- [ ] `auth.2fa_disabled` - when 2FA disabled
- [ ] `auth.password_changed` - on password change
- [ ] `auth.failed_login` - on failed login attempt
  - Include: email (not userId), ipAddress, reason

**Acceptance Criteria**:
- Security events logged
- Failed logins capture reason
- No sensitive data logged

---

### TASK-2.6.7: Integrate Audit Logging in Developer Service
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/developer/developer.service.ts`

**Events to Log**:
- [ ] `api_key.created` - on API key creation
  - Include: keyId, name, scopes
- [ ] `api_key.rotated` - on key rotation
  - Include: keyId
- [ ] `api_key.revoked` - on key revocation
  - Include: keyId

**Acceptance Criteria**:
- API key lifecycle logged
- Scopes captured on creation

---

### TASK-2.6.8: Integrate Audit Logging in Payments Service
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/payments/payments.service.ts`

**Events to Log**:
- [ ] `billing.plan_changed` - on plan upgrade/downgrade
  - Include: oldPlan, newPlan
- [ ] `billing.subscription_cancelled` - on cancellation

**Acceptance Criteria**:
- Billing changes logged
- Plan transition captured

---

### TASK-2.6.9: Integrate Audit Logging in Other Services
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**Files**: Multiple service files

**Subtasks**:
- [ ] `apps/api/src/campaigns/campaigns.service.ts`
  - `campaign.created`, `campaign.updated`, `campaign.deleted`
- [ ] `apps/api/src/tags/tags.service.ts`
  - `tag.created`, `tag.updated`, `tag.deleted`
- [ ] `apps/api/src/biopages/biopages.service.ts`
  - `biopage.created`, `biopage.updated`, `biopage.deleted`
- [ ] `apps/api/src/folders/folders.service.ts` (if exists)
  - `folder.created`, `folder.deleted`

**Acceptance Criteria**:
- All major services have audit logging

---

## Phase 2: Audit Log Enhancement (Week 2)

### TASK-2.6.10: Implement Before/After Change Tracking
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Create `captureChanges(before, after)` helper method
- [ ] Compare objects and return only changed fields
- [ ] Format changes as `{ fieldName: { from: oldValue, to: newValue } }`
- [ ] Handle nested objects
- [ ] Exclude sensitive fields (password, tokens)
- [ ] Update log methods to accept and store changes

**Acceptance Criteria**:
- Changes captured correctly
- Only changed fields stored
- Sensitive data excluded

---

### TASK-2.6.11: Add Request Context to Audit Logs
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Create `AuditContext` interface (ipAddress, userAgent, requestId)
- [ ] Create injectable `RequestContextService` to capture request details
- [ ] Use NestJS `REQUEST` scope to access request in services
- [ ] Add geographic location resolution (IP to city/country)
- [ ] Generate unique requestId for correlation
- [ ] Pass context to all audit log calls

**Acceptance Criteria**:
- Request context captured automatically
- IP resolved to location
- Request ID enables log correlation

---

### TASK-2.6.12: Create Audit Log Retention Policy
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Implement `cleanupOldLogs(retentionDays)` method
- [ ] Delete logs older than retention period
- [ ] Make retention configurable per organization plan:
  - FREE: 30 days
  - PRO: 90 days
  - ENTERPRISE: 2 years
- [ ] Create cron job to run daily cleanup
- [ ] Log cleanup results

**Acceptance Criteria**:
- Old logs deleted automatically
- Retention respects plan limits
- Cleanup runs daily

---

## Phase 2: Enhanced Log Viewer API (Week 2-3)

### TASK-2.6.13: Enhance List Logs Endpoint
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/audit/audit.controller.ts`

**Subtasks**:
- [ ] Enhance `GET /audit/logs` endpoint with filters:
  - `action` - filter by action type (link.created, etc.)
  - `resource` - filter by resource type (Link, Domain, etc.)
  - `userId` - filter by user
  - `startDate` / `endDate` - date range
  - `status` - success/failure
  - `search` - search in details/metadata
- [ ] Add sorting options (createdAt asc/desc)
- [ ] Ensure pagination works correctly
- [ ] Include user details in response (name, email)

**Acceptance Criteria**:
- All filters work correctly
- Can combine multiple filters
- Response includes user info

---

### TASK-2.6.14: Create Organization-Scoped Logs Endpoint
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/audit/audit.controller.ts`

**Subtasks**:
- [ ] Add `GET /organizations/:id/audit-logs` endpoint
- [ ] Scope logs to organization
- [ ] Apply same filters as global endpoint
- [ ] Verify user has access to organization
- [ ] Apply RBAC (OWNER/ADMIN can see all, others see own)

**Acceptance Criteria**:
- Logs scoped to organization
- RBAC enforced
- Filters work

---

### TASK-2.6.15: Create Single Log Detail Endpoint
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/audit/audit.controller.ts`

**Subtasks**:
- [ ] Add `GET /audit/logs/:id` endpoint
- [ ] Return full log details including changes
- [ ] Include related resource details if available
- [ ] Verify user has access to view

**Acceptance Criteria**:
- Full log details returned
- Access control enforced

---

### TASK-2.6.16: Create Activity Summary Endpoint
**Priority**: LOW | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/audit/audit.controller.ts`

**Subtasks**:
- [ ] Add `GET /audit/summary` endpoint
- [ ] Return activity counts by:
  - User (top 10 most active)
  - Action type (count per action)
  - Resource type (count per resource)
  - Time period (daily/weekly)
- [ ] Accept date range parameter
- [ ] Scope to organization

**Acceptance Criteria**:
- Summary statistics returned
- Useful for activity dashboards

---

## Phase 2: Export Functionality (Week 2-3)

### TASK-2.6.17: Implement CSV Export
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Implement `exportToCsv(filters, orgId)` method
- [ ] Apply same filters as list endpoint
- [ ] Generate CSV with columns:
  - Timestamp, User, Action, Resource, Resource ID, Status, IP, Changes
- [ ] Handle large exports with streaming
- [ ] Set appropriate response headers for download
- [ ] Add `POST /audit/logs/export?format=csv` endpoint

**Acceptance Criteria**:
- CSV downloads correctly
- Large exports don't timeout
- Filters respected

---

### TASK-2.6.18: Implement JSON Export
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/audit/audit.service.ts`

**Subtasks**:
- [ ] Implement `exportToJson(filters, orgId)` method
- [ ] Apply same filters as list endpoint
- [ ] Include all log details including changes
- [ ] Handle large exports with streaming
- [ ] Add `POST /audit/logs/export?format=json` endpoint

**Acceptance Criteria**:
- JSON downloads correctly
- Full details included
- Streaming for large exports

---

## Phase 3: Frontend Enhancement (Week 3)

### TASK-2.6.19: Enhance Audit Log Viewer Page
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/settings/audit-logs/page.tsx`

**Subtasks**:
- [ ] Add date range picker (start/end date)
- [ ] Add action type filter dropdown
- [ ] Add resource type filter dropdown
- [ ] Add user filter (autocomplete user search)
- [ ] Add status filter (success/failure)
- [ ] Add search input for text search
- [ ] Add sort by options
- [ ] Update table to show all columns
- [ ] Add "Clear filters" button

**Acceptance Criteria**:
- All filters functional
- Filters update URL params
- Table updates with filter changes

---

### TASK-2.6.20: Create Log Detail Modal/Page
**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/audit/AuditLogDetail.tsx` (new)

**Subtasks**:
- [ ] Create detail view component
- [ ] Display all log fields:
  - Timestamp, User, Action, Resource
  - IP address, User agent, Location
  - Request ID
  - Status (success/failure badge)
- [ ] Display changes in diff format (before/after)
- [ ] Show related resource link if applicable
- [ ] Can be modal or separate page

**Acceptance Criteria**:
- Full details displayed
- Changes shown in readable format
- Navigation to related resource

---

### TASK-2.6.21: Add Export Buttons
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/app/dashboard/settings/audit-logs/page.tsx`

**Subtasks**:
- [ ] Add "Export CSV" button
- [ ] Add "Export JSON" button
- [ ] Export respects current filters
- [ ] Show loading state during export
- [ ] Trigger file download on completion

**Acceptance Criteria**:
- Exports work with current filters
- File downloads correctly

---

### TASK-2.6.22: Add Activity Summary Widget
**Priority**: LOW | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/audit/ActivitySummary.tsx` (new)

**Subtasks**:
- [ ] Create summary widget showing:
  - Total actions today/this week
  - Top actions chart (pie/bar)
  - Most active users list
  - Recent activity timeline
- [ ] Can be added to audit logs page header
- [ ] Or to organization dashboard

**Acceptance Criteria**:
- Summary data displayed visually
- Updates with date range

---

### TASK-2.6.23: Add API Client Methods for Audit
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/lib/api/audit.ts` (new)

**Subtasks**:
- [ ] `listAuditLogs(orgId, filters)` - GET /organizations/:id/audit-logs
- [ ] `getAuditLog(logId)` - GET /audit/logs/:id
- [ ] `exportAuditLogs(orgId, format, filters)` - POST /audit/logs/export
- [ ] `getActivitySummary(orgId, dateRange)` - GET /audit/summary
- [ ] Handle error responses

**Acceptance Criteria**:
- All methods implemented
- Type safety with TypeScript

---

## Phase 4: Testing (Week 3-4)

### TASK-2.6.24: Write Audit Service Unit Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/api/src/audit/audit.service.spec.ts`

**Test Cases**:
- [ ] Log event created successfully
- [ ] Changes captured correctly (before/after)
- [ ] Request context captured
- [ ] Sensitive fields excluded from changes
- [ ] Old logs cleaned up correctly
- [ ] Retention policy respected

**Acceptance Criteria**:
- All tests pass
- Coverage > 80%

---

### TASK-2.6.25: Write E2E Tests - Logging Integration
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3-4 hours
**File**: `apps/web/e2e/audit-logs.spec.ts`

**Test Cases**:
- [ ] AUD-001: Link creation creates audit log
- [ ] AUD-002: Link update logs before/after values
- [ ] AUD-003: Link deletion creates audit log
- [ ] AUD-004: Member invite creates audit log
- [ ] AUD-005: Role change logs old/new role
- [ ] AUD-006: Login attempt is logged

**Acceptance Criteria**:
- All integration tests pass
- Audit logs verified in database

---

### TASK-2.6.26: Write E2E Tests - Log Viewer
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/audit-logs.spec.ts`

**Test Cases**:
- [ ] AUD-010: View audit logs
- [ ] AUD-011: Filter by action
- [ ] AUD-012: Filter by resource
- [ ] AUD-013: Filter by date range
- [ ] AUD-014: Filter by user
- [ ] AUD-015: Search within logs

**Acceptance Criteria**:
- All filter tests pass
- UI updates correctly

---

### TASK-2.6.27: Write E2E Tests - Export
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 1-2 hours
**File**: `apps/web/e2e/audit-logs.spec.ts`

**Test Cases**:
- [ ] AUD-020: Export logs as CSV
- [ ] AUD-021: Export logs as JSON
- [ ] AUD-022: Export respects filters

**Acceptance Criteria**:
- Export tests pass
- File content verified

---

### TASK-2.6.28: Write E2E Tests - Access Control
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/audit-logs.spec.ts`

**Test Cases**:
- [ ] AUD-030: OWNER can view all org logs
- [ ] AUD-031: ADMIN can view all org logs
- [ ] AUD-032: EDITOR can only view own activity
- [ ] AUD-033: VIEWER can only view own activity

**Acceptance Criteria**:
- RBAC tests pass
- Proper access enforcement

---

## Summary

| Phase | Task Count | Priority Breakdown |
|-------|------------|-------------------|
| Database Schema | 1 task | 1 HIGH |
| Event Logging Integration | 8 tasks | 5 HIGH, 3 MEDIUM |
| Audit Log Enhancement | 3 tasks | 1 HIGH, 2 MEDIUM |
| Enhanced Log Viewer API | 4 tasks | 2 HIGH, 1 MEDIUM, 1 LOW |
| Export Functionality | 2 tasks | 2 HIGH |
| Frontend Enhancement | 5 tasks | 3 HIGH, 1 MEDIUM, 1 LOW |
| Testing | 5 tasks | 3 HIGH, 2 MEDIUM |
| **Total** | **28 tasks** | **17 HIGH, 9 MEDIUM, 2 LOW** |

### Estimated Total Time: 45-55 hours

### Critical Path (Must complete first):
1. TASK-2.6.1: Schema enhancement
2. TASK-2.6.2: Helper methods
3. TASK-2.6.3-8: Service integrations
4. TASK-2.6.13: Enhanced list endpoint

### Dependencies Graph:
```
TASK-2.6.1 (Schema)
    └── TASK-2.6.2 (Helpers)
        ├── TASK-2.6.3 (Links)
        ├── TASK-2.6.4 (Domains)
        ├── TASK-2.6.5 (Organization)
        ├── TASK-2.6.6 (Auth)
        ├── TASK-2.6.7 (Developer)
        ├── TASK-2.6.8 (Payments)
        └── TASK-2.6.9 (Others)

TASK-2.6.10 (Changes) ─┬─ TASK-2.6.3-9 (All Services)
                       └─ TASK-2.6.20 (Detail UI)

TASK-2.6.13 (List API)
    ├── TASK-2.6.17 (CSV Export)
    ├── TASK-2.6.18 (JSON Export)
    └── TASK-2.6.19 (Enhanced UI)
```

### Key Implementation Note:
**The audit infrastructure already exists!** The main work is:
1. Calling `auditService.log()` in all business logic services
2. Enhancing the viewer with filters and export
3. Capturing before/after changes for updates

### Services Requiring Integration:
- `links.service.ts` - Link CRUD
- `domains.service.ts` - Domain management
- `organizations/organization.service.ts` - Org and team management
- `auth/auth.service.ts` - Security events
- `developer/developer.service.ts` - API keys
- `payments/payments.service.ts` - Billing
- `campaigns/campaigns.service.ts` - Campaigns
- `tags/tags.service.ts` - Tags
- `biopages/biopages.service.ts` - Bio pages
