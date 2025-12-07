import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaClient, ClickSource } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { PrismaService } from "../prisma/prisma.service";

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
  }) {
    const link = await this.prisma.link.findUnique({
      where: { slug: data.slug },
    });
    if (!link) return; // Ignore invalid slugs

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
      } else {
        devices["Unknown"] = (devices["Unknown"] || 0) + 1;
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
      recentClicks,
      topLinks,
      clicksByDate: Object.entries(clicksByDate)
        .map(([date, count]) => ({ date, clicks: count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      countries,
      referrers,
      devices,
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
}
