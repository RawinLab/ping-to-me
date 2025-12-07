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

@Controller("campaigns")
@UseGuards(AuthGuard, PermissionGuard)
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Permission({ resource: "campaign", action: "create" })
  async create(
    @Request() req,
    @Body() body: { name: string; description?: string; orgId: string },
  ) {
    let orgId = body.orgId;
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) throw new BadRequestException("User has no organization");
      orgId = member.organizationId;
    }
    return this.campaignsService.create(
      req.user.id,
      orgId,
      body.name,
      body.description,
    );
  }

  @Get()
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
  @Permission({ resource: "campaign", action: "update", context: "own" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.campaignsService.update(req.user.id, id, body);
  }

  @Delete(":id")
  @Permission({ resource: "campaign", action: "delete", context: "own" })
  remove(@Request() req, @Param("id") id: string) {
    return this.campaignsService.remove(req.user.id, id);
  }
}
