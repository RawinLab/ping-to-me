import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs - List audit logs with enhanced filters
   */
  @Get('logs')
  @Permission({ resource: 'audit', action: 'read' })
  async getLogs(
    @Request() req,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('orgId') orgId?: string,
  ) {
    // Use provided orgId or from request context
    const organizationId = orgId || req.user?.organizationId;

    return this.auditService.getLogs({
      organizationId,
      action,
      resource,
      status,
      userId,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  /**
   * GET /audit/logs/:id - Get single audit log detail
   */
  @Get('logs/:id')
  @Permission({ resource: 'audit', action: 'read' })
  async getLogById(@Param('id') id: string) {
    const log = await this.auditService.getLogById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }

  /**
   * GET /audit/my-activity - Get current user's activity
   */
  @Get('my-activity')
  async getMyActivity(
    @Request() req,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getLogs({
      userId: req.user.id,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  /**
   * GET /audit/summary - Get activity summary statistics
   */
  @Get('summary')
  @Permission({ resource: 'audit', action: 'read' })
  async getSummary(
    @Request() req,
    @Query('orgId') orgId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const organizationId = orgId || req.user?.organizationId;

    const filters = {
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Get all logs for the period to compute summary
    const { logs, total } = await this.auditService.getLogs({
      ...filters,
      limit: 10000, // Get more logs for summary
    });

    // Compute summary statistics
    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const userActivity: Record<string, number> = {};
    const statusCounts: Record<string, number> = { success: 0, failure: 0 };

    for (const log of logs) {
      // Count by action
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

      // Count by resource
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;

      // Count by user
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      }

      // Count by status
      const logStatus = (log.status as string) || 'success';
      statusCounts[logStatus] = (statusCounts[logStatus] || 0) + 1;
    }

    // Sort user activity and get top 10
    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      total,
      byAction: actionCounts,
      byResource: resourceCounts,
      byStatus: statusCounts,
      topUsers,
    };
  }

  /**
   * POST /audit/logs/export - Export audit logs as CSV or JSON
   */
  @Post('logs/export')
  @Permission({ resource: 'audit', action: 'read' })
  async exportLogs(
    @Request() req,
    @Response() res: ExpressResponse,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orgId') orgId?: string,
  ) {
    const organizationId = orgId || req.user?.organizationId;

    if (!['csv', 'json'].includes(format)) {
      throw new BadRequestException('Format must be csv or json');
    }

    // Get logs with filters (large limit for export)
    const { logs } = await this.auditService.getLogs({
      organizationId,
      action,
      resource,
      status,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 100000, // Large limit for export
    });

    if (format === 'json') {
      const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(logs, null, 2));
    }

    // CSV export
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // CSV header
    const headers = [
      'Timestamp',
      'User ID',
      'Organization ID',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'User Agent',
      'Details',
      'Changes',
    ];

    const csvRows = [headers.join(',')];

    // CSV rows
    for (const log of logs) {
      const row = [
        log.createdAt.toISOString(),
        log.userId || '',
        log.organizationId || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.status || 'success',
        log.ipAddress || '',
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.changes || {}).replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    }

    return res.send(csvRows.join('\n'));
  }
}
