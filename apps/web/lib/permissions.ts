/**
 * Permission Matrix for RBAC
 *
 * Defines permissions for each role across different resources.
 * Roles: OWNER > ADMIN > EDITOR > VIEWER
 */

export type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export type Resource =
  | 'link'
  | 'analytics'
  | 'qr'
  | 'campaign'
  | 'tag'
  | 'folder'
  | 'biopage'
  | 'domain'
  | 'team'
  | 'billing'
  | 'api-key'
  | 'webhook'
  | 'audit'
  | 'organization';

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'bulk'
  | 'invite'
  | 'remove'
  | 'update-role'
  | 'manage'
  | 'verify'
  | 'revoke'
  | 'regenerate';

/**
 * Permission matrix mapping roles to their allowed actions on resources
 */
const PERMISSION_MATRIX: Record<
  MemberRole,
  Record<Resource, Action[]>
> = {
  OWNER: {
    link: ['create', 'read', 'update', 'delete', 'export', 'bulk'],
    analytics: ['read', 'export'],
    qr: ['create', 'read', 'update', 'delete'],
    campaign: ['create', 'read', 'update', 'delete'],
    tag: ['create', 'read', 'update', 'delete'],
    folder: ['create', 'read', 'update', 'delete'],
    biopage: ['create', 'read', 'update', 'delete'],
    domain: ['create', 'read', 'update', 'delete', 'verify'],
    team: ['invite', 'remove', 'update-role'],
    billing: ['read', 'manage'],
    'api-key': ['create', 'read', 'delete', 'revoke', 'regenerate'],
    webhook: ['create', 'read', 'update', 'delete'],
    audit: ['read', 'export'],
    organization: ['read', 'update', 'delete'],
  },
  ADMIN: {
    link: ['create', 'read', 'update', 'delete', 'export', 'bulk'],
    analytics: ['read', 'export'],
    qr: ['create', 'read', 'update', 'delete'],
    campaign: ['create', 'read', 'update', 'delete'],
    tag: ['create', 'read', 'update', 'delete'],
    folder: ['create', 'read', 'update', 'delete'],
    biopage: ['create', 'read', 'update', 'delete'],
    domain: ['create', 'read', 'update', 'delete', 'verify'],
    team: ['invite', 'remove', 'update-role'],
    billing: ['read'],
    'api-key': ['create', 'read', 'delete', 'revoke', 'regenerate'],
    webhook: ['create', 'read', 'update', 'delete'],
    audit: ['read', 'export'],
    organization: ['read'],
  },
  EDITOR: {
    link: ['create', 'read', 'update', 'delete', 'export', 'bulk'],
    analytics: ['read', 'export'],
    qr: ['create', 'read', 'update', 'delete'],
    campaign: ['create', 'read', 'update', 'delete'],
    tag: ['create', 'read', 'update', 'delete'],
    folder: ['create', 'read', 'update', 'delete'],
    biopage: ['create', 'read', 'update', 'delete'],
    domain: ['read'],
    team: [],
    billing: [],
    'api-key': ['create', 'read', 'delete', 'revoke'],
    webhook: ['read'],
    audit: [],
    organization: ['read'],
  },
  VIEWER: {
    link: ['read'],
    analytics: ['read'],
    qr: ['read'],
    campaign: ['read'],
    tag: ['read'],
    folder: ['read'],
    biopage: ['read'],
    domain: ['read'],
    team: [],
    billing: [],
    'api-key': [],
    webhook: [],
    audit: [],
    organization: ['read'],
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  role: MemberRole | null,
  resource: Resource,
  action: Action
): boolean {
  if (!role) return false;

  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

/**
 * Check if a role can manage (assign/change/remove) another role
 *
 * Rules:
 * - OWNER can manage all roles
 * - ADMIN can manage EDITOR and VIEWER
 * - EDITOR and VIEWER cannot manage any roles
 */
export function canManageRole(
  currentRole: MemberRole,
  targetRole: MemberRole
): boolean {
  const roleHierarchy: Record<MemberRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    EDITOR: 2,
    VIEWER: 1,
  };

  // Can only manage roles lower than yours
  return roleHierarchy[currentRole] > roleHierarchy[targetRole];
}

/**
 * Get list of roles that can be assigned by the current role
 */
export function getAssignableRoles(currentRole: MemberRole): MemberRole[] {
  switch (currentRole) {
    case 'OWNER':
      return ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'];
    case 'ADMIN':
      return ['ADMIN', 'EDITOR', 'VIEWER'];
    case 'EDITOR':
    case 'VIEWER':
      return [];
    default:
      return [];
  }
}

/**
 * Check if a role has any admin privileges
 */
export function isAdminRole(role: MemberRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if a role can perform write operations
 */
export function canWrite(role: MemberRole | null): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'EDITOR';
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: MemberRole): number {
  const levels: Record<MemberRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    EDITOR: 2,
    VIEWER: 1,
  };
  return levels[role] || 0;
}
