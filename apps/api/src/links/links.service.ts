import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkDto, LinkResponse, LinkStatus } from '@pingtome/types';
import { nanoid } from 'nanoid';
import { toDataURL } from 'qrcode';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateLinkDto): Promise<LinkResponse> {
    // 1. Validate URL format (basic check, can be enhanced)
    try {
      new URL(dto.originalUrl);
    } catch (e) {
      throw new BadRequestException('Invalid URL format');
    }

    // 2. Check for blocked domains
    const url = new URL(dto.originalUrl);
    const domain = url.hostname;
    const blocked = await this.prisma.blockedDomain.findUnique({
      where: { domain },
    });

    if (blocked) {
      throw new ForbiddenException('This domain is blocked');
    }

    // 3. Generate or use custom slug
    let slug = dto.slug;
    if (slug) {
      // Check for reserved slugs
      const reserved = ['api', 'admin', 'dashboard', 'auth', 'login', 'register'];
      if (reserved.includes(slug.toLowerCase())) {
        throw new BadRequestException('This slug is reserved');
      }

      // Check for uniqueness
      const existing = await this.prisma.link.findUnique({
        where: { slug },
      });
      if (existing) {
        throw new BadRequestException('This slug is already taken');
      }
    } else {
      // Auto-generate with retry
      let retries = 5;
      while (retries > 0) {
        slug = nanoid(8);
        const existing = await this.prisma.link.findUnique({
          where: { slug },
        });
        if (!existing) break;
        retries--;
      }
      if (retries === 0) {
        throw new BadRequestException('Failed to generate unique slug, please try again');
      }
    }

    // 4. Create Link
    const link = await this.prisma.link.create({
      data: {
        originalUrl: dto.originalUrl,
        slug,
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        passwordHash: dto.password, // TODO: Hash this in US6
        redirectType: dto.redirectType || 301,
        deepLinkFallback: dto.deepLinkFallback,
        userId,
        status: LinkStatus.ACTIVE,
      },
    });

    // 5. Sync to Cloudflare KV
    await this.syncToKv(link);

    // 6. Return response
    return this.mapToResponse(link);
  }

  private async syncToKv(link: any) {
    const accountId = process.env.CF_ACCOUNT_ID;
    const namespaceId = process.env.CF_NAMESPACE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !namespaceId || !apiToken) {
      console.warn('Cloudflare KV credentials missing, skipping sync');
      return;
    }

    const kvKey = link.slug;
    const kvValue = JSON.stringify({
      url: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      deepLinkFallback: link.deepLinkFallback,
    });

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${kvKey}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: kvValue,
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to sync to KV:', error);
      }
    } catch (error) {
      console.error('Error syncing to KV:', error);
    }
  }

  async findAll(
    userId: string,
    params: { page: number; limit: number; tag?: string; campaignId?: string; search?: string },
  ): Promise<{ data: LinkResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page, limit, tag, campaignId, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      status: { not: LinkStatus.BANNED },
    };

    if (tag) {
      where.tags = { has: tag };
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [links, total] = await Promise.all([
      this.prisma.link.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      data: await Promise.all(links.map((link) => this.mapToResponse(link))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async lookup(slug: string) {
    const link = await this.prisma.link.findUnique({
      where: { slug },
    });

    if (!link) {
      throw new BadRequestException('Link not found');
    }

    if (link.status !== LinkStatus.ACTIVE) {
      throw new ForbiddenException('Link is not active');
    }

    if (link.expirationDate && new Date() > link.expirationDate) {
      throw new ForbiddenException('Link has expired');
    }

    return {
      originalUrl: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      deepLinkFallback: link.deepLinkFallback,
    };
  }

  async update(userId: string, id: string, data: Partial<CreateLinkDto> & { status?: LinkStatus }) {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link || link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        status: data.status,
        passwordHash: data.password,
        deepLinkFallback: data.deepLinkFallback,
      },
    });

    await this.syncToKv(updated);
    return this.mapToResponse(updated);
  }

  private async mapToResponse(link: any): Promise<LinkResponse> {
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`;
    let qrCode: string | undefined;

    try {
      qrCode = await toDataURL(shortUrl);
    } catch (e) {
      console.error('Failed to generate QR code:', e);
    }

    return {
      id: link.id,
      originalUrl: link.originalUrl,
      slug: link.slug,
      shortUrl,
      qrCode,
      title: link.title || undefined,
      tags: link.tags,
      status: link.status as any,
      createdAt: link.createdAt.toISOString(),
    };
  }
  async importLinks(userId: string, fileBuffer: Buffer) {
    const { parse } = await import('csv-parse/sync');

    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const rawRecord of records) {
      const record = rawRecord as any;
      try {
        // Map CSV columns to DTO
        const dto: CreateLinkDto = {
          originalUrl: record.originalUrl || record.url,
          slug: record.slug || undefined,
          title: record.title || undefined,
          description: record.description || undefined,
          tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
        };

        if (!dto.originalUrl) {
          throw new Error('Missing originalUrl');
        }

        await this.create(userId, dto);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: record,
          error: (error as any).message,
        });
      }
    }

    return results;
  }

  async exportLinks(userId: string) {
    const links = await this.prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const { stringify } = await import('csv-stringify/sync');

    const csv = stringify(links.map(link => ({
      originalUrl: link.originalUrl,
      slug: link.slug,
      title: link.title || '',
      description: link.description || '',
      tags: link.tags.join(', '),
      status: link.status,
      createdAt: link.createdAt.toISOString(),
      clicks: 0, // TODO: Add click count if available
    })), {
      header: true,
      columns: ['originalUrl', 'slug', 'title', 'description', 'tags', 'status', 'createdAt', 'clicks'],
    });

    return csv;
  }

  async deleteMany(userId: string, ids: string[]) {
    // Verify ownership
    const count = await this.prisma.link.count({
      where: {
        userId,
        id: { in: ids },
      },
    });

    if (count !== ids.length) {
      // Some links might not belong to user, but we can just delete what matches
      // or throw error. For safety, let's just delete matching.
    }

    // Delete from KV (need to fetch slugs first)
    const links = await this.prisma.link.findMany({
      where: { userId, id: { in: ids } },
      select: { slug: true },
    });

    // TODO: Delete from KV (implement deleteFromKv)

    return this.prisma.link.deleteMany({
      where: {
        userId,
        id: { in: ids },
      },
    });
  }

  async addTagToMany(userId: string, ids: string[], tagName: string) {
    // Verify ownership and get links
    const links = await this.prisma.link.findMany({
      where: { userId, id: { in: ids } },
      select: { id: true, tags: true },
    });

    // Add tag to each link (tags is String[])
    const updatePromises = links.map((link) => {
      const currentTags = link.tags || [];
      // Only add if not already present
      if (!currentTags.includes(tagName)) {
        return this.prisma.link.update({
          where: { id: link.id },
          data: {
            tags: [...currentTags, tagName],
          },
        });
      }
      return Promise.resolve(null);
    });

    await Promise.all(updatePromises);

    return { success: true, count: links.length, tagName };
  }
}


