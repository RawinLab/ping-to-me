import { Test, TestingModule } from '@nestjs/testing';
import { DomainService } from './domains.service';
import { PrismaClient } from '@pingtome/database';
import { AuditService } from '../audit/audit.service';
import { QuotaService } from '../quota/quota.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

// Domain status enum (must match database enum)
enum DomainStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

// Mock PrismaClient
jest.mock('@pingtome/database', () => {
  const DomainStatus = {
    PENDING: 'PENDING',
    VERIFYING: 'VERIFYING',
    VERIFIED: 'VERIFIED',
    FAILED: 'FAILED',
  };

  const mockPrisma = {
    domain: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    link: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    DomainStatus,
  };
});

describe('DomainService - Module 2.4', () => {
  let service: DomainService;
  let prisma: any;
  let auditService: AuditService;
  let quotaService: QuotaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockDomainId = 'domain-123';
  const mockDomain = {
    id: mockDomainId,
    hostname: 'example.com',
    organizationId: mockOrgId,
    status: DomainStatus.VERIFIED,
    isVerified: true,
    isDefault: false,
    verificationToken: 'token-123',
    sslStatus: 'ACTIVE',
    sslProvider: 'letsencrypt',
    sslCertificateId: 'cert-123',
    sslIssuedAt: new Date('2024-01-01'),
    sslExpiresAt: new Date('2024-04-01'),
    sslAutoRenew: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuditService = {
      logDomainEvent: jest.fn().mockResolvedValue(undefined),
    };

    const mockQuotaService = {
      checkQuota: jest.fn().mockResolvedValue({ allowed: true }),
      incrementUsage: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainService,
        { provide: AuditService, useValue: mockAuditService },
        { provide: QuotaService, useValue: mockQuotaService },
      ],
    }).compile();

    service = module.get<DomainService>(DomainService);
    auditService = module.get<AuditService>(AuditService);
    quotaService = module.get<QuotaService>(QuotaService);

    // Access the mocked Prisma instance
    prisma = (service as any).prisma;

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getDomainDetails (TASK-2.4.13)', () => {
    it('should return domain details with links count and verification instructions', async () => {
      const mockDomainWithCount = {
        ...mockDomain,
        _count: { links: 5 },
      };

      prisma.domain.findUnique.mockResolvedValue(mockDomainWithCount);

      const result = await service.getDomainDetails(mockDomainId);

      expect(result).toHaveProperty('linksCount', 5);
      expect(result).toHaveProperty('verificationInstructions');
      expect(result.verificationInstructions).toHaveProperty('txt');
      expect(result.verificationInstructions).toHaveProperty('cname');
      expect(result).toHaveProperty('sslInfo');
      expect(result.sslInfo).toEqual({
        status: mockDomain.sslStatus,
        provider: mockDomain.sslProvider,
        certificateId: mockDomain.sslCertificateId,
        issuedAt: mockDomain.sslIssuedAt,
        expiresAt: mockDomain.sslExpiresAt,
        autoRenew: mockDomain.sslAutoRenew,
      });
    });

    it('should throw error if domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);

      await expect(service.getDomainDetails(mockDomainId)).rejects.toThrow(
        'Domain not found',
      );
    });
  });

  describe('setDefault (TASK-2.4.12)', () => {
    it('should set domain as default and unset previous default', async () => {
      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      prisma.domain.updateMany.mockResolvedValue({ count: 1 });
      prisma.domain.update.mockResolvedValue({ ...mockDomain, isDefault: true });

      const result = await service.setDefault(mockUserId, mockOrgId, mockDomainId);

      expect(result.isDefault).toBe(true);
      expect(prisma.domain.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
      expect(prisma.domain.update).toHaveBeenCalledWith({
        where: { id: mockDomainId },
        data: { isDefault: true },
      });
      expect(auditService.logDomainEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'domain.default_set',
        expect.any(Object),
      );
    });

    it('should throw error if domain does not belong to organization', async () => {
      const wrongDomain = { ...mockDomain, organizationId: 'other-org' };
      prisma.domain.findUnique.mockResolvedValue(wrongDomain);

      await expect(
        service.setDefault(mockUserId, mockOrgId, mockDomainId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw error if domain is not verified', async () => {
      const unverifiedDomain = {
        ...mockDomain,
        status: DomainStatus.PENDING,
      };
      prisma.domain.findUnique.mockResolvedValue(unverifiedDomain);

      await expect(
        service.setDefault(mockUserId, mockOrgId, mockDomainId),
      ).rejects.toThrow('Domain must be verified before setting as default');
    });

    it('should throw error if domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        service.setDefault(mockUserId, mockOrgId, mockDomainId),
      ).rejects.toThrow('Domain not found');
    });
  });

  describe('getLinksByDomain (TASK-2.4.14)', () => {
    it('should return paginated links for a domain', async () => {
      const mockLinks = [
        {
          id: 'link-1',
          slug: 'abc123',
          originalUrl: 'https://example.com/page1',
          title: 'Link 1',
          status: 'ACTIVE',
          createdAt: new Date(),
          _count: { clicks: 10 },
        },
        {
          id: 'link-2',
          slug: 'def456',
          originalUrl: 'https://example.com/page2',
          title: 'Link 2',
          status: 'ACTIVE',
          createdAt: new Date(),
          _count: { clicks: 5 },
        },
      ];

      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      prisma.link.findMany.mockResolvedValue(mockLinks);
      prisma.link.count.mockResolvedValue(2);

      const result = await service.getLinksByDomain(mockDomainId, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('clicks', 10);
      expect(result.data[0]).toHaveProperty('targetUrl', 'https://example.com/page1');
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      prisma.link.findMany.mockResolvedValue([]);
      prisma.link.count.mockResolvedValue(0);

      const result = await service.getLinksByDomain(mockDomainId, {
        page: 2,
        limit: 10,
      });

      expect(prisma.link.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        }),
      );
    });

    it('should throw error if domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        service.getLinksByDomain(mockDomainId, { page: 1, limit: 20 }),
      ).rejects.toThrow('Domain not found');
    });
  });

  describe('update', () => {
    it('should update domain verification type', async () => {
      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      prisma.domain.update.mockResolvedValue({
        ...mockDomain,
        verificationType: 'cname',
      });

      const result = await service.update(
        mockDomainId,
        mockOrgId,
        { verificationType: 'cname' },
        mockUserId,
      );

      expect(result.verificationType).toBe('cname');
      expect(prisma.domain.update).toHaveBeenCalledWith({
        where: { id: mockDomainId },
        data: expect.objectContaining({ verificationType: 'cname' }),
      });
    });

    it('should set domain as default and unset previous default', async () => {
      prisma.domain.findUnique.mockResolvedValue(mockDomain);
      prisma.domain.updateMany.mockResolvedValue({ count: 1 });
      prisma.domain.update.mockResolvedValue({ ...mockDomain, isDefault: true });

      const result = await service.update(
        mockDomainId,
        mockOrgId,
        { isDefault: true },
        mockUserId,
      );

      expect(result.isDefault).toBe(true);
      expect(prisma.domain.updateMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId, isDefault: true },
        data: { isDefault: false },
      });
      expect(auditService.logDomainEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'domain.updated',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if domain not found', async () => {
      prisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockDomainId, mockOrgId, { isDefault: true }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if setting unverified domain as default', async () => {
      const unverifiedDomain = {
        ...mockDomain,
        isVerified: false,
        status: DomainStatus.PENDING,
      };
      prisma.domain.findUnique.mockResolvedValue(unverifiedDomain);

      await expect(
        service.update(mockDomainId, mockOrgId, { isDefault: true }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate domain belongs to organization', async () => {
      prisma.domain.findUnique.mockResolvedValue(null); // Query with orgId returns null

      await expect(
        service.update(mockDomainId, 'wrong-org', { isDefault: true }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
