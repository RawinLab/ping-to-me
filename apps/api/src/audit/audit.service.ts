import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) { }

  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break main operations
      console.error('Failed to create audit log:', error);
    }
  }

  async getLogs(filters: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // Helper methods for common actions
  async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'User',
      resourceId: userId,
      ipAddress,
      userAgent,
    });
  }

  async logLogout(userId: string) {
    await this.log({
      userId,
      action: 'LOGOUT',
      resource: 'User',
      resourceId: userId,
    });
  }

  async logCreate(userId: string, resource: string, resourceId: string, details?: Record<string, any>) {
    await this.log({
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      details,
    });
  }

  async logUpdate(userId: string, resource: string, resourceId: string, details?: Record<string, any>) {
    await this.log({
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      details,
    });
  }

  async logDelete(userId: string, resource: string, resourceId: string) {
    await this.log({
      userId,
      action: 'DELETE',
      resource,
      resourceId,
    });
  }
}
