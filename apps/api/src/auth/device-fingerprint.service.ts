import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Request } from "express";
import { parseUserAgent } from "./utils/user-agent-parser";
import * as crypto from "crypto";

export interface DeviceInfo {
  fingerprint: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  factors: {
    newDevice: boolean;
    newLocation: boolean;
    newIpRange: boolean;
    recentFailedAttempts: boolean;
    unusualTime: boolean;
  };
  requiresAdditionalAuth: boolean;
  requiresEmailVerification: boolean;
  requires2FA: boolean;
}

export interface LoginContext {
  userId: string;
  email: string;
  fingerprint: string;
  request: Request;
  has2FAEnabled: boolean;
}

@Injectable()
export class DeviceFingerprintService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hash fingerprint for secure storage
   */
  private hashFingerprint(fingerprint: string): string {
    return crypto.createHash("sha256").update(fingerprint).digest("hex");
  }

  /**
   * Extract device info from request
   */
  extractDeviceInfo(fingerprint: string, request: Request): DeviceInfo {
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers["user-agent"];
    const parsed = parseUserAgent(userAgent);

    return {
      fingerprint: this.hashFingerprint(fingerprint),
      browser: parsed.browser,
      os: parsed.os,
      deviceType: parsed.device,
      ipAddress,
      userAgent,
    };
  }

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
   * Generate a human-readable device name
   */
  private generateDeviceName(deviceInfo: DeviceInfo): string {
    const parts: string[] = [];

    if (deviceInfo.browser) {
      parts.push(deviceInfo.browser);
    }

    if (deviceInfo.os) {
      parts.push(`on ${deviceInfo.os}`);
    }

    if (deviceInfo.deviceType) {
      parts.push(`(${deviceInfo.deviceType})`);
    }

    return parts.length > 0 ? parts.join(" ") : "Unknown Device";
  }

  /**
   * Check if device is trusted
   */
  async verifyDevice(
    userId: string,
    fingerprint: string
  ): Promise<{ trusted: boolean; device?: any }> {
    const hashedFingerprint = this.hashFingerprint(fingerprint);

    const device = await this.prisma.trustedDevice.findUnique({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint: hashedFingerprint,
        },
      },
    });

    if (!device || !device.isActive) {
      return { trusted: false };
    }

    // Update last seen
    await this.prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return { trusted: true, device };
  }

  /**
   * Trust a new device
   */
  async trustDevice(
    userId: string,
    deviceInfo: DeviceInfo
  ): Promise<any> {
    const name = this.generateDeviceName(deviceInfo);

    const device = await this.prisma.trustedDevice.upsert({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint: deviceInfo.fingerprint,
        },
      },
      update: {
        lastSeenAt: new Date(),
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        isActive: true,
      },
      create: {
        userId,
        fingerprint: deviceInfo.fingerprint,
        name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        trustScore: 100,
      },
    });

    return device;
  }

  /**
   * Check if IP is from the same range (same /24 subnet)
   */
  private isSameIpRange(ip1?: string, ip2?: string): boolean {
    if (!ip1 || !ip2) return false;

    // Extract first 3 octets (e.g., 192.168.1.x)
    const getSubnet = (ip: string) => {
      const parts = ip.split(".");
      if (parts.length !== 4) return null;
      return parts.slice(0, 3).join(".");
    };

    const subnet1 = getSubnet(ip1);
    const subnet2 = getSubnet(ip2);

    return subnet1 === subnet2 && subnet1 !== null;
  }

  /**
   * Check if current time is unusual (between 2 AM - 6 AM local time)
   */
  private isUnusualTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
  }

  /**
   * Calculate risk score based on login context
   */
  async calculateRiskScore(context: LoginContext): Promise<RiskAssessment> {
    const { userId, email, fingerprint, request, has2FAEnabled } = context;
    const deviceInfo = this.extractDeviceInfo(fingerprint, request);

    let riskScore = 0;
    const factors = {
      newDevice: false,
      newLocation: false,
      newIpRange: false,
      recentFailedAttempts: false,
      unusualTime: false,
    };

    // Check if device is trusted (new device = +30 risk)
    const { trusted, device } = await this.verifyDevice(userId, fingerprint);
    if (!trusted) {
      riskScore += 30;
      factors.newDevice = true;
    }

    // Check if location changed (new location = +20 risk)
    // For now, we'll use a simple heuristic based on IP address
    if (device && deviceInfo.ipAddress !== device.ipAddress) {
      riskScore += 20;
      factors.newLocation = true;
    }

    // Check if IP range changed (new IP range = +15 risk)
    if (
      device &&
      !this.isSameIpRange(deviceInfo.ipAddress, device.ipAddress)
    ) {
      riskScore += 15;
      factors.newIpRange = true;
    }

    // Check for recent failed login attempts (recent failures = +25 risk)
    const failedAttempts = await this.getRecentFailedAttempts(email, 30); // Last 30 minutes
    if (failedAttempts >= 2) {
      riskScore += 25;
      factors.recentFailedAttempts = true;
    }

    // Check if login at unusual time (unusual time = +10 risk)
    if (this.isUnusualTime()) {
      riskScore += 10;
      factors.unusualTime = true;
    }

    // Determine authentication requirements based on risk score
    let requiresAdditionalAuth = false;
    let requiresEmailVerification = false;
    let requires2FA = false;

    if (riskScore >= 61) {
      // High risk: Always require email verification + 2FA (if enabled)
      requiresAdditionalAuth = true;
      requiresEmailVerification = true;
      requires2FA = has2FAEnabled;
    } else if (riskScore >= 31) {
      // Medium risk: Require 2FA if enabled, or email verification
      requiresAdditionalAuth = true;
      if (has2FAEnabled) {
        requires2FA = true;
      } else {
        requiresEmailVerification = true;
      }
    }
    // Low risk (0-30): Allow login normally

    return {
      riskScore,
      factors,
      requiresAdditionalAuth,
      requiresEmailVerification,
      requires2FA,
    };
  }

  /**
   * Get recent failed login attempts count
   */
  private async getRecentFailedAttempts(
    email: string,
    minutes: number
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
   * Determine if additional authentication is required
   */
  requireAdditionalAuth(riskScore: number): boolean {
    return riskScore > 30; // Medium or high risk
  }

  /**
   * Get all trusted devices for a user
   */
  async getTrustedDevices(userId: string) {
    return this.prisma.trustedDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastSeenAt: "desc",
      },
      select: {
        id: true,
        name: true,
        browser: true,
        os: true,
        deviceType: true,
        ipAddress: true,
        location: true,
        trustScore: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Remove a trusted device
   */
  async removeTrustedDevice(userId: string, deviceId: string) {
    // Verify the device belongs to the user
    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        id: deviceId,
        userId,
      },
    });

    if (!device) {
      throw new UnauthorizedException("Device not found or access denied");
    }

    // Soft delete by marking as inactive
    await this.prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { isActive: false },
    });

    return { message: "Device removed successfully" };
  }

  /**
   * Revoke all trusted devices except current
   */
  async revokeAllDevices(userId: string, exceptFingerprint?: string) {
    const where: any = {
      userId,
      isActive: true,
    };

    // Optionally keep current device
    if (exceptFingerprint) {
      const hashedFingerprint = this.hashFingerprint(exceptFingerprint);
      where.NOT = {
        fingerprint: hashedFingerprint,
      };
    }

    const result = await this.prisma.trustedDevice.updateMany({
      where,
      data: { isActive: false },
    });

    return {
      message: `${result.count} device(s) revoked successfully`,
      count: result.count,
    };
  }

  /**
   * Update device name
   */
  async updateDeviceName(userId: string, deviceId: string, name: string) {
    // Verify the device belongs to the user
    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        id: deviceId,
        userId,
      },
    });

    if (!device) {
      throw new UnauthorizedException("Device not found or access denied");
    }

    await this.prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { name },
    });

    return { message: "Device name updated successfully" };
  }

  /**
   * Get device by fingerprint (for identifying current device)
   */
  async getDeviceByFingerprint(userId: string, fingerprint: string) {
    const hashedFingerprint = this.hashFingerprint(fingerprint);

    return this.prisma.trustedDevice.findUnique({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint: hashedFingerprint,
        },
      },
      select: {
        id: true,
        name: true,
        browser: true,
        os: true,
        deviceType: true,
        ipAddress: true,
        location: true,
        trustScore: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }
}
