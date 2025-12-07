import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { MemberRole } from "@pingtome/database";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  // ==================== Token Utilities ====================

  /**
   * Generate a cryptographically secure random token
   * @returns Base64url encoded token (43 characters)
   */
  private generateSecureToken(): string {
    const buffer = crypto.randomBytes(32);
    return buffer.toString("base64url");
  }

  /**
   * Hash a token using SHA-256 for secure storage
   * @param token - Plain text token
   * @returns Hashed token
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Validate a token against its hash using timing-safe comparison
   * @param token - Plain text token to validate
   * @param hash - Stored hash to compare against
   * @returns True if token is valid
   */
  private validateToken(token: string, hash: string): boolean {
    const computedHash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  /**
   * Generate expiration date for invitation (7 days from now)
   * @returns Expiration date
   */
  private generateExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  // ==================== Core Service Methods ====================

  /**
   * Create a new organization invitation
   */
  async createInvitation(
    organizationId: string,
    dto: CreateInvitationDto,
    inviterId: string,
  ) {
    // Validate organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    // Get inviter's membership and role
    const inviterMembership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: inviterId,
          organizationId,
        },
      },
    });

    if (!inviterMembership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    // Check if inviter has permission to invite with this role
    // OWNER can invite any role, ADMIN can invite ADMIN/EDITOR/VIEWER (not OWNER)
    if (
      dto.role === MemberRole.OWNER &&
      inviterMembership.role !== MemberRole.OWNER
    ) {
      throw new ForbiddenException("Only owners can invite other owners");
    }

    if (
      inviterMembership.role !== MemberRole.OWNER &&
      inviterMembership.role !== MemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        "You do not have permission to invite members",
      );
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: await this.getUserIdByEmail(dto.email),
          organizationId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        "User is already a member of this organization",
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation =
      await this.prisma.organizationInvitation.findUnique({
        where: {
          organizationId_email: {
            organizationId,
            email: dto.email.toLowerCase(),
          },
        },
      });

    if (
      existingInvitation &&
      !existingInvitation.acceptedAt &&
      !existingInvitation.declinedAt
    ) {
      // Check if invitation is expired
      if (existingInvitation.expiresAt > new Date()) {
        throw new ConflictException(
          "An invitation for this email already exists",
        );
      }
      // Delete expired invitation
      await this.prisma.organizationInvitation.delete({
        where: { id: existingInvitation.id },
      });
    }

    // Generate secure token and hash
    const token = this.generateSecureToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = this.generateExpirationDate();

    // Create invitation record
    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        tokenHash,
        invitedById: inviterId,
        personalMessage: dto.personalMessage,
        expiresAt,
      },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invitation email
    await this.mailService.sendInvitationEmail({
      email: dto.email,
      token,
      organizationName: organization.name,
      inviterName: invitation.invitedBy.name || invitation.invitedBy.email,
      role: dto.role,
      personalMessage: dto.personalMessage,
      expiresAt,
    });

    // Create audit log
    await this.auditService.logTeamEvent(
      inviterId,
      organizationId,
      "member.invited",
      {
        email: dto.email,
        role: dto.role,
      },
      {
        details: {
          invitationId: invitation.id,
          expiresAt: expiresAt.toISOString(),
        },
      },
    );

    // Return invitation without token
    const { token: _, tokenHash: __, ...invitationWithoutToken } = invitation;
    return invitationWithoutToken;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userData?: AcceptInvitationDto) {
    // Find invitation by token
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    // Validate token hash
    if (
      invitation.tokenHash &&
      !this.validateToken(token, invitation.tokenHash)
    ) {
      throw new BadRequestException("Invalid invitation token");
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException("Invitation has expired");
    }

    // Check if already accepted or declined
    if (invitation.acceptedAt) {
      throw new BadRequestException("Invitation has already been accepted");
    }

    if (invitation.declinedAt) {
      throw new BadRequestException("Invitation has been declined");
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // If user doesn't exist and userData is provided, create new user
    if (!user && userData) {
      if (!userData.password || !userData.name) {
        throw new BadRequestException(
          "Name and password are required for new users",
        );
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      user = await this.prisma.user.create({
        data: {
          email: invitation.email,
          name: userData.name,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verify email for invited users
        },
      });
    }

    if (!user) {
      throw new BadRequestException(
        "User account does not exist. Please provide registration details.",
      );
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted but don't add duplicate member
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      throw new ConflictException(
        "You are already a member of this organization",
      );
    }

    // Add user to organization
    const member = await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        invitedById: invitation.invitedById,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        organization: true,
      },
    });

    // Mark invitation as accepted
    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    // Create audit log
    await this.auditService.logTeamEvent(
      user.id,
      invitation.organizationId,
      "member.joined",
      {
        userId: user.id,
        email: user.email,
        role: invitation.role,
      },
      {
        details: {
          invitationId: invitation.id,
          invitedBy: invitation.invitedById,
        },
      },
    );

    return {
      member,
      organization: invitation.organization,
      message: "Successfully joined organization",
    };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string) {
    // Find invitation by token
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    // Validate token hash
    if (
      invitation.tokenHash &&
      !this.validateToken(token, invitation.tokenHash)
    ) {
      throw new BadRequestException("Invalid invitation token");
    }

    // Check if already accepted or declined
    if (invitation.acceptedAt) {
      throw new BadRequestException("Invitation has already been accepted");
    }

    if (invitation.declinedAt) {
      throw new BadRequestException("Invitation has already been declined");
    }

    // Mark as declined
    await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { declinedAt: new Date() },
    });

    return { message: "Invitation declined" };
  }

  /**
   * List pending invitations for an organization
   */
  async listInvitations(
    organizationId: string,
    filters?: {
      status?: "pending" | "accepted" | "declined" | "expired";
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = {
      organizationId,
    };

    const now = new Date();

    // Apply status filter
    if (filters?.status === "pending") {
      where.acceptedAt = null;
      where.declinedAt = null;
      where.expiresAt = { gt: now };
    } else if (filters?.status === "accepted") {
      where.acceptedAt = { not: null };
    } else if (filters?.status === "declined") {
      where.declinedAt = { not: null };
    } else if (filters?.status === "expired") {
      where.acceptedAt = null;
      where.declinedAt = null;
      where.expiresAt = { lte: now };
    }

    const [invitations, total] = await Promise.all([
      this.prisma.organizationInvitation.findMany({
        where,
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.organizationInvitation.count({ where }),
    ]);

    // Remove sensitive token data
    const sanitizedInvitations = invitations.map(
      ({ token, tokenHash, ...inv }) => ({
        ...inv,
        isExpired: inv.expiresAt < now && !inv.acceptedAt && !inv.declinedAt,
      }),
    );

    return {
      invitations: sanitizedInvitations,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Get invitation details by token (public endpoint)
   */
  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    // Validate token hash
    if (
      invitation.tokenHash &&
      !this.validateToken(token, invitation.tokenHash)
    ) {
      throw new BadRequestException("Invalid invitation token");
    }

    const now = new Date();
    const isExpired = invitation.expiresAt < now;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });

    // Remove sensitive data
    const {
      token: _,
      tokenHash: __,
      invitedById,
      ...invitationData
    } = invitation;

    return {
      ...invitationData,
      isExpired,
      requiresRegistration: !existingUser,
    };
  }

  /**
   * Resend an invitation with a new token
   */
  async resendInvitation(
    organizationId: string,
    invitationId: string,
    userId: string,
  ) {
    // Get invitation
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
      include: {
        organization: true,
      },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException("Invitation not found");
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      throw new BadRequestException("Cannot resend accepted invitation");
    }

    // Generate new token and extend expiration
    const token = this.generateSecureToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = this.generateExpirationDate();

    // Update invitation
    const updatedInvitation = await this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: {
        token,
        tokenHash,
        expiresAt,
        declinedAt: null, // Reset declined status
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send new invitation email
    await this.mailService.sendInvitationEmail({
      email: invitation.email,
      token,
      organizationName: invitation.organization.name,
      inviterName:
        updatedInvitation.invitedBy.name || updatedInvitation.invitedBy.email,
      role: invitation.role,
      personalMessage: invitation.personalMessage,
      expiresAt,
    });

    // Create audit log
    await this.auditService.logResourceEvent(
      userId,
      organizationId,
      "invitation.resent",
      "OrganizationInvitation",
      invitationId,
      {
        details: {
          email: invitation.email,
          newExpiresAt: expiresAt.toISOString(),
        },
      },
    );

    const {
      token: _,
      tokenHash: __,
      ...invitationWithoutToken
    } = updatedInvitation;
    return invitationWithoutToken;
  }

  /**
   * Cancel a pending invitation
   */
  async cancelInvitation(
    organizationId: string,
    invitationId: string,
    userId: string,
  ) {
    // Get invitation
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException("Invitation not found");
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      throw new BadRequestException("Cannot cancel accepted invitation");
    }

    // Delete invitation
    await this.prisma.organizationInvitation.delete({
      where: { id: invitationId },
    });

    // Create audit log
    await this.auditService.logResourceEvent(
      userId,
      organizationId,
      "invitation.cancelled",
      "OrganizationInvitation",
      invitationId,
      {
        details: {
          email: invitation.email,
          role: invitation.role,
        },
      },
    );

    return { message: "Invitation cancelled" };
  }

  /**
   * Bulk create invitations
   */
  async bulkCreateInvitations(
    organizationId: string,
    invitations: CreateInvitationDto[],
    inviterId: string,
  ) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const invitation of invitations) {
      try {
        const created = await this.createInvitation(
          organizationId,
          invitation,
          inviterId,
        );
        results.successful.push({
          email: invitation.email,
          invitation: created,
        });
      } catch (error) {
        results.failed.push({
          email: invitation.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  // ==================== Helper Methods ====================

  /**
   * Get user ID by email (returns a placeholder if user doesn't exist)
   */
  private async getUserIdByEmail(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    // Return a non-existent UUID if user doesn't exist
    // This prevents the unique constraint check from failing
    return user?.id || "00000000-0000-0000-0000-000000000000";
  }
}
