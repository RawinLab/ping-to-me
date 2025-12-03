import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UAParser } from 'ua-parser-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  async trackClick(data: {
    slug: string;
    timestamp: string;
    userAgent?: string;
    ip?: string;
    country?: string;
  }) {
    const link = await this.prisma.link.findUnique({ where: { slug: data.slug } });
    if (!link) return; // Ignore invalid slugs

    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop'; // Default to desktop

    if (data.userAgent) {
      const parser = new UAParser(data.userAgent);
      const result = parser.getResult();
      browser = result.browser.name || 'Unknown';
      os = result.os.name || 'Unknown';
      device = result.device.type || 'Desktop'; // type is undefined for desktop usually
      if (device === 'mobile') device = 'Mobile';
      if (device === 'tablet') device = 'Tablet';
    }

    return this.prisma.clickEvent.create({
      data: {
        linkId: link.id,
        timestamp: new Date(data.timestamp),
        userAgent: data.userAgent,
        ip: data.ip,
        country: data.country || 'Unknown',
        // Store parsed data if schema supports it, otherwise just use it for now?
        // Schema check: ClickEvent has `userAgent`, `ip`, `country`.
        // It does NOT have browser/os/device columns yet.
        // For now, we will just store what we can. 
        // Wait, if I want to aggregate by Device, I need to store it or parse it on read.
        // Parsing on read is slow.
        // Let's check schema first.
      },
    });
  }

  async getLinkAnalytics(linkId: string, userId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      throw new Error('Link not found or access denied');
    }

    const clicks = await this.prisma.clickEvent.findMany({
      where: { linkId },
      orderBy: { timestamp: 'desc' },
      take: 1000, // Increase limit for aggregation
    });

    const totalClicks = await this.prisma.clickEvent.count({ where: { linkId } });

    // Aggregate data
    const devices: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};

    clicks.forEach(click => {
      // Country
      const country = click.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;

      // Parse UA for each click (since we didn't store it)
      // This is inefficient but works for MVP without schema change
      if (click.userAgent) {
        const parser = new UAParser(click.userAgent);
        const result = parser.getResult();

        const deviceType = result.device.type ?
          (result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1)) : 'Desktop';
        devices[deviceType] = (devices[deviceType] || 0) + 1;

        const browserName = result.browser.name || 'Unknown';
        browsers[browserName] = (browsers[browserName] || 0) + 1;

        const osName = result.os.name || 'Unknown';
        os[osName] = (os[osName] || 0) + 1;
      } else {
        devices['Unknown'] = (devices['Unknown'] || 0) + 1;
      }
    });

    return {
      totalClicks,
      recentClicks: clicks.slice(0, 50), // Return only recent 50 for table
      devices,
      countries,
      browsers,
      os,
    };
  }

  async getDashboardMetrics(userId: string) {
    // Get all links for user
    const links = await this.prisma.link.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true, slug: true, originalUrl: true },
    });

    const linkIds = links.map(l => l.id);
    const totalLinks = links.length;

    // Get total clicks across all links
    const totalClicks = await this.prisma.clickEvent.count({
      where: { linkId: { in: linkIds } },
    });

    // Get recent clicks across all links
    const recentClicks = await this.prisma.clickEvent.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: { link: true },
    });

    // Get clicks over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clicksLast30Days = await this.prisma.clickEvent.findMany({
      where: {
        linkId: { in: linkIds },
        timestamp: { gte: thirtyDaysAgo }
      },
      select: { timestamp: true }
    });

    // Aggregate by date
    const clicksByDate: Record<string, number> = {};
    clicksLast30Days.forEach(click => {
      const date = click.timestamp.toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    });

    return {
      totalLinks,
      totalClicks,
      recentClicks,
      clicksByDate: Object.entries(clicksByDate).map(([date, count]) => ({ date, count })),
    };
  }
}
