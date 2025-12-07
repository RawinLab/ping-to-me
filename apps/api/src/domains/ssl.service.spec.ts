import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SslService } from "./ssl.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SslStatus, DomainStatus } from "@pingtome/database";

describe("SslService", () => {
  let service: SslService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    domain: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logDomainEvent: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SslService>(SslService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("provisionCertificate", () => {
    const mockDomain = {
      id: "domain-1",
      hostname: "example.com",
      organizationId: "org-1",
      status: DomainStatus.VERIFIED,
      isVerified: true,
      sslStatus: SslStatus.PENDING,
      sslProvider: null,
      sslCertificateId: null,
      sslIssuedAt: null,
      sslExpiresAt: null,
      sslAutoRenew: true,
    };

    it("should provision SSL certificate for verified domain", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        organization: { id: "org-1", name: "Test Org" },
      });

      mockPrismaService.domain.update
        .mockResolvedValueOnce({
          ...mockDomain,
          sslStatus: SslStatus.PROVISIONING,
        })
        .mockResolvedValueOnce({
          ...mockDomain,
          sslStatus: SslStatus.ACTIVE,
          sslProvider: "letsencrypt-mock",
          sslCertificateId: "cert_123",
          sslIssuedAt: new Date(),
          sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });

      const result = await service.provisionCertificate("domain-1", "user-1");

      expect(result.success).toBe(true);
      expect(result.status).toBe(SslStatus.ACTIVE);
      expect(result.certificateId).toBeDefined();
      expect(result.issuedAt).toBeDefined();
      expect(result.expiresAt).toBeDefined();

      // Should update to PROVISIONING first, then ACTIVE
      expect(mockPrismaService.domain.update).toHaveBeenCalledTimes(2);

      // Should log audit event
      expect(mockAuditService.logDomainEvent).toHaveBeenCalledWith(
        "user-1",
        "org-1",
        "domain.ssl_updated",
        expect.objectContaining({
          id: "domain-1",
          hostname: "example.com",
        }),
        expect.objectContaining({
          details: expect.objectContaining({
            action: "provision",
            provider: "letsencrypt-mock",
          }),
        }),
      );
    });

    it("should fail if domain not found", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue(null);

      await expect(
        service.provisionCertificate("domain-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should fail if domain is not verified", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.PENDING,
        isVerified: false,
        organization: { id: "org-1", name: "Test Org" },
      });

      await expect(
        service.provisionCertificate("domain-1", "user-1"),
      ).rejects.toThrow(
        "Domain must be verified before SSL can be provisioned",
      );
    });

    it("should handle provisioning errors", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        organization: { id: "org-1", name: "Test Org" },
      });

      mockPrismaService.domain.update
        .mockResolvedValueOnce({
          ...mockDomain,
          sslStatus: SslStatus.PROVISIONING,
        })
        .mockRejectedValueOnce(new Error("Certificate provisioning failed"));

      const result = await service.provisionCertificate("domain-1", "user-1");

      expect(result.success).toBe(false);
      expect(result.status).toBe(SslStatus.FAILED);
      expect(result.error).toBeDefined();

      // Should log failure audit event
      expect(mockAuditService.logDomainEvent).toHaveBeenCalledWith(
        "user-1",
        "org-1",
        "domain.ssl_updated",
        expect.anything(),
        expect.objectContaining({
          status: "failure",
          details: expect.objectContaining({
            action: "provision",
            error: expect.any(String),
          }),
        }),
      );
    });
  });

  describe("getCertificateStatus", () => {
    it("should return SSL status for domain", async () => {
      const issuedAt = new Date();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      mockPrismaService.domain.findUnique.mockResolvedValue({
        id: "domain-1",
        sslStatus: SslStatus.ACTIVE,
        sslProvider: "letsencrypt-mock",
        sslCertificateId: "cert_123",
        sslIssuedAt: issuedAt,
        sslExpiresAt: expiresAt,
        sslAutoRenew: true,
      });

      const result = await service.getCertificateStatus("domain-1");

      expect(result.status).toBe(SslStatus.ACTIVE);
      expect(result.provider).toBe("letsencrypt-mock");
      expect(result.certificateId).toBe("cert_123");
      expect(result.issuedAt).toEqual(issuedAt);
      expect(result.expiresAt).toEqual(expiresAt);
      expect(result.autoRenew).toBe(true);
      expect(result.daysUntilExpiry).toBeDefined();
      expect(result.daysUntilExpiry).toBeGreaterThan(0);
    });

    it("should fail if domain not found", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue(null);

      await expect(service.getCertificateStatus("domain-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should handle domain without SSL certificate", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue({
        id: "domain-1",
        sslStatus: SslStatus.PENDING,
        sslProvider: null,
        sslCertificateId: null,
        sslIssuedAt: null,
        sslExpiresAt: null,
        sslAutoRenew: true,
      });

      const result = await service.getCertificateStatus("domain-1");

      expect(result.status).toBe(SslStatus.PENDING);
      expect(result.provider).toBeUndefined();
      expect(result.certificateId).toBeUndefined();
      expect(result.daysUntilExpiry).toBeUndefined();
    });
  });

  describe("setAutoRenew", () => {
    const mockDomain = {
      id: "domain-1",
      hostname: "example.com",
      organizationId: "org-1",
      sslAutoRenew: false,
    };

    it("should enable auto-renewal", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrismaService.domain.update.mockResolvedValue({
        ...mockDomain,
        sslAutoRenew: true,
      });

      await service.setAutoRenew("domain-1", true, "user-1");

      expect(mockPrismaService.domain.update).toHaveBeenCalledWith({
        where: { id: "domain-1" },
        data: { sslAutoRenew: true },
      });

      expect(mockAuditService.logDomainEvent).toHaveBeenCalledWith(
        "user-1",
        "org-1",
        "domain.ssl_updated",
        expect.objectContaining({
          id: "domain-1",
          hostname: "example.com",
        }),
        expect.objectContaining({
          details: expect.objectContaining({
            action: "auto_renew_changed",
            autoRenew: true,
          }),
        }),
      );
    });

    it("should disable auto-renewal", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        sslAutoRenew: true,
      });
      mockPrismaService.domain.update.mockResolvedValue({
        ...mockDomain,
        sslAutoRenew: false,
      });

      await service.setAutoRenew("domain-1", false, "user-1");

      expect(mockPrismaService.domain.update).toHaveBeenCalledWith({
        where: { id: "domain-1" },
        data: { sslAutoRenew: false },
      });
    });

    it("should fail if domain not found", async () => {
      mockPrismaService.domain.findUnique.mockResolvedValue(null);

      await expect(
        service.setAutoRenew("domain-1", true, "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("renewExpiringCertificates", () => {
    it("should renew certificates expiring within 30 days", async () => {
      const expiringDomain = {
        id: "domain-1",
        hostname: "example.com",
        organizationId: "org-1",
        sslStatus: SslStatus.ACTIVE,
        sslAutoRenew: true,
        sslExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        sslCertificateId: "cert_old",
        organization: { id: "org-1", name: "Test Org" },
      };

      mockPrismaService.domain.findMany.mockResolvedValue([expiringDomain]);
      mockPrismaService.domain.update.mockResolvedValue({
        ...expiringDomain,
        sslCertificateId: "cert_new",
      });

      const renewedCount = await service.renewExpiringCertificates();

      expect(renewedCount).toBe(1);
      expect(mockPrismaService.domain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "domain-1" },
          data: expect.objectContaining({
            sslStatus: SslStatus.ACTIVE,
            sslCertificateId: expect.any(String),
          }),
        }),
      );

      expect(mockAuditService.logDomainEvent).toHaveBeenCalledWith(
        "system",
        "org-1",
        "domain.ssl_updated",
        expect.anything(),
        expect.objectContaining({
          details: expect.objectContaining({
            action: "auto_renew",
            previousCertificateId: "cert_old",
          }),
        }),
      );
    });

    it("should skip domains with auto-renew disabled", async () => {
      mockPrismaService.domain.findMany.mockResolvedValue([]);

      const renewedCount = await service.renewExpiringCertificates();

      expect(renewedCount).toBe(0);
    });

    it("should handle renewal errors", async () => {
      const expiringDomain = {
        id: "domain-1",
        hostname: "example.com",
        organizationId: "org-1",
        sslStatus: SslStatus.ACTIVE,
        sslAutoRenew: true,
        sslExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        sslCertificateId: "cert_old",
        organization: { id: "org-1", name: "Test Org" },
      };

      mockPrismaService.domain.findMany.mockResolvedValue([expiringDomain]);
      mockPrismaService.domain.update.mockRejectedValueOnce(
        new Error("Renewal failed"),
      );
      mockPrismaService.domain.update.mockResolvedValueOnce({
        ...expiringDomain,
        sslStatus: SslStatus.EXPIRED,
      });

      const renewedCount = await service.renewExpiringCertificates();

      expect(renewedCount).toBe(0);

      // Should mark as EXPIRED on failure
      expect(mockPrismaService.domain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "domain-1" },
          data: { sslStatus: SslStatus.EXPIRED },
        }),
      );
    });
  });

  describe("markExpiredCertificates", () => {
    it("should mark expired certificates", async () => {
      mockPrismaService.domain.updateMany.mockResolvedValue({ count: 3 });

      const expiredCount = await service.markExpiredCertificates();

      expect(expiredCount).toBe(3);
      expect(mockPrismaService.domain.updateMany).toHaveBeenCalledWith({
        where: {
          sslStatus: SslStatus.ACTIVE,
          sslExpiresAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          sslStatus: SslStatus.EXPIRED,
        },
      });
    });

    it("should return 0 if no certificates expired", async () => {
      mockPrismaService.domain.updateMany.mockResolvedValue({ count: 0 });

      const expiredCount = await service.markExpiredCertificates();

      expect(expiredCount).toBe(0);
    });
  });
});
