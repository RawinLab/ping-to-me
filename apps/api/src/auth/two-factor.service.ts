import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async generateSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    const secret = speakeasy.generateSecret({
      name: `PingToMe (${user.email})`,
      length: 20,
    });

    // Store temporary secret (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async verifyAndEnable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException("2FA not set up");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException("Invalid verification code");
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Generate initial backup codes
    const backupCodes = await this.generateBackupCodes(userId);

    // Audit log: 2FA enabled
    await this.auditService.logSecurityEvent(userId, "auth.2fa_enabled", {
      status: "success",
      details: { email: user.email },
    });

    return { enabled: true, backupCodes };
  }

  async verify(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return true; // 2FA not enabled, allow
    }

    // Check if input looks like a backup code (XXXX-XXXX format with 8-9 chars)
    // Could be "XXXX-XXXX" (9 chars) or "XXXXXXXX" (8 chars without dash)
    const normalizedToken = token.replace(/-/g, "");
    const isBackupCodeFormat =
      normalizedToken.length === 8 && /^[A-F0-9]{8}$/i.test(normalizedToken);

    if (isBackupCodeFormat) {
      // Try backup code verification
      return this.verifyBackupCode(userId, token);
    }

    // Otherwise, verify as TOTP token (6 digits)
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });
  }

  async disable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException("2FA not enabled");
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret || "",
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException("Invalid verification code");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Audit log: 2FA disabled
    await this.auditService.logSecurityEvent(userId, "auth.2fa_disabled", {
      status: "success",
      details: { email: user.email },
    });

    return { disabled: true };
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return {
      enabled: user?.twoFactorEnabled || false,
    };
  }

  /**
   * Generate 8 backup codes for the user
   * Each code is 8 characters (format: XXXX-XXXX)
   * Codes are hashed before storing
   * Returns plain codes (shown only once)
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    // Delete any existing backup codes first
    await this.prisma.backupCode.deleteMany({
      where: { userId },
    });

    const codes: string[] = [];
    const hashedCodes: string[] = [];

    // Generate 8 unique codes
    for (let i = 0; i < 8; i++) {
      // Generate 4 random bytes (8 hex chars)
      const randomBytes = crypto.randomBytes(4);
      const code = randomBytes.toString("hex").toUpperCase();

      // Format as XXXX-XXXX
      const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      codes.push(formattedCode);

      // Hash the code for storage
      const hashedCode = await bcrypt.hash(formattedCode, 10);
      hashedCodes.push(hashedCode);
    }

    // Store hashed codes in database
    await this.prisma.backupCode.createMany({
      data: hashedCodes.map((hashedCode) => ({
        userId,
        code: hashedCode,
      })),
    });

    // Audit log: Backup codes generated
    await this.auditService.logSecurityEvent(userId, "auth.2fa_enabled", {
      status: "success",
      details: { action: "backup_codes_generated", count: codes.length },
    });

    return codes;
  }

  /**
   * Verify a backup code
   * Normalizes input, checks against hashed codes
   * Marks code as used on success
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Normalize code: remove dashes and convert to uppercase
    const normalizedCode = code.replace(/-/g, "").toUpperCase();

    // Re-add dash for consistency (XXXX-XXXX format)
    const formattedCode = `${normalizedCode.substring(0, 4)}-${normalizedCode.substring(4, 8)}`;

    // Get all unused backup codes for the user
    const backupCodes = await this.prisma.backupCode.findMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    // Try to match against each hashed code
    for (const backupCode of backupCodes) {
      const isMatch = await bcrypt.compare(formattedCode, backupCode.code);

      if (isMatch) {
        // Mark code as used
        await this.prisma.backupCode.update({
          where: { id: backupCode.id },
          data: { usedAt: new Date() },
        });

        // Audit log: Backup code used
        await this.auditService.logSecurityEvent(userId, "auth.2fa_enabled", {
          status: "success",
          details: { action: "backup_code_used", codeId: backupCode.id },
        });

        return true;
      }
    }

    // Audit log: Failed backup code verification
    await this.auditService.logSecurityEvent(userId, "auth.2fa_enabled", {
      status: "failure",
      details: { action: "backup_code_verification_failed" },
    });

    return false;
  }

  /**
   * Get count of remaining (unused) backup codes
   */
  async getRemainingBackupCodesCount(userId: string): Promise<number> {
    return this.prisma.backupCode.count({
      where: {
        userId,
        usedAt: null,
      },
    });
  }
}
