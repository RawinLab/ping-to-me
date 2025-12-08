import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaClient, ClickSource } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { PrismaService } from "../prisma/prisma.service";
import { isBot } from "./utils/bot-filter";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.clickEvent.create({
      data: {
        linkId: link.id,
        timestamp: new Date(data.timestamp),
        userAgent: data.userAgent,
        ip: data.ip,
        country: data.country || "Unknown",
        source: data.source || ClickSource.DIRECT,
        referrer: data.referrer,
        // Store parsed data for analytics aggregation
        browser,
        os,
        device,
      },
    });
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

    const clicks = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "desc" },
      take: 1000, // Increase limit for aggregation
    });

    const totalClicks = await this.prisma.clickEvent.count({
      where: {
        linkId,
        timestamp: { gte: startDate },
      },
    });

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

    return {
      totalClicks,
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
}
