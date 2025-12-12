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
import { EmailVerifiedGuard } from "../auth/guards";
import { PermissionGuard, Permission } from "../auth/rbac";
import { ApiScopeGuard } from "../auth/guards/api-scope.guard";
import { RequireScope } from "../auth/rbac/require-scope.decorator";
import { UpdateSslDto } from "./dto/ssl.dto";
import { CreateDomainDto, UpdateDomainDto } from "./dto";

@Controller("domains")
@UseGuards(AuthGuard, EmailVerifiedGuard, PermissionGuard, ApiScopeGuard)
export class DomainsController {
  constructor(
    private readonly domainService: DomainService,
    private readonly sslService: SslService,
  ) {}

  @Post()
  @RequireScope("domain:create")
  @Permission({ resource: "domain", action: "create" })
  async add(@Request() req, @Body() dto: CreateDomainDto) {
    return this.domainService.addDomain(req.user.id, dto.orgId, dto.hostname);
  }

  @Post(":id/verify")
  @RequireScope("domain:verify")
  @Permission({ resource: "domain", action: "verify" })
  async verify(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.domainService.verifyDomain(req.user.id, id);
  }

  @Get()
  @RequireScope("domain:read")
  @Permission({ resource: "domain", action: "read" })
  async list(@Request() req, @Query("orgId") orgId: string) {
    return this.domainService.listDomains(req.user.id, orgId);
  }

  /**
   * Get domain details with full information (TASK-2.4.13)
   *
   * GET /domains/:id
   */
  @Get(":id")
  @RequireScope("domain:read")
  @Permission({ resource: "domain", action: "read" })
  async getDetails(@Param("id", ParseUUIDPipe) id: string) {
    return this.domainService.getDomainDetails(id);
  }

  /**
   * Set a domain as default for the organization (TASK-2.4.12)
   *
   * POST /domains/:id/default
   */
  @Post(":id/default")
  @RequireScope("domain:create")
  @Permission({ resource: "domain", action: "update" })
  async setDefault(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { orgId: string },
  ) {
    return this.domainService.setDefault(req.user.id, body.orgId, id);
  }

  /**
   * Get links associated with a domain (TASK-2.4.14)
   *
   * GET /domains/:id/links
   */
  @Get(":id/links")
  @RequireScope("domain:read")
  @Permission({ resource: "domain", action: "read" })
  async getLinks(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    return this.domainService.getLinksByDomain(id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  /**
   * Get domain analytics summary
   *
   * GET /domains/:id/analytics
   */
  @Get(":id/analytics")
  @RequireScope("domain:read")
  @Permission({ resource: "domain", action: "read" })
  async getAnalytics(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("period") period: string = "30d",
  ) {
    return this.domainService.getAnalytics(id, period);
  }

  @Patch(":id")
  @RequireScope("domain:create")
  @Permission({ resource: "domain", action: "update" })
  async update(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("orgId") orgId: string,
    @Body() dto: UpdateDomainDto,
  ) {
    return this.domainService.update(id, orgId, dto, req.user.id);
  }

  @Delete(":id")
  @RequireScope("domain:delete")
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
  @RequireScope("domain:create")
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
  @RequireScope("domain:read")
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
  @RequireScope("domain:create")
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
