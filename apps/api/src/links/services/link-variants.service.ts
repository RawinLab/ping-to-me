import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateLinkVariantDto, UpdateLinkVariantDto } from '../dto/link-variant.dto';

@Injectable()
export class LinkVariantsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, linkId: string, dto: CreateLinkVariantDto) {
    // 1. Verify user owns the link
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, organizationId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Validate total weights don't exceed 100
    const existingVariants = await this.prisma.linkVariant.findMany({
      where: { linkId },
      select: { weight: true }
    });

    const totalWeight = existingVariants.reduce((sum, v) => sum + v.weight, 0);
    const newWeight = dto.weight ?? 50;

    if (totalWeight + newWeight > 100) {
      throw new BadRequestException(
        `Total weight would exceed 100. Current total: ${totalWeight}, attempting to add: ${newWeight}. Maximum remaining: ${100 - totalWeight}`
      );
    }

    // 3. Create variant
    const variant = await this.prisma.linkVariant.create({
      data: {
        linkId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        weight: newWeight,
        isActive: dto.isActive ?? true,
      }
    });

    // 4. Audit log
    await this.auditService.log({
      userId,
      organizationId: link.organizationId || undefined,
      action: 'link_variant.created',
      resource: 'LinkVariant',
      resourceId: variant.id,
      details: {
        linkId,
        variantName: dto.name,
        targetUrl: dto.targetUrl,
        weight: newWeight
      }
    });

    return variant;
  }

  async findAllByLink(userId: string, linkId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.linkVariant.findMany({
      where: { linkId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findOne(userId: string, linkId: string, variantId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const variant = await this.prisma.linkVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant || variant.linkId !== linkId) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  async update(userId: string, linkId: string, variantId: string, dto: UpdateLinkVariantDto) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, organizationId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify variant belongs to this link
    const existingVariant = await this.prisma.linkVariant.findUnique({
      where: { id: variantId }
    });

    if (!existingVariant || existingVariant.linkId !== linkId) {
      throw new NotFoundException('Variant not found');
    }

    // Validate weights if updating
    if (dto.weight !== undefined) {
      const otherVariants = await this.prisma.linkVariant.findMany({
        where: { linkId, id: { not: variantId } },
        select: { weight: true }
      });

      const totalOtherWeight = otherVariants.reduce((sum, v) => sum + v.weight, 0);
      if (totalOtherWeight + dto.weight > 100) {
        throw new BadRequestException(
          `Total weight would exceed 100. Other variants total: ${totalOtherWeight}, attempting to set: ${dto.weight}. Maximum allowed: ${100 - totalOtherWeight}`
        );
      }
    }

    // Capture before state
    const before = {
      name: existingVariant.name,
      targetUrl: existingVariant.targetUrl,
      weight: existingVariant.weight,
      isActive: existingVariant.isActive
    };

    const updated = await this.prisma.linkVariant.update({
      where: { id: variantId },
      data: dto
    });

    // Capture after state
    const after = {
      name: updated.name,
      targetUrl: updated.targetUrl,
      weight: updated.weight,
      isActive: updated.isActive
    };

    // Audit log with changes
    const changes = this.auditService.captureChanges(before, after);
    if (changes) {
      await this.auditService.log({
        userId,
        organizationId: link.organizationId || undefined,
        action: 'link_variant.updated',
        resource: 'LinkVariant',
        resourceId: variantId,
        details: { linkId, variantName: updated.name },
        changes
      });
    }

    return updated;
  }

  async delete(userId: string, linkId: string, variantId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, organizationId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Verify variant belongs to this link
    const variant = await this.prisma.linkVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant || variant.linkId !== linkId) {
      throw new NotFoundException('Variant not found');
    }

    await this.prisma.linkVariant.delete({
      where: { id: variantId }
    });

    // Audit log
    await this.auditService.log({
      userId,
      organizationId: link.organizationId || undefined,
      action: 'link_variant.deleted',
      resource: 'LinkVariant',
      resourceId: variantId,
      details: {
        linkId,
        variantName: variant.name,
        targetUrl: variant.targetUrl
      }
    });

    return { success: true, message: 'Variant deleted successfully' };
  }

  // Get variants for redirect selection (used by redirector)
  async getActiveVariants(linkId: string) {
    return this.prisma.linkVariant.findMany({
      where: { linkId, isActive: true },
      select: { id: true, targetUrl: true, weight: true }
    });
  }

  // Increment click count for a variant
  async incrementVariantClicks(variantId: string) {
    await this.prisma.linkVariant.update({
      where: { id: variantId },
      data: { clicks: { increment: 1 } }
    });
  }

  // Get variant performance stats
  async getVariantStats(userId: string, linkId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    });

    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const variants = await this.prisma.linkVariant.findMany({
      where: { linkId },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate total clicks across all variants
    const totalClicks = variants.reduce((sum, v) => sum + v.clicks, 0);

    // Calculate performance metrics for each variant
    const stats = variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      targetUrl: variant.targetUrl,
      weight: variant.weight,
      clicks: variant.clicks,
      isActive: variant.isActive,
      clickPercentage: totalClicks > 0 ? (variant.clicks / totalClicks) * 100 : 0,
      expectedPercentage: variant.weight,
      performance: totalClicks > 0 ?
        ((variant.clicks / totalClicks) * 100) - variant.weight : 0, // Positive = overperforming
      createdAt: variant.createdAt
    }));

    return {
      variants: stats,
      totalClicks,
      totalWeight: variants.reduce((sum, v) => sum + v.weight, 0)
    };
  }
}
