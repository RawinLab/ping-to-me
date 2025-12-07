# Module 1.12: Plan Upgrade / Payment Portal - Development Plan

## Executive Summary

**Module**: 1.12 Plan Upgrade / Payment Portal
**Status**: ~90% Complete
**Priority**: High
**Complexity**: High

The Payment Portal has comprehensive Stripe integration with checkout sessions, billing portal, webhook handling, and quota management. The implementation is production-ready with minor gaps in monthly quota reset and admin plan configuration.

---

## Current Implementation Status

### Database Schema

```prisma
// User Model (Subscription Fields)
model User {
  stripeCustomerId     String?
  subscriptionId       String?
  subscriptionStatus   String?
  plan                 String   @default("free")
  planExpiresAt        DateTime?
}

// Plan Definitions
model PlanDefinition {
  id                     String
  name                   String   @unique
  linksPerMonth          Int      // -1 = unlimited
  customDomains          Int
  teamMembers            Int
  apiCallsPerMonth       Int
  analyticsRetentionDays Int
  priceMonthly           Decimal
  priceYearly            Decimal
  stripePriceIdMonthly   String?
  stripePriceIdYearly    String?
}

// Usage Tracking
model UsageTracking {
  organizationId String
  yearMonth      String
  linksCreated   Int
  apiCalls       Int
}
```

### Backend Payments (~95% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Stripe Integration | Implemented | payments.service.ts |
| Plan Definitions | Implemented | Hardcoded + DB |
| Checkout Sessions | Implemented | POST /checkout |
| Billing Portal | Implemented | POST /portal |
| Webhook Handling | Implemented | POST /webhook |
| Invoice History | Implemented | GET /billing-history |
| Subscription Status | Implemented | GET /subscription |
| Downgrade Check | Implemented | GET /downgrade-check |
| Audit Logging | Implemented | All subscription changes |
| RBAC | Implemented | billing:read, billing:manage |

### Backend Quota (~90% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| QuotaService | Implemented | quota.service.ts |
| Check Quota | Implemented | checkQuota() |
| Increment Usage | Implemented | incrementUsage() |
| Decrement Usage | Implemented | decrementUsage() |
| Usage vs Limits | Implemented | GET /usage/limits |
| Usage History | Implemented | GET /usage/history |
| API Quota Guard | Implemented | ApiQuotaGuard |
| Monthly Reset | NOT IMPLEMENTED | No cron job |

### Frontend Billing (~85% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Billing Dashboard | Implemented | /dashboard/billing |
| Current Plan Display | Implemented | Plan card |
| Usage Dashboard | Implemented | UsageDashboard.tsx |
| Usage Alerts | Implemented | UsageAlerts.tsx |
| Upgrade Prompt | Implemented | UpgradePrompt.tsx |
| Downgrade Warning | Implemented | DowngradeWarning.tsx |
| Pricing Page | Implemented | /pricing |
| Stripe Checkout | Implemented | Redirect flow |
| Billing Portal | Implemented | Redirect to Stripe |
| Invoice Download | Implemented | PDF links |
| Admin Plan Config | NOT IMPLEMENTED | - |

### E2E Tests

Tested via quota.service.spec.ts (1037 lines, 50+ tests)

---

## Plan Configuration

### Current Plans (Hardcoded)

| Plan | Price | Links/Mo | Domains | Members | API Calls |
|------|-------|----------|---------|---------|-----------|
| Free | $0 | 50 | 1 | 1 | 0 |
| Pro | $9 | 1,000 | 5 | 10 | 10,000 |
| Business | $29 | Unlimited | Unlimited | Unlimited | Unlimited |

### Stripe Integration

- **Environment Variables**:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_BUSINESS_PRICE_ID`

- **Webhook Events**:
  - `checkout.session.completed` - Activate subscription
  - `customer.subscription.updated` - Plan change
  - `customer.subscription.deleted` - Cancel to free
  - `invoice.paid` - Logged

---

## Gap Analysis

### Minor Gaps

1. **Monthly Quota Reset**
   - No cron job to reset monthly usage
   - UsageTracking uses yearMonth key (auto-resets)
   - But no cleanup of old data

2. **Admin Plan Configuration**
   - PlanDefinition table exists
   - No admin UI to manage plans
   - Plans hardcoded in PaymentsService

3. **Seat-Based Pricing**
   - Fixed team member limits
   - No per-seat pricing model

4. **Annual Billing UI**
   - Backend supports yearly prices
   - Frontend has toggle but may need polish

5. **Tax/VAT Handling**
   - No tax calculation
   - No EU VAT support

---

## Feature Breakdown by Priority

### Priority 0 (Complete) - No Action Needed

The payments module is production-ready.

### Priority 1 (Enhancement)

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| PAY-001 | Monthly reset cron | Scheduled task | - | Unit |
| PAY-002 | Usage cleanup cron | Delete old records | - | Unit |
| PAY-003 | Admin plan config | CRUD endpoints | Admin UI | E2E |

### Priority 2 (Future)

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| PAY-004 | Seat-based pricing | Per-member billing | Seat selector | E2E |
| PAY-005 | Proration | Mid-cycle changes | - | Unit |
| PAY-006 | Tax/VAT | Stripe Tax | Address input | E2E |
| PAY-007 | Payment methods | Card management | Payment UI | E2E |

---

## Implementation Details

### 1. Monthly Reset Cron Job

```typescript
// apps/api/src/quota/quota.cron.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class QuotaCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 1 * *') // First day of each month at midnight
  async resetMonthlyQuotas() {
    const currentMonth = this.getCurrentYearMonth();

    // Create new tracking records for all organizations
    const orgs = await this.prisma.organization.findMany({
      select: { id: true },
    });

    for (const org of orgs) {
      await this.prisma.usageTracking.upsert({
        where: {
          organizationId_yearMonth: {
            organizationId: org.id,
            yearMonth: currentMonth,
          },
        },
        create: {
          organizationId: org.id,
          yearMonth: currentMonth,
          linksCreated: 0,
          apiCalls: 0,
        },
        update: {}, // No update needed if exists
      });
    }

    // Optional: Clean up old records (keep 12 months)
    const cutoffMonth = this.getYearMonthOffset(-12);
    await this.prisma.usageTracking.deleteMany({
      where: {
        yearMonth: { lt: cutoffMonth },
      },
    });
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getYearMonthOffset(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
```

### 2. Admin Plan Configuration

```typescript
// apps/api/src/admin/plans.controller.ts
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPlansController {
  @Get()
  async listPlans() {
    return this.plansService.findAll();
  }

  @Post()
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: string) {
    return this.plansService.softDelete(id);
  }
}
```

---

## Current Checkout Flow

```
1. User clicks "Upgrade" on Pricing page
2. Frontend: POST /payments/checkout { planId, billingPeriod }
3. Backend: Create Stripe checkout session
4. Redirect to Stripe Checkout
5. User completes payment
6. Stripe sends webhook: checkout.session.completed
7. Backend: Update user.plan, subscriptionId, status
8. Redirect to /dashboard/billing?success=true
9. UI shows success message
```

## Current Billing Portal Flow

```
1. User clicks "Manage Billing" on Billing page
2. Frontend: POST /payments/portal
3. Backend: Create Stripe billing portal session
4. Redirect to Stripe Billing Portal
5. User manages: Payment methods, invoices, cancel subscription
6. Stripe sends webhooks for changes
7. Backend updates subscription status
8. User returns to /dashboard/billing
```

---

## Unit Test Coverage

**File**: quota.service.spec.ts (1037 lines)

**Covered Scenarios**:
- Year-month formatting
- Plan limits retrieval (DB + fallback)
- Current usage calculation
- Quota checking (all resources)
- Unlimited plan handling
- Usage increment/decrement
- Edge cases (zero, large numbers)
- Quota event logging
- Full quota status
- Usage history

---

## Summary

Module 1.12 Plan Upgrade / Payment Portal is approximately 90% complete and production-ready. The Stripe integration is comprehensive with proper webhook handling, quota management, and audit logging.

**Current Strengths**:
1. Complete Stripe checkout and portal integration
2. Robust quota enforcement with usage tracking
3. Downgrade protection with warnings
4. Comprehensive unit test coverage
5. Audit logging for all subscription changes

**Minor Gaps**:
1. Monthly reset cron job (add scheduled task)
2. Admin plan configuration UI
3. Old usage data cleanup

**No Blockers**: The payment system is ready for production. All identified gaps are enhancements.
