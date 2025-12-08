import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  AnalyticsController,
  LinkAnalyticsController,
} from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AuthModule } from "../auth/auth.module";
import { AnalyticsCacheModule } from "./cache/analytics-cache.module";
import { AnalyticsPdfModule } from "./pdf/analytics-pdf.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { ScheduledReportsController } from "./reports/scheduled-reports.controller";
import { ScheduledReportsService } from "./reports/scheduled-reports.service";

@Module({
  imports: [AuthModule, ConfigModule, AnalyticsCacheModule, AnalyticsPdfModule, RealtimeModule],
  controllers: [
    AnalyticsController,
    LinkAnalyticsController,
    ScheduledReportsController,
  ],
  providers: [AnalyticsService, ScheduledReportsService],
  exports: [AnalyticsService, ScheduledReportsService],
})
export class AnalyticsModule {}
