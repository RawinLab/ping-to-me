import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('campaigns')
@UseGuards(AuthGuard)
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  async create(@Request() req, @Body() body: { name: string; description?: string; orgId: string }) {
    let orgId = body.orgId;
    if (!orgId || orgId === 'default') {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) throw new BadRequestException('User has no organization');
      orgId = member.organizationId;
    }
    return this.campaignsService.create(req.user.id, orgId, body.name, body.description);
  }

  @Get()
  async findAll(@Request() req, @Query('orgId') orgId: string) {
    if (!orgId || orgId === 'default') {
      const member = await this.prisma.organizationMember.findFirst({
        where: { userId: req.user.id },
      });
      if (!member) return [];
      orgId = member.organizationId;
    }
    return this.campaignsService.findAll(req.user.id, orgId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.campaignsService.update(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.campaignsService.remove(req.user.id, id);
  }
}
