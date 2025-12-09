import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlansService } from './plans.service';
import { AuditService } from '../audit/audit.service';
import { CreatePlanDto, UpdatePlanDto } from './dto';

/**
 * Admin Plans Controller
 * Manages plan definitions (CRUD operations)
 * Only accessible by ADMIN or OWNER users
 */
@ApiTags('Admin - Plans')
@ApiBearerAuth()
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class AdminPlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * GET /admin/plans - List all plans (including inactive)
   */
  @Get()
  @ApiOperation({ summary: 'List all plans (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all plans' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll() {
    return this.plansService.findAll();
  }

  /**
   * GET /admin/plans/:id - Get single plan details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get plan details by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  /**
   * POST /admin/plans - Create new plan
   */
  @Post()
  @ApiOperation({ summary: 'Create a new plan (admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 409, description: 'Plan name already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePlanDto, @Req() req: Request) {
    const user = req.user as any;

    // Create plan
    const plan = await this.plansService.create(dto);

    // Audit log
    await this.auditService.logResourceEvent(
      user.id,
      null,
      'plan.created',
      'PlanDefinition',
      plan.id,
      {
        details: {
          name: plan.name,
          displayName: plan.displayName,
          priceMonthly: plan.pricing.monthly,
          priceYearly: plan.pricing.yearly,
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      },
    );

    return plan;
  }

  /**
   * PATCH /admin/plans/:id - Update plan
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Plan name conflict' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    // Get before state for change tracking
    const beforePlan = await this.plansService.findOne(id);

    // Update plan
    const afterPlan = await this.plansService.update(id, dto);

    // Capture changes
    const changes = this.auditService.captureChanges(
      {
        name: beforePlan.name,
        displayName: beforePlan.displayName,
        linksPerMonth: beforePlan.limits.linksPerMonth,
        customDomains: beforePlan.limits.customDomains,
        teamMembers: beforePlan.limits.teamMembers,
        apiCallsPerMonth: beforePlan.limits.apiCallsPerMonth,
        analyticsRetentionDays: beforePlan.limits.analyticsRetentionDays,
        priceMonthly: beforePlan.pricing.monthly,
        priceYearly: beforePlan.pricing.yearly,
        isActive: beforePlan.isActive,
      },
      {
        name: afterPlan.name,
        displayName: afterPlan.displayName,
        linksPerMonth: afterPlan.limits.linksPerMonth,
        customDomains: afterPlan.limits.customDomains,
        teamMembers: afterPlan.limits.teamMembers,
        apiCallsPerMonth: afterPlan.limits.apiCallsPerMonth,
        analyticsRetentionDays: afterPlan.limits.analyticsRetentionDays,
        priceMonthly: afterPlan.pricing.monthly,
        priceYearly: afterPlan.pricing.yearly,
        isActive: afterPlan.isActive,
      },
    );

    // Audit log
    if (changes) {
      await this.auditService.logResourceEvent(
        user.id,
        null,
        'plan.updated',
        'PlanDefinition',
        id,
        {
          changes,
          context: {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        },
      );
    }

    return afterPlan;
  }

  /**
   * DELETE /admin/plans/:id - Soft delete (deactivate) plan
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Plan already inactive' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;

    // Get plan details before deletion
    const plan = await this.plansService.findOne(id);

    // Soft delete
    const result = await this.plansService.softDelete(id);

    // Audit log
    await this.auditService.logResourceEvent(
      user.id,
      null,
      'plan.deactivated',
      'PlanDefinition',
      id,
      {
        details: {
          name: plan.name,
          displayName: plan.displayName,
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      },
    );

    return result;
  }

  /**
   * POST /admin/plans/:id/restore - Restore (reactivate) plan
   */
  @Post(':id/restore')
  @ApiOperation({ summary: 'Reactivate a plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Plan already active' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;

    // Get plan details before restoration
    const plan = await this.plansService.findOne(id);

    // Restore
    const result = await this.plansService.restore(id);

    // Audit log
    await this.auditService.logResourceEvent(
      user.id,
      null,
      'plan.restored',
      'PlanDefinition',
      id,
      {
        details: {
          name: plan.name,
          displayName: plan.displayName,
        },
        context: {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      },
    );

    return result;
  }
}
