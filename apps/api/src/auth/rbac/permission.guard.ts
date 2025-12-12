import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Optional,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionService } from "./permission.service";
import {
  PERMISSION_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  PermissionMetadata,
} from "./permission.decorator";
import { AccessLogService, AccessResult } from "./access-log.service";

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
    @Optional() private accessLogService?: AccessLogService,
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
    const apiKey = request.apiKey;

    // If API key is present and has valid scopes, allow access
    // API key scope validation is handled by ApiScopeGuard
    if (apiKey && apiKey.scopes) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    // Extract organization ID from request (try multiple sources)
    const organizationId = this.extractOrganizationId(request);

    if (!organizationId) {
      throw new ForbiddenException("Organization context required");
    }

    // Extract resource ID for ownership checks (if needed)
    const resourceId = this.extractResourceId(request);

    // Extract request metadata for logging
    const requestMeta = this.extractRequestMetadata(request);

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
        // Log denied access
        this.logAccess(
          user.id,
          organizationId,
          permissions,
          AccessResult.DENIED,
          `Insufficient permissions for ${permissions[0].resource}:${permissions[0].action}`,
          requestMeta,
        );
        this.throwForbiddenException(permissions[0], user);
      }

      // Log granted access
      this.logAccess(
        user.id,
        organizationId,
        permissions,
        AccessResult.ALLOWED,
        undefined,
        requestMeta,
      );

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
        // Log denied access
        this.logAccess(
          user.id,
          organizationId,
          requireAllMetadata,
          AccessResult.DENIED,
          `Missing required permissions`,
          requestMeta,
        );
        this.throwForbiddenException(requireAllMetadata[0], user);
      }

      // Log granted access
      this.logAccess(
        user.id,
        organizationId,
        requireAllMetadata,
        AccessResult.ALLOWED,
        undefined,
        requestMeta,
      );

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
   *
   * For 'own' context decorators:
   * - First check if user's role has '*' (full access) permission for this resource/action
   * - If yes, allow without ownership check (OWNER/ADMIN can manage all resources)
   * - If no, then check resource ownership (EDITOR can only manage own resources)
   */
  private async checkSinglePermission(
    userId: string,
    organizationId: string,
    permission: PermissionMetadata,
    resourceId?: string,
  ): Promise<boolean> {
    const { resource, action, context } = permission;

    // First, check if user has full access ('*' scope) for this resource/action
    // This allows OWNER/ADMIN to bypass ownership checks
    const hasFullAccess = await this.permissionService.hasFullAccessPermission(
      userId,
      organizationId,
      resource as any,
      action as any,
    );

    if (hasFullAccess) {
      return true;
    }

    // For 'own' context, verify resource ownership if user doesn't have full access
    if (context === "own" && resourceId) {
      const ownsResource = await this.permissionService.checkResourceOwnership(
        userId,
        resource,
        resourceId,
      );

      if (!ownsResource) {
        return false;
      }
    }

    // Check base permission with ownership context
    return this.permissionService.hasPermission(
      userId,
      organizationId,
      resource as any,
      action as any,
      {
        ownerId: context === "own" ? userId : undefined,
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
    // Try X-Organization-Id header first (preferred method from frontend)
    const headerOrgId =
      request.headers?.["x-organization-id"] ||
      request.headers?.["X-Organization-Id"];
    if (headerOrgId) {
      return headerOrgId;
    }

    // Try route params
    const orgId =
      request.params?.orgId ||
      request.params?.organizationId ||
      // For org-specific routes like /organizations/:id
      (request.route?.path?.includes("/organizations/")
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
      error: "Forbidden",
      details: {
        requiredPermission: `${resource}:${action}`,
        userId: user.id,
      },
    });
  }

  /**
   * Extract request metadata for logging
   */
  private extractRequestMetadata(request: any): {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
  } {
    return {
      ipAddress:
        request.ip ||
        request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        request.connection?.remoteAddress,
      userAgent: request.headers?.["user-agent"],
      endpoint: request.originalUrl || request.url,
      method: request.method,
    };
  }

  /**
   * Log access attempt for audit purposes
   * Uses AccessLogService for persistent logging to database
   */
  private logAccess(
    userId: string,
    organizationId: string,
    permissions: PermissionMetadata[],
    result: AccessResult,
    reason?: string,
    requestMeta?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
    },
  ): void {
    // Log to AccessLogService if available
    if (this.accessLogService) {
      // Log each permission check separately for granular auditing
      for (const permission of permissions) {
        this.accessLogService.log({
          userId,
          organizationId,
          resource: permission.resource,
          action: permission.action,
          result,
          reason,
          ipAddress: requestMeta?.ipAddress,
          userAgent: requestMeta?.userAgent,
          endpoint: requestMeta?.endpoint,
          method: requestMeta?.method,
        });
      }
    }

    // Also log to console in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[PermissionGuard]", {
        userId,
        organizationId,
        permissions: permissions.map((p) => `${p.resource}:${p.action}`),
        result,
        reason,
        endpoint: requestMeta?.endpoint,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
