import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MemberRole } from "@pingtome/database";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import { UpdateOrganizationSettingsDto } from "./dto/organization-settings.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { Update2FAEnforcementDto } from "./dto/security-settings.dto";

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private quotaService: QuotaService,
  ) {}

  // Organization CRUD
  async create(userId: string, data: { name: string; slug: string }) {
    // Create organization and add creator as owner
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    // Create default settings for the organization
    await this.createDefaultSettings(org.id);

    // Audit log: org created
    await this.auditService.logOrgEvent(userId, org.id, "org.created", {
      details: {
        name: org.name,
        slug: org.slug,
      },
    });

    return org;
  }

  async findAll(userId: string) {
    // Get all organizations the user is a member of
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async findOne(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { members: true, links: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    // Check if user is a member
    const isMember = org.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("Access denied");
    }

    return org;
  }

  async update(orgId: string, userId: string, data: UpdateOrganizationDto) {
    // Check if user is owner/admin
    await this.checkPermission(orgId, userId, ["OWNER", "ADMIN"]);

    // If defaultDomainId is provided, verify the domain exists and belongs to org
    if (data.defaultDomainId) {
      const domain = await this.prisma.domain.findUnique({
        where: { id: data.defaultDomainId },
      });

      if (!domain || domain.organizationId !== orgId) {
        throw new BadRequestException(
          "Invalid domain ID or domain does not belong to this organization",
        );
      }
    }

    // Get current org state for change tracking
    const before = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        slug: true,
        logo: true,
        description: true,
        timezone: true,
        dataRetentionDays: true,
        defaultDomainId: true,
      },
    });

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data,
    });

    // Audit log: org updated with change tracking
    const changes = this.auditService.captureChanges(before, {
      name: updated.name,
      slug: updated.slug,
      logo: updated.logo,
      description: updated.description,
      timezone: updated.timezone,
      dataRetentionDays: updated.dataRetentionDays,
      defaultDomainId: updated.defaultDomainId,
    });

    if (changes) {
      await this.auditService.logOrgEvent(userId, orgId, "org.updated", {
        changes,
        details: {
          updatedFields: Object.keys(data),
        },
      });
    }

    return updated;
  }

  async delete(orgId: string, userId: string) {
    // Only owner can delete
    await this.checkPermission(orgId, userId, ["OWNER"]);

    // Get org details before deletion
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true },
    });

    const deleted = await this.prisma.organization.delete({
      where: { id: orgId },
    });

    // Audit log: org deleted
    await this.auditService.logOrgEvent(userId, orgId, "org.deleted", {
      details: {
        name: org?.name,
        slug: org?.slug,
      },
    });

    return deleted;
  }

  private async checkPermission(
    orgId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException("Permission denied");
    }

    return member;
  }

  // Organization Settings
  async createDefaultSettings(orgId: string) {
    return this.prisma.organizationSettings.create({
      data: {
        organizationId: orgId,
        ssoEnabled: false,
        enforced2FA: false,
        enforce2FAForRoles: [], // Empty array - no specific roles by default
        sessionTimeout: 7200, // 2 hours default
      },
    });
  }

  async getSettings(orgId: string, userId: string) {
    // Check if user is a member
    await this.checkPermission(orgId, userId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "VIEWER",
    ]);

    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      return this.createDefaultSettings(orgId);
    }

    return settings;
  }

  async updateSettings(
    orgId: string,
    userId: string,
    data: UpdateOrganizationSettingsDto,
  ) {
    // Only owner/admin can update settings
    await this.checkPermission(orgId, userId, ["OWNER", "ADMIN"]);

    // Get current settings for change tracking
    const before = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!before) {
      throw new NotFoundException("Organization settings not found");
    }

    const updated = await this.prisma.organizationSettings.update({
      where: { organizationId: orgId },
      data,
    });

    // Audit log: settings updated
    const changes = this.auditService.captureChanges(
      {
        ipAllowlist: before.ipAllowlist,
        ssoEnabled: before.ssoEnabled,
        ssoProviderId: before.ssoProviderId,
        enforced2FA: before.enforced2FA,
        enforce2FAForRoles: before.enforce2FAForRoles,
        sessionTimeout: before.sessionTimeout,
      },
      {
        ipAllowlist: updated.ipAllowlist,
        ssoEnabled: updated.ssoEnabled,
        ssoProviderId: updated.ssoProviderId,
        enforced2FA: updated.enforced2FA,
        enforce2FAForRoles: updated.enforce2FAForRoles,
        sessionTimeout: updated.sessionTimeout,
      },
    );

    if (changes) {
      await this.auditService.logOrgEvent(
        userId,
        orgId,
        "org.settings_updated",
        {
          changes,
          details: {
            updatedFields: Object.keys(data),
          },
        },
      );
    }

    return updated;
  }

  async uploadLogo(orgId: string, userId: string, file: Express.Multer.File) {
    // Check if user is owner/admin
    await this.checkPermission(orgId, userId, ["OWNER", "ADMIN"]);

    // Validate file type
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only PNG, JPG, and WebP are allowed.",
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 2MB limit.");
    }

    // Convert to base64
    const base64Logo = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // Update organization with logo
    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: { logo: base64Logo },
    });

    // Audit log: logo uploaded
    await this.auditService.logOrgEvent(userId, orgId, "org.logo_uploaded", {
      details: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return updated;
  }

  async deleteLogo(orgId: string, userId: string) {
    // Check if user is owner/admin
    await this.checkPermission(orgId, userId, ["OWNER", "ADMIN"]);

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: { logo: null },
    });

    // Audit log: logo deleted
    await this.auditService.logOrgEvent(userId, orgId, "org.logo_deleted", {
      details: {},
    });

    return updated;
  }

  async transferOwnership(
    orgId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ) {
    // Verify current user is the owner
    const currentMember = await this.checkPermission(orgId, currentOwnerId, [
      "OWNER",
    ]);

    // Verify new owner is a member
    const newMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: newOwnerId,
          organizationId: orgId,
        },
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!newMember) {
      throw new BadRequestException(
        "New owner must be an existing member of the organization",
      );
    }

    if (newOwnerId === currentOwnerId) {
      throw new BadRequestException(
        "You are already the owner of this organization",
      );
    }

    // Transfer ownership: update both members in a transaction
    await this.prisma.$transaction([
      // Demote current owner to admin
      this.prisma.organizationMember.update({
        where: {
          userId_organizationId: {
            userId: currentOwnerId,
            organizationId: orgId,
          },
        },
        data: { role: "ADMIN" },
      }),
      // Promote new member to owner
      this.prisma.organizationMember.update({
        where: {
          userId_organizationId: {
            userId: newOwnerId,
            organizationId: orgId,
          },
        },
        data: { role: "OWNER" },
      }),
    ]);

    // Audit log: ownership transferred
    await this.auditService.logOrgEvent(
      currentOwnerId,
      orgId,
      "org.ownership_transferred",
      {
        details: {
          previousOwnerId: currentOwnerId,
          newOwnerId: newOwnerId,
          newOwnerEmail: newMember.user.email,
          newOwnerName: newMember.user.name,
        },
      },
    );

    return {
      message: "Ownership transferred successfully",
      previousOwnerId: currentOwnerId,
      newOwnerId: newOwnerId,
    };
  }

  // Member management
  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async inviteMember(
    orgId: string,
    invitedByUserId: string,
    email: string,
    role: MemberRole,
  ) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        "User not found. For MVP, user must be registered first.",
      );
    }

    // 2. Check if already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException(
        "User is already a member of this organization",
      );
    }

    // 3. Check quota before adding member
    const quotaCheck = await this.quotaService.checkQuota(orgId, "members");
    if (!quotaCheck.allowed) {
      throw new ForbiddenException({
        code: "QUOTA_EXCEEDED",
        message: "Team member limit reached. Please upgrade your plan.",
        currentUsage: quotaCheck.currentUsage,
        limit: quotaCheck.limit,
        upgradeUrl: "/pricing",
      });
    }

    // 4. Add member
    const newMember = await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role,
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
      },
    });

    // Audit log: member invited/joined (in MVP, this is immediate)
    await this.auditService.logTeamEvent(
      invitedByUserId,
      orgId,
      "member.joined",
      {
        userId: user.id,
        email: user.email,
        role: role,
      },
      {
        details: {
          invitedBy: invitedByUserId,
        },
      },
    );

    return newMember;
  }

  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    updatedByUserId: string,
    role: MemberRole,
  ) {
    // Check if member exists
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    const oldRole = member.role;

    const updated = await this.prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      data: { role },
    });

    // Audit log: member role changed
    await this.auditService.logTeamEvent(
      updatedByUserId,
      orgId,
      "member.role_changed",
      {
        userId: targetUserId,
        email: member.user.email,
        role: role,
      },
      {
        changes: {
          before: { role: oldRole },
          after: { role: role },
        },
        details: {
          targetUserId: targetUserId,
        },
      },
    );

    return updated;
  }

  async removeMember(
    orgId: string,
    targetUserId: string,
    removedByUserId: string,
  ) {
    // Prevent removing the last owner? (Optional for MVP but good practice)
    // For now, just remove.

    // Get member details before removal
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const deleted = await this.prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
    });

    // Audit log: member removed
    if (member) {
      await this.auditService.logTeamEvent(
        removedByUserId,
        orgId,
        "member.removed",
        {
          userId: targetUserId,
          email: member.user.email,
          role: member.role,
        },
        {
          details: {
            targetUserId: targetUserId,
            removedRole: member.role,
          },
        },
      );
    }

    return deleted;
  }

  // Security Settings - 2FA Enforcement (Module 2.5)
  async getSecuritySettings(orgId: string, userId: string) {
    // Check if user is a member (any role can view security settings)
    await this.checkPermission(orgId, userId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "VIEWER",
    ]);

    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
      select: {
        enforced2FA: true,
        enforce2FAForRoles: true,
        sessionTimeout: true,
        maxLoginAttempts: true,
        lockoutDuration: true,
      },
    });

    if (!settings) {
      throw new NotFoundException("Organization settings not found");
    }

    return settings;
  }

  async updateSecuritySettings(
    orgId: string,
    userId: string,
    data: Update2FAEnforcementDto,
  ) {
    // Only OWNER can modify 2FA enforcement settings
    await this.checkPermission(orgId, userId, ["OWNER"]);

    // Validate roles if provided
    if (data.enforce2FAForRoles) {
      const validRoles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];
      const invalidRoles = data.enforce2FAForRoles.filter(
        (role) => !validRoles.includes(role),
      );

      if (invalidRoles.length > 0) {
        throw new BadRequestException(
          `Invalid roles: ${invalidRoles.join(", ")}. Valid roles are: ${validRoles.join(", ")}`,
        );
      }
    }

    // Get current settings for change tracking
    const before = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    if (!before) {
      throw new NotFoundException("Organization settings not found");
    }

    const updated = await this.prisma.organizationSettings.update({
      where: { organizationId: orgId },
      data: {
        enforced2FA: data.enforce2FA,
        enforce2FAForRoles: data.enforce2FAForRoles,
      },
    });

    // Audit log: security settings updated
    const changes = this.auditService.captureChanges(
      {
        enforced2FA: before.enforced2FA,
        enforce2FAForRoles: before.enforce2FAForRoles,
      },
      {
        enforced2FA: updated.enforced2FA,
        enforce2FAForRoles: updated.enforce2FAForRoles,
      },
    );

    if (changes) {
      await this.auditService.logOrgEvent(
        userId,
        orgId,
        "org.security_updated",
        {
          changes,
          details: {
            settingsChanged: ["2FA enforcement"],
          },
        },
      );
    }

    return {
      enforced2FA: updated.enforced2FA,
      enforce2FAForRoles: updated.enforce2FAForRoles,
      sessionTimeout: updated.sessionTimeout,
      maxLoginAttempts: updated.maxLoginAttempts,
      lockoutDuration: updated.lockoutDuration,
    };
  }

  async is2FARequired(orgId: string, userId: string): Promise<boolean> {
    // Get organization settings
    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
    });

    // If 2FA is not enforced, return false
    if (!settings || !settings.enforced2FA) {
      return false;
    }

    // Get user's role in the organization
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!member) {
      // User is not a member, so 2FA is not required
      return false;
    }

    // Check if user's role is in the enforce2FAForRoles array
    if (
      settings.enforce2FAForRoles &&
      settings.enforce2FAForRoles.length > 0
    ) {
      return settings.enforce2FAForRoles.includes(member.role);
    }

    // If enforce2FAForRoles is empty but enforced2FA is true,
    // require 2FA for all members
    return true;
  }
}
