import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { InvitationsService } from "./invitations.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { BulkInvitationDto } from "./dto/bulk-invitation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // ==================== Protected Endpoints (Require Auth) ====================

  /**
   * Create a new invitation
   * POST /organizations/:id/invitations
   */
  @Post("organizations/:id/invitations")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "team", action: "invite" })
  async createInvitation(
    @Request() req,
    @Param("id") organizationId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.createInvitation(
      organizationId,
      dto,
      req.user.id,
    );
  }

  /**
   * Bulk create invitations
   * POST /organizations/:id/invitations/bulk
   */
  @Post("organizations/:id/invitations/bulk")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "team", action: "invite" })
  async bulkCreateInvitations(
    @Request() req,
    @Param("id") organizationId: string,
    @Body() dto: BulkInvitationDto,
  ) {
    return this.invitationsService.bulkCreateInvitations(
      organizationId,
      dto.invitations,
      req.user.id,
    );
  }

  /**
   * List invitations for an organization
   * GET /organizations/:id/invitations
   */
  @Get("organizations/:id/invitations")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "team", action: "read" })
  async listInvitations(
    @Param("id") organizationId: string,
    @Query("status") status?: "pending" | "accepted" | "declined" | "expired",
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.invitationsService.listInvitations(organizationId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Resend an invitation
   * POST /organizations/:id/invitations/:invitationId/resend
   */
  @Post("organizations/:id/invitations/:invitationId/resend")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "team", action: "invite" })
  async resendInvitation(
    @Request() req,
    @Param("id") organizationId: string,
    @Param("invitationId") invitationId: string,
  ) {
    return this.invitationsService.resendInvitation(
      organizationId,
      invitationId,
      req.user.id,
    );
  }

  /**
   * Cancel an invitation
   * DELETE /organizations/:id/invitations/:invitationId
   */
  @Delete("organizations/:id/invitations/:invitationId")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "team", action: "invite" })
  async cancelInvitation(
    @Request() req,
    @Param("id") organizationId: string,
    @Param("invitationId") invitationId: string,
  ) {
    return this.invitationsService.cancelInvitation(
      organizationId,
      invitationId,
      req.user.id,
    );
  }

  // ==================== Public Endpoints (No Auth Required) ====================

  /**
   * Get invitation details by token
   * GET /invitations/:token
   */
  @Get("invitations/:token")
  async getInvitationByToken(@Param("token") token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  /**
   * Accept an invitation
   * POST /invitations/:token/accept
   */
  @Post("invitations/:token/accept")
  async acceptInvitation(
    @Param("token") token: string,
    @Body() dto?: AcceptInvitationDto,
  ) {
    return this.invitationsService.acceptInvitation(token, dto);
  }

  /**
   * Decline an invitation
   * POST /invitations/:token/decline
   */
  @Post("invitations/:token/decline")
  async declineInvitation(@Param("token") token: string) {
    return this.invitationsService.declineInvitation(token);
  }
}
