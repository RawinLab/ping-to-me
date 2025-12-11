import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LinkStatus } from '@pingtome/types';

@Injectable()
export class ExpireLinksTask {
  private readonly logger = new Logger(ExpireLinksTask.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Auto-expire links whose expiration date has passed
   * Runs every hour to check and update expired links
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireLinks(): Promise<void> {
    this.logger.log('Running auto-expire cron job...');

    try {
      // Find all active links that have passed their expiration date
      const expiredLinks = await this.prisma.link.findMany({
        where: {
          status: LinkStatus.ACTIVE,
          expirationDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          slug: true,
          originalUrl: true,
          passwordHash: true,
          expirationDate: true,
          deepLinkFallback: true,
          userId: true,
        },
      });

      if (expiredLinks.length === 0) {
        this.logger.log('No expired links found');
        return;
      }

      this.logger.log(`Found ${expiredLinks.length} expired links, updating...`);

      // Update status to EXPIRED for all found links
      const linkIds = expiredLinks.map(link => link.id);
      await this.prisma.link.updateMany({
        where: {
          id: { in: linkIds },
        },
        data: {
          status: LinkStatus.EXPIRED,
        },
      });

      // Sync each expired link to Cloudflare KV and create notifications
      for (const link of expiredLinks) {
        await this.syncToKv(link);

        // Create notification for link owner (NOTIF-020)
        if (link.userId) {
          try {
            await this.notificationsService.create(
              link.userId,
              'WARNING',
              'Link Expired',
              `Your link '${link.slug}' has expired and is no longer accessible.`
            );
          } catch (error) {
            this.logger.error(`Failed to create notification for link ${link.slug}:`, error);
          }
        }
      }

      this.logger.log(`Successfully expired ${expiredLinks.length} links`);
    } catch (error) {
      this.logger.error('Error running auto-expire cron job:', error);
    }
  }

  /**
   * Sync link status to Cloudflare KV
   * This ensures the edge redirector has the updated status
   */
  private async syncToKv(link: any): Promise<void> {
    const accountId = process.env.CF_ACCOUNT_ID;
    const namespaceId = process.env.CF_NAMESPACE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !namespaceId || !apiToken) {
      this.logger.warn('Cloudflare KV credentials missing, skipping sync for slug: ' + link.slug);
      return;
    }

    const kvKey = link.slug;
    const kvValue = JSON.stringify({
      url: link.originalUrl,
      passwordHash: link.passwordHash,
      expirationDate: link.expirationDate,
      deepLinkFallback: link.deepLinkFallback,
      status: LinkStatus.EXPIRED,
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
        this.logger.error(`Failed to sync link ${link.slug} to KV:`, error);
      } else {
        this.logger.debug(`Successfully synced expired link ${link.slug} to KV`);
      }
    } catch (error) {
      this.logger.error(`Error syncing link ${link.slug} to KV:`, error);
    }
  }
}
