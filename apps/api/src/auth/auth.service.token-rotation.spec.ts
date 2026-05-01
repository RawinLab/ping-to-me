import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { LoginSecurityService } from './login-security.service';
import { SessionService } from './session.service';
import { TwoFactorService } from './two-factor.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomUUID } from 'crypto';

describe('AuthService - Token Rotation', () => {
  let service: AuthService;
  let sessionService: SessionService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockUser = {
    id: randomUUID(),
    email: 'test@example.com',
    role: 'OWNER',
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Mozilla/5.0 Chrome/91.0',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            session: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            organization: {
              create: jest.fn(),
            },
            verificationToken: {
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logSecurityEvent: jest.fn(),
          },
        },
        {
          provide: LoginSecurityService,
          useValue: {
            logLoginAttempt: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            createSessionWithFamily: jest.fn(),
            findSessionByTokenHash: jest.fn(),
            invalidateSession: jest.fn(),
            invalidateAllSessions: jest.fn(),
            invalidateTokenFamily: jest.fn(),
            revokeSession: jest.fn(),
            countSessionsInFamily: jest.fn(),
            updateSessionActivity: jest.fn(),
            hashToken: jest.fn((token) => `hashed-${token}`),
          },
        },
        {
          provide: TwoFactorService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: DeviceFingerprintService,
          useValue: {
            calculateRiskScore: jest.fn(),
            extractDeviceInfo: jest.fn(),
            verifyDevice: jest.fn(),
            trustDevice: jest.fn(),
            getTrustedDevices: jest.fn(),
            removeTrustedDevice: jest.fn(),
            revokeAllDevices: jest.fn(),
            updateDeviceName: jest.fn(),
            getDeviceByFingerprint: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
            sendEmailNotification: jest.fn(),
            notify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionService = module.get<SessionService>(SessionService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('Token Refresh', () => {
    it('should refresh access token and reuse refresh token', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'updateSessionActivity').mockResolvedValue();

      const result = await service.refresh(mockUser, oldRefreshToken, mockRequest);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBe(oldRefreshToken);
      expect(sessionService.updateSessionActivity).toHaveBeenCalledWith(mockSession.id);
    });

    it('should update session activity on refresh', async () => {
      const oldRefreshToken = 'refresh-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'updateSessionActivity').mockResolvedValue();

      await service.refresh(mockUser, oldRefreshToken, mockRequest);

      expect(sessionService.updateSessionActivity).toHaveBeenCalledWith(mockSession.id);
    });

    it('should create session on login', async () => {
      jest.spyOn(sessionService, 'createSession').mockResolvedValue({
        id: randomUUID(),
        userId: mockUser.id,
      } as any);

      const result = await service.login(mockUser, mockRequest);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        mockRequest,
      );
    });

    it('should handle sessions with token family', async () => {
      const tokenFamily = randomUUID();
      const oldRefreshToken = 'token-with-family';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'updateSessionActivity').mockResolvedValue();

      const result = await service.refresh(mockUser, oldRefreshToken, mockRequest);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).toBe(oldRefreshToken);
    });

    it('should reject expired refresh token', async () => {
      const oldRefreshToken = 'expired-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() - 1000),
        tokenFamily: randomUUID(),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateSession').mockResolvedValue();

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        'Refresh token expired',
      );

      expect(sessionService.invalidateSession).toHaveBeenCalledWith(mockSession.id);
      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.refresh_token_expired',
        expect.any(Object),
      );
    });

    it('should reject refresh token with user mismatch', async () => {
      const oldRefreshToken = 'mismatched-token';
      const differentUserId = randomUUID();
      const mockSession = {
        id: randomUUID(),
        userId: differentUserId,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily: randomUUID(),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateAllSessions').mockResolvedValue(5);

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        'Token user mismatch',
      );

      expect(sessionService.invalidateAllSessions).toHaveBeenCalledWith(mockUser.id);
      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.refresh_token_user_mismatch',
        expect.any(Object),
      );
    });

    it('should reject invalid refresh token', async () => {
      const invalidToken = 'invalid-token';

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(null);

      await expect(service.refresh(mockUser, invalidToken, mockRequest)).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.refresh_token_invalid',
        expect.objectContaining({
          status: 'failure',
          details: { reason: 'token_not_found' },
        }),
      );
    });
  });

  describe('Session Invalidation', () => {
    it('should invalidate session when token is expired', async () => {
      const oldRefreshToken = 'expired-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() - 1000),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateSession').mockResolvedValue();

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionService.invalidateSession).toHaveBeenCalledWith(mockSession.id);
    });

    it('should invalidate all sessions when user mismatch detected', async () => {
      const oldRefreshToken = 'mismatched-token';
      const differentUserId = randomUUID();
      const mockSession = {
        id: randomUUID(),
        userId: differentUserId,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateAllSessions').mockResolvedValue(3);

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionService.invalidateAllSessions).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Audit Logging', () => {
    it('should log security event on expired token', async () => {
      const oldRefreshToken = 'expired-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() - 1000),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateSession').mockResolvedValue();

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow();

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.refresh_token_expired',
        expect.objectContaining({
          status: 'failure',
        }),
      );
    });

    it('should log security event on invalid token', async () => {
      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(null);

      await expect(service.refresh(mockUser, 'bad-token', mockRequest)).rejects.toThrow();

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.refresh_token_invalid',
        expect.objectContaining({
          status: 'failure',
          details: { reason: 'token_not_found' },
        }),
      );
    });
  });
});
