import { Test, TestingModule } from "@nestjs/testing";
import { LoginSecurityService } from "../login-security.service";
import { PrismaService } from "../../prisma/prisma.service";
import { Request } from "express";

describe("LoginSecurityService", () => {
  let service: LoginSecurityService;
  let prisma: PrismaService;

  const mockPrismaService = {
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginSecurityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LoginSecurityService>(LoginSecurityService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("logLoginAttempt", () => {
    it("should log a successful login attempt", async () => {
      const mockRequest = {
        ip: "192.168.1.1",
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      } as unknown as Request;

      await service.logLoginAttempt("test@example.com", true, mockRequest);

      expect(mockPrismaService.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          success: true,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          reason: undefined,
        },
      });
    });

    it("should log a failed login attempt with reason", async () => {
      const mockRequest = {
        ip: "192.168.1.1",
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      } as unknown as Request;

      await service.logLoginAttempt(
        "test@example.com",
        false,
        mockRequest,
        "invalid_password"
      );

      expect(mockPrismaService.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          success: false,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          reason: "invalid_password",
        },
      });
    });

    it("should extract IP from X-Forwarded-For header", async () => {
      const mockRequest = {
        headers: {
          "x-forwarded-for": "203.0.113.1, 192.168.1.1",
          "user-agent": "Mozilla/5.0",
        },
      } as unknown as Request;

      await service.logLoginAttempt("test@example.com", true, mockRequest);

      expect(mockPrismaService.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          success: true,
          ipAddress: "203.0.113.1",
          userAgent: "Mozilla/5.0",
          reason: undefined,
        },
      });
    });
  });

  describe("getFailedAttemptCount", () => {
    it("should count failed attempts in the last N minutes", async () => {
      mockPrismaService.loginAttempt.count.mockResolvedValue(3);

      const count = await service.getFailedAttemptCount("test@example.com", 30);

      expect(count).toBe(3);
      expect(mockPrismaService.loginAttempt.count).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          success: false,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it("should return 0 when no failed attempts", async () => {
      mockPrismaService.loginAttempt.count.mockResolvedValue(0);

      const count = await service.getFailedAttemptCount("test@example.com", 30);

      expect(count).toBe(0);
    });
  });

  describe("checkAccountLocked", () => {
    beforeEach(() => {
      // Mock user with organization settings
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        memberships: [
          {
            organization: {
              settings: {
                maxLoginAttempts: 5,
                lockoutDuration: 30,
              },
            },
          },
        ],
      });
    });

    it("should return unlocked when failed attempts below threshold", async () => {
      mockPrismaService.loginAttempt.count.mockResolvedValue(2);

      const result = await service.checkAccountLocked("test@example.com");

      expect(result.locked).toBe(false);
      expect(result.remainingMinutes).toBeUndefined();
    });

    it("should return locked when failed attempts exceed threshold", async () => {
      const now = new Date();
      const oldestAttempt = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      mockPrismaService.loginAttempt.count.mockResolvedValue(5);
      mockPrismaService.loginAttempt.findFirst.mockResolvedValue({
        id: "attempt-1",
        email: "test@example.com",
        success: false,
        createdAt: oldestAttempt,
      });

      const result = await service.checkAccountLocked("test@example.com");

      expect(result.locked).toBe(true);
      expect(result.remainingMinutes).toBeGreaterThan(0);
      expect(result.remainingMinutes).toBeLessThanOrEqual(20);
      expect(result.lockedUntil).toBeInstanceOf(Date);
    });

    it("should use default settings when user has no organization", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        memberships: [],
      });
      mockPrismaService.loginAttempt.count.mockResolvedValue(3);

      const result = await service.checkAccountLocked("test@example.com");

      expect(result.locked).toBe(false);
      // Should use default values: maxLoginAttempts=5, lockoutDuration=30
    });

    it("should use default settings when organization has no settings", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        memberships: [
          {
            organization: {
              settings: null,
            },
          },
        ],
      });
      mockPrismaService.loginAttempt.count.mockResolvedValue(3);

      const result = await service.checkAccountLocked("test@example.com");

      expect(result.locked).toBe(false);
    });
  });

  describe("getLoginActivity", () => {
    it("should return paginated login activity", async () => {
      const mockAttempts = [
        {
          id: "attempt-1",
          email: "test@example.com",
          success: true,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          location: null,
          reason: null,
          createdAt: new Date(),
        },
        {
          id: "attempt-2",
          email: "test@example.com",
          success: false,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          location: null,
          reason: "invalid_password",
          createdAt: new Date(),
        },
      ];

      mockPrismaService.loginAttempt.findMany.mockResolvedValue(mockAttempts);
      mockPrismaService.loginAttempt.count.mockResolvedValue(42);

      const result = await service.getLoginActivity("test@example.com", 1, 20);

      // Check that results have the expected structure with device fields
      expect(result.attempts).toHaveLength(2);
      expect(result.attempts[0]).toEqual(
        expect.objectContaining({
          id: "attempt-1",
          email: "test@example.com",
          success: true,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          location: null,
          reason: null,
          createdAt: expect.any(Date),
        })
      );
      // Verify device fields are present (parsed from user agent)
      expect(result.attempts[0]).toHaveProperty("deviceInfo");
      expect(result.attempts[0]).toHaveProperty("device");
      expect(result.attempts[0]).toHaveProperty("browser");
      expect(result.attempts[0]).toHaveProperty("os");

      expect(result.total).toBe(42);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(3);
    });

    it("should handle pagination correctly", async () => {
      mockPrismaService.loginAttempt.findMany.mockResolvedValue([]);
      mockPrismaService.loginAttempt.count.mockResolvedValue(100);

      await service.getLoginActivity("test@example.com", 3, 25);

      expect(mockPrismaService.loginAttempt.findMany).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        orderBy: { createdAt: "desc" },
        take: 25,
        skip: 50, // (3-1) * 25
      });
    });
  });

  describe("getFailedLoginActivity", () => {
    it("should return only failed login attempts", async () => {
      const mockAttempts = [
        {
          id: "attempt-1",
          email: "test@example.com",
          success: false,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          location: null,
          reason: "invalid_password",
          createdAt: new Date(),
        },
      ];

      mockPrismaService.loginAttempt.findMany.mockResolvedValue(mockAttempts);
      mockPrismaService.loginAttempt.count.mockResolvedValue(5);

      const result = await service.getFailedLoginActivity(
        "test@example.com",
        1,
        20
      );

      // Check that results have the expected structure with device fields
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0]).toEqual(
        expect.objectContaining({
          id: "attempt-1",
          email: "test@example.com",
          success: false,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          location: null,
          reason: "invalid_password",
          createdAt: expect.any(Date),
        })
      );
      // Verify device fields are present (parsed from user agent)
      expect(result.attempts[0]).toHaveProperty("deviceInfo");
      expect(result.attempts[0]).toHaveProperty("device");
      expect(result.attempts[0]).toHaveProperty("browser");
      expect(result.attempts[0]).toHaveProperty("os");

      expect(result.total).toBe(5);
      expect(mockPrismaService.loginAttempt.findMany).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
          success: false,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });
    });
  });
});
