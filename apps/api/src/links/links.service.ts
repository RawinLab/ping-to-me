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
    params: { page: number; limit: number; tag?: string; search?: string },
  ): Promise<{ data: LinkResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page, limit, tag, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      status: { not: LinkStatus.BANNED },
    };

    if (tag) {
      where.tags = { has: tag };
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
}
