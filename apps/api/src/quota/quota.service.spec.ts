import { Test, TestingModule } from "@nestjs/testing";
import { QuotaService, QuotaResource, QuotaCheckResult } from "./quota.service";
import { PrismaService } from "../prisma/prisma.service";

describe("QuotaService", () => {
  let service: QuotaService;
  let prisma: PrismaService;

  const mockPrismaService = {
    planDefinition: {
      findUnique: jest.fn(),
    },
    usageTracking: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    usageEvent: {
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QuotaService>(QuotaService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentYearMonth", () => {
    it("should return current year-month in YYYY-MM format", () => {
      const result = service.getCurrentYearMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should match the current date", () => {
      const now = new Date();
      const expectedMonth = String(now.getMonth() + 1).padStart(2, "0");
      const result = service.getCurrentYearMonth();
      expect(result).toContain(`${now.getFullYear()}-${expectedMonth}`);
    });

    it("should pad month with leading zero", () => {
      const result = service.getCurrentYearMonth();
      const parts = result.split("-");
      expect(parts[1].length).toBe(2);
      expect(parseInt(parts[1])).toBeGreaterThanOrEqual(1);
      expect(parseInt(parts[1])).toBeLessThanOrEqual(12);
    });
  });

  describe("getPlanLimits", () => {
    it("should return limits from database when plan exists", async () => {
      const dbPlan = {
        name: "pro",
        linksPerMonth: 1000,
        customDomains: 5,
        teamMembers: 10,
        apiCallsPerMonth: 10000,
        analyticsRetentionDays: 90,
      };

      mockPrismaService.planDefinition.findUnique.mockResolvedValue(dbPlan);

      const result = await service.getPlanLimits("pro");

      expect(result.linksPerMonth).toBe(1000);
      expect(result.customDomains).toBe(5);
      expect(result.teamMembers).toBe(10);
      expect(result.apiCallsPerMonth).toBe(10000);
      expect(result.analyticsRetentionDays).toBe(90);
      expect(mockPrismaService.planDefinition.findUnique).toHaveBeenCalledWith({
        where: { name: "pro" },
      });
    });

    it("should return fallback defaults when plan not in database", async () => {
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);

      const result = await service.getPlanLimits("free");

      expect(result.linksPerMonth).toBe(50);
      expect(result.customDomains).toBe(1);
      expect(result.teamMembers).toBe(1);
      expect(result.apiCallsPerMonth).toBe(0);
      expect(result.analyticsRetentionDays).toBe(30);
    });

    it("should return pro plan defaults", async () => {
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);

      const result = await service.getPlanLimits("pro");

      expect(result.linksPerMonth).toBe(1000);
      expect(result.customDomains).toBe(5);
      expect(result.teamMembers).toBe(10);
      expect(result.apiCallsPerMonth).toBe(10000);
      expect(result.analyticsRetentionDays).toBe(90);
    });

    it("should return enterprise unlimited limits", async () => {
      mockPrismaService.planDefinition.findUnique.mockResolvedValue({
        name: "enterprise",
        linksPerMonth: -1,
        customDomains: -1,
        teamMembers: -1,
        apiCallsPerMonth: -1,
        analyticsRetentionDays: 730,
      });

      const result = await service.getPlanLimits("enterprise");

      expect(result.linksPerMonth).toBe(-1);
      expect(result.customDomains).toBe(-1);
      expect(result.teamMembers).toBe(-1);
      expect(result.apiCallsPerMonth).toBe(-1);
      expect(result.analyticsRetentionDays).toBe(730);
    });

    it("should handle case-insensitive plan names", async () => {
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);

      const result = await service.getPlanLimits("FREE");

      expect(result.linksPerMonth).toBe(50);
      expect(mockPrismaService.planDefinition.findUnique).toHaveBeenCalledWith({
        where: { name: "free" },
      });
    });

    it("should return free defaults for unknown plan", async () => {
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);

      const result = await service.getPlanLimits("unknown-plan");

      expect(result.linksPerMonth).toBe(50);
      expect(result.customDomains).toBe(1);
    });
  });

  describe("getOrgWithPlan", () => {
    it("should return organization with member and domain counts", async () => {
      const mockOrg = {
        id: "org-1",
        plan: "FREE",
        _count: {
          members: 3,
          domains: 2,
        },
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.getOrgWithPlan("org-1");

      expect(result.id).toBe("org-1");
      expect(result._count.members).toBe(3);
      expect(result._count.domains).toBe(2);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: "org-1" },
        include: {
          _count: {
            select: {
              members: true,
              domains: true,
            },
          },
        },
      });
    });

    it("should return null when organization not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      const result = await service.getOrgWithPlan("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getCurrentUsage", () => {
    it("should return current month usage with defaults for missing data", async () => {
      const yearMonth = service.getCurrentYearMonth();

      mockPrismaService.usageTracking.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        _count: {
          members: 1,
          domains: 0,
        },
      });

      const result = await service.getCurrentUsage("org-1");

      expect(result.links).toBe(0);
      expect(result.members).toBe(1);
      expect(result.domains).toBe(0);
      expect(result.apiCalls).toBe(0);
    });

    it("should return actual usage when records exist", async () => {
      const yearMonth = service.getCurrentYearMonth();

      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 25,
        apiCalls: 500,
      });
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        _count: {
          members: 5,
          domains: 3,
        },
      });

      const result = await service.getCurrentUsage("org-1");

      expect(result.links).toBe(25);
      expect(result.members).toBe(5);
      expect(result.domains).toBe(3);
      expect(result.apiCalls).toBe(500);
    });

    it("should query for current year-month", async () => {
      const yearMonth = service.getCurrentYearMonth();

      mockPrismaService.usageTracking.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        _count: { members: 1, domains: 0 },
      });

      await service.getCurrentUsage("org-1");

      expect(mockPrismaService.usageTracking.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
      });
    });
  });

  describe("checkQuota", () => {
    const mockOrg = {
      id: "org-1",
      plan: "FREE",
      _count: {
        members: 1,
        domains: 0,
      },
    };

    const mockFreePlan = {
      linksPerMonth: 50,
      customDomains: 1,
      teamMembers: 1,
      apiCallsPerMonth: 0,
      analyticsRetentionDays: 30,
    };

    beforeEach(() => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(mockFreePlan);
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 0,
        apiCalls: 0,
      });
    });

    it("should return allowed: true when under limit for links", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 25,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(25);
      expect(result.limit).toBe(50);
      expect(result.remaining).toBe(25);
      expect(result.percentUsed).toBe(50);
    });

    it("should return allowed: false when at limit", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 50,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(50);
      expect(result.remaining).toBe(0);
      expect(result.percentUsed).toBe(100);
    });

    it("should return allowed: false when over limit", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 60,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(60);
      expect(result.remaining).toBe(0);
      expect(result.percentUsed).toBe(120);
    });

    it("should return unlimited: true for enterprise plan with links", async () => {
      const enterprisePlan = {
        linksPerMonth: -1,
        customDomains: -1,
        teamMembers: -1,
        apiCallsPerMonth: -1,
        analyticsRetentionDays: 730,
      };

      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        plan: "ENTERPRISE",
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(enterprisePlan);
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 10000,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(true);
      expect(result.unlimited).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.remaining).toBe(-1);
      expect(result.percentUsed).toBe(0);
    });

    it("should check domains quota correctly", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        _count: {
          members: 1,
          domains: 1,
        },
      });

      const result = await service.checkQuota("org-1", "domains");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(1);
      expect(result.limit).toBe(1);
    });

    it("should check members quota correctly", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        _count: {
          members: 2,
          domains: 0,
        },
      });

      const result = await service.checkQuota("org-1", "members");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(2);
      expect(result.limit).toBe(1);
    });

    it("should check api_calls quota correctly", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 0,
        apiCalls: 5000,
      });

      const result = await service.checkQuota("org-1", "api_calls");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(5000);
      expect(result.limit).toBe(0);
    });

    it("should return allowed: false when organization not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      const result = await service.checkQuota("non-existent", "links");

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(0);
      expect(result.limit).toBe(0);
      expect(result.percentUsed).toBe(100);
    });

    it("should calculate percentage correctly", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 15,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.percentUsed).toBe(30);
    });

    it("should round percentage to nearest integer", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 17,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.percentUsed).toBe(34);
    });
  });

  describe("incrementUsage", () => {
    it("should upsert usage tracking record for links", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.incrementUsage("org-1", "links");

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        create: {
          organizationId: "org-1",
          yearMonth,
          linksCreated: 1,
        },
        update: {
          linksCreated: { increment: 1 },
        },
      });
    });

    it("should increment by specified count", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.incrementUsage("org-1", "links", 5);

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ linksCreated: 5 }),
          update: expect.objectContaining({
            linksCreated: { increment: 5 },
          }),
        })
      );
    });

    it("should handle api_calls resource", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.incrementUsage("org-1", "api_calls", 10);

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        create: {
          organizationId: "org-1",
          yearMonth,
          apiCalls: 10,
        },
        update: {
          apiCalls: { increment: 10 },
        },
      });
    });

    it("should log usage event", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.incrementUsage("org-1", "links", 1);

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          userId: null,
          eventType: "links_created",
          resourceId: null,
          metadata: null,
        },
      });
    });

    it("should handle failed event logging gracefully", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockRejectedValue(new Error("DB error"));

      await expect(
        service.incrementUsage("org-1", "links")
      ).resolves.not.toThrow();
    });

    it("should default count to 1", async () => {
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.incrementUsage("org-1", "links");

      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ linksCreated: 1 }),
        })
      );
    });
  });

  describe("decrementUsage", () => {
    it("should decrement usage when record exists", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 10,
      });
      mockPrismaService.usageTracking.update.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.decrementUsage("org-1", "links", 3);

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.update).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        data: {
          linksCreated: 7,
        },
      });
    });

    it("should not go below zero", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 2,
      });
      mockPrismaService.usageTracking.update.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.decrementUsage("org-1", "links", 5);

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.update).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        data: {
          linksCreated: 0,
        },
      });
    });

    it("should handle case when usage record does not exist", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue(null);
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.decrementUsage("org-1", "links", 5);

      expect(mockPrismaService.usageTracking.update).not.toHaveBeenCalled();
    });

    it("should log usage event", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 10,
      });
      mockPrismaService.usageTracking.update.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.decrementUsage("org-1", "links", 1);

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          userId: null,
          eventType: "links_deleted",
          resourceId: null,
          metadata: null,
        },
      });
    });

    it("should default count to 1", async () => {
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 5,
      });
      mockPrismaService.usageTracking.update.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.decrementUsage("org-1", "links");

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.update).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        data: {
          linksCreated: 4,
        },
      });
    });
  });

  describe("logUsageEvent", () => {
    it("should create usage event with all fields", async () => {
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.logUsageEvent(
        "org-1",
        "link_created",
        "link-123",
        "user-123",
        { custom: "data" }
      );

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          userId: "user-123",
          eventType: "link_created",
          resourceId: "link-123",
          metadata: { custom: "data" },
        },
      });
    });

    it("should create event with null userId when not provided", async () => {
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.logUsageEvent("org-1", "link_created", "link-123");

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          userId: null,
          eventType: "link_created",
          resourceId: "link-123",
          metadata: null,
        },
      });
    });

    it("should create event with null resourceId when not provided", async () => {
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.logUsageEvent(
        "org-1",
        "plan_changed",
        null,
        "user-123"
      );

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          userId: "user-123",
          eventType: "plan_changed",
          resourceId: null,
          metadata: null,
        },
      });
    });

    it("should create event with null metadata when not provided", async () => {
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.logUsageEvent(
        "org-1",
        "link_created",
        "link-123",
        "user-123"
      );

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: null,
        }),
      });
    });
  });

  describe("getFullQuotaStatus", () => {
    const mockOrg = {
      id: "org-1",
      plan: "PRO",
      _count: {
        members: 5,
        domains: 2,
      },
    };

    const mockProPlan = {
      linksPerMonth: 1000,
      customDomains: 5,
      teamMembers: 10,
      apiCallsPerMonth: 10000,
      analyticsRetentionDays: 90,
    };

    beforeEach(() => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(mockProPlan);
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 250,
        apiCalls: 2000,
      });
    });

    it("should return full quota status for all resources", async () => {
      const result = await service.getFullQuotaStatus("org-1");

      expect(result.plan).toBe("PRO");
      expect(result.limits).toEqual(mockProPlan);
      expect(result.usage).toEqual({
        links: 250,
        domains: 2,
        members: 5,
        apiCalls: 2000,
      });
      expect(result.quotas).toHaveProperty("links");
      expect(result.quotas).toHaveProperty("domains");
      expect(result.quotas).toHaveProperty("members");
      expect(result.quotas).toHaveProperty("api_calls");
    });

    it("should calculate correct quota for each resource", async () => {
      const result = await service.getFullQuotaStatus("org-1");

      expect(result.quotas.links.allowed).toBe(true);
      expect(result.quotas.links.currentUsage).toBe(250);
      expect(result.quotas.links.limit).toBe(1000);
      expect(result.quotas.domains.allowed).toBe(true);
      expect(result.quotas.domains.currentUsage).toBe(2);
    });

    it("should throw error when organization not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.getFullQuotaStatus("non-existent")
      ).rejects.toThrow("Organization not found");
    });

    it("should include unlimited flag for enterprise resources", async () => {
      const enterprisePlan = {
        linksPerMonth: -1,
        customDomains: -1,
        teamMembers: -1,
        apiCallsPerMonth: -1,
        analyticsRetentionDays: 730,
      };

      mockPrismaService.organization.findUnique.mockResolvedValue({
        ...mockOrg,
        plan: "ENTERPRISE",
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(enterprisePlan);

      const result = await service.getFullQuotaStatus("org-1");

      expect(result.quotas.links.unlimited).toBe(true);
      expect(result.quotas.domains.unlimited).toBe(true);
    });
  });

  describe("getUsageHistory", () => {
    it("should return usage history ordered by yearMonth desc", async () => {
      const mockHistory = [
        { yearMonth: "2024-12", linksCreated: 45, apiCalls: 500 },
        { yearMonth: "2024-11", linksCreated: 38, apiCalls: 400 },
        { yearMonth: "2024-10", linksCreated: 50, apiCalls: 600 },
      ];

      mockPrismaService.usageTracking.findMany.mockResolvedValue(mockHistory);

      const result = await service.getUsageHistory("org-1", 12);

      expect(result).toHaveLength(3);
      expect(result[0].yearMonth).toBe("2024-12");
      expect(result[1].yearMonth).toBe("2024-11");
      expect(mockPrismaService.usageTracking.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { yearMonth: "desc" },
        take: 12,
      });
    });

    it("should respect months parameter", async () => {
      mockPrismaService.usageTracking.findMany.mockResolvedValue([]);

      await service.getUsageHistory("org-1", 6);

      expect(mockPrismaService.usageTracking.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { yearMonth: "desc" },
        take: 6,
      });
    });

    it("should default to 12 months", async () => {
      mockPrismaService.usageTracking.findMany.mockResolvedValue([]);

      await service.getUsageHistory("org-1");

      expect(mockPrismaService.usageTracking.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { yearMonth: "desc" },
        take: 12,
      });
    });

    it("should return empty array when no history exists", async () => {
      mockPrismaService.usageTracking.findMany.mockResolvedValue([]);

      const result = await service.getUsageHistory("org-1");

      expect(result).toEqual([]);
    });

    it("should return records with all fields", async () => {
      const mockHistory = [
        {
          id: "1",
          organizationId: "org-1",
          yearMonth: "2024-12",
          linksCreated: 45,
          apiCalls: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.usageTracking.findMany.mockResolvedValue(mockHistory);

      const result = await service.getUsageHistory("org-1");

      expect(result[0].id).toBe("1");
      expect(result[0].linksCreated).toBe(45);
      expect(result[0].apiCalls).toBe(500);
    });
  });

  describe("recalculateStaticUsage", () => {
    it("should upsert usage record ensuring it exists", async () => {
      const mockOrg = {
        id: "org-1",
        _count: {
          members: 5,
          domains: 2,
          links: 100,
        },
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});

      await service.recalculateStaticUsage("org-1");

      const yearMonth = service.getCurrentYearMonth();
      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith({
        where: {
          organizationId_yearMonth: { organizationId: "org-1", yearMonth },
        },
        create: {
          organizationId: "org-1",
          yearMonth,
          linksCreated: 0,
          apiCalls: 0,
        },
        update: {},
      });
    });

    it("should handle organization not found", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await service.recalculateStaticUsage("non-existent");

      expect(mockPrismaService.usageTracking.upsert).not.toHaveBeenCalled();
    });

    it("should fetch organization with link count", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        _count: { members: 1, domains: 1, links: 50 },
      });
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});

      await service.recalculateStaticUsage("org-1");

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: "org-1" },
        include: {
          _count: {
            select: {
              members: true,
              domains: true,
              links: true,
            },
          },
        },
      });
    });

    it("should create record with zero monthly counts", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        _count: { members: 2, domains: 1, links: 50 },
      });
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});

      await service.recalculateStaticUsage("org-1");

      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            linksCreated: 0,
            apiCalls: 0,
          }),
        })
      );
    });
  });

  describe("Edge cases and integration scenarios", () => {
    it("should handle organization with zero resources", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        plan: "FREE",
        _count: { members: 0, domains: 0 },
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 0,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(true);
      expect(result.percentUsed).toBe(0);
    });

    it("should handle very large usage numbers", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        plan: "PRO",
        _count: { members: 100, domains: 50 },
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue({
        linksPerMonth: 1000000,
        customDomains: 100,
        teamMembers: 100,
        apiCallsPerMonth: 1000000,
        analyticsRetentionDays: 90,
      });
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 500000,
        apiCalls: 500000,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.allowed).toBe(true);
      expect(result.percentUsed).toBe(50);
    });

    it("should handle percentage calculation edge case: 1/3", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        plan: "FREE",
        _count: { members: 1, domains: 0 },
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue(null);
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 17,
        apiCalls: 0,
      });

      const result = await service.checkQuota("org-1", "links");

      expect(result.percentUsed).toBe(34);
    });

    it("should handle zero limit gracefully", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: "org-1",
        plan: "FREE",
        _count: { members: 1, domains: 0 },
      });
      mockPrismaService.planDefinition.findUnique.mockResolvedValue({
        linksPerMonth: 50,
        customDomains: 1,
        teamMembers: 1,
        apiCallsPerMonth: 0,
        analyticsRetentionDays: 30,
      });
      mockPrismaService.usageTracking.findUnique.mockResolvedValue({
        linksCreated: 0,
        apiCalls: 5,
      });

      const result = await service.checkQuota("org-1", "api_calls");

      expect(result.allowed).toBe(false);
      expect(result.percentUsed).toBe(100);
    });
  });
});
