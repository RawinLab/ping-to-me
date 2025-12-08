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

  // Mock Link data
  const mockLink = {
    id: "link-123",
    slug: "test-slug",
    userId: "user-123",
    originalUrl: "https://example.com",
    title: "Test Link",
    createdAt: new Date("2024-01-01"),
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

    it("should filter out bot traffic and not track clicks", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);

      // Test with Googlebot
      const result = await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)",
        ip: "127.0.0.1",
        country: "US",
      });

      expect(result).toBeNull();
      expect(mockPrismaService.clickEvent.create).not.toHaveBeenCalled();
      expect(mockPrismaService.link.findUnique).not.toHaveBeenCalled();
    });

    it("should filter out curl requests and not track clicks", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);

      const result = await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "curl/7.64.1",
        ip: "127.0.0.1",
        country: "US",
      });

      expect(result).toBeNull();
      expect(mockPrismaService.clickEvent.create).not.toHaveBeenCalled();
      expect(mockPrismaService.link.findUnique).not.toHaveBeenCalled();
    });

    it("should track clicks from legitimate browsers", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.create.mockResolvedValue({});

      await service.trackClick({
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ip: "127.0.0.1",
        country: "US",
      });

      expect(mockPrismaService.link.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.clickEvent.create).toHaveBeenCalled();
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

  describe("getLinkAnalytics", () => {
    it("should retrieve link analytics for a valid link within date range", async () => {
      const clickEvents = [
        {
          id: "click-1",
          linkId: "link-123",
          timestamp: new Date("2024-12-01"),
          country: "US",
          city: "New York",
          device: "Mobile",
          browser: "Chrome",
          os: "iOS",
          referrer: "google.com",
          source: ClickSource.DIRECT,
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        },
        {
          id: "click-2",
          linkId: "link-123",
          timestamp: new Date("2024-12-02"),
          country: "CA",
          city: "Toronto",
          device: "Desktop",
          browser: "Firefox",
          os: "Windows",
          referrer: "direct",
          source: ClickSource.QR,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      ];

      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(clickEvents);
      mockPrismaService.clickEvent.count.mockResolvedValue(2);

      const result = await service.getLinkAnalytics("link-123", "user-123", 30);

      expect(result).toHaveProperty("totalClicks", 2);
      expect(result).toHaveProperty("recentClicks");
      expect(result).toHaveProperty("clicksByDate");
      expect(result).toHaveProperty("devices");
      expect(result).toHaveProperty("countries");
      expect(result).toHaveProperty("browsers");
      expect(result).toHaveProperty("os");
      expect(result).toHaveProperty("referrers");
      expect(result).toHaveProperty("sources");
    });

    it("should throw NotFoundException if link does not exist", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(
        service.getLinkAnalytics("non-existent", "user-123", 30),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user does not own the link", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        ...mockLink,
        userId: "other-user-123",
      });

      await expect(
        service.getLinkAnalytics("link-123", "user-123", 30),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should filter clicks by date range", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);
      mockPrismaService.clickEvent.count.mockResolvedValue(0);

      await service.getLinkAnalytics("link-123", "user-123", 30);

      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            linkId: "link-123",
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it("should include weekly change percentage in results", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);
      mockPrismaService.clickEvent.count
        .mockResolvedValueOnce(100) // totalClicks
        .mockResolvedValueOnce(100) // allTimeClicks
        .mockResolvedValueOnce(60) // clicksLast7Days
        .mockResolvedValueOnce(40); // clicksPrevious7Days

      const result = await service.getLinkAnalytics("link-123", "user-123", 30);

      expect(result).toHaveProperty("weeklyChange");
      expect(typeof result.weeklyChange).toBe("number");
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

  describe("exportLinkAnalytics", () => {
    const mockClickEvents = [
      {
        id: "click-1",
        linkId: "link-123",
        timestamp: new Date("2024-12-01T10:00:00Z"),
        country: "US",
        city: "New York",
        device: "Mobile",
        browser: "Chrome",
        os: "iOS",
        referrer: "google.com",
        source: ClickSource.DIRECT,
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      },
      {
        id: "click-2",
        linkId: "link-123",
        timestamp: new Date("2024-12-02T15:30:00Z"),
        country: "CA",
        city: "Toronto",
        device: "Desktop",
        browser: "Firefox",
        os: "Windows",
        referrer: "twitter.com",
        source: ClickSource.QR,
        ip: "192.168.1.2",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    ];

    it("should generate CSV export with correct headers", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      expect(result.contentType).toBe("text/csv");
      expect(result.content).toContain(
        "timestamp,country,city,device,browser,os,referrer,source,ip",
      );
      expect(result.filename).toContain("link-test-slug-analytics");
      expect(result.filename).toContain(".csv");
    });

    it("should generate CSV with quoted fields containing commas", async () => {
      const eventsWithCommas = [
        {
          ...mockClickEvents[0],
          referrer: "google.com,search",
          city: "New York, NY",
        },
      ];

      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        eventsWithCommas,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      expect(result.content).toContain(
        '"google.com,search"',
      );
      expect(result.content).toContain('"New York, NY"');
    });

    it("should escape quotes in CSV content", async () => {
      const eventsWithQuotes = [
        {
          ...mockClickEvents[0],
          referrer: 'referrer "with quotes"',
        },
      ];

      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        eventsWithQuotes,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      expect(result.content).toContain('"referrer ""with quotes"""');
    });

    it("should generate JSON export with valid array", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "json" },
      );

      expect(result.contentType).toBe("application/json");
      expect(result.filename).toContain("link-test-slug-analytics");
      expect(result.filename).toContain(".json");

      const parsedContent = JSON.parse(result.content);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(2);
      expect(parsedContent[0]).toHaveProperty("id", "click-1");
    });

    it("should filter by date range", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue([
        mockClickEvents[0],
      ]);

      const startDate = "2024-12-01";
      const endDate = "2024-12-01";

      await service.exportLinkAnalytics("link-123", "user-123", {
        format: "csv",
        startDate,
        endDate,
      });

      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            linkId: "link-123",
            timestamp: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        }),
      );
    });

    it("should respect limit parameter in export", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue([
        mockClickEvents[0],
      ]);

      await service.exportLinkAnalytics("link-123", "user-123", {
        format: "csv",
        limit: 50,
      });

      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it("should use default limit of 10000 when not specified", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      await service.exportLinkAnalytics("link-123", "user-123", {
        format: "csv",
      });

      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10000,
        }),
      );
    });

    it("should default to CSV format when not specified", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        {},
      );

      expect(result.contentType).toBe("text/csv");
    });

    it("should throw ForbiddenException if user does not own link", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        ...mockLink,
        userId: "other-user-123",
      });

      await expect(
        service.exportLinkAnalytics("link-123", "user-123", {
          format: "csv",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException if link does not exist", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(
        service.exportLinkAnalytics("non-existent", "user-123", {
          format: "csv",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle empty click events in CSV export", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      expect(result.content).toBe(
        "timestamp,country,city,device,browser,os,referrer,source,ip",
      );
    });

    it("should handle null/undefined fields in CSV export", async () => {
      const eventsWithNulls = [
        {
          ...mockClickEvents[0],
          city: null,
          referrer: undefined,
          browser: null,
        },
      ];

      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        eventsWithNulls as any,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      const lines = result.content.split("\n");
      expect(lines.length).toBe(2); // header + 1 data row
      expect(result.content).not.toContain("null");
      expect(result.content).not.toContain("undefined");
    });

    it("should include all required columns in CSV export", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      const headers = result.content.split("\n")[0].split(",");
      expect(headers).toContain("timestamp");
      expect(headers).toContain("country");
      expect(headers).toContain("city");
      expect(headers).toContain("device");
      expect(headers).toContain("browser");
      expect(headers).toContain("os");
      expect(headers).toContain("referrer");
      expect(headers).toContain("source");
      expect(headers).toContain("ip");
    });

    it("should generate correct filename with current date", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      const today = new Date().toISOString().split("T")[0];
      expect(result.filename).toContain(today);
    });

    it("should include proper JSON formatting in JSON export", async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(mockLink);
      mockPrismaService.clickEvent.findMany.mockResolvedValue(
        mockClickEvents,
      );

      const result = await service.exportLinkAnalytics(
        "link-123",
        "user-123",
        { format: "json" },
      );

      expect(() => JSON.parse(result.content)).not.toThrow();
      expect(result.content).toContain("\n"); // Pretty-printed with newlines
    });
  });
});
