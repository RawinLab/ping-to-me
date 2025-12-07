# Module 1.3: Custom Domain & Slug - Development Todolist

> **Status**: ~85% Complete
> **Priority**: Medium - DTOs and E2E tests missing
> **Reference**: `requirements/1-3-custom-domain-slug-plan.md`

---

## Phase 1: DTOs & Update Endpoint

### Task 1.3.1: Create Domain DTOs
- [ ] **Create CreateDomainDto**
  - File: `apps/api/src/domains/dto/create-domain.dto.ts`
  - Validations:
    - `hostname`: @MinLength(3), @MaxLength(253), @Matches(domain regex), @Transform lowercase
    - `orgId`: @IsUUID
    - `verificationType`: @IsOptional, @IsEnum(['txt', 'cname'])

- [ ] **Create UpdateDomainDto**
  - File: `apps/api/src/domains/dto/update-domain.dto.ts`
  - Fields:
    - `isDefault`: @IsOptional, @IsBoolean
    - `verificationType`: @IsOptional, @IsEnum(['txt', 'cname'])
    - `redirectPolicy`: @IsOptional, @IsString (future)

- [ ] **Apply DTOs to DomainsController**
  - File: `apps/api/src/domains/domains.controller.ts`
  - Add @Body() with DTO types

### Task 1.3.2: Add PATCH /domains/:id Endpoint
- [ ] **Create update method in DomainsService**
  - File: `apps/api/src/domains/domains.service.ts`
  - Method: `update(id, orgId, dto, user)`
  - Logic:
    - Validate domain ownership
    - If setting default, ensure verified
    - Unset previous default if setting new default
    - Log audit event

- [ ] **Add PATCH endpoint to controller**
  - File: `apps/api/src/domains/domains.controller.ts`
  - Endpoint: `PATCH /domains/:id`
  - Permission: `@Permission({ action: 'update', resource: 'domain' })`

---

## Phase 2: Frontend Enhancements

### Task 1.3.3: Auto-Refresh for Pending Domains
- [ ] **Add polling for pending/verifying domains**
  - File: `apps/web/app/dashboard/domains/page.tsx`
  - Logic:
    - Check if any domains have PENDING or VERIFYING status
    - Poll every 30 seconds
    - Stop polling when all verified or failed
    - Clear interval on unmount

### Task 1.3.4: Domain Search & Filter
- [ ] **Add search input for domains**
  - File: `apps/web/app/dashboard/domains/page.tsx`
  - Filter by hostname (case-insensitive)

- [ ] **Add status filter dropdown**
  - Options: All, Verified, Pending, Failed
  - Filter domains by selected status

- [ ] **Implement filtered domain list**
  - Combine search and status filters
  - Show result count

### Task 1.3.5: Domain Analytics Summary (Optional)
- [ ] **Create analytics endpoint**
  - Endpoint: `GET /domains/:id/analytics`
  - Return: totalClicks, totalLinks, clicksByDay

- [ ] **Add analytics card to domain details**
  - File: `apps/web/app/dashboard/domains/[id]/page.tsx`
  - Display: Total clicks, trend, top links

---

## Phase 3: E2E Tests

### Task 1.3.6: Default Domain E2E Tests
- [ ] **DOM-030: Set domain as default**
  - Find verified domain not currently default
  - Click "Set as Default"
  - Confirm in modal
  - Verify default badge appears

- [ ] **DOM-031: Auto-select default domain in link creation**
  - Login as user with default domain
  - Go to create link page
  - Verify domain selector shows default domain

- [ ] **DOM-032: Override domain per link**
  - Go to create link page
  - Change domain selector to different domain
  - Verify selection persists

### Task 1.3.7: RBAC Permission E2E Tests
- [ ] **DOM-040: OWNER can manage domains**
  - Login as owner
  - Verify add/delete buttons visible

- [ ] **DOM-041: ADMIN can manage domains**
  - Login as admin
  - Verify add button visible

- [ ] **DOM-042: EDITOR cannot manage domains**
  - Login as editor
  - Verify add/delete buttons not visible or redirected

- [ ] **DOM-043: VIEWER cannot manage domains**
  - Login as viewer
  - Verify no domain management access

### Task 1.3.8: SSL E2E Tests
- [ ] **DOM-020: Provision SSL certificate**
  - Go to verified domain details
  - Click "Provision SSL"
  - Verify provisioning status
  - Wait for active status

- [ ] **DOM-021: Display SSL certificate status**
  - Go to domain with SSL
  - Verify Active badge visible
  - Verify expiry date shown
  - Verify auto-renew toggle visible

- [ ] **DOM-022: Toggle auto-renewal**
  - Toggle auto-renew switch
  - Verify success toast

### Task 1.3.9: Domain-Link Integration Tests
- [ ] **DOM-004: Create link with custom domain**
  - Select custom domain in link creation
  - Create link
  - Verify short URL uses custom domain

- [ ] **DOM-050: View links using domain**
  - Go to domain details
  - Verify links table visible
  - Verify links are for this domain

- [ ] **DOM-051: Empty state for domain without links**
  - Go to new domain with no links
  - Verify empty message
  - Verify "Create Link" CTA

### Task 1.3.10: Search & Filter E2E Tests
- [ ] **DOM-060: Search domains by hostname**
  - Enter search term
  - Verify filtered results

- [ ] **DOM-061: Filter by verification status**
  - Select status filter
  - Verify all shown domains match status

---

## Phase 4: Future Enhancements

### Task 1.3.11: Subdomain Support
- [ ] Add `allowSubdomains` and `subdomainPattern` to schema
- [ ] Implement wildcard subdomain handling
- [ ] UI for configuring subdomains

### Task 1.3.12: Production SSL (ACME/Let's Encrypt)
- [ ] Replace mock SSL with real certificate provisioning
- [ ] Follow SSL_SERVICE_README.md guide
- [ ] Integrate with Cloudflare for SSL

### Task 1.3.13: Advanced Redirect Rules
- [ ] Add DomainRedirectRule model
- [ ] Per-domain redirect configuration
- [ ] Geo/device/time-based routing

---

## Unit Tests Required

### Domain Service Tests
```
File: apps/api/src/domains/__tests__/domains.service.spec.ts
```
- [ ] create: create domain with TXT verification
- [ ] create: create domain with CNAME verification
- [ ] create: generate unique verification token
- [ ] create: check quota before creation
- [ ] create: reject invalid hostname format
- [ ] create: reject duplicate hostname
- [ ] verify: verify TXT record successfully
- [ ] verify: verify CNAME record successfully
- [ ] verify: increment verification attempts
- [ ] verify: mark as FAILED after max attempts
- [ ] setDefault: set verified domain as default
- [ ] setDefault: unset previous default
- [ ] setDefault: reject unverified domain
- [ ] update: update verification type
- [ ] update: validate domain ownership
- [ ] delete: delete domain and log audit

### SSL Service Tests
```
File: apps/api/src/domains/__tests__/ssl.service.spec.ts
```
- [ ] provision: provision for verified domain
- [ ] provision: reject unverified domain
- [ ] renew: renew expiring certificates
- [ ] renew: skip disabled auto-renew
- [ ] updateSettings: toggle auto-renewal

---

## E2E Tests Summary

```
File: apps/web/e2e/domains.spec.ts (extend existing)
```

### Domain CRUD
- [ ] DOM-001: Add custom domain
- [ ] DOM-002: Verify domain DNS - Success
- [ ] DOM-003: Verify domain DNS - Failed
- [ ] DOM-006: Remove domain

### DNS Verification
- [ ] DOM-010: Show TXT record instructions
- [ ] DOM-012: Show CNAME record instructions
- [ ] DOM-013: Show verification attempt count

### Default Domain
- [ ] DOM-030: Set domain as default
- [ ] DOM-031: Auto-select in link creation
- [ ] DOM-032: Override domain per link

### RBAC
- [ ] DOM-040: OWNER can manage
- [ ] DOM-041: ADMIN can manage
- [ ] DOM-042: EDITOR cannot manage
- [ ] DOM-043: VIEWER cannot manage

### SSL
- [ ] DOM-020: Provision SSL certificate
- [ ] DOM-021: Display SSL status
- [ ] DOM-022: Toggle auto-renewal

### Integration
- [ ] DOM-004: Create link with custom domain
- [ ] DOM-050: View links using domain
- [ ] DOM-051: Empty state for new domain

### Search/Filter
- [ ] DOM-060: Search by hostname
- [ ] DOM-061: Filter by status

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] CreateDomainDto validates hostname format
- [ ] UpdateDomainDto handles isDefault and verificationType
- [ ] PATCH endpoint updates domain settings
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Pending domains auto-refresh every 30s
- [ ] Search filters domains by hostname
- [ ] Status filter shows correct domains

### Phase 3 Complete When:
- [ ] All E2E tests pass (DOM-001 to DOM-061)
- [ ] RBAC tests verify permission enforcement
- [ ] SSL tests verify certificate workflow

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/domains/dto/create-domain.dto.ts` | Domain creation validation |
| `apps/api/src/domains/dto/update-domain.dto.ts` | Domain update validation |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/domains/domains.controller.ts` | Apply DTOs, add PATCH endpoint |
| `apps/api/src/domains/domains.service.ts` | Add update method |
| `apps/web/app/dashboard/domains/page.tsx` | Auto-refresh, search, filter |
| `apps/web/e2e/domains.spec.ts` | Add missing E2E tests |

---

## Dependencies

- DNS library (Node.js `dns/promises` - already used)
- SSL mock implementation (production migration guide ready)

---

*Generated from: 1-3-custom-domain-slug-plan.md*
*Last Updated: 2025-12-08*
