import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import ogs from 'open-graph-scraper';

export interface LinkMetadata {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  siteName?: string;
  favicon?: string;
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private readonly SCRAPE_TIMEOUT = 5000; // 5 seconds

  constructor(private prisma: PrismaService) {}

  async scrape(url: string): Promise<LinkMetadata> {
    try {
      const { result } = await ogs({
        url,
        timeout: this.SCRAPE_TIMEOUT,
        fetchOptions: {
          headers: {
            'User-Agent': 'PingToMe Bot/1.0 (+https://pingto.me)',
          },
        },
      });

      return {
        ogTitle: result.ogTitle || result.twitterTitle || result.dcTitle || undefined,
        ogDescription: result.ogDescription || result.twitterDescription || result.dcDescription || undefined,
        ogImage: this.extractImageUrl(result),
        siteName: result.ogSiteName || undefined,
        favicon: result.favicon || undefined,
      };
    } catch (error) {
      this.logger.warn(`Failed to scrape metadata for ${url}: ${(error as Error).message}`);
      return {};
    }
  }

  private extractImageUrl(result: any): string | undefined {
    // OG images can be an array
    if (result.ogImage && Array.isArray(result.ogImage) && result.ogImage.length > 0) {
      return result.ogImage[0].url;
    }

    // Or a single object
    if (result.ogImage && typeof result.ogImage === 'object' && result.ogImage.url) {
      return result.ogImage.url;
    }

    // Fallback to Twitter image
    if (result.twitterImage && Array.isArray(result.twitterImage) && result.twitterImage.length > 0) {
      return result.twitterImage[0].url;
    }

    return undefined;
  }

  async updateLinkMetadata(linkId: string, metadata: LinkMetadata): Promise<void> {
    await this.prisma.link.update({
      where: { id: linkId },
      data: {
        title: metadata.ogTitle || undefined,
        description: metadata.ogDescription || undefined,
        // Note: ogImage and siteName are not stored in the Link model currently
        // They could be added as separate fields if needed in the future
      },
    });
  }

  async scrapeAndUpdateLink(linkId: string, url: string): Promise<LinkMetadata> {
    const metadata = await this.scrape(url);

    // Only update if we got some metadata
    if (metadata.ogTitle || metadata.ogDescription || metadata.ogImage) {
      await this.updateLinkMetadata(linkId, metadata);
    }

    return metadata;
  }
}
