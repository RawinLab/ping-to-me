import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Session } from '@pingtome/database';
import { SessionInfoDto } from './dto/session.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new session on login
   */
  async createSession(
    userId: string,
    refreshToken: string,
    request: any,
  ): Promise<Session> {
    // Extract IP address from request
    const ipAddress = this.extractIpAddress(request);

    // Parse user agent
    const userAgent = request.headers?.['user-agent'] || '';
    const deviceInfo = this.parseUserAgent(userAgent);

    // Hash refresh token for secure storage
    const tokenHash = this.hashToken(refreshToken);

    // Generate session token
    const sessionToken = this.generateSessionToken();

    // Calculate expiration (7 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Create session record
    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires,
        tokenHash,
        deviceInfo,
        ipAddress,
        // Location will be resolved later via geo-IP service
        location: null,
        lastActive: new Date(),
      },
    });

    this.logger.log(`Session created for user ${userId}: ${session.id}`);

    return session;
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActive: new Date() },
    });
  }

  /**
   * Invalidate a specific session (logout)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    this.logger.log(`Session invalidated: ${sessionId}`);
  }

  /**
   * Invalidate all sessions except current (logout all other devices)
   */
  async invalidateAllSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const deleteQuery = exceptSessionId
      ? {
          userId,
          id: { not: exceptSessionId },
        }
      : { userId };

    const result = await this.prisma.session.deleteMany({
      where: deleteQuery,
    });

    this.logger.log(
      `Invalidated ${result.count} sessions for user ${userId}`,
    );

    return result.count;
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(
    userId: string,
    currentSessionToken?: string,
  ): Promise<SessionInfoDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() }, // Only non-expired sessions
      },
      orderBy: { lastActive: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo || 'Unknown Device',
      ipAddress: session.ipAddress ? this.maskIpAddress(session.ipAddress) : 'Unknown',
      location: session.location || 'Unknown Location',
      lastActive: session.lastActive,
      isCurrent: session.sessionToken === currentSessionToken,
      createdAt: session.createdAt,
    }));
  }

  /**
   * Check if session is valid and not expired
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return false;
    }

    // Check if expired
    if (session.expires < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Find session by session token
   */
  async findSessionByToken(sessionToken: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { sessionToken },
    });
  }

  /**
   * Find session by token hash (for refresh token validation)
   */
  async findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: { tokenHash },
    });
  }

  /**
   * Check session timeout based on last activity
   * @param sessionId Session ID
   * @param timeoutMinutes Timeout duration in minutes
   * @returns true if session has timed out, false otherwise
   */
  async checkSessionTimeout(
    sessionId: string,
    timeoutMinutes: number,
  ): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return true; // Session not found = timed out
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const timeSinceActive = Date.now() - session.lastActive.getTime();

    return timeSinceActive > timeoutMs;
  }

  /**
   * Clean up expired sessions (cron job - runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    }
  }

  /**
   * Extract IP address from request (checks X-Forwarded-For header)
   */
  private extractIpAddress(request: any): string {
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * Parse user agent to extract device info
   */
  private parseUserAgent(userAgent: string): string {
    if (!userAgent) {
      return 'Unknown Device';
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown Browser';
    const os = result.os.name || 'Unknown OS';

    return `${browser} on ${os}`;
  }

  /**
   * Mask IP address for privacy
   * Examples:
   * - IPv4: 192.168.1.100 -> 192.168.1.***
   * - IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3:****:****:****:****:****
   */
  private maskIpAddress(ip: string): string {
    // Check if IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:****:****:****:****:****`;
      }
      return ip;
    }

    // IPv4
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }

    return ip;
  }

  /**
   * Hash token using SHA256
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a unique session token
   */
  private generateSessionToken(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex');
  }

  /**
   * Create a new session with token family (for token rotation)
   */
  async createSessionWithFamily(
    userId: string,
    refreshToken: string,
    request: any,
    tokenFamily: string,
  ): Promise<Session> {
    // Extract IP address from request
    const ipAddress = this.extractIpAddress(request);

    // Parse user agent
    const userAgent = request.headers?.['user-agent'] || '';
    const deviceInfo = this.parseUserAgent(userAgent);

    // Hash refresh token for secure storage
    const tokenHash = this.hashToken(refreshToken);

    // Generate session token
    const sessionToken = this.generateSessionToken();

    // Calculate expiration (7 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Create session record with token family
    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires,
        tokenHash,
        deviceInfo,
        ipAddress,
        location: null,
        lastActive: new Date(),
        tokenFamily, // NEW: Token family for rotation tracking
        isRevoked: false, // NEW: Not revoked initially
      },
    });

    this.logger.log(
      `Session created for user ${userId}: ${session.id} (family: ${tokenFamily})`
    );

    return session;
  }

  /**
   * Revoke a session (mark as used for token rotation)
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Session revoked: ${sessionId}`);
  }

  /**
   * Invalidate all sessions in a token family (for token reuse detection)
   */
  async invalidateTokenFamily(tokenFamily: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { tokenFamily },
    });

    this.logger.warn(
      `Invalidated ${result.count} sessions in token family ${tokenFamily} due to token reuse detection`
    );

    return result.count;
  }

  /**
   * Count active sessions in a token family
   */
  async countSessionsInFamily(tokenFamily: string): Promise<number> {
    return this.prisma.session.count({
      where: {
        tokenFamily,
        expires: { gt: new Date() },
      },
    });
  }

  /**
   * Find all sessions in a token family (for debugging/admin)
   */
  async findSessionsByFamily(tokenFamily: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { tokenFamily },
      orderBy: { createdAt: 'desc' },
    });
  }
}
