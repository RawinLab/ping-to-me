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
import { PrismaService } from "../prisma/prisma.service";
import { PermissionGuard, Permission } from "../auth/rbac";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { AutocompleteTagDto } from "./dto/autocomplete-tag.dto";
import { ApiScopeGuard } from "../auth/guards/api-scope.guard";
import { RequireScope } from "../auth/rbac/require-scope.decorator";

@Controller("tags")
@UseGuards(AuthGuard, PermissionGuard, ApiScopeGuard)
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
    let orgId = createTagDto.orgId;
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) throw new BadRequestException("User has no organization");
      orgId = member.organizationId;
    }
    return this.tagsService.create(req.user.id, orgId, createTagDto.name, createTagDto.color);
  }

  @Get()
  @RequireScope('tag:read')
  @Permission({ resource: "tag", action: "read" })
  async findAll(@Request() req, @Query("orgId") orgId: string) {
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      orgId = member.organizationId;
    }
    return this.tagsService.findAll(req.user.id, orgId);
  }

  @Get('autocomplete')
  @RequireScope('tag:read')
  @Permission({ resource: "tag", action: "read" })
  async autocomplete(@Request() req, @Query() query: AutocompleteTagDto) {
    let orgId = query.orgId;
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      orgId = member.organizationId;
    }
    const limit = query.limit || 10;
    return this.tagsService.autocomplete(req.user.id, orgId, query.q, limit);
  }

  @Patch(":id")
  @RequireScope('tag:update')
  @Permission({ resource: "tag", action: "update", context: "own" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(req.user.id, id, updateTagDto);
  }

  @Delete(":id")
  @RequireScope('tag:delete')
  @Permission({ resource: "tag", action: "delete" })
  remove(@Request() req, @Param("id") id: string) {
    return this.tagsService.remove(req.user.id, id);
  }

  @Get('statistics')
  @RequireScope('tag:read')
  @Permission({ resource: 'tag', action: 'read' })
  async getStatistics(@Request() req, @Query('orgId') orgId?: string) {
    let organizationId = orgId;
    if (!orgId || orgId === 'default') {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return { tags: [], totalTags: 0, unusedTags: 0, usedTags: 0 };
      organizationId = member.organizationId;
    }
    return this.tagsService.getStatistics(req.user.id, organizationId);
  }

  @Post(':id/merge')
  @RequireScope('tag:delete')
  @Permission({ resource: 'tag', action: 'delete' })
  async merge(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { targetTagId: string },
  ) {
    return this.tagsService.merge(req.user.id, id, body.targetTagId);
  }
}
