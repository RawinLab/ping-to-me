'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  hasPermission,
  canManageRole,
  getAssignableRoles,
  type Resource,
  type Action,
  type MemberRole,
} from '@/lib/permissions';

interface PermissionCheck {
  resource: Resource;
  action: Action;
}

/**
 * Hook for checking permissions based on the current organization role
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, canCreateLink, isAdmin } = usePermission();
 *
 *   if (!canCreateLink()) {
 *     return <div>No permission</div>;
 *   }
 *
 *   return <button disabled={!can('link', 'delete')}>Delete</button>;
 * }
 * ```
 */
export function usePermission() {
  const { memberships, currentOrgId } = useAuth();

  return useMemo(() => {
    // Get current organization role
    const currentMembership = memberships.find((m) => m.orgId === currentOrgId);
    const role = (currentMembership?.role as MemberRole) || null;

    /**
     * Check if the current user has permission to perform an action on a resource
     */
    const can = (resource: Resource, action: Action): boolean => {
      return hasPermission(role, resource, action);
    };

    /**
     * Check if the current user has ANY of the specified permissions
     */
    const canAny = (permissions: PermissionCheck[]): boolean => {
      if (!role) return false;
      return permissions.some((p) => hasPermission(role, p.resource, p.action));
    };

    /**
     * Check if the current user has ALL of the specified permissions
     */
    const canAll = (permissions: PermissionCheck[]): boolean => {
      if (!role) return false;
      return permissions.every((p) => hasPermission(role, p.resource, p.action));
    };

    // Convenience methods for common permission checks
    const canCreateLink = () => can('link', 'create');
    const canEditLink = () => can('link', 'update');
    const canDeleteLink = () => can('link', 'delete');
    const canExportLinks = () => can('link', 'export');
    const canBulkLinks = () => can('link', 'bulk');

    const canManageTeam = () => can('team', 'invite');
    const canInviteMembers = () => can('team', 'invite');
    const canUpdateRoles = () => can('team', 'update-role');
    const canRemoveMembers = () => can('team', 'remove');

    const canAccessBilling = () => can('billing', 'read');
    const canManageBilling = () => can('billing', 'manage');

    const canAccessAudit = () => can('audit', 'read');
    const canExportAudit = () => can('audit', 'export');

    const canManageDomains = () => can('domain', 'create');
    const canVerifyDomains = () => can('domain', 'verify');

    const canCreateApiKey = () => can('api-key', 'create');
    const canRevokeApiKey = () => can('api-key', 'revoke');

    const canExportAnalytics = () => can('analytics', 'export');

    // Role check helpers
    const isOwner = role === 'OWNER';
    const isAdmin = role === 'ADMIN' || role === 'OWNER';
    const isEditor = role === 'EDITOR' || role === 'ADMIN' || role === 'OWNER';
    const isEditorOrAbove = ['OWNER', 'ADMIN', 'EDITOR'].includes(role || '');
    const isAdminOrAbove = ['OWNER', 'ADMIN'].includes(role || '');

    return {
      // Current role
      role,

      // Base permission checks
      can,
      canAny,
      canAll,

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

      // Billing permissions
      canAccessBilling,
      canManageBilling,

      // Audit permissions
      canAccessAudit,
      canExportAudit,

      // Domain permissions
      canManageDomains,
      canVerifyDomains,

      // API key permissions
      canCreateApiKey,
      canRevokeApiKey,

      // Analytics permissions
      canExportAnalytics,

      // Role checks
      isOwner,
      isAdmin,
      isEditor,
      isEditorOrAbove,
      isAdminOrAbove,

      // Role management
      canManageRole: (targetRole: MemberRole) =>
        canManageRole(role || 'VIEWER', targetRole),
      getAssignableRoles: () => getAssignableRoles(role || 'VIEWER'),
    };
  }, [memberships, currentOrgId]);
}

// Default export for convenience
export default usePermission;
