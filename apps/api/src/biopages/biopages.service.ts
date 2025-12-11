import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BioPage, BioPageLink } from "@prisma/client";
import { CreateBioLinkDto } from "./dto/create-bio-link.dto";
import { UpdateBioLinkDto } from "./dto/update-bio-link.dto";
import { ReorderLinksDto } from "./dto/reorder-links.dto";
import { BioEventType } from "./dto/track-event.dto";
import { UAParser } from "ua-parser-js";
import { QrCodeService } from "../qr/qr.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class BioPageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrService: QrCodeService,
    private readonly auditService: AuditService,
  ) {}

  async createBioPage(
    userId: string,
    orgId: string,
    data: { slug: string; title: string },
  ): Promise<BioPage> {
    // Check slug availability
    const existing = await this.prisma.bioPage.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw new ConflictException("Slug already taken");

    const bioPage = await this.prisma.bioPage.create({
      data: {
        slug: data.slug,
        title: data.title,
        organizationId: orgId,
        content: { links: [] }, // Initial empty content
        theme: { color: "default" }, // Initial default theme
      },
    });

    // Log bio page creation
    this.auditService
      .logResourceEvent(
        userId,
        orgId,
        "biopage.created",
        "BioPage",
        bioPage.id,
        {
          details: {
            slug: bioPage.slug,
            title: bioPage.title,
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors

    return bioPage;
  }

  async getBioPage(slug: string): Promise<any | null> {
    return this.prisma.bioPage.findUnique({
      where: { slug },
      include: {
        bioLinks: {
          orderBy: { order: "asc" },
          include: {
            link: {
              select: {
                slug: true,
                originalUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getPublicBioPage(slug: string): Promise<any | null> {
    const page = await this.prisma.bioPage.findUnique({
      where: { slug },
      include: {
        bioLinks: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          include: {
            link: {
              select: {
                slug: true,
                originalUrl: true,
              },
            },
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException("Bio page not found");
    }

    // Increment view count atomically
    await this.prisma.bioPage.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } },
    });

    // Transform bioLinks to include either externalUrl or link data
    const bioLinks = page.bioLinks.map((bioLink) => ({
      id: bioLink.id,
      title: bioLink.title,
      description: bioLink.description,
      icon: bioLink.icon,
      thumbnailUrl: bioLink.thumbnailUrl,
      buttonColor: bioLink.buttonColor,
      textColor: bioLink.textColor,
      order: bioLink.order,
      externalUrl: bioLink.externalUrl,
      link: bioLink.link,
    }));

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      description: page.description,
      avatarUrl: page.avatarUrl,
      theme: page.theme,
      layout: page.layout,
      socialLinks: page.socialLinks,
      showBranding: page.showBranding,
      bioLinks,
    };
  }

  async updateBioPage(id: string, userId: string, data: any): Promise<BioPage> {
    // Verify ownership (simplified) and get current state for audit logging
    const before = await this.prisma.bioPage.findUnique({ where: { id } });
    if (!before) throw new Error("Page not found");

    const bioPage = await this.prisma.bioPage.update({
      where: { id },
      data,
    });

    // Log bio page update with changes
    const changes = this.auditService.captureChanges(before, bioPage);
    this.auditService
      .logResourceEvent(
        userId,
        bioPage.organizationId,
        "biopage.updated",
        "BioPage",
        bioPage.id,
        {
          changes,
          details: {
            slug: bioPage.slug,
            title: bioPage.title,
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors

    return bioPage;
  }

  async deleteBioPage(id: string, userId: string): Promise<BioPage> {
    // Get bio page data before deletion for audit logging
    const bioPage = await this.prisma.bioPage.findUnique({ where: { id } });

    const deleted = await this.prisma.bioPage.delete({ where: { id } });

    // Log bio page deletion
    if (bioPage) {
      this.auditService
        .logResourceEvent(
          userId,
          bioPage.organizationId,
          "biopage.deleted",
          "BioPage",
          bioPage.id,
          {
            details: {
              slug: bioPage.slug,
              title: bioPage.title,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }

    return deleted;
  }

  async listBioPages(userId: string, orgId: string): Promise<any[]> {
    const pages = await this.prisma.bioPage.findMany({
      where: { organizationId: orgId },
      include: {
        bioLinks: {
          orderBy: { order: "asc" },
          include: {
            link: {
              select: {
                slug: true,
                originalUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            bioLinks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return pages;
  }

  // Helper method to verify bio page ownership
  private async verifyBioPageOwnership(
    bioPageId: string,
    userId: string,
  ): Promise<BioPage> {
    const bioPage = await this.prisma.bioPage.findUnique({
      where: { id: bioPageId },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!bioPage) {
      throw new NotFoundException("Bio page not found");
    }

    // Check if user is a member of the organization
    if (bioPage.organization.members.length === 0) {
      throw new ForbiddenException("Access denied");
    }

    return bioPage;
  }

  // Add link to bio page
  async addLink(
    bioPageId: string,
    userId: string,
    dto: CreateBioLinkDto,
  ): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Get the current max order
    const maxOrderLink = await this.prisma.bioPageLink.findFirst({
      where: { bioPageId },
      orderBy: { order: "desc" },
    });

    const nextOrder = maxOrderLink ? maxOrderLink.order + 1 : 0;

    return this.prisma.bioPageLink.create({
      data: {
        bioPageId,
        linkId: dto.linkId,
        externalUrl: dto.externalUrl,
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        thumbnailUrl: dto.thumbnailUrl,
        buttonColor: dto.buttonColor,
        textColor: dto.textColor,
        order: nextOrder,
      },
    });
  }

  // Update link
  async updateLink(
    bioPageId: string,
    linkId: string,
    userId: string,
    dto: UpdateBioLinkDto,
  ): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    const bioLink = await this.prisma.bioPageLink.findFirst({
      where: { id: linkId, bioPageId },
    });

    if (!bioLink) {
      throw new NotFoundException("Bio page link not found");
    }

    return this.prisma.bioPageLink.update({
      where: { id: linkId },
      data: {
        linkId: dto.linkId,
        externalUrl: dto.externalUrl,
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        thumbnailUrl: dto.thumbnailUrl,
        buttonColor: dto.buttonColor,
        textColor: dto.textColor,
        isVisible: dto.isVisible,
      },
    });
  }

  // Remove link
  async removeLink(
    bioPageId: string,
    linkId: string,
    userId: string,
  ): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    const bioLink = await this.prisma.bioPageLink.findFirst({
      where: { id: linkId, bioPageId },
    });

    if (!bioLink) {
      throw new NotFoundException("Bio page link not found");
    }

    // Delete the link
    const deletedLink = await this.prisma.bioPageLink.delete({
      where: { id: linkId },
    });

    // Reorder remaining links
    const remainingLinks = await this.prisma.bioPageLink.findMany({
      where: { bioPageId },
      orderBy: { order: "asc" },
    });

    // Update orders sequentially
    await Promise.all(
      remainingLinks.map((link, index) =>
        this.prisma.bioPageLink.update({
          where: { id: link.id },
          data: { order: index },
        }),
      ),
    );

    return deletedLink;
  }

  // Reorder links
  async reorderLinks(
    bioPageId: string,
    userId: string,
    dto: ReorderLinksDto,
  ): Promise<BioPageLink[]> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Verify all links belong to this bio page
    const linkIds = dto.orderings.map((o) => o.id);
    const bioLinks = await this.prisma.bioPageLink.findMany({
      where: { id: { in: linkIds }, bioPageId },
    });

    if (bioLinks.length !== linkIds.length) {
      throw new NotFoundException("One or more bio page links not found");
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      dto.orderings.map((ordering) =>
        this.prisma.bioPageLink.update({
          where: { id: ordering.id },
          data: { order: ordering.order },
        }),
      ),
    );

    // Return updated links
    return this.prisma.bioPageLink.findMany({
      where: { bioPageId },
      orderBy: { order: "asc" },
    });
  }

  // Track analytics event
  async trackEvent(
    bioPageId: string,
    eventType: BioEventType,
    bioLinkId: string | undefined,
    referrer: string | undefined,
    userAgent: string | undefined,
    ip: string | undefined,
  ): Promise<void> {
    // Verify bio page exists (silently ignore if not found)
    const bioPage = await this.prisma.bioPage.findUnique({
      where: { id: bioPageId },
    });

    if (!bioPage) {
      return; // Silently ignore invalid bio pages
    }

    // If link_click, verify bioLinkId is valid
    if (eventType === BioEventType.LINK_CLICK && bioLinkId) {
      const bioLink = await this.prisma.bioPageLink.findFirst({
        where: { id: bioLinkId, bioPageId },
      });

      // Increment click count on the bio link if it exists
      if (bioLink) {
        this.prisma.bioPageLink
          .update({
            where: { id: bioLinkId },
            data: { clickCount: { increment: 1 } },
          })
          .catch(() => {}); // Fire and forget, don't block on errors
      }
    }

    // Parse user agent
    let browser = "Unknown";
    let os = "Unknown";
    let device = "desktop"; // Default to desktop

    if (userAgent) {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      browser = result.browser.name || "Unknown";
      os = result.os.name || "Unknown";

      // UAParser returns undefined for desktop, 'mobile' or 'tablet' for others
      const deviceType = result.device.type;
      if (deviceType === "mobile") {
        device = "mobile";
      } else if (deviceType === "tablet") {
        device = "tablet";
      } else {
        device = "desktop";
      }
    }

    // Create analytics record (fire and forget, non-blocking)
    this.prisma.bioPageAnalytics
      .create({
        data: {
          bioPageId,
          eventType,
          bioLinkId,
          referrer,
          ip,
          device,
          browser,
          os,
          userAgent,
        },
      })
      .catch(() => {}); // Don't block on errors
  }

  // Analytics methods

  async getAnalyticsSummary(
    bioPageId: string,
    userId: string,
    days: number = 30,
  ) {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get total views (page_view events)
    const totalViews = await this.prisma.bioPageAnalytics.count({
      where: {
        bioPageId,
        eventType: "page_view",
        timestamp: { gte: startDate },
      },
    });

    // Get total clicks (link_click events)
    const totalClicks = await this.prisma.bioPageAnalytics.count({
      where: {
        bioPageId,
        eventType: "link_click",
        timestamp: { gte: startDate },
      },
    });

    // Get unique visitors (count distinct IPs for page views)
    const uniqueVisitorsData = await this.prisma.bioPageAnalytics.groupBy({
      by: ["ip"],
      where: {
        bioPageId,
        eventType: "page_view",
        timestamp: { gte: startDate },
        ip: { not: null },
      },
    });
    const uniqueVisitors = uniqueVisitorsData.length;

    // Get top 5 countries
    const countriesData = await this.prisma.bioPageAnalytics.groupBy({
      by: ["country"],
      where: {
        bioPageId,
        eventType: "page_view",
        timestamp: { gte: startDate },
        country: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topCountries = countriesData.map((c) => ({
      country: c.country || "Unknown",
      views: c._count.id,
    }));

    // Get top 5 referrers
    const referrersData = await this.prisma.bioPageAnalytics.groupBy({
      by: ["referrer"],
      where: {
        bioPageId,
        eventType: "page_view",
        timestamp: { gte: startDate },
        referrer: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topReferrers = referrersData.map((r) => ({
      referrer: r.referrer || "Direct",
      count: r._count.id,
    }));

    return {
      totalViews,
      totalClicks,
      uniqueVisitors,
      topCountries,
      topReferrers,
    };
  }

  async getAnalyticsTimeseries(
    bioPageId: string,
    userId: string,
    period: string = "30d",
  ) {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Parse period to days
    const periodMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = periodMap[period] || 30;

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get all analytics events in range
    const events = await this.prisma.bioPageAnalytics.findMany({
      where: {
        bioPageId,
        timestamp: { gte: startDate },
      },
      select: {
        eventType: true,
        timestamp: true,
      },
    });

    // Group by date
    const dataByDate: Record<string, { views: number; clicks: number }> = {};

    // Initialize all dates in range with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dataByDate[dateStr] = { views: 0, clicks: 0 };
    }

    // Count events by date
    events.forEach((event) => {
      const dateStr = event.timestamp.toISOString().split("T")[0];
      if (dataByDate[dateStr]) {
        if (event.eventType === "page_view") {
          dataByDate[dateStr].views++;
        } else if (event.eventType === "link_click") {
          dataByDate[dateStr].clicks++;
        }
      }
    });

    // Convert to array and sort by date
    const data = Object.entries(dataByDate)
      .map(([date, counts]) => ({
        date,
        views: counts.views,
        clicks: counts.clicks,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data };
  }

  async getClicksByLink(bioPageId: string, userId: string) {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Get all bio links with their click counts
    const bioLinks = await this.prisma.bioPageLink.findMany({
      where: { bioPageId },
      select: {
        id: true,
        title: true,
      },
    });

    // Get click counts from analytics
    const clicksData = await this.prisma.bioPageAnalytics.groupBy({
      by: ["bioLinkId"],
      where: {
        bioPageId,
        eventType: "link_click",
        bioLinkId: { not: null },
      },
      _count: { id: true },
    });

    // Create a map of bioLinkId to click count
    const clicksMap = new Map<string, number>();
    clicksData.forEach((c) => {
      if (c.bioLinkId) {
        clicksMap.set(c.bioLinkId, c._count.id);
      }
    });

    // Combine data
    const links = bioLinks.map((link) => ({
      linkId: link.id,
      title: link.title,
      clicks: clicksMap.get(link.id) || 0,
    }));

    // Sort by clicks descending
    links.sort((a, b) => b.clicks - a.clicks);

    return { links };
  }

  // QR Code generation
  async getBioPageQrCode(
    bioPageId: string,
    size: number = 300,
    format: "png" | "svg" = "png",
  ): Promise<{ data: Buffer | string }> {
    // Get bio page to get the slug
    const bioPage = await this.prisma.bioPage.findUnique({
      where: { id: bioPageId },
      select: { slug: true },
    });

    if (!bioPage) {
      throw new NotFoundException("Bio page not found");
    }

    // Construct public bio page URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const bioPageUrl = `${appUrl}/bio/${bioPage.slug}`;

    if (format === "svg") {
      // Generate SVG QR code
      const svg = await this.qrService.generateSvgQr(bioPageUrl, {
        color: "#000000",
        bgcolor: "#FFFFFF",
        size,
      });
      return { data: svg };
    } else {
      // Generate PNG QR code
      const { dataUrl } = await this.qrService.generateAdvancedQr({
        url: bioPageUrl,
        foregroundColor: "#000000",
        backgroundColor: "#FFFFFF",
        size,
        margin: 2,
        errorCorrection: "M",
      });

      // Convert base64 to buffer
      const base64Data = dataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      return { data: buffer };
    }
  }

  // Avatar Management
  async uploadAvatar(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<BioPage> {
    // Verify ownership
    const bioPage = await this.verifyBioPageOwnership(id, userId);

    // Validate file type
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only PNG, JPEG, and WebP are allowed.",
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 2MB limit.");
    }

    // Convert to base64
    const base64Avatar = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // Update bio page with avatar
    const updated = await this.prisma.bioPage.update({
      where: { id },
      data: { avatarUrl: base64Avatar },
    });

    // Audit log: avatar uploaded
    this.auditService
      .logResourceEvent(
        userId,
        bioPage.organizationId,
        "biopage.avatar_uploaded",
        "BioPage",
        updated.id,
        {
          details: {
            slug: updated.slug,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors

    return updated;
  }

  async deleteAvatar(id: string, userId: string): Promise<BioPage> {
    // Verify ownership
    const bioPage = await this.verifyBioPageOwnership(id, userId);

    const updated = await this.prisma.bioPage.update({
      where: { id },
      data: { avatarUrl: null },
    });

    // Audit log: avatar deleted
    this.auditService
      .logResourceEvent(
        userId,
        bioPage.organizationId,
        "biopage.avatar_deleted",
        "BioPage",
        updated.id,
        {
          details: {
            slug: updated.slug,
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors

    return updated;
  }
}
