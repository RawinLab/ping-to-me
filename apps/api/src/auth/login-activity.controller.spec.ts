import { Test, TestingModule } from "@nestjs/testing";
import { LoginActivityController } from "./login-activity.controller";
import { LoginSecurityService } from "./login-security.service";

describe("LoginActivityController", () => {
  let controller: LoginActivityController;
  let loginSecurityService: LoginSecurityService;

  const mockLoginSecurityService = {
    getLoginActivity: jest.fn(),
    getFailedLoginActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginActivityController],
      providers: [
        {
          provide: LoginSecurityService,
          useValue: mockLoginSecurityService,
        },
      ],
    }).compile();

    controller = module.get<LoginActivityController>(LoginActivityController);
    loginSecurityService = module.get<LoginSecurityService>(
      LoginSecurityService,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getLoginActivity", () => {
    it("should return login activity for authenticated user", async () => {
      const mockUser = { email: "test@example.com" };
      const mockRequest = { user: mockUser };
      const mockQuery = { limit: 20, page: 1 };

      const mockResponse = {
        attempts: [
          {
            id: "1",
            email: "test@example.com",
            success: true,
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0",
            createdAt: new Date(),
            deviceInfo: "Chrome on macOS",
            device: "desktop",
            browser: "Chrome",
            os: "macOS",
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockLoginSecurityService.getLoginActivity.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getLoginActivity(mockRequest, mockQuery);

      expect(result).toEqual(mockResponse);
      expect(mockLoginSecurityService.getLoginActivity).toHaveBeenCalledWith(
        "test@example.com",
        1,
        20,
      );
    });

    it("should use default pagination values if not provided", async () => {
      const mockUser = { email: "test@example.com" };
      const mockRequest = { user: mockUser };
      const mockQuery = {};

      mockLoginSecurityService.getLoginActivity.mockResolvedValue({
        attempts: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await controller.getLoginActivity(mockRequest, mockQuery);

      expect(mockLoginSecurityService.getLoginActivity).toHaveBeenCalledWith(
        "test@example.com",
        1,
        20,
      );
    });
  });

  describe("getFailedLoginActivity", () => {
    it("should return only failed login attempts", async () => {
      const mockUser = { email: "test@example.com" };
      const mockRequest = { user: mockUser };
      const mockQuery = { limit: 10, page: 1 };

      const mockResponse = {
        attempts: [
          {
            id: "1",
            email: "test@example.com",
            success: false,
            ipAddress: "127.0.0.1",
            userAgent: "Mozilla/5.0",
            reason: "invalid_password",
            createdAt: new Date(),
            deviceInfo: "Chrome on macOS",
            device: "desktop",
            browser: "Chrome",
            os: "macOS",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockLoginSecurityService.getFailedLoginActivity.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getFailedLoginActivity(
        mockRequest,
        mockQuery,
      );

      expect(result).toEqual(mockResponse);
      expect(
        mockLoginSecurityService.getFailedLoginActivity,
      ).toHaveBeenCalledWith("test@example.com", 1, 10);
    });
  });
});
