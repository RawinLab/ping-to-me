import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MailService } from '../mail/mail.service';
import { ScheduledReportsService } from '../analytics/reports/scheduled-reports.service';

@Injectable()
export class SendScheduledReportsTask {
  private readonly logger = new Logger(SendScheduledReportsTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly mailService: MailService,
    private readonly scheduledReportsService: ScheduledReportsService,
  ) {}

  /**
   * Process and send scheduled reports
   * Runs every hour to check for due reports
   */
  @Cron('0 * * * *') // Every hour at minute 0
  async sendScheduledReports(): Promise<void> {
    this.logger.log('Running scheduled reports cron job...');

    try {
      // Get all due schedules
      const dueSchedules = await this.scheduledReportsService.getDueSchedules();

      if (dueSchedules.length === 0) {
        this.logger.log('No scheduled reports due');
        return;
      }

      this.logger.log(`Found ${dueSchedules.length} scheduled reports to send`);

      // Process each schedule
      for (const schedule of dueSchedules) {
        try {
          await this.processSchedule(schedule);
        } catch (error) {
          this.logger.error(
            `Error processing schedule ${schedule.id}:`,
            error,
          );
          // Continue with next schedule
        }
      }

      this.logger.log('Scheduled reports cron job completed');
    } catch (error) {
      this.logger.error('Error running scheduled reports cron job:', error);
    }
  }

  /**
   * Process a single report schedule
   */
  private async processSchedule(schedule: any): Promise<void> {
    this.logger.log(
      `Processing schedule ${schedule.id} for user ${schedule.user.email}`,
    );

    try {
      let reportData: any;

      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Generate report based on linkId (if null = dashboard report)
      if (schedule.linkId) {
        // Link-specific report
        reportData = await this.analyticsService.exportLinkAnalytics(
          schedule.linkId,
          schedule.userId,
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            format: schedule.format,
          },
        );
      } else {
        // Dashboard report (all links)
        reportData = await this.analyticsService.exportDashboard(
          schedule.userId,
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            format: schedule.format,
          },
        );
      }

      // Prepare email recipients
      const recipients = [
        schedule.user.email,
        ...(schedule.recipients || []),
      ];

      // Send report via email
      await this.mailService.sendScheduledReport({
        to: recipients,
        userName: schedule.user.name || schedule.user.email,
        reportType: schedule.linkId
          ? `Link: ${schedule.link?.title || schedule.link?.slug}`
          : 'Dashboard',
        frequency: schedule.frequency,
        format: schedule.format,
        content: reportData.content,
        filename: reportData.filename,
        contentType: reportData.contentType,
      });

      // Mark schedule as sent and calculate next run
      await this.scheduledReportsService.markScheduleAsSent(schedule.id);

      this.logger.log(
        `Successfully sent scheduled report ${schedule.id} to ${recipients.join(', ')}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process schedule ${schedule.id}:`,
        errorMessage,
      );
      throw error;
    }
  }
}
