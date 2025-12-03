import { Body, Controller, Get, Param, Post, Request, UseGuards, Query, Delete, ParseUUIDPipe } from '@nestjs/common';
import { DomainService } from './domains.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('domains')
@UseGuards(AuthGuard)
export class DomainsController {
  constructor(private readonly domainService: DomainService) { }

  @Post()
  async add(@Request() req, @Body() body: { hostname: string; orgId: string }) {
    return this.domainService.addDomain(req.user.id, body.orgId, body.hostname);
  }

  @Post(':id/verify')
  async verify(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.domainService.verifyDomain(req.user.id, id);
  }

  @Get()
  async list(@Request() req, @Query('orgId') orgId: string) {
    return this.domainService.listDomains(req.user.id, orgId);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.domainService.removeDomain(req.user.id, id);
  }
}
