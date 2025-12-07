# Module 1.3: Custom Domain & Slug - Development Plan

## Executive Summary

This document outlines the development plan for the Custom Domain & Slug module of PingTO.Me. Based on comprehensive codebase analysis, the domain management system is approximately **85% complete** with excellent core functionality including DNS verification, SSL management, and RBAC integration.

---

## 1. Current State Analysis

### 1.1 What's Already Implemented ✅

#### Backend (NestJS)
| Feature | Status | Location |
|---------|--------|----------|
| Add Domain | ✅ Complete | `POST /domains` |
| List Domains | ✅ Complete | `GET /domains?orgId=X` |
| Get Domain Details | ✅ Complete | `GET /domains/:id` |
| Trigger DNS Verification | ✅ Complete | `POST /domains/:id/verify` |
| Set Default Domain | ✅ Complete | `POST /domains/:id/default` |
| Get Links by Domain | ✅ Complete | `GET /domains/:id/links` |
| Delete Domain | ✅ Complete | `DELETE /domains/:id` |
| Provision SSL Certificate | ✅ Complete | `POST /domains/:id/ssl` |
| Get SSL Status | ✅ Complete | `GET /domains/:id/ssl` |
| Update SSL Settings | ✅ Complete | `PATCH /domains/:id/ssl` |
| TXT Record Verification | ✅ Complete | `verifyTxt()` method |
| CNAME Record Verification | ✅ Complete | `verifyCname()` method |
| Automated DNS Polling | ✅ Complete | Cron job every 30 minutes |
| Max Verification Attempts | ✅ Complete | 10 attempts before FAILED |
| Quota Enforcement | ✅ Complete | Via QuotaService |
| RBAC Permissions | ✅ Complete | `@Permission` decorators |
| Audit Logging | ✅ Complete | All domain operations |

#### SSL Service (Mock - Production Ready Docs)
| Feature | Status | Notes |
|---------|--------|-------|
| Certificate Provisioning | ✅ Mock | 90-day lifecycle simulation |
| Auto-Renewal | ✅ Complete | Daily cron job |
| Status Management | ✅ Complete | PENDING → PROVISIONING → ACTIVE |
| Production Migration Guide | ✅ Complete | SSL_SERVICE_README.md |

#### Frontend (Next.js)
| Feature | Status | Location |
|---------|--------|----------|
| Domain List Page | ✅ Complete | `/dashboard/domains/page.tsx` |
| Domain Details Page | ✅ Complete | `/dashboard/domains/[id]/page.tsx` |
| Add Domain Modal | ✅ Complete | 2-step flow with instructions |
| DNS Instructions Display | ✅ Complete | TXT & CNAME options |
| Verification Trigger Button | ✅ Complete | Manual verification |
| Default Domain Selection | ✅ Complete | With confirmation |
| SSL Status Badge | ✅ Complete | Compact & full modes |
| Domain Selector in Links | ✅ Complete | Dropdown in create link |
| Stats Dashboard | ✅ Complete | Verified/Pending/Total |
| Empty State | ✅ Complete | CTA to add first domain |
| API Client | ✅ Complete | All endpoints typed |

#### Database Schema
| Field | Status | Purpose |
|-------|--------|---------|
| hostname | ✅ | Domain name |
| organizationId | ✅ | Org relationship |
| status | ✅ | PENDING/VERIFYING/VERIFIED/FAILED |
| isVerified | ✅ | Boolean flag |
| verificationType | ✅ | 'txt' or 'cname' |
| verificationToken | ✅ | Generated token |
| verificationAttempts | ✅ | Counter |
| lastVerifiedAt | ✅ | Timestamp |
| lastCheckAt | ✅ | Last check time |
| verificationError | ✅ | Error message |
| isDefault | ✅ | Default domain flag |
| sslStatus | ✅ | SSL certificate status |
| sslProvider | ✅ | e.g., 'letsencrypt' |
| sslCertificateId | ✅ | Certificate ID |
| sslIssuedAt | ✅ | Issue date |
| sslExpiresAt | ✅ | Expiration |
| sslAutoRenew | ✅ | Auto-renewal flag |

### 1.2 What's Missing or Incomplete ❌

#### Missing API Endpoints
| Endpoint | Priority | Description |
|----------|----------|-------------|
| `PATCH /domains/:id` | 🟡 High | Update domain settings |
| Dedicated DNS record endpoint | 🟢 Low | Already in GET /domains/:id |

#### Missing DTOs
| DTO | Priority | Description |
|-----|----------|-------------|
| CreateDomainDto | 🟡 High | Validation for domain creation |
| UpdateDomainDto | 🟡 High | For PATCH endpoint |
| VerifyDomainDto | 🟢 Low | Formalize verification request |

#### Missing Frontend Features
| Feature | Priority | Description |
|---------|----------|-------------|
| Auto-refresh on verification | 🟠 Medium | No real-time updates |
| Domain search/filter | 🟠 Medium | No search in list |
| Domain analytics | 🟠 Medium | No clicks-by-domain |
| Bulk domain operations | 🟢 Low | No multi-select |

#### Missing E2E Tests
| Test Case | Priority | Description |
|-----------|----------|-------------|
| Set default domain flow | 🟡 High | DOM-030, DOM-031 |
| RBAC permission tests | 🟡 High | DOM-040 to DOM-043 |
| SSL provisioning UI | 🟠 Medium | DOM-020, DOM-021 |
| Domain-link integration | 🟠 Medium | DOM-004, DOM-050 |
| CNAME verification | 🟢 Low | DOM-012 |

---

## 2. Feature Breakdown & Priorities

### Priority 1: Missing DTOs & Update Endpoint

#### P1-01: Create Domain DTOs
**Description:** Add class-validator decorators for proper validation
**Effort:** 2 hours
**Files to create:**
- `apps/api/src/domains/dto/create-domain.dto.ts`
- `apps/api/src/domains/dto/update-domain.dto.ts`

**CreateDomainDto:**
```typescript
import { IsString, IsUUID, Matches, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDomainDto {
  @IsString()
  @MinLength(3)
  @MaxLength(253) // Max DNS hostname length
  @Matches(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, {
    message: 'Invalid domain format',
  })
  @Transform(({ value }) => value.toLowerCase().trim())
  hostname: string;

  @IsUUID()
  orgId: string;

  @IsOptional()
  @IsEnum(['txt', 'cname'])
  verificationType?: 'txt' | 'cname';
}
```

**UpdateDomainDto:**
```typescript
import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateDomainDto {
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsEnum(['txt', 'cname'])
  verificationType?: 'txt' | 'cname';

  // Future: Advanced settings
  @IsOptional()
  @IsString()
  redirectPolicy?: string;
}
```

#### P1-02: Add Update Domain Endpoint
**Description:** PATCH endpoint for updating domain settings
**Effort:** 2 hours
**Files to modify:**
- `apps/api/src/domains/domains.controller.ts`
- `apps/api/src/domains/domains.service.ts`

**Implementation:**
```typescript
@Patch(':id')
@Permission({ action: 'update', resource: 'domain' })
async update(
  @Param('id') id: string,
  @Query('orgId') orgId: string,
  @Body() dto: UpdateDomainDto,
  @Req() req: RequestWithUser,
): Promise<DomainResponse> {
  return this.domainsService.update(id, orgId, dto, req.user);
}

// In service
async update(id: string, orgId: string, dto: UpdateDomainDto, user: User): Promise<Domain> {
  const domain = await this.prisma.domain.findUnique({
    where: { id, organizationId: orgId },
  });

  if (!domain) {
    throw new NotFoundException('Domain not found');
  }

  // If setting as default, ensure verified
  if (dto.isDefault && !domain.isVerified) {
    throw new BadRequestException('Only verified domains can be set as default');
  }

  // If setting as default, unset previous default
  if (dto.isDefault) {
    await this.prisma.domain.updateMany({
      where: { organizationId: orgId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await this.prisma.domain.update({
    where: { id },
    data: {
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      ...(dto.verificationType && { verificationType: dto.verificationType }),
    },
  });

  await this.auditService.log({
    action: 'domain.updated',
    resourceType: 'domain',
    resourceId: id,
    userId: user.id,
    organizationId: orgId,
    details: { changes: dto },
  });

  return updated;
}
```

### Priority 2: Frontend Enhancements

#### P2-01: Auto-Refresh on Verification
**Description:** Periodically check verification status for pending domains
**Effort:** 2-3 hours
**Files to modify:**
- `apps/web/app/dashboard/domains/page.tsx`

**Implementation:**
```tsx
// Add polling for pending domains
useEffect(() => {
  const hasPendingDomains = domains.some(d =>
    d.status === 'PENDING' || d.status === 'VERIFYING'
  );

  if (!hasPendingDomains) return;

  const interval = setInterval(() => {
    refetchDomains();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [domains]);
```

#### P2-02: Domain Search & Filter
**Description:** Add search bar and status filter to domain list
**Effort:** 3-4 hours
**Files to modify:**
- `apps/web/app/dashboard/domains/page.tsx`

**Implementation:**
```tsx
// Add state
const [search, setSearch] = useState('');
const [statusFilter, setStatusFilter] = useState<DomainStatus | 'all'>('all');

// Filter domains
const filteredDomains = domains.filter(d => {
  const matchesSearch = d.hostname.toLowerCase().includes(search.toLowerCase());
  const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
  return matchesSearch && matchesStatus;
});

// UI
<div className="flex gap-4 mb-6">
  <Input
    placeholder="Search domains..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="max-w-sm"
  />
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="All statuses" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All statuses</SelectItem>
      <SelectItem value="VERIFIED">Verified</SelectItem>
      <SelectItem value="PENDING">Pending</SelectItem>
      <SelectItem value="FAILED">Failed</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### P2-03: Domain Analytics Summary
**Description:** Show click stats per domain
**Effort:** 4-6 hours
**New endpoint required:** `GET /domains/:id/analytics`

**Backend:**
```typescript
@Get(':id/analytics')
@Permission({ action: 'read', resource: 'domain' })
async getAnalytics(
  @Param('id') id: string,
  @Query('orgId') orgId: string,
  @Query('period') period: string = '30d',
) {
  const domain = await this.prisma.domain.findUnique({
    where: { id, organizationId: orgId },
    include: {
      links: {
        include: {
          clickEvents: {
            where: {
              timestamp: {
                gte: this.getPeriodStart(period),
              },
            },
          },
        },
      },
    },
  });

  return {
    totalClicks: domain.links.reduce((sum, link) => sum + link.clickEvents.length, 0),
    totalLinks: domain.links.length,
    clicksByDay: this.aggregateByDay(domain.links),
  };
}
```

**Frontend:**
- Add analytics card to domain details page
- Show total clicks, trend, top links

### Priority 3: Missing E2E Tests

#### P3-01: Default Domain E2E Tests
**Description:** Test default domain workflow
**Effort:** 2-3 hours
**File:** `apps/web/e2e/domains.spec.ts`

```typescript
test.describe('Default Domain', () => {
  test('DOM-030: Should set domain as default', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/domains');

    // Find verified domain that's not default
    const domainCard = page.locator('[data-testid="domain-card"]:has([data-status="VERIFIED"]):not(:has([data-default="true"]))').first();

    await domainCard.locator('[data-testid="set-default-button"]').click();
    await page.locator('[data-testid="confirm-set-default"]').click();

    await expect(page.locator('[data-testid="success-toast"]')).toContainText('default');
    await expect(domainCard.locator('[data-testid="default-badge"]')).toBeVisible();
  });

  test('DOM-031: Should use default domain when creating links', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/links/new');

    const domainSelector = page.locator('[data-testid="domain-selector"]');
    await expect(domainSelector).toContainText('my-custom-domain.com');
  });

  test('DOM-032: Should override domain per link', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/links/new');

    await page.locator('[data-testid="domain-selector"]').click();
    await page.locator('[data-testid="domain-option-pingto-me"]').click();

    await expect(page.locator('[data-testid="domain-selector"]')).toContainText('pingto.me');
  });
});
```

#### P3-02: RBAC Permission E2E Tests
**Description:** Test domain permissions by role
**Effort:** 3-4 hours

```typescript
test.describe('Domain RBAC', () => {
  test('DOM-040: OWNER can manage domains', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/domains');

    await expect(page.locator('[data-testid="add-domain-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="delete-domain-button"]')).toBeEnabled();
  });

  test('DOM-041: ADMIN can manage domains', async ({ page }) => {
    await loginAsUser(page, 'admin');
    await page.goto('/dashboard/domains');

    await expect(page.locator('[data-testid="add-domain-button"]')).toBeEnabled();
  });

  test('DOM-042: EDITOR cannot manage domains', async ({ page }) => {
    await loginAsUser(page, 'editor');
    await page.goto('/dashboard/domains');

    await expect(page.locator('[data-testid="add-domain-button"]')).not.toBeVisible();
    // Or redirected to dashboard
  });

  test('DOM-043: VIEWER cannot manage domains', async ({ page }) => {
    await loginAsUser(page, 'viewer');
    await page.goto('/dashboard/domains');

    await expect(page.locator('[data-testid="add-domain-button"]')).not.toBeVisible();
  });
});
```

#### P3-03: SSL E2E Tests
**Description:** Test SSL provisioning UI
**Effort:** 2-3 hours

```typescript
test.describe('SSL Certificate', () => {
  test('DOM-020: Should provision SSL certificate', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/domains/verified-domain-id');

    await page.locator('[data-testid="provision-ssl-button"]').click();

    await expect(page.locator('[data-testid="ssl-provisioning"]')).toBeVisible();
    await page.waitForTimeout(2000); // Mock provisioning

    await expect(page.locator('[data-testid="ssl-active"]')).toBeVisible();
  });

  test('DOM-021: Should display SSL certificate status', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/domains/ssl-domain-id');

    await expect(page.locator('[data-testid="ssl-status-badge"]')).toContainText('Active');
    await expect(page.locator('[data-testid="ssl-expiry"]')).toBeVisible();
    await expect(page.locator('[data-testid="ssl-auto-renew-toggle"]')).toBeVisible();
  });

  test('DOM-022: Should toggle auto-renewal', async ({ page }) => {
    await loginAsUser(page, 'owner');
    await page.goto('/dashboard/domains/ssl-domain-id');

    const toggle = page.locator('[data-testid="ssl-auto-renew-toggle"]');
    await toggle.click();

    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Auto-renewal');
  });
});
```

### Priority 4: Future Enhancements

#### P4-01: Subdomain Support
**Description:** Allow wildcard and subdomain configuration
**Effort:** 1 week

**Schema Update:**
```prisma
model Domain {
  // Existing fields...
  allowSubdomains  Boolean @default(false)
  subdomainPattern String? // e.g., "*.example.com"
}
```

#### P4-02: Production SSL (ACME/Let's Encrypt)
**Description:** Implement real SSL certificate provisioning
**Effort:** 1-2 weeks
**Reference:** `SSL_SERVICE_README.md` for migration guide

#### P4-03: Advanced Redirect Rules
**Description:** Per-domain redirect configuration
**Effort:** 1 week

**Schema Update:**
```prisma
model DomainRedirectRule {
  id           String   @id @default(uuid())
  domainId     String   @db.Uuid
  type         String   // 'geo' | 'device' | 'time'
  conditions   Json
  targetUrl    String
  priority     Int      @default(0)
  domain       Domain   @relation(fields: [domainId], references: [id])
}
```

---

## 3. Database Schema Updates

### 3.1 No Immediate Changes Required
The current schema is comprehensive for P1-P3 features.

### 3.2 Future Schema Updates (P4)

```prisma
model Domain {
  // Existing fields...

  // Subdomain support (P4-01)
  allowSubdomains  Boolean @default(false)
  subdomainPattern String?

  // Advanced settings (P4-03)
  redirectPolicy   String?
  redirectRules    DomainRedirectRule[]
}

model DomainRedirectRule {
  id           String   @id @default(uuid())
  domainId     String   @db.Uuid
  type         String   // 'geo' | 'device' | 'time'
  conditions   Json
  targetUrl    String
  priority     Int      @default(0)
  createdAt    DateTime @default(now())
  domain       Domain   @relation(fields: [domainId], references: [id])

  @@index([domainId, priority])
}
```

---

## 4. API Endpoint Specifications

### 4.1 Existing Endpoints (Working)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/domains` | Add new domain | JWT |
| GET | `/domains` | List domains | JWT |
| GET | `/domains/:id` | Get domain details | JWT |
| POST | `/domains/:id/verify` | Trigger verification | JWT |
| POST | `/domains/:id/default` | Set as default | JWT |
| GET | `/domains/:id/links` | Get domain links | JWT |
| DELETE | `/domains/:id` | Delete domain | JWT |
| POST | `/domains/:id/ssl` | Provision SSL | JWT |
| GET | `/domains/:id/ssl` | Get SSL status | JWT |
| PATCH | `/domains/:id/ssl` | Update SSL settings | JWT |

### 4.2 New Endpoints Required

| Method | Endpoint | Description | Priority |
|--------|----------|-------------|----------|
| PATCH | `/domains/:id` | Update domain settings | P1 |
| GET | `/domains/:id/analytics` | Get domain analytics | P2 |

---

## 5. Test Cases

### 5.1 Unit Tests (Jest)

#### Domain Service Tests

```typescript
// apps/api/src/domains/__tests__/domains.service.spec.ts

describe('DomainsService', () => {
  // Domain Creation Tests
  describe('create', () => {
    it('should create domain with TXT verification');
    it('should create domain with CNAME verification');
    it('should generate unique verification token');
    it('should check quota before creation');
    it('should throw on quota exceeded');
    it('should reject invalid hostname format');
    it('should reject duplicate hostname');
    it('should log audit event');
  });

  // DNS Verification Tests
  describe('verify', () => {
    it('should verify TXT record successfully');
    it('should verify CNAME record successfully');
    it('should increment verification attempts');
    it('should mark as FAILED after max attempts');
    it('should store verification error');
    it('should update lastVerifiedAt on success');
    it('should bypass DNS for localhost');
  });

  // Automated Polling Tests
  describe('pollPendingDomains', () => {
    it('should poll PENDING domains');
    it('should poll VERIFYING domains');
    it('should skip VERIFIED domains');
    it('should skip FAILED domains');
    it('should respect max attempts');
  });

  // Default Domain Tests
  describe('setDefault', () => {
    it('should set verified domain as default');
    it('should unset previous default');
    it('should reject unverified domain');
    it('should log audit event');
  });

  // Update Tests
  describe('update', () => {
    it('should update verification type');
    it('should update isDefault');
    it('should validate domain ownership');
    it('should reject setting unverified as default');
  });

  // Delete Tests
  describe('delete', () => {
    it('should delete domain');
    it('should remove from links');
    it('should log audit event');
  });
});
```

#### SSL Service Tests

```typescript
// apps/api/src/domains/__tests__/ssl.service.spec.ts

describe('SslService', () => {
  describe('provision', () => {
    it('should provision certificate for verified domain');
    it('should reject unverified domain');
    it('should set status to PROVISIONING');
    it('should complete to ACTIVE');
    it('should set 90-day expiry');
  });

  describe('renew', () => {
    it('should renew expiring certificates');
    it('should skip certificates with >30 days');
    it('should skip disabled auto-renew');
    it('should mark expired as EXPIRED');
  });

  describe('updateSettings', () => {
    it('should toggle auto-renewal');
    it('should require verified domain');
  });
});
```

### 5.2 E2E Tests (Playwright)

```typescript
// apps/web/e2e/domains-extended.spec.ts

test.describe('Custom Domains - Extended', () => {

  // ===== DOMAIN CRUD =====

  test.describe('Domain Management', () => {
    test('DOM-001: Should add custom domain', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      await page.click('[data-testid="add-domain-button"]');
      await page.fill('[data-testid="hostname-input"]', 'links.mycompany.com');
      await page.click('[data-testid="verification-txt"]');
      await page.click('[data-testid="submit-domain"]');

      // Step 2: DNS Instructions
      await expect(page.locator('[data-testid="dns-instructions"]')).toBeVisible();
      await expect(page.locator('[data-testid="txt-record-value"]')).toBeVisible();

      await page.click('[data-testid="done-button"]');
      await expect(page.locator('[data-testid="domain-card"]')).toContainText('links.mycompany.com');
    });

    test('DOM-002: Should verify domain DNS - Success', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      // Mock successful verification
      await page.route('**/domains/*/verify**', async (route) => {
        await route.fulfill({
          json: { status: 'VERIFIED', isVerified: true }
        });
      });

      await page.click('[data-testid="verify-now-button"]');

      await expect(page.locator('[data-testid="status-verified"]')).toBeVisible();
    });

    test('DOM-003: Should verify domain DNS - Failed', async ({ page }) => {
      await page.route('**/domains/*/verify**', async (route) => {
        await route.fulfill({
          json: {
            status: 'FAILED',
            isVerified: false,
            verificationError: 'TXT record not found'
          }
        });
      });

      await page.click('[data-testid="verify-now-button"]');

      await expect(page.locator('[data-testid="status-failed"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('TXT record not found');
    });

    test('DOM-006: Should remove domain', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      await page.click('[data-testid="delete-domain-button"]');
      await page.click('[data-testid="confirm-delete"]');

      await expect(page.locator('[data-testid="success-toast"]')).toContainText('removed');
    });
  });

  // ===== DNS VERIFICATION =====

  test.describe('DNS Verification', () => {
    test('DOM-010: Should show TXT record instructions', async ({ page }) => {
      await page.goto('/dashboard/domains/pending-domain-id');

      await expect(page.locator('[data-testid="txt-record-type"]')).toContainText('TXT');
      await expect(page.locator('[data-testid="txt-record-name"]')).toContainText('_pingto-verify');
      await expect(page.locator('[data-testid="txt-record-value"]')).toBeVisible();
    });

    test('DOM-012: Should show CNAME record instructions', async ({ page }) => {
      // Domain with CNAME verification type
      await page.goto('/dashboard/domains/cname-domain-id');

      await expect(page.locator('[data-testid="cname-record-type"]')).toContainText('CNAME');
      await expect(page.locator('[data-testid="cname-record-value"]')).toContainText('redirect.pingto.me');
    });

    test('DOM-013: Should show verification attempt count', async ({ page }) => {
      await page.goto('/dashboard/domains/pending-domain-id');

      await expect(page.locator('[data-testid="verification-attempts"]')).toContainText(/\d+ attempts/);
    });
  });

  // ===== DEFAULT DOMAIN =====

  test.describe('Default Domain', () => {
    test('DOM-030: Should set domain as default', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      const verifiedDomain = page.locator('[data-testid="domain-card"]:has([data-status="VERIFIED"])').first();
      await verifiedDomain.locator('[data-testid="set-default-button"]').click();

      await page.click('[data-testid="confirm-set-default"]');

      await expect(verifiedDomain.locator('[data-testid="default-badge"]')).toBeVisible();
    });

    test('DOM-031: Should auto-select default domain in link creation', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/links/new');

      const selector = page.locator('[data-testid="domain-selector"]');
      // Default domain should be pre-selected
      await expect(selector).toContainText('my-default-domain.com');
    });

    test('DOM-032: Should allow overriding domain per link', async ({ page }) => {
      await page.goto('/dashboard/links/new');

      await page.click('[data-testid="domain-selector"]');
      await page.click('[data-testid="domain-option"]:has-text("pingto.me")');

      await expect(page.locator('[data-testid="domain-selector"]')).toContainText('pingto.me');
    });
  });

  // ===== RBAC PERMISSIONS =====

  test.describe('Domain RBAC', () => {
    test('DOM-040: OWNER can manage domains', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      await expect(page.locator('[data-testid="add-domain-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-domain-button"]').first()).toBeVisible();
    });

    test('DOM-041: ADMIN can manage domains', async ({ page }) => {
      await loginAsUser(page, 'admin');
      await page.goto('/dashboard/domains');

      await expect(page.locator('[data-testid="add-domain-button"]')).toBeVisible();
    });

    test('DOM-042: EDITOR cannot manage domains', async ({ page }) => {
      await loginAsUser(page, 'editor');

      // Should not see domains in nav or be redirected
      await page.goto('/dashboard/domains');

      // Either redirected or shows permission error
      await expect(page.locator('[data-testid="add-domain-button"]')).not.toBeVisible();
    });

    test('DOM-043: VIEWER cannot manage domains', async ({ page }) => {
      await loginAsUser(page, 'viewer');
      await page.goto('/dashboard/domains');

      await expect(page.locator('[data-testid="add-domain-button"]')).not.toBeVisible();
    });
  });

  // ===== SSL CERTIFICATES =====

  test.describe('SSL Certificates', () => {
    test('DOM-020: Should provision SSL certificate', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains/verified-domain-id');

      await page.click('[data-testid="provision-ssl-button"]');

      await expect(page.locator('[data-testid="ssl-provisioning"]')).toBeVisible();

      // Wait for mock provisioning
      await page.waitForSelector('[data-testid="ssl-active"]', { timeout: 10000 });
    });

    test('DOM-021: Should display SSL certificate status', async ({ page }) => {
      await page.goto('/dashboard/domains/ssl-active-domain-id');

      await expect(page.locator('[data-testid="ssl-status"]')).toContainText('Active');
      await expect(page.locator('[data-testid="ssl-expiry"]')).toBeVisible();
      await expect(page.locator('[data-testid="ssl-issued"]')).toBeVisible();
    });

    test('DOM-022: Should toggle auto-renewal', async ({ page }) => {
      await page.goto('/dashboard/domains/ssl-active-domain-id');

      await page.click('[data-testid="ssl-auto-renew-toggle"]');

      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });
  });

  // ===== DOMAIN-LINK INTEGRATION =====

  test.describe('Domain-Link Integration', () => {
    test('DOM-004: Should create link with custom domain', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/links/new');

      await page.fill('[data-testid="url-input"]', 'https://example.com');
      await page.click('[data-testid="domain-selector"]');
      await page.click('[data-testid="domain-option"]:has-text("my-custom-domain.com")');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="short-url"]')).toContainText('my-custom-domain.com');
    });

    test('DOM-050: Should view links using domain', async ({ page }) => {
      await page.goto('/dashboard/domains/verified-domain-id');

      await expect(page.locator('[data-testid="domain-links-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="link-row"]').first()).toBeVisible();
    });

    test('DOM-051: Should show empty state for domain without links', async ({ page }) => {
      await page.goto('/dashboard/domains/new-domain-id');

      await expect(page.locator('[data-testid="no-links-message"]')).toContainText('No links using this domain');
      await expect(page.locator('[data-testid="create-link-button"]')).toBeVisible();
    });
  });

  // ===== SEARCH & FILTER =====

  test.describe('Domain Search & Filter', () => {
    test('DOM-060: Should search domains by hostname', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/domains');

      await page.fill('[data-testid="domain-search"]', 'example');

      await expect(page.locator('[data-testid="domain-card"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="domain-card"]')).toContainText('example.com');
    });

    test('DOM-061: Should filter by verification status', async ({ page }) => {
      await page.goto('/dashboard/domains');

      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-verified"]');

      const cards = page.locator('[data-testid="domain-card"]');
      for (const card of await cards.all()) {
        await expect(card.locator('[data-testid="status-badge"]')).toContainText('Verified');
      }
    });
  });
});
```

### 5.3 Test Data Requirements

```typescript
// apps/web/e2e/fixtures/test-data.ts - Domains section

export const DOMAIN_TEST_DATA = {
  // Verified domain
  verifiedDomain: {
    id: 'verified-domain-uuid',
    hostname: 'links.verified-company.com',
    status: 'VERIFIED',
    isVerified: true,
    isDefault: true,
    sslStatus: 'ACTIVE',
  },

  // Pending domain
  pendingDomain: {
    id: 'pending-domain-uuid',
    hostname: 'links.pending-company.com',
    status: 'PENDING',
    isVerified: false,
    verificationToken: 'pingto-verify-abc123',
    verificationAttempts: 2,
  },

  // Failed domain
  failedDomain: {
    id: 'failed-domain-uuid',
    hostname: 'links.failed-company.com',
    status: 'FAILED',
    isVerified: false,
    verificationError: 'TXT record not found',
    verificationAttempts: 10,
  },

  // SSL active domain
  sslActiveDomain: {
    id: 'ssl-domain-uuid',
    hostname: 'secure.company.com',
    status: 'VERIFIED',
    isVerified: true,
    sslStatus: 'ACTIVE',
    sslExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    sslAutoRenew: true,
  },
};

export const DOMAIN_TEST_IDS = {
  verifiedDomain: 'e2e-verified-domain',
  pendingDomain: 'e2e-pending-domain',
  failedDomain: 'e2e-failed-domain',
  sslDomain: 'e2e-ssl-domain',
};
```

---

## 6. Implementation Roadmap

### Phase 1: DTOs & Update Endpoint (Day 1)
1. ✅ Create CreateDomainDto with validation
2. ✅ Create UpdateDomainDto
3. ✅ Add PATCH /domains/:id endpoint
4. ✅ Unit tests for new code

### Phase 2: Frontend Enhancements (Day 2-3)
1. ✅ Auto-refresh for pending domains
2. ✅ Domain search input
3. ✅ Status filter dropdown
4. ✅ Test new frontend features

### Phase 3: E2E Tests (Day 4-5)
1. ✅ Default domain tests (DOM-030 to DOM-032)
2. ✅ RBAC tests (DOM-040 to DOM-043)
3. ✅ SSL tests (DOM-020 to DOM-022)
4. ✅ Domain-link integration tests

### Phase 4: Polish (Day 6)
1. ✅ Domain analytics endpoint (optional)
2. ✅ Swagger documentation
3. ✅ Full test suite verification

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Domain Module Test Coverage | > 85% | Jest coverage |
| E2E Domain Tests | 100% pass | Playwright |
| DNS Verification Success | > 90% | Monitoring |
| SSL Provisioning Time | < 5 min | Metrics |
| Domain Setup Completion | > 80% | Analytics |

---

## 8. Dependencies & Risks

### Dependencies
- DNS library (Node.js `dns/promises` - already used)
- SSL library (Mock implementation - docs for production)
- Cloudflare for production SSL (future)

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| DNS propagation delays | Medium | Clear user messaging, 48hr wait |
| SSL provisioning failures | Medium | Mock for now, production guide ready |
| CNAME conflicts | Low | Validation, error messaging |
| Rate limiting DNS checks | Low | Cron job with spacing |

---

## 9. References

- [Let's Encrypt ACME Protocol](https://letsencrypt.org/docs/)
- [Cloudflare for SSL](https://developers.cloudflare.com/ssl/)
- [DNS Record Types](https://www.cloudflare.com/learning/dns/dns-records/)
- Internal: `SSL_SERVICE_README.md`

---

*Document Version: 1.0*
*Last Updated: 2025-12-08*
*Author: AI System Analyst*
