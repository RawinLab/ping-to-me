import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async create(userId: string, orgId: string, name: string, color?: string) {
    const tag = await this.prisma.tag.create({
      data: {
        name,
        color,
        organizationId: orgId,
      },
    });

    // Log tag creation
    this.auditService.logResourceEvent(
      userId,
      orgId,
      'tag.created',
      'Tag',
      tag.id,
      {
        details: {
          name: tag.name,
          color: tag.color,
        },
      },
    ).catch(() => {}); // Fire and forget, don't block on errors

    return tag;
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
    // Get current state for audit logging
    const before = await this.prisma.tag.findUnique({ where: { id } });

    // Verify ownership/permission via organizationId if needed,
    // but for now assuming orgId check in controller or just trusting ID + AuthGuard
    const tag = await this.prisma.tag.update({
      where: { id },
      data,
    });

    // Log tag update with changes
    if (before) {
      const changes = this.auditService.captureChanges(before, tag);
      this.auditService.logResourceEvent(
        userId,
        before.organizationId,
        'tag.updated',
        'Tag',
        tag.id,
        {
          changes,
          details: {
            name: tag.name,
          },
        },
      ).catch(() => {}); // Fire and forget, don't block on errors
    }

    return tag;
  }

  async remove(userId: string, id: string) {
    // Get tag data before deletion for audit logging
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    const deleted = await this.prisma.tag.delete({
      where: { id },
    });

    // Log tag deletion
    if (tag) {
      this.auditService.logResourceEvent(
        userId,
        tag.organizationId,
        'tag.deleted',
        'Tag',
        tag.id,
        {
          details: {
            name: tag.name,
          },
        },
      ).catch(() => {}); // Fire and forget, don't block on errors
    }

    return deleted;
  }
}
