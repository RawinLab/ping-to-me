import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards, Query, BadRequestException, Res } from '@nestjs/common';
import { BioPageService } from './biopages.service';
import { AuthGuard } from '../auth/auth.guard';
import { BioPage, BioPageLink } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import { CreateBioLinkDto } from './dto/create-bio-link.dto';
import { UpdateBioLinkDto } from './dto/update-bio-link.dto';
import { ReorderLinksDto } from './dto/reorder-links.dto';

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
}
