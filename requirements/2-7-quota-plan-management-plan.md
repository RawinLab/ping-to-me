# Module 2.7: Quota/Plan Management Development Plan

## Document Information

- **Module**: 2.7 Quota/Plan Management
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Implementation**: ~25% Complete

---

## 1. Executive Summary

### Current State

- Basic Stripe integration working
- Hardcoded plan definitions in PaymentsService
- PlanType enum exists (FREE, PRO, ENTERPRISE)
- Billing page UI exists with hardcoded usage display

### Critical Gaps

- **No usage tracking at all** - System doesn't track resource usage
- **No quota enforcement** - Users can exceed plan limits
- **Hardcoded usage display** - Shows "23/50" always
- **No database models** for plan definitions or usage tracking

---

## 2. Feature Breakdown

### 2.7.1 Plan Definitions (Priority: HIGH)

| Feature                     | Status          | Priority |
| --------------------------- | --------------- | -------- |
| PlanType enum               | Implemented     | -        |
| Hardcoded plan features     | Implemented     | -        |
| Database-driven plan config | NOT IMPLEMENTED | HIGH     |
| Feature flags per plan      | NOT IMPLEMENTED | HIGH     |
| Plan comparison API         | NOT IMPLEMENTED | MEDIUM   |

**Plan Limits (per spec):**
| Plan | Links/mo | Domains | Members | API calls | Analytics |
|------|----------|---------|---------|-----------|-----------|
| FREE | 50 | 1 | 1 | 0 | 30 days |
| PRO | 1000 | 5 | 10 | 10K | 90 days |
| ENTERPRISE | Unlimited | Unlimited | Unlimited | Unlimited | 2 years |

### 2.7.2 Usage Tracking (Priority: HIGH)

| Feature                  | Status          | Priority |
| ------------------------ | --------------- | -------- |
| Track links created      | NOT IMPLEMENTED | HIGH     |
| Track API calls          | NOT IMPLEMENTED | HIGH     |
| Track domains added      | NOT IMPLEMENTED | MEDIUM   |
| Track team members       | NOT IMPLEMENTED | MEDIUM   |
| Monthly reset logic      | NOT IMPLEMENTED | HIGH     |
| Historical usage storage | NOT IMPLEMENTED | MEDIUM   |

### 2.7.3 Quota Enforcement (Priority: HIGH)

| Feature               | Status           | Priority |
| --------------------- | ---------------- | -------- |
| Block at link limit   | NOT IMPLEMENTED  | HIGH     |
| Block at domain limit | NOT IMPLEMENTED  | HIGH     |
| Block at member limit | NOT IMPLEMENTED  | HIGH     |
| API rate limiting     | Partial (global) | MEDIUM   |
| Show upgrade prompt   | NOT IMPLEMENTED  | HIGH     |

### 2.7.4 Usage Dashboard (Priority: MEDIUM)

| Feature                 | Status          | Priority |
| ----------------------- | --------------- | -------- |
| Current usage display   | Hardcoded stub  | HIGH     |
| Usage progress bars     | Hardcoded stub  | HIGH     |
| Usage alerts (80%)      | NOT IMPLEMENTED | MEDIUM   |
| Historical usage charts | NOT IMPLEMENTED | LOW      |

### 2.7.5 Upgrade/Downgrade Flow (Priority: MEDIUM)

| Feature            | Status          | Priority |
| ------------------ | --------------- | -------- |
| Stripe checkout    | Implemented     | -        |
| Webhook handling   | Implemented     | -        |
| Downgrade warnings | NOT IMPLEMENTED | HIGH     |
| Grace period       | NOT IMPLEMENTED | MEDIUM   |
| Prorated billing   | Stripe handles  | -        |

---

## 3. Database Schema

```prisma
// Plan Definitions (database-driven)
model PlanDefinition {
  id                    String   @id @default(uuid())
  name                  String   @unique  // 'free', 'pro', 'enterprise'
  displayName           String
  linksPerMonth         Int      // -1 = unlimited
  customDomains         Int
  teamMembers           Int
  apiCallsPerMonth      Int
  analyticsRetentionDays Int
  priceMonthly          Decimal  @db.Decimal(10, 2)
  priceYearly           Decimal  @db.Decimal(10, 2)
  features              String[] // Feature list for display
  stripePriceIdMonthly  String?
  stripePriceIdYearly   String?
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// Usage Tracking
model UsageTracking {
  id                String   @id @default(uuid())
  organizationId    String   @db.Uuid
  yearMonth         String   // 'YYYY-MM' format
  linksCreated      Int      @default(0)
  apiCalls          Int      @default(0)
  teamMembersActive Int      @default(0)
  customDomains     Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, yearMonth])
  @@index([organizationId])
  @@index([yearMonth])
}

// Usage Events (for detailed tracking)
model UsageEvent {
  id             String   @id @default(uuid())
  organizationId String   @db.Uuid
  userId         String?  @db.Uuid
  eventType      String   // 'link_created', 'api_call', etc.
  resourceId     String?
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([organizationId, createdAt])
  @@index([eventType, createdAt])
}
```

---

## 4. API Endpoints

```yaml
# Plan Information
GET    /plans                          - List available plans
GET    /plans/:id                      - Get plan details
GET    /plans/compare                  - Feature comparison matrix

# Usage Tracking
GET    /organizations/:id/usage        - Current month usage
GET    /organizations/:id/usage/history - Historical usage
GET    /organizations/:id/usage/limits - Current limits vs usage
POST   /organizations/:id/usage/check  - Check if action allowed

# Quota Management
GET    /organizations/:id/quota        - Full quota status
POST   /organizations/:id/quota/request-increase - Request limit increase

# Billing (existing, enhanced)
GET    /payments/subscription          - Current subscription
POST   /payments/checkout              - Create checkout session
POST   /payments/portal                - Billing portal
GET    /payments/billing-history       - Invoice history
POST   /payments/webhook               - Stripe webhook
```

---

## 5. Quota Enforcement Service

```typescript
// apps/api/src/quota/quota.service.ts

@Injectable()
export class QuotaService {
  async checkQuota(
    orgId: string,
    resource: "links" | "domains" | "members" | "api_calls",
  ): Promise<QuotaCheckResult> {
    const org = await this.getOrgWithPlan(orgId);
    const usage = await this.getCurrentUsage(orgId);
    const limits = await this.getPlanLimits(org.plan);

    const currentUsage = usage[resource];
    const limit = limits[resource];

    if (limit === -1) {
      return { allowed: true, unlimited: true };
    }

    return {
      allowed: currentUsage < limit,
      currentUsage,
      limit,
      remaining: limit - currentUsage,
      percentUsed: (currentUsage / limit) * 100,
    };
  }

  async incrementUsage(
    orgId: string,
    resource: "links" | "domains" | "members" | "api_calls",
  ): Promise<void> {
    const yearMonth = this.getCurrentYearMonth();
    await this.prisma.usageTracking.upsert({
      where: { organizationId_yearMonth: { organizationId: orgId, yearMonth } },
      create: { organizationId: orgId, yearMonth, [resource]: 1 },
      update: { [resource]: { increment: 1 } },
    });
  }

  async decrementUsage(
    orgId: string,
    resource: "links" | "domains" | "members",
  ): Promise<void> {
    // Similar to increment but decrement
  }
}
```

---

## 6. Integration Points

### Links Service Integration

```typescript
// apps/api/src/links/links.service.ts

async create(userId: string, dto: CreateLinkDto) {
  // Check quota BEFORE creating
  const quotaCheck = await this.quotaService.checkQuota(
    dto.organizationId,
    'links'
  );

  if (!quotaCheck.allowed) {
    throw new ForbiddenException({
      code: 'QUOTA_EXCEEDED',
      message: 'Monthly link limit reached',
      currentUsage: quotaCheck.currentUsage,
      limit: quotaCheck.limit,
      upgradeUrl: '/pricing'
    });
  }

  const link = await this.prisma.link.create({...});

  // Increment usage AFTER successful creation
  await this.quotaService.incrementUsage(dto.organizationId, 'links');

  return link;
}
```

### Similar integration needed for:

- `domains.service.ts` - domain limit
- `organization.service.ts` - member limit
- API middleware - API call tracking

---

## 7. Test Cases

### E2E Tests: `apps/web/e2e/quota-plan.spec.ts`

```typescript
test.describe("Quota & Plan Management", () => {
  // Plan Display
  test("QPM-001: View available plans");
  test("QPM-002: Compare plan features");
  test("QPM-003: View current subscription");

  // Usage Tracking
  test("QPM-010: Usage increments on link creation");
  test("QPM-011: Usage decrements on link deletion");
  test("QPM-012: Usage resets monthly");
  test("QPM-013: View usage history");

  // Quota Enforcement
  test("QPM-020: Block link creation at limit");
  test("QPM-021: Show upgrade prompt at limit");
  test("QPM-022: Block domain addition at limit");
  test("QPM-023: Block member invite at limit");
  test("QPM-024: Unlimited plan allows unlimited resources");

  // Usage Dashboard
  test("QPM-030: Display current usage");
  test("QPM-031: Show usage progress bars");
  test("QPM-032: Warning at 80% usage");
  test("QPM-033: Alert at 100% usage");

  // Upgrade/Downgrade
  test("QPM-040: Upgrade to Pro plan");
  test("QPM-041: Downgrade warning when exceeding");
  test("QPM-042: Grace period on downgrade");
  test("QPM-043: Cancel subscription");

  // API Rate Limiting
  test("QPM-050: API calls tracked per org");
  test("QPM-051: API blocked at limit");
  test("QPM-052: Rate limit headers in response");
});
```

---

## 8. Frontend Components

### Usage Dashboard Component

```typescript
// apps/web/components/billing/UsageDashboard.tsx

interface UsageDashboardProps {
  organizationId: string;
}

// Displays:
// - Links: 45/50 used (90%) [=========-]
// - Domains: 1/1 used (100%) [==========]
// - Members: 1/1 used (100%) [==========]
// - API Calls: 0/0 (Free plan)
//
// Warning badge at 80%
// Error badge at 100% with upgrade CTA
```

### Upgrade Prompt Modal

```typescript
// apps/web/components/billing/UpgradePrompt.tsx

// Triggered when user hits quota
// Shows:
// - Which limit was reached
// - Current plan vs upgrade options
// - Feature comparison
// - CTA to upgrade
```

---

## 9. Implementation Timeline

| Phase     | Duration    | Deliverables                            |
| --------- | ----------- | --------------------------------------- |
| Phase 1   | 2 weeks     | Database models, usage tracking service |
| Phase 2   | 1 week      | Quota enforcement in all services       |
| Phase 3   | 1 week      | Usage dashboard UI, upgrade prompts     |
| Phase 4   | 1 week      | Alerts, downgrade handling, polish      |
| **Total** | **5 weeks** | Complete Module 2.7                     |

---

## 10. Current Implementation Files

- `apps/api/src/payments/payments.service.ts` - Stripe integration
- `apps/api/src/payments/payments.controller.ts` - Payment endpoints
- `apps/api/src/links/links.service.ts` - Needs quota check
- `apps/web/app/dashboard/billing/page.tsx` - Hardcoded usage
- `apps/web/app/pricing/page.tsx` - Pricing page
- `apps/web/config/pricing.ts` - Plan configuration
