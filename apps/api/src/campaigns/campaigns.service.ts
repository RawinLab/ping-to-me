import { Injectable } from "@nestjs/common";
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
    name: string,
    description?: string,
  ) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name,
        description,
        organizationId: orgId,
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
    data: { name?: string; description?: string },
  ) {
    // Get current state for audit logging
    const before = await this.prisma.campaign.findUnique({ where: { id } });

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data,
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
}
