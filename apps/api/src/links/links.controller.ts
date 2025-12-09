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
  BadRequestException,
  Put,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { LinksService } from "./links.service";
import { LinkResponse } from "@pingtome/types";
import { JwtAuthGuard, EmailVerifiedGuard } from "../auth/guards";
import { QrCodeService } from "../qr/qr.service";
import { CreateQrConfigDto } from "../qr/dto/qr-config.dto";
import { PermissionGuard, Permission } from "../auth/rbac";
import {
  CreateLinkDto,
  UpdateLinkDto,
  BulkDeleteDto,
  BulkTagDto,
  BulkStatusDto,
  BulkEditDto,
  CheckSlugDto,
  ExportFiltersDto,
  CreateRedirectRuleDto,
  UpdateRedirectRuleDto,
  ReorderRedirectRulesDto,
  CreateLinkVariantDto,
  UpdateLinkVariantDto,
} from "./dto";
import { RedirectRulesService } from "./services/redirect-rules.service";
import { LinkVariantsService } from "./services/link-variants.service";

@Controller("links")
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly qrCodeService: QrCodeService,
    private readonly redirectRulesService: RedirectRulesService,
    private readonly linkVariantsService: LinkVariantsService,
  ) {}

  @Post("import")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor("file"))
  async import(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.linksService.importLinks(req.user.id, file.buffer, organizationId, req.user.plan);
  }

  @Post("import/preview")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor("file"))
  async importPreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.linksService.previewImport(file.buffer);
  }

  @Get("import/template")
  @UseGuards(JwtAuthGuard)
  async downloadTemplate(@Res() res: Response) {
    const template = 'originalUrl,slug,title,description,tags,expirationDate\n' +
      'https://example.com,my-link,Example Link,Description here,"tag1,tag2",2024-12-31\n';
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", 'attachment; filename="import-template.csv"');
    res.send(template);
  }

  @Post("bulk-delete")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkDelete(
    @Request() req,
    @Body() body: BulkDeleteDto,
  ) {
    return this.linksService.deleteMany(req.user.id, body.ids, body.permanent);
  }

  @Post("bulk-tag")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkTag(
    @Request() req,
    @Body() body: BulkTagDto,
  ) {
    return this.linksService.addTagToMany(req.user.id, body.ids, body.tagName);
  }

  @Post("bulk-status")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkStatus(@Request() req, @Body() body: BulkStatusDto) {
    return this.linksService.updateStatusMany(req.user.id, body.ids, body.status);
  }

  @Post("bulk-edit")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "bulk" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async bulkEdit(
    @Request() req,
    @Body() body: BulkEditDto,
  ) {
    return this.linksService.editMany(req.user.id, body);
  }

  @Get("export")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "export" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async export(
    @Request() req,
    @Res() res: Response,
    @Query('organizationId') organizationId?: string,
  ) {
    const csv = await this.linksService.exportLinks(req.user.id, { organizationId });
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", 'attachment; filename="links.csv"');
    res.send(csv);
  }

  @Post("export")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "export" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async exportFiltered(
    @Request() req,
    @Body() filters: ExportFiltersDto,
    @Res() res: Response,
  ) {
    const data = await this.linksService.exportLinks(req.user.id, filters);

    if (filters.format === 'json') {
      res.header("Content-Type", "application/json");
      res.header("Content-Disposition", 'attachment; filename="links.json"');
    } else {
      res.header("Content-Type", "text/csv");
      res.header("Content-Disposition", 'attachment; filename="links.csv"');
    }

    res.send(data);
  }

  @Post("check-slug")
  @UseGuards(JwtAuthGuard)
  async checkSlugAvailability(@Body() dto: CheckSlugDto): Promise<{ available: boolean; suggestions?: string[] }> {
    return this.linksService.checkSlugAvailability(dto.slug, dto.domainId);
  }

  @Post("check-duplicate")
  @UseGuards(JwtAuthGuard)
  async checkDuplicate(
    @Body() body: { originalUrl: string; organizationId?: string },
  ) {
    const existing = await this.linksService.checkDuplicate(
      body.originalUrl,
      body.organizationId || null,
    );

    if (existing) {
      const shortUrl = existing.domain
        ? `https://${existing.domain.hostname}/${existing.slug}`
        : `https://pingto.me/${existing.slug}`;

      return {
        duplicate: true,
        existingLink: {
          id: existing.id,
          slug: existing.slug,
          shortUrl,
        },
      };
    }

    return { duplicate: false };
  }

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionGuard)
  @Permission({ resource: "link", action: "create" })
  async create(
    @Request() req,
    @Body() createLinkDto: CreateLinkDto,
  ): Promise<LinkResponse> {
    return this.linksService.create(req.user.id, createLinkDto);
  }

  @Post(":id") // Using POST for update to avoid CORS preflight issues sometimes, but PATCH is better REST
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async update(@Request() req, @Param("id") id: string, @Body() body: UpdateLinkDto) {
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
    @Query("folderId") folderId?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.linksService.findAll(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      tag,
      campaignId,
      folderId,
      search,
      status,
      startDate,
      endDate,
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

  @Post(":id/scrape-metadata")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async scrapeMetadata(@Request() req, @Param("id") id: string) {
    return this.linksService.scrapeMetadata(req.user.id, id);
  }

  @Get(":slug/lookup")
  async lookup(@Param("slug") slug: string) {
    return this.linksService.lookup(slug);
  }

  @Get(":id/click-limit")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async getClickLimit(@Request() req, @Param("id") id: string) {
    return this.linksService.getClickLimitStatus(req.user.id, id);
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

  // ============ Redirect Rules Endpoints ============

  @Get(":id/rules")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async getRedirectRules(@Request() req, @Param("id") id: string) {
    return this.redirectRulesService.findAllByLink(req.user.id, id);
  }

  @Post(":id/rules")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async createRedirectRule(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateRedirectRuleDto,
  ) {
    return this.redirectRulesService.create(req.user.id, id, dto);
  }

  @Put(":id/rules/:ruleId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async updateRedirectRule(
    @Request() req,
    @Param("id") id: string,
    @Param("ruleId") ruleId: string,
    @Body() dto: UpdateRedirectRuleDto,
  ) {
    return this.redirectRulesService.update(req.user.id, id, ruleId, dto);
  }

  @Delete(":id/rules/:ruleId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async deleteRedirectRule(
    @Request() req,
    @Param("id") id: string,
    @Param("ruleId") ruleId: string,
  ) {
    return this.redirectRulesService.delete(req.user.id, id, ruleId);
  }

  @Post(":id/rules/reorder")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async reorderRedirectRules(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: ReorderRedirectRulesDto,
  ) {
    return this.redirectRulesService.reorder(req.user.id, id, dto.ruleIds);
  }

  // ============ Link Variant Endpoints (A/B Testing) ============

  @Get(":id/variants")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async getVariants(@Request() req, @Param("id") id: string) {
    return this.linkVariantsService.findAllByLink(req.user.id, id);
  }

  @Post(":id/variants")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async createVariant(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: CreateLinkVariantDto,
  ) {
    return this.linkVariantsService.create(req.user.id, id, dto);
  }

  @Put(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async updateVariant(
    @Request() req,
    @Param("id") id: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdateLinkVariantDto,
  ) {
    return this.linkVariantsService.update(req.user.id, id, variantId, dto);
  }

  @Delete(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "update", context: "own" })
  async deleteVariant(
    @Request() req,
    @Param("id") id: string,
    @Param("variantId") variantId: string,
  ) {
    return this.linkVariantsService.delete(req.user.id, id, variantId);
  }

  @Get(":id/variants/stats")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "link", action: "read" })
  async getVariantStats(@Request() req, @Param("id") id: string) {
    return this.linkVariantsService.getVariantStats(req.user.id, id);
  }
}
