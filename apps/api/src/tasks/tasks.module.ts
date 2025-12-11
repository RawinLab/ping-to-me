import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpireLinksTask } from './expire-links.task';
import { AggregateAnalyticsTask } from './aggregate-analytics.task';
import { SendScheduledReportsTask } from './send-scheduled-reports.task';
import { TasksController } from './tasks.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), AnalyticsModule, MailModule, NotificationsModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    ExpireLinksTask,
    AggregateAnalyticsTask,
    SendScheduledReportsTask,
  ],
  exports: [ExpireLinksTask, AggregateAnalyticsTask, SendScheduledReportsTask],
})
export class TasksModule {}
