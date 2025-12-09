# Module 1.12: Plan Upgrade / Payment Portal - TODO List

## Status: ~90% Complete -> Target: 100%

## Overview
The Payment Portal has comprehensive Stripe integration with checkout sessions, billing portal, webhook handling, and quota management. Minor gaps to complete.

---

## Priority 1: Monthly Quota Reset & Cleanup (Required)

### PAY-001: Monthly Quota Reset Cron Job
- [ ] Create `quota.cron.ts` with cron service
- [ ] Implement monthly reset job (runs on 1st of month)
- [ ] Register with NestJS ScheduleModule
- [ ] Add unit tests for cron job
- [ ] Test locally

### PAY-002: Usage Data Cleanup Cron Job
- [ ] Add cleanup logic to delete old usage records (>12 months)
- [ ] Add unit tests
- [ ] Test cleanup functionality

---

## Priority 2: Admin Plan Configuration (Enhancement)

### PAY-003: Admin Plan Configuration CRUD
- [ ] Create AdminPlansController with CRUD endpoints
- [ ] Add CreatePlanDto and UpdatePlanDto
- [ ] Implement in PlansService: create, update, delete
- [ ] Add AdminGuard for admin-only access
- [ ] Add audit logging for plan changes
- [ ] Add unit tests
- [ ] Add E2E tests

---

## Priority 3: Testing & Verification

### Testing
- [ ] Run existing quota.service.spec.ts tests
- [ ] Run API tests
- [ ] Verify billing flow works end-to-end

---

## Completed Features (Previously Implemented)

### Backend Payments (95% Complete)
- [x] Stripe Integration
- [x] Plan Definitions (hardcoded + DB)
- [x] Checkout Sessions
- [x] Billing Portal
- [x] Webhook Handling
- [x] Invoice History
- [x] Subscription Status
- [x] Downgrade Check
- [x] Audit Logging
- [x] RBAC (billing:read, billing:manage)

### Backend Quota (90% Complete)
- [x] QuotaService
- [x] Check Quota
- [x] Increment/Decrement Usage
- [x] Usage vs Limits
- [x] Usage History
- [x] API Quota Guard

### Frontend Billing (85% Complete)
- [x] Billing Dashboard
- [x] Current Plan Display
- [x] Usage Dashboard
- [x] Usage Alerts
- [x] Upgrade Prompt
- [x] Downgrade Warning
- [x] Pricing Page
- [x] Stripe Checkout
- [x] Billing Portal
- [x] Invoice Download

---

## Implementation Notes

### Cron Job Configuration
```typescript
// Schedule: '0 0 1 * *' - 1st day of month at midnight
// Keep 12 months of usage data
// Create fresh usage records for new month
```

### Admin Routes
```
GET    /admin/plans       - List all plans
POST   /admin/plans       - Create new plan
PATCH  /admin/plans/:id   - Update plan
DELETE /admin/plans/:id   - Soft delete plan
```

---

## Progress Tracking

| Task | Status | Assignee | Notes |
|------|--------|----------|-------|
| PAY-001 Monthly Reset | Pending | TBD | |
| PAY-002 Usage Cleanup | Pending | TBD | |
| PAY-003 Admin CRUD | Pending | TBD | |
| Unit Tests | Pending | TBD | |
| E2E Tests | Pending | TBD | |

---

Last Updated: 2025-12-09
