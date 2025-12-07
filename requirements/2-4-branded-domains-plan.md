# Module 2.4: Branded Domains Development Plan

## Document Information
- **Module**: 2.4 Branded Domains (Custom Domains)
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Implementation**: ~40% Complete

---

## 1. Executive Summary

### Current State
- Basic domain CRUD implemented
- Manual DNS TXT verification works
- Simple frontend UI exists
- Organization-level domain support

### Critical Gaps
- No SSL/HTTPS auto-provisioning
- No automated DNS polling
- No RBAC enforcement
- No domain-to-link integration
- Missing certificate lifecycle management

---

## 2. Feature Breakdown

### 2.4.1 Enhanced DNS Verification (Priority: HIGH)

| Feature | Status | Priority |
|---------|--------|----------|
| Manual TXT verification | Implemented | - |
| Manual CNAME verification | NOT IMPLEMENTED | HIGH |
| Automated polling (30 min) | NOT IMPLEMENTED | HIGH |
| Verification attempts tracking | NOT IMPLEMENTED | MEDIUM |
| Last check timestamp | NOT IMPLEMENTED | MEDIUM |
| Failure logging | NOT IMPLEMENTED | MEDIUM |

### 2.4.2 SSL/HTTPS Provisioning (Priority: HIGH)

| Feature | Status | Priority |
|---------|--------|----------|
| Let's Encrypt integration | NOT IMPLEMENTED | HIGH |
| Certificate auto-provisioning | NOT IMPLEMENTED | HIGH |
| Certificate renewal | NOT IMPLEMENTED | HIGH |
| Certificate status tracking | NOT IMPLEMENTED | HIGH |
| HTTPS enforcement | NOT IMPLEMENTED | HIGH |

### 2.4.3 Domain Management Enhancement (Priority: MEDIUM)

| Feature | Status | Priority |
|---------|--------|----------|
| Set default domain | NOT IMPLEMENTED | HIGH |
| Domain details page | NOT IMPLEMENTED | MEDIUM |
| View links using domain | NOT IMPLEMENTED | MEDIUM |
| Domain settings (redirect policy) | NOT IMPLEMENTED | LOW |
| Subdomain support | NOT IMPLEMENTED | LOW |

### 2.4.4 RBAC Integration (Priority: HIGH)

| Feature | Status | Priority |
|---------|--------|----------|
| OWNER/ADMIN only access | NOT IMPLEMENTED | HIGH |
| Organization membership validation | NOT IMPLEMENTED | HIGH |
| Audit logging | NOT IMPLEMENTED | MEDIUM |

---

## 3. Database Schema Updates

```prisma
model Domain {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  hostname          String    @unique
  organizationId    String    @db.Uuid
  isVerified        Boolean   @default(false)
  isDefault         Boolean   @default(false)
  status            DomainStatus @default(PENDING)

  // Verification
  verificationType  String?   // 'txt' | 'cname'
  verificationToken String?
  verificationAttempts Int    @default(0)
  lastVerifiedAt    DateTime?
  lastCheckAt       DateTime?
  verificationError String?

  // SSL
  sslStatus         SslStatus? @default(PENDING)
  sslProvider       String?   // 'letsencrypt'
  sslCertificateId  String?
  sslIssuedAt       DateTime?
  sslExpiresAt      DateTime?
  sslAutoRenew      Boolean   @default(true)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  organization      Organization @relation(fields: [organizationId], references: [id])
  links             Link[]
}

enum DomainStatus {
  PENDING
  VERIFYING
  VERIFIED
  FAILED
}

enum SslStatus {
  PENDING
  PROVISIONING
  ACTIVE
  EXPIRED
  FAILED
}
```

---

## 4. API Endpoints

```yaml
# Domain CRUD
POST   /organizations/:orgId/domains              - Add domain
GET    /organizations/:orgId/domains              - List domains
GET    /organizations/:orgId/domains/:id          - Get domain details
PATCH  /organizations/:orgId/domains/:id          - Update domain settings
DELETE /organizations/:orgId/domains/:id          - Remove domain

# Verification
POST   /organizations/:orgId/domains/:id/verify   - Trigger verification
GET    /organizations/:orgId/domains/:id/dns      - Get DNS record info

# SSL
POST   /organizations/:orgId/domains/:id/ssl      - Provision SSL certificate
GET    /organizations/:orgId/domains/:id/ssl      - Get SSL status

# Default Domain
POST   /organizations/:orgId/domains/:id/default  - Set as default
```

---

## 5. Test Cases

### E2E Tests: `apps/web/e2e/branded-domains.spec.ts`

```typescript
test.describe('Branded Domains', () => {
  // Domain CRUD
  test('DOM-001: Add custom domain')
  test('DOM-002: List organization domains')
  test('DOM-003: View domain details')
  test('DOM-004: Remove domain')

  // Verification
  test('DOM-010: Verify domain via TXT record - success')
  test('DOM-011: Verify domain via TXT record - failure')
  test('DOM-012: Verify domain via CNAME record')
  test('DOM-013: Automated verification polling')

  // SSL
  test('DOM-020: SSL certificate provisioning')
  test('DOM-021: SSL certificate status display')
  test('DOM-022: SSL certificate renewal')

  // Default Domain
  test('DOM-030: Set domain as default')
  test('DOM-031: Use default domain when creating links')
  test('DOM-032: Override domain per link')

  // RBAC
  test('DOM-040: OWNER can manage domains')
  test('DOM-041: ADMIN can manage domains')
  test('DOM-042: EDITOR cannot manage domains')
  test('DOM-043: VIEWER cannot manage domains')

  // Links Integration
  test('DOM-050: View links using specific domain')
  test('DOM-051: Migrate links to different domain')
});
```

---

## 6. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | DNS verification enhancement, RBAC |
| Phase 2 | 2 weeks | SSL provisioning, certificate management |
| Phase 3 | 1 week | Domain-link integration, UI polish |
| **Total** | **5 weeks** | Complete Module 2.4 |

---

## 7. Dependencies

- Let's Encrypt / Cloudflare for SSL
- DNS resolution library (Node.js dns)
- Cron job for automated polling
- Audit module for logging

---

## 8. Current Implementation Files

- `apps/api/src/domains/domains.service.ts` (74 lines)
- `apps/api/src/domains/domains.controller.ts` (29 lines)
- `apps/web/app/dashboard/domains/page.tsx` (318 lines)
- `apps/web/e2e/domains.spec.ts` (130 lines)
