import { Test, TestingModule } from "@nestjs/testing";
import { LinksService } from "./links.service";
import { PrismaService } from "../prisma/prisma.service";
import { QrCodeService } from "../qr/qr.service";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import { SafetyCheckService } from "./services/safety-check.service";
import { MetadataService } from "./services/metadata.service";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { LinkStatus } from "@pingtome/types";

describe("LinksService", () => {
  let service: LinksService;
  let prisma: PrismaService;
  let auditService: AuditService;

  beforeEach(async () => {
    // Mock fetch globally for Cloudflare KV sync tests
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: {
            link: {
              findUnique: jest.fn(),
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            blockedDomain: {
              findUnique: jest.fn(),
            },
            clickEvent: {
              count: jest.fn().mockResolvedValue(0),
              groupBy: jest.fn().mockResolvedValue([]),
            },
            domain: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: QrCodeService,
          useValue: {
            generateAdvancedQr: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logLinkEvent: jest.fn().mockResolvedValue(undefined),
            captureChanges: jest.fn(),
          },
        },
        {
          provide: QuotaService,
          useValue: {
            checkQuota: jest.fn().mockResolvedValue({ allowed: true, currentUsage: 0, limit: 50, remaining: 50, percentUsed: 0 }),
            incrementUsage: jest.fn().mockResolvedValue(undefined),
            decrementUsage: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SafetyCheckService,
          useValue: {
            checkAndUpdateLink: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MetadataService,
          useValue: {
            scrape: jest.fn().mockResolvedValue({}),
            scrapeAndUpdateLink: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a link with auto-generated slug", async () => {
      const dto = { originalUrl: "https://example.com" };
      const userId = "user-123";
      const mockLink = {
        id: "link-123",
        ...dto,
        slug: "abc12345",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: null,
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.link.create as jest.Mock).mockResolvedValue(mockLink);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await service.create(userId, dto);

      expect(result).toBeDefined();
      expect(result.slug).toBe("abc12345");
      expect(result.status).toBe(LinkStatus.ACTIVE);
      expect(prisma.link.create).toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid URL", async () => {
      const dto = { originalUrl: "invalid-url" };
      const userId = "user-123";

      await expect(service.create(userId, dto)).rejects.toThrow(
        "Invalid URL format",
      );
    });

    it("should throw ForbiddenException for blocked domain", async () => {
      const dto = { originalUrl: "https://phishing.com" };
      const userId = "user-123";

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue({
        id: "1",
        domain: "phishing.com",
      });

      await expect(service.create(userId, dto)).rejects.toThrow(
        "This domain is blocked",
      );
    });
  });

  describe("syncToKv", () => {
    it("should include status in KV value when syncing to Cloudflare", async () => {
      const userId = "user-123";
      const mockLink = {
        id: "link-123",
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      // Set environment variables for KV
      process.env.CF_ACCOUNT_ID = "account-123";
      process.env.CF_NAMESPACE_ID = "namespace-123";
      process.env.CF_API_TOKEN = "token-123";

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.link.create as jest.Mock).mockResolvedValue(mockLink);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      await service.create(userId, { originalUrl: "https://example.com" });

      // Verify fetch was called with correct KV value including status
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("account-123"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"status":"ACTIVE"'),
        }),
      );
    });

    it("should update KV value when status changes", async () => {
      const userId = "user-123";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      const updatedLink = {
        ...existingLink,
        status: LinkStatus.DISABLED,
      };

      process.env.CF_ACCOUNT_ID = "account-123";
      process.env.CF_NAMESPACE_ID = "namespace-123";
      process.env.CF_API_TOKEN = "token-123";

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);
      (auditService.captureChanges as jest.Mock).mockReturnValue({
        status: { from: "ACTIVE", to: "DISABLED" },
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      await service.update(userId, linkId, { status: LinkStatus.DISABLED });

      // Verify fetch was called with updated status
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("account-123"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"status":"DISABLED"'),
        }),
      );
    });
  });

  describe("updateStatus", () => {
    it("should change status to DISABLED", async () => {
      const userId = "user-123";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      const updatedLink = {
        ...existingLink,
        status: LinkStatus.DISABLED,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);
      (auditService.captureChanges as jest.Mock).mockReturnValue({
        status: { from: "ACTIVE", to: "DISABLED" },
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await service.update(userId, linkId, {
        status: LinkStatus.DISABLED,
      });

      expect(result.status).toBe(LinkStatus.DISABLED);
      expect(prisma.link.update).toHaveBeenCalledWith({
        where: { id: linkId },
        data: expect.objectContaining({
          status: LinkStatus.DISABLED,
        }),
      });
    });

    it("should change status to ARCHIVED", async () => {
      const userId = "user-123";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      const updatedLink = {
        ...existingLink,
        status: "ARCHIVED",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);
      (auditService.captureChanges as jest.Mock).mockReturnValue({
        status: { from: "ACTIVE", to: "ARCHIVED" },
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      const result = await service.update(userId, linkId, {
        status: "ARCHIVED" as any,
      });

      expect(result.status).toBe("ARCHIVED");
      expect(prisma.link.update).toHaveBeenCalledWith({
        where: { id: linkId },
        data: expect.objectContaining({
          status: "ARCHIVED",
        }),
      });
    });

    it("should audit log status changes", async () => {
      const userId = "user-123";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      const updatedLink = {
        ...existingLink,
        status: LinkStatus.DISABLED,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);
      (auditService.captureChanges as jest.Mock).mockReturnValue({
        status: { from: "ACTIVE", to: "DISABLED" },
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      await service.update(userId, linkId, {
        status: LinkStatus.DISABLED,
      });

      // Verify audit log was called with status change
      expect(auditService.logLinkEvent).toHaveBeenCalledWith(
        userId,
        null,
        "link.updated",
        expect.objectContaining({
          id: linkId,
          slug: "test-slug",
        }),
        expect.objectContaining({
          changes: expect.objectContaining({
            status: { from: "ACTIVE", to: "DISABLED" },
          }),
        }),
      );
    });

    it("should sync to KV after status change", async () => {
      const userId = "user-123";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      const updatedLink = {
        ...existingLink,
        status: LinkStatus.DISABLED,
      };

      process.env.CF_ACCOUNT_ID = "account-123";
      process.env.CF_NAMESPACE_ID = "namespace-123";
      process.env.CF_API_TOKEN = "token-123";

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);
      (prisma.link.update as jest.Mock).mockResolvedValue(updatedLink);
      (auditService.captureChanges as jest.Mock).mockReturnValue({
        status: { from: "ACTIVE", to: "DISABLED" },
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      await service.update(userId, linkId, {
        status: LinkStatus.DISABLED,
      });

      // Verify KV was synced with new status
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("account-123"),
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should throw ForbiddenException when user is not the owner", async () => {
      const userId = "user-123";
      const otherId = "user-456";
      const linkId = "link-123";

      const existingLink = {
        id: linkId,
        originalUrl: "https://example.com",
        slug: "test-slug",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: otherId,
        status: LinkStatus.ACTIVE,
        tags: [],
        redirectType: 301,
        title: "Test",
        description: null,
        expirationDate: null,
        passwordHash: null,
        deepLinkFallback: null,
        organizationId: null,
        domainId: null,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(existingLink);

      await expect(
        service.update(userId, linkId, { status: LinkStatus.DISABLED }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("lookup", () => {
    it("should accept ACTIVE links", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: null,
        deepLinkFallback: null,
        status: LinkStatus.ACTIVE,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      const result = await service.lookup("test-slug");

      expect(result).toBeDefined();
      expect(result.originalUrl).toBe("https://example.com");
    });

    it("should reject DISABLED links with ForbiddenException", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: null,
        deepLinkFallback: null,
        status: LinkStatus.DISABLED,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      await expect(service.lookup("test-slug")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.lookup("test-slug")).rejects.toThrow(
        "Link is not active",
      );
    });

    it("should reject BANNED links with ForbiddenException", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: null,
        deepLinkFallback: null,
        status: LinkStatus.BANNED,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      await expect(service.lookup("test-slug")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.lookup("test-slug")).rejects.toThrow(
        "Link is not active",
      );
    });

    it("should reject ARCHIVED links with ForbiddenException", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: null,
        deepLinkFallback: null,
        status: "ARCHIVED",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      await expect(service.lookup("test-slug")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.lookup("test-slug")).rejects.toThrow(
        "Link is not active",
      );
    });

    it("should reject expired links with ForbiddenException", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: pastDate,
        deepLinkFallback: null,
        status: LinkStatus.ACTIVE,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      await expect(service.lookup("test-slug")).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.lookup("test-slug")).rejects.toThrow(
        "Link has expired",
      );
    });

    it("should reject non-existent links with BadRequestException", async () => {
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.lookup("non-existent")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.lookup("non-existent")).rejects.toThrow(
        "Link not found",
      );
    });

    it("should accept links with future expiration dates", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        originalUrl: "https://example.com",
        passwordHash: null,
        expirationDate: futureDate,
        deepLinkFallback: null,
        status: LinkStatus.ACTIVE,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      const result = await service.lookup("test-slug");

      expect(result).toBeDefined();
      expect(result.originalUrl).toBe("https://example.com");
    });
  });

  describe("findAll with status filtering", () => {
    it("should exclude BANNED links by default", async () => {
      const userId = "user-123";
      const mockLinks = [
        {
          id: "link-1",
          slug: "active-link",
          originalUrl: "https://example.com",
          status: LinkStatus.ACTIVE,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: null,
          description: null,
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          organizationId: null,
          domainId: null,
        },
        {
          id: "link-2",
          slug: "disabled-link",
          originalUrl: "https://example.com",
          status: LinkStatus.DISABLED,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: null,
          description: null,
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          organizationId: null,
          domainId: null,
        },
      ];

      (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks);
      (prisma.link.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAll(userId, {
        page: 1,
        limit: 10,
      });

      // Verify the query excluded BANNED status
      expect(prisma.link.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          status: { not: LinkStatus.BANNED },
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      expect(result.data).toHaveLength(2);
    });

    it("should filter by specific status when provided", async () => {
      const userId = "user-123";
      const mockLinks = [
        {
          id: "link-1",
          slug: "disabled-link",
          originalUrl: "https://example.com",
          status: LinkStatus.DISABLED,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: null,
          description: null,
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          organizationId: null,
          domainId: null,
        },
      ];

      (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks);
      (prisma.link.count as jest.Mock).mockResolvedValue(1);

      await service.findAll(userId, {
        page: 1,
        limit: 10,
        status: LinkStatus.DISABLED,
      });

      // Verify the query included the specific status filter
      expect(prisma.link.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: LinkStatus.DISABLED,
          }),
        }),
      );
    });
  });

  describe("export with status", () => {
    it("should include status in exported CSV", async () => {
      const userId = "user-123";
      const mockLinks = [
        {
          id: "link-1",
          slug: "test-slug",
          originalUrl: "https://example.com",
          status: LinkStatus.ACTIVE,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: "Test Link",
          description: null,
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          organizationId: null,
          domainId: null,
        },
      ];

      const mockClickCounts = [
        {
          linkId: "link-1",
          _count: { id: 5 },
        },
      ];

      (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks);
      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue(mockClickCounts);

      const csv = await service.exportLinks(userId);

      expect(csv).toContain("status");
      expect(csv).toContain(LinkStatus.ACTIVE);
      expect(csv).toContain("5"); // Should contain the actual click count
    });

    it("should handle empty links", async () => {
      const userId = "user-123";
      (prisma.link.findMany as jest.Mock).mockResolvedValue([]);

      const csv = await service.exportLinks(userId);

      expect(csv).toBe('originalUrl,slug,title,description,tags,status,createdAt,clicks\n');
    });

    it("should filter by organizationId", async () => {
      const userId = "user-123";
      const organizationId = "org-456";
      const mockLinks = [
        {
          id: "link-1",
          slug: "test-slug",
          originalUrl: "https://example.com",
          status: LinkStatus.ACTIVE,
          userId,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: "Test Link",
          description: null,
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          domainId: null,
        },
      ];

      (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks);
      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([]);

      await service.exportLinks(userId, { organizationId });

      expect(prisma.link.findMany).toHaveBeenCalledWith({
        where: { userId, organizationId },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should sanitize CSV fields to prevent CSV injection", async () => {
      const userId = "user-123";
      const mockLinks = [
        {
          id: "link-1",
          slug: "=test-slug",
          originalUrl: "=https://example.com",
          status: LinkStatus.ACTIVE,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          redirectType: 301,
          title: "+Test Link",
          description: "-Description",
          expirationDate: null,
          passwordHash: null,
          deepLinkFallback: null,
          organizationId: null,
          domainId: null,
        },
      ];

      (prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks);
      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([]);

      const csv = await service.exportLinks(userId);

      // CSV injection characters should be escaped with single quote
      expect(csv).toContain("'=https://example.com");
      expect(csv).toContain("'=test-slug");
      expect(csv).toContain("'+Test Link");
      expect(csv).toContain("'-Description");
    });
  });

  describe("importLinks with max rows enforcement", () => {
    it("should allow import within FREE plan limit (100 rows)", async () => {
      const userId = "user-123";
      const csvContent = "originalUrl,slug,title\n" +
        Array(50).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n");
      const buffer = Buffer.from(csvContent);

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.link.create as jest.Mock).mockResolvedValue({
        id: "link-123",
        slug: "test",
        status: LinkStatus.ACTIVE,
        createdAt: new Date(),
      });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(""),
      });

      const mockTransaction = jest.fn(async (callback) => {
        return callback(prisma);
      });
      (prisma.$transaction as jest.Mock) = mockTransaction;

      const result = await service.importLinks(userId, buffer, undefined, "FREE");

      expect(result.total).toBe(50);
    }, 30000);

    it("should reject import exceeding FREE plan limit (100 rows)", async () => {
      const userId = "user-123";
      const csvContent = "originalUrl,slug,title\n" +
        Array(150).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n");
      const buffer = Buffer.from(csvContent);

      await expect(
        service.importLinks(userId, buffer, undefined, "FREE")
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.importLinks(userId, buffer, undefined, "FREE")
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 100 rows, but the file contains 150 rows.");
    });

    it("should reject import exceeding PRO plan limit (1000 rows)", async () => {
      const userId = "user-123";
      const csvContent = "originalUrl,slug,title\n" +
        Array(1500).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n");
      const buffer = Buffer.from(csvContent);

      await expect(
        service.importLinks(userId, buffer, undefined, "PRO")
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 1000 rows, but the file contains 1500 rows.");
    });

    it("should reject import exceeding ENTERPRISE plan limit (10000 rows)", async () => {
      const userId = "user-123";
      const csvContent = "originalUrl,slug,title\n" +
        Array(15000).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n");
      const buffer = Buffer.from(csvContent);

      await expect(
        service.importLinks(userId, buffer, undefined, "ENTERPRISE")
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 10000 rows, but the file contains 15000 rows.");
    });

    it("should default to FREE plan limit when no plan is specified", async () => {
      const userId = "user-123";
      const csvContent = "originalUrl,slug,title\n" +
        Array(150).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n");
      const buffer = Buffer.from(csvContent);

      await expect(
        service.importLinks(userId, buffer, undefined, undefined)
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 100 rows, but the file contains 150 rows.");
    });

    it("should be case-insensitive for plan names", async () => {
      const userId = "user-123";

      // Test lowercase "free" with 150 rows (exceeds FREE limit of 100)
      const freeBuffer = Buffer.from("originalUrl,slug,title\n" +
        Array(150).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n"));

      await expect(
        service.importLinks(userId, freeBuffer, undefined, "free")
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 100 rows");

      // Test mixed case "Pro" with 1500 rows (exceeds PRO limit of 1000)
      const proBuffer = Buffer.from("originalUrl,slug,title\n" +
        Array(1500).fill(0).map((_, i) => `https://example${i}.com,slug${i},Title ${i}`).join("\n"));

      await expect(
        service.importLinks(userId, proBuffer, undefined, "Pro")
      ).rejects.toThrow("CSV exceeds maximum allowed rows. Your plan allows 1000 rows");
    });
  });
});
