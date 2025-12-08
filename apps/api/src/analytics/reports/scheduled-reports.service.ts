import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportScheduleDto, UpdateReportScheduleDto } from './dto';
import { ReportFrequency } from '@prisma/client';

@Injectable()
export class ScheduledReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate the next run date based on frequency and schedule settings
   */
  private calculateNextRunAt(
    frequency: ReportFrequency,
    time: string,
    timezone: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
  ): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    // Create next run date in UTC
    const nextRun = new Date();
    nextRun.setUTCHours(hours, minutes, 0, 0);

    switch (frequency) {
      case ReportFrequency.DAILY:
        // If the scheduled time today has passed, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setUTCDate(nextRun.getUTCDate() + 1);
        }
        break;

      case ReportFrequency.WEEKLY:
        if (dayOfWeek === undefined) {
          throw new BadRequestException(
            'dayOfWeek is required for weekly frequency',
          );
        }
        // Find next occurrence of the specified day
        const currentDay = nextRun.getUTCDay();
        let daysUntilTarget = dayOfWeek - currentDay;

        if (daysUntilTarget < 0) {
          daysUntilTarget += 7;
        } else if (daysUntilTarget === 0 && nextRun <= now) {
          daysUntilTarget = 7;
        }

        nextRun.setUTCDate(nextRun.getUTCDate() + daysUntilTarget);
        break;

      case ReportFrequency.MONTHLY:
        if (dayOfMonth === undefined) {
          throw new BadRequestException(
            'dayOfMonth is required for monthly frequency',
          );
        }
        // Set to the specified day of the current month
        nextRun.setUTCDate(dayOfMonth);

        // If that date has passed this month, move to next month
        if (nextRun <= now) {
          nextRun.setUTCMonth(nextRun.getUTCMonth() + 1);
          nextRun.setUTCDate(dayOfMonth);
        }

        // Handle edge case where dayOfMonth > days in month
        // (e.g., setting day 31 in February will roll over to March)
        if (nextRun.getUTCDate() !== dayOfMonth) {
          // Move to last day of the target month
          nextRun.setUTCDate(0);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Create a new report schedule
   */
  async createSchedule(userId: string, dto: CreateReportScheduleDto) {
    // Verify link ownership if linkId is provided
    if (dto.linkId) {
      const link = await this.prisma.link.findUnique({
        where: { id: dto.linkId },
      });

      if (!link) {
        throw new NotFoundException('Link not found');
      }

      if (link.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Get user's organization (if any)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          take: 1,
          select: { organizationId: true },
        },
      },
    });

    const organizationId = user?.memberships[0]?.organizationId || null;

    // Calculate next run date
    const time = dto.time || '09:00';
    const timezone = dto.timezone || 'UTC';
    const nextRunAt = this.calculateNextRunAt(
      dto.frequency,
      time,
      timezone,
      dto.dayOfWeek,
      dto.dayOfMonth,
    );

    // Create schedule
    const schedule = await this.prisma.reportSchedule.create({
      data: {
        userId,
        organizationId,
        linkId: dto.linkId || null,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        time,
        timezone,
        format: dto.format || 'pdf',
        recipients: dto.recipients || [],
        nextRunAt,
      },
      include: {
        link: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Update an existing report schedule
   */
  async updateSchedule(
    id: string,
    userId: string,
    dto: UpdateReportScheduleDto,
  ) {
    // Verify ownership
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Report schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Recalculate nextRunAt if frequency/time changed
    let nextRunAt = schedule.nextRunAt;
    if (
      dto.frequency ||
      dto.time ||
      dto.dayOfWeek !== undefined ||
      dto.dayOfMonth !== undefined
    ) {
      const frequency = dto.frequency || schedule.frequency;
      const time = dto.time || schedule.time;
      const timezone = dto.timezone || schedule.timezone;
      const dayOfWeek =
        dto.dayOfWeek !== undefined ? dto.dayOfWeek : schedule.dayOfWeek;
      const dayOfMonth =
        dto.dayOfMonth !== undefined ? dto.dayOfMonth : schedule.dayOfMonth;

      nextRunAt = this.calculateNextRunAt(
        frequency,
        time,
        timezone,
        dayOfWeek || undefined,
        dayOfMonth || undefined,
      );
    }

    // Update schedule
    const updated = await this.prisma.reportSchedule.update({
      where: { id },
      data: {
        ...dto,
        nextRunAt,
      },
      include: {
        link: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a report schedule
   */
  async deleteSchedule(id: string, userId: string) {
    // Verify ownership
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Report schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.reportSchedule.delete({
      where: { id },
    });

    return { message: 'Report schedule deleted successfully' };
  }

  /**
   * Get all report schedules for a user
   */
  async getSchedules(userId: string) {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { userId },
      include: {
        link: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return schedules;
  }

  /**
   * Get a single report schedule by ID
   */
  async getSchedule(id: string, userId: string) {
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id },
      include: {
        link: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Report schedule not found');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return schedule;
  }

  /**
   * Get all schedules that are due to run
   * Called by the cron job
   */
  async getDueSchedules(): Promise<any[]> {
    const now = new Date();

    const schedules = await this.prisma.reportSchedule.findMany({
      where: {
        enabled: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        link: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    return schedules;
  }

  /**
   * Mark a schedule as sent and calculate next run time
   */
  async markScheduleAsSent(scheduleId: string) {
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Report schedule not found');
    }

    // Calculate next run time
    const nextRunAt = this.calculateNextRunAt(
      schedule.frequency,
      schedule.time,
      schedule.timezone,
      schedule.dayOfWeek || undefined,
      schedule.dayOfMonth || undefined,
    );

    await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: {
        lastSentAt: new Date(),
        nextRunAt,
      },
    });
  }
}
