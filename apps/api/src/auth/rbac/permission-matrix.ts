import { MemberRole } from "@pingtome/database";

/**
 * Permission scope defines the boundary of access for a given permission
 * - '*': Full access to all resources
 * - 'own': Access only to resources owned by the user
 * - 'organization': Access to all resources within the organization
 * - 'limited': Limited access (e.g., can update some org settings but not all)
 * - 'exclude-owner': Access to all organization members except the owner
 */
export type PermissionScope =
  | "*"
  | "own"
  | "organization"
  | "limited"
  | "exclude-owner";

/**
 * Resources that can be controlled by RBAC
 */
export type Resource =
  | "link"
  | "analytics"
  | "organization"
  | "team"
  | "domain"
  | "billing"
  | "api-key"
  | "audit"
  | "biopage"
  | "campaign"
  | "tag";

/**
 * Actions that can be performed on resources
 */
export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "bulk"
  | "export"
  | "invite"
  | "verify"
  | "manage"
  | "update-role"
  | "remove"
  | "revoke";

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
 * This is the single source of truth for authorization decisions
 */
export const PERMISSION_MATRIX: Record<MemberRole, RolePermissions> = {
  /**
   * OWNER - Full access to everything
   * Can manage all aspects of the organization including billing and member roles
   */
  [MemberRole.OWNER]: {
    link: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
      bulk: "*",
      export: "*",
    },
    analytics: {
      read: "*",
      export: "*",
    },
    organization: {
      read: "*",
      update: "*",
      delete: "*",
    },
    team: {
      read: "*",
      invite: "*",
      "update-role": "*",
      remove: "*",
    },
    domain: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
      verify: "*",
    },
    billing: {
      read: "*",
      manage: "*",
    },
    "api-key": {
      create: "*",
      read: "*",
      revoke: "*",
    },
    audit: {
      read: "*",
      export: "*",
    },
    biopage: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
    },
    campaign: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
    },
    tag: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
    },
  },

  /**
   * ADMIN - Most access, cannot delete organization or manage billing
   * Can manage team members but cannot modify owner's role or remove owner
   */
  [MemberRole.ADMIN]: {
    link: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
      bulk: "organization",
      export: "*",
    },
    analytics: {
      read: "*",
      export: "*",
    },
    organization: {
      read: "*",
      update: "limited",
    },
    team: {
      read: "*",
      invite: "exclude-owner",
      "update-role": "exclude-owner",
      remove: "exclude-owner",
    },
    domain: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
      verify: "*",
    },
    billing: {
      read: "*",
    },
    "api-key": {
      create: "*",
      read: ["own", "organization"],
      revoke: "own",
    },
    audit: {
      read: "*",
    },
    biopage: {
      create: "*",
      read: "*",
      update: ["own", "organization"],
      delete: ["own", "organization"],
    },
    campaign: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
    },
    tag: {
      create: "*",
      read: "*",
      update: "*",
      delete: "*",
    },
  },

  /**
   * EDITOR - Can create and edit own content, view organization content
   * Cannot manage team, domains, or billing
   */
  [MemberRole.EDITOR]: {
    link: {
      create: "*",
      read: ["own", "organization"],
      update: "own",
      delete: "own",
      export: "own",
    },
    analytics: {
      read: ["own", "organization"],
    },
    organization: {
      read: "*",
    },
    team: {
      read: "*",
    },
    domain: {
      read: "*",
    },
    biopage: {
      create: "*",
      read: ["own", "organization"],
      update: "own",
      delete: "own",
    },
    campaign: {
      read: "*",
    },
    tag: {
      create: "*",
      read: "*",
      update: "own",
    },
  },

  /**
   * VIEWER - Read-only access to organization content
   * Cannot create, modify, or delete anything
   */
  [MemberRole.VIEWER]: {
    link: {
      read: "organization",
    },
    analytics: {
      read: "organization",
    },
    organization: {
      read: "*",
    },
    team: {
      read: "*",
    },
    domain: {
      read: "*",
    },
    biopage: {
      read: "organization",
    },
    campaign: {
      read: "*",
    },
    tag: {
      read: "*",
    },
  },
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
  return Array.isArray(actionPermission)
    ? actionPermission
    : [actionPermission];
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
