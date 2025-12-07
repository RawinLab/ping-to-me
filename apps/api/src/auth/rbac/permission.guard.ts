import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from './permission.service';
import {
  PERMISSION_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  PermissionMetadata,
} from './permission.decorator';

/**
 * Permission Guard for NestJS RBAC system
 *
 * This guard implements fine-grained permission checking based on:
 * - @Permission decorator (OR condition - user needs ANY permission)
 * - @RequirePermissions decorator (AND condition - user needs ALL permissions)
 * - Organization context (extracted from route params, body, or query)
 * - Resource ownership for 'own' context permissions
 *
 * Usage:
 * ```typescript
 * @Controller('links')
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * export class LinksController {
 *   @Get()
 *   @Permission({ resource: 'link', action: 'read' })
 *   findAll() {}
 *
 *   @Post()
 *   @Permission({ resource: 'link', action: 'create' })
 *   create() {}
 *
 *   @Delete(':id')
 *   @Permission({ resource: 'link', action: 'delete', context: 'own' })
 *   delete() {}
 * }
 * ```
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract permission metadata from decorators
    const permissionMetadata = this.reflector.getAllAndOverride<
      PermissionMetadata | PermissionMetadata[]
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const requireAllMetadata = this.reflector.getAllAndOverride<
      PermissionMetadata[]
    >(REQUIRE_ALL_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no permission metadata exists, allow access
    if (!permissionMetadata && !requireAllMetadata) {
      return true;
    }

    // Extract request context
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract organization ID from request (try multiple sources)
    const organizationId = this.extractOrganizationId(request);

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    // Extract resource ID for ownership checks (if needed)
    const resourceId = this.extractResourceId(request);

    // Handle PERMISSION_KEY (OR condition - user needs ANY permission)
    if (permissionMetadata) {
      const permissions = Array.isArray(permissionMetadata)
        ? permissionMetadata
        : [permissionMetadata];

      const hasAccess = await this.checkAnyPermission(
        user.id,
        organizationId,
        permissions,
        resourceId,
      );

      if (!hasAccess) {
        this.throwForbiddenException(permissions[0], user);
      }

      // Log access for audit (optional)
      this.logAccess(user.id, organizationId, permissions, 'granted');

      return true;
    }

    // Handle REQUIRE_ALL_PERMISSIONS_KEY (AND condition - user needs ALL permissions)
    if (requireAllMetadata) {
      const hasAccess = await this.checkAllPermissions(
        user.id,
        organizationId,
        requireAllMetadata,
        resourceId,
      );

      if (!hasAccess) {
        this.throwForbiddenException(requireAllMetadata[0], user);
      }

      // Log access for audit (optional)
      this.logAccess(user.id, organizationId, requireAllMetadata, 'granted');

      return true;
    }

    return true;
  }

  /**
   * Check if user has ANY of the specified permissions (OR condition)
   */
  private async checkAnyPermission(
    userId: string,
    organizationId: string,
    permissions: PermissionMetadata[],
    resourceId?: string,
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.checkSinglePermission(
        userId,
        organizationId,
        permission,
        resourceId,
      );

      if (hasPermission) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has ALL of the specified permissions (AND condition)
   */
  private async checkAllPermissions(
    userId: string,
    organizationId: string,
    permissions: PermissionMetadata[],
    resourceId?: string,
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasPermission = await this.checkSinglePermission(
        userId,
        organizationId,
        permission,
        resourceId,
      );

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check a single permission with context handling
   */
  private async checkSinglePermission(
    userId: string,
    organizationId: string,
    permission: PermissionMetadata,
    resourceId?: string,
  ): Promise<boolean> {
    const { resource, action, context } = permission;

    // For 'own' context, we need to verify resource ownership
    if (context === 'own' && resourceId) {
      const ownsResource = await this.permissionService.checkResourceOwnership(
        userId,
        resource,
        resourceId,
      );

      if (!ownsResource) {
        return false;
      }
    }

    // Check base permission
    return this.permissionService.hasPermission(
      userId,
      organizationId,
      resource as any,
      action as any,
      {
        ownerId: context === 'own' ? userId : undefined,
        resourceId,
      },
    );
  }

  /**
   * Extract organization ID from request
   * Tries multiple sources in order:
   * 1. Route params: :orgId, :organizationId, :id (for org routes)
   * 2. Request body: organizationId, orgId
   * 3. Query params: organizationId, orgId
   */
  private extractOrganizationId(request: any): string | undefined {
    // Try route params
    const orgId =
      request.params?.orgId ||
      request.params?.organizationId ||
      // For org-specific routes like /organizations/:id
      (request.route?.path?.includes('/organizations/')
        ? request.params?.id
        : undefined);

    if (orgId) {
      return orgId;
    }

    // Try request body
    const bodyOrgId = request.body?.organizationId || request.body?.orgId;
    if (bodyOrgId) {
      return bodyOrgId;
    }

    // Try query params
    const queryOrgId = request.query?.organizationId || request.query?.orgId;
    if (queryOrgId) {
      return queryOrgId;
    }

    return undefined;
  }

  /**
   * Extract resource ID from request
   * Tries route params: :id, :linkId, :biopageId, :campaignId, :tagId, etc.
   */
  private extractResourceId(request: any): string | undefined {
    return (
      request.params?.id ||
      request.params?.linkId ||
      request.params?.biopageId ||
      request.params?.campaignId ||
      request.params?.tagId ||
      request.params?.domainId ||
      request.params?.apiKeyId ||
      undefined
    );
  }

  /**
   * Throw a descriptive ForbiddenException
   */
  private throwForbiddenException(
    permission: PermissionMetadata,
    user: any,
  ): void {
    const { resource, action } = permission;

    throw new ForbiddenException({
      message: `Insufficient permissions for ${resource}:${action}`,
      error: 'Forbidden',
      details: {
        requiredPermission: `${resource}:${action}`,
        userId: user.id,
      },
    });
  }

  /**
   * Log access attempt for audit purposes
   * In production, this should integrate with your audit logging system
   */
  private logAccess(
    userId: string,
    organizationId: string,
    permissions: PermissionMetadata[],
    result: 'granted' | 'denied',
  ): void {
    // Optional: Log to console for development
    // In production, replace with proper audit logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[PermissionGuard]', {
        userId,
        organizationId,
        permissions: permissions.map((p) => `${p.resource}:${p.action}`),
        result,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
