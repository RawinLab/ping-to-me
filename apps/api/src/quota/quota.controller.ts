import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";
import { QuotaService, QuotaResource } from "./quota.service";
import {
  CheckQuotaDto,
  QuotaCheckResultDto,
  FullQuotaStatusDto,
  UsageHistoryItemDto,
} from "./dto";

@ApiTags("Usage & Quota")
@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  /**
   * GET /organizations/:id/usage - Current month usage
   */
  @Get("organizations/:id/usage")
  @Permission({ resource: "billing", action: "read" })
  @ApiOperation({ summary: "Get current month usage for organization" })
  @ApiResponse({ status: 200, description: "Current usage data" })
  async getCurrentUsage(@Param("id") orgId: string) {
    const usage = await this.quotaService.getCurrentUsage(orgId);
    return {
      yearMonth: this.quotaService.getCurrentYearMonth(),
      ...usage,
    };
  }

  /**
   * GET /organizations/:id/usage/history - Historical usage
   */
  @Get("organizations/:id/usage/history")
  @Permission({ resource: "billing", action: "read" })
  @ApiOperation({ summary: "Get usage history for organization (last 12 months)" })
  @ApiResponse({ status: 200, description: "Historical usage data", type: [UsageHistoryItemDto] })
  async getUsageHistory(@Param("id") orgId: string) {
    const history = await this.quotaService.getUsageHistory(orgId, 12);
    return history;
  }

  /**
   * GET /organizations/:id/usage/limits - Current limits vs usage
   */
  @Get("organizations/:id/usage/limits")
  @Permission({ resource: "billing", action: "read" })
  @ApiOperation({ summary: "Get current usage compared to plan limits" })
  @ApiResponse({ status: 200, description: "Usage vs limits comparison" })
  async getUsageWithLimits(@Param("id") orgId: string) {
    const org = await this.quotaService.getOrgWithPlan(orgId);
    if (!org) {
      return { error: "Organization not found" };
    }

    const limits = await this.quotaService.getPlanLimits(org.plan);
    const usage = await this.quotaService.getCurrentUsage(orgId);

    return {
      plan: org.plan,
      limits,
      usage,
      comparisons: {
        links: {
          used: usage.links,
          limit: limits.linksPerMonth,
          unlimited: limits.linksPerMonth === -1,
          percentUsed: limits.linksPerMonth === -1 ? 0 : Math.round((usage.links / limits.linksPerMonth) * 100),
        },
        domains: {
          used: usage.domains,
          limit: limits.customDomains,
          unlimited: limits.customDomains === -1,
          percentUsed: limits.customDomains === -1 ? 0 : Math.round((usage.domains / limits.customDomains) * 100),
        },
        members: {
          used: usage.members,
          limit: limits.teamMembers,
          unlimited: limits.teamMembers === -1,
          percentUsed: limits.teamMembers === -1 ? 0 : Math.round((usage.members / limits.teamMembers) * 100),
        },
        apiCalls: {
          used: usage.apiCalls,
          limit: limits.apiCallsPerMonth,
          unlimited: limits.apiCallsPerMonth === -1,
          percentUsed: limits.apiCallsPerMonth === -1 ? 0 : Math.round((usage.apiCalls / limits.apiCallsPerMonth) * 100),
        },
      },
    };
  }

  /**
   * POST /organizations/:id/usage/check - Check if action allowed
   */
  @Post("organizations/:id/usage/check")
  @Permission({ resource: "billing", action: "read" })
  @ApiOperation({ summary: "Check if an action is allowed within quota" })
  @ApiResponse({ status: 200, description: "Quota check result", type: QuotaCheckResultDto })
  async checkQuota(
    @Param("id") orgId: string,
    @Body() dto: CheckQuotaDto,
  ) {
    const result = await this.quotaService.checkQuota(orgId, dto.resource as QuotaResource);
    return result;
  }

  /**
   * GET /organizations/:id/quota - Full quota status
   */
  @Get("organizations/:id/quota")
  @Permission({ resource: "billing", action: "read" })
  @ApiOperation({ summary: "Get full quota status for organization" })
  @ApiResponse({ status: 200, description: "Full quota status", type: FullQuotaStatusDto })
  async getFullQuotaStatus(@Param("id") orgId: string) {
    const status = await this.quotaService.getFullQuotaStatus(orgId);
    return status;
  }
}
