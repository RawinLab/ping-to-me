import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiScopeGuard } from '../api-scope.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { SCOPE_KEY } from '../../rbac/require-scope.decorator';
import * as crypto from 'crypto';

describe('ApiScopeGuard', () => {
  let guard: ApiScopeGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  // Mock implementations
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrisma = {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiScopeGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<ApiScopeGuard>(ApiScopeGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Helper function to create a mock ExecutionContext
   */
  const createMockContext = (overrides: any = {}): ExecutionContext => {
    const request = {
      headers: {},
      params: {},
      query: {},
      body: {},
      user: null,
      ip: '127.0.0.1',
      ...overrides,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  /**
   * Helper to hash API key
   */
  const hashKey = (key: string): string => {
    return crypto.createHash('sha256').update(key).digest('hex');
  };

  /**
   * Helper to create mock API key record
   */
  const createMockApiKey = (overrides: any = {}) => {
    return {
      id: 'key-123',
      name: 'Test Key',
      keyHash: hashKey('test-api-key'),
      organizationId: 'org-123',
      scopes: ['link:read', 'link:create'],
      ipWhitelist: [],
      rateLimit: null,
      expiresAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      organization: {
        id: 'org-123',
        name: 'Test Org',
      },
      ...overrides,
    };
  };

  describe('Public Routes (No @RequireScope)', () => {
    it('should allow access when no scope requirement is set', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const context = createMockContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('JWT Authentication Fallback', () => {
    it('should allow JWT-authenticated users when no API key is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');

      const context = createMockContext({
        user: { id: 'user-123' },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no API key or user is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'API key or valid authentication required',
      );
    });
  });

  describe('API Key Extraction', () => {
    it('should extract API key from x-api-key header', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(createMockApiKey());

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await guard.canActivate(context);

      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash: hashKey('test-api-key') },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should extract API key from Authorization: Bearer header', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(createMockApiKey());

      const context = createMockContext({
        headers: { authorization: 'Bearer test-api-key' },
      });

      await guard.canActivate(context);

      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash: hashKey('test-api-key') },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should prefer x-api-key over Authorization header', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(createMockApiKey());

      const context = createMockContext({
        headers: {
          'x-api-key': 'test-api-key',
          authorization: 'Bearer other-key',
        },
      });

      await guard.canActivate(context);

      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash: hashKey('test-api-key') },
        include: expect.any(Object),
      });
    });
  });

  describe('API Key Validation', () => {
    it('should throw UnauthorizedException for invalid API key', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const context = createMockContext({
        headers: { 'x-api-key': 'invalid-key' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid API key',
      );
    });

    it('should throw ForbiddenException for expired API key', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          expiresAt: expiredDate,
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'API key has expired',
      );
    });

    it('should allow non-expired API key', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          expiresAt: futureDate,
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('IP Whitelist Validation', () => {
    it('should allow request from whitelisted IP', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          ipWhitelist: ['127.0.0.1', '192.168.1.1'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '127.0.0.1',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for non-whitelisted IP', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          ipWhitelist: ['192.168.1.1'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '10.0.0.1',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'API key is not authorized for IP address: 10.0.0.1',
      );
    });

    it('should allow any IP when whitelist is empty', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          ipWhitelist: [],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '1.2.3.4',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should support CIDR notation in IP whitelist', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          ipWhitelist: ['10.0.0.0/8'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '10.0.0.5',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should extract IP from X-Forwarded-For header', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          ipWhitelist: ['203.0.113.1'],
        }),
      );

      const context = createMockContext({
        headers: {
          'x-api-key': 'test-api-key',
          'x-forwarded-for': '203.0.113.1, 10.0.0.1',
        },
        ip: '10.0.0.1',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Scope Validation', () => {
    it('should allow request with exact scope match', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:read'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when scope is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:delete');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:read', 'link:create'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      const error = await guard.canActivate(context).catch((e) => e);
      expect(error.message).toBe('Insufficient API key scopes');
      expect(error.response.details.requiredScopes).toBe('link:delete');
      expect(error.response.details.availableScopes).toEqual([
        'link:read',
        'link:create',
      ]);
    });

    it('should support admin scope for all resources', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:delete');
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['admin'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should support array of scopes (OR condition)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        'link:read',
        'link:create',
      ]);
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:create'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should require at least one scope from array', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        'link:read',
        'link:create',
      ]);
      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:delete'],
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('LastUsedAt Update', () => {
    it('should update lastUsedAt on successful access', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const apiKey = createMockApiKey();
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue(apiKey);

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await guard.canActivate(context);

      // Wait a bit for async update
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should not block request if lastUsedAt update fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      mockPrisma.apiKey.findUnique.mockResolvedValue(createMockApiKey());
      mockPrisma.apiKey.update.mockRejectedValue(new Error('DB error'));

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      // Should still succeed even if update fails
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Request Metadata Attachment', () => {
    it('should attach API key metadata to request', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const apiKey = createMockApiKey();
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await guard.canActivate(context);

      // Get the request from context to check if metadata was attached
      const request = context.switchToHttp().getRequest();

      expect(request.apiKey).toEqual({
        id: 'key-123',
        name: 'Test Key',
        organizationId: 'org-123',
        scopes: ['link:read', 'link:create'],
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete validation flow successfully', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['link:create', 'admin']);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:create', 'link:read', 'analytics:read'],
          ipWhitelist: ['127.0.0.1', '10.0.0.0/8'],
          expiresAt: futureDate,
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '127.0.0.1',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should reject expired key even with valid scope', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:read'],
          expiresAt: expiredDate,
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'API key has expired',
      );
    });

    it('should reject wrong IP even with valid scope and non-expired key', async () => {
      mockReflector.getAllAndOverride.mockReturnValue('link:read');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.apiKey.findUnique.mockResolvedValue(
        createMockApiKey({
          scopes: ['link:read'],
          ipWhitelist: ['192.168.1.1'],
          expiresAt: futureDate,
        }),
      );

      const context = createMockContext({
        headers: { 'x-api-key': 'test-api-key' },
        ip: '10.0.0.1',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'API key is not authorized for IP address',
      );
    });
  });
});
