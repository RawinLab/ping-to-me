import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { BioPageService } from './biopages.service';
import { AuthGuard } from '../auth/auth.guard';
import { BioPage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  async getPublic(@Param('slug') slug: string): Promise<any | null> {
    return this.bioPageService.getPublicBioPage(slug);
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
}
