import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, orgId: string, name: string, description?: string) {
    return this.prisma.campaign.create({
      data: {
        name,
        description,
        organizationId: orgId,
      },
    });
  }

  async findAll(userId: string, orgId: string) {
    return this.prisma.campaign.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { links: true },
        },
      },
    });
  }

  async update(userId: string, id: string, data: { name?: string; description?: string }) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.campaign.delete({
      where: { id },
    });
  }
}
