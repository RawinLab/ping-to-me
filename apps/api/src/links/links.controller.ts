import { Body, Controller, Post, UseGuards, Request, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { LinkService } from './links.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('links')
export class LinksController {
  constructor(private readonly linkService: LinkService) { }

  @UseGuards(AuthGuard)
  @Post()
  async create(@Request() req, @Body() body: { url: string; slug?: string; orgId: string }) {
    return this.linkService.createShortLink(req.user.id, body.orgId, body.url, body.slug);
  }

  @UseGuards(AuthGuard)
  @Get()
  async list(@Request() req, @Query('orgId') orgId: string) {
    // In real app, validate orgId access
    return this.linkService.listLinks(req.user.id, orgId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { destinationUrl?: string; isActive?: boolean },
  ) {
    return this.linkService.updateLink(id, req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.linkService.deleteLink(id, req.user.id);
  }
}
