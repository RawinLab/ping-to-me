import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionGuard, Permission } from "../auth/rbac";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { ApiScopeGuard } from "../auth/guards/api-scope.guard";
import { RequireScope } from "../auth/rbac/require-scope.decorator";

@Controller("campaigns")
@UseGuards(AuthGuard, PermissionGuard, ApiScopeGuard)
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequireScope("campaign:create")
  @Permission({ resource: "campaign", action: "create" })
  async create(
    @Request() req,
    @Body() createCampaignDto: CreateCampaignDto,
  ) {
    let orgId = createCampaignDto.orgId;
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) throw new BadRequestException("User has no organization");
      orgId = member.organizationId;
    }
    return this.campaignsService.create(req.user.id, orgId, {
      name: createCampaignDto.name,
      description: createCampaignDto.description,
      startDate: createCampaignDto.startDate,
      endDate: createCampaignDto.endDate,
      status: createCampaignDto.status,
      goalType: createCampaignDto.goalType,
      goalTarget: createCampaignDto.goalTarget,
      utmSource: createCampaignDto.utmSource,
      utmMedium: createCampaignDto.utmMedium,
      utmCampaign: createCampaignDto.utmCampaign,
      utmTerm: createCampaignDto.utmTerm,
      utmContent: createCampaignDto.utmContent,
    });
  }

  @Get()
  @RequireScope("campaign:read")
  @Permission({ resource: "campaign", action: "read" })
  async findAll(@Request() req, @Query("orgId") orgId: string) {
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      orgId = member.organizationId;
    }
    return this.campaignsService.findAll(req.user.id, orgId);
  }

  @Patch(":id")
  @RequireScope("campaign:update")
  @Permission({ resource: "campaign", action: "update", context: "own" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(req.user.id, id, updateCampaignDto);
  }

  @Delete(":id")
  @RequireScope("campaign:delete")
  @Permission({ resource: "campaign", action: "delete", context: "own" })
  remove(@Request() req, @Param("id") id: string) {
    return this.campaignsService.remove(req.user.id, id);
  }

  @Get(":id/analytics")
  @RequireScope("campaign:read")
  @Permission({ resource: "campaign", action: "read" })
  async getAnalytics(@Request() req, @Param("id") id: string) {
    return this.campaignsService.getAnalytics(req.user.id, id);
  }
}
