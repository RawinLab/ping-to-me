import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, MemberRole } from '@pingtome/database';

@Injectable()
export class OrganizationService {
  private prisma = new PrismaClient();

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
