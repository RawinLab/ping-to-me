import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { QuotaService } from "../quota/quota.service";
import Stripe from "stripe";

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private quotaService: QuotaService,
  ) {
    const stripeKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    }
  }

  // Pricing plans configuration
  readonly plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      interval: "month",
      features: ["10 short links", "Basic analytics", "Standard support"],
      limits: { links: 10, customDomains: 0 },
    },
    {
      id: "pro",
      name: "Pro",
      price: 9,
      interval: "month",
      priceId: process.env.STRIPE_PRO_PRICE_ID,
      features: [
        "Unlimited short links",
        "Advanced analytics",
        "Custom domains",
        "1 Bio page",
        "Priority support",
      ],
      limits: { links: -1, customDomains: 3 },
    },
    {
      id: "business",
      name: "Business",
      price: 29,
      interval: "month",
      priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
      features: [
        "Unlimited short links",
        "Full analytics & reports",
        "Unlimited custom domains",
        "Unlimited Bio pages",
        "Team collaboration",
        "API access",
        "Dedicated support",
      ],
      limits: { links: -1, customDomains: -1 },
    },
  ];

  getPlans() {
    return this.plans;
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found");
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createBillingPortalSession(userId: string, returnUrl: string) {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException("No billing account found");
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }

    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET",
    );

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret || "",
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new BadRequestException(`Webhook error: ${message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      }
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    if (!this.stripe) return;

    const userId = session.metadata?.userId;
    if (!userId) return;

    // Get subscription details
    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.plans.find((p) => p.priceId === priceId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        plan: plan?.id || "pro",
        planExpiresAt: new Date(
          (subscription as any).current_period_end * 1000,
        ),
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    if (!this.stripe) return;

    const customer = await this.stripe.customers.retrieve(
      subscription.customer as string,
    );

    if ("deleted" in customer && customer.deleted) return;

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) return;

    // Get current user data for before state
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const oldPlan = user?.plan || "free";

    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.plans.find((p) => p.priceId === priceId);
    const newPlan = plan?.id || "free";

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status,
        plan: newPlan,
        planExpiresAt: new Date(
          (subscription as any).current_period_end * 1000,
        ),
      },
    });

    // Log plan change if plan actually changed
    if (oldPlan !== newPlan) {
      // Billing is user-specific, use userId as organizationId for audit logging
      this.auditService
        .logBillingEvent(
          userId,
          userId, // Billing is tied to user, not organization
          "billing.plan_changed",
          {
            changes: {
              before: { plan: oldPlan },
              after: { plan: newPlan },
            },
            details: {
              subscriptionId: subscription.id,
              status: subscription.status,
            },
          },
        )
        .catch(() => {}); // Fire and forget, don't block on errors
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    if (!this.stripe) return;

    const customer = await this.stripe.customers.retrieve(
      subscription.customer as string,
    );

    if ("deleted" in customer && customer.deleted) return;

    const userId = (customer as Stripe.Customer).metadata?.userId;
    if (!userId) return;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: null,
        subscriptionStatus: "canceled",
        plan: "free",
      },
    });

    // Log subscription cancellation - billing is user-specific
    this.auditService
      .logBillingEvent(
        userId,
        userId, // Billing is tied to user, not organization
        "billing.subscription_cancelled",
        {
          details: {
            subscriptionId: subscription.id,
            canceledAt: new Date(subscription.canceled_at || Date.now()),
          },
        },
      )
      .catch(() => {}); // Fire and forget, don't block on errors
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Could be used to store invoice history
    console.log("Invoice paid:", invoice.id);
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return {
      plan: user?.plan || "free",
      status: user?.subscriptionStatus || "inactive",
      expiresAt: user?.planExpiresAt,
    };
  }

  async getBillingHistory(userId: string) {
    if (!this.stripe) {
      return [];
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000),
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency,
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
    }));
  }

  /**
   * Check if downgrade would exceed new plan limits
   */
  async checkDowngradeImpact(
    orgId: string,
    newPlanName: string,
  ): Promise<{
    canDowngrade: boolean;
    overLimit: Array<{
      resource: string;
      current: number;
      newLimit: number;
      excess: number;
    }>;
  }> {
    // Get current usage
    const usage = await this.quotaService.getCurrentUsage(orgId);

    // Get new plan limits
    const newLimits = await this.quotaService.getPlanLimits(newPlanName);

    const overLimit: Array<{
      resource: string;
      current: number;
      newLimit: number;
      excess: number;
    }> = [];

    // Check each resource
    const checks = [
      {
        resource: "domains",
        current: usage.domains,
        limit: newLimits.customDomains,
      },
      {
        resource: "members",
        current: usage.members,
        limit: newLimits.teamMembers,
      },
    ];

    for (const check of checks) {
      if (check.limit !== -1 && check.current > check.limit) {
        overLimit.push({
          resource: check.resource,
          current: check.current,
          newLimit: check.limit,
          excess: check.current - check.limit,
        });
      }
    }

    return {
      canDowngrade: overLimit.length === 0,
      overLimit,
    };
  }
}
