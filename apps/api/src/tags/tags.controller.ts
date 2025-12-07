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

@Controller("tags")
@UseGuards(AuthGuard, PermissionGuard)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
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

  @Patch(":id")
  @Permission({ resource: "tag", action: "update", context: "own" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(req.user.id, id, updateTagDto);
  }

  @Delete(":id")
  @Permission({ resource: "tag", action: "delete" })
  remove(@Request() req, @Param("id") id: string) {
    return this.tagsService.remove(req.user.id, id);
  }
}
