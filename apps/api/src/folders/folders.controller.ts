import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { FoldersService } from "./folders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";
import { CreateFolderDto } from "./dto/create-folder.dto";
import { UpdateFolderDto } from "./dto/update-folder.dto";
import { PrismaService } from "../prisma/prisma.service";

@Controller("folders")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get default organization ID for the user
   */
  private async getDefaultOrgId(userId: string): Promise<string> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { userId },
    });
    if (!member) {
      throw new BadRequestException("User has no organization");
    }
    return member.organizationId;
  }

  @Post()
  @Permission({ resource: "folder", action: "create" })
  async create(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    let orgId = createFolderDto.orgId;
    if (!orgId || orgId === "default") {
      orgId = await this.getDefaultOrgId(req.user.id);
    }

    return this.foldersService.create(req.user.id, {
      name: createFolderDto.name,
      color: createFolderDto.color,
      organizationId: orgId,
      parentId: createFolderDto.parentId,
    });
  }

  @Get()
  @Permission({ resource: "folder", action: "read" })
  async findAll(
    @Request() req,
    @Query("orgId") orgId?: string,
    @Query("parentId") parentId?: string,
    @Query("includeArchived") includeArchived?: string,
  ) {
    let organizationId = orgId;
    if (!orgId || orgId === "default") {
      // Get default org if not specified
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (member) {
        organizationId = member.organizationId;
      }
    }

    const includeArchivedBool = includeArchived === 'true';
    return this.foldersService.findAll(req.user.id, organizationId, parentId, includeArchivedBool);
  }

  @Get("tree")
  @Permission({ resource: "folder", action: "read" })
  async getTree(
    @Request() req,
    @Query("orgId") orgId?: string,
    @Query("includeArchived") includeArchived?: string,
  ) {
    let organizationId = orgId;
    if (!orgId || orgId === "default") {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      organizationId = member.organizationId;
    }

    const includeArchivedBool = includeArchived === 'true';
    return this.foldersService.getTree(req.user.id, organizationId, includeArchivedBool);
  }

  @Get(":id")
  @Permission({ resource: "folder", action: "read" })
  async findOne(@Request() req, @Param("id") id: string) {
    return this.foldersService.findOne(req.user.id, id);
  }

  @Put(":id")
  @Permission({ resource: "folder", action: "update", context: "own" })
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(req.user.id, id, updateFolderDto);
  }

  @Delete(":id")
  @Permission({ resource: "folder", action: "delete" })
  async remove(@Request() req, @Param("id") id: string) {
    return this.foldersService.remove(req.user.id, id);
  }

  @Post(":id/links/:linkId")
  @Permission({ resource: "folder", action: "update" })
  async addLink(
    @Request() req,
    @Param("id") id: string,
    @Param("linkId") linkId: string,
  ) {
    return this.foldersService.addLinkToFolder(req.user.id, id, linkId);
  }

  @Delete(":id/links/:linkId")
  @Permission({ resource: "folder", action: "update" })
  async removeLink(
    @Request() req,
    @Param("id") id: string,
    @Param("linkId") linkId: string,
  ) {
    return this.foldersService.removeLinkFromFolder(req.user.id, linkId);
  }

  @Post(":id/move")
  @Permission({ resource: "folder", action: "update" })
  async move(
    @Request() req,
    @Param("id") id: string,
    @Body() body: { parentId: string | null },
  ) {
    return this.foldersService.move(req.user.id, id, body.parentId);
  }

  @Post(":id/archive")
  @Permission({ resource: "folder", action: "update" })
  async archive(@Request() req, @Param("id") id: string) {
    return this.foldersService.archive(req.user.id, id);
  }

  @Post(":id/restore")
  @Permission({ resource: "folder", action: "update" })
  async restore(@Request() req, @Param("id") id: string) {
    return this.foldersService.restore(req.user.id, id);
  }
}
