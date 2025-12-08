import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AggregateAnalyticsTask {
  private readonly logger = new Logger(AggregateAnalyticsTask.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Aggregate yesterday's analytics data into daily summary
   * Runs every day at 2 AM UTC to process previous day's click events
   */
  @Cron('0 2 * * *')
  async aggregateYesterday(): Promise<void> {
    this.logger.log('Running analytics aggregation job...');

    try {
      // Calculate yesterday's date range (UTC)
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setUTCHours(23, 59, 59, 999);

      this.logger.log(
        `Aggregating analytics for ${yesterday.toISOString().split('T')[0]}`,
      );

      // Get all links that have clicks yesterday
      const linksWithClicks = await this.prisma.clickEvent.groupBy({
        by: ['linkId'],
        where: {
          timestamp: { gte: yesterday, lte: endOfYesterday },
        },
        _count: true,
      });

      if (linksWithClicks.length === 0) {
        this.logger.log('No clicks to aggregate for yesterday');
        return;
      }

      this.logger.log(
        `Found ${linksWithClicks.length} links with clicks to aggregate`,
      );

      let aggregated = 0;

      // Process each link
      for (const linkGroup of linksWithClicks) {
        await this.aggregateLinkDay(linkGroup.linkId, yesterday);
        aggregated++;
      }

      this.logger.log(
        `Successfully aggregated analytics for ${aggregated} links`,
      );
    } catch (error) {
      this.logger.error('Error running analytics aggregation job:', error);
    }
  }

  /**
   * Aggregate analytics for a specific link and date
   * Can be called manually for backfilling or testing
   */
  async aggregateLinkDay(linkId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get all clicks for this link on this day
    const clicks = await this.prisma.clickEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (clicks.length === 0) {
      this.logger.debug(`No clicks for link ${linkId} on ${date.toISOString().split('T')[0]}`);
      return;
    }

    // Calculate aggregations
    const totalClicks = clicks.length;

    // Count unique visitors (distinct sessionIds)
    const uniqueSessionIds = new Set(
      clicks
        .filter((click) => click.sessionId !== null)
        .map((click) => click.sessionId as string),
    );
    const uniqueVisitors = uniqueSessionIds.size;

    // Aggregate by country
    const countries = this.aggregateField(clicks, 'country');

    // Aggregate by device
    const devices = this.aggregateField(clicks, 'device');

    // Aggregate by browser
    const browsers = this.aggregateField(clicks, 'browser');

    // Aggregate by OS
    const os = this.aggregateField(clicks, 'os');

    // Aggregate by referrer
    const referrers = this.aggregateField(clicks, 'referrer');

    // Upsert into AnalyticsDaily
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    await this.prisma.analyticsDaily.upsert({
      where: {
        linkId_date: {
          linkId,
          date: dateOnly,
        },
      },
      create: {
        linkId,
        date: dateOnly,
        totalClicks,
        uniqueVisitors,
        countries,
        devices,
        browsers,
        os,
        referrers,
      },
      update: {
        totalClicks,
        uniqueVisitors,
        countries,
        devices,
        browsers,
        os,
        referrers,
        updatedAt: new Date(),
      },
    });

    this.logger.debug(
      `Aggregated ${totalClicks} clicks for link ${linkId} on ${dateOnly.toISOString().split('T')[0]}`,
    );
  }

  /**
   * Aggregate a field from click events into a count object
   * @param clicks Array of click events
   * @param field Field name to aggregate (e.g., 'country', 'device')
   * @returns Object with field values as keys and counts as values
   */
  private aggregateField(
    clicks: any[],
    field: string,
  ): Record<string, number> {
    return clicks.reduce((acc, click) => {
      const value = click[field] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Backfill aggregations for a date range
   * Useful for initial setup or fixing missing data
   */
  async backfillDateRange(startDate: Date, endDate: Date): Promise<void> {
    this.logger.log(
      `Backfilling analytics from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    );

    const currentDate = new Date(startDate);
    currentDate.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    let daysProcessed = 0;

    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      // Get all links with clicks on this day
      const linksWithClicks = await this.prisma.clickEvent.groupBy({
        by: ['linkId'],
        where: {
          timestamp: { gte: dayStart, lte: dayEnd },
        },
        _count: true,
      });

      // Aggregate each link
      for (const linkGroup of linksWithClicks) {
        await this.aggregateLinkDay(linkGroup.linkId, currentDate);
      }

      daysProcessed++;
      this.logger.log(
        `Backfilled day ${currentDate.toISOString().split('T')[0]} (${linksWithClicks.length} links)`,
      );

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    this.logger.log(`Backfill complete: processed ${daysProcessed} days`);
  }
}
