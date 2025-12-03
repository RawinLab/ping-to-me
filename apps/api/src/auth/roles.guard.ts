import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient, MemberRole } from '@pingtome/database';

@Injectable()
export class RolesGuard implements CanActivate {
  private prisma = new PrismaClient();

  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<MemberRole[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.id || request.body.orgId || request.query.orgId; // Assumes orgId is in params/body/query

    if (!user || !orgId) {
      return false;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
