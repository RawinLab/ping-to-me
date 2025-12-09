import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * QuotaCronService
 *
 * Handles scheduled tasks for quota management:
 * 1. Monthly quota reset - Creates new usage tracking records for all organizations
 * 2. Cleanup old usage data - Removes usage tracking records older than 12 months
 *
 * These jobs ensure:
 * - Organizations get fresh quotas each month
 * - Database doesn't grow unbounded with old usage data
 * - Historical data is retained for 12 months for reporting
 */
@Injectable()
export class QuotaCronService {
  private readonly logger = new Logger(QuotaCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reset monthly quotas for all organizations
   * Runs on the 1st of each month at midnight (UTC)
   * Cron: '0 0 1 * *' (minute hour day-of-month month day-of-week)
   */
  @Cron('0 0 1 * *', {
    name: 'resetMonthlyQuotas',
    timeZone: 'UTC',
  })
  async resetMonthlyQuotas(): Promise<void> {
    const startTime = Date.now();
    const currentYearMonth = this.getCurrentYearMonth();

    this.logger.log(`Starting monthly quota reset for ${currentYearMonth}...`);

    try {
      // Get all active organizations
      const organizations = await this.prisma.organization.findMany({
        select: { id: true, name: true, plan: true },
      });

      this.logger.log(`Found ${organizations.length} organizations to reset quotas for`);

      let successCount = 0;
      let failureCount = 0;

      // Create new usage tracking records for each organization
      for (const org of organizations) {
        try {
          await this.prisma.usageTracking.upsert({
            where: {
              organizationId_yearMonth: {
                organizationId: org.id,
                yearMonth: currentYearMonth,
              },
            },
            create: {
              organizationId: org.id,
              yearMonth: currentYearMonth,
              linksCreated: 0,
              apiCalls: 0,
            },
            update: {
              // If record already exists (shouldn't happen), reset to 0
              linksCreated: 0,
              apiCalls: 0,
            },
          });

          successCount++;

          if (successCount % 100 === 0) {
            this.logger.log(`Progress: ${successCount}/${organizations.length} organizations processed`);
          }
        } catch (error) {
          failureCount++;
          const err = error as Error;
          this.logger.error(
            `Failed to reset quota for organization ${org.id} (${org.name}): ${err.message}`,
            err.stack,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Monthly quota reset completed in ${duration}ms. ` +
        `Success: ${successCount}, Failed: ${failureCount}, Total: ${organizations.length}`,
      );

      // Log summary event
      await this.logCronEvent('monthly_quota_reset', {
        yearMonth: currentYearMonth,
        totalOrganizations: organizations.length,
        successCount,
        failureCount,
        durationMs: duration,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Critical error during monthly quota reset: ${err.message}`,
        err.stack,
      );

      // Log failure event
      await this.logCronEvent('monthly_quota_reset_failed', {
        yearMonth: currentYearMonth,
        error: err.message,
      }).catch(() => {
        // If logging fails, just log to console
        this.logger.error('Failed to log cron event to database');
      });

      throw error; // Re-throw to ensure error is visible in monitoring
    }
  }

  /**
   * Clean up old usage data (older than 12 months)
   * Runs on the 2nd of each month at 2 AM (UTC) - after reset job completes
   * Cron: '0 2 2 * *' (minute hour day-of-month month day-of-week)
   */
  @Cron('0 2 2 * *', {
    name: 'cleanupOldUsageData',
    timeZone: 'UTC',
  })
  async cleanupOldUsageData(): Promise<void> {
    const startTime = Date.now();
    const cutoffYearMonth = this.getYearMonthOffset(-12);

    this.logger.log(`Starting cleanup of usage data older than ${cutoffYearMonth}...`);

    try {
      // Delete usage tracking records older than 12 months
      const deleteResult = await this.prisma.usageTracking.deleteMany({
        where: {
          yearMonth: {
            lt: cutoffYearMonth,
          },
        },
      });

      const deletedCount = deleteResult.count;
      const duration = Date.now() - startTime;

      this.logger.log(
        `Cleanup completed in ${duration}ms. Deleted ${deletedCount} usage tracking records older than ${cutoffYearMonth}`,
      );

      // Log cleanup event
      await this.logCronEvent('usage_data_cleanup', {
        cutoffYearMonth,
        deletedCount,
        durationMs: duration,
      });

      // Also clean up old usage events (older than 12 months)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 12);

      const deletedEventsResult = await this.prisma.usageEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(
        `Deleted ${deletedEventsResult.count} usage events older than ${cutoffDate.toISOString()}`,
      );

      await this.logCronEvent('usage_events_cleanup', {
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: deletedEventsResult.count,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Critical error during usage data cleanup: ${err.message}`,
        err.stack,
      );

      // Log failure event
      await this.logCronEvent('usage_data_cleanup_failed', {
        cutoffYearMonth,
        error: err.message,
      }).catch(() => {
        this.logger.error('Failed to log cron event to database');
      });

      throw error;
    }
  }

  /**
   * Get current year-month in 'YYYY-MM' format
   * @returns Current year-month string
   */
  getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get year-month offset by specified number of months
   * @param months Number of months to offset (negative for past, positive for future)
   * @returns Year-month string in 'YYYY-MM' format
   *
   * @example
   * // If current date is 2024-06-15
   * getYearMonthOffset(-1)  // Returns '2024-05'
   * getYearMonthOffset(-12) // Returns '2023-06'
   * getYearMonthOffset(1)   // Returns '2024-07'
   */
  getYearMonthOffset(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Log a cron job event for monitoring and audit purposes
   * Uses fire-and-forget pattern to avoid blocking cron execution
   *
   * @param eventType Type of cron event
   * @param metadata Additional metadata about the event
   */
  private async logCronEvent(
    eventType: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.usageEvent.create({
        data: {
          organizationId: null, // System-level event
          userId: null,
          eventType: `cron_${eventType}`,
          resourceId: null,
          metadata,
        },
      });
    } catch (error) {
      // Don't throw - logging failure shouldn't break cron job
      const err = error as Error;
      this.logger.warn(`Failed to log cron event ${eventType}: ${err.message}`);
    }
  }

  /**
   * Manual trigger for monthly quota reset (for testing or manual execution)
   * This can be called via an admin API endpoint if needed
   */
  async manualResetMonthlyQuotas(): Promise<{ success: boolean; message: string }> {
    this.logger.warn('Manual monthly quota reset triggered');

    try {
      await this.resetMonthlyQuotas();
      return {
        success: true,
        message: 'Monthly quota reset completed successfully',
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Monthly quota reset failed: ${err.message}`,
      };
    }
  }

  /**
   * Manual trigger for usage data cleanup (for testing or manual execution)
   * This can be called via an admin API endpoint if needed
   */
  async manualCleanupOldUsageData(): Promise<{ success: boolean; message: string }> {
    this.logger.warn('Manual usage data cleanup triggered');

    try {
      await this.cleanupOldUsageData();
      return {
        success: true,
        message: 'Usage data cleanup completed successfully',
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Usage data cleanup failed: ${err.message}`,
      };
    }
  }
}
