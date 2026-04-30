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
import { TagsService } from "./tags.service";
import { AuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { PermissionGuard, Permission } from "../auth/rbac";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { AutocompleteTagDto } from "./dto/autocomplete-tag.dto";
import { ApiScopeGuard } from "../auth/guards/api-scope.guard";
import { RequireScope } from "../auth/rbac/require-scope.decorator";

@Controller("tags")
@UseGuards(OptionalAuthGuard, ApiScopeGuard, PermissionGuard)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequireScope('tag:create')
  @Permission({ resource: "tag", action: "create" })
  async create(
    @Request() req,
    @Body() createTagDto: CreateTagDto,
  ) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || `api:${req.apiKey?.id}` || null;
    let organizationId = req.apiKey?.organizationId || createTagDto.orgId || null;

    if ((!organizationId || organizationId === "default") && req.user?.id) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
        orderBy: { joinedAt: 'asc' },
      });
      if (!member) throw new BadRequestException("User has no organization");
      organizationId = member.organizationId;
    }

    if (!organizationId) {
      throw new BadRequestException("Organization ID is required");
    }

    return this.tagsService.create(userId, organizationId, createTagDto.name, createTagDto.color);
  }

  @Get()
  @RequireScope('tag:read')
  @Permission({ resource: "tag", action: "read" })
  async findAll(@Request() req, @Query("orgId") orgId: string) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || null;
    let organizationId = req.apiKey?.organizationId || orgId || null;

    // If no orgId provided and we have a user, look up their organization
    if ((!organizationId || organizationId === "default") && userId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!member) return [];
      organizationId = member.organizationId;
    }

    // API key auth requires orgId to be set (from apiKey)
    if (!organizationId) {
      return [];
    }

    return this.tagsService.findAll(userId, organizationId);
  }

  @Get('autocomplete')
  @RequireScope('tag:read')
  @Permission({ resource: "tag", action: "read" })
  async autocomplete(@Request() req, @Query() query: AutocompleteTagDto) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || null;
    let organizationId = req.apiKey?.organizationId || query.orgId || null;

    if ((!organizationId || organizationId === "default") && userId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!member) return [];
      organizationId = member.organizationId;
    }

    if (!organizationId) {
      return [];
    }

    const limit = query.limit || 10;
    return this.tagsService.autocomplete(userId, organizationId, query.q, limit);
  }

  @Patch(":id")
  @RequireScope('tag:update')
  @Permission({ resource: "tag", action: "update", context: "own" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || `api:${req.apiKey?.id}` || null;
    return this.tagsService.update(userId, id, updateTagDto);
  }

  @Delete(":id")
  @RequireScope('tag:delete')
  @Permission({ resource: "tag", action: "delete" })
  remove(@Request() req, @Param("id") id: string) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || `api:${req.apiKey?.id}` || null;
    return this.tagsService.remove(userId, id);
  }

  @Get('statistics')
  @RequireScope('tag:read')
  @Permission({ resource: 'tag', action: 'read' })
  async getStatistics(@Request() req, @Query('orgId') orgId?: string) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || null;
    let organizationId = req.apiKey?.organizationId || orgId || null;

    if ((!organizationId || organizationId === 'default') && userId) {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!member) return { tags: [], totalTags: 0, unusedTags: 0, usedTags: 0 };
      organizationId = member.organizationId;
    }

    if (!organizationId) {
      return { tags: [], totalTags: 0, unusedTags: 0, usedTags: 0 };
    }

    return this.tagsService.getStatistics(userId, organizationId);
  }

  @Post(':id/merge')
  @RequireScope('tag:delete')
  @Permission({ resource: 'tag', action: 'delete' })
  async merge(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { targetTagId: string },
  ) {
    // Support both JWT auth (req.user) and API key auth (req.apiKey)
    const userId = req.user?.id || `api:${req.apiKey?.id}` || null;
    return this.tagsService.merge(userId, id, body.targetTagId);
  }
}
