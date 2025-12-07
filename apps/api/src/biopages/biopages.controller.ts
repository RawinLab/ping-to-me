import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards, Query, BadRequestException, Res, HttpCode, Req } from '@nestjs/common';
import { BioPageService } from './biopages.service';
import { AuthGuard } from '../auth/auth.guard';
import { BioPage, BioPageLink } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Response, Request as ExpressRequest } from 'express';
import { CreateBioLinkDto } from './dto/create-bio-link.dto';
import { UpdateBioLinkDto } from './dto/update-bio-link.dto';
import { ReorderLinksDto } from './dto/reorder-links.dto';
import { TrackEventDto } from './dto/track-event.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('biopages')
export class BioPageController {
  constructor(
    private readonly bioPageService: BioPageService,
    private readonly prisma: PrismaService,
  ) { }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() body: { slug: string; title: string; orgId: string }): Promise<BioPage> {
    let orgId = body.orgId;
    if (!orgId || orgId === 'default') {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) throw new BadRequestException('User has no organization');
      orgId = member.organizationId;
    }
    return this.bioPageService.createBioPage(req.user.id, orgId, body);
  }

  @Get('public/:slug')
  async getPublic(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const page = await this.bioPageService.getPublicBioPage(slug);

    // Add caching headers - cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.json(page);
  }

  @UseGuards(AuthGuard)
  @Get(':slug')
  async get(@Param('slug') slug: string): Promise<BioPage | null> {
    return this.bioPageService.getBioPage(slug);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any): Promise<BioPage> {
    return this.bioPageService.updateBioPage(id, req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string): Promise<BioPage> {
    return this.bioPageService.deleteBioPage(id, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get()
  async list(@Request() req, @Query('orgId') orgId: string): Promise<BioPage[]> {
    if (!orgId || orgId === 'default') {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      orgId = member.organizationId;
    }
    return this.bioPageService.listBioPages(req.user.id, orgId);
  }

  // BioPageLink endpoints

  @UseGuards(AuthGuard)
  @Post(':id/links')
  async addLink(
    @Request() req,
    @Param('id') bioPageId: string,
    @Body() dto: CreateBioLinkDto
  ): Promise<BioPageLink> {
    return this.bioPageService.addLink(bioPageId, req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/links/:linkId')
  async updateLink(
    @Request() req,
    @Param('id') bioPageId: string,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateBioLinkDto
  ): Promise<BioPageLink> {
    return this.bioPageService.updateLink(bioPageId, linkId, req.user.id, dto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/links/:linkId')
  async removeLink(
    @Request() req,
    @Param('id') bioPageId: string,
    @Param('linkId') linkId: string
  ): Promise<BioPageLink> {
    return this.bioPageService.removeLink(bioPageId, linkId, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/links/reorder')
  async reorderLinks(
    @Request() req,
    @Param('id') bioPageId: string,
    @Body() dto: ReorderLinksDto
  ): Promise<BioPageLink[]> {
    return this.bioPageService.reorderLinks(bioPageId, req.user.id, dto);
  }

  // Public tracking endpoint (no auth required)
  @Post(':id/track')
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per IP
  async track(
    @Param('id') bioPageId: string,
    @Body() dto: TrackEventDto,
    @Req() req: ExpressRequest,
  ): Promise<void> {
    // Extract IP from request headers
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;

    // Extract user agent
    const userAgent = req.headers['user-agent'];

    // Call service method (non-blocking)
    await this.bioPageService.trackEvent(
      bioPageId,
      dto.eventType,
      dto.bioLinkId,
      dto.referrer,
      userAgent,
      ip,
    );
  }

  // Analytics endpoints

  @UseGuards(AuthGuard)
  @Get(':id/analytics/summary')
  async getAnalyticsSummary(
    @Request() req,
    @Param('id') bioPageId: string,
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.bioPageService.getAnalyticsSummary(bioPageId, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard)
  @Get(':id/analytics/timeseries')
  async getAnalyticsTimeseries(
    @Request() req,
    @Param('id') bioPageId: string,
    @Query('period') period?: string
  ) {
    const validPeriod = period && ['7d', '30d', '90d'].includes(period) ? period : '30d';
    return this.bioPageService.getAnalyticsTimeseries(bioPageId, req.user.id, validPeriod);
  }

  @UseGuards(AuthGuard)
  @Get(':id/analytics/clicks')
  async getClicksByLink(
    @Request() req,
    @Param('id') bioPageId: string
  ) {
    return this.bioPageService.getClicksByLink(bioPageId, req.user.id);
  }

  // QR Code endpoint
  @Get(':id/qr')
  async getBioPageQrCode(
    @Param('id') bioPageId: string,
    @Query('size') size?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const sizeNum = size ? parseInt(size, 10) : 300;
    const formatType = (format === 'svg' ? 'svg' : 'png') as 'png' | 'svg';

    const result = await this.bioPageService.getBioPageQrCode(bioPageId, sizeNum, formatType);

    if (formatType === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(result.data);
    } else {
      // PNG format
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(result.data);
    }
  }
}
