# Audit Logging System Reference

> This document contains detailed documentation for the Audit Logging system.
> **All new features should implement audit logging** to ensure proper activity tracking and compliance.

## Overview

The audit logging system tracks all significant actions performed in the application, including:
- Resource CRUD operations (links, domains, organizations, etc.)
- Security events (login, logout, 2FA changes, password changes)
- Team management (invites, role changes, member removal)
- Billing events (plan changes, subscription cancellation)

**Key Design Principles:**
- Non-blocking: Audit logging never blocks the main operation
- Sensitive data exclusion: Passwords, tokens, and secrets are never logged
- Change tracking: Before/after values for update operations
- Context capture: IP address, user agent, request ID for correlation

---

## File Structure

```
apps/api/src/audit/
├── audit.module.ts       # Global module (available everywhere)
├── audit.service.ts      # Core logging service with helper methods
├── audit.controller.ts   # API endpoints for log retrieval/export
└── __tests__/
    └── audit.service.spec.ts

apps/web/app/dashboard/settings/audit-logs/
└── page.tsx              # Audit log viewer UI

packages/database/prisma/schema.prisma
└── AuditLog model        # Database schema
```

---

## Database Schema

```prisma
model AuditLog {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String?  @db.Uuid
  organizationId String?  @db.Uuid
  action         String   // e.g., 'link.created', 'auth.login'
  resource       String   // e.g., 'Link', 'Domain', 'User'
  resourceId     String?  // ID of the affected resource
  status         String   @default("success") // 'success' | 'failure'
  details        Json?    // Additional context
  changes        Json?    // { before: {...}, after: {...} }
  ipAddress      String?
  userAgent      String?
  geoLocation    String?  // e.g., 'US, California'
  requestId      String?  // For request correlation
  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([organizationId])
  @@index([action])
  @@index([resource])
  @@index([status])
  @@index([createdAt])
}
```

---

## Core Types

```typescript
// Data structure for creating audit logs
interface AuditLogData {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status?: 'success' | 'failure';
  details?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
  requestId?: string;
}

// Context from HTTP request
interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}
```

---

## Action Naming Convention

Actions follow the format: `{resource}.{action}`

### Resource Events

| Resource | Actions |
|----------|---------|
| Link | `link.created`, `link.updated`, `link.deleted`, `link.archived`, `link.restored`, `link.bulk_created`, `link.bulk_deleted` |
| Domain | `domain.added`, `domain.verified`, `domain.failed`, `domain.removed`, `domain.ssl_updated` |
| Organization | `org.created`, `org.updated`, `org.settings_changed`, `org.deleted` |
| Team | `member.invited`, `member.joined`, `member.role_changed`, `member.removed` |
| API Key | `api_key.created`, `api_key.rotated`, `api_key.revoked` |
| Billing | `billing.plan_changed`, `billing.subscription_cancelled`, `billing.payment_failed`, `billing.payment_succeeded` |
| Campaign | `campaign.created`, `campaign.updated`, `campaign.deleted` |
| Tag | `tag.created`, `tag.updated`, `tag.deleted` |
| Bio Page | `biopage.created`, `biopage.updated`, `biopage.deleted` |

### Security Events

| Action | Description |
|--------|-------------|
| `auth.login` | Successful login |
| `auth.logout` | User logout |
| `auth.failed_login` | Failed login attempt |
| `auth.2fa_enabled` | Two-factor authentication enabled |
| `auth.2fa_disabled` | Two-factor authentication disabled |
| `auth.password_changed` | Password changed |
| `auth.password_reset_requested` | Password reset requested |
| `auth.email_verified` | Email address verified |

---

## Backend Usage

### 1. Import AuditService

The `AuditModule` is global, so `AuditService` is available in any module:

```typescript
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MyService {
  constructor(private readonly auditService: AuditService) {}
}
```

### 2. Use Specialized Helper Methods

#### Link Events

```typescript
await this.auditService.logLinkEvent(
  userId,
  organizationId,
  'link.created',
  { id: link.id, slug: link.slug, targetUrl: link.targetUrl },
  {
    context: { ipAddress, userAgent },
    details: { customField: 'value' },
  }
);

// For updates with change tracking
const changes = this.auditService.captureChanges(beforeLink, afterLink);
await this.auditService.logLinkEvent(
  userId,
  organizationId,
  'link.updated',
  { id: link.id, slug: link.slug },
  { changes }
);
```

#### Domain Events

```typescript
await this.auditService.logDomainEvent(
  userId,
  organizationId,
  'domain.added',
  { id: domain.id, hostname: domain.hostname },
  { context: { ipAddress, userAgent } }
);

// For verification failure
await this.auditService.logDomainEvent(
  userId,
  organizationId,
  'domain.failed',
  { id: domain.id, hostname: domain.hostname },
  {
    status: 'failure',
    details: { error: 'DNS record not found' },
  }
);
```

#### Team/Member Events

```typescript
await this.auditService.logTeamEvent(
  userId,
  organizationId,
  'member.invited',
  { email: invitedEmail, role: 'EDITOR' },
  { context: { ipAddress, userAgent } }
);

// Role change with before/after
await this.auditService.logTeamEvent(
  userId,
  organizationId,
  'member.role_changed',
  { userId: targetUserId, role: newRole },
  {
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
  }
);
```

#### Organization Events

```typescript
await this.auditService.logOrgEvent(
  userId,
  organizationId,
  'org.updated',
  {
    changes: this.auditService.captureChanges(beforeOrg, afterOrg),
    context: { ipAddress, userAgent },
  }
);
```

#### Security Events

```typescript
// Login success
await this.auditService.logSecurityEvent(
  userId,
  'auth.login',
  { context: { ipAddress, userAgent } }
);

// Failed login (userId may be null)
await this.auditService.logSecurityEvent(
  null,
  'auth.failed_login',
  {
    status: 'failure',
    details: { email: attemptedEmail, reason: 'Invalid password' },
    context: { ipAddress, userAgent },
  }
);

// 2FA enabled
await this.auditService.logSecurityEvent(userId, 'auth.2fa_enabled');
```

#### Billing Events

```typescript
await this.auditService.logBillingEvent(
  userId,
  organizationId,
  'billing.plan_changed',
  {
    changes: {
      before: { plan: 'FREE' },
      after: { plan: 'PRO' },
    },
    details: { stripeSubscriptionId: 'sub_xxx' },
  }
);
```

#### API Key Events

```typescript
await this.auditService.logApiKeyEvent(
  userId,
  organizationId,
  'api_key.created',
  { id: apiKey.id, name: apiKey.name, scopes: apiKey.scopes }
);
```

#### Generic Resource Events

For resources without a specific helper:

```typescript
await this.auditService.logResourceEvent(
  userId,
  organizationId,
  'webhook.created',
  'Webhook',
  webhook.id,
  { details: { url: webhook.url, events: webhook.events } }
);
```

### 3. Capture Changes for Updates

Use `captureChanges()` to automatically detect and log field changes:

```typescript
// Fetch the entity BEFORE update
const beforeEntity = await this.prisma.link.findUnique({ where: { id } });

// Perform the update
const afterEntity = await this.prisma.link.update({
  where: { id },
  data: updateData,
});

// Capture only changed fields (sensitive fields auto-excluded)
const changes = this.auditService.captureChanges(beforeEntity, afterEntity);

// Log with changes
await this.auditService.logLinkEvent(
  userId,
  organizationId,
  'link.updated',
  { id: afterEntity.id, slug: afterEntity.slug },
  { changes }
);
```

**Sensitive fields automatically excluded:**
- `password`, `passwordHash`
- `twoFactorSecret`, `secret`
- `token`, `accessToken`, `refreshToken`
- `keyHash`, `apiKey`

### 4. Core Log Method (Low-Level)

For custom scenarios, use the base `log()` method:

```typescript
await this.auditService.log({
  userId,
  organizationId,
  action: 'custom.action',
  resource: 'CustomResource',
  resourceId: 'resource-123',
  status: 'success',
  details: { key: 'value' },
  changes: { before: {...}, after: {...} },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  requestId: 'req-abc-123',
});
```

---

## API Endpoints

### List Audit Logs

```
GET /audit/logs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Filter by action (e.g., `link.created`) |
| `resource` | string | Filter by resource (e.g., `Link`) |
| `status` | string | Filter by status (`success` or `failure`) |
| `userId` | string | Filter by user ID |
| `startDate` | ISO date | Start of date range |
| `endDate` | ISO date | End of date range |
| `search` | string | Search in action/resource |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset |
| `orgId` | string | Filter by organization |

### Get Single Log

```
GET /audit/logs/:id
```

### Get Activity Summary

```
GET /audit/summary?orgId=xxx&startDate=xxx&endDate=xxx
```

**Response:**
```json
{
  "total": 150,
  "byAction": { "link.created": 50, "link.updated": 30 },
  "byResource": { "Link": 80, "Domain": 20 },
  "byStatus": { "success": 145, "failure": 5 },
  "topUsers": [{ "userId": "...", "count": 50 }]
}
```

### Export Logs

```
POST /audit/logs/export?format=csv|json
```

Uses same query parameters as list endpoint.

### Organization-Scoped Logs

```
GET /organizations/:id/audit-logs
```

RBAC enforced:
- **OWNER/ADMIN**: Can view all logs in organization
- **EDITOR/VIEWER**: Can only view their own activity

---

## Frontend Usage

### Audit Logs Viewer Page

Located at `/dashboard/settings/audit-logs`

Features:
- Date range presets (24h, 7d, 30d, 90d, all time)
- Filter by action, resource, status
- Search functionality
- CSV/JSON export
- Pagination

### API Client Usage

```typescript
import { apiRequest } from '@/lib/api';

// Fetch logs
const { logs, total } = await apiRequest('/audit/logs', {
  params: {
    action: 'link.created',
    startDate: new Date().toISOString(),
    limit: 20,
  },
});

// Export
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/audit/logs/export?format=csv`,
  {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);
const blob = await response.blob();
```

---

## Adding Audit Logging to New Features

When creating a new module, follow these steps:

### Step 1: Inject AuditService

```typescript
// apps/api/src/new-feature/new-feature.service.ts
import { AuditService } from '../audit/audit.service';

@Injectable()
export class NewFeatureService {
  constructor(
    private readonly auditService: AuditService,
    // ... other dependencies
  ) {}
}
```

### Step 2: Add Logging to Create Operations

```typescript
async create(userId: string, orgId: string, data: CreateDto) {
  const entity = await this.prisma.newFeature.create({ data });

  // Log the creation
  await this.auditService.logResourceEvent(
    userId,
    orgId,
    'newfeature.created',
    'NewFeature',
    entity.id,
    { details: { name: entity.name } }
  );

  return entity;
}
```

### Step 3: Add Logging to Update Operations with Change Tracking

```typescript
async update(userId: string, orgId: string, id: string, data: UpdateDto) {
  // Capture BEFORE state
  const before = await this.prisma.newFeature.findUnique({ where: { id } });

  // Perform update
  const after = await this.prisma.newFeature.update({
    where: { id },
    data,
  });

  // Capture changes and log
  const changes = this.auditService.captureChanges(before, after);
  if (changes) {
    await this.auditService.logResourceEvent(
      userId,
      orgId,
      'newfeature.updated',
      'NewFeature',
      id,
      { changes }
    );
  }

  return after;
}
```

### Step 4: Add Logging to Delete Operations

```typescript
async delete(userId: string, orgId: string, id: string) {
  const entity = await this.prisma.newFeature.findUnique({ where: { id } });

  await this.prisma.newFeature.delete({ where: { id } });

  // Log deletion with entity details
  await this.auditService.logResourceEvent(
    userId,
    orgId,
    'newfeature.deleted',
    'NewFeature',
    id,
    { details: { name: entity.name } }
  );

  return { success: true };
}
```

### Step 5: Update ACTION_CONFIG in Frontend (Optional)

If you want nice labels in the audit log viewer:

```typescript
// apps/web/app/dashboard/settings/audit-logs/page.tsx

const ACTION_CONFIG = {
  // ... existing actions
  'newfeature.created': {
    label: 'Feature Created',
    color: 'bg-emerald-100 text-emerald-700',
    icon: Plus,
  },
  'newfeature.updated': {
    label: 'Feature Updated',
    color: 'bg-blue-100 text-blue-700',
    icon: Edit,
  },
  'newfeature.deleted': {
    label: 'Feature Deleted',
    color: 'bg-red-100 text-red-700',
    icon: Trash2,
  },
};

const RESOURCE_CONFIG = {
  // ... existing resources
  NewFeature: { label: 'New Feature', icon: Star },
};
```

---

## Best Practices

### DO

✅ Log all CRUD operations on important resources
✅ Use `captureChanges()` for update operations
✅ Include context (ipAddress, userAgent) when available
✅ Log failures with `status: 'failure'` and error details
✅ Use specific action names (`link.created` not `create`)
✅ Include resource IDs for traceability

### DON'T

❌ Log sensitive data (passwords, tokens, secrets)
❌ Block main operations if audit logging fails
❌ Log high-frequency events (every click, every page view)
❌ Include PII in logs without business need
❌ Use generic action names (`action.performed`)

---

## Retention & Cleanup

Audit logs can be cleaned up based on retention policy:

```typescript
// Clean up logs older than 90 days
const deletedCount = await this.auditService.cleanupOldLogs(90);
```

**Note:** Consider organization plan limits when implementing retention:
- Free: 30 days
- Pro: 90 days
- Enterprise: 365 days

---

## Testing

### Unit Tests Location
```
apps/api/src/audit/__tests__/audit.service.spec.ts
```

### E2E Tests
```
apps/web/e2e/audit-logs.spec.ts
```

### Key Test Scenarios

- Audit log created for resource operations
- Change tracking captures correct before/after values
- Sensitive fields excluded from logs
- Failed operations logged with `status: 'failure'`
- Filters work correctly (action, resource, date range)
- Export respects filters
- RBAC: OWNER/ADMIN see all, EDITOR/VIEWER see own
- Non-blocking: Main operation succeeds even if logging fails

---

## Troubleshooting

### Audit logs not appearing

1. Check `AuditModule` is imported in `AppModule` (should be global)
2. Verify `AuditService` is injected in your service
3. Check database connection and `AuditLog` table exists
4. Look for errors in console (logging failures are caught, not thrown)

### Missing changes in update logs

1. Ensure you fetch the entity BEFORE the update
2. Call `captureChanges(before, after)` after the update
3. Check if all fields are being compared (nested objects need JSON.stringify comparison)

### Performance concerns

1. Audit logging is async and non-blocking
2. Consider batching for bulk operations
3. Use appropriate indexes on `AuditLog` table
4. Implement retention policy to limit table size
