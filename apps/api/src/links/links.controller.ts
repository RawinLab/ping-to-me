import { Controller, Post, Body, UseGuards, Request, Get, Query, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { LinksService } from './links.service';
import { CreateLinkDto, LinkResponse } from '@pingtome/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) { }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async import(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.linksService.importLinks(req.user.userId, file.buffer);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard)
  async bulkDelete(@Request() req, @Body() body: { ids: string[] }) {
    return this.linksService.deleteMany(req.user.userId, body.ids);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async export(@Request() req, @Res() res: Response) {
    const csv = await this.linksService.exportLinks(req.user.userId);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="links.csv"');
    res.send(csv);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createLinkDto: CreateLinkDto): Promise<LinkResponse> {
    return this.linksService.create(req.user.userId, createLinkDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
  ) {
    return this.linksService.findAll(req.user.userId, {
      page: Number(page),
      limit: Number(limit),
      tag,
      search,
    });
  }
  @Get(':slug/lookup')
  async lookup(@Param('slug') slug: string) {
    return this.linksService.lookup(slug);
  }
}
