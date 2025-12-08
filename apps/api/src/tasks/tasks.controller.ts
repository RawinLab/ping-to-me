import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AggregateAnalyticsTask } from './aggregate-analytics.task';

/**
 * Internal tasks controller for manual task execution
 * Only accessible by admin users for testing/troubleshooting
 */
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly aggregateAnalyticsTask: AggregateAnalyticsTask,
  ) {}

  /**
   * Manually trigger analytics aggregation for yesterday
   * POST /tasks/aggregate-analytics/yesterday
   */
  @Post('aggregate-analytics/yesterday')
  @Roles('ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  async aggregateYesterday() {
    await this.aggregateAnalyticsTask.aggregateYesterday();
    return {
      success: true,
      message: 'Analytics aggregation for yesterday completed',
    };
  }

  /**
   * Manually aggregate analytics for a specific link and date
   * POST /tasks/aggregate-analytics/link
   * Body: { linkId: string, date: string }
   */
  @Post('aggregate-analytics/link')
  @Roles('ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  async aggregateLinkDay(
    @Body() body: { linkId: string; date: string },
  ) {
    const { linkId, date } = body;

    if (!linkId || !date) {
      throw new BadRequestException('linkId and date are required');
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    await this.aggregateAnalyticsTask.aggregateLinkDay(linkId, targetDate);

    return {
      success: true,
      message: `Analytics aggregated for link ${linkId} on ${date}`,
    };
  }

  /**
   * Backfill analytics for a date range
   * POST /tasks/aggregate-analytics/backfill
   * Body: { startDate: string, endDate: string }
   */
  @Post('aggregate-analytics/backfill')
  @Roles('ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  async backfillDateRange(
    @Body() body: { startDate: string; endDate: string },
  ) {
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Limit backfill to 90 days at a time to prevent overload
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 90) {
      throw new BadRequestException(
        'Date range too large. Maximum 90 days allowed',
      );
    }

    await this.aggregateAnalyticsTask.backfillDateRange(start, end);

    return {
      success: true,
      message: `Analytics backfilled from ${startDate} to ${endDate} (${daysDiff} days)`,
    };
  }
}
