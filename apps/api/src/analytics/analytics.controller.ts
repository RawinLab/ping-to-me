import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Post('track')
  async track(@Body() body: any) {
    // Public endpoint called by Redirector
    // In real app, secure with a shared secret or API key
    return this.analyticsService.trackClick(body);
  }

  @UseGuards(AuthGuard)
  @Get('dashboard')
  async getDashboardMetrics(@Request() req) {
    return this.analyticsService.getDashboardMetrics(req.user.id);
  }
}

@Controller('links')
export class LinkAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @UseGuards(AuthGuard)
  @Get(':id/analytics')
  async getAnalytics(@Request() req, @Param('id') id: string) {
    return this.analyticsService.getLinkAnalytics(id, req.user.id);
  }
}
