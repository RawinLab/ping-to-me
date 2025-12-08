import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  AnalyticsController,
  LinkAnalyticsController,
} from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AuthModule } from "../auth/auth.module";
import { AnalyticsCacheModule } from "./cache/analytics-cache.module";

@Module({
  imports: [AuthModule, ConfigModule, AnalyticsCacheModule],
  controllers: [AnalyticsController, LinkAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
