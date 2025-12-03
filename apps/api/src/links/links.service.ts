import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import { nanoid } from 'nanoid';

@Injectable()
export class LinkService {
  private prisma = new PrismaClient();

  async createShortLink(userId: string, orgId: string, destinationUrl: string, slug?: string) {
    const finalSlug = slug || nanoid(7);

    // Check collision
    const existing = await this.prisma.link.findUnique({ where: { slug: finalSlug } });
    if (existing) throw new Error('Slug already exists');

    // Check Spam
    const isSpam = await this.checkSpam(destinationUrl);
    if (isSpam) throw new Error('URL detected as spam');

    return this.prisma.link.create({
      data: {
        slug: finalSlug,
        destinationUrl,
        creatorId: userId,
        organizationId: orgId,
      },
    });
  }

  async getLink(slug: string) {
    return this.prisma.link.findUnique({ where: { slug } });
  }

  async listLinks(userId: string, orgId: string) {
    return this.prisma.link.findMany({
      where: {
        organizationId: orgId,
        creatorId: userId, // In real app, this might depend on RBAC
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLink(id: string, userId: string, data: { destinationUrl?: string; isActive?: boolean }) {
    // Verify ownership (simplified for MVP)
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link || link.creatorId !== userId) {
      throw new Error('Link not found or access denied');
    }

    if (data.destinationUrl) {
      const isSpam = await this.checkSpam(data.destinationUrl);
      if (isSpam) throw new Error('URL detected as spam');
    }

    return this.prisma.link.update({
      where: { id },
      data,
    });
  }

  async deleteLink(id: string, userId: string) {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link || link.creatorId !== userId) {
      throw new Error('Link not found or access denied');
    }

    return this.prisma.link.delete({ where: { id } });
  }

  private async checkSpam(url: string): Promise<boolean> {
    // Mock Google Safe Browsing check
    const spamDomains = ['malware.com', 'phishing.site'];
    return spamDomains.some(domain => url.includes(domain));
  }
}
