import { MemberRole } from '@pingtome/database';

/**
 * Role hierarchy levels - higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  [MemberRole.OWNER]: 4,
  [MemberRole.ADMIN]: 3,
  [MemberRole.EDITOR]: 2,
  [MemberRole.VIEWER]: 1,
};

/**
 * Returns the numeric level for a given role
 * @param role - The member role to get the level for
 * @returns The numeric level (OWNER=4, ADMIN=3, EDITOR=2, VIEWER=1)
 * @throws Error if the role is invalid
 */
export function getRoleLevel(role: MemberRole): number {
  const level = ROLE_HIERARCHY[role];

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
    const allRoles = Object.keys(ROLE_HIERARCHY) as MemberRole[];

    return allRoles.filter((role) => getRoleLevel(role) <= userLevel);
  } catch (error) {
    return [];
  }
}
