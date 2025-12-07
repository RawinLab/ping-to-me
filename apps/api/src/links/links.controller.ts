import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { LinksService } from "./links.service";
import { LinkResponse } from "@pingtome/types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { QrCodeService } from "../qr/qr.service";
import { CreateQrConfigDto } from "../qr/dto/qr-config.dto";
import { PermissionGuard, Permission } from "../auth/rbac";
import {
  CreateLinkDto,
  UpdateLinkDto,
  BulkDeleteDto,
  BulkTagDto,
  BulkStatusDto,
  CheckSlugDto,
} from "./dto";

@Controller("links")
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  @Post("import")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @UseInterceptors(FileInterceptor("file"))
  async import(@Request() req, @UploadedFile() file: Express.Multer.File) {
    // TODO: Add organizationId to request
    return this.linksService.importLinks(req.user.id, file.buffer);
  }

  @Post("bulk-delete")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  async bulkDelete(@Request() req, @Body() body: BulkDeleteDto) {
    // TODO: Add organizationId to request
    return this.linksService.deleteMany(req.user.id, body.ids);
  }

  @Post("bulk-tag")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  async bulkTag(@Request() req, @Body() body: BulkTagDto) {
    // TODO: Add organizationId to request
    return this.linksService.addTagToMany(req.user.id, body.ids, body.tagName);
  }

  @Post("bulk-status")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  async bulkStatus(@Request() req, @Body() body: BulkStatusDto) {
    return this.linksService.updateStatusMany(req.user.id, body.ids, body.status);
  }

  @Get("export")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "export" })
  async export(@Request() req, @Res() res: Response) {
    // TODO: Add organizationId to request
    const csv = await this.linksService.exportLinks(req.user.id);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", 'attachment; filename="links.csv"');
    res.send(csv);
  }

  @Post("check-slug")
  @UseGuards(JwtAuthGuard)
  async checkSlugAvailability(@Body() dto: CheckSlugDto): Promise<{ available: boolean; suggestions?: string[] }> {
    return this.linksService.checkSlugAvailability(dto.slug, dto.domainId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "create" })
  async create(
    @Request() req,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<LinkResponse> {
    // TODO: Add organizationId to request
    return this.linksService.create(req.user.id, createLinkDto);
  }

  @Post(":id") // Using POST for update to avoid CORS preflight issues sometimes, but PATCH is better REST
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async update(@Request() req, @Param("id") id: string, @Body() body: UpdateLinkDto) {
    // TODO: Add organizationId to request
    return this.linksService.update(req.user.id, id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async findAll(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("tag") tag?: string,
    @Query("campaignId") campaignId?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    // TODO: Add organizationId to request
    return this.linksService.findAll(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      tag,
      campaignId,
      search,
      status,
    });
  }
  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async findOne(@Request() req, @Param("id") id: string) {
    return this.linksService.findOne(req.user.id, id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "delete", context: "own" })
  async delete(@Request() req, @Param("id") id: string) {
    return this.linksService.delete(req.user.id, id);
  }

  @Post(":id/restore")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async restore(@Request() req, @Param("id") id: string) {
    return this.linksService.restore(req.user.id, id);
  }

  @Get(":slug/lookup")
  async lookup(@Param("slug") slug: string) {
    return this.linksService.lookup(slug);
  }

  // ============ QR Config Endpoints ============

  @Get(":id/qr")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async getQrConfig(@Request() req, @Param("id") id: string) {
    // Verify ownership
    await this.linksService.findOne(req.user.id, id);
    return this.qrCodeService.getQrConfig(id);
  }

  @Post(":id/qr")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async saveQrConfig(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateQrConfigDto,
  ) {
    // Verify ownership
    await this.linksService.findOne(req.user.id, id);
    return this.qrCodeService.saveQrConfig(id, dto);
  }
}
