import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Request } from "express";
import { parseUserAgent, formatUserAgent } from "./utils/user-agent-parser";

export interface AccountLockStatus {
  locked: boolean;
  remainingMinutes?: number;
  lockedUntil?: Date;
}

export interface LoginAttemptWithParsedInfo {
  id: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  reason?: string;
  createdAt: Date;
  deviceInfo?: string; // Parsed: "Chrome on macOS"
  device?: string; // 'desktop' | 'mobile' | 'tablet'
  browser?: string;
  os?: string;
}

@Injectable()
export class LoginSecurityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Extract IP address from request, considering proxy headers
   */
  private extractIpAddress(request: Request): string | undefined {
    const xForwardedFor = request.headers["x-forwarded-for"];
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(",")[0];
      return ips.trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }

  /**
   * Extract user agent from request headers
   */
  private extractUserAgent(request: Request): string | undefined {
    return request.headers["user-agent"];
  }

  /**
   * Log a login attempt (both successful and failed)
   */
  async logLoginAttempt(
    email: string,
    success: boolean,
    request: Request,
    reason?: string,
  ): Promise<void> {
    const ipAddress = this.extractIpAddress(request);
    const userAgent = this.extractUserAgent(request);

    await this.prisma.loginAttempt.create({
      data: {
        email,
        success,
        ipAddress,
        userAgent,
        reason,
        // location could be added with a geo-IP service in the future
      },
    });
  }

  /**
   * Get count of failed login attempts for an email in the last N minutes
   */
  async getFailedAttemptCount(
    email: string,
    minutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: {
          gte: since,
        },
      },
    });

    return count;
  }

  /**
   * Get organization settings for a user by email
   * Returns default settings if user has no organization or no settings configured
   */
  private async getOrganizationSettings(email: string): Promise<{
    maxLoginAttempts: number;
    lockoutDuration: number;
  }> {
    // Find user and their organization
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          take: 1,
          include: {
            organization: {
              include: {
                settings: true,
              },
            },
          },
        },
      },
    });

    // Use organization settings if available, otherwise use defaults
    const orgSettings = user?.memberships[0]?.organization?.settings;

    return {
      maxLoginAttempts: orgSettings?.maxLoginAttempts ?? 5,
      lockoutDuration: orgSettings?.lockoutDuration ?? 30,
    };
  }

  /**
   * Check if an account is locked due to too many failed login attempts
   * Returns lock status with remaining time if locked
   */
  async checkAccountLocked(email: string): Promise<AccountLockStatus> {
    const settings = await this.getOrganizationSettings(email);
    const { maxLoginAttempts, lockoutDuration } = settings;

    // Get failed attempts in the lockout window
    const failedCount = await this.getFailedAttemptCount(
      email,
      lockoutDuration,
    );

    if (failedCount >= maxLoginAttempts) {
      // Account is locked - find when the lockout will expire
      const oldestRelevantAttempt = new Date(
        Date.now() - lockoutDuration * 60 * 1000,
      );

      // Get the oldest failed attempt in the lockout window
      const oldestAttempt = await this.prisma.loginAttempt.findFirst({
        where: {
          email,
          success: false,
          createdAt: {
            gte: oldestRelevantAttempt,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (oldestAttempt) {
        // Lockout expires when the oldest attempt becomes older than lockoutDuration
        const lockedUntil = new Date(
          oldestAttempt.createdAt.getTime() + lockoutDuration * 60 * 1000,
        );
        const now = new Date();
        const remainingMs = lockedUntil.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        return {
          locked: true,
          remainingMinutes: Math.max(remainingMinutes, 0),
          lockedUntil,
        };
      }
    }

    return { locked: false };
  }

  /**
   * Get login activity for a user (paginated)
   * Supports optional filtering by success status
   */
  async getLoginActivity(
    email: string,
    page: number = 1,
    limit: number = 20,
    success?: boolean,
  ) {
    const skip = (page - 1) * limit;

    // Build where clause with optional success filter
    const where: { email: string; success?: boolean } = { email };
    if (success !== undefined) {
      where.success = success;
    }

    const [attempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      this.prisma.loginAttempt.count({
        where,
      }),
    ]);

    // Parse user agent for each attempt
    const attemptsWithParsedInfo: LoginAttemptWithParsedInfo[] = attempts.map(
      (attempt) => {
        const parsed = parseUserAgent(attempt.userAgent ?? undefined);
        return {
          ...attempt,
          deviceInfo: formatUserAgent(parsed),
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
        };
      },
    );

    return {
      attempts: attemptsWithParsedInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get failed login attempts for a user (paginated)
   */
  async getFailedLoginActivity(
    email: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where: {
          email,
          success: false,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      this.prisma.loginAttempt.count({
        where: {
          email,
          success: false,
        },
      }),
    ]);

    // Parse user agent for each attempt
    const attemptsWithParsedInfo: LoginAttemptWithParsedInfo[] = attempts.map(
      (attempt) => {
        const parsed = parseUserAgent(attempt.userAgent ?? undefined);
        return {
          ...attempt,
          deviceInfo: formatUserAgent(parsed),
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
        };
      },
    );

    return {
      attempts: attemptsWithParsedInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
