import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole } from '@pingtome/database';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) { }

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

    return this.prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async delete(orgId: string, userId: string) {
    // Only owner can delete
    await this.checkPermission(orgId, userId, ['OWNER']);

    return this.prisma.organization.delete({
      where: { id: orgId },
    });
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

  async inviteMember(orgId: string, email: string, role: MemberRole) {
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
    return this.prisma.organizationMember.create({
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
  }

  async updateMemberRole(orgId: string, userId: string, role: MemberRole) {
    // Check if member exists
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      data: { role },
    });
  }

  async removeMember(orgId: string, userId: string) {
    // Prevent removing the last owner? (Optional for MVP but good practice)
    // For now, just remove.
    return this.prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });
  }
}

