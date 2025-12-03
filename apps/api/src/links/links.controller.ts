import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto, LinkResponse } from '@pingtome/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) { }

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
}
