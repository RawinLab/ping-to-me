# Module 2.7: Quota/Plan Management - Development Todolist

## Document Information

- **Module**: 2.7 Quota/Plan Management
- **Source**: `2-7-quota-plan-management-plan.md`
- **Generated**: 2025-12-07
- **Updated**: 2025-12-08
- **For**: Claude Code Subagent Development
- **Current Implementation**: ✅ ~95% Complete

---

## Implementation Summary

### Completed Features ✅

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Database Schema (PlanDefinition, UsageTracking, UsageEvent) | ✅ Complete |
| Phase 1 | Quota Service (check, increment, decrement) | ✅ Complete |
| Phase 2 | Quota Enforcement (Links, Domains, Members) | ✅ Complete |
| Phase 2 | Usage API Endpoints | ✅ Complete |
| Phase 3 | Frontend Usage Dashboard | ✅ Complete |
| Phase 3 | Upgrade/Downgrade Flow | ✅ Complete |
| Phase 4 | Unit Tests (56 tests) | ✅ Complete |
| Phase 4 | E2E Tests (21 tests) | ✅ Complete |

### Key Files Created/Modified

**Backend:**
- `packages/database/prisma/schema.prisma` - Added PlanDefinition, UsageTracking, UsageEvent models
- `apps/api/src/quota/` - New QuotaService, QuotaController, ApiQuotaGuard
- `apps/api/src/plans/` - New PlansService, PlansController
- `apps/api/src/links/links.service.ts` - Integrated quota check
- `apps/api/src/domains/domains.service.ts` - Integrated quota check
- `apps/api/src/organizations/organization.service.ts` - Integrated quota check
- `apps/api/src/payments/payments.service.ts` - Added downgrade check

**Frontend:**
- `apps/web/components/billing/UsageDashboard.tsx` - Usage display
- `apps/web/components/billing/UsageAlerts.tsx` - Warning/error alerts
- `apps/web/components/billing/UpgradePrompt.tsx` - Upgrade modal
- `apps/web/components/billing/DowngradeWarning.tsx` - Downgrade warning
- `apps/web/hooks/useQuotaError.ts` - Quota error handling hook
- `apps/web/app/dashboard/billing/page.tsx` - Real usage data
- `apps/web/app/pricing/page.tsx` - Dynamic plan data

**Tests:**
- `apps/api/src/quota/quota.service.spec.ts` - 56 unit tests
- `apps/web/e2e/quota-plan.spec.ts` - 21 E2E tests

### Commands

```bash
# Database migration
pnpm --filter @pingtome/database db:push
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:seed

# Run API
pnpm --filter api dev

# Run Web
pnpm --filter web dev

# Run tests
pnpm --filter api test quota.service.spec
npx playwright test apps/web/e2e/quota-plan.spec.ts
```

### Resolved Issues

- ~~**No usage tracking at all**~~ ✅ UsageTracking model tracks monthly usage
- ~~**No quota enforcement**~~ ✅ QuotaService enforces limits in all services
- ~~**Hardcoded usage display**~~ ✅ Real data from API on billing page

### Plan Limits Reference

| Plan       | Links/mo  | Domains   | Members   | API calls | Analytics |
| ---------- | --------- | --------- | --------- | --------- | --------- |
| FREE       | 50        | 1         | 1         | 0         | 30 days   |
| PRO        | 1000      | 5         | 10        | 10K       | 90 days   |
| ENTERPRISE | Unlimited | Unlimited | Unlimited | Unlimited | 2 years   |

---

## Phase 1: Database Schema (Week 1)

### TASK-2.7.1: Create PlanDefinition Model ✅

**Priority**: HIGH | **Type**: Database | **Estimated**: 1-2 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Create `PlanDefinition` model with fields:
  - `id` (UUID, primary key)
  - `name` (String, unique - 'free', 'pro', 'enterprise')
  - `displayName` (String)
  - `linksPerMonth` (Int, -1 = unlimited)
  - `customDomains` (Int)
  - `teamMembers` (Int)
  - `apiCallsPerMonth` (Int)
  - `analyticsRetentionDays` (Int)
  - `priceMonthly` (Decimal)
  - `priceYearly` (Decimal)
  - `features` (String[], feature list for display)
  - `stripePriceIdMonthly` (String, optional)
  - `stripePriceIdYearly` (String, optional)
  - `isActive` (Boolean, default true)
  - `createdAt`, `updatedAt`

**Acceptance Criteria**:

- ✅ Model created successfully
- ✅ Can store plan configuration

---

### TASK-2.7.2: Create UsageTracking Model ✅

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Create `UsageTracking` model with fields:
  - `id` (UUID, primary key)
  - `organizationId` (UUID, foreign key)
  - `yearMonth` (String, 'YYYY-MM' format)
  - `linksCreated` (Int, default 0)
  - `apiCalls` (Int, default 0)
  - `teamMembersActive` (Int, default 0)
  - `customDomains` (Int, default 0)
  - `createdAt`, `updatedAt`
- [x] Add relation to Organization
- [x] Add unique constraint on `[organizationId, yearMonth]`
- [x] Add indexes on `organizationId`, `yearMonth`

**Acceptance Criteria**:

- ✅ One record per org per month
- ✅ Tracks all resource types

---

### TASK-2.7.3: Create UsageEvent Model (Optional) ✅

**Priority**: LOW | **Type**: Database | **Estimated**: 30 minutes
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Create `UsageEvent` model for detailed tracking:
  - `id` (UUID, primary key)
  - `organizationId` (UUID)
  - `userId` (UUID, optional)
  - `eventType` (String - 'link_created', 'api_call', etc.)
  - `resourceId` (String, optional)
  - `metadata` (Json, optional)
  - `createdAt`
- [x] Add indexes for querying

**Acceptance Criteria**:

- ✅ Can track individual usage events
- ✅ Useful for detailed analysis

---

### TASK-2.7.4: Seed Plan Definitions ✅

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/seed.ts`

**Subtasks**:

- [x] Create seed data for FREE plan:
  - linksPerMonth: 50, domains: 1, members: 1, apiCalls: 0, analytics: 30
- [x] Create seed data for PRO plan:
  - linksPerMonth: 1000, domains: 5, members: 10, apiCalls: 10000, analytics: 90
- [x] Create seed data for ENTERPRISE plan:
  - linksPerMonth: -1, domains: -1, members: -1, apiCalls: -1, analytics: 730
- [x] Include features array for each plan
- [x] Add Stripe price IDs (can be updated later)

**Acceptance Criteria**:

- ✅ Plans seeded correctly
- ✅ Limits match specification

---

## Phase 1: Quota Service (Week 1-2)

### TASK-2.7.5: Create Quota Service ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/quota/quota.service.ts` (new)

**Subtasks**:

- [x] Create `QuotaService` class
- [x] Inject `PrismaService`
- [x] Implement `getOrgWithPlan(orgId)` - fetch org with plan details
- [x] Implement `getPlanLimits(planName)` - get limits from PlanDefinition
- [x] Implement `getCurrentUsage(orgId)` - get current month's usage
- [x] Implement `getCurrentYearMonth()` - returns 'YYYY-MM'

**Acceptance Criteria**:

- ✅ Service structure created
- ✅ Basic methods implemented

---

### TASK-2.7.6: Implement Quota Check Method ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/quota/quota.service.ts`

**Subtasks**:

- [x] Implement `checkQuota(orgId, resource)` method
- [x] Parameter `resource`: 'links' | 'domains' | 'members' | 'api_calls'
- [x] Fetch org's plan limits
- [x] Fetch current usage
- [x] Compare current vs limit
- [x] Return `QuotaCheckResult`:
  ```typescript
  {
    allowed: boolean;
    unlimited?: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  }
  ```
- [x] Handle unlimited (-1) case

**Acceptance Criteria**:

- ✅ Accurate quota checks
- ✅ Unlimited plans handled
- ✅ Result includes usage details

---

### TASK-2.7.7: Implement Usage Increment/Decrement ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/quota/quota.service.ts`

**Subtasks**:

- [x] Implement `incrementUsage(orgId, resource)` method:
  - Get current year-month
  - Upsert UsageTracking record
  - Increment the appropriate field
- [x] Implement `decrementUsage(orgId, resource)` method:
  - Similar to increment but decrement
  - Don't go below 0
- [x] Both methods should be atomic (transaction)

**Acceptance Criteria**:

- ✅ Usage incremented on resource creation
- ✅ Usage decremented on resource deletion
- ✅ Thread-safe/atomic

---

### TASK-2.7.8: Create Quota Module ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/quota/quota.module.ts` (new)

**Subtasks**:

- [x] Create `QuotaModule`
- [x] Export `QuotaService`
- [x] Make globally available (or import where needed)
- [x] Register in `app.module.ts`

**Acceptance Criteria**:

- ✅ Module registered
- ✅ Service injectable in other modules

---

## Phase 2: Quota Enforcement (Week 2)

### TASK-2.7.9: Integrate Quota Check in Links Service ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/links/links.service.ts`

**Subtasks**:

- [x] Inject `QuotaService`
- [x] In `create()` method:
  - Call `checkQuota(orgId, 'links')` BEFORE creating
  - If not allowed, throw `ForbiddenException` with quota info
  - On success, call `incrementUsage(orgId, 'links')`
- [x] In `delete()` method:
  - Call `decrementUsage(orgId, 'links')` after deletion
- [x] Handle bulk operations appropriately

**Exception Response**:

```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "Monthly link limit reached",
  "currentUsage": 50,
  "limit": 50,
  "upgradeUrl": "/pricing"
}
```

**Acceptance Criteria**:

- ✅ Link creation blocked at limit
- ✅ Usage tracked on create/delete
- ✅ Helpful error message returned

---

### TASK-2.7.10: Integrate Quota Check in Domains Service ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [x] Inject `QuotaService`
- [x] In `create()` method:
  - Call `checkQuota(orgId, 'domains')` BEFORE creating
  - Throw exception if exceeded
  - Increment usage on success
- [x] In `delete()` method:
  - Decrement usage after deletion
- [x] Note: domains don't reset monthly (total count)

**Acceptance Criteria**:

- ✅ Domain addition blocked at limit
- ✅ Usage tracked correctly

---

### TASK-2.7.11: Integrate Quota Check in Organization Service (Members) ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Subtasks**:

- [x] Inject `QuotaService`
- [x] In `addMember()` or invitation acceptance:
  - Call `checkQuota(orgId, 'members')` BEFORE adding
  - Throw exception if exceeded
  - Increment usage on success
- [x] In `removeMember()`:
  - Decrement usage after removal
- [x] Note: members don't reset monthly (total count)

**Acceptance Criteria**:

- ✅ Member invite blocked at limit
- ✅ Usage tracked correctly

---

### TASK-2.7.12: Implement API Rate Limiting by Quota ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/quota/api-quota.guard.ts` (new)

**Subtasks**:

- [x] Create `ApiQuotaGuard` that checks API call quota
- [x] Extract organization from API key
- [x] Call `checkQuota(orgId, 'api_calls')`
- [x] Increment usage on each API call
- [x] Return 429 with quota info when exceeded
- [x] Add rate limit headers to response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

**Acceptance Criteria**:

- ✅ API calls tracked per org
- ✅ Returns 429 at limit
- ✅ Headers included

---

### TASK-2.7.13: Implement Monthly Reset Logic ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/quota/quota.service.ts`

**Subtasks**:

- [x] Usage automatically resets with new month (new record created)
- [x] Create `recalculateStaticUsage(orgId)` method:
  - Count actual domains, members (these don't reset)
  - Update current month's record
- [x] Create cron job to run on 1st of each month
- [x] Verify no data loss on month rollover

**Acceptance Criteria**:

- ✅ Links/API reset monthly
- ✅ Domains/members are actual counts
- ✅ Clean month transitions

---

## Phase 2: Usage API Endpoints (Week 2-3)

### TASK-2.7.14: Create Quota Controller ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/quota/quota.controller.ts` (new)

**Subtasks**:

- [x] Create `QuotaController`
- [x] Add `GET /organizations/:id/usage` - Current month usage
- [x] Add `GET /organizations/:id/usage/history` - Historical usage (last 12 months)
- [x] Add `GET /organizations/:id/usage/limits` - Current limits vs usage
- [x] Add `POST /organizations/:id/usage/check` - Check if action allowed
  - Body: `{ resource: 'links' | 'domains' | 'members' | 'api_calls' }`
  - Returns: `QuotaCheckResult`
- [x] Add `GET /organizations/:id/quota` - Full quota status

**Acceptance Criteria**:

- ✅ All endpoints return accurate data
- ✅ History available for reporting

---

### TASK-2.7.15: Create Plans API Endpoints ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/plans/plans.controller.ts` (new)

**Subtasks**:

- [x] Create `PlansController`
- [x] Add `GET /plans` - List available plans (public)
- [x] Add `GET /plans/:id` - Get plan details (public)
- [x] Add `GET /plans/compare` - Feature comparison matrix (public)
- [x] Return plans with features, limits, pricing

**Acceptance Criteria**:

- ✅ Public endpoints for pricing page
- ✅ Feature comparison available

---

## Phase 3: Frontend - Usage Dashboard (Week 3)

### TASK-2.7.16: Create Usage Dashboard Component ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4-5 hours
**File**: `apps/web/components/billing/UsageDashboard.tsx` (new)

**Subtasks**:

- [x] Create component accepting `organizationId` prop
- [x] Fetch usage data from API
- [x] Display for each resource:
  - Label (e.g., "Links")
  - Progress bar showing usage percentage
  - Text showing "45/50 used"
  - Color coding: green (<70%), yellow (70-90%), red (>90%)
- [x] Show "Unlimited" badge for unlimited resources
- [x] Add warning badge at 80% usage
- [x] Add error badge at 100% with upgrade CTA
- [x] Loading skeleton while fetching

**Acceptance Criteria**:

- ✅ Accurate usage displayed
- ✅ Visual indicators for limits
- ✅ Upgrade prompt shown

---

### TASK-2.7.17: Update Billing Page with Real Usage ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/app/dashboard/billing/page.tsx`

**Subtasks**:

- [x] Remove hardcoded "23/50" usage display
- [x] Integrate UsageDashboard component
- [x] Show current plan details
- [x] Show usage for all resources:
  - Links created this month
  - Custom domains
  - Team members
  - API calls (if applicable)
- [x] Add link to detailed usage history

**Acceptance Criteria**:

- ✅ Real usage displayed
- ✅ Matches actual database values

---

### TASK-2.7.18: Create Upgrade Prompt Modal ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/billing/UpgradePrompt.tsx` (new)

**Subtasks**:

- [x] Create modal triggered when quota exceeded
- [x] Display:
  - Which limit was reached (e.g., "Link limit reached")
  - Current plan vs upgrade options
  - Feature comparison table
  - Price difference
  - "Upgrade Now" CTA button
- [x] Can be triggered from any page
- [x] Link to pricing/checkout

**Acceptance Criteria**:

- ✅ Clear message about limit
- ✅ Easy path to upgrade
- ✅ Can be reused across app

---

### TASK-2.7.19: Handle Quota Errors in UI ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**Files**: Various pages

**Subtasks**:

- [x] Create `useQuotaError` hook to handle QUOTA_EXCEEDED errors
- [x] In link creation page: show upgrade prompt on 403/quota error
- [x] In domain add: show upgrade prompt
- [x] In team invite: show upgrade prompt
- [x] Display user-friendly message with upgrade option
- [x] Don't show generic error for quota issues

**Acceptance Criteria**:

- ✅ Quota errors handled gracefully
- ✅ Upgrade path always shown

---

### TASK-2.7.20: Add Usage Alerts/Warnings ✅

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/components/billing/UsageAlerts.tsx` (new)

**Subtasks**:

- [x] Create component showing usage warnings
- [x] Display alert when any resource > 80%
- [x] Display critical alert when any resource = 100%
- [x] Show in dashboard header or sidebar
- [x] Link to billing page
- [x] Dismissable but reappears

**Acceptance Criteria**:

- ✅ Warnings visible before hitting limit
- ✅ Don't overwhelm user

---

### TASK-2.7.21: Update Pricing Page with Plan Data ✅

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/app/pricing/page.tsx`

**Subtasks**:

- [x] Fetch plans from API instead of hardcoded config
- [x] Display all plan limits dynamically
- [x] Show feature comparison matrix
- [x] Highlight current user's plan (if logged in)
- [x] CTA buttons for each plan

**Acceptance Criteria**:

- ✅ Plans loaded from database
- ✅ Accurate limits displayed

---

## Phase 3: Upgrade/Downgrade Flow (Week 3-4)

### TASK-2.7.22: Implement Downgrade Warnings ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/payments/payments.service.ts`

**Subtasks**:

- [x] Create `checkDowngradeImpact(orgId, newPlan)` method
- [x] Compare current usage vs new plan limits
- [x] Return which resources would be over limit:
  ```typescript
  {
    canDowngrade: boolean;
    overLimit: [
      { resource: "links", current: 150, newLimit: 50 },
      { resource: "domains", current: 3, newLimit: 1 },
    ];
  }
  ```
- [x] Add `GET /payments/downgrade-check/:planId` endpoint

**Acceptance Criteria**:

- ✅ Users warned before downgrade
- ✅ Clear message about what's over limit

---

### TASK-2.7.23: Create Downgrade Warning UI ✅

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/components/billing/DowngradeWarning.tsx` (new)

**Subtasks**:

- [x] Create modal showing downgrade impact
- [x] List resources that would be over limit
- [x] Explain what happens (e.g., "You'll need to delete 100 links")
- [x] Require confirmation to proceed
- [x] Option to cancel downgrade

**Acceptance Criteria**:

- ✅ Clear impact shown
- ✅ User must acknowledge

---

### TASK-2.7.24: Implement Grace Period for Downgrades ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/payments/payments.service.ts`

**Subtasks**:

- [x] On downgrade, give 7-day grace period
- [x] During grace period:
  - Don't hard-block at new limits
  - Show warnings to reduce usage
- [x] After grace period:
  - Soft-block new creations if over limit
  - Don't delete existing resources
- [x] Create `checkGracePeriod(orgId)` method

**Acceptance Criteria**:

- ✅ Grace period gives time to adjust
- ✅ No data loss
- ✅ Eventually enforces new limits

---

## Phase 4: Testing (Week 4)

### TASK-2.7.25: Write Quota Service Unit Tests ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/api/src/quota/quota.service.spec.ts`

**Test Cases**:

- [x] Check quota returns correct result
- [x] Unlimited plan returns allowed: true
- [x] Usage at limit returns allowed: false
- [x] Increment usage works correctly
- [x] Decrement usage doesn't go below 0
- [x] Monthly reset works
- [x] Static resources (domains, members) don't reset

**Acceptance Criteria**:

- ✅ All tests pass
- ✅ Edge cases covered

---

### TASK-2.7.26: Write E2E Tests - Usage Tracking ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/quota-plan.spec.ts`

**Test Cases**:

- [x] QPM-010: Usage increments on link creation
- [x] QPM-011: Usage decrements on link deletion
- [x] QPM-012: Usage resets monthly (mock time)
- [x] QPM-013: View usage history

**Acceptance Criteria**:

- ✅ Tracking tests pass

---

### TASK-2.7.27: Write E2E Tests - Quota Enforcement ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3-4 hours
**File**: `apps/web/e2e/quota-plan.spec.ts`

**Test Cases**:

- [x] QPM-020: Block link creation at limit
- [x] QPM-021: Show upgrade prompt at limit
- [x] QPM-022: Block domain addition at limit
- [x] QPM-023: Block member invite at limit
- [x] QPM-024: Unlimited plan allows unlimited resources

**Acceptance Criteria**:

- ✅ Enforcement tests pass
- ✅ Upgrade prompts shown

---

### TASK-2.7.28: Write E2E Tests - Usage Dashboard ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/quota-plan.spec.ts`

**Test Cases**:

- [x] QPM-030: Display current usage
- [x] QPM-031: Show usage progress bars
- [x] QPM-032: Warning at 80% usage
- [x] QPM-033: Alert at 100% usage

**Acceptance Criteria**:

- ✅ Dashboard tests pass

---

### TASK-2.7.29: Write E2E Tests - Upgrade/Downgrade ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/quota-plan.spec.ts`

**Test Cases**:

- [x] QPM-040: Upgrade to Pro plan (mock Stripe)
- [x] QPM-041: Downgrade warning when exceeding
- [x] QPM-042: Grace period on downgrade
- [x] QPM-043: Cancel subscription

**Acceptance Criteria**:

- ✅ Upgrade/downgrade flows tested

---

### TASK-2.7.30: Write E2E Tests - API Rate Limiting ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/quota-plan.spec.ts`

**Test Cases**:

- [x] QPM-050: API calls tracked per org
- [x] QPM-051: API blocked at limit
- [x] QPM-052: Rate limit headers in response

**Acceptance Criteria**:

- ✅ API quota tests pass

---

## Summary

| Phase                      | Task Count   | Priority Breakdown           |
| -------------------------- | ------------ | ---------------------------- |
| Database Schema            | 4 tasks      | 3 HIGH, 1 LOW                |
| Quota Service              | 4 tasks      | 4 HIGH                       |
| Quota Enforcement          | 5 tasks      | 4 HIGH, 1 MEDIUM             |
| Usage API Endpoints        | 2 tasks      | 1 HIGH, 1 MEDIUM             |
| Frontend - Usage Dashboard | 6 tasks      | 4 HIGH, 2 MEDIUM             |
| Upgrade/Downgrade Flow     | 3 tasks      | 1 HIGH, 2 MEDIUM             |
| Testing                    | 6 tasks      | 4 HIGH, 2 MEDIUM             |
| **Total**                  | **30 tasks** | **21 HIGH, 8 MEDIUM, 1 LOW** |

### Estimated Total Time: 55-70 hours

### Critical Path (Must complete first):

1. TASK-2.7.1-2: Database models
2. TASK-2.7.4: Seed plans
3. TASK-2.7.5-7: Quota service
4. TASK-2.7.9-11: Service integrations
5. TASK-2.7.16: Usage dashboard

### Dependencies Graph:

```
TASK-2.7.1 (PlanDefinition)
    └── TASK-2.7.4 (Seed Data)

TASK-2.7.2 (UsageTracking)
    └── TASK-2.7.5 (Quota Service)
        ├── TASK-2.7.6 (Check Method)
        └── TASK-2.7.7 (Increment/Decrement)
            ├── TASK-2.7.9 (Links Integration)
            ├── TASK-2.7.10 (Domains Integration)
            └── TASK-2.7.11 (Members Integration)

TASK-2.7.14 (Quota API)
    └── TASK-2.7.16 (Usage Dashboard)
        └── TASK-2.7.17 (Billing Page)

TASK-2.7.18 (Upgrade Prompt)
    └── TASK-2.7.19 (Error Handling)
```

### Integration Points:

Services that need QuotaService integration:

- `links.service.ts` - `create()` and `delete()`
- `domains.service.ts` - `create()` and `delete()`
- `organizations.service.ts` - `addMember()` and `removeMember()`
- API middleware for API call tracking

### Plan Limits (-1 = Unlimited):

| Resource               | FREE | PRO   | ENTERPRISE |
| ---------------------- | ---- | ----- | ---------- |
| linksPerMonth          | 50   | 1000  | -1         |
| customDomains          | 1    | 5     | -1         |
| teamMembers            | 1    | 10    | -1         |
| apiCallsPerMonth       | 0    | 10000 | -1         |
| analyticsRetentionDays | 30   | 90    | 730        |
