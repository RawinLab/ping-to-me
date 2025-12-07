# Frontend Permission Matrix

Client-side RBAC (Role-Based Access Control) for the PingTO.Me web application.

## Overview

This module provides a TypeScript implementation of the permission matrix that mirrors the backend RBAC system. It enables client-side authorization checks for UI/UX purposes.

**Important**: These permissions are for client-side UI only. All actual authorization is enforced server-side by the API.

## Usage

### Basic Permission Checks

```typescript
import { hasPermission } from '@/lib/permissions';

// Check if ADMIN can create links
const canCreate = hasPermission('ADMIN', 'link', 'create');
// => true

// Check if VIEWER can delete links
const canDelete = hasPermission('VIEWER', 'link', 'delete');
// => false
```

### Permission Scopes

```typescript
import { getPermissions } from '@/lib/permissions';

// Get permission scopes for EDITOR creating links
const scopes = getPermissions('EDITOR', 'link', 'create');
// => ['*'] - full access to create

// Get permission scopes for EDITOR updating links
const updateScopes = getPermissions('EDITOR', 'link', 'update');
// => ['own'] - can only update own links
```

### Role Hierarchy

```typescript
import { isRoleAtLeast, isRoleAbove, ROLE_LEVELS } from '@/lib/permissions';

// Check if user has at least ADMIN role
const isAdmin = isRoleAtLeast('OWNER', 'ADMIN');
// => true

// Check if user's role is above another role
const canManage = isRoleAbove('ADMIN', 'EDITOR');
// => true

// Get role level
const level = ROLE_LEVELS.ADMIN;
// => 3
```

### Team Management

```typescript
import { canManageRole, getAssignableRoles } from '@/lib/permissions';

// Check if ADMIN can manage EDITOR role
const canManageEditor = canManageRole('ADMIN', 'EDITOR');
// => true

// Check if ADMIN can manage OWNER role
const canManageOwner = canManageRole('ADMIN', 'OWNER');
// => false

// Get roles that ADMIN can assign
const assignableRoles = getAssignableRoles('ADMIN');
// => ['ADMIN', 'EDITOR', 'VIEWER']
```

### Scope Context Checks

```typescript
import { hasPermissionWithScope } from '@/lib/permissions';

// Check if EDITOR can update their own link
const canUpdateOwn = hasPermissionWithScope(
  'EDITOR',
  'link',
  'update',
  { userId: 'user-123', ownerId: 'user-123' }
);
// => true

// Check if EDITOR can update someone else's link
const canUpdateOthers = hasPermissionWithScope(
  'EDITOR',
  'link',
  'update',
  { userId: 'user-123', ownerId: 'user-456' }
);
// => false

// Check if ADMIN can manage OWNER role
const canManageOwnerRole = hasPermissionWithScope(
  'ADMIN',
  'team',
  'update-role',
  { targetRole: 'OWNER' }
);
// => false (exclude-owner scope)
```

## Types

### MemberRole
```typescript
type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
```

### Resource
```typescript
type Resource =
  | 'link'
  | 'analytics'
  | 'organization'
  | 'team'
  | 'domain'
  | 'billing'
  | 'api-key'
  | 'audit'
  | 'biopage'
  | 'campaign'
  | 'tag';
```

### Action
```typescript
type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'bulk'
  | 'export'
  | 'invite'
  | 'verify'
  | 'manage'
  | 'update-role'
  | 'remove'
  | 'revoke';
```

### PermissionScope
```typescript
type PermissionScope =
  | '*'                // Full access
  | 'own'              // Only resources owned by user
  | 'organization'     // All resources in organization
  | 'limited'          // Limited access
  | 'exclude-owner';   // All except OWNER role
```

## Role Permissions Summary

### OWNER
- Full access to everything (`*`)
- Can manage billing
- Can modify all team member roles including other owners

### ADMIN
- Most access to resources
- Can read billing but not manage it
- Cannot delete organization
- Cannot modify OWNER roles (exclude-owner)
- Can manage ADMIN, EDITOR, and VIEWER roles

### EDITOR
- Can create links, biopages, tags
- Can only update/delete own content (`own` scope)
- Can read organization content
- Cannot manage team, domains, billing, or API keys

### VIEWER
- Read-only access to organization content
- Cannot create, update, or delete anything

## React Component Example

```typescript
'use client';

import { hasPermission } from '@/lib/permissions';

interface Props {
  userRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export function LinkActions({ userRole }: Props) {
  const canCreate = hasPermission(userRole, 'link', 'create');
  const canDelete = hasPermission(userRole, 'link', 'delete');
  const canBulk = hasPermission(userRole, 'link', 'bulk');

  return (
    <div>
      {canCreate && <button>Create Link</button>}
      {canDelete && <button>Delete Link</button>}
      {canBulk && <button>Bulk Actions</button>}
    </div>
  );
}
```

## Keeping in Sync with Backend

The permission matrix MUST be kept in sync with the backend implementation at:
`apps/api/src/auth/rbac/permission-matrix.ts`

Any changes to the backend permission matrix should be immediately reflected in this frontend version.
