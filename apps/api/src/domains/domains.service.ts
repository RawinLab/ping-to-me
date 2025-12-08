import { Injectable, ForbiddenException, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaClient, DomainStatus, Domain } from "@pingtome/database";
import * as dns from "dns/promises";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UpdateDomainDto } from "./dto";

// Maximum verification attempts before marking domain as FAILED
const MAX_VERIFICATION_ATTEMPTS = 10;

// CNAME verification target (configurable via environment)
const CNAME_VERIFY_TARGET =
  process.env.CNAME_VERIFY_TARGET || "verify.pingtome.com";

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);
  private prisma = new PrismaClient();

  constructor(
    private readonly auditService: AuditService,
    private quotaService: QuotaService,
  ) {}

  async addDomain(userId: string, orgId: string, hostname: string) {
    // Check quota before adding domain
    const quotaCheck = await this.quotaService.checkQuota(orgId, "domains");
    if (!quotaCheck.allowed) {
      throw new ForbiddenException({
        code: "QUOTA_EXCEEDED",
        message: "Custom domain limit reached. Please upgrade your plan.",
        currentUsage: quotaCheck.currentUsage,
        limit: quotaCheck.limit,
        upgradeUrl: "/pricing",
      });
    }

    // Verify org membership (simplified for now, ideally check OrganizationMember)
    // const member = await this.prisma.organizationMember.findUnique(...)

    // Check if domain exists
    const existing = await this.prisma.domain.findUnique({
      where: { hostname },
    });
    if (existing) throw new Error("Domain already registered");

    const verificationToken = `pingtome-verification=${Math.random().toString(36).substring(7)}`;

    const domain = await this.prisma.domain.create({
      data: {
        hostname,
        organizationId: orgId,
        isVerified: false,
        verificationToken,
        status: DomainStatus.PENDING,
        verificationAttempts: 0,
      },
    });

    // Audit log - async, non-blocking
    this.auditService
      .logDomainEvent(userId, orgId, "domain.added", {
        id: domain.id,
        hostname: domain.hostname,
      })
      .catch((err) => console.error("Failed to log domain.added event:", err));

    return domain;
  }

  async update(id: string, orgId: string, dto: UpdateDomainDto, userId: string): Promise<Domain> {
    const domain = await this.prisma.domain.findUnique({
      where: { id, organizationId: orgId },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    // If setting as default, ensure verified
    if (dto.isDefault && !domain.isVerified) {
      throw new BadRequestException('Only verified domains can be set as default');
    }

    // If setting as default, unset previous default
    if (dto.isDefault) {
      await this.prisma.domain.updateMany({
        where: { organizationId: orgId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.domain.update({
      where: { id },
      data: {
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.verificationType && { verificationType: dto.verificationType }),
      },
    });

    // Audit log
    this.auditService
      .logDomainEvent(userId, orgId, 'domain.updated', {
        id: updated.id,
        hostname: updated.hostname,
      })
      .catch((err) => console.error('Failed to log domain.updated event:', err));

    return updated;
  }

  /**
   * Verify domain using TXT record
   */
  private async verifyTxt(domain: {
    hostname: string;
    verificationToken: string | null;
  }): Promise<boolean> {
    if (!domain.verificationToken) {
      throw new Error("No verification token found");
    }

    try {
      const records = await dns.resolveTxt(domain.hostname);
      // records is string[][]
      const flatRecords = records.flat();
      return flatRecords.includes(domain.verificationToken);
    } catch (error) {
      this.logger.debug(
        `TXT verification failed for ${domain.hostname}: ${(error as any).message}`,
      );
      return false;
    }
  }

  /**
   * Verify domain using CNAME record (TASK-2.4.4)
   */
  private async verifyCname(domain: { hostname: string }): Promise<boolean> {
    try {
      const records = await dns.resolveCname(domain.hostname);
      // Check if any CNAME points to our verification target
      const isVerified = records.some(
        (record) => record.toLowerCase() === CNAME_VERIFY_TARGET.toLowerCase(),
      );
      return isVerified;
    } catch (error) {
      this.logger.debug(
        `CNAME verification failed for ${domain.hostname}: ${(error as any).message}`,
      );
      return false;
    }
  }

  /**
   * Update domain status with validation (TASK-2.4.7)
   */
  private async updateStatus(
    domainId: string,
    status: DomainStatus,
    verificationError?: string,
  ) {
    const updateData: any = {
      status,
      lastCheckAt: new Date(),
    };

    // Update verification state based on status
    if (status === DomainStatus.VERIFIED) {
      updateData.isVerified = true;
      updateData.lastVerifiedAt = new Date();
      updateData.verificationError = null;
    } else if (status === DomainStatus.FAILED) {
      updateData.verificationError = verificationError || "Verification failed";
    } else if (status === DomainStatus.PENDING) {
      updateData.verificationError = null;
    }

    return await this.prisma.domain.update({
      where: { id: domainId },
      data: updateData,
    });
  }

  /**
   * Reset verification to PENDING state (TASK-2.4.7)
   */
  async resetVerification(userId: string, domainId: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) throw new Error("Domain not found");

    const updatedDomain = await this.prisma.domain.update({
      where: { id: domainId },
      data: {
        status: DomainStatus.PENDING,
        verificationAttempts: 0,
        verificationError: null,
        isVerified: false,
        lastCheckAt: null,
      },
    });

    // Audit log - domain verification reset
    this.auditService
      .logDomainEvent(userId, domain.organizationId, "domain.reset", {
        id: updatedDomain.id,
        hostname: updatedDomain.hostname,
      })
      .catch((err) =>
        console.error("Failed to log domain.reset event:", err),
      );

    return updatedDomain;
  }

  /**
   * Verify domain with support for both TXT and CNAME verification (TASK-2.4.4)
   */
  async verifyDomain(
    userId: string,
    id: string,
    type: "txt" | "cname" = "txt",
  ) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error("Domain not found");

    if (domain.isVerified) return domain;

    // Update status to VERIFYING
    await this.updateStatus(id, DomainStatus.VERIFYING);

    try {
      let isVerified = false;

      // Perform verification based on type
      if (type === "cname") {
        isVerified = await this.verifyCname(domain);
      } else {
        isVerified = await this.verifyTxt(domain);
      }

      // Handle localhost bypass for testing
      if (!isVerified && domain.hostname.endsWith(".localhost")) {
        isVerified = true;
        this.logger.log(
          `Localhost bypass enabled for domain: ${domain.hostname}`,
        );
      }

      if (isVerified) {
        const updatedDomain = await this.prisma.domain.update({
          where: { id },
          data: {
            isVerified: true,
            status: DomainStatus.VERIFIED,
            verificationType: type,
            lastVerifiedAt: new Date(),
            lastCheckAt: new Date(),
            verificationError: null,
          },
        });

        // Audit log - domain verified successfully
        this.auditService
          .logDomainEvent(userId, domain.organizationId, "domain.verified", {
            id: updatedDomain.id,
            hostname: updatedDomain.hostname,
          })
          .catch((err) =>
            console.error("Failed to log domain.verified event:", err),
          );

        return updatedDomain;
      }

      // Increment verification attempts
      const updatedDomain = await this.prisma.domain.update({
        where: { id },
        data: {
          verificationAttempts: { increment: 1 },
          lastCheckAt: new Date(),
        },
      });

      // Check if max attempts reached (TASK-2.4.6)
      if (updatedDomain.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        await this.updateStatus(
          id,
          DomainStatus.FAILED,
          "Maximum verification attempts exceeded",
        );

        // Audit log - domain verification failed (max attempts)
        this.auditService
          .logDomainEvent(
            userId,
            domain.organizationId,
            "domain.failed",
            {
              id: domain.id,
              hostname: domain.hostname,
            },
            {
              status: "failure",
              details: {
                reason: "Maximum verification attempts exceeded",
                attempts: updatedDomain.verificationAttempts,
              },
            },
          )
          .catch((err) =>
            console.error("Failed to log domain.failed event:", err),
          );

        throw new Error(
          `Verification failed: Maximum attempts (${MAX_VERIFICATION_ATTEMPTS}) exceeded`,
        );
      }

      throw new Error("DNS record not found");
    } catch (error) {
      const errorMessage = (error as any).message;

      // Update verification attempts and error
      const updatedDomain = await this.prisma.domain.update({
        where: { id },
        data: {
          verificationAttempts: { increment: 1 },
          verificationError: errorMessage,
          lastCheckAt: new Date(),
        },
      });

      // Check if max attempts reached
      if (updatedDomain.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        await this.updateStatus(
          id,
          DomainStatus.FAILED,
          "Maximum verification attempts exceeded",
        );
      } else {
        // Return to PENDING status if not max attempts
        await this.updateStatus(id, DomainStatus.PENDING, errorMessage);
      }

      // Audit log - domain verification failed
      this.auditService
        .logDomainEvent(
          userId,
          domain.organizationId,
          "domain.failed",
          {
            id: domain.id,
            hostname: domain.hostname,
          },
          {
            status: "failure",
            details: {
              reason: errorMessage,
              attempts: updatedDomain.verificationAttempts,
            },
          },
        )
        .catch((err) =>
          console.error("Failed to log domain.failed event:", err),
        );

      throw new Error(`Verification failed: ${errorMessage}`);
    }
  }

  /**
   * Automated DNS polling for pending domains (TASK-2.4.5)
   * Runs every 30 minutes via cron
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async pollPendingDomains() {
    this.logger.log("Starting automated DNS polling for pending domains...");

    try {
      // Find all domains that are PENDING or VERIFYING and not yet verified
      const pendingDomains = await this.prisma.domain.findMany({
        where: {
          OR: [
            { status: DomainStatus.PENDING },
            { status: DomainStatus.VERIFYING },
          ],
          isVerified: false,
          verificationAttempts: { lt: MAX_VERIFICATION_ATTEMPTS },
        },
      });

      this.logger.log(`Found ${pendingDomains.length} domains to verify`);

      for (const domain of pendingDomains) {
        try {
          this.logger.debug(`Polling domain: ${domain.hostname}`);

          // Update status to VERIFYING
          await this.updateStatus(domain.id, DomainStatus.VERIFYING);

          // Determine verification type (default to txt if not set)
          const verifyType = (domain.verificationType as "txt" | "cname") || "txt";
          let isVerified = false;

          // Perform verification
          if (verifyType === "cname") {
            isVerified = await this.verifyCname(domain);
          } else {
            isVerified = await this.verifyTxt(domain);
          }

          if (isVerified) {
            // Mark as verified
            await this.prisma.domain.update({
              where: { id: domain.id },
              data: {
                isVerified: true,
                status: DomainStatus.VERIFIED,
                lastVerifiedAt: new Date(),
                lastCheckAt: new Date(),
                verificationError: null,
              },
            });

            this.logger.log(`Domain verified: ${domain.hostname}`);

            // Audit log - automated verification success
            this.auditService
              .logDomainEvent(
                "system",
                domain.organizationId,
                "domain.verified",
                {
                  id: domain.id,
                  hostname: domain.hostname,
                },
                {
                  details: { automated: true },
                },
              )
              .catch((err) =>
                console.error("Failed to log automated verification:", err),
              );
          } else {
            // Increment attempts and update last check
            const updatedDomain = await this.prisma.domain.update({
              where: { id: domain.id },
              data: {
                verificationAttempts: { increment: 1 },
                lastCheckAt: new Date(),
              },
            });

            // Check if max attempts reached
            if (updatedDomain.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
              await this.updateStatus(
                domain.id,
                DomainStatus.FAILED,
                "Maximum verification attempts exceeded",
              );

              this.logger.warn(
                `Domain verification failed (max attempts): ${domain.hostname}`,
              );

              // Audit log - automated verification failed
              this.auditService
                .logDomainEvent(
                  "system",
                  domain.organizationId,
                  "domain.failed",
                  {
                    id: domain.id,
                    hostname: domain.hostname,
                  },
                  {
                    status: "failure",
                    details: {
                      automated: true,
                      reason: "Maximum verification attempts exceeded",
                      attempts: updatedDomain.verificationAttempts,
                    },
                  },
                )
                .catch((err) =>
                  console.error("Failed to log automated failure:", err),
                );
            } else {
              // Return to PENDING
              await this.updateStatus(
                domain.id,
                DomainStatus.PENDING,
                "DNS records not found",
              );
              this.logger.debug(
                `Domain not yet verified (attempt ${updatedDomain.verificationAttempts}/${MAX_VERIFICATION_ATTEMPTS}): ${domain.hostname}`,
              );
            }
          }
        } catch (error) {
          this.logger.error(
            `Error polling domain ${domain.hostname}:`,
            (error as Error).stack,
          );

          // Update error state
          await this.prisma.domain.update({
            where: { id: domain.id },
            data: {
              verificationAttempts: { increment: 1 },
              verificationError: (error as any).message,
              lastCheckAt: new Date(),
            },
          });
        }
      }

      this.logger.log("Automated DNS polling completed");
    } catch (error) {
      this.logger.error(
        "Error in pollPendingDomains:",
        (error as Error).stack,
      );
    }
  }

  async listDomains(userId: string, orgId: string) {
    return this.prisma.domain.findMany({
      where: { organizationId: orgId },
    });
  }

  /**
   * Get domain details with full information (TASK-2.4.13)
   */
  async getDomainDetails(domainId: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
      include: {
        _count: {
          select: { links: true },
        },
      },
    });

    if (!domain) throw new Error("Domain not found");

    // Calculate verification instructions based on type
    const verificationInstructions = {
      txt: {
        type: "TXT",
        host: domain.hostname,
        value: domain.verificationToken || "",
        description: `Add a TXT record to your domain's DNS with the following value: ${domain.verificationToken}`,
      },
      cname: {
        type: "CNAME",
        host: domain.hostname,
        value: CNAME_VERIFY_TARGET,
        description: `Add a CNAME record to your domain's DNS pointing to: ${CNAME_VERIFY_TARGET}`,
      },
    };

    return {
      ...domain,
      linksCount: domain._count.links,
      verificationInstructions,
      sslInfo: {
        status: domain.sslStatus,
        provider: domain.sslProvider,
        certificateId: domain.sslCertificateId,
        issuedAt: domain.sslIssuedAt,
        expiresAt: domain.sslExpiresAt,
        autoRenew: domain.sslAutoRenew,
      },
    };
  }

  /**
   * Set a domain as default for the organization (TASK-2.4.12)
   */
  async setDefault(userId: string, orgId: string, domainId: string) {
    // Verify domain belongs to organization
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) throw new Error("Domain not found");
    if (domain.organizationId !== orgId) {
      throw new ForbiddenException("Domain does not belong to this organization");
    }

    // Verify domain is verified
    if (domain.status !== DomainStatus.VERIFIED) {
      throw new ForbiddenException("Domain must be verified before setting as default");
    }

    // Unset previous default domain for organization (if any)
    await this.prisma.domain.updateMany({
      where: {
        organizationId: orgId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set new domain as default
    const updatedDomain = await this.prisma.domain.update({
      where: { id: domainId },
      data: {
        isDefault: true,
      },
    });

    // Audit log - domain set as default
    this.auditService
      .logDomainEvent(userId, orgId, "domain.default_set", {
        id: updatedDomain.id,
        hostname: updatedDomain.hostname,
      })
      .catch((err) =>
        console.error("Failed to log domain.default_set event:", err),
      );

    return updatedDomain;
  }

  /**
   * Get links associated with a domain (TASK-2.4.14)
   */
  async getLinksByDomain(
    domainId: string,
    pagination: { page: number; limit: number },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Verify domain exists
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) throw new Error("Domain not found");

    // Query links associated with this domain
    const [links, total] = await Promise.all([
      this.prisma.link.findMany({
        where: { domainId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          originalUrl: true,
          title: true,
          status: true,
          createdAt: true,
          _count: {
            select: { clicks: true },
          },
        },
      }),
      this.prisma.link.count({ where: { domainId } }),
    ]);

    // Map to summary format with clicks count
    const linkSummaries = links.map((link) => ({
      id: link.id,
      slug: link.slug,
      targetUrl: link.originalUrl,
      title: link.title,
      status: link.status,
      clicks: link._count.clicks,
      createdAt: link.createdAt,
    }));

    return {
      data: linkSummaries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async removeDomain(userId: string, id: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error("Domain not found");

    const deletedDomain = await this.prisma.domain.delete({
      where: { id },
    });

    // Audit log - domain removed
    this.auditService
      .logDomainEvent(userId, domain.organizationId, "domain.removed", {
        id: deletedDomain.id,
        hostname: deletedDomain.hostname,
      })
      .catch((err) =>
        console.error("Failed to log domain.removed event:", err),
      );

    return deletedDomain;
  }

  /**
   * Get domain analytics summary (TASK-1.3.5)
   */
  async getAnalytics(domainId: string, period: string = '30d') {
    // Verify domain exists
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) throw new Error('Domain not found');

    // Calculate period start date
    const periodDays = parseInt(period.replace('d', ''), 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get all links for this domain with their click events
    const links = await this.prisma.link.findMany({
      where: { domainId },
      include: {
        clicks: {
          where: {
            timestamp: {
              gte: startDate,
            },
          },
          select: {
            timestamp: true,
          },
        },
      },
    });

    // Calculate total clicks
    const totalClicks = links.reduce((sum, link) => sum + link.clicks.length, 0);

    // Aggregate clicks by day
    const clicksByDay: Record<string, number> = {};
    links.forEach((link) => {
      link.clicks.forEach((click) => {
        const day = click.timestamp.toISOString().split('T')[0];
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      });
    });

    // Convert to sorted array
    const clicksByDayArray = Object.entries(clicksByDay)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top performing links
    const topLinks = links
      .map((link) => ({
        id: link.id,
        slug: link.slug,
        title: link.title,
        clicks: link.clicks.length,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);

    const prevLinks = await this.prisma.link.findMany({
      where: { domainId },
      include: {
        clicks: {
          where: {
            timestamp: {
              gte: prevStartDate,
              lt: startDate,
            },
          },
        },
      },
    });

    const prevTotalClicks = prevLinks.reduce(
      (sum, link) => sum + link.clicks.length,
      0
    );

    // Calculate change percentage
    const changePercent =
      prevTotalClicks > 0
        ? Math.round(((totalClicks - prevTotalClicks) / prevTotalClicks) * 100)
        : totalClicks > 0
          ? 100
          : 0;

    return {
      totalClicks,
      totalLinks: links.length,
      changePercent,
      period,
      clicksByDay: clicksByDayArray,
      topLinks,
    };
  }
}
