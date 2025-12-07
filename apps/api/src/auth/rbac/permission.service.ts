import { Injectable } from '@nestjs/common';
import { MemberRole } from '@pingtome/database';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPermissions,
  hasPermission,
  PermissionScope,
  Resource,
  Action,
} from './permission-matrix';
import {
  canManageRole,
  isRoleAtLeast,
  isRoleAbove,
  getAssignableRoles,
} from './role-hierarchy';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's role in an organization
   * @returns MemberRole or null if not a member
   */
  async getUserRoleInOrg(
    userId: string,
    orgId: string,
  ): Promise<MemberRole | null> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      select: {
        role: true,
      },
    });

    return member?.role ?? null;
  }

  /**
   * Check if user has permission in organization
   * @param context - Optional context for scope checks: { ownerId?: string, resourceId?: string }
   */
  async hasPermission(
    userId: string,
    orgId: string,
    resource: Resource,
    action: Action,
    context?: { ownerId?: string; resourceId?: string },
  ): Promise<boolean> {
    // Get user's role in the organization
    const role = await this.getUserRoleInOrg(userId, orgId);
    if (!role) {
      return false;
    }

    // Get permission scopes for this role, resource, and action
    const scopes = getPermissions(role, resource, action);
    if (!scopes || scopes.length === 0) {
      return false;
    }

    // Check if any scope grants permission
    return this.checkScopes(scopes, userId, context);
  }

  /**
   * Check if user has ANY of the given permissions
   */
  async hasAnyPermission(
    userId: string,
    orgId: string,
    permissions: Array<{ resource: Resource; action: Action }>,
  ): Promise<boolean> {
    // Get user's role once
    const role = await this.getUserRoleInOrg(userId, orgId);
    if (!role) {
      return false;
    }

    // Check if user has any of the permissions
    for (const { resource, action } of permissions) {
      if (hasPermission(role, resource, action)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has ALL of the given permissions
   */
  async hasAllPermissions(
    userId: string,
    orgId: string,
    permissions: Array<{ resource: Resource; action: Action }>,
  ): Promise<boolean> {
    // Get user's role once
    const role = await this.getUserRoleInOrg(userId, orgId);
    if (!role) {
      return false;
    }

    // Check if user has all of the permissions
    for (const { resource, action } of permissions) {
      if (!hasPermission(role, resource, action)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user owns a specific resource
   * Supports both user-owned resources (link, api-key) and organization-owned resources
   * For organization resources, we don't check ownership but will rely on org membership
   */
  async checkResourceOwnership(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    try {
      switch (resourceType.toLowerCase()) {
        case 'link': {
          // User-owned resource
          const link = await this.prisma.link.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          return link?.userId === userId;
        }

        case 'api-key': {
          // Organization-owned but we can check if it belongs to user's org
          // Note: ApiKey doesn't have userId, only organizationId
          // This check should happen at permission level
          return true;
        }

        case 'biopage':
        case 'campaign':
        case 'tag': {
          // Organization-owned resources - no direct user ownership
          // Ownership is handled by organization membership and role permissions
          // Return true here, actual permission check happens in hasPermission()
          return true;
        }

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate if user can manage (invite/update/remove) a member with targetRole
   * Uses role hierarchy to prevent privilege escalation
   */
  async canManageMember(
    managerUserId: string,
    orgId: string,
    targetRole: MemberRole,
  ): Promise<boolean> {
    const managerRole = await this.getUserRoleInOrg(managerUserId, orgId);
    if (!managerRole) {
      return false;
    }

    return canManageRole(managerRole, targetRole);
  }

  /**
   * Get list of roles the user can assign in this organization
   */
  async getAssignableRolesForUser(
    userId: string,
    orgId: string,
  ): Promise<MemberRole[]> {
    const userRole = await this.getUserRoleInOrg(userId, orgId);
    if (!userRole) {
      return [];
    }

    return getAssignableRoles(userRole);
  }

  /**
   * Helper: Check if any of the scopes grants permission
   * @private
   */
  private checkScopes(
    scopes: PermissionScope[],
    userId: string,
    context?: { ownerId?: string; resourceId?: string },
  ): boolean {
    for (const scope of scopes) {
      switch (scope) {
        case '*':
          // Full access granted
          return true;

        case 'own':
          // Check if user owns the resource
          if (context?.ownerId === userId) {
            return true;
          }
          break;

        case 'organization':
          // Access to any resource in the organization
          // If no specific owner is specified, allow
          // If owner is specified and it's in the org, we assume it's valid
          return true;

        case 'limited':
          // Allow with limited functionality (treat as true for basic check)
          return true;

        case 'exclude-owner':
          // Allow unless target is an owner (handled by caller)
          return true;

        default:
          // Unknown scope, deny
          break;
      }
    }

    return false;
  }
}
