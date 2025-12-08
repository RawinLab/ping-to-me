import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  Optional,
} from "@nestjs/common";
import { PrismaClient, ClickSource } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { isBot } from "./utils/bot-filter";
import { AnalyticsGateway } from "./realtime/analytics.gateway";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => AnalyticsGateway))
    private readonly analyticsGateway: AnalyticsGateway,
  ) {}

  /**
   * Generate a session hash from IP, User Agent, and Date (day only)
   * This provides privacy-preserving visitor tracking
   */
  private generateSessionHash(ip?: string, userAgent?: string, timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const ipString = ip || 'unknown';
    const uaString = userAgent || 'unknown';

    // Create hash from IP + UserAgent + Date
    const hashInput = `${ipString}${uaString}${dateString}`;
    return createHash('sha256').update(hashInput).digest('hex');
  }

  async trackClick(data: {
    slug: string;
    timestamp: string;
    userAgent?: string;
    ip?: string;
    country?: string;
    source?: ClickSource;
    referrer?: string;
  }) {
    // Skip bot traffic
    if (isBot(data.userAgent)) {
      return null; // Don't track bot clicks
    }

    const link = await this.prisma.link.findUnique({
      where: { slug: data.slug },
    });
    if (!link) return null; // Ignore invalid slugs

    let browser = "Unknown";
    let os = "Unknown";
    let device = "Desktop"; // Default to desktop

    if (data.userAgent) {
      const parser = new UAParser(data.userAgent);
      const result = parser.getResult();
      browser = result.browser.name || "Unknown";
      os = result.os.name || "Unknown";
      device = result.device.type || "Desktop"; // type is undefined for desktop usually
      if (device === "mobile") device = "Mobile";
      if (device === "tablet") device = "Tablet";
    }

    // Generate session hash for unique visitor tracking
    const clickTimestamp = new Date(data.timestamp);
    const sessionId = this.generateSessionHash(data.ip, data.userAgent, clickTimestamp);

    const clickEvent = await this.prisma.clickEvent.create({
      data: {
        linkId: link.id,
        timestamp: clickTimestamp,
        userAgent: data.userAgent,
        ip: data.ip,
        country: data.country || "Unknown",
        source: data.source || ClickSource.DIRECT,
        referrer: data.referrer,
        sessionId,
        // Store parsed data for analytics aggregation
        browser,
        os,
        device,
      },
    });

    // Emit real-time click event via WebSocket
    if (this.analyticsGateway) {
      try {
        this.analyticsGateway.emitClickEvent(link.id, link.userId, {
          linkId: link.id,
          timestamp: clickTimestamp,
          country: data.country,
          city: clickEvent.city,
          device,
          browser,
          os,
          referrer: data.referrer,
          source: data.source,
        });
      } catch (error) {
        // Don't fail the request if WebSocket fails
        console.error('Failed to emit WebSocket event:', error);
      }
    }

    return clickEvent;
  }

  async getLinkAnalytics(linkId: string, userId: string, days: number = 30) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Use aggregated data for queries > 7 days for better performance
    const useAggregatedData = days > 7;

    let clicks: any[] = [];
    let totalClicks = 0;
    let uniqueVisitors = 0;

    if (useAggregatedData) {
      // Use aggregated data for historical analysis
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get aggregated data for dates older than 7 days
      const aggregatedData = await this.prisma.analyticsDaily.findMany({
        where: {
          linkId,
          date: {
            gte: startDate,
            lt: sevenDaysAgo,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Get recent clicks (last 7 days) from ClickEvent for accuracy
      const recentClicks = await this.prisma.clickEvent.findMany({
        where: {
          linkId,
          timestamp: { gte: sevenDaysAgo },
        },
        orderBy: { timestamp: "desc" },
      });

      // Combine aggregated + recent data
      clicks = recentClicks; // For detailed display
      totalClicks = aggregatedData.reduce((sum, d) => sum + d.totalClicks, 0) + recentClicks.length;

      // Calculate unique visitors from aggregated data (approximation)
      const aggregatedUniqueVisitors = aggregatedData.reduce((sum, d) => sum + d.uniqueVisitors, 0);
      const recentSessionIds = new Set(
        recentClicks
          .filter((c) => c.sessionId !== null)
          .map((c) => c.sessionId as string),
      );
      uniqueVisitors = aggregatedUniqueVisitors + recentSessionIds.size;
    } else {
      // For short time ranges (≤7 days), use raw click events
      clicks = await this.prisma.clickEvent.findMany({
        where: {
          linkId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: "desc" },
        take: 1000, // Increase limit for aggregation
      });

      totalClicks = await this.prisma.clickEvent.count({
        where: {
          linkId,
          timestamp: { gte: startDate },
        },
      });
    }

    // Also get all-time total for display
    const allTimeClicks = await this.prisma.clickEvent.count({
      where: { linkId },
    });

    // Calculate weekly stats
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const clicksLast7Days = await this.prisma.clickEvent.count({
      where: {
        linkId,
        timestamp: { gte: sevenDaysAgo },
      },
    });

    const clicksPrevious7Days = await this.prisma.clickEvent.count({
      where: {
        linkId,
        timestamp: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    });

    // Calculate weekly change percentage
    let weeklyChange = 0;
    if (clicksPrevious7Days > 0) {
      weeklyChange = Math.round(
        ((clicksLast7Days - clicksPrevious7Days) / clicksPrevious7Days) * 100,
      );
    } else if (clicksLast7Days > 0) {
      weeklyChange = 100;
    }

    // Calculate previous period comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const previousPeriodClicks = await this.prisma.clickEvent.count({
      where: {
        linkId,
        timestamp: { gte: previousStartDate, lt: startDate },
      },
    });

    // Calculate percentage change
    let periodChange = 0;
    if (previousPeriodClicks > 0) {
      periodChange = Math.round(
        ((totalClicks - previousPeriodClicks) / previousPeriodClicks) * 100,
      );
    } else if (totalClicks > 0) {
      periodChange = 100;
    }

    // Aggregate data
    const devices: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const clicksByDate: Record<string, number> = {};

    // If using aggregated data, merge it first
    if (useAggregatedData) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const aggregatedData = await this.prisma.analyticsDaily.findMany({
        where: {
          linkId,
          date: {
            gte: startDate,
            lt: sevenDaysAgo,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Merge aggregated data
      aggregatedData.forEach((daily) => {
        // Add to clicksByDate
        const dateStr = daily.date.toISOString().split('T')[0];
        clicksByDate[dateStr] = daily.totalClicks;

        // Merge countries
        if (daily.countries) {
          const countriesData = daily.countries as Record<string, number>;
          Object.entries(countriesData).forEach(([country, count]) => {
            countries[country] = (countries[country] || 0) + count;
          });
        }

        // Merge devices
        if (daily.devices) {
          const devicesData = daily.devices as Record<string, number>;
          Object.entries(devicesData).forEach(([device, count]) => {
            devices[device] = (devices[device] || 0) + count;
          });
        }

        // Merge browsers
        if (daily.browsers) {
          const browsersData = daily.browsers as Record<string, number>;
          Object.entries(browsersData).forEach(([browser, count]) => {
            browsers[browser] = (browsers[browser] || 0) + count;
          });
        }

        // Merge OS
        if (daily.os) {
          const osData = daily.os as Record<string, number>;
          Object.entries(osData).forEach(([osName, count]) => {
            os[osName] = (os[osName] || 0) + count;
          });
        }

        // Merge referrers
        if (daily.referrers) {
          const referrersData = daily.referrers as Record<string, number>;
          Object.entries(referrersData).forEach(([referrer, count]) => {
            referrers[referrer] = (referrers[referrer] || 0) + count;
          });
        }
      });
    }

    // Process recent clicks (or all clicks if not using aggregated data)
    clicks.forEach((click) => {
      // Country
      const country = click.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;

      // City
      const city = click.city || "Unknown";
      if (city !== "Unknown") {
        cities[city] = (cities[city] || 0) + 1;
      }

      // Referrer
      const referrer = click.referrer || "direct";
      referrers[referrer] = (referrers[referrer] || 0) + 1;

      // Source
      const source = click.source || "DIRECT";
      sources[source] = (sources[source] || 0) + 1;

      // Clicks by date for chart
      const date = click.timestamp.toISOString().split("T")[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;

      // Parse UA for each click (since we didn't store it)
      if (click.userAgent) {
        const parser = new UAParser(click.userAgent);
        const result = parser.getResult();

        const deviceType = result.device.type
          ? result.device.type.charAt(0).toUpperCase() +
            result.device.type.slice(1)
          : "Desktop";
        devices[deviceType] = (devices[deviceType] || 0) + 1;

        const browserName = result.browser.name || "Unknown";
        browsers[browserName] = (browsers[browserName] || 0) + 1;

        const osName = result.os.name || "Unknown";
        os[osName] = (os[osName] || 0) + 1;
      } else {
        devices["Unknown"] = (devices["Unknown"] || 0) + 1;
      }
    });

    // Convert clicksByDate to sorted array
    const clicksByDateArray = Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Count unique visitors (already calculated if using aggregated data)
    if (!useAggregatedData) {
      const uniqueVisitorsResult = await this.prisma.clickEvent.groupBy({
        by: ['sessionId'],
        where: {
          linkId,
          timestamp: { gte: startDate },
          sessionId: { not: null },
        },
      });
      uniqueVisitors = uniqueVisitorsResult.length;
    }

    return {
      totalClicks,
      uniqueVisitors,
      allTimeClicks,
      clicksLast7Days,
      weeklyChange,
      periodChange,
      previousPeriodClicks,
      recentClicks: clicks.slice(0, 50), // Return only recent 50 for table
      clicksByDate: clicksByDateArray,
      devices,
      countries,
      cities,
      browsers,
      os,
      referrers,
      sources,
      days, // Include days in response for frontend reference
    };
  }


  async getUniqueVisitors(linkId: string, userId: string, days: number = 30) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Get all clicks in date range
    const allClicks = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate },
      },
      select: {
        sessionId: true,
        timestamp: true,
      },
    });

    const totalClicks = allClicks.length;

    // Count unique visitors (distinct sessionIds)
    const uniqueSessionIds = new Set(
      allClicks
        .filter((click) => click.sessionId !== null)
        .map((click) => click.sessionId as string)
    );
    const uniqueVisitors = uniqueSessionIds.size;

    // Calculate returning visitors (sessions with more than 1 click)
    const sessionClickCounts: Record<string, number> = {};
    allClicks.forEach((click) => {
      if (click.sessionId) {
        sessionClickCounts[click.sessionId] = (sessionClickCounts[click.sessionId] || 0) + 1;
      }
    });

    const returningVisitors = Object.values(sessionClickCounts).filter(
      (count) => count > 1
    ).length;

    // Calculate unique visitors by date
    const clicksByDate: Record<string, { unique: Set<string>; total: number }> = {};

    allClicks.forEach((click) => {
      const date = click.timestamp.toISOString().split('T')[0];

      if (!clicksByDate[date]) {
        clicksByDate[date] = { unique: new Set(), total: 0 };
      }

      clicksByDate[date].total += 1;

      if (click.sessionId) {
        clicksByDate[date].unique.add(click.sessionId);
      }
    });

    const uniqueByDate = Object.entries(clicksByDate)
      .map(([date, data]) => ({
        date,
        unique: data.unique.size,
        total: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalClicks,
      uniqueVisitors,
      returningVisitors,
      uniqueByDate,
    };
  }

  async getDashboardMetrics(userId: string, days: number = 30) {
    // Get all links for user
    const links = await this.prisma.link.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        title: true,
        createdAt: true,
      },
    });

    const linkIds = links.map((l) => l.id);
    const totalLinks = links.length;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total clicks across all links (in date range)
    const totalClicks = await this.prisma.clickEvent.count({
      where: {
        linkId: { in: linkIds },
        timestamp: { gte: startDate },
      },
    });

    // Get all-time total
    const allTimeClicks = await this.prisma.clickEvent.count({
      where: { linkId: { in: linkIds } },
    });

    // Calculate previous period comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const previousPeriodClicks = await this.prisma.clickEvent.count({
      where: {
        linkId: { in: linkIds },
        timestamp: { gte: previousStartDate, lt: startDate },
      },
    });

    // Calculate percentage change
    let periodChange = 0;
    if (previousPeriodClicks > 0) {
      periodChange = Math.round(
        ((totalClicks - previousPeriodClicks) / previousPeriodClicks) * 100,
      );
    } else if (totalClicks > 0) {
      periodChange = 100;
    }

    // Get recent clicks across all links
    const recentClicks = await this.prisma.clickEvent.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { timestamp: "desc" },
      take: 10,
      include: { link: true },
    });

    // Get clicks over time for the date range
    const clicksInRange = await this.prisma.clickEvent.findMany({
      where: {
        linkId: { in: linkIds },
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
        linkId: true,
        country: true,
        referrer: true,
        userAgent: true,
      },
    });

    // Aggregate by date
    const clicksByDate: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};

    clicksInRange.forEach((click) => {
      // By date
      const date = click.timestamp.toISOString().split("T")[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;

      // By country
      const country = click.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;

      // By referrer
      const referrer = click.referrer || "direct";
      referrers[referrer] = (referrers[referrer] || 0) + 1;

      // By device (parse UA)
      if (click.userAgent) {
        const parser = new UAParser(click.userAgent);
        const result = parser.getResult();
        const deviceType = result.device.type
          ? result.device.type.charAt(0).toUpperCase() +
            result.device.type.slice(1)
          : "Desktop";
        devices[deviceType] = (devices[deviceType] || 0) + 1;

        // By browser
        const browserName = result.browser.name || "Unknown";
        browsers[browserName] = (browsers[browserName] || 0) + 1;

        // By OS
        const osName = result.os.name || "Unknown";
        os[osName] = (os[osName] || 0) + 1;
      } else {
        devices["Unknown"] = (devices["Unknown"] || 0) + 1;
        browsers["Unknown"] = (browsers["Unknown"] || 0) + 1;
        os["Unknown"] = (os["Unknown"] || 0) + 1;
      }
    });

    // Get top performing links
    const linkClickCounts = await this.prisma.clickEvent.groupBy({
      by: ["linkId"],
      where: {
        linkId: { in: linkIds },
        timestamp: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topLinks = linkClickCounts.map((lc) => {
      const link = links.find((l) => l.id === lc.linkId);
      return {
        id: link?.id,
        slug: link?.slug,
        originalUrl: link?.originalUrl,
        title: link?.title,
        clicks: lc._count.id,
      };
    });

    return {
      totalLinks,
      totalClicks,
      allTimeClicks,
      periodChange,
      previousPeriodClicks,
      recentClicks,
      topLinks,
      clicksByDate: Object.entries(clicksByDate)
        .map(([date, count]) => ({ date, clicks: count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      countries,
      referrers,
      devices,
      browsers,
      os,
      days,
    };
  }

  async getQrAnalytics(linkId: string, userId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Get total clicks
    const totalClicks = await this.prisma.clickEvent.count({
      where: { linkId },
    });

    // Count clicks by source
    const sourceStats = await this.prisma.clickEvent.groupBy({
      by: ["source"],
      where: { linkId },
      _count: { id: true },
    });

    // Initialize counts
    let qrScans = 0;
    let directClicks = 0;
    let apiClicks = 0;

    // Process grouped results
    sourceStats.forEach((stat) => {
      const count = stat._count.id;
      switch (stat.source) {
        case "QR":
          qrScans = count;
          break;
        case "DIRECT":
          directClicks = count;
          break;
        case "API":
          apiClicks = count;
          break;
      }
    });

    // Calculate QR percentage
    const qrPercentage =
      totalClicks > 0 ? Math.round((qrScans / totalClicks) * 100) : 0;

    return {
      totalClicks,
      qrScans,
      directClicks,
      apiClicks,
      qrPercentage,
    };
  }

  async getQrSummary(userId: string) {
    // Get all user's links
    const links = await this.prisma.link.findMany({
      where: { userId },
      select: { id: true },
    });

    if (links.length === 0) {
      return {
        totalClicks: 0,
        qrClicks: 0,
        directClicks: 0,
        apiClicks: 0,
        qrPercentage: 0,
        linksWithQrScans: 0,
      };
    }

    const linkIds = links.map(l => l.id);

    // Get total clicks across all links
    const totalClicks = await this.prisma.clickEvent.count({
      where: { linkId: { in: linkIds } },
    });

    // Count clicks by source
    const sourceStats = await this.prisma.clickEvent.groupBy({
      by: ['source'],
      where: { linkId: { in: linkIds } },
      _count: { id: true },
    });

    // Process grouped results
    let qrClicks = 0;
    let directClicks = 0;
    let apiClicks = 0;

    sourceStats.forEach(stat => {
      const count = stat._count.id;
      switch (stat.source) {
        case 'QR':
          qrClicks = count;
          break;
        case 'DIRECT':
          directClicks = count;
          break;
        case 'API':
          apiClicks = count;
          break;
      }
    });

    // Calculate QR percentage
    const qrPercentage = totalClicks > 0
      ? Math.round((qrClicks / totalClicks) * 100)
      : 0;

    // Count links that have at least one QR scan
    const linksWithQrScans = await this.prisma.clickEvent.groupBy({
      by: ['linkId'],
      where: {
        linkId: { in: linkIds },
        source: 'QR',
      },
    });

    return {
      totalClicks,
      qrClicks,
      directClicks,
      apiClicks,
      qrPercentage,
      linksWithQrScans: linksWithQrScans.length,
    };
  }

  async exportLinkAnalytics(
    linkId: string,
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      format?: 'csv' | 'json';
      limit?: number;
    },
  ) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Build date filter
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }

    // Query click events
    const clickEvents = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 10000,
    });

    const format = filters.format || 'csv';

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'timestamp',
        'country',
        'city',
        'device',
        'browser',
        'os',
        'referrer',
        'source',
        'ip',
      ];

      const rows = clickEvents.map((event) => [
        event.timestamp.toISOString(),
        event.country || '',
        event.city || '',
        event.device || '',
        event.browser || '',
        event.os || '',
        event.referrer || '',
        event.source || '',
        event.ip || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\n');

      return {
        content: csvContent,
        contentType: 'text/csv',
        filename: `link-${link.slug}-analytics-${new Date().toISOString().split('T')[0]}.csv`,
      };
    } else {
      // JSON format
      return {
        content: JSON.stringify(clickEvents, null, 2),
        contentType: 'application/json',
        filename: `link-${link.slug}-analytics-${new Date().toISOString().split('T')[0]}.json`,
      };
    }
  }

  async exportDashboard(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      format?: 'csv' | 'json';
      limit?: number;
    },
  ) {
    // Get all user's links
    const links = await this.prisma.link.findMany({
      where: { userId },
      select: { id: true, slug: true, title: true, originalUrl: true },
    });

    const linkIds = links.map((l) => l.id);

    // Build date filter
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }

    // Query all click events for user's links
    const clickEvents = await this.prisma.clickEvent.findMany({
      where: {
        linkId: { in: linkIds },
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
      include: { link: { select: { slug: true, title: true } } },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 10000,
    });

    const format = filters.format || 'csv';

    if (format === 'csv') {
      // Generate CSV with link info
      const headers = [
        'timestamp',
        'link_slug',
        'link_title',
        'country',
        'city',
        'device',
        'browser',
        'os',
        'referrer',
        'source',
        'ip',
      ];

      const rows = clickEvents.map((event) => [
        event.timestamp.toISOString(),
        event.link?.slug || '',
        event.link?.title || '',
        event.country || '',
        event.city || '',
        event.device || '',
        event.browser || '',
        event.os || '',
        event.referrer || '',
        event.source || '',
        event.ip || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\n');

      return {
        content: csvContent,
        contentType: 'text/csv',
        filename: `dashboard-analytics-${new Date().toISOString().split('T')[0]}.csv`,
      };
    } else {
      // JSON format
      return {
        content: JSON.stringify(clickEvents, null, 2),
        contentType: 'application/json',
        filename: `dashboard-analytics-${new Date().toISOString().split('T')[0]}.json`,
      };
    }
  }

  async getHourlyHeatmap(linkId: string, userId: string, days: number = 30) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch click events in date range
    const clicks = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
      },
    });

    // Initialize 7x24 grid (7 days x 24 hours)
    const heatmapGrid: Record<string, number> = {};
    let maxCount = 0;

    // Aggregate clicks by day of week and hour
    clicks.forEach((click) => {
      // Use UTC to ensure consistency
      const day = click.timestamp.getUTCDay(); // 0-6 (0=Sunday)
      const hour = click.timestamp.getUTCHours(); // 0-23

      const key = `${day}-${hour}`;
      heatmapGrid[key] = (heatmapGrid[key] || 0) + 1;

      // Track max count for color scaling
      if (heatmapGrid[key] > maxCount) {
        maxCount = heatmapGrid[key];
      }
    });

    // Build complete heatmap data (including empty cells)
    const heatmapData: Array<{ day: number; hour: number; count: number }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatmapData.push({
          day,
          hour,
          count: heatmapGrid[key] || 0,
        });
      }
    }

    return {
      heatmapData,
      maxCount,
    };
  }

  async getDayOfWeekStats(linkId: string, userId: string, days: number = 30) {
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException("Link not found");
    }
    if (link.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const clicks = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
      },
    });

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const dayCounts: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    clicks.forEach((click) => {
      const dayOfWeek = click.timestamp.getDay();
      dayCounts[dayOfWeek] += 1;
    });

    const totalClicks = clicks.length;

    const dayStats = Object.entries(dayCounts).map(([day, count]) => {
      const dayNum = parseInt(day, 10);
      return {
        day: dayNum,
        dayName: dayNames[dayNum],
        count,
        percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
      };
    });

    let bestDay = dayStats[0];
    let worstDay = dayStats[0];

    dayStats.forEach((dayStat) => {
      if (dayStat.count > bestDay.count) {
        bestDay = dayStat;
      }
      if (dayStat.count < worstDay.count || worstDay.count === 0) {
        worstDay = dayStat;
      }
    });

    if (totalClicks === 0) {
      worstDay = { day: 0, dayName: "N/A", count: 0, percentage: 0 };
    }

    return {
      dayStats,
      bestDay: {
        day: bestDay.day,
        dayName: bestDay.dayName,
        count: bestDay.count,
      },
      worstDay: {
        day: worstDay.day,
        dayName: worstDay.dayName,
        count: worstDay.count,
      },
      totalClicks,
    };
  }
}
