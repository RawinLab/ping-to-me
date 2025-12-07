import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';
import { MemberRole } from '@pingtome/database';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly auditService: AuditService,
  ) {}

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
    @Request() req,
    @Param('id') id: string,
    @Body() body: { email: string; role: MemberRole },
  ) {
    return this.organizationService.inviteMember(id, req.user.id, body.email, body.role);
  }

  @Patch(':id/members/:userId')
  @Permission({ resource: 'team', action: 'update-role' })
  async updateMemberRole(
    @Request() req,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: MemberRole },
  ) {
    return this.organizationService.updateMemberRole(id, userId, req.user.id, body.role);
  }

  @Delete(':id/members/:userId')
  @Permission({ resource: 'team', action: 'remove' })
  async removeMember(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationService.removeMember(id, userId, req.user.id);
  }

  // Audit logs - Organization scoped
  @Get(':id/audit-logs')
  @Permission({ resource: 'audit', action: 'read' })
  async getAuditLogs(
    @Request() req,
    @Param('id') orgId: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // Get user's role in org to determine what they can see
    const userRole = req.user?.role;

    // OWNER/ADMIN can see all logs, EDITOR/VIEWER can only see their own
    const filters: any = {
      organizationId: orgId,
      action,
      resource,
      status,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    // Restrict to own activity for non-admin roles
    if (userRole === 'EDITOR' || userRole === 'VIEWER') {
      filters.userId = req.user.id;
    } else if (userId) {
      filters.userId = userId;
    }

    return this.auditService.getLogs(filters);
  }
}

