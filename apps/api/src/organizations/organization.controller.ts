import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';
import { MemberRole } from '@pingtome/database';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  // Organization CRUD
  @Post()
  // No permission check needed - user creates their own org and becomes OWNER
  async create(@Request() req, @Body() body: { name: string; slug: string }) {
    return this.organizationService.create(req.user.id, body);
  }

  @Get()
  // No permission check needed - returns only user's organizations
  async findAll(@Request() req) {
    return this.organizationService.findAll(req.user.id);
  }

  @Get(':id')
  @Permission({ resource: 'organization', action: 'read' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.organizationService.findOne(id, req.user.id);
  }

  @Put(':id')
  @Permission({ resource: 'organization', action: 'update' })
  async update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; slug?: string }) {
    return this.organizationService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @Permission({ resource: 'organization', action: 'delete' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.organizationService.delete(id, req.user.id);
  }

  // Member management
  @Get(':id/members')
  @Permission({ resource: 'team', action: 'read' })
  async getMembers(@Param('id') id: string) {
    return this.organizationService.getMembers(id);
  }

  @Post(':id/invites')
  @Permission({ resource: 'team', action: 'invite' })
  async inviteMember(
    @Param('id') id: string,
    @Body() body: { email: string; role: MemberRole },
  ) {
    return this.organizationService.inviteMember(id, body.email, body.role);
  }

  @Patch(':id/members/:userId')
  @Permission({ resource: 'team', action: 'update-role' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: MemberRole },
  ) {
    return this.organizationService.updateMemberRole(id, userId, body.role);
  }

  @Delete(':id/members/:userId')
  @Permission({ resource: 'team', action: 'remove' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationService.removeMember(id, userId);
  }
}

