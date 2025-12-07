import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { MailService } from "../mail/mail.service";
import { AuditService } from "../audit/audit.service";
import { randomUUID } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

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

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    // Audit log: Failed login attempt (don't log password)
    await this.auditService.logSecurityEvent(null, "auth.failed_login", {
      status: "failure",
      details: {
        email,
        reason: !user ? "user_not_found" : "invalid_password",
      },
    });

    return null;
  }

  async login(user: any, ipAddress?: string, userAgent?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Audit log: Successful login
    await this.auditService.logSecurityEvent(user.id, "auth.login", {
      status: "success",
      context: { ipAddress, userAgent },
      details: { email: user.email },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
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
}
