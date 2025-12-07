import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
}
