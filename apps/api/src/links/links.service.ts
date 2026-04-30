import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLinkDto, LinkResponse, LinkStatus } from "@pingtome/types";
import { nanoid } from "nanoid";
import { toDataURL } from "qrcode";
import { QrCodeService } from "../qr/qr.service";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import { SafetyCheckService } from "./services/safety-check.service";
import { MetadataService } from "./services/metadata.service";
import { BulkEditDto } from "./dto/bulk-edit.dto";
import { PermissionService } from "../auth/rbac/permission.service";
import { WebhookService } from "../developer/webhooks.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class LinksService {
  private readonly RESERVED_SLUGS = [
    'api', 'admin', 'dashboard', 'auth', 'login', 'register',
    'signup', 'signin', 'logout', 'settings', 'profile', 'help',
    'support', 'about', 'contact', 'pricing', 'terms', 'privacy',
    'docs', 'documentation', 'blog', 'status', 'health'
  ];

  constructor(
    private prisma: PrismaService,
    private qrCodeService: QrCodeService,
    private auditService: AuditService,
    private quotaService: QuotaService,
    private safetyCheckService: SafetyCheckService,
    private metadataService: MetadataService,
    private permissionService: PermissionService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Helper method to check if user has full access permission for a link action
   * Users with '*' scope (OWNER/ADMIN) can manage any link in the organization
   */
  private async hasFullLinkAccess(
    userId: string,
    organizationId: string | null,
    action: "update" | "delete" | "read",
  ): Promise<boolean> {
    if (!organizationId) return false;
    return this.permissionService.hasFullAccessPermission(
      userId,
      organizationId,
      "link",
      action,
    );
  }

  private parseUtmParams(url: string): { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string } {
    try {
      const urlObj = new URL(url);
      return {
        utmSource: urlObj.searchParams.get('utm_source') || undefined,
        utmMedium: urlObj.searchParams.get('utm_medium') || undefined,
        utmCampaign: urlObj.searchParams.get('utm_campaign') || undefined,
        utmContent: urlObj.searchParams.get('utm_content') || undefined,
        utmTerm: urlObj.searchParams.get('utm_term') || undefined,
      };
    } catch {
      return {};
    }
  }

  async checkDuplicate(originalUrl: string, organizationId: string | null): Promise<any | null> {
    const whereClause: any = {
      originalUrl,
      status: { in: ['ACTIVE', 'DISABLED'] },
      deletedAt: null,
    };

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return this.prisma.link.findFirst({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        domain: {
          select: {
            hostname: true,
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreateLinkDto): Promise<LinkResponse> {
    // 1. Validate URL format (basic check, can be enhanced)
    try {
      new URL(dto.originalUrl);
    } catch (e) {
      throw new BadRequestException("Invalid URL format");
    }

    // 2. Check quota before creating link
    if (dto.organizationId) {
      const quotaCheck = await this.quotaService.checkQuota(dto.organizationId, 'links');
      if (!quotaCheck.allowed) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED',
          message: 'Monthly link limit reached. Please upgrade your plan.',
          currentUsage: quotaCheck.currentUsage,
          limit: quotaCheck.limit,
          upgradeUrl: '/pricing',
        });
      }
    }

    // 3. Handle custom domain selection (TASK-2.4.15)
    let domainId = dto.domainId;

    // If no domainId specified but organizationId is provided, use organization's default domain
    if (!domainId && dto.organizationId) {
      const defaultDomain = await this.prisma.domain.findFirst({
        where: {
          organizationId: dto.organizationId,
          isDefault: true,
        },
      });

      if (defaultDomain) {
        domainId = defaultDomain.id;
      }
    }

    // If domainId is specified, validate it
    if (domainId) {
      const customDomain = await this.prisma.domain.findUnique({
        where: { id: domainId },
      });

      if (!customDomain) {
        throw new BadRequestException("Custom domain not found");
      }

      // Validate domain belongs to organization
      if (dto.organizationId && customDomain.organizationId !== dto.organizationId) {
        throw new ForbiddenException("Domain does not belong to this organization");
      }

      // Validate domain is verified
      if (!customDomain.isVerified) {
        throw new ForbiddenException("Domain must be verified before use");
      }
    }

    // 4. Check for blocked domains
    const url = new URL(dto.originalUrl);
    const domain = url.hostname;
    const blocked = await this.prisma.blockedDomain.findUnique({
      where: { domain },
    });

    if (blocked) {
      throw new ForbiddenException("This domain is blocked");
    }

    // 5. Check for duplicate URL
    if (!dto.allowDuplicate) {
      const existingLink = await this.checkDuplicate(dto.originalUrl, dto.organizationId || null);
      if (existingLink) {
        const shortUrl = existingLink.domain
          ? `https://${existingLink.domain.hostname}/${existingLink.slug}`
          : `https://pingto.me/${existingLink.slug}`;

        throw new ConflictException({
          code: 'DUPLICATE_URL',
          message: 'This URL already has a short link',
          existingLink: {
            id: existingLink.id,
            slug: existingLink.slug,
            shortUrl,
          },
        });
      }
    }

    // 6. Generate or use custom slug
    let slug = dto.slug;
    if (slug) {
      // Check for reserved slugs
      const reserved = [
        "api",
        "admin",
        "dashboard",
        "auth",
        "login",
        "register",
      ];
      if (reserved.includes(slug.toLowerCase())) {
        throw new BadRequestException("This slug is reserved");
      }

      // Check for uniqueness
      const existing = await this.prisma.link.findUnique({
        where: { slug },
      });
      if (existing) {
        throw new BadRequestException("This slug is already taken");
      }
    } else {
      // Auto-generate with retry
      let retries = 5;
      while (retries > 0) {
        slug = nanoid(8);
        const existing = await this.prisma.link.findUnique({
          where: { slug },
        });
        if (!existing) break;
        retries--;
      }
      if (retries === 0) {
        throw new BadRequestException(
          "Failed to generate unique slug, please try again",
        );
      }
    }

    // 7. Parse UTM parameters from URL
    const utmParams = this.parseUtmParams(dto.originalUrl);

    // 8. Create Link
    const link = await this.prisma.link.create({
      data: {
        originalUrl: dto.originalUrl,
        slug,
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : null,
        maxClicks: dto.maxClicks || null,
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
        redirectType: dto.redirectType || 301,
        deepLinkFallback: dto.deepLinkFallback,
        userId,
        organizationId: dto.organizationId || null,
        domainId: domainId || null, // Store domain association (TASK-2.4.15)
        status: LinkStatus.ACTIVE,
        safetyStatus: 'pending', // Initialize safety status as pending
        ...utmParams, // Spread UTM parameters
      },
    });

    // 9. Increment usage tracking
    if (dto.organizationId) {
      await this.quotaService.incrementUsage(dto.organizationId, 'links');
    }

    // 10. Sync to Cloudflare KV
    await this.syncToKv(link);

    // Auto-scrape OG metadata (fire-and-forget)
    this.metadataService
      .scrapeAndUpdateLink(link.id, link.originalUrl)
      .then(() => this.syncToKv({ ...link }))
      .catch((err) => console.error("Metadata scrape failed:", err));

    // 11. Audit log - link created (async, non-blocking)
    this.auditService
      .logLinkEvent(
        userId,
        null,
        "link.created",
        {
          id: link.id,
          slug: link.slug,
          targetUrl: link.originalUrl,
        },
        {
          details: {
            title: link.title,
            tags: link.tags,
            redirectType: link.redirectType,
          },
        },
      )
      .catch((err) => console.error("Audit log failed:", err));

    // 12. Trigger safety check asynchronously (don't block)
    this.safetyCheckService
      .checkAndUpdateLink(link.id, dto.originalUrl)
      .catch((err) => console.error("Safety check failed:", err));

    // 13. Trigger webhook for link.created event (fire-and-forget)
    if (link.organizationId) {
      this.webhookService
        .triggerWebhook(
          "link.created",
          {
            event: "link.created",
            timestamp: new Date().toISOString(),
            data: {
              id: link.id,
              slug: link.slug,
              originalUrl: link.originalUrl,
              shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`,
              title: link.title,
              description: link.description,
              tags: link.tags,
              status: link.status,
              organizationId: link.organizationId,
              userId: link.userId,
              createdAt: link.createdAt.toISOString(),
            },
          },
          link.organizationId,
        )
        .catch(() => {});
    }

    // 14. Return response with QR options
    return this.mapToResponse(link, {
      qrColor: dto.qrColor,
      qrLogo: dto.qrLogo,
      generateQrCode: dto.generateQrCode,
    });
  }

  private async syncToKv(link: any) {
    const accountId = process.env.CF_ACCOUNT_ID;
    const namespaceId = process.env.CF_NAMESPACE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !namespaceId || !apiToken) {
      console.warn("Cloudflare KV credentials missing, skipping sync");
      return;
    }

    // Get current click count for maxClicks validation
    const currentClicks = await this.prisma.clickEvent.count({
      where: { linkId: link.id },
    });

    // Fetch redirect rules and variants for this link
    const [redirectRules, variants] = await Promise.all([
      this.prisma.redirectRule.findMany({ where: { linkId: link.id } }),
      this.prisma.linkVariant.findMany({ where: { linkId: link.id } }),
    ]);

    const kvKey = link.slug;
    const kvValue = JSON.stringify({
      url: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      maxClicks: link.maxClicks,
      currentClicks,
      deepLinkFallback: link.deepLinkFallback,
      status: link.status,
      redirectType: link.redirectType,
      interstitial: link.interstitial ?? false,
      countdownSeconds: link.countdownSeconds ?? 0,
      redirectRules,
      variants,
      ogPreview: (link.title || link.description || link.ogImage || link.ogFavicon) ? {
        title: link.title,
        description: link.description,
        image: link.ogImage,
        favicon: link.ogFavicon,
      } : null,
    });

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvKey}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: kvValue,
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to sync to KV:", error);
      }
    } catch (error) {
      console.error("Error syncing to KV:", error);
    }
  }

  async findAll(
    userId: string | null,
    params: {
      page: number;
      limit: number;
      tag?: string;
      campaignId?: string;
      folderId?: string;
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      organizationId?: string;
    },
  ): Promise<{
    data: LinkResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { tag, campaignId, folderId, search, status, startDate, endDate, organizationId } = params;
    // Ensure page and limit are valid numbers with defaults
    const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
    const limit = Number.isFinite(params.limit) && params.limit > 0 ? Math.min(params.limit, 100) : 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: LinkStatus.BANNED },
      deletedAt: null, // Exclude soft-deleted links by default
    };

    // Filter by organizationId if provided (API key auth), otherwise by userId (JWT auth)
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (userId) {
      where.userId = userId;
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
      // If specifically filtering for ARCHIVED, include soft-deleted links
      if (status === LinkStatus.ARCHIVED) {
        delete where.deletedAt;
      }
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { originalUrl: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [links, total] = await Promise.all([
      this.prisma.link.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      data: await Promise.all(links.map((link) => this.mapToResponse(link))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async lookup(slug: string) {
    const link = await this.prisma.link.findUnique({
      where: { slug },
      include: { redirectRules: true, variants: true },
    });

    if (!link) {
      throw new BadRequestException("Link not found");
    }

    if (link.status !== LinkStatus.ACTIVE) {
      throw new ForbiddenException("Link is not active");
    }

    if (link.expirationDate && new Date() > link.expirationDate) {
      throw new ForbiddenException("Link has expired");
    }

    // Get current click count for maxClicks validation
    const currentClicks = await this.prisma.clickEvent.count({
      where: { linkId: link.id },
    });

    // Check if maxClicks limit reached
    if (link.maxClicks && currentClicks >= link.maxClicks) {
      throw new ForbiddenException("Link has reached its maximum click limit");
    }

    return {
      originalUrl: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      maxClicks: link.maxClicks,
      currentClicks,
      deepLinkFallback: link.deepLinkFallback,
      redirectType: link.redirectType,
      interstitial: link.interstitial ?? false,
      countdownSeconds: link.countdownSeconds ?? 0,
      redirectRules: link.redirectRules,
      variants: link.variants,
      ogPreview: (link.title || link.description || link.ogImage || link.ogFavicon) ? {
        title: link.title,
        description: link.description,
        image: link.ogImage,
        favicon: link.ogFavicon,
      } : null,
    };
  }

  async findOne(userId: string | null, id: string, organizationId?: string): Promise<LinkResponse> {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link) {
      throw new ForbiddenException("Access denied");
    }

    // For API key auth: check if the link belongs to the API key's organization
    if (organizationId) {
      if (link.organizationId !== organizationId) {
        throw new ForbiddenException("Access denied");
      }
      return this.mapToResponse(link);
    }

    // For JWT auth: Check if user owns the link OR has full access permission (OWNER/ADMIN)
    if (userId) {
      const isOwner = link.userId === userId;
      const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "read");
      if (!isOwner && !hasFullAccess) {
        throw new ForbiddenException("Access denied");
      }
      return this.mapToResponse(link);
    }

    throw new ForbiddenException("Access denied");
  }

  async delete(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link) {
      throw new ForbiddenException("Access denied");
    }

    // Check if user owns the link OR has full access permission (OWNER/ADMIN)
    const isOwner = link.userId === userId;
    const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "delete");
    if (!isOwner && !hasFullAccess) {
      throw new ForbiddenException("Access denied");
    }

    // Soft delete: set status to ARCHIVED and deletedAt timestamp
    const deleted = await this.prisma.link.update({
      where: { id },
      data: {
        status: LinkStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    // Remove from Cloudflare KV (link is no longer active)
    await this.deleteFromKv(link.slug);

    // Decrement usage tracking if link belonged to an organization
    if (link.organizationId) {
      await this.quotaService.decrementUsage(link.organizationId, 'links');
    }

    // Audit log - link deleted (async, non-blocking)
    this.auditService
      .logLinkEvent(
        userId,
        null,
        "link.deleted",
        {
          id: link.id,
          slug: link.slug,
          targetUrl: link.originalUrl,
        },
        {
          details: {
            title: link.title,
            softDelete: true,
          },
        },
      )
      .catch((err) => console.error("Audit log failed:", err));

    // Trigger webhook for link.deleted event (fire-and-forget)
    if (link.organizationId) {
      this.webhookService
        .triggerWebhook(
          "link.deleted",
          {
            event: "link.deleted",
            timestamp: new Date().toISOString(),
            data: {
              id: link.id,
              slug: link.slug,
              originalUrl: link.originalUrl,
              organizationId: link.organizationId,
              userId,
              deletedAt: deleted.deletedAt?.toISOString(),
            },
          },
          link.organizationId,
        )
        .catch(() => {});
    }

    return deleted;
  }

  async restore(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });

    if (!link) {
      throw new ForbiddenException("Access denied");
    }

    // Check if user owns the link OR has full access permission (OWNER/ADMIN)
    const isOwner = link.userId === userId;
    const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "update");
    if (!isOwner && !hasFullAccess) {
      throw new ForbiddenException("Access denied");
    }

    if (link.status !== LinkStatus.ARCHIVED) {
      throw new BadRequestException("Only archived links can be restored");
    }

    // Check quota before restore (if organization link)
    if (link.organizationId) {
      const quotaCheck = await this.quotaService.checkQuota(link.organizationId, 'links');
      if (!quotaCheck.allowed) {
        throw new ForbiddenException({
          code: 'QUOTA_EXCEEDED',
          message: 'Cannot restore link. Monthly link limit reached.',
          currentUsage: quotaCheck.currentUsage,
          limit: quotaCheck.limit,
        });
      }
    }

    // Restore: set status to ACTIVE and clear deletedAt
    const restored = await this.prisma.link.update({
      where: { id },
      data: {
        status: LinkStatus.ACTIVE,
        deletedAt: null,
      },
    });

    // Re-sync to Cloudflare KV
    await this.syncToKv(restored);

    // Increment usage tracking
    if (link.organizationId) {
      await this.quotaService.incrementUsage(link.organizationId, 'links');
    }

    // Audit log - link restored
    this.auditService
      .logLinkEvent(
        userId,
        null,
        "link.restored",
        {
          id: link.id,
          slug: link.slug,
          targetUrl: link.originalUrl,
        },
        {
          details: {
            title: link.title,
          },
        },
      )
      .catch((err) => console.error("Audit log failed:", err));

    return this.mapToResponse(restored);
  }

  async scrapeMetadata(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });

    if (!link) {
      throw new ForbiddenException("Access denied");
    }

    // Check if user owns the link OR has full access permission (OWNER/ADMIN)
    const isOwner = link.userId === userId;
    const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "update");
    if (!isOwner && !hasFullAccess) {
      throw new ForbiddenException("Access denied");
    }

    const metadata = await this.metadataService.scrapeAndUpdateLink(id, link.originalUrl);

    return {
      success: true,
      metadata,
    };
  }

  private async deleteFromKv(slug: string) {
    const accountId = process.env.CF_ACCOUNT_ID;
    const namespaceId = process.env.CF_NAMESPACE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !namespaceId || !apiToken) {
      return;
    }

    try {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${slug}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        },
      );
    } catch (error) {
      console.error("Error deleting from KV:", error);
    }
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateLinkDto> & {
      status?: LinkStatus;
      campaignId?: string | null;
    },
  ) {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link) {
      throw new ForbiddenException("Access denied");
    }

    // Check if user owns the link OR has full access permission (OWNER/ADMIN)
    const isOwner = link.userId === userId;
    const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "update");
    if (!isOwner && !hasFullAccess) {
      throw new ForbiddenException("Access denied");
    }

    // Validate new URL if provided
    if (data.originalUrl) {
      try {
        new URL(data.originalUrl);
      } catch (e) {
        throw new BadRequestException("Invalid URL format");
      }
    }

    // Capture state before update for audit logging
    const before = {
      originalUrl: link.originalUrl,
      title: link.title,
      description: link.description,
      tags: link.tags,
      expirationDate: link.expirationDate,
      maxClicks: link.maxClicks,
      status: link.status,
      deepLinkFallback: link.deepLinkFallback,
      campaignId: link.campaignId,
    };

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        originalUrl: data.originalUrl,
        title: data.title,
        description: data.description,
        tags: data.tags,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate)
          : undefined,
        maxClicks: data.maxClicks,
        status: data.status,
        passwordHash: data.password ? await bcrypt.hash(data.password, 10) : undefined,
        deepLinkFallback: data.deepLinkFallback,
        campaignId: data.campaignId === null ? null : data.campaignId,
      },
    });

    // Capture state after update
    const after = {
      originalUrl: updated.originalUrl,
      title: updated.title,
      description: updated.description,
      tags: updated.tags,
      expirationDate: updated.expirationDate,
      maxClicks: updated.maxClicks,
      status: updated.status,
      deepLinkFallback: updated.deepLinkFallback,
      campaignId: updated.campaignId,
    };

    await this.syncToKv(updated);

    // Re-scrape OG if URL changed
    if (data.originalUrl && data.originalUrl !== link.originalUrl) {
      this.metadataService
        .scrapeAndUpdateLink(updated.id, updated.originalUrl)
        .then(() => this.syncToKv(updated))
        .catch((err) => console.error("Metadata re-scrape failed:", err));
    }

    // Audit log - link updated with changes (async, non-blocking)
    const changes = this.auditService.captureChanges(before, after);
    if (changes) {
      this.auditService
        .logLinkEvent(
          userId,
          null,
          "link.updated",
          {
            id: link.id,
            slug: link.slug,
            targetUrl: updated.originalUrl,
          },
          {
            changes,
          },
        )
        .catch((err) => console.error("Audit log failed:", err));
    }

    // Trigger webhook for link.updated event (fire-and-forget)
    if (updated.organizationId) {
      this.webhookService
        .triggerWebhook(
          "link.updated",
          {
            event: "link.updated",
            timestamp: new Date().toISOString(),
            data: {
              id: updated.id,
              slug: updated.slug,
              originalUrl: updated.originalUrl,
              shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${updated.slug}`,
              title: updated.title,
              description: updated.description,
              tags: updated.tags,
              status: updated.status,
              organizationId: updated.organizationId,
              userId: updated.userId,
              updatedAt: updated.updatedAt?.toISOString(),
              changes,
            },
          },
          updated.organizationId,
        )
        .catch(() => {});
    }

    return this.mapToResponse(updated);
  }

  private async mapToResponse(
    link: any,
    qrOptions?: { qrColor?: string; qrLogo?: string; generateQrCode?: boolean },
  ): Promise<LinkResponse> {
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`;
    let qrCode: string | undefined;

    // Check if QR code generation is disabled
    const shouldGenerateQr = qrOptions?.generateQrCode !== false;

    if (shouldGenerateQr) {
      try {
        // Use advanced QR generation if custom options provided
        if (qrOptions?.qrColor || qrOptions?.qrLogo) {
          const result = await this.qrCodeService.generateAdvancedQr({
            url: shortUrl,
            foregroundColor: qrOptions.qrColor || "#000000",
            backgroundColor: "#FFFFFF",
            logo: qrOptions.qrLogo,
            logoSize: 20,
            size: 300,
          });
          qrCode = result.dataUrl;
        } else {
          // Default simple QR code
          qrCode = await toDataURL(shortUrl);
        }
      } catch (e) {
        console.error("Failed to generate QR code:", e);
        // Fallback to simple QR if advanced fails
        try {
          qrCode = await toDataURL(shortUrl);
        } catch (e2) {
          console.error("Failed to generate fallback QR code:", e2);
        }
      }
    }

    // Get click/engagement count
    const clicks = await this.prisma.clickEvent.count({
      where: { linkId: link.id },
    });

    return {
      id: link.id,
      originalUrl: link.originalUrl,
      slug: link.slug,
      shortUrl,
      qrCode,
      title: link.title || undefined,
      tags: link.tags,
      status: link.status as any,
      createdAt: link.createdAt.toISOString(),
      clicks,
      interstitial: link.interstitial,
      countdownSeconds: link.countdownSeconds,
      ogImage: link.ogImage || undefined,
      ogFavicon: link.ogFavicon || undefined,
      ogSiteName: link.ogSiteName || undefined,
    };
  }
  private getMaxImportRows(plan?: string): number {
    const limits: Record<string, number> = {
      FREE: 100,
      PRO: 1000,
      ENTERPRISE: 10000,
    };
    return limits[plan?.toUpperCase() || 'FREE'] || 100;
  }

  async importLinks(userId: string, fileBuffer: Buffer, organizationId?: string, userPlan?: string) {
    const { parse } = await import("csv-parse/sync");

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Check max rows limit
    const maxRows = this.getMaxImportRows(userPlan);
    if (records.length > maxRows) {
      throw new BadRequestException(
        `CSV exceeds maximum allowed rows. Your plan allows ${maxRows} rows, but the file contains ${records.length} rows.`
      );
    }

    const results = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Use transaction for atomic import
    await this.prisma.$transaction(async (tx) => {
      for (const rawRecord of records) {
        const record = rawRecord as any;
        try {
          // Map CSV columns to DTO
          const dto: CreateLinkDto = {
            originalUrl: record.originalUrl || record.url,
            slug: record.slug || undefined,
            title: record.title || undefined,
            description: record.description || undefined,
            tags: record.tags
              ? record.tags.split(",").map((t: string) => t.trim())
              : [],
            expirationDate: record.expirationDate || undefined,
            organizationId: organizationId, // Add organization context
          };

          if (!dto.originalUrl) {
            throw new Error("Missing originalUrl");
          }

          await this.create(userId, dto);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: record,
            error: (error as any).message,
          });
          // For transaction: if we want all-or-nothing, throw here
          // But for partial success, continue
        }
      }
    }, { timeout: 60000 }); // 60 second timeout for large imports

    // Audit log - bulk import (async, non-blocking)
    if (results.success > 0) {
      this.auditService
        .logLinkEvent(
          userId,
          organizationId || null,
          "link.bulk_created",
          {
            id: "bulk-import",
          },
          {
            details: {
              totalImported: results.success,
              totalFailed: results.failed,
              totalRecords: results.total,
            },
          },
        )
        .catch((err) => console.error("Audit log failed:", err));
    }

    // Generate CSV of failed rows if any
    let failedRowsCsv: string | null = null;
    if (results.errors.length > 0) {
      const headers = 'originalUrl,slug,title,description,tags,expirationDate,error\n';
      const rows = results.errors.map(err => {
        const row = err.row;
        return `"${this.sanitizeCsvField(row.originalUrl || '')}","${this.sanitizeCsvField(row.slug || '')}","${this.sanitizeCsvField(row.title || '')}","${this.sanitizeCsvField(row.description || '')}","${this.sanitizeCsvField(row.tags || '')}","${this.sanitizeCsvField(row.expirationDate || '')}","${this.sanitizeCsvField(err.error)}"`;
      }).join('\n');
      failedRowsCsv = headers + rows;
    }

    return { ...results, failedRowsCsv };
  }

  private sanitizeCsvField(value: string): string {
    if (!value) return '';
    // Escape quotes by doubling them (CSV standard)
    return value.replace(/"/g, '""');
  }

  async previewImport(fileBuffer: Buffer): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    preview: Array<{
      rowNumber: number;
      data: {
        originalUrl: string;
        slug?: string;
        title?: string;
        description?: string;
        tags?: string[];
        expirationDate?: string;
      };
      errors: string[];
      warnings: string[];
    }>;
    duplicateSlugs: string[];
  }> {
    const { parse } = await import("csv-parse/sync");

    let records: any[];
    try {
      records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      throw new BadRequestException('Invalid CSV format: ' + (e as Error).message);
    }

    const preview: Array<{
      rowNumber: number;
      data: any;
      errors: string[];
      warnings: string[];
    }> = [];

    let validRows = 0;
    let invalidRows = 0;
    const slugsInFile = new Set<string>();
    const duplicateSlugs: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Extract data
      const originalUrl = record.originalUrl || record.url || '';
      const slug = record.slug || undefined;
      const title = record.title || undefined;
      const description = record.description || undefined;
      const tags = record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [];
      const expirationDate = record.expirationDate || undefined;

      // Validate URL
      if (!originalUrl) {
        errors.push('Missing required field: originalUrl');
      } else {
        try {
          new URL(originalUrl);
        } catch {
          errors.push('Invalid URL format');
        }
      }

      // Check for duplicate slugs within file
      if (slug) {
        if (slugsInFile.has(slug)) {
          warnings.push(`Duplicate slug "${slug}" in file`);
          duplicateSlugs.push(slug);
        } else {
          slugsInFile.add(slug);
        }

        // Check if slug exists in database
        const existing = await this.prisma.link.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (existing) {
          errors.push(`Slug "${slug}" already exists in database`);
        }

        // Check reserved slugs
        if (this.RESERVED_SLUGS.includes(slug.toLowerCase())) {
          errors.push(`Slug "${slug}" is reserved`);
        }
      }

      // Validate expiration date
      if (expirationDate) {
        const date = new Date(expirationDate);
        if (isNaN(date.getTime())) {
          errors.push('Invalid expirationDate format (use ISO 8601, e.g., 2024-12-31)');
        } else if (date < new Date()) {
          warnings.push('Expiration date is in the past');
        }
      }

      // Track valid/invalid
      if (errors.length > 0) {
        invalidRows++;
      } else {
        validRows++;
      }

      // Add to preview (first 10 rows for display, but validate all)
      if (preview.length < 10) {
        preview.push({
          rowNumber,
          data: {
            originalUrl,
            slug,
            title,
            description,
            tags,
            expirationDate,
          },
          errors,
          warnings,
        });
      }
    }

    return {
      totalRows: records.length,
      validRows,
      invalidRows,
      preview,
      duplicateSlugs: [...new Set(duplicateSlugs)],
    };
  }

  async exportLinks(userId: string, filters?: {
    organizationId?: string;
    tagIds?: string[];
    campaignId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
    selectedIds?: string[];
  }) {
    // Build where clause
    const where: any = { userId };

    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters?.selectedIds && filters.selectedIds.length > 0) {
      where.id = { in: filters.selectedIds };
    }

    if (filters?.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      where.tags = { hasSome: filters.tagIds };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const links = await this.prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (links.length === 0) {
      if (filters?.format === 'json') {
        return JSON.stringify([]);
      }
      return this.generateEmptyCsv();
    }

    // Get click counts using groupBy for efficiency
    const linkIds = links.map(l => l.id);
    const clickCounts = await this.prisma.clickEvent.groupBy({
      by: ['linkId'],
      where: { linkId: { in: linkIds } },
      _count: { id: true },
    });

    // Create a map of linkId -> clickCount
    const clickCountMap = new Map<string, number>();
    for (const cc of clickCounts) {
      clickCountMap.set(cc.linkId, cc._count.id);
    }

    // Prepare data
    const exportData = links.map((link) => ({
      originalUrl: link.originalUrl,
      slug: link.slug,
      title: link.title || "",
      description: link.description || "",
      tags: link.tags.join(", "),
      status: link.status,
      createdAt: link.createdAt.toISOString(),
      clicks: clickCountMap.get(link.id) || 0,
      expirationDate: link.expirationDate?.toISOString() || "",
      campaignId: link.campaignId || "",
    }));

    // Return JSON format
    if (filters?.format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }

    // Return CSV format (default)
    const { stringify } = await import("csv-stringify/sync");

    // Sanitize CSV fields to prevent CSV injection
    const sanitizeCsvField = (value: string): string => {
      if (!value) return value;
      const dangerousChars = ['=', '+', '-', '@'];
      if (dangerousChars.some(c => value.startsWith(c))) {
        return `'${value}`;
      }
      return value;
    };

    const csv = stringify(
      exportData.map(row => ({
        ...row,
        originalUrl: sanitizeCsvField(row.originalUrl),
        slug: sanitizeCsvField(row.slug),
        title: sanitizeCsvField(row.title),
        description: sanitizeCsvField(row.description),
        tags: sanitizeCsvField(row.tags),
      })),
      {
        header: true,
        columns: [
          "originalUrl",
          "slug",
          "title",
          "description",
          "tags",
          "status",
          "createdAt",
          "clicks",
          "expirationDate",
          "campaignId",
        ],
      },
    );

    return csv;
  }

  private generateEmptyCsv(): string {
    return 'originalUrl,slug,title,description,tags,status,createdAt,clicks\n';
  }

  async deleteMany(userId: string, ids: string[], permanent: boolean = false) {
    // Use transaction for atomic deletion
    return await this.prisma.$transaction(async (tx) => {
      // Verify ownership
      const links = await tx.link.findMany({
        where: { userId, id: { in: ids } },
        select: { id: true, slug: true, organizationId: true },
      });

      if (links.length === 0) {
        return { count: 0 };
      }

      // Delete from KV for each link
      for (const link of links) {
        await this.deleteFromKv(link.slug);
      }

      let result;

      if (permanent) {
        // Hard delete
        result = await tx.link.deleteMany({
          where: { userId, id: { in: ids } },
        });
      } else {
        // Soft delete: set status to ARCHIVED and deletedAt timestamp
        result = await tx.link.updateMany({
          where: { userId, id: { in: ids } },
          data: {
            status: LinkStatus.ARCHIVED,
            deletedAt: new Date(),
          },
        });
      }

      // Decrement usage tracking for organization links
      const orgIds = new Set(links.filter(l => l.organizationId).map(l => l.organizationId));
      for (const orgId of orgIds) {
        const orgLinksCount = links.filter(l => l.organizationId === orgId).length;
        for (let i = 0; i < orgLinksCount; i++) {
          await this.quotaService.decrementUsage(orgId!, 'links');
        }
      }

      // Audit log - bulk delete (async, non-blocking)
      if (result.count > 0) {
        this.auditService
          .logLinkEvent(
            userId,
            null,
            "link.bulk_deleted",
            { id: "bulk-delete" },
            {
              details: {
                deletedCount: result.count,
                requestedCount: ids.length,
                permanent,
              },
            },
          )
          .catch((err) => console.error("Audit log failed:", err));
      }

      return result;
    }, { timeout: 30000 });
  }

  async addTagToMany(userId: string, ids: string[], tagName: string) {
    // Verify ownership and get links
    const links = await this.prisma.link.findMany({
      where: { userId, id: { in: ids } },
      select: { id: true, tags: true },
    });

    // Add tag to each link (tags is String[])
    const updatePromises = links.map((link) => {
      const currentTags = link.tags || [];
      // Only add if not already present
      if (!currentTags.includes(tagName)) {
        return this.prisma.link.update({
          where: { id: link.id },
          data: {
            tags: [...currentTags, tagName],
          },
        });
      }
      return Promise.resolve(null);
    });

    await Promise.all(updatePromises);

    return { success: true, count: links.length, tagName };
  }

  async editMany(userId: string, dto: BulkEditDto): Promise<{ count: number; ids: string[] }> {
    const { ids, changes } = dto;

    // 1. Validate ownership of all links
    const ownedLinks = await this.prisma.link.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, status: true, slug: true, originalUrl: true },
    });

    if (ownedLinks.length !== ids.length) {
      throw new ForbiddenException('Some links do not belong to you or do not exist');
    }

    // 2. Use transaction for atomic updates
    await this.prisma.$transaction(async (tx) => {
      // Build update data
      const updateData: any = {};
      if (changes.status !== undefined) updateData.status = changes.status;
      if (changes.expirationDate !== undefined) {
        updateData.expirationDate = changes.expirationDate ? new Date(changes.expirationDate) : null;
      }
      if (changes.campaignId !== undefined) updateData.campaignId = changes.campaignId;

      // Update all links
      await tx.link.updateMany({
        where: { id: { in: ids }, userId },
        data: updateData,
      });
    });

    // 3. If status was changed, sync to KV
    if (changes.status !== undefined) {
      const updatedLinks = await this.prisma.link.findMany({
        where: { id: { in: ids } },
      });
      for (const link of updatedLinks) {
        await this.syncToKv(link);
      }
    }

    // 4. Audit log
    this.auditService.logLinkEvent(
      userId,
      null,
      'link.bulk_edited',
      { id: 'bulk-edit' },
      {
        details: {
          count: ids.length,
          changes: changes,
        },
      }
    ).catch(err => console.error('Audit log failed:', err));

    return { count: ids.length, ids };
  }

  async updateStatusMany(userId: string, ids: string[], status: string) {
    // Verify ownership
    const links = await this.prisma.link.findMany({
      where: { userId, id: { in: ids } },
    });

    if (links.length === 0) {
      return { success: false, count: 0 };
    }

    // Update status for all links
    const updatePromises = links.map(async (link) => {
      const updated = await this.prisma.link.update({
        where: { id: link.id },
        data: { status: status as any },
      });

      // Sync to KV
      await this.syncToKv(updated);

      // Audit log - status change
      this.auditService
        .logLinkEvent(
          userId,
          null,
          "link.status_changed",
          {
            id: link.id,
            slug: link.slug,
            targetUrl: link.originalUrl,
          },
          {
            changes: {
              before: { status: link.status },
              after: { status },
            },
          },
        )
        .catch((err) => console.error("Audit log failed:", err));

      return updated;
    });

    await Promise.all(updatePromises);

    // Audit log - bulk status change
    this.auditService
      .logLinkEvent(
        userId,
        null,
        "link.bulk_status_changed",
        {
          id: "bulk-status",
        },
        {
          details: {
            count: links.length,
            newStatus: status,
          },
        },
      )
      .catch((err) => console.error("Audit log failed:", err));

    return { success: true, count: links.length, status };
  }

  async checkSlugAvailability(slug: string, domainId?: string): Promise<{ available: boolean; suggestions?: string[] }> {
    // 1. Check reserved slugs
    if (this.RESERVED_SLUGS.includes(slug.toLowerCase())) {
      return {
        available: false,
        suggestions: this.generateSlugAlternatives(slug)
      };
    }

    // 2. Check if slug exists in database
    const existing = await this.prisma.link.findFirst({
      where: {
        slug,
        domainId: domainId || null,
        status: { not: 'ARCHIVED' }
      }
    });

    if (existing) {
      return {
        available: false,
        suggestions: this.generateSlugAlternatives(slug)
      };
    }

    return { available: true };
  }

  private generateSlugAlternatives(slug: string): string[] {
    return [
      `${slug}-1`,
      `${slug}-${nanoid(4)}`,
      `my-${slug}`,
    ].slice(0, 3);
  }

  async incrementClickCount(slug: string): Promise<{ success: boolean; maxReached: boolean }> {
    const link = await this.prisma.link.findUnique({
      where: { slug },
      select: { id: true, maxClicks: true, status: true },
    });

    if (!link) return { success: false, maxReached: false };

    // Get current click count
    const clickCount = await this.prisma.clickEvent.count({
      where: { linkId: link.id },
    });

    // Check if max clicks reached
    if (link.maxClicks && clickCount >= link.maxClicks) {
      // Update link status to DISABLED only if not already disabled
      if (link.status !== LinkStatus.DISABLED) {
        await this.prisma.link.update({
          where: { id: link.id },
          data: { status: LinkStatus.DISABLED },
        });

        // Remove from KV cache
        await this.deleteFromKv(slug);
      }

      return { success: true, maxReached: true };
    }

    return { success: true, maxReached: false };
  }

  async getClickLimitStatus(userId: string, linkId: string) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true, maxClicks: true, id: true, organizationId: true },
    });

    if (!link) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user owns the link OR has full access permission (OWNER/ADMIN)
    const isOwner = link.userId === userId;
    const hasFullAccess = await this.hasFullLinkAccess(userId, link.organizationId, "read");
    if (!isOwner && !hasFullAccess) {
      throw new ForbiddenException('Access denied');
    }

    const currentClicks = await this.prisma.clickEvent.count({
      where: { linkId },
    });

    return {
      maxClicks: link.maxClicks,
      currentClicks,
      remaining: link.maxClicks ? Math.max(0, link.maxClicks - currentClicks) : null,
      isLimited: link.maxClicks !== null,
      limitReached: link.maxClicks ? currentClicks >= link.maxClicks : false,
    };
  }

  private async removeFromKv(slug: string) {
    await this.deleteFromKv(slug);
  }
}
