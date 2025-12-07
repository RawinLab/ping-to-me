# Module 2.4: Branded Domains (Custom Domains) - Development Todolist

## Document Information

- **Module**: 2.4 Branded Domains (Custom Domains)
- **Source**: `2-4-branded-domains-plan.md`
- **Generated**: 2025-12-07
- **For**: Claude Code Subagent Development
- **Current Implementation**: ~40% Complete

---

## Quick Reference

### Commands

```bash
# Database migration
pnpm --filter @pingtome/database db:push
pnpm --filter @pingtome/database db:generate

# Run API
pnpm --filter api dev

# Run Web
pnpm --filter web dev

# Unit tests
pnpm --filter api test

# E2E tests
npx playwright test apps/web/e2e/branded-domains.spec.ts
```

### Key Files

- `packages/database/prisma/schema.prisma`
- `apps/api/src/domains/domains.service.ts` (74 lines)
- `apps/api/src/domains/domains.controller.ts` (29 lines)
- `apps/web/app/dashboard/domains/page.tsx` (318 lines)
- `apps/web/e2e/domains.spec.ts` (130 lines)

---

## Phase 1: Database & Schema Updates (Week 1)

### TASK-2.4.1: Update Domain Model with Enhanced Fields

**Priority**: HIGH | **Type**: Database | **Estimated**: 2 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Add `status` field using `DomainStatus` enum (PENDING, VERIFYING, VERIFIED, FAILED)
- [ ] Add `verificationType` field (String?, 'txt' | 'cname')
- [ ] Add `verificationAttempts` field (Int, default 0)
- [ ] Add `lastVerifiedAt` field (DateTime, optional)
- [ ] Add `lastCheckAt` field (DateTime, optional)
- [ ] Add `verificationError` field (String, optional)
- [ ] Add `isDefault` field (Boolean, default false)

**Acceptance Criteria**:

- Migration runs successfully
- Existing domains not affected
- Status enum available

---

### TASK-2.4.2: Add SSL Fields to Domain Model

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Create `SslStatus` enum (PENDING, PROVISIONING, ACTIVE, EXPIRED, FAILED)
- [ ] Add `sslStatus` field (SslStatus, default PENDING)
- [ ] Add `sslProvider` field (String?, e.g., 'letsencrypt')
- [ ] Add `sslCertificateId` field (String, optional)
- [ ] Add `sslIssuedAt` field (DateTime, optional)
- [ ] Add `sslExpiresAt` field (DateTime, optional)
- [ ] Add `sslAutoRenew` field (Boolean, default true)

**Acceptance Criteria**:

- SSL fields added correctly
- Default values set appropriately

---

### TASK-2.4.3: Add Domain-Link Relation

**Priority**: MEDIUM | **Type**: Database | **Estimated**: 30 minutes
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Add `links` relation to Domain model
- [ ] Add `domainId` field to Link model (optional)
- [ ] Create foreign key relation

**Acceptance Criteria**:

- Links can be associated with domains
- Relation is optional (backward compatible)

---

## Phase 1: Backend DNS Verification Enhancement (Week 1-2)

### TASK-2.4.4: Implement CNAME Verification Method

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Implement `verifyCname(domain)` method
- [ ] Use Node.js `dns.resolveCname()` to check CNAME records
- [ ] Expected CNAME target: `verify.pingtome.com` (or configured value)
- [ ] Update `verify()` method to support `type: 'txt' | 'cname'`
- [ ] Store verification type in database

**Acceptance Criteria**:

- CNAME verification works alongside TXT
- User can choose verification method
- Both methods validated correctly

---

### TASK-2.4.5: Implement Automated DNS Polling

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Create `pollPendingDomains()` method
- [ ] Query all domains with status PENDING or VERIFYING
- [ ] Attempt verification for each domain
- [ ] Update `lastCheckAt` timestamp
- [ ] Increment `verificationAttempts` counter
- [ ] Store `verificationError` if failed
- [ ] Set status to VERIFIED on success, FAILED after max attempts (10)
- [ ] Create cron job to run every 30 minutes using @nestjs/schedule

**Acceptance Criteria**:

- Cron job runs automatically
- Domains are polled and verified
- Status updates correctly
- Failed domains stop being polled

---

### TASK-2.4.6: Add Verification Attempt Tracking

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Update `verify()` to track attempts
- [ ] Implement `MAX_VERIFICATION_ATTEMPTS` constant (default 10)
- [ ] After max attempts, mark domain as FAILED
- [ ] Add `resetVerification(domainId)` method to retry
- [ ] Log verification attempts for debugging

**Acceptance Criteria**:

- Attempts are counted correctly
- Domains fail after max attempts
- Reset allows re-verification

---

### TASK-2.4.7: Create Domain Status Update Logic

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Implement state machine for domain status:
  - PENDING → VERIFYING (when verification started)
  - VERIFYING → VERIFIED (when DNS records correct)
  - VERIFYING → FAILED (after max attempts)
  - FAILED → PENDING (on reset/retry)
- [ ] Add `updateStatus(domainId, status)` method
- [ ] Emit events on status change for notifications

**Acceptance Criteria**:

- Status transitions are valid
- Invalid transitions rejected
- Events emitted on change

---

## Phase 2: SSL/HTTPS Provisioning (Week 2-3)

### TASK-2.4.8: Create SSL Service

**Priority**: HIGH | **Type**: Backend | **Estimated**: 4-6 hours
**File**: `apps/api/src/domains/ssl.service.ts` (new)

**Subtasks**:

- [ ] Create `SslService` class
- [ ] Implement Let's Encrypt integration using ACME protocol
- [ ] Install `acme-client` package
- [ ] Implement `provisionCertificate(domain)` method:
  - Create account with Let's Encrypt (if not exists)
  - Create order for domain
  - Complete HTTP-01 or DNS-01 challenge
  - Download and store certificate
- [ ] Implement `getCertificateStatus(domain)` method
- [ ] Handle rate limiting from Let's Encrypt

**Acceptance Criteria**:

- SSL certificates can be provisioned
- Status tracking works
- Rate limiting handled gracefully

---

### TASK-2.4.9: Implement Certificate Storage

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/domains/ssl.service.ts`

**Subtasks**:

- [ ] Decide storage location (filesystem, S3, database)
- [ ] Implement `storeCertificate(domainId, cert, key)` method
- [ ] Implement `getCertificate(domainId)` method
- [ ] Encrypt private keys at rest
- [ ] Update domain record with certificate metadata

**Acceptance Criteria**:

- Certificates stored securely
- Private keys encrypted
- Can retrieve certificates when needed

---

### TASK-2.4.10: Implement Certificate Auto-Renewal

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/domains/ssl.service.ts`

**Subtasks**:

- [ ] Create `renewExpiringCertificates()` cron job
- [ ] Query domains where `sslExpiresAt < now + 30 days`
- [ ] Only renew if `sslAutoRenew` is true
- [ ] Call `provisionCertificate()` for each
- [ ] Update certificate metadata
- [ ] Send notification on renewal failure

**Acceptance Criteria**:

- Certificates renewed before expiry
- Notifications sent on failure
- Auto-renew flag respected

---

### TASK-2.4.11: Create SSL Provisioning Endpoint

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.controller.ts`

**Subtasks**:

- [ ] Add `POST /organizations/:orgId/domains/:id/ssl` endpoint
- [ ] Validate domain is verified before SSL provisioning
- [ ] Call SslService.provisionCertificate()
- [ ] Return SSL status and certificate info
- [ ] Add `GET /organizations/:orgId/domains/:id/ssl` for status check

**Acceptance Criteria**:

- Endpoint provisions SSL for verified domains
- Cannot provision for unverified domains
- Status endpoint returns certificate info

---

## Phase 2: Domain Management Enhancement (Week 2-3)

### TASK-2.4.12: Implement Set Default Domain

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Implement `setDefault(orgId, domainId)` method
- [ ] Unset previous default domain for organization
- [ ] Set new domain as default
- [ ] Only allow verified domains to be default
- [ ] Add `POST /organizations/:orgId/domains/:id/default` endpoint

**Acceptance Criteria**:

- Only one default domain per organization
- Only verified domains can be default
- Previous default unset automatically

---

### TASK-2.4.13: Implement Domain Details Page API

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.controller.ts`

**Subtasks**:

- [ ] Enhance `GET /organizations/:orgId/domains/:id` endpoint
- [ ] Return full domain details including:
  - Verification status and history
  - SSL status and certificate info
  - Links count using this domain
  - Created/updated timestamps
- [ ] Include verification instructions

**Acceptance Criteria**:

- Full domain details returned
- Links count accurate
- Verification instructions included

---

### TASK-2.4.14: Implement View Links by Domain

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Implement `getLinksByDomain(domainId, pagination)` method
- [ ] Add `GET /organizations/:orgId/domains/:id/links` endpoint
- [ ] Support pagination
- [ ] Return link summary (id, slug, targetUrl, clicks)

**Acceptance Criteria**:

- Links using domain are listed
- Pagination works correctly

---

### TASK-2.4.15: Integrate Domains with Link Creation

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/links/links.service.ts`

**Subtasks**:

- [ ] Update `create()` to accept `domainId` parameter
- [ ] If no domainId specified, use organization's default domain
- [ ] Validate domain belongs to organization
- [ ] Validate domain is verified
- [ ] Store domainId with link

**Acceptance Criteria**:

- Links can be created with custom domain
- Default domain used when not specified
- Domain ownership validated

---

## Phase 2: RBAC Integration (Week 2-3)

### TASK-2.4.16: Apply Permission Guards to Domain Controller

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.controller.ts`

**Subtasks**:

- [ ] Add `@UseGuards(JwtAuthGuard, PermissionGuard)` to controller
- [ ] Add `@Permission({ resource: 'domain', action: 'create' })` to POST
- [ ] Add `@Permission({ resource: 'domain', action: 'read' })` to GET
- [ ] Add `@Permission({ resource: 'domain', action: 'update' })` to PATCH
- [ ] Add `@Permission({ resource: 'domain', action: 'delete' })` to DELETE
- [ ] Add `@Permission({ resource: 'domain', action: 'verify' })` to verify endpoint

**Acceptance Criteria**:

- Only OWNER/ADMIN can manage domains
- EDITOR/VIEWER can only read
- Permissions enforced correctly

---

### TASK-2.4.17: Add Audit Logging for Domain Operations

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/domains/domains.service.ts`

**Subtasks**:

- [ ] Inject AuditService
- [ ] Log domain creation: `domain.added`
- [ ] Log domain verification: `domain.verified` or `domain.failed`
- [ ] Log domain removal: `domain.removed`
- [ ] Log SSL provisioning: `domain.ssl_updated`
- [ ] Include relevant details in audit log

**Acceptance Criteria**:

- All domain operations logged
- Audit entries have proper context

---

## Phase 3: Frontend Development (Week 3-4)

### TASK-2.4.18: Enhance Domain List Page

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/domains/page.tsx`

**Subtasks**:

- [ ] Display domain status with badges (Pending, Verifying, Verified, Failed)
- [ ] Display SSL status with badges
- [ ] Show "Default" badge for default domain
- [ ] Add "Set as Default" action for verified domains
- [ ] Add "Retry Verification" action for failed domains
- [ ] Show verification countdown/attempts
- [ ] Add loading states

**Acceptance Criteria**:

- All statuses displayed clearly
- Actions work correctly
- UI is responsive

---

### TASK-2.4.19: Create Domain Details Page

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/domains/[id]/page.tsx` (new)

**Subtasks**:

- [ ] Create new page route
- [ ] Display full domain information
- [ ] Show DNS verification instructions:
  - TXT record instructions
  - CNAME record instructions
  - Copy button for record values
- [ ] Show SSL certificate details when available:
  - Issuer, expiry date, auto-renew status
- [ ] List links using this domain
- [ ] Add manage actions (verify, provision SSL, delete)

**Acceptance Criteria**:

- Page displays all domain details
- DNS instructions are clear and copyable
- Links list shows correctly

---

### TASK-2.4.20: Create Add Domain Dialog

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/domains/AddDomainDialog.tsx` (new)

**Subtasks**:

- [ ] Create dialog using AlertDialog from shadcn/ui
- [ ] Add hostname input with validation (valid domain format)
- [ ] Add verification method selector (TXT or CNAME)
- [ ] Show DNS instructions after domain added
- [ ] Submit button with loading state
- [ ] Success message with next steps

**Acceptance Criteria**:

- Domain validation works
- Dialog shows DNS instructions
- Submits successfully

---

### TASK-2.4.21: Create SSL Status Component

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/components/domains/SslStatusBadge.tsx` (new)

**Subtasks**:

- [ ] Create component showing SSL status
- [ ] Show different states: No SSL, Pending, Provisioning, Active, Expired, Failed
- [ ] Show expiry date for active certificates
- [ ] Show "Provision SSL" button for verified domains without SSL
- [ ] Show renewal status if auto-renew enabled

**Acceptance Criteria**:

- All SSL states displayed correctly
- Expiry date formatted nicely
- Action button works

---

### TASK-2.4.22: Add Domain Selector to Link Creation

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/app/dashboard/links/create/page.tsx`

**Subtasks**:

- [ ] Add domain selector dropdown to link creation form
- [ ] Fetch organization's verified domains
- [ ] Default to organization's default domain
- [ ] Allow selecting different verified domain
- [ ] Show domain in link preview

**Acceptance Criteria**:

- Domain can be selected when creating link
- Only verified domains shown
- Default domain pre-selected

---

### TASK-2.4.23: Add API Client Methods for Domains

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/lib/api/domains.ts` (new or update)

**Subtasks**:

- [ ] `listDomains(orgId)` - GET /organizations/:orgId/domains
- [ ] `getDomain(orgId, domainId)` - GET .../domains/:id
- [ ] `addDomain(orgId, data)` - POST .../domains
- [ ] `verifyDomain(orgId, domainId)` - POST .../domains/:id/verify
- [ ] `deleteDomain(orgId, domainId)` - DELETE .../domains/:id
- [ ] `setDefaultDomain(orgId, domainId)` - POST .../domains/:id/default
- [ ] `provisionSsl(orgId, domainId)` - POST .../domains/:id/ssl
- [ ] `getSslStatus(orgId, domainId)` - GET .../domains/:id/ssl

**Acceptance Criteria**:

- All API methods implemented
- Proper error handling
- Type safety

---

## Phase 4: Testing (Week 4)

### TASK-2.4.24: Write Domain Service Unit Tests

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/api/src/domains/domains.service.spec.ts`

**Test Cases**:

- [ ] Create domain successfully
- [ ] Create domain fails for invalid hostname
- [ ] Create domain fails for duplicate hostname
- [ ] Verify domain via TXT record - success
- [ ] Verify domain via TXT record - failure (wrong record)
- [ ] Verify domain via CNAME record - success
- [ ] Verify domain via CNAME record - failure
- [ ] Set domain as default
- [ ] Only verified domain can be default
- [ ] Delete domain successfully
- [ ] Delete domain removes from links

**Acceptance Criteria**:

- All tests pass
- Coverage > 80%

---

### TASK-2.4.25: Write SSL Service Unit Tests

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/api/src/domains/ssl.service.spec.ts`

**Test Cases**:

- [ ] Provision certificate for verified domain
- [ ] Cannot provision for unverified domain
- [ ] Certificate stored correctly
- [ ] Certificate renewal works
- [ ] Expired certificate detected
- [ ] Rate limiting handled

**Acceptance Criteria**:

- All tests pass
- Mock Let's Encrypt calls

---

### TASK-2.4.26: Write E2E Tests - Domain CRUD

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-001: Add custom domain
- [ ] DOM-002: List organization domains
- [ ] DOM-003: View domain details
- [ ] DOM-004: Remove domain

**Acceptance Criteria**:

- All CRUD tests pass

---

### TASK-2.4.27: Write E2E Tests - Verification

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-010: Verify domain via TXT record - success
- [ ] DOM-011: Verify domain via TXT record - failure
- [ ] DOM-012: Verify domain via CNAME record
- [ ] DOM-013: Automated verification polling (mock)

**Acceptance Criteria**:

- Verification flow tested
- Success and failure cases covered

---

### TASK-2.4.28: Write E2E Tests - SSL

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-020: SSL certificate provisioning (mock)
- [ ] DOM-021: SSL certificate status display
- [ ] DOM-022: SSL certificate renewal indication

**Acceptance Criteria**:

- SSL flow tested with mocks
- Status displays correctly

---

### TASK-2.4.29: Write E2E Tests - Default Domain

**Priority**: HIGH | **Type**: Testing | **Estimated**: 1-2 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-030: Set domain as default
- [ ] DOM-031: Use default domain when creating links
- [ ] DOM-032: Override domain per link

**Acceptance Criteria**:

- Default domain functionality works
- Link creation uses correct domain

---

### TASK-2.4.30: Write E2E Tests - RBAC

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-040: OWNER can manage domains
- [ ] DOM-041: ADMIN can manage domains
- [ ] DOM-042: EDITOR cannot manage domains
- [ ] DOM-043: VIEWER cannot manage domains

**Acceptance Criteria**:

- Permission enforcement tested
- All role scenarios covered

---

### TASK-2.4.31: Write E2E Tests - Links Integration

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 1-2 hours
**File**: `apps/web/e2e/branded-domains.spec.ts`

**Test Cases**:

- [ ] DOM-050: View links using specific domain
- [ ] DOM-051: Migrate links to different domain (if implemented)

**Acceptance Criteria**:

- Domain-link relationship tested

---

## Summary

| Phase             | Task Count   | Priority Breakdown     |
| ----------------- | ------------ | ---------------------- |
| Database & Schema | 3 tasks      | 2 HIGH, 1 MEDIUM       |
| DNS Verification  | 4 tasks      | 3 HIGH, 1 MEDIUM       |
| SSL Provisioning  | 4 tasks      | 4 HIGH                 |
| Domain Management | 4 tasks      | 1 HIGH, 3 MEDIUM       |
| RBAC Integration  | 2 tasks      | 1 HIGH, 1 MEDIUM       |
| Frontend          | 6 tasks      | 3 HIGH, 3 MEDIUM       |
| Testing           | 8 tasks      | 5 HIGH, 3 MEDIUM       |
| **Total**         | **31 tasks** | **19 HIGH, 12 MEDIUM** |

### Estimated Total Time: 50-65 hours

### Critical Path (Must complete first):

1. TASK-2.4.1-2: Database schema updates
2. TASK-2.4.4: CNAME verification
3. TASK-2.4.5: Automated polling
4. TASK-2.4.8: SSL service
5. TASK-2.4.16: RBAC integration

### Dependencies Graph:

```
TASK-2.4.1-2 (Schema)
    ├── TASK-2.4.4 (CNAME Verify)
    │   └── TASK-2.4.5 (Polling)
    │       └── TASK-2.4.6 (Attempts)
    ├── TASK-2.4.8 (SSL Service)
    │   └── TASK-2.4.9 (Storage)
    │       └── TASK-2.4.10 (Renewal)
    │           └── TASK-2.4.11 (Endpoint)
    └── TASK-2.4.3 (Link Relation)
        └── TASK-2.4.15 (Link Integration)

TASK-2.4.12 (Set Default)
    └── TASK-2.4.22 (Link Creation UI)

TASK-2.4.16 (RBAC)
    └── TASK-2.4.30 (E2E RBAC Tests)
```

### External Dependencies:

- Let's Encrypt / ACME client library
- Node.js dns module for DNS resolution
- @nestjs/schedule for cron jobs
- Possibly Cloudflare for DNS/SSL (alternative)
