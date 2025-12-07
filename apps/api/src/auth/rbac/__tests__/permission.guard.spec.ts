import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionGuard } from "../permission.guard";
import { PermissionService } from "../permission.service";
import {
  PERMISSION_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  PermissionMetadata,
} from "../permission.decorator";

describe("PermissionGuard", () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;

  // Mock implementations
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPermissionService = {
    hasPermission: jest.fn(),
    checkResourceOwnership: jest.fn(),
    getUserRoleInOrg: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: PermissionService, useValue: mockPermissionService },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionService = module.get<PermissionService>(PermissionService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Helper function to create a mock ExecutionContext
   */
  const createMockContext = (overrides: any = {}): ExecutionContext => {
    const request = {
      user: { id: "user-123" },
      params: {},
      body: {},
      query: {},
      route: { path: "" },
      ...overrides,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  describe("canActivate() - Basic Tests", () => {
    it("should allow access when user has permission", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "link",
        "read",
        {
          ownerId: undefined,
          resourceId: undefined,
        },
      );
    });

    it("should deny access when user lacks permission", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "delete",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPermissionService.hasPermission).toHaveBeenCalled();
    });

    it("should return true when no permission decorator is set", async () => {
      mockReflector.getAllAndOverride.mockReturnValueOnce(undefined);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException on permission denial", async () => {
      const permission: PermissionMetadata = {
        resource: "organization",
        action: "update",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const error = await guard.canActivate(context).catch((e) => e);

      expect(error).toBeInstanceOf(ForbiddenException);
      expect(error.message).toContain("Insufficient permissions");
      expect(error.getResponse()).toEqual(
        expect.objectContaining({
          message: "Insufficient permissions for organization:update",
          details: {
            requiredPermission: "organization:update",
            userId: "user-123",
          },
        }),
      );
    });
  });

  describe("Organization ID Extraction Tests", () => {
    it("should extract orgId from route params :orgId", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-from-orgid" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-orgid",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from route params :organizationId", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { organizationId: "org-from-organizationid" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-organizationid",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from request body organizationId", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "create",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        body: { organizationId: "org-from-body" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-body",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from request body orgId", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "create",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        body: { orgId: "org-from-body-orgid" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-body-orgid",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from query params organizationId", async () => {
      const permission: PermissionMetadata = {
        resource: "analytics",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        query: { organizationId: "org-from-query" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-query",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from query params orgId", async () => {
      const permission: PermissionMetadata = {
        resource: "analytics",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        query: { orgId: "org-from-query-id" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-query-id",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should extract orgId from :id for organization routes", async () => {
      const permission: PermissionMetadata = {
        resource: "organization",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { id: "org-123" },
        route: { path: "/organizations/:id" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should prioritize :orgId over :organizationId", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-priority-test", organizationId: "org-ignored" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-priority-test",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should prioritize params over body over query", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-from-params" },
        body: { organizationId: "org-from-body" },
        query: { organizationId: "org-from-query" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-from-params",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should throw error when no orgId found", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);

      const context = createMockContext({
        params: {},
        body: {},
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        "Organization context required",
      );
    });
  });

  describe("Permission Metadata Tests", () => {
    it("should handle single permission metadata", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple permissions with OR logic", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "update" },
        { resource: "link", action: "delete" },
      ];

      mockReflector.getAllAndOverride.mockReturnValueOnce(permissions);
      // Fail on first, succeed on second (OR logic)
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
    });

    it("should deny if all permissions in OR condition fail", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "update" },
        { resource: "link", action: "delete" },
      ];

      mockReflector.getAllAndOverride.mockReturnValueOnce(permissions);
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should handle REQUIRE_ALL_PERMISSIONS_KEY with AND logic", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "read" },
        { resource: "analytics", action: "read" },
      ];

      // Mock the two calls to getAllAndOverride
      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined) // No PERMISSION_KEY
        .mockReturnValueOnce(permissions); // REQUIRE_ALL_PERMISSIONS_KEY

      // Both permissions granted (AND logic)
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
    });

    it("should deny if any permission in AND condition fails", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "read" },
        { resource: "analytics", action: "read" },
      ];

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(permissions);

      // First succeeds, second fails (AND logic)
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should deny if first permission in AND condition fails", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "read" },
        { resource: "analytics", action: "read" },
      ];

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(permissions);

      // First fails (AND logic - should not check second)
      mockPermissionService.hasPermission.mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      // Should only check first permission and return false
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration Tests", () => {
    it("should work with JwtAuthGuard (user is in request)", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "create",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        user: {
          id: "authenticated-user-456",
          email: "user@example.com",
          iat: 1234567890,
        },
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "authenticated-user-456",
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it("should throw ForbiddenException when user is missing", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      // Remove user from request
      context.switchToHttp().getRequest().user = undefined;

      await expect(guard.canActivate(context)).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("should handle own context permission checks", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "delete",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", id: "link-456" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.checkResourceOwnership).toHaveBeenCalledWith(
        "user-123",
        "link",
        "link-456",
      );
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "link",
        "delete",
        {
          ownerId: "user-123",
          resourceId: "link-456",
        },
      );
    });

    it("should deny own context when user does not own resource", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "delete",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123", id: "link-456" },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      // Should not call hasPermission if ownership check fails
      expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    });
  });

  describe("Resource ID Extraction Tests", () => {
    it("should extract resourceId from :id param", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "update",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", id: "resource-789" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "resource-789",
        }),
      );
    });

    it("should extract resourceId from :linkId param", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "update",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", linkId: "link-999" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "link-999",
        }),
      );
    });

    it("should extract resourceId from :biopageId param", async () => {
      const permission: PermissionMetadata = {
        resource: "biopage",
        action: "update",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", biopageId: "biopage-111" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "biopage-111",
        }),
      );
    });

    it("should extract resourceId from :campaignId param", async () => {
      const permission: PermissionMetadata = {
        resource: "campaign",
        action: "update",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", campaignId: "campaign-222" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "campaign-222",
        }),
      );
    });

    it("should extract resourceId from :tagId param", async () => {
      const permission: PermissionMetadata = {
        resource: "tag",
        action: "update",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", tagId: "tag-333" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "tag-333",
        }),
      );
    });

    it("should extract resourceId from :domainId param", async () => {
      const permission: PermissionMetadata = {
        resource: "domain",
        action: "update",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", domainId: "domain-444" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "domain-444",
        }),
      );
    });

    it("should extract resourceId from :apiKeyId param", async () => {
      const permission: PermissionMetadata = {
        resource: "api-key",
        action: "revoke",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", apiKeyId: "apikey-555" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "apikey-555",
        }),
      );
    });

    it("should prioritize :id when multiple resource params exist", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "update",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: {
          orgId: "org-123",
          id: "id-priority",
          linkId: "linkid-ignored",
        },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          resourceId: "id-priority",
        }),
      );
    });
  });

  describe("Context Permission Tests", () => {
    it("should handle null context (no restriction)", async () => {
      const permission: PermissionMetadata = {
        resource: "organization",
        action: "read",
        context: null,
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "organization",
        "read",
        {
          ownerId: undefined,
          resourceId: undefined,
        },
      );
    });

    it("should handle organization context", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
        context: "organization",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "link",
        "read",
        {
          ownerId: undefined,
          resourceId: undefined,
        },
      );
    });

    it("should pass ownerId when context is own", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "update",
        context: "own",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.checkResourceOwnership.mockResolvedValueOnce(true);
      mockPermissionService.hasPermission.mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123", id: "link-456" },
      });

      await guard.canActivate(context);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        "user-123",
        "org-123",
        "link",
        "update",
        {
          ownerId: "user-123",
          resourceId: "link-456",
        },
      );
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle when user is null", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const request = context.switchToHttp().getRequest();
      request.user = null;

      await expect(guard.canActivate(context)).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("should handle when user is undefined", async () => {
      const permission: PermissionMetadata = {
        resource: "link",
        action: "read",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const request = context.switchToHttp().getRequest();
      delete request.user;

      await expect(guard.canActivate(context)).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("should provide detailed error information on permission denial", async () => {
      const permission: PermissionMetadata = {
        resource: "organization",
        action: "update",
      };

      mockReflector.getAllAndOverride.mockReturnValueOnce(permission);
      mockPermissionService.hasPermission.mockResolvedValueOnce(false);

      const context = createMockContext({
        params: { orgId: "org-123" },
        user: { id: "user-999", email: "test@example.com" },
      });

      try {
        await guard.canActivate(context);
        fail("Should have thrown ForbiddenException");
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const response = error.getResponse();
        expect(response).toEqual({
          message: "Insufficient permissions for organization:update",
          error: "Forbidden",
          details: {
            requiredPermission: "organization:update",
            userId: "user-999",
          },
        });
      }
    });
  });

  describe("Multiple Permissions with Different Resources", () => {
    it("should handle OR condition with different resources", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "delete" },
        { resource: "team", action: "manage" },
      ];

      mockReflector.getAllAndOverride.mockReturnValueOnce(permissions);
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(false) // link:delete denied
        .mockResolvedValueOnce(true); // team:manage granted

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockPermissionService.hasPermission).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.anything(),
        "link",
        "delete",
        expect.anything(),
      );
      expect(mockPermissionService.hasPermission).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.anything(),
        "team",
        "manage",
        expect.anything(),
      );
    });

    it("should handle AND condition with different resources", async () => {
      const permissions: PermissionMetadata[] = [
        { resource: "link", action: "read" },
        { resource: "analytics", action: "read" },
      ];

      mockReflector.getAllAndOverride
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(permissions);

      mockPermissionService.hasPermission
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const context = createMockContext({
        params: { orgId: "org-123" },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockPermissionService.hasPermission).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        expect.anything(),
        "link",
        "read",
        expect.anything(),
      );
      expect(mockPermissionService.hasPermission).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.anything(),
        "analytics",
        "read",
        expect.anything(),
      );
    });
  });
});
