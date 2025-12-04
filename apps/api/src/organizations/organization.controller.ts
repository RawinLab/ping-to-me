import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberRole } from '@pingtome/database';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  // Organization CRUD
  @Post()
  async create(@Request() req, @Body() body: { name: string; slug: string }) {
    return this.organizationService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req) {
    return this.organizationService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.organizationService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; slug?: string }) {
    return this.organizationService.update(id, req.user.id, body);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.organizationService.delete(id, req.user.id);
  }

  // Member management
  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.organizationService.getMembers(id);
  }

  @Post(':id/invites')
  async inviteMember(
    @Param('id') id: string,
    @Body() body: { email: string; role: MemberRole },
  ) {
    return this.organizationService.inviteMember(id, body.email, body.role);
  }

  @Patch(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: MemberRole },
  ) {
    return this.organizationService.updateMemberRole(id, userId, body.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationService.removeMember(id, userId);
  }
}

