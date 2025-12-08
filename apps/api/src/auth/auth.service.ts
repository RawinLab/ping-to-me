import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { MailService } from "../mail/mail.service";
import { AuditService } from "../audit/audit.service";
import { LoginSecurityService } from "./login-security.service";
import { SessionService } from "./session.service";
import { TwoFactorService } from "./two-factor.service";
import { randomUUID } from "crypto";
import { Request } from "express";

@Injectable()
export class AuthService {
  // Temporary storage for pending 2FA sessions
  // In production, consider using Redis or a distributed cache
  private pending2FASessions = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private auditService: AuditService,
    private loginSecurityService: LoginSecurityService,
    private sessionService: SessionService,
    private twoFactorService: TwoFactorService,
  ) {
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  private cleanupExpiredSessions() {
    const now = new Date();
    for (const [token, session] of this.pending2FASessions.entries()) {
      if (session.expiresAt < now) {
        this.pending2FASessions.delete(token);
      }
    }
  }

  async register(email: string, password?: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException("User already exists");
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create Default Organization
    await this.prisma.organization.create({
      data: {
        name: `${name || email}'s Workspace`,
        slug: randomUUID(),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Generate Verification Token
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send Email
    await this.mailService.sendVerificationEmail(email, token);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new BadRequestException("Invalid or expired token");
    }

    const updatedUser = await this.prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await this.prisma.verificationToken.delete({ where: { token } });

    // Audit log: Email verified
    await this.auditService.logSecurityEvent(
      updatedUser.id,
      "auth.email_verified",
      {
        status: "success",
        details: { email: updatedUser.email },
      },
    );

    return { message: "Email verified successfully" };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent return for security

    const token = randomUUID();
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, token);

    // Audit log: Password reset requested (no userId for non-authenticated user)
    await this.auditService.logSecurityEvent(
      null,
      "auth.password_reset_requested",
      {
        status: "success",
        details: { email },
      },
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new BadRequestException("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    });

    await this.prisma.verificationToken.delete({ where: { token } });

    // Audit log: Password changed via reset
    await this.auditService.logSecurityEvent(
      updatedUser.id,
      "auth.password_changed",
      {
        status: "success",
        details: { method: "reset", email: updatedUser.email },
      },
    );

    return { message: "Password reset successfully" };
  }

  async validateUser(email: string, pass: string, req?: Request): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    // Determine failure reason
    const reason = !user ? "user_not_found" : "invalid_password";

    // Log failed attempt using LoginSecurityService if request is available
    if (req) {
      await this.loginSecurityService.logLoginAttempt(
        email,
        false,
        req,
        reason,
      );
    }

    // Audit log: Failed login attempt (don't log password)
    await this.auditService.logSecurityEvent(null, "auth.failed_login", {
      status: "failure",
      details: {
        email,
        reason,
      },
    });

    return null;
  }

  async login(user: any, request?: any) {
    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Generate temporary session token
      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store session token
      this.pending2FASessions.set(sessionToken, {
        userId: user.id,
        expiresAt,
      });

      // Extract IP and user agent for audit log
      const ipAddress = request?.ip || request?.connection?.remoteAddress;
      const userAgent = request?.headers?.['user-agent'];

      // Audit log: 2FA challenge initiated
      await this.auditService.logSecurityEvent(user.id, "auth.2fa_challenge", {
        status: "success",
        context: { ipAddress, userAgent },
        details: { email: user.email },
      });

      // Return 2FA challenge response
      return {
        requires2FA: true,
        sessionToken,
      };
    }

    // Normal login flow (no 2FA)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Create session with device info, IP, etc.
    if (request) {
      await this.sessionService.createSession(user.id, refreshToken, request);
    }

    // Extract IP and user agent for audit log
    const ipAddress = request?.ip || request?.connection?.remoteAddress;
    const userAgent = request?.headers?.['user-agent'];

    // Audit log: Successful login
    await this.auditService.logSecurityEvent(user.id, "auth.login", {
      status: "success",
      context: { ipAddress, userAgent },
      details: { email: user.email },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verify2FAAndLogin(sessionToken: string, code: string, request: Request) {
    // Lookup session token
    const session = this.pending2FASessions.get(sessionToken);

    if (!session || session.expiresAt < new Date()) {
      // Audit log: Invalid/expired 2FA session
      await this.auditService.logSecurityEvent(null, "auth.2fa_verification_failed", {
        status: "failure",
        details: { reason: "invalid_or_expired_session" },
      });
      throw new UnauthorizedException("Invalid or expired session");
    }

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      this.pending2FASessions.delete(sessionToken);
      throw new UnauthorizedException("User not found");
    }

    // Verify 2FA code (handles both TOTP and backup codes)
    const isValid = await this.twoFactorService.verify(user.id, code);

    if (!isValid) {
      // Extract IP and user agent for audit log
      const ipAddress = request?.ip || request?.connection?.remoteAddress;
      const userAgent = request?.headers?.['user-agent'];

      // Audit log: Failed 2FA verification
      await this.auditService.logSecurityEvent(user.id, "auth.2fa_verification_failed", {
        status: "failure",
        context: { ipAddress, userAgent },
        details: { email: user.email, reason: "invalid_code" },
      });

      throw new UnauthorizedException("Invalid verification code");
    }

    // Delete session token (single use)
    this.pending2FASessions.delete(sessionToken);

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Create session with device info, IP, etc.
    if (request) {
      await this.sessionService.createSession(user.id, refreshToken, request);
    }

    // Extract IP and user agent for audit log
    const ipAddress = request?.ip || request?.connection?.remoteAddress;
    const userAgent = request?.headers?.['user-agent'];

    // Audit log: Successful 2FA login
    await this.auditService.logSecurityEvent(user.id, "auth.login", {
      status: "success",
      context: { ipAddress, userAgent },
      details: { email: user.email, method: "2fa" },
    });

    // Return user object without password
    const { password, twoFactorSecret, ...userWithoutSensitive } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutSensitive,
    };
  }

  async refresh(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateOAuthUser(profile: any, provider: "google" | "github") {
    const { id, emails, photos, displayName } = profile;
    const email = emails[0].value;
    const avatarUrl = photos[0].value;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          image: avatarUrl,
          emailVerified: new Date(),
          accounts: {
            create: {
              provider,
              providerAccountId: id,
              type: "oauth",
            },
          },
        },
      });

      // Create Default Organization
      await this.prisma.organization.create({
        data: {
          name: `${displayName || email}'s Workspace`,
          slug: randomUUID(),
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });
    } else {
      // Link account if not already linked
      const account = await this.prisma.account.findFirst({
        where: { userId: user.id, provider },
      });

      if (!account) {
        await this.prisma.account.create({
          data: {
            userId: user.id,
            provider,
            providerAccountId: id,
            type: "oauth",
          },
        });
      }
    }

    const { password, ...result } = user;
    return result;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string,
  ): Promise<{ message: string }> {
    // 1. Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new BadRequestException(
        "Cannot change password for OAuth-only accounts",
      );
    }

    // 2. Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 5. Invalidate all other sessions (keep current)
    if (currentSessionId) {
      await this.sessionService.invalidateAllSessions(userId, currentSessionId);
    }

    // 6. Log audit event
    await this.auditService.logSecurityEvent(userId, "auth.password_changed", {
      status: "success",
      details: { method: "change_password" },
    });

    return { message: "Password changed successfully" };
  }
}
