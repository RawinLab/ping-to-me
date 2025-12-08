import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateRedirectRuleDto, UpdateRedirectRuleDto } from '../dto/redirect-rule.dto';

@Injectable()
export class RedirectRulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Verify that a user owns a link
   * Throws ForbiddenException if user doesn't own the link
   */
  private async verifyLinkOwnership(userId: string, linkId: string): Promise<void> {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    if (link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Create a new redirect rule for a link
   */
  async create(userId: string, linkId: string, dto: CreateRedirectRuleDto) {
    // Verify ownership
    await this.verifyLinkOwnership(userId, linkId);

    // Validate target URL
    try {
      new URL(dto.targetUrl);
    } catch (e) {
      throw new BadRequestException('Invalid target URL format');
    }

    // Create the redirect rule
    const rule = await this.prisma.redirectRule.create({
      data: {
        linkId,
        priority: dto.priority ?? 0,
        countries: dto.countries ?? [],
        devices: dto.devices ?? [],
        browsers: dto.browsers ?? [],
        os: dto.os ?? [],
        languages: dto.languages ?? [],
        dateRange: dto.dateRange ?? null,
        timeRange: dto.timeRange ?? null,
        targetUrl: dto.targetUrl,
        redirectType: dto.redirectType ?? 302,
        isActive: dto.isActive ?? true,
      },
    });

    // Audit log - redirect rule created
    this.auditService
      .logResourceEvent(
        userId,
        null,
        'redirect_rule.created',
        'RedirectRule',
        rule.id,
        {
          details: {
            linkId,
            priority: rule.priority,
            targetUrl: rule.targetUrl,
            conditions: {
              countries: rule.countries,
              devices: rule.devices,
              browsers: rule.browsers,
              os: rule.os,
              languages: rule.languages,
              dateRange: rule.dateRange,
              timeRange: rule.timeRange,
            },
          },
        },
      )
      .catch((err) => console.error('Audit log failed:', err));

    return rule;
  }

  /**
   * Get all redirect rules for a link
   */
  async findAllByLink(userId: string, linkId: string) {
    // Verify ownership
    await this.verifyLinkOwnership(userId, linkId);

    // Get all rules ordered by priority (descending)
    const rules = await this.prisma.redirectRule.findMany({
      where: { linkId },
      orderBy: { priority: 'desc' },
    });

    return rules;
  }

  /**
   * Update a redirect rule
   */
  async update(userId: string, linkId: string, ruleId: string, dto: UpdateRedirectRuleDto) {
    // Verify ownership
    await this.verifyLinkOwnership(userId, linkId);

    // Check if rule exists and belongs to the link
    const existingRule = await this.prisma.redirectRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      throw new NotFoundException('Redirect rule not found');
    }

    if (existingRule.linkId !== linkId) {
      throw new ForbiddenException('Redirect rule does not belong to this link');
    }

    // Validate target URL if provided
    if (dto.targetUrl) {
      try {
        new URL(dto.targetUrl);
      } catch (e) {
        throw new BadRequestException('Invalid target URL format');
      }
    }

    // Capture state before update
    const before = {
      priority: existingRule.priority,
      countries: existingRule.countries,
      devices: existingRule.devices,
      browsers: existingRule.browsers,
      os: existingRule.os,
      languages: existingRule.languages,
      dateRange: existingRule.dateRange,
      timeRange: existingRule.timeRange,
      targetUrl: existingRule.targetUrl,
      redirectType: existingRule.redirectType,
      isActive: existingRule.isActive,
    };

    // Update the rule
    const updated = await this.prisma.redirectRule.update({
      where: { id: ruleId },
      data: {
        priority: dto.priority,
        countries: dto.countries,
        devices: dto.devices,
        browsers: dto.browsers,
        os: dto.os,
        languages: dto.languages,
        dateRange: dto.dateRange !== undefined ? dto.dateRange : undefined,
        timeRange: dto.timeRange !== undefined ? dto.timeRange : undefined,
        targetUrl: dto.targetUrl,
        redirectType: dto.redirectType,
        isActive: dto.isActive,
      },
    });

    // Capture state after update
    const after = {
      priority: updated.priority,
      countries: updated.countries,
      devices: updated.devices,
      browsers: updated.browsers,
      os: updated.os,
      languages: updated.languages,
      dateRange: updated.dateRange,
      timeRange: updated.timeRange,
      targetUrl: updated.targetUrl,
      redirectType: updated.redirectType,
      isActive: updated.isActive,
    };

    // Audit log - redirect rule updated
    const changes = this.auditService.captureChanges(before, after);
    if (changes) {
      this.auditService
        .logResourceEvent(
          userId,
          null,
          'redirect_rule.updated',
          'RedirectRule',
          ruleId,
          {
            details: { linkId },
            changes,
          },
        )
        .catch((err) => console.error('Audit log failed:', err));
    }

    return updated;
  }

  /**
   * Delete a redirect rule
   */
  async delete(userId: string, linkId: string, ruleId: string) {
    // Verify ownership
    await this.verifyLinkOwnership(userId, linkId);

    // Check if rule exists and belongs to the link
    const existingRule = await this.prisma.redirectRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      throw new NotFoundException('Redirect rule not found');
    }

    if (existingRule.linkId !== linkId) {
      throw new ForbiddenException('Redirect rule does not belong to this link');
    }

    // Delete the rule
    await this.prisma.redirectRule.delete({
      where: { id: ruleId },
    });

    // Audit log - redirect rule deleted
    this.auditService
      .logResourceEvent(
        userId,
        null,
        'redirect_rule.deleted',
        'RedirectRule',
        ruleId,
        {
          details: {
            linkId,
            targetUrl: existingRule.targetUrl,
            priority: existingRule.priority,
          },
        },
      )
      .catch((err) => console.error('Audit log failed:', err));

    return { success: true, message: 'Redirect rule deleted' };
  }

  /**
   * Reorder redirect rules by updating their priorities
   * The first ID in the array gets the highest priority
   */
  async reorder(userId: string, linkId: string, ruleIds: string[]) {
    // Verify ownership
    await this.verifyLinkOwnership(userId, linkId);

    // Verify all rules exist and belong to this link
    const existingRules = await this.prisma.redirectRule.findMany({
      where: {
        id: { in: ruleIds },
        linkId,
      },
    });

    if (existingRules.length !== ruleIds.length) {
      throw new BadRequestException('Some redirect rules not found or do not belong to this link');
    }

    // Update priorities in a transaction
    // First rule gets highest priority (equal to length of array)
    await this.prisma.$transaction(
      ruleIds.map((ruleId, index) => {
        const priority = ruleIds.length - index; // Higher priority for earlier items
        return this.prisma.redirectRule.update({
          where: { id: ruleId },
          data: { priority },
        });
      }),
    );

    // Audit log - redirect rules reordered
    this.auditService
      .logResourceEvent(
        userId,
        null,
        'redirect_rule.reordered',
        'RedirectRule',
        linkId,
        {
          details: {
            linkId,
            ruleCount: ruleIds.length,
            order: ruleIds,
          },
        },
      )
      .catch((err) => console.error('Audit log failed:', err));

    return { success: true, message: 'Redirect rules reordered', count: ruleIds.length };
  }
}
