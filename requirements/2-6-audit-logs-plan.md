# Module 2.6: Audit/Activity Logs Development Plan

## Document Information
- **Module**: 2.6 Audit/Activity Logs
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Implementation**: ~30% Complete

---

## 1. Executive Summary

### Current State
- AuditLog database model exists with proper schema
- AuditService with helper methods implemented
- Frontend audit log viewer functional
- Module is globally available

### Critical Gap
**No actual audit logging calls in business logic** - The infrastructure exists but is not used anywhere in the codebase.

---

## 2. Feature Breakdown

### 2.6.1 Event Logging Integration (Priority: HIGH)

| Event Category | Status | Priority |
|----------------|--------|----------|
| Link operations (CRUD) | NOT INTEGRATED | HIGH |
| Domain operations | NOT INTEGRATED | HIGH |
| Team/member changes | NOT INTEGRATED | HIGH |
| Organization settings | NOT INTEGRATED | HIGH |
| Security events (2FA, login) | NOT INTEGRATED | HIGH |
| API key operations | NOT INTEGRATED | MEDIUM |
| Billing/plan changes | NOT INTEGRATED | MEDIUM |

### 2.6.2 Audit Log Enhancement (Priority: MEDIUM)

| Feature | Status | Priority |
|---------|--------|----------|
| Before/after values | NOT IMPLEMENTED | HIGH |
| Success/failure status | NOT IMPLEMENTED | MEDIUM |
| User agent parsing | Partial | LOW |
| Geographic location | NOT IMPLEMENTED | LOW |

### 2.6.3 Log Viewer Enhancement (Priority: MEDIUM)

| Feature | Status | Priority |
|---------|--------|----------|
| Basic filtering | Implemented | - |
| Date range picker | NOT IMPLEMENTED | MEDIUM |
| User filter | NOT IMPLEMENTED | MEDIUM |
| Search within logs | NOT IMPLEMENTED | MEDIUM |
| Sorting options | NOT IMPLEMENTED | LOW |

### 2.6.4 Export & Compliance (Priority: MEDIUM)

| Feature | Status | Priority |
|---------|--------|----------|
| CSV export | NOT IMPLEMENTED | HIGH |
| JSON export | NOT IMPLEMENTED | HIGH |
| Retention policy | NOT IMPLEMENTED | MEDIUM |
| Automated cleanup | NOT IMPLEMENTED | MEDIUM |

---

## 3. Events to Log

```typescript
// Link Events
'link.created'    - userId, orgId, linkId, slug, targetUrl
'link.updated'    - userId, orgId, linkId, changes (before/after)
'link.deleted'    - userId, orgId, linkId, slug
'link.archived'   - userId, orgId, linkId
'link.restored'   - userId, orgId, linkId

// Domain Events
'domain.added'     - userId, orgId, domainId, hostname
'domain.verified'  - userId, orgId, domainId, hostname
'domain.failed'    - userId, orgId, domainId, error
'domain.removed'   - userId, orgId, domainId, hostname
'domain.ssl_updated' - userId, orgId, domainId, status

// Team Events
'member.invited'    - userId, orgId, email, role
'member.joined'     - userId, orgId, invitedByUserId
'member.role_changed' - userId, orgId, targetUserId, oldRole, newRole
'member.removed'    - userId, orgId, targetUserId

// Organization Events
'org.created'       - userId, orgId, name
'org.updated'       - userId, orgId, changes
'org.settings_changed' - userId, orgId, setting, oldValue, newValue
'org.deleted'       - userId, orgId

// Security Events
'auth.login'        - userId, ipAddress, userAgent, success
'auth.logout'       - userId
'auth.2fa_enabled'  - userId
'auth.2fa_disabled' - userId
'auth.password_changed' - userId
'auth.failed_login' - email, ipAddress, reason

// API Key Events
'api_key.created'   - userId, orgId, keyId, name, scopes
'api_key.rotated'   - userId, orgId, keyId
'api_key.revoked'   - userId, orgId, keyId

// Billing Events
'billing.plan_changed' - userId, orgId, oldPlan, newPlan
'billing.subscription_cancelled' - userId, orgId
```

---

## 4. Database Schema Updates

```prisma
model AuditLog {
  id             String   @id @default(uuid())
  userId         String?  @db.Uuid
  organizationId String?  @db.Uuid
  action         String   // e.g., 'link.created'
  resource       String   // e.g., 'Link'
  resourceId     String?
  status         String   @default("success") // 'success' | 'failure'

  // Change tracking
  changes        Json?    // { before: {...}, after: {...} }

  // Request context
  ipAddress      String?
  userAgent      String?
  geoLocation    String?  // 'US, California'
  requestId      String?  // For correlation

  createdAt      DateTime @default(now())

  user           User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([organizationId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}
```

---

## 5. API Endpoints

```yaml
# Existing (enhanced)
GET    /audit/logs                     - List logs (enhanced filters)
GET    /audit/my-activity              - User's own activity

# New Endpoints
GET    /organizations/:id/audit-log    - Org-scoped logs
GET    /audit/logs/:id                 - Single log details
POST   /audit/logs/export              - Export as CSV/JSON
POST   /audit/logs/search              - Advanced search
GET    /audit/summary                  - Activity summary by user/action
DELETE /audit/logs/cleanup             - Manual cleanup (admin)
```

---

## 6. Integration Points

### Services to Update

```typescript
// links.service.ts
async create(userId: string, dto: CreateLinkDto) {
  const link = await this.prisma.link.create({...});
  await this.auditService.log({
    userId,
    organizationId: link.organizationId,
    action: 'link.created',
    resource: 'Link',
    resourceId: link.id,
    details: { slug: link.slug, targetUrl: link.targetUrl }
  });
  return link;
}

// organization.service.ts
async inviteMember(...) {
  // ... existing logic
  await this.auditService.log({
    userId,
    organizationId: orgId,
    action: 'member.invited',
    resource: 'OrganizationMember',
    details: { email, role }
  });
}

// Similar pattern for all other services
```

---

## 7. Test Cases

### E2E Tests: `apps/web/e2e/audit-logs.spec.ts`

```typescript
test.describe('Audit Logs', () => {
  // Logging Integration
  test('AUD-001: Link creation creates audit log')
  test('AUD-002: Link update logs before/after values')
  test('AUD-003: Link deletion creates audit log')
  test('AUD-004: Member invite creates audit log')
  test('AUD-005: Role change logs old/new role')
  test('AUD-006: Login attempt is logged')

  // Log Viewer
  test('AUD-010: View audit logs')
  test('AUD-011: Filter by action')
  test('AUD-012: Filter by resource')
  test('AUD-013: Filter by date range')
  test('AUD-014: Filter by user')
  test('AUD-015: Search within logs')

  // Export
  test('AUD-020: Export logs as CSV')
  test('AUD-021: Export logs as JSON')
  test('AUD-022: Export respects filters')

  // Access Control
  test('AUD-030: OWNER can view all org logs')
  test('AUD-031: ADMIN can view all org logs')
  test('AUD-032: EDITOR can only view own activity')
  test('AUD-033: VIEWER can only view own activity')
});
```

---

## 8. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1 week | Integrate logging into all services |
| Phase 2 | 1 week | Enhanced log viewer, filters, search |
| Phase 3 | 1 week | Export functionality, retention policy |
| **Total** | **3 weeks** | Complete Module 2.6 |

---

## 9. Current Implementation Files

- `apps/api/src/audit/audit.service.ts` - Core service (ready)
- `apps/api/src/audit/audit.controller.ts` - Endpoints (partial)
- `apps/web/app/dashboard/settings/audit-logs/page.tsx` - UI (functional)
- `packages/database/prisma/schema.prisma` - AuditLog model (ready)
