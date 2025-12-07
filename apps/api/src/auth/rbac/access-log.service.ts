import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Access result enum matching Prisma schema
 */
export enum AccessResult {
  ALLOWED = "ALLOWED",
  DENIED = "DENIED",
}

/**
 * Data for logging an access attempt
 */
export interface AccessLogData {
  userId?: string;
  apiKeyId?: string;
  organizationId?: string;
  resource: string;
  action: string;
  result: AccessResult;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Service for logging RBAC access attempts
 *
 * This service provides non-blocking async logging of permission checks
 * for audit and security monitoring purposes.
 *
 * @example
 * ```typescript
 * // Log a successful access
 * accessLogService.log({
 *   userId: 'user-123',
 *   organizationId: 'org-456',
 *   resource: 'link',
 *   action: 'delete',
 *   result: AccessResult.ALLOWED,
 *   ipAddress: '192.168.1.1',
 *   endpoint: '/api/links/abc',
 *   method: 'DELETE',
 * });
 *
 * // Log a denied access
 * accessLogService.log({
 *   userId: 'user-123',
 *   organizationId: 'org-456',
 *   resource: 'billing',
 *   action: 'manage',
 *   result: AccessResult.DENIED,
 *   reason: 'Insufficient permissions: requires OWNER role',
 * });
 * ```
 */
@Injectable()
export class AccessLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an access attempt asynchronously (non-blocking)
   *
   * This method fires and forgets the log write to avoid impacting
   * request performance. Errors are logged but don't affect the request.
   */
  log(data: AccessLogData): void {
    // Fire and forget - don't await
    this.writeLog(data).catch((error) => {
      // Log error but don't throw - logging should never block requests
      console.error("[AccessLogService] Failed to write access log:", error);
    });
  }

  /**
   * Log an access attempt and wait for completion
   *
   * Use this when you need to ensure the log is written before proceeding.
   */
  async logSync(data: AccessLogData): Promise<void> {
    await this.writeLog(data);
  }

  /**
   * Internal method to write the log to database
   */
  private async writeLog(data: AccessLogData): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          userId: data.userId,
          apiKeyId: data.apiKeyId,
          organizationId: data.organizationId,
          resource: data.resource,
          action: data.action,
          result: data.result,
          reason: data.reason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          endpoint: data.endpoint,
          method: data.method,
        },
      });
    } catch (error) {
      // Re-throw for logSync, will be caught and logged for log()
      throw error;
    }
  }

  /**
   * Query access logs with filters
   *
   * @param filters - Query filters
   * @param options - Pagination options
   */
  async query(
    filters: {
      userId?: string;
      organizationId?: string;
      resource?: string;
      action?: string;
      result?: AccessResult;
      startDate?: Date;
      endDate?: Date;
    },
    options: {
      skip?: number;
      take?: number;
      orderBy?: "asc" | "desc";
    } = {},
  ) {
    const { skip = 0, take = 50, orderBy = "desc" } = options;

    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.result) where.result = filters.result;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: orderBy },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Get access denial statistics for an organization
   */
  async getDenialStats(
    organizationId: string,
    days: number = 7,
  ): Promise<{
    totalDenials: number;
    byResource: Record<string, number>;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const denials = await this.prisma.accessLog.findMany({
      where: {
        organizationId,
        result: "DENIED",
        createdAt: { gte: startDate },
      },
      select: {
        resource: true,
        action: true,
        userId: true,
      },
    });

    const byResource: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const denial of denials) {
      byResource[denial.resource] = (byResource[denial.resource] || 0) + 1;
      byAction[denial.action] = (byAction[denial.action] || 0) + 1;
      if (denial.userId) {
        byUser[denial.userId] = (byUser[denial.userId] || 0) + 1;
      }
    }

    return {
      totalDenials: denials.length,
      byResource,
      byAction,
      byUser,
    };
  }

  /**
   * Clean up old access logs
   *
   * @param retentionDays - Number of days to keep logs
   */
  async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.accessLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
