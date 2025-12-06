import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BioPage, BioPageLink } from '@prisma/client';
import { CreateBioLinkDto } from './dto/create-bio-link.dto';
import { UpdateBioLinkDto } from './dto/update-bio-link.dto';
import { ReorderLinksDto } from './dto/reorder-links.dto';

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
    const page = await this.prisma.bioPage.findUnique({
      where: { slug },
      include: {
        bioLinks: {
          where: { isVisible: true },
          orderBy: { order: 'asc' },
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
      throw new NotFoundException('Bio page not found');
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

  // Helper method to verify bio page ownership
  private async verifyBioPageOwnership(bioPageId: string, userId: string): Promise<BioPage> {
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
      throw new NotFoundException('Bio page not found');
    }

    // Check if user is a member of the organization
    if (bioPage.organization.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    return bioPage;
  }

  // Add link to bio page
  async addLink(bioPageId: string, userId: string, dto: CreateBioLinkDto): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Get the current max order
    const maxOrderLink = await this.prisma.bioPageLink.findFirst({
      where: { bioPageId },
      orderBy: { order: 'desc' },
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
  async updateLink(bioPageId: string, linkId: string, userId: string, dto: UpdateBioLinkDto): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    const bioLink = await this.prisma.bioPageLink.findFirst({
      where: { id: linkId, bioPageId },
    });

    if (!bioLink) {
      throw new NotFoundException('Bio page link not found');
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
  async removeLink(bioPageId: string, linkId: string, userId: string): Promise<BioPageLink> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    const bioLink = await this.prisma.bioPageLink.findFirst({
      where: { id: linkId, bioPageId },
    });

    if (!bioLink) {
      throw new NotFoundException('Bio page link not found');
    }

    // Delete the link
    const deletedLink = await this.prisma.bioPageLink.delete({
      where: { id: linkId },
    });

    // Reorder remaining links
    const remainingLinks = await this.prisma.bioPageLink.findMany({
      where: { bioPageId },
      orderBy: { order: 'asc' },
    });

    // Update orders sequentially
    await Promise.all(
      remainingLinks.map((link, index) =>
        this.prisma.bioPageLink.update({
          where: { id: link.id },
          data: { order: index },
        })
      )
    );

    return deletedLink;
  }

  // Reorder links
  async reorderLinks(bioPageId: string, userId: string, dto: ReorderLinksDto): Promise<BioPageLink[]> {
    await this.verifyBioPageOwnership(bioPageId, userId);

    // Verify all links belong to this bio page
    const linkIds = dto.orderings.map((o) => o.id);
    const bioLinks = await this.prisma.bioPageLink.findMany({
      where: { id: { in: linkIds }, bioPageId },
    });

    if (bioLinks.length !== linkIds.length) {
      throw new NotFoundException('One or more bio page links not found');
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      dto.orderings.map((ordering) =>
        this.prisma.bioPageLink.update({
          where: { id: ordering.id },
          data: { order: ordering.order },
        })
      )
    );

    // Return updated links
    return this.prisma.bioPageLink.findMany({
      where: { bioPageId },
      orderBy: { order: 'asc' },
    });
  }
}
