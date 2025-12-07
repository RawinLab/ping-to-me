# Module 2.3: Role-Based Access Control (RBAC) Development Plan

## Document Information
- **Module**: 2.3 Role-Based Access Control
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Dependencies**: Module 2.1, 2.2

---

## 1. Executive Summary

### Current State Analysis
จากการ explore codebase พบว่า RBAC มีการ implement แบบ **basic** ประมาณ **30-40%**

**Current Implementation:**
- MemberRole enum exists (OWNER, ADMIN, EDITOR, VIEWER)
- Basic RolesGuard exists but underutilized
- @Roles decorator available
- Only audit controller uses RolesGuard properly
- Basic permission checks in organization service

**Critical Gaps:**
- Duplicate RolesGuard implementations
- Most controllers lack role-based guards
- No centralized permission matrix
- No frontend permission-based rendering
- No API token scope management
- Incomplete audit logging for access control

---

## 2. Feature Breakdown

### 2.3.1 Permission Matrix System (Priority: HIGH)
**Description:** Centralized permission definitions and checking

| Feature | Status | Priority |
|---------|--------|----------|
| Permission matrix constants | NOT IMPLEMENTED | HIGH |
| Role hierarchy (OWNER > ADMIN > EDITOR > VIEWER) | NOT IMPLEMENTED | HIGH |
| Resource-action based permissions | NOT IMPLEMENTED | HIGH |
| Context-aware permissions (own vs org) | NOT IMPLEMENTED | MEDIUM |
| Permission inheritance | NOT IMPLEMENTED | MEDIUM |

**Permission Matrix Definition:**
```typescript
// Master permission matrix
const PERMISSION_MATRIX: Record<MemberRole, Record<string, PermissionScope[]>> = {
  OWNER: {
    // Links
    'link:create': ['*'],
    'link:read': ['own', 'organization'],
    'link:update': ['*'],
    'link:delete': ['*'],
    'link:bulk': ['*'],
    'link:export': ['*'],
    // Analytics
    'analytics:read': ['*'],
    'analytics:export': ['*'],
    // Organization
    'organization:read': ['*'],
    'organization:update': ['*'],
    'organization:delete': ['*'],
    // Team
    'team:read': ['*'],
    'team:invite': ['*'],
    'team:update-role': ['*'],
    'team:remove': ['*'],
    // Domains
    'domain:create': ['*'],
    'domain:read': ['*'],
    'domain:update': ['*'],
    'domain:delete': ['*'],
    'domain:verify': ['*'],
    // Billing
    'billing:read': ['*'],
    'billing:manage': ['*'],
    // API Keys
    'api-key:create': ['*'],
    'api-key:read': ['*'],
    'api-key:revoke': ['*'],
    // Audit
    'audit:read': ['*'],
    'audit:export': ['*'],
    // Bio Pages
    'biopage:create': ['*'],
    'biopage:read': ['*'],
    'biopage:update': ['*'],
    'biopage:delete': ['*'],
    // Campaigns
    'campaign:create': ['*'],
    'campaign:read': ['*'],
    'campaign:update': ['*'],
    'campaign:delete': ['*'],
    // Tags
    'tag:create': ['*'],
    'tag:read': ['*'],
    'tag:update': ['*'],
    'tag:delete': ['*'],
  },
  ADMIN: {
    'link:create': ['*'],
    'link:read': ['own', 'organization'],
    'link:update': ['own', 'organization'],
    'link:delete': ['own', 'organization'],
    'link:bulk': ['organization'],
    'link:export': ['*'],
    'analytics:read': ['*'],
    'analytics:export': ['*'],
    'organization:read': ['*'],
    'organization:update': ['limited'],
    'team:read': ['*'],
    'team:invite': ['exclude-owner'],
    'team:update-role': ['exclude-owner'],
    'team:remove': ['exclude-owner'],
    'domain:create': ['*'],
    'domain:read': ['*'],
    'domain:update': ['*'],
    'domain:delete': ['*'],
    'domain:verify': ['*'],
    'billing:read': ['*'],
    'api-key:create': ['*'],
    'api-key:read': ['own', 'organization'],
    'api-key:revoke': ['own'],
    'audit:read': ['*'],
    'biopage:create': ['*'],
    'biopage:read': ['*'],
    'biopage:update': ['own', 'organization'],
    'biopage:delete': ['own', 'organization'],
    'campaign:create': ['*'],
    'campaign:read': ['*'],
    'campaign:update': ['*'],
    'campaign:delete': ['*'],
    'tag:create': ['*'],
    'tag:read': ['*'],
    'tag:update': ['*'],
    'tag:delete': ['*'],
  },
  EDITOR: {
    'link:create': ['*'],
    'link:read': ['own', 'organization'],
    'link:update': ['own'],
    'link:delete': ['own'],
    'link:export': ['own'],
    'analytics:read': ['own', 'organization'],
    'organization:read': ['*'],
    'team:read': ['*'],
    'domain:read': ['*'],
    'biopage:create': ['*'],
    'biopage:read': ['own', 'organization'],
    'biopage:update': ['own'],
    'biopage:delete': ['own'],
    'campaign:read': ['*'],
    'tag:create': ['*'],
    'tag:read': ['*'],
    'tag:update': ['own'],
  },
  VIEWER: {
    'link:read': ['organization'],
    'analytics:read': ['organization'],
    'organization:read': ['*'],
    'team:read': ['*'],
    'domain:read': ['*'],
    'biopage:read': ['organization'],
    'campaign:read': ['*'],
    'tag:read': ['*'],
  },
};
```

### 2.3.2 Backend Permission Guards (Priority: HIGH)
**Description:** NestJS guards and decorators for permission enforcement

| Feature | Status | Priority |
|---------|--------|----------|
| Consolidated RolesGuard | Partial (duplicate) | HIGH |
| @Permission decorator | NOT IMPLEMENTED | HIGH |
| PermissionGuard | NOT IMPLEMENTED | HIGH |
| API scope guard | NOT IMPLEMENTED | HIGH |
| Permission service | NOT IMPLEMENTED | HIGH |

**Files to Create:**
```
apps/api/src/auth/rbac/
├── permission-matrix.ts          # Permission definitions
├── permission.service.ts         # Permission checking service
├── permission.guard.ts           # NestJS guard
├── permission.decorator.ts       # @Permission decorator
├── role-hierarchy.ts             # Role hierarchy utilities
└── __tests__/
    ├── permission-matrix.spec.ts
    └── permission.guard.spec.ts
```

### 2.3.3 Frontend Permission System (Priority: HIGH)
**Description:** React context and components for permission-based UI

| Feature | Status | Priority |
|---------|--------|----------|
| Enhanced AuthContext with permissions | Partial | HIGH |
| usePermission hook | NOT IMPLEMENTED | HIGH |
| PermissionGate component | NOT IMPLEMENTED | HIGH |
| Role-based UI rendering | NOT IMPLEMENTED | HIGH |
| Permission error handling | NOT IMPLEMENTED | MEDIUM |

### 2.3.4 API Token Scopes (Priority: MEDIUM)
**Description:** Scoped API key system for developer access

| Feature | Status | Priority |
|---------|--------|----------|
| ApiKey scopes in database | NOT IMPLEMENTED | MEDIUM |
| Scope validation guard | NOT IMPLEMENTED | MEDIUM |
| @RequireScope decorator | NOT IMPLEMENTED | MEDIUM |
| Scope management UI | NOT IMPLEMENTED | LOW |
| IP whitelist for API keys | NOT IMPLEMENTED | LOW |

### 2.3.5 Access Audit Logging (Priority: MEDIUM)
**Description:** Comprehensive logging of access control events

| Feature | Status | Priority |
|---------|--------|----------|
| Log access granted/denied | NOT IMPLEMENTED | MEDIUM |
| Log permission check failures | NOT IMPLEMENTED | MEDIUM |
| Access pattern analysis | NOT IMPLEMENTED | LOW |
| Suspicious activity detection | NOT IMPLEMENTED | LOW |

---

## 3. Implementation Plan

### Phase 1: Core Permission System (Week 1-2)

#### Backend Tasks

1. **Create Permission Module**
   ```bash
   mkdir -p apps/api/src/auth/rbac
   ```

2. **Implement Permission Matrix Service**
   - Define permission matrix constants
   - Create role hierarchy utilities
   - Implement hasPermission method

3. **Create Permission Guard & Decorator**
   - @Permission decorator with resource/action
   - PermissionGuard that checks matrix
   - Support for context-aware permissions

4. **Refactor Existing Guards**
   - Remove duplicate RolesGuard
   - Update to use new permission system
   - Apply guards to all controllers

#### Controller Updates Required

| Controller | Current Guard | New Guard |
|------------|---------------|-----------|
| organization.controller | JwtAuthGuard | JwtAuthGuard + PermissionGuard |
| links.controller | JwtAuthGuard | JwtAuthGuard + PermissionGuard |
| campaigns.controller | AuthGuard | JwtAuthGuard + PermissionGuard |
| domains.controller | AuthGuard | JwtAuthGuard + PermissionGuard |
| tags.controller | AuthGuard | JwtAuthGuard + PermissionGuard |
| biopages.controller | AuthGuard | JwtAuthGuard + PermissionGuard |
| analytics.controller | JwtAuthGuard | JwtAuthGuard + PermissionGuard |
| developer.controller | JwtAuthGuard | JwtAuthGuard + PermissionGuard |
| audit.controller | JwtAuthGuard + RolesGuard | JwtAuthGuard + PermissionGuard |

### Phase 2: Frontend Integration (Week 2-3)

#### Tasks

1. **Enhance AuthContext**
   - Add permission matrix client-side
   - Create can() method
   - Track current organization role

2. **Create Permission Components**
   - PermissionGate component
   - usePermission hook
   - useCanAccess hook

3. **Update UI Components**
   - Add permission checks to buttons
   - Hide/disable unauthorized actions
   - Show permission error messages

### Phase 3: API Token Scopes (Week 3-4)

#### Tasks

1. **Database Schema Update**
   - Add scopes field to ApiKey model
   - Add ipWhitelist field
   - Run migration

2. **Enhance API Key Guard**
   - Validate scopes
   - Check IP whitelist
   - Log API access

3. **Create Scope Management**
   - Scope selection in API key creation
   - Scope display in developer portal

### Phase 4: Audit & Polish (Week 4)

#### Tasks

1. **Access Audit Logging**
   - Log permission checks
   - Log access denials
   - Create audit reports

2. **Testing & Documentation**
   - Unit tests for permission matrix
   - E2E tests for RBAC
   - API documentation

---

## 4. Test Cases

### 4.1 Unit Tests (Backend)

#### Permission Matrix Tests
```typescript
describe('PermissionMatrixService', () => {
  describe('hasPermission', () => {
    // OWNER tests
    it('should grant OWNER all permissions')
    it('should grant OWNER delete organization permission')
    it('should grant OWNER billing management')

    // ADMIN tests
    it('should grant ADMIN most permissions')
    it('should deny ADMIN delete organization')
    it('should deny ADMIN billing management')
    it('should allow ADMIN to invite non-OWNER roles')
    it('should deny ADMIN to invite OWNER role')

    // EDITOR tests
    it('should grant EDITOR create link permission')
    it('should grant EDITOR update own link')
    it('should deny EDITOR update others link')
    it('should deny EDITOR team management')
    it('should deny EDITOR domain management')

    // VIEWER tests
    it('should grant VIEWER read link permission')
    it('should deny VIEWER create link')
    it('should deny VIEWER update link')
    it('should deny VIEWER delete link')
    it('should grant VIEWER read analytics')
  })

  describe('Role Hierarchy', () => {
    it('OWNER should satisfy ADMIN requirement')
    it('OWNER should satisfy EDITOR requirement')
    it('OWNER should satisfy VIEWER requirement')
    it('ADMIN should satisfy EDITOR requirement')
    it('ADMIN should satisfy VIEWER requirement')
    it('ADMIN should NOT satisfy OWNER requirement')
    it('EDITOR should satisfy VIEWER requirement')
    it('EDITOR should NOT satisfy ADMIN requirement')
    it('VIEWER should only satisfy VIEWER requirement')
  })

  describe('Context-aware Permissions', () => {
    it('should allow EDITOR to delete own resource')
    it('should deny EDITOR to delete others resource')
    it('should allow ADMIN to delete any resource in org')
    it('should deny access to resources outside org')
  })

  describe('Edge Cases', () => {
    it('should deny permission for non-existent resource')
    it('should deny permission for invalid role')
    it('should handle null organization context')
    it('should handle null user context')
  })
})
```

#### Permission Guard Tests
```typescript
describe('PermissionGuard', () => {
  describe('canActivate', () => {
    it('should allow access when user has permission')
    it('should deny access when user lacks permission')
    it('should extract orgId from route params')
    it('should extract orgId from body')
    it('should extract orgId from query')
    it('should throw ForbiddenException on denial')
    it('should log access attempt')
    it('should handle missing permission decorator')
  })

  describe('Integration with JWT', () => {
    it('should work with JwtAuthGuard')
    it('should extract user from JWT')
    it('should handle expired JWT')
    it('should handle invalid JWT')
  })
})
```

#### API Key Scope Tests
```typescript
describe('ApiScopeGuard', () => {
  describe('canActivate', () => {
    it('should allow access with required scope')
    it('should deny access without required scope')
    it('should allow access with ADMIN scope')
    it('should validate IP whitelist')
    it('should enforce rate limits')
    it('should log API key usage')
  })

  describe('Scope Validation', () => {
    it('should validate link:read scope')
    it('should validate link:create scope')
    it('should validate analytics:read scope')
    it('should deny invalid scope format')
  })
})
```

### 4.2 E2E Tests

#### File: `apps/web/e2e/rbac.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  test.describe('OWNER Role', () => {
    test('RBAC-001: OWNER can access organization settings', async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Verify all settings accessible
      // 4. Verify delete organization button visible
    });

    test('RBAC-002: OWNER can manage all members', async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to team management
      // 3. Verify can invite any role
      // 4. Verify can remove any member
      // 5. Verify can change any role
    });

    test('RBAC-003: OWNER can access billing', async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to billing
      // 3. Verify billing page accessible
      // 4. Verify can modify subscription
    });

    test('RBAC-004: OWNER can manage all links', async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to links
      // 3. Verify can edit any link
      // 4. Verify can delete any link
      // 5. Verify bulk actions available
    });
  });

  test.describe('ADMIN Role', () => {
    test('RBAC-010: ADMIN can access limited organization settings', async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization settings
      // 3. Verify can update name
      // 4. Verify cannot delete organization
    });

    test('RBAC-011: ADMIN can manage non-OWNER members', async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to team management
      // 3. Verify can invite ADMIN, EDITOR, VIEWER
      // 4. Verify cannot invite OWNER
      // 5. Verify cannot remove OWNER
      // 6. Verify cannot change OWNER role
    });

    test('RBAC-012: ADMIN cannot access billing management', async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Verify billing link hidden or disabled
      // 3. Try direct URL access
      // 4. Verify access denied
    });

    test('RBAC-013: ADMIN can manage organization links', async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to links
      // 3. Verify can edit any link
      // 4. Verify can delete any link
    });
  });

  test.describe('EDITOR Role', () => {
    test('RBAC-020: EDITOR cannot access organization settings', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Verify settings link hidden
      // 3. Try direct URL access
      // 4. Verify access denied or limited view
    });

    test('RBAC-021: EDITOR cannot manage team', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Navigate to team page
      // 3. Verify invite button hidden
      // 4. Verify role change disabled
      // 5. Verify remove button hidden
    });

    test('RBAC-022: EDITOR can create links', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Navigate to links
      // 3. Create new link
      // 4. Verify link created successfully
    });

    test('RBAC-023: EDITOR can only edit own links', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Create a link
      // 3. Verify can edit own link
      // 4. Try to edit another user's link
      // 5. Verify edit button hidden or disabled
    });

    test('RBAC-024: EDITOR can only delete own links', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Create a link
      // 3. Verify can delete own link
      // 4. Try to delete another user's link
      // 5. Verify delete button hidden or disabled
    });

    test('RBAC-025: EDITOR can view organization analytics', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Navigate to analytics
      // 3. Verify can view analytics
      // 4. Verify cannot export all (if restricted)
    });
  });

  test.describe('VIEWER Role', () => {
    test('RBAC-030: VIEWER has read-only access', async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Navigate to dashboard
      // 3. Verify links visible
      // 4. Verify no create button
      // 5. Verify no edit buttons
      // 6. Verify no delete buttons
    });

    test('RBAC-031: VIEWER cannot create links', async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Verify create link button hidden
      // 3. Try direct URL access to /links/create
      // 4. Verify access denied
    });

    test('RBAC-032: VIEWER can view analytics', async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Navigate to analytics
      // 3. Verify can view charts
      // 4. Verify export button hidden (if restricted)
    });

    test('RBAC-033: VIEWER can view team members', async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Navigate to team page
      // 3. Verify can see member list
      // 4. Verify no management actions
    });
  });

  test.describe('Permission Enforcement', () => {
    test('RBAC-040: API returns 403 for unauthorized action', async ({ page, request }) => {
      // 1. Login as VIEWER
      // 2. Get auth token
      // 3. Try to POST /links (create)
      // 4. Verify 403 response
    });

    test('RBAC-041: Direct URL access is blocked', async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Try to access /dashboard/billing directly
      // 3. Verify redirect or 403 page
    });

    test('RBAC-042: Role change takes effect immediately', async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Change own role to VIEWER
      // 3. Refresh page
      // 4. Verify permissions updated
    });

    test('RBAC-043: Multi-org permission isolation', async ({ page }) => {
      // 1. Login as user in 2 orgs
      // 2. User is OWNER in org1, VIEWER in org2
      // 3. Switch to org1 - verify OWNER access
      // 4. Switch to org2 - verify VIEWER access
    });
  });

  test.describe('API Token Scopes', () => {
    test('RBAC-050: API key with read scope cannot write', async ({ request }) => {
      // 1. Create API key with link:read scope only
      // 2. Try GET /links - should succeed
      // 3. Try POST /links - should fail with 403
    });

    test('RBAC-051: API key with write scope can create', async ({ request }) => {
      // 1. Create API key with link:create scope
      // 2. Try POST /links - should succeed
      // 3. Try DELETE /links/:id - should fail (no delete scope)
    });

    test('RBAC-052: API key respects organization scope', async ({ request }) => {
      // 1. Create API key for org1
      // 2. Try to access org2 resources
      // 3. Verify access denied
    });

    test('RBAC-053: Expired API key is rejected', async ({ request }) => {
      // 1. Create API key with past expiration
      // 2. Try any request
      // 3. Verify 401 unauthorized
    });
  });
});
```

### 4.3 Integration Tests

```typescript
describe('RBAC Integration Tests', () => {
  describe('Permission Service + Database', () => {
    it('should fetch member role from database')
    it('should cache member role for performance')
    it('should invalidate cache on role change')
  })

  describe('Guard Chain', () => {
    it('JwtAuthGuard runs before PermissionGuard')
    it('Permission denied returns 403 not 401')
    it('Guards work with Swagger documentation')
  })

  describe('Audit Integration', () => {
    it('should log successful access')
    it('should log denied access')
    it('should include user and org context')
    it('should include request details')
  })
})
```

---

## 5. API Specification

### 5.1 Permission Decorators

#### @Permission Decorator
```typescript
// Usage on controllers/handlers
@Controller('links')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LinksController {
  @Get()
  @Permission({ resource: 'link', action: 'read' })
  async findAll() { }

  @Post()
  @Permission({ resource: 'link', action: 'create' })
  async create() { }

  @Patch(':id')
  @Permission({ resource: 'link', action: 'update', context: 'own' })
  async update() { }

  @Delete(':id')
  @Permission({ resource: 'link', action: 'delete', context: 'own' })
  async delete() { }
}
```

### 5.2 Permission Response Format

#### 403 Forbidden Response
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions for link:delete",
  "error": "Forbidden",
  "details": {
    "requiredPermission": "link:delete",
    "userRole": "EDITOR",
    "context": "organization"
  }
}
```

### 5.3 API Key Scopes

#### Available Scopes
```yaml
scopes:
  # Link scopes
  link:read:     "View links"
  link:create:   "Create links"
  link:update:   "Update links"
  link:delete:   "Delete links"
  link:export:   "Export links"

  # Analytics scopes
  analytics:read:   "View analytics"
  analytics:export: "Export analytics"

  # Domain scopes
  domain:read:    "View domains"
  domain:manage:  "Manage domains"

  # Campaign scopes
  campaign:read:    "View campaigns"
  campaign:manage:  "Manage campaigns"

  # Tag scopes
  tag:read:    "View tags"
  tag:manage:  "Manage tags"

  # Full access
  admin:       "Full organization access"
```

#### Create API Key Request
```yaml
POST /developer/api-keys
body:
  name: string
  scopes: string[]
  ipWhitelist?: string[]
  expiresAt?: string (ISO date)
response:
  201:
    id: string
    key: string  # Only shown once
    name: string
    scopes: string[]
    createdAt: string
```

### 5.4 Permission Check Endpoint (Optional)

#### GET /rbac/permissions
```yaml
description: Get current user's permissions
auth: Required
response:
  200:
    role: MemberRole
    organizationId: string
    permissions:
      - resource: string
        action: string
        scope: string[]
    canInviteRoles: MemberRole[]
    canAccessFeatures:
      - billing: boolean
      - audit: boolean
      - domains: boolean
```

---

## 6. Frontend Components Specification

### 6.1 Enhanced AuthContext

```typescript
// apps/web/contexts/AuthContext.tsx

interface PermissionContext {
  can: (resource: string, action: string) => boolean;
  canAny: (permissions: [string, string][]) => boolean;
  canAll: (permissions: [string, string][]) => boolean;
  role: MemberRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentOrganization: OrganizationContext | null;
  organizations: OrganizationContext[];
  permissions: PermissionContext;
  switchOrganization: (orgId: string) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
```

### 6.2 PermissionGate Component

```typescript
// apps/web/components/PermissionGate.tsx

interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
  showError = false,
}: PermissionGateProps) {
  const { permissions } = useAuth();

  if (!permissions.can(resource, action)) {
    if (showError) {
      return <PermissionDeniedMessage resource={resource} action={action} />;
    }
    return fallback;
  }

  return children;
}

// Usage:
<PermissionGate resource="link" action="delete">
  <DeleteButton onClick={handleDelete} />
</PermissionGate>

<PermissionGate resource="billing" action="manage" fallback={<UpgradePrompt />}>
  <BillingManagement />
</PermissionGate>
```

### 6.3 usePermission Hook

```typescript
// apps/web/hooks/usePermission.ts

export function usePermission() {
  const { permissions, currentOrganization } = useAuth();

  return {
    can: permissions.can,
    canAny: permissions.canAny,
    canAll: permissions.canAll,

    // Convenience methods
    canCreateLink: () => permissions.can('link', 'create'),
    canEditLink: () => permissions.can('link', 'update'),
    canDeleteLink: () => permissions.can('link', 'delete'),
    canManageTeam: () => permissions.can('team', 'invite'),
    canAccessBilling: () => permissions.can('billing', 'manage'),
    canAccessAudit: () => permissions.can('audit', 'read'),
    canManageDomains: () => permissions.can('domain', 'manage'),

    // Role checks
    isOwner: currentOrganization?.role === 'OWNER',
    isAdmin: ['OWNER', 'ADMIN'].includes(currentOrganization?.role || ''),
    isEditorOrAbove: ['OWNER', 'ADMIN', 'EDITOR'].includes(currentOrganization?.role || ''),
  };
}
```

### 6.4 Role Badge Component

```typescript
// apps/web/components/RoleBadge.tsx

interface RoleBadgeProps {
  role: MemberRole;
  showDescription?: boolean;
}

const roleConfig = {
  OWNER: { color: 'purple', icon: Crown, description: 'Full access' },
  ADMIN: { color: 'blue', icon: Shield, description: 'Manage team & content' },
  EDITOR: { color: 'green', icon: Edit, description: 'Create & edit content' },
  VIEWER: { color: 'gray', icon: Eye, description: 'View only' },
};

export function RoleBadge({ role, showDescription }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {role}
      {showDescription && (
        <span className="text-xs ml-1">({config.description})</span>
      )}
    </Badge>
  );
}
```

---

## 7. Security Considerations

### 7.1 Permission Checking
- Always check permissions server-side
- Never trust frontend-only checks
- Use constant-time comparison for sensitive operations
- Deny by default (whitelist approach)

### 7.2 Token Security
- Hash API keys before storage
- Use secure random for token generation
- Implement rate limiting
- Track and log all API key usage

### 7.3 Audit Requirements
- Log all permission checks
- Log all access denials
- Include context (user, org, resource, action)
- Retain logs for compliance (90+ days)

### 7.4 Common Vulnerabilities to Prevent
- IDOR (Insecure Direct Object Reference)
- Privilege escalation
- Broken access control
- Missing function-level access control

---

## 8. Database Schema Updates

### 8.1 ApiKey Model Enhancement

```prisma
model ApiKey {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  keyHash        String    @unique
  keyPrefix      String    // First 8 chars for identification
  name           String
  scopes         String[]  // NEW: Array of permission scopes
  ipWhitelist    String[]? // NEW: Optional IP allowlist
  rateLimit      Int?      // NEW: Requests per minute
  organizationId String    @db.Uuid
  userId         String    @db.Uuid
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime  @default(now())
  revokedAt      DateTime?

  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])

  @@index([keyHash])
  @@index([organizationId])
}
```

### 8.2 AccessLog Model (Optional)

```prisma
model AccessLog {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String?  @db.Uuid
  apiKeyId       String?  @db.Uuid
  organizationId String?  @db.Uuid
  resource       String
  action         String
  result         String   // ALLOWED, DENIED
  reason         String?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([userId, createdAt])
  @@index([result, createdAt])
}
```

---

## 9. Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | Permission matrix, guards, decorators |
| Phase 2 | 1 week | Frontend permission system |
| Phase 3 | 1 week | API token scopes |
| Phase 4 | 1 week | Audit logging, testing |
| **Total** | **5 weeks** | Complete Module 2.3 |

---

## 10. Success Metrics

- **Zero unauthorized access** in production
- **100% endpoint coverage** with permission guards
- **< 5ms overhead** for permission checks
- **All permission denials logged**
- **Frontend/backend permission consistency**

---

## Appendix A: Current Implementation Files

**Backend:**
- `apps/api/src/auth/guards/roles.guard.ts` - Duplicate implementations
- `apps/api/src/auth/roles.decorator.ts` - Basic @Roles decorator
- `apps/api/src/auth/guards/jwt-auth.guard.ts` - JWT guard
- `apps/api/src/organizations/organization.service.ts` - Manual permission checks

**Frontend:**
- `apps/web/contexts/AuthContext.tsx` - Basic auth context
- No permission components exist

**Database:**
- `packages/database/prisma/schema.prisma` - MemberRole enum

---

## Appendix B: Research Sources

1. NestJS RBAC Documentation
2. OWASP Access Control Cheat Sheet
3. WorkOS RBAC Guide
4. Cerbos Authorization Model
5. Auth0 Role-Based Access Control
6. EnterpriseReady RBAC Features
