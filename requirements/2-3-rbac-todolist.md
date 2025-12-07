# Module 2.3: Role-Based Access Control (RBAC) - Development Todolist

## Document Information
- **Module**: 2.3 Role-Based Access Control
- **Source**: `2-3-rbac-plan.md`
- **Generated**: 2025-12-07
- **For**: Claude Code Subagent Development
- **Dependencies**: Module 2.1, 2.2

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
npx playwright test apps/web/e2e/rbac.spec.ts
```

### Key Files
- `apps/api/src/auth/rbac/` (new directory)
- `apps/api/src/auth/guards/roles.guard.ts` (refactor)
- `apps/web/contexts/AuthContext.tsx` (enhance)
- `apps/web/components/PermissionGate.tsx` (new)
- `apps/web/hooks/usePermission.ts` (new)
- `packages/database/prisma/schema.prisma`

---

## Phase 1: Core Permission System (Week 1-2)

### TASK-2.3.1: Create RBAC Module Directory Structure
**Priority**: HIGH | **Type**: Backend | **Estimated**: 30 minutes
**Directory**: `apps/api/src/auth/rbac/`

**Subtasks**:
- [x] Create `apps/api/src/auth/rbac/` directory
- [x] Create `permission-matrix.ts` - Permission definitions
- [x] Create `permission.service.ts` - Permission checking service
- [x] Create `permission.guard.ts` - NestJS guard
- [x] Create `permission.decorator.ts` - @Permission decorator
- [x] Create `role-hierarchy.ts` - Role hierarchy utilities
- [x] Create `index.ts` for exports
- [x] Create `__tests__/` directory for unit tests

**Acceptance Criteria**:
- Directory structure matches design
- Files are empty but properly named

---

### TASK-2.3.2: Implement Permission Matrix Constants
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/rbac/permission-matrix.ts`

**Subtasks**:
- [x] Define `PermissionScope` type ('*', 'own', 'organization', 'limited', 'exclude-owner')
- [x] Define `Resource` type (link, analytics, organization, team, domain, billing, api-key, audit, biopage, campaign, tag)
- [x] Define `Action` type (create, read, update, delete, bulk, export, invite, verify, manage, etc.)
- [x] Create `PERMISSION_MATRIX` constant with full role definitions:
  - OWNER: Full access to all resources
  - ADMIN: Most access, cannot delete org or manage billing
  - EDITOR: Create/edit own content, view org content
  - VIEWER: Read-only access to org content
- [x] Export helper function `getPermissions(role, resource, action)`

**Acceptance Criteria**:
- Matrix covers all resources and actions
- Matrix matches specification in plan
- Types are properly exported

---

### TASK-2.3.3: Implement Role Hierarchy Utilities
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/auth/rbac/role-hierarchy.ts`

**Subtasks**:
- [x] Define `ROLE_HIERARCHY` constant (OWNER=4, ADMIN=3, EDITOR=2, VIEWER=1)
- [x] Implement `getRoleLevel(role)` function
- [x] Implement `isRoleAtLeast(userRole, requiredRole)` function
- [x] Implement `isRoleAbove(userRole, targetRole)` function
- [x] Implement `canManageRole(managerRole, targetRole)` function
- [x] Implement `getAssignableRoles(userRole)` function

**Acceptance Criteria**:
- OWNER > ADMIN > EDITOR > VIEWER hierarchy enforced
- Functions return correct boolean values
- Edge cases handled (same role, invalid role)

---

### TASK-2.3.4: Implement Permission Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/auth/rbac/permission.service.ts`

**Subtasks**:
- [x] Create `PermissionService` injectable service
- [x] Inject `PrismaService` for database queries
- [x] Implement `getUserRoleInOrg(userId, orgId)` - fetch role from OrganizationMember
- [x] Implement `hasPermission(userId, orgId, resource, action, context?)` method:
  - Fetch user's role in organization
  - Check permission matrix
  - Handle scope contexts ('own', 'organization', etc.)
- [x] Implement `hasAnyPermission(userId, orgId, permissions[])` method
- [x] Implement `hasAllPermissions(userId, orgId, permissions[])` method
- [x] Implement `checkResourceOwnership(userId, resourceType, resourceId)` for 'own' scope
- [x] Add caching for role lookups (optional, for performance)

**Acceptance Criteria**:
- Service correctly checks permissions against matrix
- Context-aware checking works ('own' vs 'organization')
- Returns boolean indicating access granted/denied

---

### TASK-2.3.5: Create Permission Decorator
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/auth/rbac/permission.decorator.ts`

**Subtasks**:
- [x] Create `Permission` decorator interface with:
  - `resource`: string (required)
  - `action`: string (required)
  - `context?`: 'own' | 'organization' | null
- [x] Create `@Permission` decorator using `SetMetadata`
- [x] Export `PERMISSION_KEY` constant for guard access
- [x] Add support for multiple permissions (array)

**Example**:
```typescript
@Permission({ resource: 'link', action: 'delete', context: 'own' })
```

**Acceptance Criteria**:
- Decorator sets metadata correctly
- Guard can read metadata

---

### TASK-2.3.6: Implement Permission Guard
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/auth/rbac/permission.guard.ts`

**Subtasks**:
- [x] Create `PermissionGuard` implementing `CanActivate`
- [x] Inject `Reflector` and `PermissionService`
- [x] Extract permission metadata from decorator
- [x] Extract `organizationId` from:
  - Route params (`:orgId`, `:organizationId`, `:id`)
  - Request body (`body.organizationId`)
  - Query params (`query.organizationId`)
- [x] Extract `userId` from JWT user
- [x] Call `PermissionService.hasPermission()`
- [x] Handle 'own' context by checking resource ownership
- [x] Throw `ForbiddenException` with detailed message on denial
- [x] Log access attempts for audit

**Acceptance Criteria**:
- Guard works with `@UseGuards(JwtAuthGuard, PermissionGuard)`
- Properly extracts organization context
- Returns 403 with descriptive error

---

### TASK-2.3.7: Refactor Existing RolesGuard
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**Files**:
- `apps/api/src/auth/guards/roles.guard.ts`
- Other duplicate RolesGuard files

**Subtasks**:
- [x] Identify all RolesGuard implementations in codebase
- [x] Remove duplicate implementations
- [x] Update existing RolesGuard to use PermissionService or deprecate
- [x] Create migration path for existing @Roles usages
- [x] Update imports across codebase

**Acceptance Criteria**:
- Single source of truth for role checking
- No duplicate guard implementations
- Backward compatibility maintained

---

### TASK-2.3.8: Apply Permission Guards to Links Controller
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/links/links.controller.ts`

**Subtasks**:
- [x] Add `@UseGuards(JwtAuthGuard, PermissionGuard)` to controller
- [x] Add `@Permission({ resource: 'link', action: 'read' })` to GET endpoints
- [x] Add `@Permission({ resource: 'link', action: 'create' })` to POST endpoints
- [x] Add `@Permission({ resource: 'link', action: 'update', context: 'own' })` to PATCH endpoints
- [x] Add `@Permission({ resource: 'link', action: 'delete', context: 'own' })` to DELETE endpoints
- [x] Add `@Permission({ resource: 'link', action: 'bulk' })` to bulk endpoints
- [x] Add `@Permission({ resource: 'link', action: 'export' })` to export endpoints

**Acceptance Criteria**:
- All link endpoints have permission checks
- VIEWER cannot create/update/delete
- EDITOR can only edit own links

---

### TASK-2.3.9: Apply Permission Guards to Organization Controller
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/organizations/organization.controller.ts`

**Subtasks**:
- [x] Add guards to controller
- [x] Add `@Permission({ resource: 'organization', action: 'read' })` to GET endpoints
- [x] Add `@Permission({ resource: 'organization', action: 'update' })` to PATCH endpoints
- [x] Add `@Permission({ resource: 'organization', action: 'delete' })` to DELETE endpoint
- [x] Add `@Permission({ resource: 'team', action: 'invite' })` to invite endpoint
- [x] Add `@Permission({ resource: 'team', action: 'remove' })` to remove member endpoint
- [x] Add `@Permission({ resource: 'team', action: 'update-role' })` to role change endpoint

**Acceptance Criteria**:
- Only OWNER can delete organization
- Only OWNER/ADMIN can manage team
- Team management respects role hierarchy

---

### TASK-2.3.10: Apply Permission Guards to Other Controllers
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**Files**: Multiple controller files

**Subtasks**:
- [x] Update `domains.controller.ts` - domain permissions
- [x] Update `campaigns.controller.ts` - campaign permissions
- [x] Update `tags.controller.ts` - tag permissions
- [x] Update `biopages.controller.ts` - biopage permissions
- [x] Update `analytics.controller.ts` - analytics permissions
- [x] Update `developer.controller.ts` - api-key permissions
- [x] Update `audit.controller.ts` - audit permissions (already partial)
- [x] Update `payments.controller.ts` - billing permissions (OWNER only)

**Acceptance Criteria**:
- All controllers have appropriate permission guards
- Each endpoint has correct resource/action decorator
- Billing restricted to OWNER only

---

## Phase 2: Frontend Permission System (Week 2-3)

### TASK-2.3.11: Create Frontend Permission Matrix
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/lib/permissions/permission-matrix.ts` (new)

**Subtasks**:
- [x] Create `apps/web/lib/permissions/` directory
- [x] Mirror backend permission matrix for client-side checks
- [x] Export `PERMISSION_MATRIX` constant
- [x] Export `checkPermission(role, resource, action)` function
- [x] Export `canManageRole(userRole, targetRole)` function
- [x] Ensure matrix stays in sync with backend

**Acceptance Criteria**:
- Frontend matrix matches backend exactly
- Functions work correctly for all roles

---

### TASK-2.3.12: Enhance AuthContext with Permissions
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/contexts/AuthContext.tsx`

**Subtasks**:
- [x] Add `PermissionContext` interface with:
  - `can(resource, action)`: boolean
  - `canAny(permissions[])`: boolean
  - `canAll(permissions[])`: boolean
  - `role`: MemberRole | null
  - `isOwner`, `isAdmin`, `isEditor`, `isViewer`: boolean
- [x] Add `permissions` property to `AuthContextType`
- [x] Implement permission checking methods using matrix
- [x] Update context provider to calculate permissions when org changes
- [x] Track `currentOrganization.role` in context

**Acceptance Criteria**:
- `permissions.can('link', 'delete')` returns correct boolean
- Permissions update when organization is switched
- Role-specific flags work correctly

---

### TASK-2.3.13: Create usePermission Hook
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/hooks/usePermission.ts`

**Subtasks**:
- [x] Create `usePermission()` hook that wraps AuthContext
- [x] Export convenience methods:
  - `canCreateLink()`, `canEditLink()`, `canDeleteLink()`
  - `canManageTeam()`, `canAccessBilling()`, `canAccessAudit()`
  - `canManageDomains()`, `canExportAnalytics()`
- [x] Export role check methods:
  - `isOwner`, `isAdmin`, `isEditorOrAbove`
- [x] Return base `can()` method for custom checks

**Acceptance Criteria**:
- Hook is easy to use in components
- All convenience methods work correctly

---

### TASK-2.3.14: Create PermissionGate Component
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/PermissionGate.tsx`

**Subtasks**:
- [x] Create `PermissionGate` component with props:
  - `resource`: string (required)
  - `action`: string (required)
  - `children`: ReactNode
  - `fallback?`: ReactNode (default null)
  - `showError?`: boolean (show denied message)
- [x] Use `usePermission` hook internally
- [x] Render children if permitted, fallback otherwise
- [x] Create `PermissionDeniedMessage` subcomponent for errors
- [x] Support `any` and `all` modes for multiple permissions

**Usage Example**:
```tsx
<PermissionGate resource="link" action="delete">
  <DeleteButton />
</PermissionGate>
```

**Acceptance Criteria**:
- Component correctly hides/shows children
- Fallback renders when permission denied
- Error message shows when configured

---

### TASK-2.3.15: Create RoleBadge Component
**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 1 hour
**File**: `apps/web/components/RoleBadge.tsx`

**Subtasks**:
- [x] Create `RoleBadge` component with props:
  - `role`: MemberRole
  - `showDescription?`: boolean
- [x] Define role config (color, icon, description) for each role:
  - OWNER: purple, Crown icon, "Full access"
  - ADMIN: blue, Shield icon, "Manage team & content"
  - EDITOR: green, Edit icon, "Create & edit content"
  - VIEWER: gray, Eye icon, "View only"
- [x] Use Badge component from shadcn/ui
- [x] Use Lucide icons

**Acceptance Criteria**:
- Badge displays correctly for each role
- Colors match design
- Optional description shows/hides

---

### TASK-2.3.16: Update Dashboard Links Page with Permissions
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/app/dashboard/links/page.tsx`

**Subtasks**:
- [x] Wrap "Create Link" button with PermissionGate
- [x] Conditionally show edit/delete buttons based on ownership + role
- [x] Wrap bulk actions with PermissionGate
- [x] Show empty state message for viewers with no create access
- [x] Handle API 403 errors gracefully

**Acceptance Criteria**:
- VIEWER sees no create/edit/delete buttons
- EDITOR sees edit/delete only for own links
- ADMIN/OWNER sees all actions

---

### TASK-2.3.17: Update Team Page with Permissions
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/app/dashboard/settings/team/page.tsx`

**Subtasks**:
- [x] Wrap invite button with PermissionGate (team:invite)
- [x] Show role selector limited to assignable roles
- [x] Hide remove button for members based on role hierarchy
- [x] Show RoleBadge for each member
- [x] Disable role change dropdown for protected members

**Acceptance Criteria**:
- VIEWER/EDITOR cannot invite
- ADMIN cannot manage OWNER
- Role options are correctly filtered

---

### TASK-2.3.18: Update Sidebar Navigation with Permissions
**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/components/Sidebar.tsx` or relevant navigation component

**Subtasks**:
- [x] Hide Billing link for non-OWNERs
- [x] Hide Audit Logs link for VIEWERs (if restricted)
- [x] Hide Domains management for VIEWER/EDITOR
- [x] Add visual indicators for restricted sections

**Acceptance Criteria**:
- Navigation items match user's permissions
- No broken links to restricted pages

---

## Phase 3: API Token Scopes (Week 3-4)

### TASK-2.3.19: Update ApiKey Model with Scopes
**Priority**: MEDIUM | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [x] Add `scopes` field (String[]) to ApiKey model
- [x] Add `ipWhitelist` field (String[]?, optional)
- [x] Add `rateLimit` field (Int?, optional, requests per minute)
- [ ] Run database migration
- [x] Update Prisma client

**Acceptance Criteria**:
- Migration runs without errors
- Existing API keys not affected (scopes default to empty)

---

### TASK-2.3.20: Define API Scopes Constants
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/auth/rbac/api-scopes.ts` (new)

**Subtasks**:
- [x] Define available scopes:
  - `link:read`, `link:create`, `link:update`, `link:delete`, `link:export`
  - `analytics:read`, `analytics:export`
  - `domain:read`, `domain:manage`
  - `campaign:read`, `campaign:manage`
  - `tag:read`, `tag:manage`
  - `admin` (full access)
- [x] Create `SCOPE_DESCRIPTIONS` for UI display
- [x] Create `validateScope(scope)` function
- [x] Create `scopeAllowsAction(scope, resource, action)` function

**Acceptance Criteria**:
- All scopes defined with descriptions
- Validation functions work correctly

---

### TASK-2.3.21: Create API Scope Guard
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/guards/api-scope.guard.ts`

**Subtasks**:
- [x] Create `ApiScopeGuard` implementing `CanActivate`
- [x] Extract API key from request header
- [x] Verify API key hash exists in database
- [x] Check if key has required scope for endpoint
- [x] Check IP whitelist if configured
- [x] Check rate limits if configured
- [x] Update `lastUsedAt` timestamp
- [x] Log API key usage

**Acceptance Criteria**:
- API requests validated against key scopes
- IP whitelist enforced when configured
- Rate limiting works

---

### TASK-2.3.22: Create @RequireScope Decorator
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/auth/rbac/require-scope.decorator.ts`

**Subtasks**:
- [x] Create `@RequireScope(scope: string | string[])` decorator
- [x] Export `SCOPE_KEY` constant
- [x] Support single scope or array of scopes (any)

**Acceptance Criteria**:
- Decorator sets metadata correctly
- Works with ApiScopeGuard

---

### TASK-2.3.23: Update API Key Creation to Include Scopes
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/developer/developer.service.ts`

**Subtasks**:
- [x] Update `createApiKey()` to accept scopes array
- [x] Validate scopes are from allowed list
- [x] Store scopes in database
- [x] Return scopes in API key response
- [x] Add `ipWhitelist` and `rateLimit` optional params

**Acceptance Criteria**:
- API keys created with specified scopes
- Invalid scopes rejected
- Scopes stored and returned correctly

---

### TASK-2.3.24: Update Developer Portal UI for Scopes
**Priority**: LOW | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/app/dashboard/developer/page.tsx`

**Subtasks**:
- [x] Add scope selection checkboxes to create API key form
- [x] Group scopes by resource type
- [x] Show scope descriptions on hover
- [x] Display scopes in API key list view
- [x] Add "admin" scope option with warning

**Acceptance Criteria**:
- Users can select scopes when creating keys
- Scopes are clearly displayed
- Admin scope has appropriate warning

---

## Phase 4: Audit & Testing (Week 4)

### TASK-2.3.25: Create AccessLog Model (Optional)
**Priority**: LOW | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `AccessLog` model with fields:
  - `id`, `userId`, `apiKeyId`, `organizationId`
  - `resource`, `action`, `result` (ALLOWED/DENIED)
  - `reason`, `ipAddress`, `userAgent`, `createdAt`
- [ ] Add indexes for querying
- [ ] Run migration

**Acceptance Criteria**:
- Model created successfully
- Indexes support efficient querying

---

### TASK-2.3.26: Implement Access Logging in Permission Guard
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/auth/rbac/permission.guard.ts`

**Subtasks**:
- [ ] Log all permission check attempts (success and denial)
- [ ] Include context: userId, orgId, resource, action
- [ ] Include request metadata: IP, user agent
- [ ] Use async logging to not block requests
- [ ] Integrate with existing AuditService or create AccessLogService

**Acceptance Criteria**:
- All access attempts logged
- Logging doesn't impact performance
- Denials include reason

---

### TASK-2.3.27: Write Permission Matrix Unit Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/api/src/auth/rbac/__tests__/permission-matrix.spec.ts`

**Test Cases**:
- [x] OWNER has all permissions
- [x] OWNER can delete organization
- [x] OWNER can manage billing
- [x] ADMIN has most permissions
- [x] ADMIN cannot delete organization
- [x] ADMIN cannot manage billing
- [x] ADMIN can invite non-OWNER roles
- [x] ADMIN cannot invite OWNER role
- [x] EDITOR can create link
- [x] EDITOR can update own link
- [x] EDITOR cannot update others link
- [x] EDITOR cannot manage team
- [x] VIEWER can read links
- [x] VIEWER cannot create link
- [x] VIEWER cannot update link
- [x] VIEWER cannot delete link

**Acceptance Criteria**:
- All tests pass
- Full coverage of permission matrix

---

### TASK-2.3.28: Write Role Hierarchy Unit Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 1-2 hours
**File**: `apps/api/src/auth/rbac/__tests__/role-hierarchy.spec.ts`

**Test Cases**:
- [x] OWNER satisfies ADMIN requirement
- [x] OWNER satisfies EDITOR requirement
- [x] OWNER satisfies VIEWER requirement
- [x] ADMIN satisfies EDITOR requirement
- [x] ADMIN satisfies VIEWER requirement
- [x] ADMIN does NOT satisfy OWNER requirement
- [x] EDITOR satisfies VIEWER requirement
- [x] EDITOR does NOT satisfy ADMIN requirement
- [x] VIEWER only satisfies VIEWER requirement

**Acceptance Criteria**:
- All hierarchy tests pass

---

### TASK-2.3.29: Write Permission Guard Unit Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/rbac/__tests__/permission.guard.spec.ts`

**Test Cases**:
- [x] Allow access when user has permission
- [x] Deny access when user lacks permission
- [x] Extract orgId from route params
- [x] Extract orgId from body
- [x] Extract orgId from query
- [x] Throw ForbiddenException on denial
- [x] Work with JwtAuthGuard
- [x] Handle missing permission decorator

**Acceptance Criteria**:
- All tests pass
- Mock dependencies properly

---

### TASK-2.3.30: Write E2E Tests - OWNER Role
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-001: OWNER can access organization settings
- [x] RBAC-002: OWNER can manage all members
- [x] RBAC-003: OWNER can access billing
- [x] RBAC-004: OWNER can manage all links

**Acceptance Criteria**:
- All OWNER tests pass

---

### TASK-2.3.31: Write E2E Tests - ADMIN Role
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-010: ADMIN can access limited organization settings
- [x] RBAC-011: ADMIN can manage non-OWNER members
- [x] RBAC-012: ADMIN cannot access billing management
- [x] RBAC-013: ADMIN can manage organization links

**Acceptance Criteria**:
- All ADMIN tests pass

---

### TASK-2.3.32: Write E2E Tests - EDITOR Role
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-020: EDITOR cannot access organization settings
- [x] RBAC-021: EDITOR cannot manage team
- [x] RBAC-022: EDITOR can create links
- [x] RBAC-023: EDITOR can only edit own links
- [x] RBAC-024: EDITOR can only delete own links
- [x] RBAC-025: EDITOR can view organization analytics

**Acceptance Criteria**:
- All EDITOR tests pass

---

### TASK-2.3.33: Write E2E Tests - VIEWER Role
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-030: VIEWER has read-only access
- [x] RBAC-031: VIEWER cannot create links
- [x] RBAC-032: VIEWER can view analytics
- [x] RBAC-033: VIEWER can view team members

**Acceptance Criteria**:
- All VIEWER tests pass

---

### TASK-2.3.34: Write E2E Tests - Permission Enforcement
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-040: API returns 403 for unauthorized action
- [x] RBAC-041: Direct URL access is blocked
- [x] RBAC-042: Role change takes effect immediately
- [x] RBAC-043: Multi-org permission isolation

**Acceptance Criteria**:
- All enforcement tests pass

---

### TASK-2.3.35: Write E2E Tests - API Token Scopes
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/rbac.spec.ts`

**Test Cases**:
- [x] RBAC-050: API key with read scope cannot write
- [x] RBAC-051: API key with write scope can create
- [x] RBAC-052: API key respects organization scope
- [x] RBAC-053: Expired API key is rejected

**Acceptance Criteria**:
- All API scope tests pass

---

## Summary

| Phase | Task Count | Priority Breakdown |
|-------|------------|-------------------|
| Core Permission System | 10 tasks | 10 HIGH |
| Frontend Permission System | 8 tasks | 5 HIGH, 3 MEDIUM |
| API Token Scopes | 6 tasks | 4 MEDIUM, 2 LOW |
| Audit & Testing | 11 tasks | 8 HIGH, 2 MEDIUM, 1 LOW |
| **Total** | **35 tasks** | **23 HIGH, 9 MEDIUM, 3 LOW** |

### Estimated Total Time: 55-70 hours

### Critical Path (Must complete first):
1. TASK-2.3.1: Create directory structure
2. TASK-2.3.2: Permission matrix constants
3. TASK-2.3.3: Role hierarchy utilities
4. TASK-2.3.4: Permission service
5. TASK-2.3.5: Permission decorator
6. TASK-2.3.6: Permission guard
7. TASK-2.3.8-10: Apply guards to controllers

### Dependencies Graph:
```
TASK-2.3.1 (Structure)
    ├── TASK-2.3.2 (Matrix)
    │   └── TASK-2.3.4 (Service)
    │       └── TASK-2.3.6 (Guard)
    │           └── TASK-2.3.8-10 (Apply Guards)
    ├── TASK-2.3.3 (Hierarchy)
    │   └── TASK-2.3.4 (Service)
    └── TASK-2.3.5 (Decorator)
        └── TASK-2.3.6 (Guard)

TASK-2.3.11 (Frontend Matrix)
    └── TASK-2.3.12 (AuthContext)
        ├── TASK-2.3.13 (usePermission)
        └── TASK-2.3.14 (PermissionGate)
            └── TASK-2.3.16-18 (Apply to Pages)
```

### Security Checklist:
- [x] All permission checks done server-side
- [x] Never trust frontend-only checks
- [x] Deny by default (whitelist approach)
- [x] Use constant-time comparison for sensitive operations
- [x] Log all access denials
- [x] No IDOR vulnerabilities
- [x] No privilege escalation paths
