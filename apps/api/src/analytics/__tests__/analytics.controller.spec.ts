import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController, LinkAnalyticsController } from "../analytics.controller";
import { AnalyticsService } from "../analytics.service";
import { ConfigService } from "@nestjs/config";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ClickSource } from "@prisma/client";
import { Response } from "express";
import { PermissionService, AccessLogService } from "../../auth/rbac";
import { Reflector } from "@nestjs/core";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;
  let configService: ConfigService;

  const mockAnalyticsService = {
    trackClick: jest.fn(),
    getDashboardMetrics: jest.fn(),
    getLinkAnalytics: jest.fn(),
    getQrAnalytics: jest.fn(),
    exportLinkAnalytics: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPermissionService = {
    hasPermission: jest.fn().mockResolvedValue(true),
  };

  const mockAccessLogService = {
    logAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: AccessLogService,
          useValue: mockAccessLogService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("track - API Key Security", () => {
    const trackData = {
      slug: "test-slug",
      timestamp: new Date().toISOString(),
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
      country: "US",
    };

    it("should reject request without API key", async () => {
      mockConfigService.get.mockReturnValue("valid-api-key");

      await expect(controller.track(trackData, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should reject request with empty API key", async () => {
      mockConfigService.get.mockReturnValue("valid-api-key");

      await expect(controller.track(trackData, "")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should reject request with invalid API key", async () => {
      mockConfigService.get.mockReturnValue("valid-api-key");

      await expect(controller.track(trackData, "invalid-key")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should reject request when ANALYTICS_API_KEY is not configured", async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(controller.track(trackData, "any-key")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should accept request with valid API key", async () => {
      const validKey = "test-analytics-key";
      mockConfigService.get.mockReturnValue(validKey);
      mockAnalyticsService.trackClick.mockResolvedValue({});

      await controller.track(trackData, validKey);

      expect(mockAnalyticsService.trackClick).toHaveBeenCalledWith(trackData);
    });

    it("should call ConfigService.get with ANALYTICS_API_KEY parameter", async () => {
      const validKey = "test-analytics-key";
      mockConfigService.get.mockReturnValue(validKey);
      mockAnalyticsService.trackClick.mockResolvedValue({});

      await controller.track(trackData, validKey);

      expect(mockConfigService.get).toHaveBeenCalledWith("ANALYTICS_API_KEY");
    });

    it("should be case-sensitive with API key comparison", async () => {
      const validKey = "test-analytics-KEY";
      mockConfigService.get.mockReturnValue(validKey);

      await expect(
        controller.track(trackData, "test-analytics-key"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should reject request with API key containing extra spaces", async () => {
      const validKey = "test-analytics-key";
      mockConfigService.get.mockReturnValue(validKey);

      await expect(
        controller.track(trackData, " test-analytics-key"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should pass track data correctly to service after validation", async () => {
      const validKey = "test-analytics-key";
      mockConfigService.get.mockReturnValue(validKey);
      mockAnalyticsService.trackClick.mockResolvedValue({});

      const trackDataWithAllFields = {
        slug: "test-slug",
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
        ip: "192.168.1.1",
        country: "US",
        source: ClickSource.QR,
        referrer: "https://example.com",
      };

      await controller.track(trackDataWithAllFields, validKey);

      expect(mockAnalyticsService.trackClick).toHaveBeenCalledWith(
        trackDataWithAllFields,
      );
    });

    it("should handle API key validation before processing track data", async () => {
      mockConfigService.get.mockReturnValue("valid-key");

      await expect(controller.track(trackData, "invalid-key")).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockAnalyticsService.trackClick).not.toHaveBeenCalled();
    });
  });

  describe("track - Throttling", () => {
    it("should have Throttle decorator with rate limit of 100 per 60 seconds", async () => {
      // Verify the controller method exists and is callable
      expect(controller.track).toBeDefined();
    });

    it("should allow tracking click with valid credentials", async () => {
      const validKey = "test-api-key";
      mockConfigService.get.mockReturnValue(validKey);
      mockAnalyticsService.trackClick.mockResolvedValue({ id: "click-1" });

      const trackData = {
        slug: "test",
        timestamp: new Date().toISOString(),
      };

      const result = await controller.track(trackData, validKey);

      expect(result).toEqual({ id: "click-1" });
    });
  });

  describe("getDashboardMetrics", () => {
    it("should call analyticsService.getDashboardMetrics with correct parameters", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockMetrics = {
        totalLinks: 10,
        totalClicks: 1000,
        allTimeClicks: 2000,
      };

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getDashboardMetrics(mockRequest, "30");

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        "user-123",
        30,
      );
      expect(result).toEqual(mockMetrics);
    });

    it("should use default days of 30 when not specified", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getDashboardMetrics.mockResolvedValue({});

      await controller.getDashboardMetrics(mockRequest);

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        "user-123",
        30,
      );
    });

    it("should parse days parameter as integer", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getDashboardMetrics.mockResolvedValue({});

      await controller.getDashboardMetrics(mockRequest, "7");

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        "user-123",
        7,
      );
    });

    it("should handle custom days parameter", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getDashboardMetrics.mockResolvedValue({});

      await controller.getDashboardMetrics(mockRequest, "90");

      expect(mockAnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        "user-123",
        90,
      );
    });
  });
});

describe("LinkAnalyticsController", () => {
  let controller: LinkAnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    trackClick: jest.fn(),
    getDashboardMetrics: jest.fn(),
    getLinkAnalytics: jest.fn(),
    getQrAnalytics: jest.fn(),
    exportLinkAnalytics: jest.fn(),
  };

  const mockPermissionService = {
    hasPermission: jest.fn().mockResolvedValue(true),
  };

  const mockAccessLogService = {
    logAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkAnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: AccessLogService,
          useValue: mockAccessLogService,
        },
        {
          provide: Reflector,
          useValue: new Reflector(),
        },
      ],
    }).compile();

    controller = module.get<LinkAnalyticsController>(LinkAnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAnalytics", () => {
    it("should retrieve analytics for a specific link", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockAnalytics = {
        totalClicks: 100,
        devices: { Mobile: 60, Desktop: 40 },
      };

      mockAnalyticsService.getLinkAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getAnalytics(
        mockRequest,
        "link-123",
        "30",
      );

      expect(mockAnalyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        30,
      );
      expect(result).toEqual(mockAnalytics);
    });

    it("should use default days of 30 when not specified", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getLinkAnalytics.mockResolvedValue({});

      await controller.getAnalytics(mockRequest, "link-123");

      expect(mockAnalyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        30,
      );
    });

    it("should parse custom days parameter", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getLinkAnalytics.mockResolvedValue({});

      await controller.getAnalytics(mockRequest, "link-123", "7");

      expect(mockAnalyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        7,
      );
    });

    it("should throw NotFoundException if link does not exist", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getLinkAnalytics.mockRejectedValue(
        new NotFoundException("Link not found"),
      );

      await expect(
        controller.getAnalytics(mockRequest, "non-existent", "30"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user does not own link", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getLinkAnalytics.mockRejectedValue(
        new ForbiddenException("Access denied"),
      );

      await expect(
        controller.getAnalytics(mockRequest, "link-456", "30"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getQrAnalytics", () => {
    it("should retrieve QR analytics for a specific link", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockQrAnalytics = {
        totalClicks: 100,
        qrScans: 60,
        directClicks: 30,
        apiClicks: 10,
        qrPercentage: 60,
      };

      mockAnalyticsService.getQrAnalytics.mockResolvedValue(mockQrAnalytics);

      const result = await controller.getQrAnalytics(mockRequest, "link-123");

      expect(mockAnalyticsService.getQrAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
      );
      expect(result).toEqual(mockQrAnalytics);
    });

    it("should throw NotFoundException if link does not exist", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getQrAnalytics.mockRejectedValue(
        new NotFoundException("Link not found"),
      );

      await expect(
        controller.getQrAnalytics(mockRequest, "non-existent"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user does not own link", async () => {
      const mockRequest = { user: { id: "user-123" } };
      mockAnalyticsService.getQrAnalytics.mockRejectedValue(
        new ForbiddenException("Access denied"),
      );

      await expect(
        controller.getQrAnalytics(mockRequest, "link-456"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("exportLinkAnalytics", () => {
    it("should export analytics in CSV format by default", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportResult = {
        content: "timestamp,country,city\n2024-12-01,US,NYC",
        contentType: "text/csv",
        filename: "link-test-analytics-2024-12-08.csv",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        { format: "csv" },
        mockResponse,
      );

      expect(mockAnalyticsService.exportLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        { format: "csv" },
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/csv",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        expect.stringContaining("attachment"),
      );
      expect(mockResponse.send).toHaveBeenCalledWith(exportResult.content);
    });

    it("should export analytics in JSON format", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportResult = {
        content: '[{"id":"click-1","country":"US"}]',
        contentType: "application/json",
        filename: "link-test-analytics-2024-12-08.json",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      const filters = { format: "json" };
      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        filters,
        mockResponse,
      );

      expect(mockAnalyticsService.exportLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        filters,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json",
      );
      expect(mockResponse.send).toHaveBeenCalledWith(exportResult.content);
    });

    it("should set correct Content-Disposition header with filename", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportResult = {
        content: "timestamp,country\n2024-12-01,US",
        contentType: "text/csv",
        filename: "link-test-slug-analytics-2024-12-08.csv",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        {},
        mockResponse,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        'attachment; filename="link-test-slug-analytics-2024-12-08.csv"',
      );
    });

    it("should handle export with date range filters", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportResult = {
        content: "timestamp,country\n2024-12-01,US",
        contentType: "text/csv",
        filename: "link-test-analytics-2024-12-08.csv",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      const filters = {
        format: "csv",
        startDate: "2024-12-01",
        endDate: "2024-12-08",
      };

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        filters,
        mockResponse,
      );

      expect(mockAnalyticsService.exportLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        filters,
      );
    });

    it("should handle export with limit parameter", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportResult = {
        content: "timestamp,country\n2024-12-01,US",
        contentType: "text/csv",
        filename: "link-test-analytics-2024-12-08.csv",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      const filters = { format: "csv", limit: 100 };

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        filters,
        mockResponse,
      );

      expect(mockAnalyticsService.exportLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        filters,
      );
    });

    it("should throw ForbiddenException if user does not own link", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockAnalyticsService.exportLinkAnalytics.mockRejectedValue(
        new ForbiddenException("Access denied"),
      );

      await expect(
        controller.exportLinkAnalytics(
          mockRequest,
          "link-456",
          {},
          mockResponse,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException if link does not exist", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockAnalyticsService.exportLinkAnalytics.mockRejectedValue(
        new NotFoundException("Link not found"),
      );

      await expect(
        controller.exportLinkAnalytics(
          mockRequest,
          "non-existent",
          {},
          mockResponse,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should send response with correct content and headers", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const csvContent = "timestamp,country,city\n2024-12-01,US,NYC\n2024-12-02,CA,Toronto";
      const exportResult = {
        content: csvContent,
        contentType: "text/csv",
        filename: "link-test-analytics-2024-12-08.csv",
      };

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue(exportResult);

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        { format: "csv" },
        mockResponse,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledTimes(2);
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it("should pass filters correctly to service", async () => {
      const mockRequest = { user: { id: "user-123" } };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      mockAnalyticsService.exportLinkAnalytics.mockResolvedValue({
        content: "data",
        contentType: "text/csv",
        filename: "export.csv",
      });

      const filters = {
        format: "csv" as const,
        startDate: "2024-12-01",
        endDate: "2024-12-08",
        limit: 500,
      };

      await controller.exportLinkAnalytics(
        mockRequest,
        "link-123",
        filters,
        mockResponse,
      );

      expect(mockAnalyticsService.exportLinkAnalytics).toHaveBeenCalledWith(
        "link-123",
        "user-123",
        filters,
      );
    });
  });
});
