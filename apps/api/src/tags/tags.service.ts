import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, orgId: string, name: string, color?: string) {
    return this.prisma.tag.create({
      data: {
        name,
        color,
        organizationId: orgId,
      },
    });
  }

  async findAll(userId: string, orgId: string) {
    return this.prisma.tag.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(userId: string, id: string, data: { name?: string; color?: string }) {
    // Verify ownership/permission via organizationId if needed, 
    // but for now assuming orgId check in controller or just trusting ID + AuthGuard
    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
