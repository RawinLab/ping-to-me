import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { MailService } from "../mail/mail.service";
import { AuditService } from "../audit/audit.service";
import { LoginSecurityService } from "./login-security.service";
import { SessionService } from "./session.service";
import { TwoFactorService } from "./two-factor.service";
import { DeviceFingerprintService } from "./device-fingerprint.service";
import { NotificationsService } from "../notifications/notifications.service";
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
    private deviceFingerprintService: DeviceFingerprintService,
    private notificationsService: NotificationsService,
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
    try {
      await this.mailService.sendVerificationEmail(email, token);
    } catch (error) {
      // Log error but don't fail registration - email may not be configured
      console.error('Failed to send verification email:', error);
    }

    // Create welcome notification (NOTIF-021)
    try {
      await this.notificationsService.create(
        user.id,
        'INFO',
        'Welcome to PingToMe!',
        'Get started by creating your first short link.'
      );
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to create welcome notification:', error);
    }

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

  async validateUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async login(user: any, request?: any, fingerprint?: string) {
    // Extract IP and user agent
    const ipAddress = request?.ip || request?.connection?.remoteAddress;
    const userAgent = request?.headers?.['user-agent'];

    // Perform risk assessment if fingerprint is provided
    let riskAssessment: any = null;
    if (fingerprint && request) {
      riskAssessment = await this.deviceFingerprintService.calculateRiskScore({
        userId: user.id,
        email: user.email,
        fingerprint,
        request,
        has2FAEnabled: user.twoFactorEnabled,
      });

      // Log risk assessment
      await this.auditService.logSecurityEvent(user.id, "auth.risk_assessment", {
        status: "success",
        context: { ipAddress, userAgent },
        details: {
          email: user.email,
          riskScore: riskAssessment.riskScore,
          factors: riskAssessment.factors,
        },
      });
    }

    // High risk: require email verification
    if (riskAssessment && riskAssessment.requiresEmailVerification) {
      // Generate verification token
      const verificationToken = randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store session token
      this.pending2FASessions.set(verificationToken, {
        userId: user.id,
        expiresAt,
      });

      // Send verification email
      await this.mailService.sendLoginVerificationEmail(user.email, verificationToken);

      // Audit log: Email verification required
      await this.auditService.logSecurityEvent(user.id, "auth.login_verification_required", {
        status: "success",
        context: { ipAddress, userAgent },
        details: {
          email: user.email,
          reason: "high_risk_login",
          riskScore: riskAssessment.riskScore,
        },
      });

      return {
        requiresVerification: true,
        verificationType: "email",
        verificationToken,
        riskScore: riskAssessment.riskScore,
      };
    }

    // Check if 2FA is enabled for this user (or required by risk assessment)
    if (user.twoFactorEnabled || (riskAssessment && riskAssessment.requires2FA)) {
      // Generate temporary session token
      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store session token
      this.pending2FASessions.set(sessionToken, {
        userId: user.id,
        expiresAt,
      });

      // Audit log: 2FA challenge initiated
      await this.auditService.logSecurityEvent(user.id, "auth.2fa_challenge", {
        status: "success",
        context: { ipAddress, userAgent },
        details: {
          email: user.email,
          riskScore: riskAssessment?.riskScore,
        },
      });

      // Return 2FA challenge response
      return {
        requires2FA: true,
        sessionToken,
        riskScore: riskAssessment?.riskScore,
      };
    }

    // Normal login flow (low risk, no 2FA)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Create session with device info, IP, etc.
    if (request) {
      await this.sessionService.createSession(user.id, refreshToken, request);
    }

    // Trust the device if fingerprint is provided
    if (fingerprint && request) {
      const deviceInfo = this.deviceFingerprintService.extractDeviceInfo(fingerprint, request);
      await this.deviceFingerprintService.trustDevice(user.id, deviceInfo);
    }

    // Audit log: Successful login
    await this.auditService.logSecurityEvent(user.id, "auth.login", {
      status: "success",
      context: { ipAddress, userAgent },
      details: {
        email: user.email,
        riskScore: riskAssessment?.riskScore || 0,
      },
    });

    return {
      accessToken,
      refreshToken,
      riskScore: riskAssessment?.riskScore || 0,
    };
  }

  async verifyLoginEmail(verificationToken: string, request: Request, fingerprint?: string) {
    // Lookup session token
    const session = this.pending2FASessions.get(verificationToken);

    if (!session || session.expiresAt < new Date()) {
      // Audit log: Invalid/expired verification token
      await this.auditService.logSecurityEvent(null, "auth.login_verification_failed", {
        status: "failure",
        details: { reason: "invalid_or_expired_token" },
      });
      throw new UnauthorizedException("Invalid or expired verification token");
    }

    // Get user from database
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      this.pending2FASessions.delete(verificationToken);
      throw new UnauthorizedException("User not found");
    }

    // Delete session token (single use)
    this.pending2FASessions.delete(verificationToken);

    // Now check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate 2FA session token
      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      this.pending2FASessions.set(sessionToken, {
        userId: user.id,
        expiresAt,
      });

      // Audit log: 2FA challenge initiated
      const ipAddress = request?.ip || request?.connection?.remoteAddress;
      const userAgent = request?.headers?.['user-agent'];

      await this.auditService.logSecurityEvent(user.id, "auth.2fa_challenge", {
        status: "success",
        context: { ipAddress, userAgent },
        details: { email: user.email, afterEmailVerification: true },
      });

      return {
        requires2FA: true,
        sessionToken,
      };
    }

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Create session with device info, IP, etc.
    if (request) {
      await this.sessionService.createSession(user.id, refreshToken, request);
    }

    // Trust the device if fingerprint is provided
    if (fingerprint && request) {
      const deviceInfo = this.deviceFingerprintService.extractDeviceInfo(fingerprint, request);
      await this.deviceFingerprintService.trustDevice(user.id, deviceInfo);
    }

    // Extract IP and user agent for audit log
    const ipAddress = request?.ip || request?.connection?.remoteAddress;
    const userAgent = request?.headers?.['user-agent'];

    // Audit log: Successful login after email verification
    await this.auditService.logSecurityEvent(user.id, "auth.login", {
      status: "success",
      context: { ipAddress, userAgent },
      details: { email: user.email, method: "email_verification" },
    });

    // Return user object without password
    const { password, twoFactorSecret, ...userWithoutSensitive } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutSensitive,
    };
  }

  async verify2FAAndLogin(sessionToken: string, code: string, request: Request, fingerprint?: string) {
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

    // Trust the device if fingerprint is provided
    if (fingerprint && request) {
      const deviceInfo = this.deviceFingerprintService.extractDeviceInfo(fingerprint, request);
      await this.deviceFingerprintService.trustDevice(user.id, deviceInfo);
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

  async refresh(user: any, oldRefreshToken: string, request?: any): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Find session by old refresh token hash
    const tokenHash = this.sessionService.hashToken(oldRefreshToken);
    const session = await this.sessionService.findSessionByTokenHash(tokenHash);

    if (!session) {
      // Audit log: Invalid refresh token
      await this.auditService.logSecurityEvent(user.id, "auth.refresh_token_invalid", {
        status: "failure",
        details: { reason: "token_not_found" },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Check if session is expired
    if (session.expires < new Date()) {
      // Clean up expired session
      await this.sessionService.invalidateSession(session.id);

      // Audit log: Expired refresh token
      await this.auditService.logSecurityEvent(user.id, "auth.refresh_token_expired", {
        status: "failure",
        details: { sessionId: session.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // 3. Check if user ID matches (security check)
    if (session.userId !== user.id) {
      // Potential token theft - user ID mismatch
      await this.sessionService.invalidateAllSessions(user.id);

      // Audit log: User ID mismatch
      await this.auditService.logSecurityEvent(user.id, "auth.refresh_token_user_mismatch", {
        status: "failure",
        details: { sessionUserId: session.userId, tokenUserId: user.id },
      });
      throw new UnauthorizedException('Token user mismatch. All sessions have been invalidated for security.');
    }

    // 4. TOKEN REUSE DETECTION: Check if token has already been used (rotated)
    // If isRevoked is true, this token was already used - potential token theft!
    if (session.isRevoked) {
      const tokenFamily = session.tokenFamily;

      // CRITICAL SECURITY EVENT: Token reuse detected!
      await this.auditService.logSecurityEvent(user.id, "auth.token_reuse_detected", {
        status: "failure",
        details: {
          sessionId: session.id,
          tokenFamily,
          revokedAt: session.revokedAt,
          suspectedTheft: true,
        },
      });

      // Invalidate ALL sessions in this token family (force re-login on all devices)
      if (tokenFamily) {
        await this.sessionService.invalidateTokenFamily(tokenFamily);
      } else {
        // Fallback: Invalidate all user sessions if no token family
        await this.sessionService.invalidateAllSessions(user.id);
      }

      throw new UnauthorizedException(
        'Token reuse detected. All sessions have been invalidated for security. Please login again.'
      );
    }

    // 5. Generate new tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // 6. Mark current session as revoked (token has now been used - one-time use)
    await this.sessionService.revokeSession(session.id);

    // 7. Create new session with new refresh token (inherit token family)
    const tokenFamily = session.tokenFamily || randomUUID();
    if (request) {
      await this.sessionService.createSessionWithFamily(
        user.id,
        newRefreshToken,
        request,
        tokenFamily,
      );
    }

    // 8. Audit log: Successful token refresh
    await this.auditService.logSecurityEvent(user.id, "auth.token_refreshed", {
      status: "success",
      details: {
        oldSessionId: session.id,
        tokenFamily,
        rotationCount: await this.sessionService.countSessionsInFamily(tokenFamily),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
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

      // Create welcome notification for new OAuth user (NOTIF-021)
      try {
        await this.notificationsService.create(
          user.id,
          'INFO',
          'Welcome to PingToMe!',
          'Get started by creating your first short link.'
        );
      } catch (error) {
        // Log error but don't fail registration
        console.error('Failed to create welcome notification:', error);
      }
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

  async sendVerificationEmail(userId: string, email: string) {
    // Generate Verification Token
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification tokens for this email
    await this.prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await this.prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    try {
      await this.mailService.sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    // Audit log: Verification email sent
    await this.auditService.logSecurityEvent(userId, "auth.verification_email_sent", {
      status: "success",
      details: { email },
    });

    return { message: "Verification email sent successfully" };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
    return user;
  }

  async getLinkedAccounts(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        type: true,
      },
    });

    return accounts;
  }

  async linkOAuthAccount(
    userId: string,
    provider: string,
    profile: any,
  ): Promise<{ message: string }> {
    const { id: providerAccountId, emails } = profile;
    const email = emails?.[0]?.value;

    // Check if this OAuth account is already linked to another user
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount && existingAccount.userId !== userId) {
      throw new BadRequestException(
        `This ${provider} account is already linked to another user`,
      );
    }

    if (existingAccount && existingAccount.userId === userId) {
      throw new BadRequestException(
        `This ${provider} account is already linked to your account`,
      );
    }

    // Create Account record linking provider to user
    await this.prisma.account.create({
      data: {
        userId,
        provider,
        providerAccountId,
        type: "oauth",
      },
    });

    // Audit log: OAuth account linked
    await this.auditService.logSecurityEvent(userId, "auth.oauth_linked", {
      status: "success",
      details: { provider, email },
    });

    return { message: `${provider} account linked successfully` };
  }

  async unlinkOAuthAccount(
    userId: string,
    provider: string,
  ): Promise<{ message: string }> {
    // Check if user has password or another OAuth provider
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Check if this is the only auth method
    const hasPassword = !!user.password;
    const accountCount = user.accounts.length;

    if (!hasPassword && accountCount <= 1) {
      throw new BadRequestException(
        "Cannot unlink the only authentication method. Please set a password first.",
      );
    }

    // Find and delete the account
    const account = await this.prisma.account.findFirst({
      where: { userId, provider },
    });

    if (!account) {
      throw new BadRequestException(`${provider} account is not linked`);
    }

    await this.prisma.account.delete({
      where: { id: account.id },
    });

    // Audit log: OAuth account unlinked
    await this.auditService.logSecurityEvent(userId, "auth.oauth_unlinked", {
      status: "success",
      details: { provider },
    });

    return { message: `${provider} account unlinked successfully` };
  }

  /**
   * Verify and decode JWT token
   * Used for OAuth account linking flow
   */
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException("Invalid or expired token");
    }
  }
}
