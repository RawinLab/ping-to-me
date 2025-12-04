import { Controller, Get, Post, Body, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('plans')
  getPlans() {
    return this.paymentsService.getPlans();
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Request() req) {
    return this.paymentsService.getSubscription(req.user.id);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
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

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(
    @Request() req,
    @Body() body: { returnUrl: string },
  ) {
    return this.paymentsService.createBillingPortalSession(req.user.id, body.returnUrl);
  }

  @Get('billing-history')
  @UseGuards(JwtAuthGuard)
  async getBillingHistory(@Request() req) {
    return this.paymentsService.getBillingHistory(req.user.id);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
