import { SetMetadata } from '@nestjs/common';

/**
 * Permission metadata interface for RBAC system
 *
 * @property resource - The resource type (e.g., 'link', 'organization', 'team')
 * @property action - The action to perform (e.g., 'create', 'read', 'update', 'delete')
 * @property context - Optional context for scope checking:
 *   - 'own': User can only perform action on their own resources
 *   - 'organization': User can perform action on resources within their organization
 *   - null: No context restriction (global permission)
 */
export interface PermissionMetadata {
  resource: string;
  action: string;
  context?: 'own' | 'organization' | null;
}

/**
 * Metadata key for accessing permission data in guards
 */
export const PERMISSION_KEY = 'permission';

/**
 * Metadata key for accessing require-all-permissions data in guards
 */
export const REQUIRE_ALL_PERMISSIONS_KEY = 'require_all_permissions';

/**
 * Permission decorator for route-level RBAC
 *
 * Supports two modes:
 * 1. Single permission object - user must have this permission
 * 2. Array of permissions - user must have ANY of these permissions (OR condition)
 *
 * @param permission - Single permission or array of permissions
 *
 * @example
 * // Single permission
 * @Permission({ resource: 'link', action: 'create' })
 * createLink() { }
 *
 * @example
 * // With context - user can only update their own links
 * @Permission({ resource: 'link', action: 'update', context: 'own' })
 * updateOwnLink() { }
 *
 * @example
 * // Multiple permissions (OR) - user needs ANY of these
 * @Permission([
 *   { resource: 'link', action: 'update' },
 *   { resource: 'link', action: 'delete' }
 * ])
 * updateOrDeleteLink() { }
 */
export const Permission = (
  permission: PermissionMetadata | PermissionMetadata[],
) => SetMetadata(PERMISSION_KEY, permission);

/**
 * RequirePermissions decorator for AND condition
 *
 * User must have ALL of the specified permissions to access the route.
 * Use this when multiple permissions are required simultaneously.
 *
 * @param permissions - Array of permissions that are all required
 *
 * @example
 * // User needs BOTH read permissions to access analytics
 * @RequirePermissions([
 *   { resource: 'link', action: 'read' },
 *   { resource: 'analytics', action: 'read' }
 * ])
 * getLinkAnalytics() { }
 *
 * @example
 * // User needs multiple organization permissions
 * @RequirePermissions([
 *   { resource: 'organization', action: 'read' },
 *   { resource: 'organization', action: 'update' },
 *   { resource: 'team', action: 'manage' }
 * ])
 * updateOrganizationSettings() { }
 */
export const RequirePermissions = (permissions: PermissionMetadata[]) =>
  SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, permissions);
