import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { BioPageService } from './biopages.service';
import { AuthGuard } from '../auth/auth.guard';
import { BioPage } from '@pingtome/database';

@Controller('biopages')
export class BioPageController {
  constructor(private readonly bioPageService: BioPageService) { }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() body: { slug: string; title: string; orgId: string }): Promise<BioPage> {
    return this.bioPageService.createBioPage(req.user.id, body.orgId, body);
  }

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
  async list(@Request() req, @Body() body: { orgId: string }): Promise<BioPage[]> {
    return this.bioPageService.listBioPages(req.user.id, body.orgId);
  }
}
