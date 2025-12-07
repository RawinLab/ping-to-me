import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { TrackClickDto } from './dto/track-click.dto';
import { PermissionGuard, Permission } from '../auth/rbac';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Post('track')
  async track(@Body() body: TrackClickDto) {
    // Public endpoint called by Redirector
    // In real app, secure with a shared secret or API key
    return this.analyticsService.trackClick(body);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get('dashboard')
  @Permission({ resource: 'analytics', action: 'read' })
  async getDashboardMetrics(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDashboardMetrics(req.user.id, daysNum);
  }
}

@Controller('links')
export class LinkAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(':id/analytics')
  @Permission({ resource: 'analytics', action: 'read' })
  async getAnalytics(
    @Request() req,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getLinkAnalytics(id, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(':id/analytics/qr')
  @Permission({ resource: 'analytics', action: 'read' })
  async getQrAnalytics(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.analyticsService.getQrAnalytics(id, req.user.id);
  }
}
