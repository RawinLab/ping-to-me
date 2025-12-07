import { Injectable, BadRequestException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SslStatus } from "@pingtome/database";
import { randomUUID } from "crypto";

/**
 * Result of SSL certificate provisioning
 */
export interface SslProvisionResult {
  success: boolean;
  status: SslStatus;
  certificateId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  error?: string;
}

/**
 * SSL certificate status information
 */
export interface SslStatusInfo {
  status: SslStatus;
  provider?: string;
  certificateId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  autoRenew: boolean;
  daysUntilExpiry?: number;
}

/**
 * SSL Service - Handles certificate provisioning and management
 *
 * MOCK IMPLEMENTATION: This is a simulated service for development.
 * In production, this would integrate with ACME protocol (Let's Encrypt)
 * using libraries like 'acme-client' and handle actual certificate storage.
 *
 * Real implementation would require:
 * - ACME client for Let's Encrypt
 * - HTTP-01 or DNS-01 challenge handling
 * - Secure certificate storage
 * - Private key management
 * - Certificate chain validation
 */
@Injectable()
export class SslService {
  // Mock: Let's Encrypt certificates expire after 90 days
  private readonly CERT_EXPIRY_DAYS = 90;

  // Mock: Renew certificates when less than 30 days remain
  private readonly RENEWAL_THRESHOLD_DAYS = 30;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Provision SSL certificate for a domain (MOCK)
   *
   * In production, this would:
   * 1. Verify domain ownership via ACME HTTP-01 or DNS-01 challenge
   * 2. Request certificate from Let's Encrypt
   * 3. Store certificate and private key securely
   * 4. Configure web server with new certificate
   *
   * @param domainId - Domain ID to provision SSL for
   * @param userId - User requesting the provisioning
   * @returns SSL provision result
   */
  async provisionCertificate(
    domainId: string,
    userId: string,
  ): Promise<SslProvisionResult> {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
      include: { organization: true },
    });

    if (!domain) {
      throw new BadRequestException("Domain not found");
    }

    // Domain MUST be verified before SSL can be provisioned
    if (domain.status !== "VERIFIED" || !domain.isVerified) {
      throw new BadRequestException(
        "Domain must be verified before SSL can be provisioned",
      );
    }

    try {
      // Update status to PROVISIONING
      await this.prisma.domain.update({
        where: { id: domainId },
        data: { sslStatus: SslStatus.PROVISIONING },
      });

      // MOCK: Simulate certificate provisioning
      // In production, this would be actual ACME protocol interaction
      const certificateId = `cert_${randomUUID()}`;
      const issuedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CERT_EXPIRY_DAYS);

      // Update domain with certificate metadata
      await this.prisma.domain.update({
        where: { id: domainId },
        data: {
          sslStatus: SslStatus.ACTIVE,
          sslProvider: "letsencrypt-mock",
          sslCertificateId: certificateId,
          sslIssuedAt: issuedAt,
          sslExpiresAt: expiresAt,
          sslAutoRenew: true,
        },
      });

      // Audit log - SSL provisioned
      await this.auditService.logDomainEvent(
        userId,
        domain.organizationId,
        "domain.ssl_updated",
        {
          id: domain.id,
          hostname: domain.hostname,
        },
        {
          details: {
            action: "provision",
            provider: "letsencrypt-mock",
            certificateId,
            expiresAt: expiresAt.toISOString(),
          },
        },
      );

      return {
        success: true,
        status: SslStatus.ACTIVE,
        certificateId,
        issuedAt,
        expiresAt,
      };
    } catch (error) {
      // Update status to FAILED
      await this.prisma.domain.update({
        where: { id: domainId },
        data: { sslStatus: SslStatus.FAILED },
      });

      // Audit log - SSL provisioning failed
      await this.auditService.logDomainEvent(
        userId,
        domain.organizationId,
        "domain.ssl_updated",
        {
          id: domain.id,
          hostname: domain.hostname,
        },
        {
          status: "failure",
          details: {
            action: "provision",
            error: (error as Error).message,
          },
        },
      );

      return {
        success: false,
        status: SslStatus.FAILED,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get SSL certificate status for a domain
   *
   * @param domainId - Domain ID
   * @returns SSL status information
   */
  async getCertificateStatus(domainId: string): Promise<SslStatusInfo> {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new BadRequestException("Domain not found");
    }

    let daysUntilExpiry: number | undefined;
    if (domain.sslExpiresAt) {
      const now = new Date();
      const diffMs = domain.sslExpiresAt.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      status: domain.sslStatus,
      provider: domain.sslProvider || undefined,
      certificateId: domain.sslCertificateId || undefined,
      issuedAt: domain.sslIssuedAt || undefined,
      expiresAt: domain.sslExpiresAt || undefined,
      autoRenew: domain.sslAutoRenew,
      daysUntilExpiry,
    };
  }

  /**
   * Toggle auto-renewal for a domain's SSL certificate
   *
   * @param domainId - Domain ID
   * @param autoRenew - Enable/disable auto-renewal
   * @param userId - User making the change
   */
  async setAutoRenew(
    domainId: string,
    autoRenew: boolean,
    userId: string,
  ): Promise<void> {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new BadRequestException("Domain not found");
    }

    await this.prisma.domain.update({
      where: { id: domainId },
      data: { sslAutoRenew: autoRenew },
    });

    // Audit log - SSL auto-renew changed
    await this.auditService.logDomainEvent(
      userId,
      domain.organizationId,
      "domain.ssl_updated",
      {
        id: domain.id,
        hostname: domain.hostname,
      },
      {
        details: {
          action: "auto_renew_changed",
          autoRenew,
        },
      },
    );
  }

  /**
   * Check and renew expiring certificates
   *
   * This method should be called by a cron job (e.g., daily)
   * to automatically renew certificates that are approaching expiration.
   *
   * In production, this would:
   * 1. Query all domains with expiring certificates
   * 2. Request renewal from Let's Encrypt
   * 3. Update certificate storage
   * 4. Log renewal events
   *
   * @returns Number of certificates renewed
   */
  async renewExpiringCertificates(): Promise<number> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + this.RENEWAL_THRESHOLD_DAYS);

    // Find domains with certificates expiring within threshold
    const expiringDomains = await this.prisma.domain.findMany({
      where: {
        sslStatus: SslStatus.ACTIVE,
        sslAutoRenew: true,
        sslExpiresAt: {
          lte: thresholdDate,
        },
      },
      include: { organization: true },
    });

    console.log(
      `Found ${expiringDomains.length} certificates approaching expiration`,
    );

    let renewedCount = 0;

    for (const domain of expiringDomains) {
      try {
        // MOCK: Simulate renewal
        const certificateId = `cert_${randomUUID()}`;
        const issuedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.CERT_EXPIRY_DAYS);

        await this.prisma.domain.update({
          where: { id: domain.id },
          data: {
            sslCertificateId: certificateId,
            sslIssuedAt: issuedAt,
            sslExpiresAt: expiresAt,
            sslStatus: SslStatus.ACTIVE,
          },
        });

        // Audit log - SSL renewed (system action, no specific user)
        await this.auditService.logDomainEvent(
          "system", // System user for automated renewals
          domain.organizationId,
          "domain.ssl_updated",
          {
            id: domain.id,
            hostname: domain.hostname,
          },
          {
            details: {
              action: "auto_renew",
              provider: "letsencrypt-mock",
              certificateId,
              expiresAt: expiresAt.toISOString(),
              previousCertificateId: domain.sslCertificateId,
            },
          },
        );

        renewedCount++;
        console.log(`Renewed certificate for domain: ${domain.hostname}`);
      } catch (error) {
        console.error(
          `Failed to renew certificate for domain ${domain.hostname}:`,
          error,
        );

        // Update status to EXPIRED or FAILED
        await this.prisma.domain.update({
          where: { id: domain.id },
          data: { sslStatus: SslStatus.EXPIRED },
        });

        // Audit log - SSL renewal failed
        await this.auditService.logDomainEvent(
          "system",
          domain.organizationId,
          "domain.ssl_updated",
          {
            id: domain.id,
            hostname: domain.hostname,
          },
          {
            status: "failure",
            details: {
              action: "auto_renew",
              error: (error as Error).message,
            },
          },
        );
      }
    }

    console.log(`Successfully renewed ${renewedCount} certificates`);
    return renewedCount;
  }

  /**
   * Mark expired certificates
   *
   * This method should be called periodically to mark certificates
   * that have passed their expiration date as EXPIRED.
   *
   * @returns Number of certificates marked as expired
   */
  async markExpiredCertificates(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.domain.updateMany({
      where: {
        sslStatus: SslStatus.ACTIVE,
        sslExpiresAt: {
          lt: now,
        },
      },
      data: {
        sslStatus: SslStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      console.log(`Marked ${result.count} certificates as expired`);
    }

    return result.count;
  }

  // ==================== Cron Jobs ====================

  /**
   * Daily cron job to renew expiring certificates
   *
   * Runs every day at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCertificateRenewal() {
    console.log("Starting daily SSL certificate renewal check...");

    try {
      // Mark expired certificates
      const expiredCount = await this.markExpiredCertificates();
      if (expiredCount > 0) {
        console.log(`Marked ${expiredCount} certificates as expired`);
      }

      // Renew expiring certificates
      const renewedCount = await this.renewExpiringCertificates();
      console.log(`Daily SSL renewal check completed: ${renewedCount} certificates renewed`);
    } catch (error) {
      console.error("Error during daily SSL renewal check:", error);
    }
  }
}
