import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InvitationsService } from "../invitations.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { MailService } from "../../mail/mail.service";
import { MemberRole } from "@pingtome/database";
import * as crypto from "crypto";

describe("InvitationsService", () => {
  let service: InvitationsService;
  let prismaService: PrismaService;
  let auditService: AuditService;
  let mailService: MailService;

  // Mock implementations
  const mockPrismaService = {
    organizationInvitation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organizationMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockAuditService = {
    logTeamEvent: jest.fn().mockResolvedValue(undefined),
    logResourceEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockMailService = {
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
    mailService = module.get<MailService>(MailService);

    jest.clearAllMocks();

    // Setup default implementations for common mocks
    mockPrismaService.organizationMember.findUnique.mockImplementation((params) =>
      // If looking for inviter (has both userId and organizationId), return the inviter
      // If looking for existing member, return null by default
      Promise.resolve(null)
    );
  });

  // ==================== Helper Functions ====================

  const setupMocksForInvitation = (inviterId: string = "user-456", inviter: any = null) => {
    const defaultInviter = inviter || createMockMember({ role: MemberRole.OWNER });
    mockPrismaService.organizationMember.findUnique.mockImplementation(
      (params) => {
        // Return inviter when looking for inviter's membership
        if (params.where.userId_organizationId.userId === inviterId) {
          return Promise.resolve(defaultInviter);
        }
        // Return null when checking for existing member
        return Promise.resolve(null);
      }
    );
    mockPrismaService.user.findUnique.mockResolvedValue(null);
  };

  const createMockOrganization = (overrides: any = {}) => ({
    id: "org-123",
    name: "Test Organization",
    slug: "test-org",
    logo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockUser = (overrides: any = {}) => ({
    id: "user-123",
    email: "user@example.com",
    name: "Test User",
    password: "$2b$10$hashedpassword",
    avatarUrl: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockMember = (overrides: any = {}) => ({
    id: "member-123",
    userId: "user-123",
    organizationId: "org-123",
    role: MemberRole.OWNER,
    invitedById: "user-456",
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockInvitation = (overrides: any = {}) => {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    return {
      id: "invite-123",
      organizationId: "org-123",
      email: "invited@example.com",
      role: MemberRole.EDITOR,
      token,
      tokenHash,
      invitedById: "user-456",
      personalMessage: null,
      acceptedAt: null,
      declinedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  // ==================== Token Generation & Security ====================

  describe("Token Generation & Security", () => {
    it("should generate cryptographically secure tokens", async () => {
      const tokens = new Set();
      const tokenRegex = /^[A-Za-z0-9_-]+$/; // base64url format

      for (let i = 0; i < 10; i++) {
        jest.clearAllMocks();

        const organization = createMockOrganization();
        const inviter = createMockMember({ role: MemberRole.OWNER });
        const invitation = createMockInvitation();

        mockPrismaService.organization.findUnique.mockResolvedValue(
          organization
        );
        mockPrismaService.organizationMember.findUnique.mockImplementation(
          (params) => {
            // Return inviter when looking for inviter's membership
            if (params.where.userId_organizationId.userId === "user-456") {
              return Promise.resolve(inviter);
            }
            // Return null when checking for existing member
            return Promise.resolve(null);
          }
        );
        mockPrismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist
        mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
          null
        );
        mockPrismaService.organizationInvitation.create.mockResolvedValue({
          ...invitation,
          invitedBy: { name: "Inviter", email: "inviter@example.com" },
        });

        await service.createInvitation(
          "org-123",
          {
            email: `user${i}@example.com`,
            role: MemberRole.EDITOR,
          },
          "user-456"
        );

        const createdData = mockPrismaService.organizationInvitation.create
          .mock.calls[0][0].data;
        tokens.add(createdData.token);
        expect(createdData.token).toMatch(tokenRegex);
        expect(createdData.token.length).toBeGreaterThanOrEqual(43);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10);
    });

    it("should hash tokens before storage", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      await service.createInvitation(
        "org-123",
        {
          email: "test@example.com",
          role: MemberRole.EDITOR,
        },
        "user-456"
      );

      const createdData = mockPrismaService.organizationInvitation.create.mock
        .calls[0][0].data;
      const token = createdData.token;
      const tokenHash = createdData.tokenHash;

      // Token hash should be different from token
      expect(tokenHash).not.toBe(token);

      // Hash should be SHA-256 hex format (64 characters)
      expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);

      // Verify hash is correct
      const computedHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      expect(tokenHash).toBe(computedHash);
    });

    it("should use timing-safe comparison for token validation", async () => {
      const organization = createMockOrganization();
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const invitation = createMockInvitation({ token, tokenHash });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationMember.create.mockResolvedValue(
        createMockMember()
      );
      mockPrismaService.organizationInvitation.update.mockResolvedValue(
        invitation
      );

      // Should succeed with correct token
      const result = await service.acceptInvitation(token);
      expect(result).toBeDefined();

      // Should fail with incorrect token
      const wrongToken = crypto.randomBytes(32).toString("base64url");
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(wrongToken)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // ==================== Create Invitation ====================

  describe("createInvitation", () => {
    it("should create invitation with secure token", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const result = await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.EDITOR,
        },
        "user-456"
      );

      expect(mockPrismaService.organizationInvitation.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.email).toBe(invitation.email);
      expect(result.token).toBeUndefined(); // Token should not be returned
      expect(result.tokenHash).toBeUndefined(); // Hash should not be returned
    });

    it("should fail if organization does not exist", async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.createInvitation(
          "nonexistent-org",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createInvitation(
          "nonexistent-org",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow("Organization not found");
    });

    it("should fail if inviter is not a member of organization", async () => {
      const organization = createMockOrganization();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow("You are not a member of this organization");
    });

    it("should fail if inviter does not have permission to invite", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.VIEWER });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(
        inviter
      );

      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow("You do not have permission to invite members");
    });

    it("should prevent assigning OWNER role to non-OWNER inviter", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.ADMIN });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(
        inviter
      );

      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.OWNER,
          },
          "user-456"
        )
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.OWNER,
          },
          "user-456"
        )
      ).rejects.toThrow("Only owners can invite other owners");
    });

    it("should allow OWNER inviter to assign any role", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation({ role: MemberRole.OWNER });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const result = await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.OWNER,
        },
        "user-456"
      );

      expect(result.role).toBe(MemberRole.OWNER);
    });

    it("should allow ADMIN inviter to assign non-OWNER roles", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.ADMIN });
      const invitation = createMockInvitation({ role: MemberRole.ADMIN });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const result = await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.ADMIN,
        },
        "user-456"
      );

      expect(result.role).toBe(MemberRole.ADMIN);
    });

    it("should fail if email already has pending invitation", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const existingInvitation = createMockInvitation({
        acceptedAt: null,
        declinedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Future date
      });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        existingInvitation
      );

      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow("An invitation for this email already exists");
    });

    it("should fail if user is already a member", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const existingMember = createMockMember();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      mockPrismaService.organizationMember.findUnique.mockImplementation(
        (params) => {
          // Return inviter when looking for inviter's membership
          if (params.where.userId_organizationId.userId === "user-456") {
            return Promise.resolve(inviter);
          }
          // Return existing member (user is already in org)
          return Promise.resolve(existingMember);
        }
      );
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createInvitation(
          "org-123",
          {
            email: "invited@example.com",
            role: MemberRole.EDITOR,
          },
          "user-456"
        )
      ).rejects.toThrow("User is already a member of this organization");
    });

    it("should delete expired invitation before creating new one", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const expiredInvitation = createMockInvitation({
        acceptedAt: null,
        declinedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Past date
      });
      const newInvitation = createMockInvitation();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique
        .mockResolvedValueOnce(expiredInvitation) // First lookup finds expired
        .mockResolvedValueOnce(null); // After delete
      mockPrismaService.organizationInvitation.delete.mockResolvedValue(
        expiredInvitation
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...newInvitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const result = await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.EDITOR,
        },
        "user-456"
      );

      expect(mockPrismaService.organizationInvitation.delete).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should send invitation email", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { id: "user-456", name: "Inviter", email: "inviter@example.com" },
      });

      await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.EDITOR,
          personalMessage: "Join our team!",
        },
        "user-456"
      );

      expect(mockMailService.sendInvitationEmail).toHaveBeenCalled();
      const mailCall = mockMailService.sendInvitationEmail.mock.calls[0][0];
      expect(mailCall.email).toBe("invited@example.com");
      expect(mailCall.organizationName).toBe(organization.name);
      expect(mailCall.role).toBe(MemberRole.EDITOR);
    });

    it("should create audit log for invitation", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation();

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { id: "user-456", name: "Inviter", email: "inviter@example.com" },
      });

      await service.createInvitation(
        "org-123",
        {
          email: "invited@example.com",
          role: MemberRole.EDITOR,
        },
        "user-456"
      );

      expect(mockAuditService.logTeamEvent).toHaveBeenCalledWith(
        "user-456",
        "org-123",
        "member.invited",
        expect.objectContaining({
          email: "invited@example.com",
          role: MemberRole.EDITOR,
        }),
        expect.any(Object)
      );
    });

    it("should normalize email to lowercase", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      const invitation = createMockInvitation({ email: "invited@example.com" });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      await service.createInvitation(
        "org-123",
        {
          email: "INVITED@EXAMPLE.COM",
          role: MemberRole.EDITOR,
        },
        "user-456"
      );

      const createCall = mockPrismaService.organizationInvitation.create.mock
        .calls[0][0];
      expect(createCall.data.email).toBe("invited@example.com");
    });
  });

  // ==================== Accept Invitation ====================

  describe("acceptInvitation", () => {
    it("should accept invitation and add user to organization", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const user = createMockUser();
      const member = createMockMember();
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockImplementation((params) => {
        // Check if it's using the token for lookup
        if (params.where && params.where.token === token) {
          return Promise.resolve({
            id: "invite-123",
            organizationId: "org-123",
            email: user.email,
            role: MemberRole.EDITOR,
            token,
            tokenHash,
            invitedById: "user-456",
            personalMessage: null,
            acceptedAt: null,
            declinedAt: null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
            organization,
            invitedBy: { name: "Inviter", email: "inviter@example.com" },
          });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationMember.create.mockResolvedValue({
        ...member,
        user,
        organization,
      });
      mockPrismaService.organizationInvitation.update.mockResolvedValue({
        id: "invite-123",
      });

      const result = await service.acceptInvitation(token);

      expect(result.member).toBeDefined();
      expect(result.organization).toBeDefined();
      expect(result.message).toContain("Successfully joined");
      expect(mockPrismaService.organizationMember.create).toHaveBeenCalled();
    });

    it("should fail if invitation not found", async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.acceptInvitation("invalid-token")
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.acceptInvitation("invalid-token")
      ).rejects.toThrow("Invitation not found");
    });

    it("should fail if token is invalid", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const wrongTokenHash = crypto
        .createHash("sha256")
        .update("different-token")
        .digest("hex");
      const invitation = createMockInvitation({
        token: "original-token",
        tokenHash: wrongTokenHash,
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "Invalid invitation token"
      );
    });

    it("should fail if invitation has expired", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({
        token,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Past date
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "Invitation has expired"
      );
    });

    it("should fail if invitation already accepted", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({
        token,
        tokenHash,
        acceptedAt: new Date(),
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "Invitation has already been accepted"
      );
    });

    it("should fail if invitation already declined", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({
        token,
        tokenHash,
        declinedAt: new Date(),
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "Invitation has been declined"
      );
    });

    it("should create new user if user does not exist and userData provided", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const newUser = createMockUser({
        email: invitation.email,
        emailVerified: new Date(),
      });
      const member = createMockMember();
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrismaService.user.create.mockResolvedValue(newUser);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationMember.create.mockResolvedValue({
        ...member,
        user: newUser,
        organization,
      });
      mockPrismaService.organizationInvitation.update.mockResolvedValue(
        invitation
      );

      const result = await service.acceptInvitation(token, {
        name: "New User",
        password: "SecurePassword123!",
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: invitation.email,
          name: "New User",
        }),
      });
      expect(result.member).toBeDefined();
    });

    it("should fail if user does not exist and no userData provided", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "User account does not exist"
      );
    });

    it("should fail if userData missing required fields for new user", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(token, {
          name: "New User", // Missing password
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.acceptInvitation(token, {
          password: "SecurePassword123!", // Missing name
        })
      ).rejects.toThrow(BadRequestException);
    });

    it("should mark invitation as accepted", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const user = createMockUser();
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationMember.create.mockResolvedValue(
        createMockMember()
      );
      mockPrismaService.organizationInvitation.update.mockResolvedValue(
        invitation
      );

      await service.acceptInvitation(token);

      expect(mockPrismaService.organizationInvitation.update).toHaveBeenCalledWith(
        {
          where: { id: invitation.id },
          data: { acceptedAt: expect.any(Date) },
        }
      );
    });

    it("should create audit log when accepting invitation", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const user = createMockUser();
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationMember.create.mockResolvedValue(
        createMockMember()
      );
      mockPrismaService.organizationInvitation.update.mockResolvedValue(
        invitation
      );

      await service.acceptInvitation(token);

      expect(mockAuditService.logTeamEvent).toHaveBeenCalledWith(
        user.id,
        invitation.organizationId,
        "member.joined",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should fail if user already member when accepting", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const user = createMockUser();
      const existingMember = createMockMember();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(
        existingMember
      );
      mockPrismaService.organizationInvitation.update.mockResolvedValue(
        invitation
      );

      await expect(service.acceptInvitation(token)).rejects.toThrow(
        ConflictException
      );
      await expect(service.acceptInvitation(token)).rejects.toThrow(
        "You are already a member"
      );
    });
  });

  // ==================== Decline Invitation ====================

  describe("declineInvitation", () => {
    it("should mark invitation as declined", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.organizationInvitation.update.mockResolvedValue({
        ...invitation,
        declinedAt: new Date(),
      });

      const result = await service.declineInvitation(token);

      expect(result.message).toBe("Invitation declined");
      expect(mockPrismaService.organizationInvitation.update).toHaveBeenCalledWith(
        {
          where: { id: invitation.id },
          data: { declinedAt: expect.any(Date) },
        }
      );
    });

    it("should fail if invitation not found", async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.declineInvitation("invalid-token")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if token is invalid", async () => {
      const wrongTokenHash = crypto
        .createHash("sha256")
        .update("different-token")
        .digest("hex");
      const invitation = createMockInvitation({ tokenHash: wrongTokenHash });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.declineInvitation("wrong-token")).rejects.toThrow(
        BadRequestException
      );
    });

    it("should fail if already accepted", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({
        token,
        tokenHash,
        acceptedAt: new Date(),
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.declineInvitation(token)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should fail if already declined", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({
        token,
        tokenHash,
        declinedAt: new Date(),
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(service.declineInvitation(token)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // ==================== List Invitations ====================

  describe("listInvitations", () => {
    it("should list all pending invitations by default", async () => {
      const invitation1 = createMockInvitation({
        email: "user1@example.com",
      });
      const invitation2 = createMockInvitation({
        email: "user2@example.com",
      });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        invitation1,
        invitation2,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(2);

      const result = await service.listInvitations("org-123");

      expect(result.invitations).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.invitations[0].email).toBe("user1@example.com");
      expect(result.invitations[0].token).toBeUndefined();
      expect(result.invitations[0].tokenHash).toBeUndefined();
    });

    it("should filter by status: pending", async () => {
      const invitation = createMockInvitation({
        acceptedAt: null,
        declinedAt: null,
      });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        invitation,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(1);

      const result = await service.listInvitations("org-123", {
        status: "pending",
      });

      expect(result.invitations).toHaveLength(1);

      // Check that findMany was called with correct filter
      const callArgs =
        mockPrismaService.organizationInvitation.findMany.mock.calls[0][0];
      expect(callArgs.where.acceptedAt).toBeNull();
      expect(callArgs.where.declinedAt).toBeNull();
    });

    it("should filter by status: accepted", async () => {
      const invitation = createMockInvitation({ acceptedAt: new Date() });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        invitation,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(1);

      const result = await service.listInvitations("org-123", {
        status: "accepted",
      });

      expect(result.invitations).toHaveLength(1);
    });

    it("should filter by status: declined", async () => {
      const invitation = createMockInvitation({ declinedAt: new Date() });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        invitation,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(1);

      const result = await service.listInvitations("org-123", {
        status: "declined",
      });

      expect(result.invitations).toHaveLength(1);
    });

    it("should filter by status: expired", async () => {
      const invitation = createMockInvitation({
        expiresAt: new Date(Date.now() - 1000),
        acceptedAt: null,
        declinedAt: null,
      });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        invitation,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(1);

      const result = await service.listInvitations("org-123", {
        status: "expired",
      });

      expect(result.invitations).toHaveLength(1);
      expect(result.invitations[0].isExpired).toBe(true);
    });

    it("should support pagination with limit and offset", async () => {
      const invitations = Array(10)
        .fill(null)
        .map((_, i) => createMockInvitation({ email: `user${i}@example.com` }));

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue(
        invitations.slice(0, 5)
      );
      mockPrismaService.organizationInvitation.count.mockResolvedValue(10);

      const result = await service.listInvitations("org-123", {
        limit: 5,
        offset: 0,
      });

      expect(result.invitations).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(0);
    });

    it("should mark expired invitations in response", async () => {
      const futureInvitation = createMockInvitation({
        expiresAt: new Date(Date.now() + 1000),
      });
      const expiredInvitation = createMockInvitation({
        expiresAt: new Date(Date.now() - 1000),
      });

      mockPrismaService.organizationInvitation.findMany.mockResolvedValue([
        futureInvitation,
        expiredInvitation,
      ]);
      mockPrismaService.organizationInvitation.count.mockResolvedValue(2);

      const result = await service.listInvitations("org-123");

      expect(result.invitations[0].isExpired).toBe(false);
      expect(result.invitations[1].isExpired).toBe(true);
    });
  });

  // ==================== Resend Invitation ====================

  describe("resendInvitation", () => {
    it("should generate new token and reset expiry", async () => {
      const oldInvitation = createMockInvitation({
        expiresAt: new Date(Date.now() - 1000), // Expired
      });
      const organization = createMockOrganization();
      const newToken = crypto.randomBytes(32).toString("base64url");
      const newTokenHash = crypto
        .createHash("sha256")
        .update(newToken)
        .digest("hex");

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...oldInvitation,
        organization,
      });
      mockPrismaService.organizationInvitation.update.mockResolvedValue({
        ...oldInvitation,
        token: newToken,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const result = await service.resendInvitation(
        "org-123",
        "invite-123",
        "user-456"
      );

      expect(mockPrismaService.organizationInvitation.update).toHaveBeenCalled();
      expect(result.token).toBeUndefined();
      expect(result.tokenHash).toBeUndefined();
      expect(mockMailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it("should fail if invitation not found", async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.resendInvitation("org-123", "invalid-id", "user-456")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if invitation belongs to different organization", async () => {
      const invitation = createMockInvitation({
        organizationId: "other-org",
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(
        service.resendInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if invitation already accepted", async () => {
      const invitation = createMockInvitation({ acceptedAt: new Date() });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(
        service.resendInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resendInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow("Cannot resend accepted invitation");
    });

    it("should reset declined status when resending", async () => {
      const declinedInvitation = createMockInvitation({
        declinedAt: new Date(),
      });
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...declinedInvitation,
        organization,
      });
      mockPrismaService.organizationInvitation.update.mockResolvedValue({
        ...declinedInvitation,
        declinedAt: null,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      await service.resendInvitation(
        "org-123",
        "invite-123",
        "user-456"
      );

      const updateCall =
        mockPrismaService.organizationInvitation.update.mock.calls[0][0];
      expect(updateCall.data.declinedAt).toBeNull();
    });

    it("should create audit log when resending", async () => {
      const invitation = createMockInvitation();
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
      });
      mockPrismaService.organizationInvitation.update.mockResolvedValue({
        ...invitation,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      await service.resendInvitation(
        "org-123",
        "invite-123",
        "user-456"
      );

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        "user-456",
        "org-123",
        "invitation.resent",
        "OrganizationInvitation",
        "invite-123",
        expect.any(Object)
      );
    });
  });

  // ==================== Cancel Invitation ====================

  describe("cancelInvitation", () => {
    it("should delete pending invitation", async () => {
      const invitation = createMockInvitation();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.organizationInvitation.delete.mockResolvedValue(
        invitation
      );

      const result = await service.cancelInvitation(
        "org-123",
        "invite-123",
        "user-456"
      );

      expect(result.message).toBe("Invitation cancelled");
      expect(mockPrismaService.organizationInvitation.delete).toHaveBeenCalledWith(
        {
          where: { id: "invite-123" },
        }
      );
    });

    it("should fail if invitation not found", async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.cancelInvitation("org-123", "invalid-id", "user-456")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if invitation belongs to different organization", async () => {
      const invitation = createMockInvitation({
        organizationId: "other-org",
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(
        service.cancelInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if invitation already accepted", async () => {
      const invitation = createMockInvitation({ acceptedAt: new Date() });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(
        service.cancelInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelInvitation("org-123", "invite-123", "user-456")
      ).rejects.toThrow("Cannot cancel accepted invitation");
    });

    it("should create audit log when cancelling", async () => {
      const invitation = createMockInvitation();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );
      mockPrismaService.organizationInvitation.delete.mockResolvedValue(
        invitation
      );

      await service.cancelInvitation("org-123", "invite-123", "user-456");

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        "user-456",
        "org-123",
        "invitation.cancelled",
        "OrganizationInvitation",
        "invite-123",
        expect.any(Object)
      );
    });
  });

  // ==================== Get Invitation By Token ====================

  describe("getInvitationByToken", () => {
    it("should return invitation details without sensitive data", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());

      const result = await service.getInvitationByToken(token);

      expect(result.token).toBeUndefined();
      expect(result.tokenHash).toBeUndefined();
      expect(result.email).toBe(invitation.email);
      expect(result.organization).toBeDefined();
    });

    it("should indicate if user requires registration", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist

      const result = await service.getInvitationByToken(token);

      expect(result.requiresRegistration).toBe(true);
    });

    it("should indicate if user already exists", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const invitation = createMockInvitation({ token, tokenHash });
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...invitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());

      const result = await service.getInvitationByToken(token);

      expect(result.requiresRegistration).toBe(false);
    });

    it("should indicate if invitation is expired", async () => {
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const expiredInvitation = createMockInvitation({
        token,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
      });
      const organization = createMockOrganization();

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue({
        ...expiredInvitation,
        organization,
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());

      const result = await service.getInvitationByToken(token);

      expect(result.isExpired).toBe(true);
    });

    it("should fail if invitation not found", async () => {
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );

      await expect(
        service.getInvitationByToken("invalid-token")
      ).rejects.toThrow(NotFoundException);
    });

    it("should fail if token is invalid", async () => {
      const wrongTokenHash = crypto
        .createHash("sha256")
        .update("different-token")
        .digest("hex");
      const invitation = createMockInvitation({
        tokenHash: wrongTokenHash,
      });

      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        invitation
      );

      await expect(
        service.getInvitationByToken("wrong-token")
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== Bulk Create Invitations ====================

  describe("bulkCreateInvitations", () => {
    it("should create multiple invitations successfully", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );
      setupMocksForInvitation("user-456", inviter);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockImplementation(
        (params) =>
          Promise.resolve({
            ...createMockInvitation(),
            email: params.data.email,
            invitedBy: { name: "Inviter", email: "inviter@example.com" },
          })
      );

      const invitations = [
        { email: "user1@example.com", role: MemberRole.EDITOR },
        { email: "user2@example.com", role: MemberRole.VIEWER },
        { email: "user3@example.com", role: MemberRole.EDITOR },
      ];

      const result = await service.bulkCreateInvitations(
        "org-123",
        invitations,
        "user-456"
      );

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle partial failures in bulk creation", async () => {
      const organization = createMockOrganization();
      const inviter = createMockMember({ role: MemberRole.OWNER });
      let inviteCallCount = 0;

      mockPrismaService.organization.findUnique.mockResolvedValue(
        organization
      );

      mockPrismaService.organizationMember.findUnique.mockImplementation(
        (params) => {
          // Return inviter when looking for inviter's membership
          if (params.where.userId_organizationId.userId === "user-456") {
            return Promise.resolve(inviter);
          }

          // Track calls to check for existing members
          inviteCallCount++;
          // Fail on second call - user2 is already a member
          if (inviteCallCount === 2) {
            return Promise.resolve(createMockMember());
          }
          return Promise.resolve(null);
        }
      );

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organizationInvitation.findUnique.mockResolvedValue(
        null
      );
      mockPrismaService.organizationInvitation.create.mockResolvedValue({
        ...createMockInvitation(),
        invitedBy: { name: "Inviter", email: "inviter@example.com" },
      });

      const invitations = [
        { email: "user1@example.com", role: MemberRole.EDITOR },
        { email: "user2@example.com", role: MemberRole.EDITOR }, // Will fail
        { email: "user3@example.com", role: MemberRole.EDITOR },
      ];

      const result = await service.bulkCreateInvitations(
        "org-123",
        invitations,
        "user-456"
      );

      expect(result.successful.length).toBeGreaterThanOrEqual(1);
      expect(result.failed.length).toBeGreaterThanOrEqual(1);
      expect(result.failed[0].email).toBe("user2@example.com");
      expect(result.failed[0].error).toBeDefined();
    });
  });
});
