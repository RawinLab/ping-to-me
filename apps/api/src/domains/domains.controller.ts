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
  Patch,
} from "@nestjs/common";
import { DomainService } from "./domains.service";
import { SslService } from "./ssl.service";
import { AuthGuard } from "../auth/auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";
import { UpdateSslDto } from "./dto/ssl.dto";

@Controller("domains")
@UseGuards(AuthGuard, PermissionGuard)
export class DomainsController {
  constructor(
    private readonly domainService: DomainService,
    private readonly sslService: SslService,
  ) {}

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

  // ==================== SSL Endpoints ====================

  /**
   * Provision SSL certificate for a domain
   *
   * POST /domains/:id/ssl
   */
  @Post(":id/ssl")
  @Permission({ resource: "domain", action: "update" })
  async provisionSsl(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.sslService.provisionCertificate(id, req.user.id);
  }

  /**
   * Get SSL certificate status
   *
   * GET /domains/:id/ssl
   */
  @Get(":id/ssl")
  @Permission({ resource: "domain", action: "read" })
  async getSslStatus(@Param("id", ParseUUIDPipe) id: string) {
    return this.sslService.getCertificateStatus(id);
  }

  /**
   * Update SSL settings (e.g., toggle auto-renew)
   *
   * PATCH /domains/:id/ssl
   */
  @Patch(":id/ssl")
  @Permission({ resource: "domain", action: "update" })
  async updateSslSettings(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSslDto: UpdateSslDto,
  ) {
    if (updateSslDto.autoRenew !== undefined) {
      await this.sslService.setAutoRenew(
        id,
        updateSslDto.autoRenew,
        req.user.id,
      );
    }

    // Return updated SSL status
    return this.sslService.getCertificateStatus(id);
  }
}
