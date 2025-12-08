import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Permission } from "../rbac/permission.decorator";
import { PermissionGuard } from "../rbac/permission.guard";
import { SSOService } from "./sso.service";
import {
  ConfigureSAMLDto,
  UpdateSAMLStatusDto,
  SAMLMetadataResponseDto,
} from "./dto";
import { Request, Response } from "express";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("SSO")
@Controller("auth/sso")
export class SSOController {
  constructor(private ssoService: SSOService) {}

  /**
   * Configure SAML SSO for organization
   * OWNER/ADMIN only, Enterprise tier required
   */
  @Post("saml/configure/:organizationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "organization", action: "manage" })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Configure SAML SSO (Enterprise only)" })
  @ApiResponse({
    status: 201,
    description: "SAML SSO configured successfully",
  })
  @ApiResponse({ status: 403, description: "Enterprise tier required" })
  async configureSAML(
    @Param("organizationId") organizationId: string,
    @Req() req: any,
    @Body() dto: ConfigureSAMLDto,
  ) {
    return this.ssoService.configureSAML(organizationId, req.user.sub, dto);
  }

  /**
   * Get SAML configuration for organization
   */
  @Get("saml/config/:organizationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "organization", action: "read" })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get SAML SSO configuration" })
  @ApiResponse({ status: 200, description: "SAML configuration retrieved" })
  async getSAMLConfig(@Param("organizationId") organizationId: string) {
    return this.ssoService.getSAMLConfig(organizationId);
  }

  /**
   * Enable/Disable SSO
   */
  @Post("saml/status/:organizationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "organization", action: "manage" })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable or disable SSO" })
  @ApiResponse({ status: 200, description: "SSO status updated" })
  async updateSAMLStatus(
    @Param("organizationId") organizationId: string,
    @Req() req: any,
    @Body() dto: UpdateSAMLStatusDto,
  ) {
    return this.ssoService.updateSAMLStatus(
      organizationId,
      req.user.sub,
      dto.isEnabled,
    );
  }

  /**
   * Delete SAML configuration
   */
  @Delete("saml/config/:organizationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "organization", action: "manage" })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete SAML SSO configuration" })
  @ApiResponse({
    status: 200,
    description: "SAML configuration deleted successfully",
  })
  async deleteSAMLConfig(
    @Param("organizationId") organizationId: string,
    @Req() req: any,
  ) {
    return this.ssoService.deleteSAMLConfig(organizationId, req.user.sub);
  }

  /**
   * Get SP metadata XML (for IdP configuration)
   */
  @Get("saml/metadata/:organizationId")
  @ApiOperation({
    summary: "Get Service Provider metadata XML",
    description: "Returns SP metadata XML for configuring the IdP",
  })
  @ApiResponse({
    status: 200,
    description: "SP metadata XML",
    type: String,
  })
  async getSPMetadata(
    @Param("organizationId") organizationId: string,
    @Res() res: Response,
  ) {
    const metadataXml =
      await this.ssoService.generateSPMetadata(organizationId);

    res.header("Content-Type", "application/xml");
    return res.send(metadataXml);
  }

  /**
   * Get SP metadata info (JSON format for frontend)
   */
  @Get("saml/metadata-info/:organizationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "organization", action: "read" })
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get Service Provider metadata info (JSON)",
  })
  @ApiResponse({
    status: 200,
    description: "SP metadata information",
    type: SAMLMetadataResponseDto,
  })
  async getSPMetadataInfo(
    @Param("organizationId") organizationId: string,
  ): Promise<SAMLMetadataResponseDto> {
    const config = await this.ssoService.getSAMLConfig(organizationId);
    const metadataXml =
      await this.ssoService.generateSPMetadata(organizationId);

    return {
      spEntityId: config.spEntityId,
      spAcsUrl: config.spAcsUrl,
      metadataXml,
    };
  }

  /**
   * Initiate SAML login (redirect to IdP)
   */
  @Get("saml/login/:organizationId")
  @UseGuards(AuthGuard("saml"))
  @ApiOperation({
    summary: "Initiate SAML SSO login",
    description: "Redirects to IdP for authentication",
  })
  async initiateLogin(@Param("organizationId") organizationId: string) {
    // Passport SAML strategy handles the redirect
    // This method won't be reached as the guard redirects
  }

  /**
   * SAML callback (Assertion Consumer Service)
   */
  @Post("saml/callback/:organizationId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard("saml"))
  @ApiOperation({
    summary: "SAML callback endpoint (ACS)",
    description: "Handles SAML response from IdP",
  })
  @ApiResponse({
    status: 200,
    description: "Authentication successful, returns JWT tokens",
  })
  async handleCallback(
    @Param("organizationId") organizationId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      // Process SAML response and create/login user
      const result = await this.ssoService.handleSAMLResponse(
        organizationId,
        req.user,
        req,
      );

      // If 2FA is required
      if (result.requires2FA) {
        // Redirect to 2FA page with session token
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
        return res.redirect(
          `${frontendUrl}/auth/two-factor?sessionToken=${result.sessionToken}`,
        );
      }

      // Successful login - redirect to app with tokens
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
      return res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch (error: any) {
      // Redirect to error page
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
      return res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error?.message || "Authentication failed")}`,
      );
    }
  }

  /**
   * Initiate SAML logout (SLO)
   */
  @Get("saml/logout/:organizationId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Initiate SAML Single Logout",
    description: "Initiates logout from IdP",
  })
  async initiateLogout(
    @Param("organizationId") organizationId: string,
    @Res() res: Response,
  ) {
    const config = await this.ssoService.getSAMLConfig(organizationId);

    if (!config.sloUrl) {
      throw new BadRequestException(
        "Single Logout URL not configured for this IdP",
      );
    }

    // Redirect to IdP logout URL
    return res.redirect(config.sloUrl);
  }

  /**
   * Parse IdP metadata XML (helper endpoint for frontend)
   */
  @Post("saml/parse-metadata")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Parse IdP metadata XML",
    description: "Extract configuration from IdP metadata XML upload",
  })
  @ApiResponse({
    status: 200,
    description: "Parsed IdP metadata",
  })
  async parseIdPMetadata(@Body("metadataXml") metadataXml: string) {
    return this.ssoService.parseIdPMetadata(metadataXml);
  }
}
