import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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

  async getStatistics(userId: string, orgId: string) {
    // Get all tags for the organization
    const tags = await this.prisma.tag.findMany({
      where: { organizationId: orgId },
    });

    // Count links per tag by checking Link.tags array contains tag name
    const tagStats = await Promise.all(
      tags.map(async (tag) => {
        const linkCount = await this.prisma.link.count({
          where: {
            organizationId: orgId,
            tags: { has: tag.name },
          },
        });
        return {
          ...tag,
          linkCount,
        };
      })
    );

    const totalTags = tags.length;
    const unusedTags = tagStats.filter(t => t.linkCount === 0).length;

    return {
      tags: tagStats,
      totalTags,
      unusedTags,
      usedTags: totalTags - unusedTags,
    };
  }

  async merge(userId: string, sourceTagId: string, targetTagId: string) {
    // Get both tags
    const sourceTag = await this.prisma.tag.findUnique({ where: { id: sourceTagId } });
    const targetTag = await this.prisma.tag.findUnique({ where: { id: targetTagId } });

    if (!sourceTag || !targetTag) {
      throw new NotFoundException('Tag not found');
    }

    if (sourceTag.organizationId !== targetTag.organizationId) {
      throw new BadRequestException('Cannot merge tags from different organizations');
    }

    if (sourceTagId === targetTagId) {
      throw new BadRequestException('Cannot merge tag with itself');
    }

    // Use transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Find all links with source tag
      const linksWithSourceTag = await tx.link.findMany({
        where: {
          organizationId: sourceTag.organizationId,
          tags: { has: sourceTag.name },
        },
        select: { id: true, tags: true },
      });

      // Update each link: replace source tag with target tag (if not already has target)
      for (const link of linksWithSourceTag) {
        let newTags = link.tags.filter(t => t !== sourceTag.name);
        if (!newTags.includes(targetTag.name)) {
          newTags.push(targetTag.name);
        }
        await tx.link.update({
          where: { id: link.id },
          data: { tags: newTags },
        });
      }

      // Delete source tag
      await tx.tag.delete({ where: { id: sourceTagId } });

      return { mergedLinksCount: linksWithSourceTag.length };
    });

    // Audit log
    this.auditService.logResourceEvent(
      userId,
      sourceTag.organizationId,
      'tag.merged',
      'Tag',
      targetTagId,
      {
        details: {
          sourceTagId,
          sourceTagName: sourceTag.name,
          targetTagId,
          targetTagName: targetTag.name,
          mergedLinksCount: result.mergedLinksCount,
        },
      }
    ).catch(() => {});

    return {
      success: true,
      mergedLinksCount: result.mergedLinksCount,
      targetTag,
    };
  }
}
