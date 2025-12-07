import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type QuotaResource = 'links' | 'domains' | 'members' | 'api_calls';

export interface QuotaCheckResult {
  allowed: boolean;
  unlimited?: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

export interface UsageData {
  links: number;
  domains: number;
  members: number;
  apiCalls: number;
}

export interface PlanLimits {
  linksPerMonth: number;
  customDomains: number;
  teamMembers: number;
  apiCallsPerMonth: number;
  analyticsRetentionDays: number;
}

@Injectable()
export class QuotaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current year-month in 'YYYY-MM' format
   */
  getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get organization with its plan details
   */
  async getOrgWithPlan(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            members: true,
            domains: true,
          },
        },
      },
    });
    return org;
  }

  /**
   * Get plan limits from PlanDefinition or fallback to defaults
   */
  async getPlanLimits(planName: string): Promise<PlanLimits> {
    // First try to get from database
    const planDef = await this.prisma.planDefinition.findUnique({
      where: { name: planName.toLowerCase() },
    });

    if (planDef) {
      return {
        linksPerMonth: planDef.linksPerMonth,
        customDomains: planDef.customDomains,
        teamMembers: planDef.teamMembers,
        apiCallsPerMonth: planDef.apiCallsPerMonth,
        analyticsRetentionDays: planDef.analyticsRetentionDays,
      };
    }

    // Fallback defaults based on plan name
    const defaults: Record<string, PlanLimits> = {
      free: { linksPerMonth: 50, customDomains: 1, teamMembers: 1, apiCallsPerMonth: 0, analyticsRetentionDays: 30 },
      pro: { linksPerMonth: 1000, customDomains: 5, teamMembers: 10, apiCallsPerMonth: 10000, analyticsRetentionDays: 90 },
      enterprise: { linksPerMonth: -1, customDomains: -1, teamMembers: -1, apiCallsPerMonth: -1, analyticsRetentionDays: 730 },
    };

    return defaults[planName.toLowerCase()] || defaults.free;
  }

  /**
   * Get current month's usage for an organization
   */
  async getCurrentUsage(orgId: string): Promise<UsageData> {
    const yearMonth = this.getCurrentYearMonth();

    // Get monthly usage tracking
    const usage = await this.prisma.usageTracking.findUnique({
      where: {
        organizationId_yearMonth: { organizationId: orgId, yearMonth },
      },
    });

    // Get static counts (domains and members don't reset monthly)
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            members: true,
            domains: true,
          },
        },
      },
    });

    return {
      links: usage?.linksCreated ?? 0,
      domains: org?._count.domains ?? 0,
      members: org?._count.members ?? 0,
      apiCalls: usage?.apiCalls ?? 0,
    };
  }

  /**
   * Check if an organization can use a resource
   */
  async checkQuota(orgId: string, resource: QuotaResource): Promise<QuotaCheckResult> {
    const org = await this.getOrgWithPlan(orgId);
    if (!org) {
      return { allowed: false, currentUsage: 0, limit: 0, remaining: 0, percentUsed: 100 };
    }

    const limits = await this.getPlanLimits(org.plan);
    const usage = await this.getCurrentUsage(orgId);

    // Map resource to limit and usage
    const resourceMap: Record<QuotaResource, { limit: number; current: number }> = {
      links: { limit: limits.linksPerMonth, current: usage.links },
      domains: { limit: limits.customDomains, current: usage.domains },
      members: { limit: limits.teamMembers, current: usage.members },
      api_calls: { limit: limits.apiCallsPerMonth, current: usage.apiCalls },
    };

    const { limit, current } = resourceMap[resource];

    // Handle unlimited (-1)
    if (limit === -1) {
      return {
        allowed: true,
        unlimited: true,
        currentUsage: current,
        limit: -1,
        remaining: -1,
        percentUsed: 0,
      };
    }

    const remaining = Math.max(0, limit - current);
    const percentUsed = limit > 0 ? Math.round((current / limit) * 100) : 100;

    return {
      allowed: current < limit,
      currentUsage: current,
      limit,
      remaining,
      percentUsed,
    };
  }

  /**
   * Increment usage for a resource (atomic operation)
   */
  async incrementUsage(orgId: string, resource: 'links' | 'api_calls', count: number = 1): Promise<void> {
    const yearMonth = this.getCurrentYearMonth();

    const updateField = resource === 'links' ? 'linksCreated' : 'apiCalls';

    await this.prisma.usageTracking.upsert({
      where: {
        organizationId_yearMonth: { organizationId: orgId, yearMonth },
      },
      create: {
        organizationId: orgId,
        yearMonth,
        [updateField]: count,
      },
      update: {
        [updateField]: { increment: count },
      },
    });

    // Also log the event for detailed tracking (fire and forget)
    this.logUsageEvent(orgId, `${resource}_created`, null).catch(() => {});
  }

  /**
   * Decrement usage for a resource (won't go below 0)
   */
  async decrementUsage(orgId: string, resource: 'links', count: number = 1): Promise<void> {
    const yearMonth = this.getCurrentYearMonth();

    const usage = await this.prisma.usageTracking.findUnique({
      where: {
        organizationId_yearMonth: { organizationId: orgId, yearMonth },
      },
    });

    if (usage) {
      const newValue = Math.max(0, usage.linksCreated - count);
      await this.prisma.usageTracking.update({
        where: {
          organizationId_yearMonth: { organizationId: orgId, yearMonth },
        },
        data: {
          linksCreated: newValue,
        },
      });
    }

    // Log the event
    this.logUsageEvent(orgId, `${resource}_deleted`, null).catch(() => {});
  }

  /**
   * Log a usage event for detailed tracking
   */
  async logUsageEvent(
    orgId: string,
    eventType: string,
    resourceId: string | null,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.usageEvent.create({
      data: {
        organizationId: orgId,
        userId: userId || null,
        eventType,
        resourceId,
        metadata: metadata || null,
      },
    });
  }

  /**
   * Get full quota status for all resources
   */
  async getFullQuotaStatus(orgId: string): Promise<{
    plan: string;
    limits: PlanLimits;
    usage: UsageData;
    quotas: Record<QuotaResource, QuotaCheckResult>;
  }> {
    const org = await this.getOrgWithPlan(orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const limits = await this.getPlanLimits(org.plan);
    const usage = await this.getCurrentUsage(orgId);

    const resources: QuotaResource[] = ['links', 'domains', 'members', 'api_calls'];
    const quotas: Record<string, QuotaCheckResult> = {};

    for (const resource of resources) {
      quotas[resource] = await this.checkQuota(orgId, resource);
    }

    return {
      plan: org.plan,
      limits,
      usage,
      quotas: quotas as Record<QuotaResource, QuotaCheckResult>,
    };
  }

  /**
   * Get usage history for an organization (last 12 months)
   */
  async getUsageHistory(orgId: string, months: number = 12): Promise<any[]> {
    const history = await this.prisma.usageTracking.findMany({
      where: { organizationId: orgId },
      orderBy: { yearMonth: 'desc' },
      take: months,
    });

    return history;
  }

  /**
   * Recalculate static usage (domains, members) - useful for consistency
   */
  async recalculateStaticUsage(orgId: string): Promise<void> {
    const yearMonth = this.getCurrentYearMonth();

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            members: true,
            domains: true,
            links: true,  // Total links owned by org
          },
        },
      },
    });

    if (!org) return;

    // Upsert the usage tracking record
    await this.prisma.usageTracking.upsert({
      where: {
        organizationId_yearMonth: { organizationId: orgId, yearMonth },
      },
      create: {
        organizationId: orgId,
        yearMonth,
        linksCreated: 0,
        apiCalls: 0,
      },
      update: {},  // Just ensure record exists
    });
  }
}
