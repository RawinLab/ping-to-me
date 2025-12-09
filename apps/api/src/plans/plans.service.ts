import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePlanDto, UpdatePlanDto } from "./dto";

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    const plans = await this.prisma.planDefinition.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    // Format for display
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
        yearlySavings: Number(plan.priceYearly) > 0
          ? Math.round((1 - Number(plan.priceYearly) / (Number(plan.priceMonthly) * 12)) * 100)
          : 0,
      },
      features: plan.features,
      stripePriceIds: {
        monthly: plan.stripePriceIdMonthly,
        yearly: plan.stripePriceIdYearly,
      },
    }));
  }

  async getPlanByName(name: string) {
    const plan = await this.prisma.planDefinition.findUnique({
      where: { name: name.toLowerCase() },
    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
      },
      features: plan.features,
    };
  }

  async getComparisonMatrix() {
    const plans = await this.prisma.planDefinition.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    const formatLimit = (val: number) => val === -1 ? 'Unlimited' : val.toString();

    return {
      plans: plans.map(p => p.displayName),
      features: [
        {
          name: 'Links per month',
          values: plans.map(p => formatLimit(p.linksPerMonth)),
        },
        {
          name: 'Custom domains',
          values: plans.map(p => formatLimit(p.customDomains)),
        },
        {
          name: 'Team members',
          values: plans.map(p => formatLimit(p.teamMembers)),
        },
        {
          name: 'API calls per month',
          values: plans.map(p => formatLimit(p.apiCallsPerMonth)),
        },
        {
          name: 'Analytics retention',
          values: plans.map(p => `${p.analyticsRetentionDays} days`),
        },
      ],
      pricing: plans.map(p => ({
        name: p.displayName,
        monthly: Number(p.priceMonthly),
        yearly: Number(p.priceYearly),
      })),
    };
  }

  // ==================== Admin CRUD Methods ====================

  /**
   * Get all plans (including inactive) - Admin only
   */
  async findAll() {
    const plans = await this.prisma.planDefinition.findMany({
      orderBy: [
        { isActive: 'desc' },
        { priceMonthly: 'asc' },
      ],
    });

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
      },
      features: plan.features,
      stripePriceIds: {
        monthly: plan.stripePriceIdMonthly,
        yearly: plan.stripePriceIdYearly,
      },
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));
  }

  /**
   * Get single plan by ID - Admin only
   */
  async findOne(id: string) {
    const plan = await this.prisma.planDefinition.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
      },
      features: plan.features,
      stripePriceIds: {
        monthly: plan.stripePriceIdMonthly,
        yearly: plan.stripePriceIdYearly,
      },
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  /**
   * Create a new plan - Admin only
   */
  async create(dto: CreatePlanDto) {
    // Check if plan name already exists
    const existing = await this.prisma.planDefinition.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Plan with name '${dto.name}' already exists`);
    }

    // Create plan
    const plan = await this.prisma.planDefinition.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        linksPerMonth: dto.linksPerMonth,
        customDomains: dto.customDomains,
        teamMembers: dto.teamMembers,
        apiCallsPerMonth: dto.apiCallsPerMonth,
        analyticsRetentionDays: dto.analyticsRetentionDays,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly,
        stripePriceIdMonthly: dto.stripePriceIdMonthly,
        stripePriceIdYearly: dto.stripePriceIdYearly,
        features: dto.features,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
      },
      features: plan.features,
      stripePriceIds: {
        monthly: plan.stripePriceIdMonthly,
        yearly: plan.stripePriceIdYearly,
      },
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  /**
   * Update an existing plan - Admin only
   */
  async update(id: string, dto: UpdatePlanDto) {
    // Check if plan exists
    const existing = await this.prisma.planDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // If changing name, check for conflicts
    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.prisma.planDefinition.findUnique({
        where: { name: dto.name },
      });

      if (nameConflict) {
        throw new ConflictException(`Plan with name '${dto.name}' already exists`);
      }
    }

    // Update plan
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.linksPerMonth !== undefined) updateData.linksPerMonth = dto.linksPerMonth;
    if (dto.customDomains !== undefined) updateData.customDomains = dto.customDomains;
    if (dto.teamMembers !== undefined) updateData.teamMembers = dto.teamMembers;
    if (dto.apiCallsPerMonth !== undefined) updateData.apiCallsPerMonth = dto.apiCallsPerMonth;
    if (dto.analyticsRetentionDays !== undefined) updateData.analyticsRetentionDays = dto.analyticsRetentionDays;
    if (dto.priceMonthly !== undefined) updateData.priceMonthly = dto.priceMonthly;
    if (dto.priceYearly !== undefined) updateData.priceYearly = dto.priceYearly;
    if (dto.stripePriceIdMonthly !== undefined) updateData.stripePriceIdMonthly = dto.stripePriceIdMonthly;
    if (dto.stripePriceIdYearly !== undefined) updateData.stripePriceIdYearly = dto.stripePriceIdYearly;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const plan = await this.prisma.planDefinition.update({
      where: { id },
      data: updateData,
    });

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      limits: {
        linksPerMonth: plan.linksPerMonth,
        customDomains: plan.customDomains,
        teamMembers: plan.teamMembers,
        apiCallsPerMonth: plan.apiCallsPerMonth,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
      pricing: {
        monthly: Number(plan.priceMonthly),
        yearly: Number(plan.priceYearly),
      },
      features: plan.features,
      stripePriceIds: {
        monthly: plan.stripePriceIdMonthly,
        yearly: plan.stripePriceIdYearly,
      },
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  /**
   * Soft delete (deactivate) a plan - Admin only
   */
  async softDelete(id: string) {
    const plan = await this.prisma.planDefinition.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    if (!plan.isActive) {
      throw new ConflictException('Plan is already inactive');
    }

    const updated = await this.prisma.planDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      id: updated.id,
      name: updated.name,
      displayName: updated.displayName,
      isActive: updated.isActive,
    };
  }

  /**
   * Restore (reactivate) a plan - Admin only
   */
  async restore(id: string) {
    const plan = await this.prisma.planDefinition.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    if (plan.isActive) {
      throw new ConflictException('Plan is already active');
    }

    const updated = await this.prisma.planDefinition.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      id: updated.id,
      name: updated.name,
      displayName: updated.displayName,
      isActive: updated.isActive,
    };
  }
}
