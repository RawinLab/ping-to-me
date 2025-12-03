import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BioPage } from '@prisma/client';

@Injectable()
export class BioPageService {
  constructor(private readonly prisma: PrismaService) { }

  async createBioPage(userId: string, orgId: string, data: { slug: string; title: string }): Promise<BioPage> {
    // Check slug availability
    const existing = await this.prisma.bioPage.findUnique({ where: { slug: data.slug } });
    if (existing) throw new Error('Slug already taken');

    return this.prisma.bioPage.create({
      data: {
        slug: data.slug,
        title: data.title,
        organizationId: orgId,
        content: { links: [] }, // Initial empty content
        theme: { color: 'default' }, // Initial default theme
      },
    });
  }

  async getBioPage(slug: string): Promise<BioPage | null> {
    return this.prisma.bioPage.findUnique({ where: { slug } });
  }

  async getPublicBioPage(slug: string): Promise<any | null> {
    const page = await this.prisma.bioPage.findUnique({ where: { slug } });
    if (!page) return null;

    const linkIds = (page.content as any)?.links || [];
    const links = await this.prisma.link.findMany({
      where: { id: { in: linkIds }, status: 'ACTIVE' },
    });

    // Sort links to match the order in linkIds
    const sortedLinks = linkIds
      .map((id: string) => links.find((l) => l.id === id))
      .filter((l) => l !== undefined);

    return {
      ...page,
      links: sortedLinks,
    };
  }

  async updateBioPage(id: string, userId: string, data: any): Promise<BioPage> {
    // Verify ownership (simplified)
    const page = await this.prisma.bioPage.findUnique({ where: { id } });
    if (!page) throw new Error('Page not found');

    return this.prisma.bioPage.update({
      where: { id },
      data,
    });
  }

  async deleteBioPage(id: string, userId: string): Promise<BioPage> {
    return this.prisma.bioPage.delete({ where: { id } });
  }

  async listBioPages(userId: string, orgId: string): Promise<BioPage[]> {
    return this.prisma.bioPage.findMany({
      where: { organizationId: orgId },
    });
  }
}
