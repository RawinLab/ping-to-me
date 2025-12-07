# RBAC Permission System Reference

> This document contains detailed documentation for the Role-Based Access Control (RBAC) system.
> **All new modules must follow this pattern** to ensure consistent authorization.

## File Structure

```
apps/api/src/auth/rbac/
├── permission-matrix.ts      # Permission definitions (single source of truth)
├── role-hierarchy.ts         # Role level utilities
├── permission.decorator.ts   # @Permission, @RequirePermissions decorators
├── permission.guard.ts       # NestJS guard for route protection
├── permission.service.ts     # Permission checking service
├── api-scopes.ts             # API token scopes for developer API
├── require-scope.decorator.ts# @RequireScope decorator for API tokens
├── access-log.service.ts     # Access logging for audit
└── index.ts                  # Module exports

apps/web/lib/permissions/
├── permission-matrix.ts      # Frontend mirror (must sync with backend)
└── index.ts

apps/web/hooks/usePermission.ts       # React hook for permission checks
apps/web/components/PermissionGate.tsx # Component for conditional rendering
```

---

## Core Types

```typescript
// Resources that can be controlled by RBAC
type Resource =
  | 'link' | 'analytics' | 'organization' | 'team' | 'domain'
  | 'billing' | 'api-key' | 'audit' | 'biopage' | 'campaign' | 'tag';

// Actions that can be performed on resources
type Action =
  | 'create' | 'read' | 'update' | 'delete' | 'bulk' | 'export'
  | 'invite' | 'verify' | 'manage' | 'update-role' | 'remove' | 'revoke';

// Permission scope defines access boundary
type PermissionScope =
  | '*'              // Full access to all resources
  | 'own'            // Access only to resources owned by the user
  | 'organization'   // Access to all resources within the organization
  | 'limited'        // Limited access (e.g., some settings but not all)
  | 'exclude-owner'; // Access to all except owner (for team management)
```

---

## Role Hierarchy

```typescript
// Higher number = more permissions
ROLE_HIERARCHY = {
  OWNER: 4,   // Full access, can delete org, manage billing
  ADMIN: 3,   // Most access, cannot delete org or manage billing
  EDITOR: 2,  // Create/edit own content, view org content
  VIEWER: 1,  // Read-only access
};
```

**Key Rules:**
- A user can only manage roles **below** their level
- OWNER can assign any role
- ADMIN can assign ADMIN, EDITOR, VIEWER (not OWNER)
- EDITOR can assign EDITOR, VIEWER
- VIEWER cannot manage roles

---

## Permission Matrix Summary

| Resource       | OWNER | ADMIN | EDITOR | VIEWER |
|----------------|-------|-------|--------|--------|
| link:create    | ✓     | ✓     | ✓      | ✗      |
| link:read      | ✓     | ✓     | own/org| org    |
| link:update    | ✓     | ✓     | own    | ✗      |
| link:delete    | ✓     | ✓     | own    | ✗      |
| link:bulk      | ✓     | org   | ✗      | ✗      |
| link:export    | ✓     | ✓     | own    | ✗      |
| analytics:read | ✓     | ✓     | own/org| org    |
| analytics:export| ✓    | ✓     | ✗      | ✗      |
| organization:read | ✓  | ✓     | ✓      | ✓      |
| organization:update | ✓| limited| ✗     | ✗      |
| organization:delete | ✓| ✗     | ✗      | ✗      |
| team:read      | ✓     | ✓     | ✓      | ✓      |
| team:invite    | ✓     | excl-owner | ✗  | ✗      |
| team:update-role| ✓    | excl-owner | ✗  | ✗      |
| team:remove    | ✓     | excl-owner | ✗  | ✗      |
| domain:create  | ✓     | ✓     | ✗      | ✗      |
| domain:read    | ✓     | ✓     | ✓      | ✓      |
| domain:update  | ✓     | ✓     | ✗      | ✗      |
| domain:delete  | ✓     | ✓     | ✗      | ✗      |
| domain:verify  | ✓     | ✓     | ✗      | ✗      |
| billing:read   | ✓     | ✓     | ✗      | ✗      |
| billing:manage | ✓     | ✗     | ✗      | ✗      |
| api-key:create | ✓     | ✓     | ✗      | ✗      |
| api-key:read   | ✓     | own/org| ✗     | ✗      |
| api-key:revoke | ✓     | own   | ✗      | ✗      |
| audit:read     | ✓     | ✓     | ✗      | ✗      |
| audit:export   | ✓     | ✗     | ✗      | ✗      |
| biopage:create | ✓     | ✓     | ✓      | ✗      |
| biopage:read   | ✓     | ✓     | own/org| org    |
| biopage:update | ✓     | own/org| own   | ✗      |
| biopage:delete | ✓     | own/org| own   | ✗      |
| campaign:*     | ✓     | ✓     | read   | read   |
| tag:create     | ✓     | ✓     | ✓      | ✗      |
| tag:read       | ✓     | ✓     | ✓      | ✓      |
| tag:update     | ✓     | ✓     | own    | ✗      |
| tag:delete     | ✓     | ✓     | ✗      | ✗      |

---

## Backend Usage

### 1. Protect Controller Endpoints

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';

@Controller('links')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LinksController {

  @Get()
  @Permission({ resource: 'link', action: 'read' })
  findAll() {}

  @Post()
  @Permission({ resource: 'link', action: 'create' })
  create() {}

  // 'own' context - user can only update their own links
  @Patch(':id')
  @Permission({ resource: 'link', action: 'update', context: 'own' })
  update() {}

  // Multiple permissions (OR) - user needs ANY of these
  @Delete(':id')
  @Permission([
    { resource: 'link', action: 'delete' },
    { resource: 'link', action: 'bulk' }
  ])
  delete() {}
}
```

### 2. Require ALL Permissions (AND condition)

```typescript
import { RequirePermissions } from '../auth/rbac';

@Get('export')
@RequirePermissions([
  { resource: 'link', action: 'read' },
  { resource: 'analytics', action: 'export' }
])
exportLinkAnalytics() {}
```

### 3. Use PermissionService in Business Logic

```typescript
import { PermissionService } from '../auth/rbac';

@Injectable()
export class MyService {
  constructor(private permissionService: PermissionService) {}

  async doSomething(userId: string, orgId: string) {
    // Check single permission
    const canCreate = await this.permissionService.hasPermission(
      userId, orgId, 'link', 'create'
    );

    // Check multiple permissions (ANY)
    const canModify = await this.permissionService.hasAnyPermission(
      userId, orgId, [
        { resource: 'link', action: 'update' },
        { resource: 'link', action: 'delete' }
      ]
    );

    // Check multiple permissions (ALL)
    const canExport = await this.permissionService.hasAllPermissions(
      userId, orgId, [
        { resource: 'link', action: 'read' },
        { resource: 'analytics', action: 'export' }
      ]
    );

    // Check if user can manage another member's role
    const canManage = await this.permissionService.canManageMember(
      userId, orgId, 'EDITOR'
    );

    // Get roles user can assign
    const assignableRoles = await this.permissionService.getAssignableRolesForUser(
      userId, orgId
    );
  }
}
```

### 4. Organization ID Extraction

The `PermissionGuard` automatically extracts `organizationId` from:
1. Route params: `:orgId`, `:organizationId`, or `:id` (for `/organizations/:id`)
2. Request body: `body.organizationId` or `body.orgId`
3. Query params: `query.organizationId` or `query.orgId`

**Important:** Ensure your endpoints include organization context in one of these locations.

---

## Frontend Usage

### 1. usePermission Hook

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const {
    // Base permission checks
    can,              // can(resource, action) => boolean
    canAny,           // canAny([{resource, action}]) => boolean
    canAll,           // canAll([{resource, action}]) => boolean

    // Link permissions
    canCreateLink,
    canEditLink,
    canDeleteLink,
    canExportLinks,
    canBulkLinks,

    // Team permissions
    canManageTeam,
    canInviteMembers,
    canUpdateRoles,
    canRemoveMembers,

    // Other permissions
    canAccessBilling,
    canManageBilling,
    canAccessAudit,
    canManageDomains,
    canCreateApiKey,
    canExportAnalytics,

    // Role checks
    role,             // Current role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
    isOwner,
    isAdmin,
    isEditor,
    isEditorOrAbove,
    isAdminOrAbove,

    // Role management
    canManageRole,    // canManageRole(targetRole) => boolean
    getAssignableRoles,
  } = usePermission();

  return (
    <div>
      {canCreateLink() && <CreateButton />}
      {can('billing', 'manage') && <BillingSettings />}
    </div>
  );
}
```

### 2. PermissionGate Component

```tsx
import { PermissionGate } from '@/components/PermissionGate';

// Basic usage
<PermissionGate resource="link" action="create">
  <CreateLinkButton />
</PermissionGate>

// With fallback
<PermissionGate resource="billing" action="manage" fallback={<UpgradePrompt />}>
  <BillingSettings />
</PermissionGate>

// Show error message
<PermissionGate resource="audit" action="read" showError>
  <AuditLogs />
</PermissionGate>

// Custom error message
<PermissionGate
  resource="domain"
  action="create"
  showError
  errorMessage="Only admins can add custom domains"
>
  <AddDomainButton />
</PermissionGate>

// Multiple permissions (ANY) - default mode
<PermissionGate
  permissions={[
    { resource: 'link', action: 'update' },
    { resource: 'link', action: 'delete' }
  ]}
>
  <LinkActions />
</PermissionGate>

// Multiple permissions (ALL required)
<PermissionGate
  permissions={[
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'invite' }
  ]}
  mode="all"
>
  <TeamManagement />
</PermissionGate>
```

---

## API Token Scopes

For the Developer API, use scopes in format `{resource}:{action}`:

### Available Scopes

```typescript
type ApiScope =
  // Link scopes
  | 'link:read' | 'link:create' | 'link:update' | 'link:delete' | 'link:export' | 'link:bulk'
  // Analytics scopes
  | 'analytics:read' | 'analytics:export'
  // Domain scopes
  | 'domain:read' | 'domain:create' | 'domain:verify' | 'domain:delete'
  // Campaign scopes
  | 'campaign:read' | 'campaign:create' | 'campaign:update' | 'campaign:delete'
  // Tag scopes
  | 'tag:read' | 'tag:create' | 'tag:update' | 'tag:delete'
  // BioPage scopes
  | 'biopage:read' | 'biopage:create' | 'biopage:update' | 'biopage:delete'
  // Team scopes
  | 'team:read'
  // Admin scope (full access)
  | 'admin';
```

### Scope Groups (Predefined Sets)

```typescript
SCOPE_GROUPS = {
  READ_ONLY: ['link:read', 'analytics:read', 'domain:read', ...],
  LINK_MANAGEMENT: ['link:read', 'link:create', 'link:update', 'link:delete', 'link:export', 'link:bulk', 'analytics:read'],
  CONTENT_MANAGEMENT: ['link:*', 'campaign:*', 'tag:*', 'biopage:*'],
  ANALYTICS: ['analytics:read', 'analytics:export'],
};
```

### Using @RequireScope Decorator

```typescript
import { RequireScope } from '../auth/rbac';

@Get()
@RequireScope('link:read')
findAll() {}

@Post()
@RequireScope(['link:create', 'link:bulk'])  // Either scope works
create() {}

@Delete(':id')
@RequireScope('admin')  // Full access required
delete() {}
```

---

## Adding New Resources

When creating a new module that needs RBAC, follow these steps:

### Step 1: Add Resource Type (if new resource)

```typescript
// apps/api/src/auth/rbac/permission-matrix.ts
export type Resource =
  | 'link' | 'analytics' | ... | 'new-resource';
```

### Step 2: Update Permission Matrix

```typescript
// apps/api/src/auth/rbac/permission-matrix.ts
// Add to each role in PERMISSION_MATRIX

[MemberRole.OWNER]: {
  // ... existing resources
  'new-resource': {
    create: '*',
    read: '*',
    update: '*',
    delete: '*',
  },
},

[MemberRole.ADMIN]: {
  'new-resource': {
    create: '*',
    read: '*',
    update: 'organization',
    delete: 'own',
  },
},

[MemberRole.EDITOR]: {
  'new-resource': {
    create: '*',
    read: ['own', 'organization'],
    update: 'own',
    delete: 'own',
  },
},

[MemberRole.VIEWER]: {
  'new-resource': {
    read: 'organization',
  },
},
```

### Step 3: Sync Frontend Matrix

```typescript
// apps/web/lib/permissions/permission-matrix.ts
// Copy exact same changes from backend - MUST be identical
```

### Step 4: Add API Scopes (if needed for Developer API)

```typescript
// apps/api/src/auth/rbac/api-scopes.ts
export type ApiScope =
  | ...
  | 'new-resource:read'
  | 'new-resource:create'
  | 'new-resource:update'
  | 'new-resource:delete';

// Add to API_SCOPES array
export const API_SCOPES: readonly ApiScope[] = [
  ...
  'new-resource:read',
  'new-resource:create',
  'new-resource:update',
  'new-resource:delete',
];

// Add descriptions
export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  ...
  'new-resource:read': 'Read new resources',
  'new-resource:create': 'Create new resources',
  'new-resource:update': 'Update new resources',
  'new-resource:delete': 'Delete new resources',
};
```

### Step 5: Apply Guards to Controller

```typescript
// apps/api/src/new-resource/new-resource.controller.ts
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';

@Controller('new-resource')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NewResourceController {

  @Get()
  @Permission({ resource: 'new-resource', action: 'read' })
  findAll() {}

  @Post()
  @Permission({ resource: 'new-resource', action: 'create' })
  create() {}

  @Patch(':id')
  @Permission({ resource: 'new-resource', action: 'update', context: 'own' })
  update() {}

  @Delete(':id')
  @Permission({ resource: 'new-resource', action: 'delete', context: 'own' })
  delete() {}
}
```

### Step 6: Update Frontend UI with PermissionGate

```tsx
// In your React components
import { PermissionGate } from '@/components/PermissionGate';
import { usePermission } from '@/hooks/usePermission';

function NewResourcePage() {
  const { can } = usePermission();

  return (
    <div>
      <PermissionGate resource="new-resource" action="create">
        <CreateButton />
      </PermissionGate>

      {items.map(item => (
        <div key={item.id}>
          {item.name}
          <PermissionGate resource="new-resource" action="update">
            <EditButton />
          </PermissionGate>
          <PermissionGate resource="new-resource" action="delete">
            <DeleteButton />
          </PermissionGate>
        </div>
      ))}
    </div>
  );
}
```

---

## Security Principles

1. **Server-side enforcement**: All permissions checked on backend, frontend is UX only
2. **Deny by default**: No permission entry = denied
3. **Constant-time comparison**: For sensitive operations
4. **Access logging**: All permission checks logged for audit (`AccessLogService`)
5. **No IDOR vulnerabilities**: Ownership checked for 'own' scope
6. **No privilege escalation**: Role hierarchy strictly enforced
7. **Frontend is untrusted**: Never rely solely on frontend permission checks

---

## Testing RBAC

### Unit Tests Location
```
apps/api/src/auth/rbac/__tests__/
├── permission-matrix.spec.ts
├── role-hierarchy.spec.ts
└── permission.guard.spec.ts
```

### E2E Tests
```
apps/web/e2e/rbac.spec.ts
```

### Key Test Scenarios
- OWNER has all permissions
- ADMIN cannot delete organization or manage billing
- ADMIN cannot manage OWNER
- EDITOR can only modify own resources
- VIEWER has read-only access
- API returns 403 for unauthorized actions
- Role change takes effect immediately
- Multi-org permission isolation
