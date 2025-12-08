import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    userId: string,
    orgId: string,
    data: {
      name: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      goalType?: string;
      goalTarget?: number;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
    },
  ) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: orgId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status as any,
        goalType: data.goalType,
        goalTarget: data.goalTarget,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
      },
    });

    // Log campaign creation
    this.auditService
      .logResourceEvent(
        userId,
        orgId,
        "campaign.created",
        "Campaign",
        campaign.id,
        {
          details: {
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors

    return campaign;
  }

  async findAll(userId: string, orgId: string) {
    return this.prisma.campaign.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { links: true },
        },
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      goalType?: string;
      goalTarget?: number;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
    },
  ) {
    // Get current state for audit logging
    const before = await this.prisma.campaign.findUnique({ where: { id } });

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status as any,
        goalType: data.goalType,
        goalTarget: data.goalTarget,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
      },
    });

    // Log campaign update with changes
    if (before) {
      const changes = this.auditService.captureChanges(before, campaign);
      this.auditService
        .logResourceEvent(
          userId,
          before.organizationId,
          "campaign.updated",
          "Campaign",
          campaign.id,
          {
            changes,
            details: {
              name: campaign.name,
              status: campaign.status,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }

    return campaign;
  }

  async remove(userId: string, id: string) {
    // Get campaign data before deletion for audit logging
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });

    const deleted = await this.prisma.campaign.delete({
      where: { id },
    });

    // Log campaign deletion
    if (campaign) {
      this.auditService
        .logResourceEvent(
          userId,
          campaign.organizationId,
          "campaign.deleted",
          "Campaign",
          campaign.id,
          {
            details: {
              name: campaign.name,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }

    return deleted;
  }

  async getAnalytics(userId: string, campaignId: string) {
    // Get campaign with links
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        links: {
          include: {
            _count: {
              select: { clicks: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const totalLinks = campaign.links.length;

    // Get all clicks for campaign links
    const linkIds = campaign.links.map((l) => l.id);

    const clicks = await this.prisma.clickEvent.findMany({
      where: { linkId: { in: linkIds } },
      select: {
        id: true,
        timestamp: true,
        country: true,
        device: true,
        linkId: true,
      },
    });

    const totalClicks = clicks.length;

    // Unique clicks by IP would require storing IP, using count for now
    const uniqueClicks = totalClicks; // Simplified

    // Clicks by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clicksByDate = clicks
      .filter((c) => c.timestamp >= thirtyDaysAgo)
      .reduce((acc, click) => {
        const date = click.timestamp.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Clicks by country
    const clicksByCountry = clicks.reduce((acc, click) => {
      const country = click.country || "Unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top links
    const topLinks = campaign.links
      .map((link) => ({
        id: link.id,
        slug: link.slug,
        title: link.title,
        clicks: link._count.clicks,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Goal progress
    let goalProgress = null;
    if (campaign.goalType && campaign.goalTarget) {
      const currentValue = campaign.goalType === "clicks" ? totalClicks : 0;
      goalProgress = {
        type: campaign.goalType,
        target: campaign.goalTarget,
        current: currentValue,
        percentage: Math.min(
          100,
          Math.round((currentValue / campaign.goalTarget) * 100),
        ),
      };
    }

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      totalLinks,
      totalClicks,
      uniqueClicks,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({
        date,
        count,
      })),
      clicksByCountry: Object.entries(clicksByCountry).map(
        ([country, count]) => ({ country, count }),
      ),
      topLinks,
      goalProgress,
    };
  }
}
