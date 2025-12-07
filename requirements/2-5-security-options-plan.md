# Module 2.5: Security Options Development Plan

## Document Information

- **Module**: 2.5 Security Options
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Implementation**: ~50% Complete

---

## 1. Executive Summary

### Current State

- User-level 2FA (TOTP) fully implemented
- Basic JWT session management
- Simple API key validation
- Basic audit logging service exists

### Critical Gaps

- No organization-wide 2FA enforcement
- No backup codes for recovery
- No active session management
- No API key rotation/expiration
- No IP allowlist
- No login activity logging

---

## 2. Feature Breakdown

### 2.5.1 Enhanced 2FA (Priority: HIGH)

| Feature                  | Status          | Priority |
| ------------------------ | --------------- | -------- |
| User TOTP setup          | Implemented     | -        |
| QR code generation       | Implemented     | -        |
| Verify & enable          | Implemented     | -        |
| Org-wide 2FA enforcement | NOT IMPLEMENTED | HIGH     |
| Per-role 2FA requirement | NOT IMPLEMENTED | MEDIUM   |
| Backup codes (8 codes)   | NOT IMPLEMENTED | HIGH     |
| Email recovery option    | NOT IMPLEMENTED | MEDIUM   |

### 2.5.2 Session Management (Priority: HIGH)

| Feature                      | Status          | Priority |
| ---------------------------- | --------------- | -------- |
| JWT access tokens            | Implemented     | -        |
| Refresh token rotation       | Implemented     | -        |
| Session timeout config       | NOT IMPLEMENTED | HIGH     |
| Active sessions list         | NOT IMPLEMENTED | HIGH     |
| Force logout other devices   | NOT IMPLEMENTED | HIGH     |
| Auto-logout on tab close     | NOT IMPLEMENTED | LOW      |
| Geographic anomaly detection | NOT IMPLEMENTED | LOW      |

### 2.5.3 API Key Security (Priority: MEDIUM)

| Feature                  | Status          | Priority |
| ------------------------ | --------------- | -------- |
| Basic API key validation | Implemented     | -        |
| Key rotation             | NOT IMPLEMENTED | HIGH     |
| Key expiration           | NOT IMPLEMENTED | HIGH     |
| Scope restrictions       | NOT IMPLEMENTED | HIGH     |
| Per-key rate limiting    | NOT IMPLEMENTED | MEDIUM   |
| Usage tracking           | NOT IMPLEMENTED | MEDIUM   |

### 2.5.4 IP Allowlist (Priority: LOW - Enterprise)

| Feature               | Status          | Priority |
| --------------------- | --------------- | -------- |
| IP allowlist per org  | NOT IMPLEMENTED | LOW      |
| CIDR notation support | NOT IMPLEMENTED | LOW      |
| Temporary override    | NOT IMPLEMENTED | LOW      |

### 2.5.5 Login Activity (Priority: MEDIUM)

| Feature                      | Status          | Priority |
| ---------------------------- | --------------- | -------- |
| Log successful logins        | Partial         | MEDIUM   |
| Log failed attempts          | NOT IMPLEMENTED | HIGH     |
| Geographic location          | NOT IMPLEMENTED | MEDIUM   |
| Suspicious activity alerts   | NOT IMPLEMENTED | MEDIUM   |
| Account lockout (5 attempts) | NOT IMPLEMENTED | HIGH     |

---

## 3. Database Schema Updates

```prisma
// Backup Codes for 2FA
model BackupCode {
  id        String   @id @default(uuid())
  userId    String   @db.Uuid
  code      String   // Hashed
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])

  @@index([userId])
}

// Active Sessions
model Session {
  id          String   @id @default(uuid())
  userId      String   @db.Uuid
  token       String   @unique
  deviceInfo  String?
  ipAddress   String?
  location    String?
  lastActive  DateTime @default(now())
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  user        User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([expiresAt])
}

// Login Attempts
model LoginAttempt {
  id        String   @id @default(uuid())
  email     String
  success   Boolean
  ipAddress String?
  userAgent String?
  location  String?
  reason    String?  // 'invalid_password', 'user_not_found', '2fa_failed'
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([ipAddress, createdAt])
}

// Organization Security Settings
model OrganizationSecuritySettings {
  id               String  @id @default(uuid())
  organizationId   String  @unique @db.Uuid
  enforce2FA       Boolean @default(false)
  enforce2FAForRoles String[] // ['OWNER', 'ADMIN']
  sessionTimeoutMinutes Int @default(480) // 8 hours
  ipAllowlist      String[] // CIDR notation
  maxLoginAttempts Int     @default(5)
  lockoutDuration  Int     @default(30) // minutes

  organization     Organization @relation(fields: [organizationId], references: [id])
}
```

---

## 4. API Endpoints

```yaml
# 2FA Enhancement
POST   /auth/2fa/backup-codes          - Generate backup codes
POST   /auth/2fa/verify-backup         - Verify with backup code
PATCH  /organizations/:id/security/2fa - Set org 2FA enforcement

# Session Management
GET    /profile/sessions               - List active sessions
DELETE /profile/sessions/:id           - Logout specific session
DELETE /profile/sessions               - Logout all other sessions
PATCH  /organizations/:id/security/session-timeout - Set timeout

# API Key Security
POST   /developer/api-keys/:id/rotate  - Rotate API key
PATCH  /developer/api-keys/:id/expiry  - Set expiration
PATCH  /developer/api-keys/:id/scopes  - Update scopes

# IP Allowlist
GET    /organizations/:id/security/ip-allowlist
PATCH  /organizations/:id/security/ip-allowlist

# Login Activity
GET    /security/login-activity        - View login history
GET    /security/failed-attempts       - View failed attempts
```

---

## 5. Test Cases

### E2E Tests: `apps/web/e2e/security-options.spec.ts`

```typescript
test.describe("Security Options", () => {
  // 2FA
  test("SEC-001: Setup 2FA with TOTP");
  test("SEC-002: Disable 2FA");
  test("SEC-003: Generate backup codes");
  test("SEC-004: Login with backup code");
  test("SEC-005: Org-wide 2FA enforcement");
  test("SEC-006: User without 2FA blocked when enforced");

  // Sessions
  test("SEC-010: View active sessions");
  test("SEC-011: Logout specific session");
  test("SEC-012: Logout all other sessions");
  test("SEC-013: Session timeout enforcement");

  // API Keys
  test("SEC-020: Rotate API key");
  test("SEC-021: Set API key expiration");
  test("SEC-022: Expired API key rejected");
  test("SEC-023: API key scope enforcement");

  // IP Allowlist (Enterprise)
  test("SEC-030: Set IP allowlist");
  test("SEC-031: Access blocked from non-allowed IP");
  test("SEC-032: CIDR range validation");

  // Login Activity
  test("SEC-040: View login history");
  test("SEC-041: Account lockout after 5 failed attempts");
  test("SEC-042: Lockout cooldown (30 min)");
});
```

---

## 6. Implementation Timeline

| Phase     | Duration    | Deliverables                     |
| --------- | ----------- | -------------------------------- |
| Phase 1   | 2 weeks     | Backup codes, session management |
| Phase 2   | 1 week      | API key security enhancement     |
| Phase 3   | 1 week      | Login activity, account lockout  |
| Phase 4   | 1 week      | IP allowlist, org enforcement    |
| **Total** | **5 weeks** | Complete Module 2.5              |

---

## 7. Current Implementation Files

- `apps/api/src/auth/two-factor.service.ts`
- `apps/api/src/auth/two-factor.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/web/app/dashboard/settings/two-factor/page.tsx`
- `apps/web/app/dashboard/settings/security/page.tsx`
