/**
 * Frontend Permission Matrix for Client-side RBAC
 * This mirrors the backend permission matrix exactly to enable client-side authorization checks
 * Note: This is for UI/UX only - all authorization is enforced server-side
 */

/**
 * Permission scope defines the boundary of access for a given permission
 * - '*': Full access to all resources
 * - 'own': Access only to resources owned by the user
 * - 'organization': Access to all resources within the organization
 * - 'limited': Limited access (e.g., can update some org settings but not all)
 * - 'exclude-owner': Access to all organization members except the owner
 */
export type PermissionScope = '*' | 'own' | 'organization' | 'limited' | 'exclude-owner';

/**
 * Resources that can be controlled by RBAC
 */
export type Resource =
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

/**
 * Actions that can be performed on resources
 */
export type Action =
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

/**
 * Member role type (matches backend MemberRole enum)
 */
export type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

/**
 * Permission entry defining what actions are allowed for a resource
 */
type PermissionEntry = {
  [action in Action]?: PermissionScope | PermissionScope[];
};

/**
 * Role permissions map
 */
type RolePermissions = {
  [resource in Resource]?: PermissionEntry;
};

/**
 * Permission matrix defining all RBAC rules
 * This is the single source of truth for client-side authorization decisions
 * MUST be kept in sync with backend permission matrix
 */
export const PERMISSION_MATRIX: Record<MemberRole, RolePermissions> = {
  /**
   * OWNER - Full access to everything
   * Can manage all aspects of the organization including billing and member roles
   */
  OWNER: {
    link: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
      bulk: '*',
      export: '*',
    },
    analytics: {
      read: '*',
      export: '*',
    },
    organization: {
      read: '*',
      update: '*',
      delete: '*',
    },
    team: {
      read: '*',
      invite: '*',
      'update-role': '*',
      remove: '*',
    },
    domain: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
      verify: '*',
    },
    billing: {
      read: '*',
      manage: '*',
    },
    'api-key': {
      create: '*',
      read: '*',
      revoke: '*',
    },
    audit: {
      read: '*',
      export: '*',
    },
    biopage: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
    },
    campaign: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
    },
    tag: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
    },
  },

  /**
   * ADMIN - Most access, cannot delete organization or manage billing
   * Can manage team members but cannot modify owner's role or remove owner
   */
  ADMIN: {
    link: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
      bulk: 'organization',
      export: '*',
    },
    analytics: {
      read: '*',
      export: '*',
    },
    organization: {
      read: '*',
      update: 'limited',
    },
    team: {
      read: '*',
      invite: 'exclude-owner',
      'update-role': 'exclude-owner',
      remove: 'exclude-owner',
    },
    domain: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
      verify: '*',
    },
    billing: {
      read: '*',
    },
    'api-key': {
      create: '*',
      read: ['own', 'organization'],
      revoke: 'own',
    },
    audit: {
      read: '*',
    },
    biopage: {
      create: '*',
      read: '*',
      update: ['own', 'organization'],
      delete: ['own', 'organization'],
    },
    campaign: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
    },
    tag: {
      create: '*',
      read: '*',
      update: '*',
      delete: '*',
    },
  },

  /**
   * EDITOR - Can create and edit own content, view organization content
   * Cannot manage team, domains, or billing
   */
  EDITOR: {
    link: {
      create: '*',
      read: ['own', 'organization'],
      update: 'own',
      delete: 'own',
      export: 'own',
    },
    analytics: {
      read: ['own', 'organization'],
    },
    organization: {
      read: '*',
    },
    team: {
      read: '*',
    },
    domain: {
      read: '*',
    },
    biopage: {
      create: '*',
      read: ['own', 'organization'],
      update: 'own',
      delete: 'own',
    },
    campaign: {
      read: '*',
    },
    tag: {
      create: '*',
      read: '*',
      update: 'own',
    },
  },

  /**
   * VIEWER - Read-only access to organization content
   * Cannot create, modify, or delete anything
   */
  VIEWER: {
    link: {
      read: 'organization',
    },
    analytics: {
      read: 'organization',
    },
    organization: {
      read: '*',
    },
    team: {
      read: '*',
    },
    domain: {
      read: '*',
    },
    biopage: {
      read: 'organization',
    },
    campaign: {
      read: '*',
    },
    tag: {
      read: '*',
    },
  },
};

/**
 * Role hierarchy levels - higher number = more permissions
 */
export const ROLE_LEVELS: Record<MemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

/**
 * Get permissions for a specific role, resource, and action
 * @param role - The member role
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @returns Array of permission scopes or null if no permission exists
 */
export function getPermissions(
  role: MemberRole,
  resource: Resource,
  action: Action,
): PermissionScope[] | null {
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) {
    return null;
  }

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) {
    return null;
  }

  const actionPermission = resourcePermissions[action];
  if (!actionPermission) {
    return null;
  }

  // Normalize to array
  return Array.isArray(actionPermission) ? actionPermission : [actionPermission];
}

/**
 * Check if a role has any permission for a specific resource and action
 * This is a simple boolean check - for scope-specific checks, use getPermissions()
 * @param role - The member role
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @returns true if the role has any permission, false otherwise
 */
export function hasPermission(
  role: MemberRole,
  resource: Resource,
  action: Action,
): boolean {
  const permissions = getPermissions(role, resource, action);
  return permissions !== null && permissions.length > 0;
}

/**
 * Returns the numeric level for a given role
 * @param role - The member role to get the level for
 * @returns The numeric level (OWNER=4, ADMIN=3, EDITOR=2, VIEWER=1)
 * @throws Error if the role is invalid
 */
export function getRoleLevel(role: MemberRole): number {
  const level = ROLE_LEVELS[role];

  if (level === undefined) {
    throw new Error(`Invalid role: ${role}`);
  }

  return level;
}

/**
 * Checks if userRole is at least at the requiredRole level
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if userRole level >= requiredRole level
 * @example
 * isRoleAtLeast('ADMIN', 'EDITOR') // => true (ADMIN >= EDITOR)
 * isRoleAtLeast('VIEWER', 'ADMIN') // => false (VIEWER < ADMIN)
 * isRoleAtLeast('ADMIN', 'ADMIN') // => true (ADMIN >= ADMIN)
 */
export function isRoleAtLeast(
  userRole: MemberRole,
  requiredRole: MemberRole,
): boolean {
  try {
    return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
  } catch (error) {
    return false;
  }
}

/**
 * Checks if userRole is strictly above targetRole
 * @param userRole - The user's current role
 * @param targetRole - The role to compare against
 * @returns true if userRole level > targetRole level
 * @example
 * isRoleAbove('ADMIN', 'EDITOR') // => true (ADMIN > EDITOR)
 * isRoleAbove('ADMIN', 'ADMIN') // => false (ADMIN = ADMIN)
 * isRoleAbove('VIEWER', 'ADMIN') // => false (VIEWER < ADMIN)
 */
export function isRoleAbove(
  userRole: MemberRole,
  targetRole: MemberRole,
): boolean {
  try {
    return getRoleLevel(userRole) > getRoleLevel(targetRole);
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a manager can manage (assign/remove) a target role
 * Rule: A manager can only manage roles below their level
 * @param managerRole - The manager's role
 * @param targetRole - The role to be managed
 * @returns true if manager can manage the target role
 * @example
 * canManageRole('OWNER', 'ADMIN') // => true (OWNER can manage ADMIN)
 * canManageRole('ADMIN', 'OWNER') // => false (ADMIN cannot manage OWNER)
 * canManageRole('ADMIN', 'ADMIN') // => false (cannot manage same level)
 * canManageRole('VIEWER', 'VIEWER') // => false (VIEWER cannot manage anyone)
 */
export function canManageRole(
  managerRole: MemberRole,
  targetRole: MemberRole,
): boolean {
  return isRoleAbove(managerRole, targetRole);
}

/**
 * Returns the list of roles that a user can assign to others
 * Rule: Users can assign roles up to and including their own level
 * @param userRole - The user's current role
 * @returns Array of roles that can be assigned
 * @example
 * getAssignableRoles('OWNER') // => ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']
 * getAssignableRoles('ADMIN') // => ['ADMIN', 'EDITOR', 'VIEWER']
 * getAssignableRoles('EDITOR') // => ['EDITOR', 'VIEWER']
 * getAssignableRoles('VIEWER') // => ['VIEWER']
 */
export function getAssignableRoles(userRole: MemberRole): MemberRole[] {
  try {
    const userLevel = getRoleLevel(userRole);
    const allRoles = Object.keys(ROLE_LEVELS) as MemberRole[];

    return allRoles.filter((role) => getRoleLevel(role) <= userLevel);
  } catch (error) {
    return [];
  }
}

/**
 * Check if a user's role has permission with scope context
 * @param role - The member role
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @param context - Optional context for scope checks
 * @returns true if permission is granted based on scope
 */
export function hasPermissionWithScope(
  role: MemberRole,
  resource: Resource,
  action: Action,
  context?: {
    userId?: string;
    ownerId?: string;
    targetRole?: MemberRole;
  },
): boolean {
  // Get permission scopes for this role, resource, and action
  const scopes = getPermissions(role, resource, action);
  if (!scopes || scopes.length === 0) {
    return false;
  }

  // Check if any scope grants permission
  for (const scope of scopes) {
    switch (scope) {
      case '*':
        // Full access granted
        return true;

      case 'own':
        // Check if user owns the resource
        if (context?.userId && context?.ownerId && context.userId === context.ownerId) {
          return true;
        }
        break;

      case 'organization':
        // Access to any resource in the organization
        return true;

      case 'limited':
        // Allow with limited functionality
        return true;

      case 'exclude-owner':
        // Allow unless target is an owner
        if (!context?.targetRole || context.targetRole !== 'OWNER') {
          return true;
        }
        break;

      default:
        // Unknown scope, deny
        break;
    }
  }

  return false;
}
