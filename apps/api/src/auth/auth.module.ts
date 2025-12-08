import { Module, forwardRef } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { OAuthLinkController } from "./oauth-link.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailModule } from "../mail/mail.module";
import { AuditModule } from "../audit/audit.module";
import { ScheduleModule } from "@nestjs/schedule";
// Legacy RolesGuard - kept for backward compatibility
import { RolesGuard } from "./guards/roles.guard";
// New RBAC system
import { PermissionService, PermissionGuard, AccessLogService } from "./rbac";
// Session Management
import { SessionService } from "./session.service";
import { SessionController } from "./session.controller";
// Login Security
import { LoginSecurityService } from "./login-security.service";
import { LoginActivityController } from "./login-activity.controller";
// Two-Factor Authentication
import { TwoFactorService } from "./two-factor.service";
import { TwoFactorController } from "./two-factor.controller";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    forwardRef(() => AuditModule),
  ],
  controllers: [
    AuthController,
    OAuthLinkController,
    SessionController,
    LoginActivityController,
    TwoFactorController,
  ],
  providers: [
    AuthService,
    SessionService,
    LoginSecurityService,
    TwoFactorService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtRefreshStrategy,
    // Legacy guard - kept for backward compatibility
    RolesGuard,
    // New RBAC system
    PermissionService,
    PermissionGuard,
    AccessLogService,
  ],
  exports: [
    AuthService,
    SessionService,
    LoginSecurityService,
    // Legacy guard - kept for backward compatibility
    RolesGuard,
    // New RBAC system
    PermissionService,
    PermissionGuard,
    AccessLogService,
  ],
})
export class AuthModule {}
