import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '../auth/auth.guard';
import { MemberRole } from '@pingtome/database';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @UseGuards(AuthGuard)
  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    // TODO: Add check that requester is member of org
    return this.organizationService.getMembers(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/invites')
  async inviteMember(
    @Param('id') id: string,
    @Body() body: { email: string; role: MemberRole },
  ) {
    // TODO: Add check that requester is Admin/Owner
    return this.organizationService.inviteMember(id, body.email, body.role);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: MemberRole },
  ) {
    // TODO: Add check that requester is Admin/Owner
    return this.organizationService.updateMemberRole(id, userId, body.role);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    // TODO: Add check that requester is Admin/Owner
    return this.organizationService.removeMember(id, userId);
  }
}
