// RBAC Module Exports

// Permission Matrix - constants and helper functions
export {
  PERMISSION_MATRIX,
  getPermissions,
  hasPermission,
  type PermissionScope,
  type Resource,
  type Action,
} from './permission-matrix';

// Role Hierarchy - role level utilities
export {
  ROLE_HIERARCHY,
  getRoleLevel,
  isRoleAtLeast,
  isRoleAbove,
  canManageRole,
  getAssignableRoles,
} from './role-hierarchy';

// Permission Decorator - route-level permission decorators
export {
  Permission,
  RequirePermissions,
  PERMISSION_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  type PermissionMetadata,
} from './permission.decorator';

// Permission Service - permission checking service
export { PermissionService } from './permission.service';

// Permission Guard - NestJS guard for route protection
export { PermissionGuard } from './permission.guard';
