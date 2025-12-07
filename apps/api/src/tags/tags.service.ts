import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(userId: string, orgId: string, name: string, color?: string) {
    const tag = await this.prisma.tag.create({
      data: {
        name,
        color,
        organizationId: orgId,
      },
    });

    // Log tag creation
    this.auditService
      .logResourceEvent(userId, orgId, "tag.created", "Tag", tag.id, {
        details: {
          name: tag.name,
          color: tag.color,
        },
      })
      .catch(() => {}); // Fire and forget, don't block on errors

    return tag;
  }

  async findAll(userId: string, orgId: string) {
    return this.prisma.tag.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; color?: string },
  ) {
    // Get current state for audit logging
    const before = await this.prisma.tag.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException("Tag not found");
    }

    // Use transaction for tag rename cascade
    const result = await this.prisma.$transaction(async (tx) => {
      // Update tag
      const tag = await tx.tag.update({
        where: { id },
        data,
      });

      let affectedLinksCount = 0;

      // If name changed, cascade update to all links
      if (data.name && before.name !== data.name) {
        // Find all links in the same organization with old tag name
        const linksWithTag = await tx.link.findMany({
          where: {
            organizationId: before.organizationId,
            tags: { has: before.name },
          },
          select: { id: true, tags: true },
        });

        // Update each link's tags array
        for (const link of linksWithTag) {
          const newTags = link.tags.map((t) =>
            t === before.name ? data.name : t,
          );
          await tx.link.update({
            where: { id: link.id },
            data: { tags: newTags },
          });
        }
        affectedLinksCount = linksWithTag.length;
      }

      return { tag, affectedLinksCount };
    });

    // Audit log with affected links count
    if (before) {
      const changes = this.auditService.captureChanges(before, result.tag);
      this.auditService
        .logResourceEvent(
          userId,
          before.organizationId,
          "tag.updated",
          "Tag",
          result.tag.id,
          {
            changes,
            details: {
              name: result.tag.name,
              affectedLinksCount: result.affectedLinksCount,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }

    return result.tag;
  }

  async remove(userId: string, id: string) {
    // Get tag data before deletion for audit logging
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    const deleted = await this.prisma.tag.delete({
      where: { id },
    });

    // Log tag deletion
    if (tag) {
      this.auditService
        .logResourceEvent(
          userId,
          tag.organizationId,
          "tag.deleted",
          "Tag",
          tag.id,
          {
            details: {
              name: tag.name,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }

    return deleted;
  }
}
