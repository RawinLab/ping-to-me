import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';

@Injectable()
export class AnalyticsService {
  private prisma = new PrismaClient();

  async trackClick(data: {
    slug: string;
    timestamp: string;
    userAgent?: string;
    ip?: string;
    country?: string;
  }) {
    const link = await this.prisma.link.findUnique({ where: { slug: data.slug } });
    if (!link) return; // Ignore invalid slugs

    return this.prisma.clickEvent.create({
      data: {
        linkId: link.id,
        timestamp: data.timestamp,
        userAgent: data.userAgent,
        ip: data.ip,
        country: data.country,
        // Parse other fields like browser/os/device from UA if needed
      },
    });
  }

  async getLinkAnalytics(linkId: string, userId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link || link.creatorId !== userId) {
      throw new Error('Link not found or access denied');
    }

    const clicks = await this.prisma.clickEvent.findMany({
      where: { linkId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit for MVP
    });

    const totalClicks = await this.prisma.clickEvent.count({ where: { linkId } });

    return {
      totalClicks,
      recentClicks: clicks,
    };
  }
}
