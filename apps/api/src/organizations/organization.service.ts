import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@pingtome/database';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  // Organization CRUD
  async create(userId: string, data: { name: string; slug: string }) {
    // Create organization and add creator as owner
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    // Audit log: org created
    await this.auditService.logOrgEvent(userId, org.id, 'org.created', {
      details: {
        name: org.name,
        slug: org.slug,
      },
    });

    return org;
  }

  async findAll(userId: string) {
    // Get all organizations the user is a member of
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async findOne(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { members: true, links: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is a member
    const isMember = org.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Access denied');
    }

    return org;
  }

  async update(orgId: string, userId: string, data: { name?: string; slug?: string }) {
    // Check if user is owner/admin
    await this.checkPermission(orgId, userId, ['OWNER', 'ADMIN']);

    // Get current org state for change tracking
    const before = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true },
    });

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data,
    });

    // Audit log: org updated with change tracking
    const changes = this.auditService.captureChanges(before, { name: updated.name, slug: updated.slug });
    if (changes) {
      await this.auditService.logOrgEvent(userId, orgId, 'org.updated', {
        changes,
        details: {
          updatedFields: Object.keys(data),
        },
      });
    }

    return updated;
  }

  async delete(orgId: string, userId: string) {
    // Only owner can delete
    await this.checkPermission(orgId, userId, ['OWNER']);

    // Get org details before deletion
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true },
    });

    const deleted = await this.prisma.organization.delete({
      where: { id: orgId },
    });

    // Audit log: org deleted
    await this.auditService.logOrgEvent(userId, orgId, 'org.deleted', {
      details: {
        name: org?.name,
        slug: org?.slug,
      },
    });

    return deleted;
  }

  private async checkPermission(orgId: string, userId: string, allowedRoles: string[]) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Permission denied');
    }

    return member;
  }

  // Member management
  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async inviteMember(orgId: string, invitedByUserId: string, email: string, role: MemberRole) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found. For MVP, user must be registered first.');
    }

    // 2. Check if already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this organization');
    }

    // 3. Add member
    const newMember = await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Audit log: member invited/joined (in MVP, this is immediate)
    await this.auditService.logTeamEvent(
      invitedByUserId,
      orgId,
      'member.joined',
      {
        userId: user.id,
        email: user.email,
        role: role,
      },
      {
        details: {
          invitedBy: invitedByUserId,
        },
      },
    );

    return newMember;
  }

  async updateMemberRole(orgId: string, targetUserId: string, updatedByUserId: string, role: MemberRole) {
    // Check if member exists
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const oldRole = member.role;

    const updated = await this.prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      data: { role },
    });

    // Audit log: member role changed
    await this.auditService.logTeamEvent(
      updatedByUserId,
      orgId,
      'member.role_changed',
      {
        userId: targetUserId,
        email: member.user.email,
        role: role,
      },
      {
        changes: {
          before: { role: oldRole },
          after: { role: role },
        },
        details: {
          targetUserId: targetUserId,
        },
      },
    );

    return updated;
  }

  async removeMember(orgId: string, targetUserId: string, removedByUserId: string) {
    // Prevent removing the last owner? (Optional for MVP but good practice)
    // For now, just remove.

    // Get member details before removal
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const deleted = await this.prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
    });

    // Audit log: member removed
    if (member) {
      await this.auditService.logTeamEvent(
        removedByUserId,
        orgId,
        'member.removed',
        {
          userId: targetUserId,
          email: member.user.email,
          role: member.role,
        },
        {
          details: {
            targetUserId: targetUserId,
            removedRole: member.role,
          },
        },
      );
    }

    return deleted;
  }
}

