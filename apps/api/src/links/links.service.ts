import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLinkDto, LinkResponse, LinkStatus } from "@pingtome/types";
import { nanoid } from "nanoid";
import { toDataURL } from "qrcode";
import { QrCodeService } from "../qr/qr.service";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import { SafetyCheckService } from "./services/safety-check.service";
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
  ) {}

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

    // 4. Generate or use custom slug
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

    // 5. Create Link
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
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
        redirectType: dto.redirectType || 301,
        deepLinkFallback: dto.deepLinkFallback,
        userId,
        organizationId: dto.organizationId || null,
        domainId: domainId || null, // Store domain association (TASK-2.4.15)
        status: LinkStatus.ACTIVE,
        safetyStatus: 'pending', // Initialize safety status as pending
      },
    });

    // 6. Increment usage tracking
    if (dto.organizationId) {
      await this.quotaService.incrementUsage(dto.organizationId, 'links');
    }

    // 7. Sync to Cloudflare KV
    await this.syncToKv(link);

    // 8. Audit log - link created (async, non-blocking)
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

    // 9. Trigger safety check asynchronously (don't block)
    this.safetyCheckService
      .checkAndUpdateLink(link.id, dto.originalUrl)
      .catch((err) => console.error("Safety check failed:", err));

    // 10. Return response with QR options
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

    const kvKey = link.slug;
    const kvValue = JSON.stringify({
      url: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      deepLinkFallback: link.deepLinkFallback,
      status: link.status,
      redirectType: link.redirectType,
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
    userId: string,
    params: {
      page: number;
      limit: number;
      tag?: string;
      campaignId?: string;
      search?: string;
      status?: string;
    },
  ): Promise<{
    data: LinkResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page, limit, tag, campaignId, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      status: { not: LinkStatus.BANNED },
      deletedAt: null, // Exclude soft-deleted links by default
    };

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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { originalUrl: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
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

    return {
      originalUrl: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      deepLinkFallback: link.deepLinkFallback,
      redirectType: link.redirectType,
    };
  }

  async findOne(userId: string, id: string): Promise<LinkResponse> {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link || link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }
    return this.mapToResponse(link);
  }

  async delete(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link || link.userId !== userId) {
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

    return deleted;
  }

  async restore(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });

    if (!link || link.userId !== userId) {
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
    if (!link || link.userId !== userId) {
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
      status: updated.status,
      deepLinkFallback: updated.deepLinkFallback,
      campaignId: updated.campaignId,
    };

    await this.syncToKv(updated);

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
    };
  }
  async importLinks(userId: string, fileBuffer: Buffer) {
    const { parse } = await import("csv-parse/sync");

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

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
      }
    }

    // Audit log - bulk import (async, non-blocking)
    if (results.success > 0) {
      this.auditService
        .logLinkEvent(
          userId,
          null,
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

    return results;
  }

  async exportLinks(userId: string) {
    const links = await this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const { stringify } = await import("csv-stringify/sync");

    const csv = stringify(
      links.map((link) => ({
        originalUrl: link.originalUrl,
        slug: link.slug,
        title: link.title || "",
        description: link.description || "",
        tags: link.tags.join(", "),
        status: link.status,
        createdAt: link.createdAt.toISOString(),
        clicks: 0, // TODO: Add click count if available
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
        ],
      },
    );

    return csv;
  }

  async deleteMany(userId: string, ids: string[]) {
    // Verify ownership
    const count = await this.prisma.link.count({
      where: {
        userId,
        id: { in: ids },
      },
    });

    if (count !== ids.length) {
      // Some links might not belong to user, but we can just delete what matches
      // or throw error. For safety, let's just delete matching.
    }

    // Fetch links with organization info for quota tracking
    const links = await this.prisma.link.findMany({
      where: { userId, id: { in: ids } },
      select: { slug: true, organizationId: true },
    });

    // Delete from KV for each link
    for (const link of links) {
      await this.deleteFromKv(link.slug);
    }

    // Soft delete: set status to ARCHIVED and deletedAt timestamp
    const result = await this.prisma.link.updateMany({
      where: {
        userId,
        id: { in: ids },
      },
      data: {
        status: LinkStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    // Decrement usage tracking for organization links
    const orgIds = new Set(links.filter(l => l.organizationId).map(l => l.organizationId));
    for (const orgId of orgIds) {
      const orgLinksCount = links.filter(l => l.organizationId === orgId).length;
      for (let i = 0; i < orgLinksCount; i++) {
        await this.quotaService.decrementUsage(orgId, 'links');
      }
    }

    // Audit log - bulk delete (async, non-blocking)
    if (result.count > 0) {
      this.auditService
        .logLinkEvent(
          userId,
          null,
          "link.bulk_deleted",
          {
            id: "bulk-delete",
          },
          {
            details: {
              deletedCount: result.count,
              requestedCount: ids.length,
              softDelete: true,
            },
          },
        )
        .catch((err) => console.error("Audit log failed:", err));
    }

    return result;
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
}
