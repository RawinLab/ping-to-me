import { Module } from '@nestjs/common';
import { AnalyticsController, LinkAnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController, LinkAnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule { }
