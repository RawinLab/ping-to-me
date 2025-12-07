import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { ClickSource } from "@prisma/client";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    link: {
      findUnique: jest.fn(),
    },
    clickEvent: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("trackClick", () => {
    it("should track a click with DIRECT source by default", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        userId: "user-123",
      };
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.create.mockResolvedValue({});

      await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0",
        ip: "127.0.0.1",
        country: "US",
      });

      expect(mockPrismaService.clickEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          linkId: "link-123",
          source: ClickSource.DIRECT,
          country: "US",
        }),
      });
    });

    it("should track a click with QR source", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        userId: "user-123",
      };
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.create.mockResolvedValue({});

      await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0",
        ip: "127.0.0.1",
        country: "US",
        source: ClickSource.QR,
      });

      expect(mockPrismaService.clickEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          linkId: "link-123",
          source: ClickSource.QR,
        }),
      });
    });

    it("should track a click with API source", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        userId: "user-123",
      };
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.create.mockResolvedValue({});

      await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0",
        ip: "127.0.0.1",
        country: "US",
        source: ClickSource.API,
      });

      expect(mockPrismaService.clickEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          linkId: "link-123",
          source: ClickSource.API,
        }),
      });
    });

    it("should ignore clicks for invalid slugs", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await service.trackClick({
        slug: "invalid-slug",
        timestamp: new Date().toISOString(),
      });

      expect(mockPrismaService.clickEvent.create).not.toHaveBeenCalled();
    });

    it("should parse user agent and store device info", async () => {
      const mockLink = {
        id: "link-123",
        slug: "test-slug",
        userId: "user-123",
      };
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.create.mockResolvedValue({});

      await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      });

      expect(mockPrismaService.clickEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          browser: expect.any(String),
          os: expect.any(String),
          device: expect.any(String),
        }),
      });
    });
  });

  describe("getQrAnalytics", () => {
    const mockLink = {
      id: "link-123",
      slug: "test-slug",
      userId: "user-123",
    };

    it("should return QR analytics for a valid link", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.count.mockResolvedValue(100);
      mockPrismaService.clickEvent.groupBy.mockResolvedValue([
        { source: ClickSource.QR, _count: { id: 60 } },
        { source: ClickSource.DIRECT, _count: { id: 30 } },
        { source: ClickSource.API, _count: { id: 10 } },
      ]);

      const result = await service.getQrAnalytics("link-123", "user-123");

      expect(result).toEqual({
        totalClicks: 100,
        qrScans: 60,
        directClicks: 30,
        apiClicks: 10,
        qrPercentage: 60,
      });
    });

    it("should handle zero clicks", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.count.mockResolvedValue(0);
      mockPrismaService.clickEvent.groupBy.mockResolvedValue([]);

      const result = await service.getQrAnalytics("link-123", "user-123");

      expect(result).toEqual({
        totalClicks: 0,
        qrScans: 0,
        directClicks: 0,
        apiClicks: 0,
        qrPercentage: 0,
      });
    });

    it("should throw NotFoundException for non-existent link", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(
        service.getQrAnalytics("non-existent", "user-123"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException for unauthorized access", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        ...mockLink,
        userId: "other-user",
      });

      await expect(
        service.getQrAnalytics("link-123", "user-123"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should calculate percentage correctly with only QR scans", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.count.mockResolvedValue(50);
      mockPrismaService.clickEvent.groupBy.mockResolvedValue([
        { source: ClickSource.QR, _count: { id: 50 } },
      ]);

      const result = await service.getQrAnalytics("link-123", "user-123");

      expect(result.qrPercentage).toBe(100);
    });

    it("should handle missing source types in groupBy results", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.count.mockResolvedValue(50);
      mockPrismaService.clickEvent.groupBy.mockResolvedValue([
        { source: ClickSource.DIRECT, _count: { id: 50 } },
      ]);

      const result = await service.getQrAnalytics("link-123", "user-123");

      expect(result).toEqual({
        totalClicks: 50,
        qrScans: 0,
        directClicks: 50,
        apiClicks: 0,
        qrPercentage: 0,
      });
    });
  });
});
