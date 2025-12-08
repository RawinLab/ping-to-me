import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  AnalyticsController,
  LinkAnalyticsController,
} from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [AnalyticsController, LinkAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
