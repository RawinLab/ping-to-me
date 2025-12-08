import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditLogData {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status?: "success" | "failure";
  details?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
  requestId?: string;
}

// Context passed from request
export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// Sensitive fields to exclude from change tracking
const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "twoFactorSecret",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "keyHash",
  "apiKey",
];

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Core logging method - creates an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          status: data.status || "success",
          details: data.details,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          geoLocation: data.geoLocation,
          requestId: data.requestId,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break main operations
      console.error("Failed to create audit log:", error);
    }
  }

  /**
   * Capture changes between before and after objects
   * Excludes sensitive fields and only returns changed fields
   */
  captureChanges(
    before: Record<string, any> | null,
    after: Record<string, any> | null,
  ): { before?: Record<string, any>; after?: Record<string, any> } | null {
    if (!before && !after) return null;

    const sanitize = (
      obj: Record<string, any> | null,
    ): Record<string, any> | undefined => {
      if (!obj) return undefined;
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive fields
        if (
          SENSITIVE_FIELDS.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          continue;
        }
        // Skip functions and undefined
        if (typeof value === "function" || value === undefined) {
          continue;
        }
        sanitized[key] = value;
      }
      return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    };

    // For updates, only include changed fields
    if (before && after) {
      const changedBefore: Record<string, any> = {};
      const changedAfter: Record<string, any> = {};

      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

      for (const key of allKeys) {
        if (
          SENSITIVE_FIELDS.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          continue;
        }

        const beforeValue = before[key];
        const afterValue = after[key];

        // Check if values are different (simple comparison)
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          if (beforeValue !== undefined) changedBefore[key] = beforeValue;
          if (afterValue !== undefined) changedAfter[key] = afterValue;
        }
      }

      if (
        Object.keys(changedBefore).length === 0 &&
        Object.keys(changedAfter).length === 0
      ) {
        return null;
      }

      return {
        before:
          Object.keys(changedBefore).length > 0 ? changedBefore : undefined,
        after: Object.keys(changedAfter).length > 0 ? changedAfter : undefined,
      };
    }

    return {
      before: sanitize(before),
      after: sanitize(after),
    };
  }

  // ==================== Link Events ====================

  async logLinkEvent(
    userId: string,
    organizationId: string | null,
    action:
      | "link.created"
      | "link.updated"
      | "link.deleted"
      | "link.archived"
      | "link.restored"
      | "link.bulk_created"
      | "link.bulk_deleted"
      | "link.status_changed"
      | "link.bulk_status_changed",
    link: { id: string; slug?: string; targetUrl?: string },
    options?: {
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      status?: "success" | "failure";
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId: organizationId || undefined,
      action,
      resource: "Link",
      resourceId: link.id,
      status: options?.status,
      details: {
        slug: link.slug,
        targetUrl: link.targetUrl,
        ...options?.details,
      },
      changes: options?.changes,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Domain Events ====================

  async logDomainEvent(
    userId: string,
    organizationId: string,
    action:
      | "domain.added"
      | "domain.verified"
      | "domain.failed"
      | "domain.removed"
      | "domain.reset"
      | "domain.ssl_updated"
      | "domain.default_set"
      | "domain.updated",
    domain: { id: string; hostname: string },
    options?: {
      status?: "success" | "failure";
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: "Domain",
      resourceId: domain.id,
      status: options?.status,
      details: {
        hostname: domain.hostname,
        ...options?.details,
      },
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Team/Member Events ====================

  async logTeamEvent(
    userId: string,
    organizationId: string,
    action:
      | "member.invited"
      | "member.joined"
      | "member.role_changed"
      | "member.removed",
    member: { userId?: string; email?: string; role?: string },
    options?: {
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: "OrganizationMember",
      resourceId: member.userId,
      details: {
        targetEmail: member.email,
        role: member.role,
        ...options?.details,
      },
      changes: options?.changes,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Organization Events ====================

  async logOrgEvent(
    userId: string,
    organizationId: string,
    action:
      | "org.created"
      | "org.updated"
      | "org.settings_changed"
      | "org.settings_updated"
      | "org.security_updated"
      | "org.deleted"
      | "org.logo_uploaded"
      | "org.logo_deleted"
      | "org.ownership_transferred",
    options?: {
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: "Organization",
      resourceId: organizationId,
      details: options?.details,
      changes: options?.changes,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Security/Auth Events ====================

  async logSecurityEvent(
    userId: string | null,
    action:
      | "auth.login"
      | "auth.logout"
      | "auth.failed_login"
      | "auth.2fa_enabled"
      | "auth.2fa_disabled"
      | "auth.password_changed"
      | "auth.password_reset_requested"
      | "auth.email_verified"
      | "session.list_viewed"
      | "session.terminated"
      | "session.all_other_terminated",
    options?: {
      status?: "success" | "failure";
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      action,
      resource: action.startsWith("session.") ? "Session" : "User",
      resourceId: userId || undefined,
      status: options?.status,
      details: options?.details,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== API Key Events ====================

  async logApiKeyEvent(
    userId: string,
    organizationId: string,
    action: "api_key.created" | "api_key.rotated" | "api_key.revoked",
    apiKey: { id: string; name?: string; scopes?: string[] },
    options?: {
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: "ApiKey",
      resourceId: apiKey.id,
      details: {
        keyName: apiKey.name,
        scopes: apiKey.scopes,
        ...options?.details,
      },
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Billing Events ====================

  async logBillingEvent(
    userId: string,
    organizationId: string,
    action:
      | "billing.plan_changed"
      | "billing.subscription_cancelled"
      | "billing.payment_failed"
      | "billing.payment_succeeded",
    options?: {
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action,
      resource: "Subscription",
      details: options?.details,
      changes: options?.changes,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Generic Resource Events ====================

  async logResourceEvent(
    userId: string,
    organizationId: string | null,
    action: string,
    resource: string,
    resourceId: string,
    options?: {
      changes?: { before?: Record<string, any>; after?: Record<string, any> };
      status?: "success" | "failure";
      context?: AuditContext;
      details?: Record<string, any>;
    },
  ): Promise<void> {
    await this.log({
      userId,
      organizationId: organizationId || undefined,
      action,
      resource,
      resourceId,
      status: options?.status,
      details: options?.details,
      changes: options?.changes,
      ipAddress: options?.context?.ipAddress,
      userAgent: options?.context?.userAgent,
      requestId: options?.context?.requestId,
    });
  }

  // ==================== Query Methods ====================

  async getLogs(filters: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.resource) where.resource = filters.resource;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    // Search in details JSON field
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: "insensitive" } },
        { resource: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getLogById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  // ==================== Legacy Helper Methods (for backward compatibility) ====================

  async logLogin(userId: string, ipAddress?: string, userAgent?: string) {
    await this.logSecurityEvent(userId, "auth.login", {
      context: { ipAddress, userAgent },
    });
  }

  async logLogout(userId: string) {
    await this.logSecurityEvent(userId, "auth.logout");
  }

  async logCreate(
    userId: string,
    resource: string,
    resourceId: string,
    details?: Record<string, any>,
  ) {
    await this.log({
      userId,
      action: `${resource.toLowerCase()}.created`,
      resource,
      resourceId,
      details,
    });
  }

  async logUpdate(
    userId: string,
    resource: string,
    resourceId: string,
    details?: Record<string, any>,
  ) {
    await this.log({
      userId,
      action: `${resource.toLowerCase()}.updated`,
      resource,
      resourceId,
      details,
    });
  }

  async logDelete(userId: string, resource: string, resourceId: string) {
    await this.log({
      userId,
      action: `${resource.toLowerCase()}.deleted`,
      resource,
      resourceId,
    });
  }

  // ==================== Retention/Cleanup ====================

  /**
   * Clean up old audit logs based on retention policy
   * @param retentionDays Number of days to keep logs
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `Cleaned up ${result.count} audit logs older than ${retentionDays} days`,
    );
    return result.count;
  }
}
