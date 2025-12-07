import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  Param,
  BadRequestException,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Request as ExpressRequest } from "express";
import { PermissionGuard, Permission } from "../auth/rbac";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("plans")
  getPlans() {
    return this.paymentsService.getPlans();
  }

  @Get("subscription")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "billing", action: "read" })
  async getSubscription(@Request() req) {
    return this.paymentsService.getSubscription(req.user.id);
  }

  @Post("checkout")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "billing", action: "manage" })
  async createCheckout(
    @Request() req,
    @Body() body: { priceId: string; successUrl: string; cancelUrl: string },
  ) {
    return this.paymentsService.createCheckoutSession(
      req.user.id,
      body.priceId,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post("portal")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "billing", action: "manage" })
  async createPortal(@Request() req, @Body() body: { returnUrl: string }) {
    return this.paymentsService.createBillingPortalSession(
      req.user.id,
      body.returnUrl,
    );
  }

  @Get("billing-history")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "billing", action: "read" })
  async getBillingHistory(@Request() req) {
    return this.paymentsService.getBillingHistory(req.user.id);
  }

  @Post("webhook")
  async handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers("stripe-signature") signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @Get("organizations/:orgId/downgrade-check/:planName")
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permission({ resource: "billing", action: "read" })
  async checkDowngrade(
    @Param("orgId") orgId: string,
    @Param("planName") planName: string,
  ) {
    if (!orgId) {
      throw new BadRequestException("Organization ID is required");
    }
    return this.paymentsService.checkDowngradeImpact(orgId, planName);
  }
}
