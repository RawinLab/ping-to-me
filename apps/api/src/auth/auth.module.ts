import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
// Legacy RolesGuard - kept for backward compatibility
import { RolesGuard } from './guards/roles.guard';
// New RBAC system
import { PermissionService, PermissionGuard, AccessLogService } from './rbac';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
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
    // Legacy guard - kept for backward compatibility
    RolesGuard,
    // New RBAC system
    PermissionService,
    PermissionGuard,
    AccessLogService,
  ],
})
export class AuthModule { }

