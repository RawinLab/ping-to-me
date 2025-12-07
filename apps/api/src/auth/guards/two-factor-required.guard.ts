import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationService } from "../../organizations/organization.service";

/**
 * Guard to enforce 2FA for organization members
 * based on organization security settings
 *
 * This guard should be applied to organization-scoped routes
 * that require 2FA enforcement.
 *
 * It checks:
 * 1. If the user is accessing an organization resource
 * 2. If 2FA is required for the user's role in that organization
 * 3. If the user has 2FA enabled
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard, PermissionGuard)
 * @Get(':id/some-resource')
 * async someMethod(@Param('id') orgId: string) { ... }
 */
@Injectable()
export class TwoFactorRequiredGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is authenticated, let JwtAuthGuard handle it
    if (!user || !user.id) {
      return true;
    }

    // Get organization ID from route params
    const orgId = request.params?.id || request.params?.organizationId;

    // If no organization ID in params, skip this check
    if (!orgId) {
      return true;
    }

    // Check if this is a 2FA setup route - allow access to 2FA setup pages
    const path = request.route?.path || "";
    if (
      path.includes("/auth/2fa") ||
      path.includes("/two-factor") ||
      path.includes("/settings/security")
    ) {
      return true;
    }

    try {
      // Check if 2FA is required for this user in this organization
      const is2FARequired = await this.organizationService.is2FARequired(
        orgId,
        user.id,
      );

      if (!is2FARequired) {
        // 2FA not required, allow access
        return true;
      }

      // 2FA is required - check if user has enabled 2FA
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { twoFactorEnabled: true, email: true },
      });

      if (!userRecord) {
        throw new ForbiddenException("User not found");
      }

      if (!userRecord.twoFactorEnabled) {
        // User has not enabled 2FA but it's required
        throw new ForbiddenException({
          code: "2FA_REQUIRED",
          message:
            "Two-factor authentication is required for your role in this organization. Please enable 2FA in your security settings before accessing organization resources.",
          setupUrl: "/dashboard/settings/security",
        });
      }

      // User has 2FA enabled, allow access
      return true;
    } catch (error) {
      // If it's already a ForbiddenException, re-throw it
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // For other errors, allow access (don't block on infrastructure errors)
      console.error("Error in TwoFactorRequiredGuard:", error);
      return true;
    }
  }
}
