import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) { }

  @Post()
  async create(@Request() req, @Body() body: { name: string; color?: string }) {
    return this.foldersService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req) {
    return this.foldersService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.foldersService.findOne(req.user.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    return this.foldersService.update(req.user.id, id, body);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.foldersService.remove(req.user.id, id);
  }

  @Post(':id/links/:linkId')
  async addLink(@Request() req, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.foldersService.addLinkToFolder(req.user.id, id, linkId);
  }

  @Delete(':id/links/:linkId')
  async removeLink(@Request() req, @Param('id') id: string, @Param('linkId') linkId: string) {
    return this.foldersService.removeLinkFromFolder(req.user.id, linkId);
  }
}
