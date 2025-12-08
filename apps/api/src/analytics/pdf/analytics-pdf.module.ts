import { Module } from '@nestjs/common';
import { AnalyticsPdfService } from './analytics-pdf.service';
import { AnalyticsService } from '../analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsPdfService, AnalyticsService],
  exports: [AnalyticsPdfService],
})
export class AnalyticsPdfModule {}
