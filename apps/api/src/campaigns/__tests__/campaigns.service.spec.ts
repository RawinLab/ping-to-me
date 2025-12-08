import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { CampaignsService } from "../campaigns.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

describe("CampaignsService", () => {
  let service: CampaignsService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  // Mock implementations
  const mockPrismaService = {
    campaign: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    clickEvent: {
      findMany: jest.fn(),
    },
    link: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logResourceEvent: jest.fn().mockResolvedValue(undefined),
    captureChanges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  // ==================== Helper Functions ====================

  const createMockCampaign = (overrides: any = {}) => ({
    id: "campaign-123",
    organizationId: "org-123",
    name: "Summer Campaign",
    description: "A test campaign",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-08-31"),
    status: "ACTIVE",
    goalType: "clicks",
    goalTarget: 1000,
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "summer_2024",
    utmTerm: "discount",
    utmContent: "banner",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockLink = (overrides: any = {}) => ({
    id: `link-${Math.random().toString(36).substr(2, 9)}`,
    slug: "test-link",
    title: "Test Link",
    organizationId: "org-123",
    userId: "user-123",
    originalUrl: "https://example.com",
    campaignId: "campaign-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      clicks: 5,
    },
    ...overrides,
  });

  const createMockClickEvent = (overrides: any = {}) => ({
    id: `click-${Math.random().toString(36).substr(2, 9)}`,
    linkId: "link-123",
    timestamp: new Date(),
    country: "US",
    device: "mobile",
    browser: "Chrome",
    referrer: "https://google.com",
    ...overrides,
  });

  // ==================== create method ====================

  describe("create", () => {
    it("should create campaign with basic fields", async () => {
      const data = {
        name: "Test Campaign",
        description: "Test Description",
      };

      const mockCampaign = createMockCampaign(data);
      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      const result = await service.create("user-123", "org-123", data);

      expect(result).toEqual(mockCampaign);
      expect(mockPrismaService.campaign.create).toHaveBeenCalledWith({
        data: {
          name: "Test Campaign",
          description: "Test Description",
          organizationId: "org-123",
          startDate: undefined,
          endDate: undefined,
          status: undefined,
          goalType: undefined,
          goalTarget: undefined,
          utmSource: undefined,
          utmMedium: undefined,
          utmCampaign: undefined,
          utmTerm: undefined,
          utmContent: undefined,
        },
      });
    });

    it("should create campaign with dates and status", async () => {
      const data = {
        name: "Scheduled Campaign",
        startDate: "2024-06-01T00:00:00Z",
        endDate: "2024-08-31T23:59:59Z",
        status: "SCHEDULED",
      };

      const mockCampaign = createMockCampaign(data);
      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      const result = await service.create("user-123", "org-123", data);

      expect(result).toEqual(mockCampaign);

      const createCall = (mockPrismaService.campaign.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.startDate).toEqual(new Date("2024-06-01T00:00:00Z"));
      expect(createCall.data.endDate).toEqual(new Date("2024-08-31T23:59:59Z"));
      expect(createCall.data.status).toBe("SCHEDULED");
    });

    it("should create campaign with UTM fields", async () => {
      const data = {
        name: "UTM Campaign",
        utmSource: "facebook",
        utmMedium: "social",
        utmCampaign: "fall_promo",
        utmTerm: "shoes",
        utmContent: "video",
      };

      const mockCampaign = createMockCampaign(data);
      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      const result = await service.create("user-123", "org-123", data);

      expect(result).toEqual(mockCampaign);

      const createCall = (mockPrismaService.campaign.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.utmSource).toBe("facebook");
      expect(createCall.data.utmMedium).toBe("social");
      expect(createCall.data.utmCampaign).toBe("fall_promo");
      expect(createCall.data.utmTerm).toBe("shoes");
      expect(createCall.data.utmContent).toBe("video");
    });

    it("should create campaign with goal settings", async () => {
      const data = {
        name: "Goal Campaign",
        goalType: "clicks",
        goalTarget: 500,
      };

      const mockCampaign = createMockCampaign(data);
      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      const result = await service.create("user-123", "org-123", data);

      expect(result).toEqual(mockCampaign);

      const createCall = (mockPrismaService.campaign.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.goalType).toBe("clicks");
      expect(createCall.data.goalTarget).toBe(500);
    });

    it("should log campaign creation audit event", async () => {
      const data = {
        name: "Test Campaign",
        description: "Test Description",
      };

      const mockCampaign = createMockCampaign(data);
      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      await service.create("user-123", "org-123", data);

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "campaign.created",
        "Campaign",
        mockCampaign.id,
        {
          details: {
            name: mockCampaign.name,
            description: mockCampaign.description,
            status: mockCampaign.status,
          },
        }
      );
    });

    it("should handle audit log errors gracefully (fire and forget)", async () => {
      const data = { name: "Test Campaign" };
      const mockCampaign = createMockCampaign(data);

      (mockPrismaService.campaign.create as jest.Mock).mockResolvedValue(
        mockCampaign
      );
      (mockAuditService.logResourceEvent as jest.Mock).mockRejectedValue(
        new Error("Audit error")
      );

      const result = await service.create("user-123", "org-123", data);

      expect(result).toEqual(mockCampaign);
    });
  });

  // ==================== findAll method ====================

  describe("findAll", () => {
    it("should retrieve all campaigns for organization ordered by creation date", async () => {
      const mockCampaigns = [
        createMockCampaign({ id: "campaign-1" }),
        createMockCampaign({ id: "campaign-2" }),
        createMockCampaign({ id: "campaign-3" }),
      ];

      (mockPrismaService.campaign.findMany as jest.Mock).mockResolvedValue(
        mockCampaigns
      );

      const result = await service.findAll("user-123", "org-123");

      expect(result).toEqual(mockCampaigns);
      expect(mockPrismaService.campaign.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-123",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { links: true },
          },
        },
      });
    });

    it("should return empty array when no campaigns exist", async () => {
      (mockPrismaService.campaign.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll("user-123", "org-123");

      expect(result).toEqual([]);
    });

    it("should include link count in response", async () => {
      const mockCampaigns = [
        {
          ...createMockCampaign(),
          _count: { links: 5 },
        },
      ];

      (mockPrismaService.campaign.findMany as jest.Mock).mockResolvedValue(
        mockCampaigns
      );

      const result = await service.findAll("user-123", "org-123");

      expect(result[0]._count.links).toBe(5);
    });
  });

  // ==================== update method ====================

  describe("update", () => {
    it("should update campaign with new values", async () => {
      const before = createMockCampaign({ name: "Old Name" });
      const updated = createMockCampaign({ name: "New Name" });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        before
      );
      (mockPrismaService.campaign.update as jest.Mock).mockResolvedValue(
        updated
      );
      (mockAuditService.captureChanges as jest.Mock).mockReturnValue({
        name: { from: "Old Name", to: "New Name" },
      });

      const result = await service.update("user-123", "campaign-123", {
        name: "New Name",
      });

      expect(result).toEqual(updated);
      expect(mockPrismaService.campaign.update).toHaveBeenCalledWith({
        where: { id: "campaign-123" },
        data: {
          name: "New Name",
          description: undefined,
          startDate: undefined,
          endDate: undefined,
          status: undefined,
          goalType: undefined,
          goalTarget: undefined,
          utmSource: undefined,
          utmMedium: undefined,
          utmCampaign: undefined,
          utmTerm: undefined,
          utmContent: undefined,
        },
      });
    });

    it("should capture and log changes in audit event", async () => {
      const before = createMockCampaign({ name: "Old Name", status: "ACTIVE" });
      const updated = createMockCampaign({
        name: "New Name",
        status: "PAUSED",
      });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        before
      );
      (mockPrismaService.campaign.update as jest.Mock).mockResolvedValue(
        updated
      );

      const changes = {
        name: { from: "Old Name", to: "New Name" },
        status: { from: "ACTIVE", to: "PAUSED" },
      };
      (mockAuditService.captureChanges as jest.Mock).mockReturnValue(changes);

      await service.update("user-123", "campaign-123", {
        name: "New Name",
        status: "PAUSED",
      });

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        "user-123",
        before.organizationId,
        "campaign.updated",
        "Campaign",
        updated.id,
        {
          changes,
          details: {
            name: updated.name,
            status: updated.status,
          },
        }
      );
    });

    it("should handle update with dates", async () => {
      const before = createMockCampaign();
      const updated = createMockCampaign({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        before
      );
      (mockPrismaService.campaign.update as jest.Mock).mockResolvedValue(
        updated
      );
      (mockAuditService.captureChanges as jest.Mock).mockReturnValue({});

      const result = await service.update("user-123", "campaign-123", {
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });

      expect(result).toEqual(updated);

      const updateCall = (mockPrismaService.campaign.update as jest.Mock).mock
        .calls[0][0];
      expect(updateCall.data.startDate).toEqual(new Date("2025-01-01"));
      expect(updateCall.data.endDate).toEqual(new Date("2025-12-31"));
    });

    it("should not log audit if campaign not found", async () => {
      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      (mockPrismaService.campaign.update as jest.Mock).mockResolvedValue({
        id: "campaign-123",
      });

      await service.update("user-123", "campaign-123", { name: "New Name" });

      expect(mockAuditService.logResourceEvent).not.toHaveBeenCalled();
    });
  });

  // ==================== remove method ====================

  describe("remove", () => {
    it("should delete campaign and log audit event", async () => {
      const campaign = createMockCampaign();

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.campaign.delete as jest.Mock).mockResolvedValue(
        campaign
      );

      const result = await service.remove("user-123", "campaign-123");

      expect(result).toEqual(campaign);
      expect(mockPrismaService.campaign.delete).toHaveBeenCalledWith({
        where: { id: "campaign-123" },
      });
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        "user-123",
        campaign.organizationId,
        "campaign.deleted",
        "Campaign",
        campaign.id,
        {
          details: {
            name: campaign.name,
          },
        }
      );
    });

    it("should not log audit if campaign not found", async () => {
      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        null
      );
      (mockPrismaService.campaign.delete as jest.Mock).mockResolvedValue({
        id: "campaign-123",
      });

      await service.remove("user-123", "campaign-123");

      expect(mockAuditService.logResourceEvent).not.toHaveBeenCalled();
    });
  });

  // ==================== getAnalytics method ====================

  describe("getAnalytics", () => {
    it("should throw NotFoundException when campaign does not exist", async () => {
      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        service.getAnalytics("user-123", "nonexistent-campaign")
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getAnalytics("user-123", "nonexistent-campaign")
      ).rejects.toThrow("Campaign not found");
    });

    it("should aggregate clicks from all campaign links", async () => {
      const campaign = createMockCampaign({
        links: [
          createMockLink({ id: "link-1", _count: { clicks: 10 } }),
          createMockLink({ id: "link-2", _count: { clicks: 15 } }),
          createMockLink({ id: "link-3", _count: { clicks: 5 } }),
        ],
      });

      const clicks = [
        createMockClickEvent({ linkId: "link-1", timestamp: new Date() }),
        createMockClickEvent({ linkId: "link-1", timestamp: new Date() }),
        createMockClickEvent({ linkId: "link-2", timestamp: new Date() }),
      ];

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.totalClicks).toBe(3);
      expect(result.totalLinks).toBe(3);
    });

    it("should return empty results for campaign with no links", async () => {
      const campaign = createMockCampaign({ links: [] });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.totalLinks).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.topLinks).toEqual([]);
      expect(result.clicksByDate).toEqual([]);
      expect(result.clicksByCountry).toEqual([]);
    });

    it("should group clicks by date for last 30 days", async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const campaign = createMockCampaign({
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = [
        createMockClickEvent({ linkId: "link-1", timestamp: new Date(now) }),
        createMockClickEvent({
          linkId: "link-1",
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        }),
        createMockClickEvent({
          linkId: "link-1",
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        }),
      ];

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.clicksByDate).toContainEqual({ date: today, count: 1 });
      expect(result.clicksByDate).toContainEqual({ date: yesterday, count: 2 });
    });

    it("should exclude clicks older than 30 days from date grouping", async () => {
      const now = new Date();
      const thirtyOneDaysAgo = new Date(
        now.getTime() - 31 * 24 * 60 * 60 * 1000
      );

      const campaign = createMockCampaign({
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = [
        createMockClickEvent({ linkId: "link-1", timestamp: new Date(now) }),
        createMockClickEvent({
          linkId: "link-1",
          timestamp: thirtyOneDaysAgo,
        }),
      ];

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      // Should only have 1 entry for today, not the old click
      expect(result.clicksByDate).toHaveLength(1);
    });

    it("should return top performing links sorted by clicks", async () => {
      const campaign = createMockCampaign({
        links: [
          createMockLink({
            id: "link-1",
            slug: "slug-1",
            title: "Link 1",
            _count: { clicks: 50 },
          }),
          createMockLink({
            id: "link-2",
            slug: "slug-2",
            title: "Link 2",
            _count: { clicks: 100 },
          }),
          createMockLink({
            id: "link-3",
            slug: "slug-3",
            title: "Link 3",
            _count: { clicks: 25 },
          }),
        ],
      });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.topLinks).toHaveLength(3);
      expect(result.topLinks[0].id).toBe("link-2");
      expect(result.topLinks[0].clicks).toBe(100);
      expect(result.topLinks[1].id).toBe("link-1");
      expect(result.topLinks[1].clicks).toBe(50);
      expect(result.topLinks[2].id).toBe("link-3");
      expect(result.topLinks[2].clicks).toBe(25);
    });

    it("should limit top links to 10", async () => {
      const links = Array(15)
        .fill(null)
        .map((_, i) =>
          createMockLink({
            id: `link-${i}`,
            slug: `slug-${i}`,
            title: `Link ${i}`,
            _count: { clicks: 100 - i },
          })
        );

      const campaign = createMockCampaign({ links });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.topLinks).toHaveLength(10);
      expect(result.topLinks[0].clicks).toBe(100);
      expect(result.topLinks[9].clicks).toBe(91);
    });

    it("should aggregate clicks by country", async () => {
      const campaign = createMockCampaign({
        links: [
          createMockLink({ id: "link-1", _count: { clicks: 0 } }),
          createMockLink({ id: "link-2", _count: { clicks: 0 } }),
        ],
      });

      const clicks = [
        createMockClickEvent({ country: "US", linkId: "link-1" }),
        createMockClickEvent({ country: "US", linkId: "link-1" }),
        createMockClickEvent({ country: "CA", linkId: "link-2" }),
        createMockClickEvent({ country: null, linkId: "link-1" }),
      ];

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.clicksByCountry).toContainEqual({ country: "US", count: 2 });
      expect(result.clicksByCountry).toContainEqual({ country: "CA", count: 1 });
      expect(result.clicksByCountry).toContainEqual({
        country: "Unknown",
        count: 1,
      });
    });

    it("should calculate goal progress percentage when goal is set", async () => {
      const campaign = createMockCampaign({
        goalType: "clicks",
        goalTarget: 1000,
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = Array(500)
        .fill(null)
        .map(() => createMockClickEvent({ linkId: "link-1" }));

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.goalProgress).toBeDefined();
      expect(result.goalProgress.type).toBe("clicks");
      expect(result.goalProgress.target).toBe(1000);
      expect(result.goalProgress.current).toBe(500);
      expect(result.goalProgress.percentage).toBe(50);
    });

    it("should cap goal progress percentage at 100", async () => {
      const campaign = createMockCampaign({
        goalType: "clicks",
        goalTarget: 100,
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = Array(200)
        .fill(null)
        .map(() => createMockClickEvent({ linkId: "link-1" }));

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.goalProgress.percentage).toBe(100);
    });

    it("should round goal progress percentage", async () => {
      const campaign = createMockCampaign({
        goalType: "clicks",
        goalTarget: 3,
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = Array(2)
        .fill(null)
        .map(() => createMockClickEvent({ linkId: "link-1" }));

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.goalProgress.percentage).toBe(67);
    });

    it("should return null goal progress when no goal is set", async () => {
      const campaign = createMockCampaign({
        goalType: null,
        goalTarget: null,
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.goalProgress).toBeNull();
    });

    it("should return campaign basic info in analytics", async () => {
      const campaign = createMockCampaign({
        links: [],
      });

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.campaign).toBeDefined();
      expect(result.campaign.id).toBe(campaign.id);
      expect(result.campaign.name).toBe(campaign.name);
      expect(result.campaign.status).toBe(campaign.status);
      expect(result.campaign.startDate).toEqual(campaign.startDate);
      expect(result.campaign.endDate).toEqual(campaign.endDate);
    });

    it("should handle campaign with many links and clicks", async () => {
      const links = Array(50)
        .fill(null)
        .map((_, i) =>
          createMockLink({
            id: `link-${i}`,
            slug: `slug-${i}`,
            title: `Link ${i}`,
            _count: { clicks: 100 - i },
          })
        );

      const campaign = createMockCampaign({ links });

      // Create 1000 clicks spread across links
      const clicks = Array(1000)
        .fill(null)
        .map((_, i) =>
          createMockClickEvent({
            linkId: `link-${i % 50}`,
            timestamp: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ),
            country: ["US", "CA", "UK", "DE"][Math.floor(Math.random() * 4)],
          })
        );

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.totalLinks).toBe(50);
      expect(result.totalClicks).toBe(1000);
      expect(result.topLinks).toHaveLength(10);
      expect(result.clicksByCountry.length).toBeGreaterThan(0);
    });

    it("should calculate uniqueClicks (simplified as total for now)", async () => {
      const campaign = createMockCampaign({
        links: [createMockLink({ id: "link-1", _count: { clicks: 0 } })],
      });

      const clicks = Array(5)
        .fill(null)
        .map(() => createMockClickEvent({ linkId: "link-1" }));

      (mockPrismaService.campaign.findUnique as jest.Mock).mockResolvedValue(
        campaign
      );
      (mockPrismaService.clickEvent.findMany as jest.Mock).mockResolvedValue(
        clicks
      );

      const result = await service.getAnalytics("user-123", "campaign-123");

      expect(result.uniqueClicks).toBe(5);
    });
  });
});
