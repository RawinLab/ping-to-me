import { Injectable } from '@nestjs/common';
import { PrismaClient, BioPage } from '@pingtome/database';

@Injectable()
export class BioPageService {
  private prisma = new PrismaClient();

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
