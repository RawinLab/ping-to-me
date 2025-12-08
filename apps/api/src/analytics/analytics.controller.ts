import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  Res,
  Headers,
  ForbiddenException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "../auth/auth.guard";
import { TrackClickDto } from "./dto/track-click.dto";
import { PermissionGuard, Permission } from "../auth/rbac";
import { ExportFiltersDto } from "./dto/export-filters.dto";
import { AnalyticsPdfService } from "./pdf/analytics-pdf.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsPdfService: AnalyticsPdfService,
    private readonly configService: ConfigService,
  ) {}

  @Post("track")
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async track(
    @Body() body: TrackClickDto,
    @Headers("x-api-key") apiKey: string,
  ) {
    // Secure endpoint called by Redirector
    const validApiKey = this.configService.get<string>("ANALYTICS_API_KEY");

    if (!validApiKey || apiKey !== validApiKey) {
      throw new ForbiddenException("Invalid API key");
    }

    return this.analyticsService.trackClick(body);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get("dashboard")
  @Permission({ resource: "analytics", action: "read" })
  async getDashboardMetrics(@Request() req, @Query("days") days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDashboardMetrics(req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get("qr-summary")
  @Permission({ resource: "analytics", action: "read" })
  async getQrSummary(@Request() req) {
    return this.analyticsService.getQrSummary(req.user.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get("export")
  @Permission({ resource: "analytics", action: "export" })
  async exportDashboard(
    @Request() req,
    @Query() filters: ExportFiltersDto,
    @Res() res: Response,
  ) {
    const result = await this.analyticsService.exportDashboard(
      req.user.id,
      filters,
    );

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get("export/pdf")
  @Permission({ resource: "analytics", action: "export" })
  async exportDashboardPdf(
    @Request() req,
    @Query("days") days?: string,
    @Res() res?: Response,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const pdfBuffer = await this.analyticsPdfService.generateDashboardReport(
      req.user.id,
      daysNum,
    );

    const filename = `dashboard-analytics-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  }
}

@Controller("links")
export class LinkAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsPdfService: AnalyticsPdfService,
  ) {}

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics")
  @Permission({ resource: "analytics", action: "read" })
  async getAnalytics(
    @Request() req,
    @Param("id") id: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getLinkAnalytics(id, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/qr")
  @Permission({ resource: "analytics", action: "read" })
  async getQrAnalytics(@Request() req, @Param("id") id: string) {
    return this.analyticsService.getQrAnalytics(id, req.user.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/visitors")
  @Permission({ resource: "analytics", action: "read" })
  async getUniqueVisitors(
    @Request() req,
    @Param("id") id: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getUniqueVisitors(id, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/export")
  @Permission({ resource: "analytics", action: "export" })
  async exportLinkAnalytics(
    @Request() req,
    @Param("id") id: string,
    @Query() filters: ExportFiltersDto,
    @Res() res: Response,
  ) {
    const result = await this.analyticsService.exportLinkAnalytics(
      id,
      req.user.id,
      filters,
    );

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/hourly")
  @Permission({ resource: "analytics", action: "read" })
  async getHourlyHeatmap(
    @Request() req,
    @Param("id") id: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getHourlyHeatmap(id, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/daily-breakdown")
  @Permission({ resource: "analytics", action: "read" })
  async getDayOfWeekStats(
    @Request() req,
    @Param("id") id: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDayOfWeekStats(id, req.user.id, daysNum);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get(":id/analytics/export/pdf")
  @Permission({ resource: "analytics", action: "export" })
  async exportLinkAnalyticsPdf(
    @Request() req,
    @Param("id") id: string,
    @Query("days") days?: string,
    @Res() res?: Response,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const pdfBuffer = await this.analyticsPdfService.generateLinkReport(
      id,
      req.user.id,
      daysNum,
    );

    const filename = `link-analytics-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  }
}
