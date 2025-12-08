import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { AuditService } from "../../audit/audit.service";
import { ConfigureSAMLDto } from "./dto";
import * as xml2js from "xml2js";
import { randomUUID } from "crypto";

@Injectable()
export class SSOService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  /**
   * Configure SAML SSO for an organization
   * Enterprise tier only
   */
  async configureSAML(
    organizationId: string,
    userId: string,
    dto: ConfigureSAMLDto,
  ) {
    // 1. Check if organization is on Enterprise plan
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.plan !== "ENTERPRISE") {
      throw new ForbiddenException(
        "SSO is only available for Enterprise tier. Please upgrade your plan.",
      );
    }

    // 2. Check if organization has a verified domain
    const verifiedDomain = await this.prisma.domain.findFirst({
      where: {
        organizationId,
        isVerified: true,
      },
    });

    if (!verifiedDomain) {
      throw new BadRequestException(
        "Domain verification is required before enabling SSO. Please verify your domain first.",
      );
    }

    // 3. Validate certificate format
    this.validateCertificate(dto.certificate);

    // 4. Generate SP configuration
    const apiUrl = this.configService.get("NEXT_PUBLIC_API_URL");
    const spEntityId = `${apiUrl}/auth/sso/saml/metadata/${organizationId}`;
    const spAcsUrl = `${apiUrl}/auth/sso/saml/callback/${organizationId}`;

    // 5. Create or update SSO provider
    const ssoProvider = await this.prisma.sSOProvider.upsert({
      where: { organizationId },
      create: {
        organizationId,
        name: dto.name || "SAML SSO",
        type: "saml",
        entityId: dto.entityId,
        ssoUrl: dto.ssoUrl,
        sloUrl: dto.sloUrl || null,
        certificate: dto.certificate,
        spEntityId,
        spAcsUrl,
        signRequests: dto.signRequests || false,
        signatureAlgorithm: dto.signatureAlgorithm || "sha256",
        nameIdFormat: dto.nameIdFormat || "emailAddress",
        emailAttribute: dto.emailAttribute || "email",
        nameAttribute: dto.nameAttribute || "displayName",
        isEnabled: false, // Start disabled until explicitly enabled
      },
      update: {
        name: dto.name || "SAML SSO",
        entityId: dto.entityId,
        ssoUrl: dto.ssoUrl,
        sloUrl: dto.sloUrl || null,
        certificate: dto.certificate,
        signRequests: dto.signRequests || false,
        signatureAlgorithm: dto.signatureAlgorithm || "sha256",
        nameIdFormat: dto.nameIdFormat || "emailAddress",
        emailAttribute: dto.emailAttribute || "email",
        nameAttribute: dto.nameAttribute || "displayName",
        updatedAt: new Date(),
      },
    });

    // 6. Update organization settings to link SSO provider
    await this.prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        ssoProviderId: ssoProvider.id,
      },
    });

    // 7. Audit log
    await this.auditService.logResourceEvent(
      userId,
      organizationId,
      "sso.configured",
      "SSOProvider",
      ssoProvider.id,
      {
        status: "success",
        details: {
          provider: "SAML",
          entityId: dto.entityId,
          ssoUrl: dto.ssoUrl,
        },
      },
    );

    return ssoProvider;
  }

  /**
   * Get SAML configuration for an organization
   */
  async getSAMLConfig(organizationId: string) {
    const ssoProvider = await this.prisma.sSOProvider.findUnique({
      where: { organizationId },
    });

    if (!ssoProvider) {
      throw new NotFoundException("SSO configuration not found");
    }

    // Don't return sensitive certificate in response
    const { certificate, ...config } = ssoProvider;

    return {
      ...config,
      hasCertificate: !!certificate,
    };
  }

  /**
   * Enable or disable SSO for an organization
   */
  async updateSAMLStatus(
    organizationId: string,
    userId: string,
    isEnabled: boolean,
  ) {
    const ssoProvider = await this.prisma.sSOProvider.findUnique({
      where: { organizationId },
    });

    if (!ssoProvider) {
      throw new NotFoundException("SSO configuration not found");
    }

    const updated = await this.prisma.sSOProvider.update({
      where: { organizationId },
      data: { isEnabled },
    });

    // Update organization settings
    await this.prisma.organizationSettings.update({
      where: { organizationId },
      data: { ssoEnabled: isEnabled },
    });

    // Audit log
    await this.auditService.logResourceEvent(
      userId,
      organizationId,
      isEnabled ? "sso.enabled" : "sso.disabled",
      "SSOProvider",
      updated.id,
      {
        status: "success",
        details: {
          provider: "SAML",
        },
      },
    );

    return updated;
  }

  /**
   * Generate SP metadata XML
   */
  async generateSPMetadata(organizationId: string): Promise<string> {
    const ssoProvider = await this.prisma.sSOProvider.findUnique({
      where: { organizationId },
    });

    if (!ssoProvider) {
      throw new NotFoundException("SSO configuration not found");
    }

    const metadata = {
      "md:EntityDescriptor": {
        $: {
          "xmlns:md": "urn:oasis:names:tc:SAML:2.0:metadata",
          entityID: ssoProvider.spEntityId,
        },
        "md:SPSSODescriptor": {
          $: {
            AuthnRequestsSigned: ssoProvider.signRequests.toString(),
            WantAssertionsSigned: "true",
            protocolSupportEnumeration: "urn:oasis:names:tc:SAML:2.0:protocol",
          },
          "md:NameIDFormat": [
            `urn:oasis:names:tc:SAML:1.1:nameid-format:${ssoProvider.nameIdFormat}`,
          ],
          "md:AssertionConsumerService": {
            $: {
              Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
              Location: ssoProvider.spAcsUrl,
              index: "0",
              isDefault: "true",
            },
          },
        },
      },
    };

    const builder = new xml2js.Builder();
    return builder.buildObject(metadata);
  }

  /**
   * Handle SAML response and authenticate user (JIT provisioning)
   */
  async handleSAMLResponse(
    organizationId: string,
    profile: any,
    request: any,
  ) {
    const ssoProvider = await this.prisma.sSOProvider.findUnique({
      where: { organizationId },
    });

    if (!ssoProvider || !ssoProvider.isEnabled) {
      throw new ForbiddenException("SSO is not enabled for this organization");
    }

    // Extract user info from SAML profile
    const email =
      profile[ssoProvider.emailAttribute] ||
      profile.email ||
      profile.nameID;
    const name =
      profile[ssoProvider.nameAttribute] ||
      profile.displayName ||
      profile.name;

    if (!email) {
      throw new BadRequestException("Email not found in SAML response");
    }

    // JIT (Just-In-Time) provisioning: Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          emailVerified: new Date(), // SSO users are pre-verified
        },
      });

      // Add user to organization as VIEWER by default
      await this.prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId,
          role: "VIEWER",
        },
      });

      // Audit log: User provisioned via SSO
      await this.auditService.logResourceEvent(
        user.id,
        organizationId,
        "sso.user_provisioned",
        "User",
        user.id,
        {
          status: "success",
          details: {
            email,
            name,
            provider: "SAML",
          },
        },
      );
    } else {
      // Check if user is already a member
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });

      if (!member) {
        // Add existing user to organization
        await this.prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId,
            role: "VIEWER",
          },
        });
      }
    }

    // Audit log: SSO login
    await this.auditService.logResourceEvent(
      user.id,
      organizationId,
      "auth.sso_login",
      "User",
      user.id,
      {
        status: "success",
        context: {
          ipAddress: request?.ip || request?.connection?.remoteAddress,
          userAgent: request?.headers?.["user-agent"],
        },
        details: {
          email,
          provider: "SAML",
        },
      },
    );

    // Generate JWT tokens using existing auth service
    return this.authService.login(user, request);
  }

  /**
   * Delete SSO configuration
   */
  async deleteSAMLConfig(organizationId: string, userId: string) {
    const ssoProvider = await this.prisma.sSOProvider.findUnique({
      where: { organizationId },
    });

    if (!ssoProvider) {
      throw new NotFoundException("SSO configuration not found");
    }

    // Delete SSO provider
    await this.prisma.sSOProvider.delete({
      where: { organizationId },
    });

    // Update organization settings
    await this.prisma.organizationSettings.update({
      where: { organizationId },
      data: {
        ssoEnabled: false,
        ssoProviderId: null,
      },
    });

    // Audit log
    await this.auditService.logResourceEvent(
      userId,
      organizationId,
      "sso.deleted",
      "SSOProvider",
      ssoProvider.id,
      {
        status: "success",
        details: {
          provider: "SAML",
        },
      },
    );

    return { message: "SSO configuration deleted successfully" };
  }

  /**
   * Validate certificate format
   */
  private validateCertificate(certificate: string) {
    const certRegex =
      /-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/;
    if (!certRegex.test(certificate)) {
      throw new BadRequestException(
        "Invalid certificate format. Expected PEM format with BEGIN/END markers.",
      );
    }
  }

  /**
   * Parse IdP metadata XML (helper for frontend upload)
   */
  async parseIdPMetadata(metadataXml: string): Promise<any> {
    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(metadataXml);

      const entityDescriptor = result["md:EntityDescriptor"];
      if (!entityDescriptor) {
        throw new BadRequestException("Invalid SAML metadata XML");
      }

      const idpDescriptor =
        entityDescriptor["md:IDPSSODescriptor"]?.[0] ||
        entityDescriptor["IDPSSODescriptor"]?.[0];
      if (!idpDescriptor) {
        throw new BadRequestException(
          "IDPSSODescriptor not found in metadata",
        );
      }

      // Extract entity ID
      const entityId =
        entityDescriptor.$?.entityID || entityDescriptor.$?.EntityID;

      // Extract SSO URL
      const ssoService =
        idpDescriptor["md:SingleSignOnService"]?.[0] ||
        idpDescriptor["SingleSignOnService"]?.[0];
      const ssoUrl = ssoService?.$?.Location;

      // Extract SLO URL (optional)
      const sloService =
        idpDescriptor["md:SingleLogoutService"]?.[0] ||
        idpDescriptor["SingleLogoutService"]?.[0];
      const sloUrl = sloService?.$?.Location;

      // Extract certificate
      const keyDescriptor =
        idpDescriptor["md:KeyDescriptor"]?.[0] ||
        idpDescriptor["KeyDescriptor"]?.[0];
      const x509Cert =
        keyDescriptor?.["ds:KeyInfo"]?.[0]?.["ds:X509Data"]?.[0]?.[
          "ds:X509Certificate"
        ]?.[0] ||
        keyDescriptor?.["KeyInfo"]?.[0]?.["X509Data"]?.[0]?.[
          "X509Certificate"
        ]?.[0];

      const certificate = x509Cert
        ? `-----BEGIN CERTIFICATE-----\n${x509Cert.trim()}\n-----END CERTIFICATE-----`
        : null;

      if (!entityId || !ssoUrl || !certificate) {
        throw new BadRequestException(
          "Required fields (entityID, SSO URL, certificate) not found in metadata",
        );
      }

      return {
        entityId,
        ssoUrl,
        sloUrl: sloUrl || null,
        certificate,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestException(`Failed to parse IdP metadata: ${message}`);
    }
  }
}
