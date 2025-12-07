import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  Query,
  Delete,
  ParseUUIDPipe,
} from "@nestjs/common";
import { DomainService } from "./domains.service";
import { AuthGuard } from "../auth/auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";

@Controller("domains")
@UseGuards(AuthGuard, PermissionGuard)
export class DomainsController {
  constructor(private readonly domainService: DomainService) {}

  @Post()
  @Permission({ resource: "domain", action: "create" })
  async add(@Request() req, @Body() body: { hostname: string; orgId: string }) {
    return this.domainService.addDomain(req.user.id, body.orgId, body.hostname);
  }

  @Post(":id/verify")
  @Permission({ resource: "domain", action: "verify" })
  async verify(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.domainService.verifyDomain(req.user.id, id);
  }

  @Get()
  @Permission({ resource: "domain", action: "read" })
  async list(@Request() req, @Query("orgId") orgId: string) {
    return this.domainService.listDomains(req.user.id, orgId);
  }

  @Delete(":id")
  @Permission({ resource: "domain", action: "delete" })
  async remove(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.domainService.removeDomain(req.user.id, id);
  }
}
