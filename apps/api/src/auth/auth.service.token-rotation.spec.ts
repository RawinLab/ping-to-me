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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionService = module.get<SessionService>(SessionService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('Token Rotation', () => {
    it('should rotate refresh token on each refresh', async () => {
      const tokenFamily = randomUUID();
      const oldRefreshToken = 'old-refresh-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: false,
        revokedAt: null,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'revokeSession').mockResolvedValue();
      jest.spyOn(sessionService, 'createSessionWithFamily').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'countSessionsInFamily').mockResolvedValue(2);

      const result = await service.refresh(mockUser, oldRefreshToken, mockRequest);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(sessionService.revokeSession).toHaveBeenCalledWith(mockSession.id);
      expect(sessionService.createSessionWithFamily).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        mockRequest,
        tokenFamily,
      );
      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.token_refreshed',
        expect.objectContaining({
          status: 'success',
          details: expect.objectContaining({
            tokenFamily,
          }),
        }),
      );
    });

    it('should detect token reuse and invalidate entire token family', async () => {
      const tokenFamily = randomUUID();
      const oldRefreshToken = 'already-used-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: true, // Already revoked!
        revokedAt: new Date(Date.now() - 60000), // Revoked 1 minute ago
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateTokenFamily').mockResolvedValue(3);

      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(mockUser, oldRefreshToken, mockRequest)).rejects.toThrow(
        'Token reuse detected',
      );

      expect(sessionService.invalidateTokenFamily).toHaveBeenCalledWith(tokenFamily);
      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.token_reuse_detected',
        expect.objectContaining({
          status: 'failure',
          details: expect.objectContaining({
            sessionId: mockSession.id,
            tokenFamily,
            suspectedTheft: true,
          }),
        }),
      );
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

    it('should maintain token family across multiple rotations', async () => {
      const tokenFamily = randomUUID();
      let currentToken = 'initial-token';

      // First refresh
      const session1 = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${currentToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: false,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(session1 as any);
      jest.spyOn(sessionService, 'revokeSession').mockResolvedValue();
      jest.spyOn(sessionService, 'createSessionWithFamily').mockResolvedValue(session1 as any);
      jest.spyOn(sessionService, 'countSessionsInFamily').mockResolvedValue(2);

      await service.refresh(mockUser, currentToken, mockRequest);

      // Verify token family is maintained
      const createCall = (sessionService.createSessionWithFamily as jest.Mock).mock.calls[0];
      expect(createCall[3]).toBe(tokenFamily);

      // Second refresh with new token
      currentToken = 'second-token';
      const session2 = {
        ...session1,
        id: randomUUID(),
        tokenHash: `hashed-${currentToken}`,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(session2 as any);
      jest.spyOn(sessionService, 'countSessionsInFamily').mockResolvedValue(3);

      await service.refresh(mockUser, currentToken, mockRequest);

      // Verify same token family
      const createCall2 = (sessionService.createSessionWithFamily as jest.Mock).mock.calls[1];
      expect(createCall2[3]).toBe(tokenFamily);
    });

    it('should handle sessions without token family (backward compatibility)', async () => {
      const oldRefreshToken = 'legacy-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily: null, // No token family (legacy session)
        isRevoked: false,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'revokeSession').mockResolvedValue();
      jest.spyOn(sessionService, 'createSessionWithFamily').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'countSessionsInFamily').mockResolvedValue(1);

      const result = await service.refresh(mockUser, oldRefreshToken, mockRequest);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Should create new token family
      const createCall = (sessionService.createSessionWithFamily as jest.Mock).mock.calls[0];
      expect(createCall[3]).toBeDefined();
      expect(typeof createCall[3]).toBe('string');
    });

    it('should reject expired refresh token', async () => {
      const oldRefreshToken = 'expired-token';
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() - 1000), // Expired
        tokenFamily: randomUUID(),
        isRevoked: false,
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
        userId: differentUserId, // Different user!
        tokenHash: `hashed-${oldRefreshToken}`,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily: randomUUID(),
        isRevoked: false,
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

  describe('Token Family Management', () => {
    it('should invalidate all sessions in family when reuse detected', async () => {
      const tokenFamily = randomUUID();
      const revokedSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: 'hashed-old-token',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: true,
        revokedAt: new Date(),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(revokedSession as any);
      jest.spyOn(sessionService, 'invalidateTokenFamily').mockResolvedValue(5);

      await expect(service.refresh(mockUser, 'old-token', mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionService.invalidateTokenFamily).toHaveBeenCalledWith(tokenFamily);
    });

    it('should fallback to invalidateAllSessions if no token family', async () => {
      const revokedSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: 'hashed-old-token',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily: null, // No family
        isRevoked: true,
        revokedAt: new Date(),
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(revokedSession as any);
      jest.spyOn(sessionService, 'invalidateAllSessions').mockResolvedValue(3);

      await expect(service.refresh(mockUser, 'old-token', mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(sessionService.invalidateAllSessions).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('Audit Logging', () => {
    it('should log successful token refresh with rotation details', async () => {
      const tokenFamily = randomUUID();
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: 'hashed-token',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: false,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'revokeSession').mockResolvedValue();
      jest.spyOn(sessionService, 'createSessionWithFamily').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'countSessionsInFamily').mockResolvedValue(3);

      await service.refresh(mockUser, 'token', mockRequest);

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.token_refreshed',
        expect.objectContaining({
          status: 'success',
          details: expect.objectContaining({
            oldSessionId: mockSession.id,
            tokenFamily,
            rotationCount: 3,
          }),
        }),
      );
    });

    it('should log token reuse with detailed context', async () => {
      const tokenFamily = randomUUID();
      const revokedAt = new Date(Date.now() - 5000);
      const mockSession = {
        id: randomUUID(),
        userId: mockUser.id,
        tokenHash: 'hashed-token',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tokenFamily,
        isRevoked: true,
        revokedAt,
      };

      jest.spyOn(sessionService, 'findSessionByTokenHash').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionService, 'invalidateTokenFamily').mockResolvedValue(4);

      await expect(service.refresh(mockUser, 'token', mockRequest)).rejects.toThrow();

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        mockUser.id,
        'auth.token_reuse_detected',
        expect.objectContaining({
          status: 'failure',
          details: expect.objectContaining({
            sessionId: mockSession.id,
            tokenFamily,
            revokedAt,
            suspectedTheft: true,
          }),
        }),
      );
    });
  });
});
