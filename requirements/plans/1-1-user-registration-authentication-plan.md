# Module 1.1: User Registration & Authentication - Development Plan

## Executive Summary

This document outlines the development plan for the User Registration & Authentication module of PingTO.Me. Based on comprehensive codebase analysis, the authentication system is approximately **70-75% complete** with robust foundations but missing several critical features.

---

## 1. Current State Analysis

### 1.1 What's Already Implemented ✅

#### Backend (NestJS)
| Feature | Status | Location |
|---------|--------|----------|
| Email/Password Registration | ✅ Complete | `auth.controller.ts:register` |
| Email/Password Login | ✅ Complete | `auth.controller.ts:login` |
| JWT Access Tokens (15 min) | ✅ Complete | `jwt.strategy.ts` |
| Refresh Tokens (7 days) | ✅ Complete | `jwt-refresh.strategy.ts` |
| Google OAuth | ✅ Complete | `google.strategy.ts` |
| GitHub OAuth | ✅ Complete | `github.strategy.ts` |
| Password Reset (Forgot/Reset) | ✅ Complete | `auth.controller.ts` |
| Email Verification | ✅ Complete | `auth.controller.ts:verifyEmail` |
| 2FA Setup/Verify/Disable | ✅ Complete | `two-factor.service.ts` |
| RBAC Permission System | ✅ Complete | `auth/rbac/` |
| JWT Auth Guard | ✅ Complete | `guards/jwt-auth.guard.ts` |
| API Key Authentication | ✅ Complete | `api-key.guard.ts` |
| Audit Logging Integration | ✅ Complete | Via `AuditService` |

#### Frontend (Next.js)
| Feature | Status | Location |
|---------|--------|----------|
| Login Page | ✅ Complete | `/login/page.tsx` |
| Register Page | ✅ Complete | `/register/page.tsx` |
| Forgot Password Page | ✅ Complete | `/forgot-password/page.tsx` |
| Reset Password Page | ✅ Complete | `/reset-password/page.tsx` |
| Email Verification Page | ✅ Complete | `/verify-email/page.tsx` |
| 2FA Setup Page | ✅ Complete | `/dashboard/settings/two-factor/page.tsx` |
| Profile Settings | ✅ Complete | `/dashboard/settings/profile/page.tsx` |
| Security Settings | ✅ Complete | `/dashboard/settings/security/page.tsx` |
| AuthContext & Token Management | ✅ Complete | `/contexts/AuthContext.tsx` |
| Middleware Route Protection | ✅ Complete | `/middleware.ts` |
| Team Invitation Page | ✅ Complete | `/invitations/[token]/page.tsx` |

#### Database Schema
| Model | Status | Purpose |
|-------|--------|---------|
| User | ✅ Complete | Core user with 2FA fields |
| Account | ✅ Complete | OAuth provider accounts |
| Session | ✅ Complete | Enhanced session tracking |
| BackupCode | ✅ Complete | 2FA backup codes |
| LoginAttempt | ✅ Complete | Login audit trail |
| VerificationToken | ✅ Complete | Email/password reset tokens |
| OrganizationSettings | ✅ Complete | Org-level security policies |

### 1.2 What's Missing or Incomplete ❌

#### Critical Issues
| Issue | Priority | Impact |
|-------|----------|--------|
| **TwoFactorController not registered** | 🔴 Critical | 2FA endpoints won't work |
| **No DTOs for auth endpoints** | 🔴 Critical | Poor validation, type safety |
| **2FA login challenge missing** | 🔴 Critical | Users with 2FA can't login properly |
| **Session management UI not functional** | 🟡 High | Can't view/revoke sessions |
| **Backup codes not implemented** | 🟡 High | No 2FA recovery option |
| **Brute force protection missing** | 🟡 High | Security vulnerability |
| **Change password endpoint missing** | 🟡 High | Users can't change password |
| **Login activity not exposed** | 🟠 Medium | No security visibility |
| **Email verification not enforced** | 🟠 Medium | Users can skip verification |
| **Token rotation missing** | 🟠 Medium | Refresh token security |

#### Missing Features for Competitive Parity
| Feature | Competitor Status | Priority |
|---------|-------------------|----------|
| Passkey/WebAuthn | Not in Bitly/Rebrandly | 🟢 Future |
| Hardware Security Keys | Not in Bitly/Rebrandly | 🟢 Future |
| SSO (SAML 2.0) | Enterprise tier | 🟠 Medium |
| SCIM Provisioning | Enterprise tier | 🟢 Future |
| Device Fingerprinting | Unknown | 🟠 Medium |
| Adaptive Authentication | Unknown | 🟢 Future |

---

## 2. Feature Breakdown & Priorities

### Priority 1: Critical Fixes (Must Fix Before Production)

#### P1-01: Register TwoFactorController
**Description:** The 2FA controller exists but is not registered in `auth.module.ts`
**Effort:** 5 minutes
**Files to modify:**
- `apps/api/src/auth/auth.module.ts`

#### P1-02: Create Auth DTOs
**Description:** Create proper DTOs with class-validator for all auth endpoints
**Effort:** 2-3 hours
**Files to create:**
- `apps/api/src/auth/dto/register.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/dto/forgot-password.dto.ts`
- `apps/api/src/auth/dto/reset-password.dto.ts`
- `apps/api/src/auth/dto/verify-email.dto.ts`
- `apps/api/src/auth/dto/change-password.dto.ts`

#### P1-03: 2FA Login Challenge Flow
**Description:** Implement 2FA verification step during login for users with 2FA enabled
**Effort:** 1 day
**Backend changes:**
- Modify login to return `requires2FA: true` if user has 2FA enabled
- Add `POST /auth/login/2fa` endpoint to verify TOTP code
- Issue tokens only after successful 2FA verification
**Frontend changes:**
- Create `/login/2fa/page.tsx` for 2FA code input
- Update login flow to redirect to 2FA page when required

### Priority 2: High Priority Security Features

#### P2-01: Session Management Implementation
**Description:** Expose session management endpoints and build UI
**Effort:** 1-2 days
**Backend changes:**
- `GET /auth/sessions` - List active sessions
- `DELETE /auth/sessions/:id` - Revoke specific session
- `DELETE /auth/sessions` - Revoke all other sessions
**Frontend changes:**
- Complete Security Settings session list
- Add device icons, location display
- Add "Sign out" buttons per session

#### P2-02: Backup Codes Implementation
**Description:** Generate and verify 2FA backup codes
**Effort:** 1 day
**Backend changes:**
- `POST /auth/2fa/backup-codes` - Generate 8-10 backup codes
- `POST /auth/2fa/backup-codes/verify` - Verify backup code during login
- `GET /auth/2fa/backup-codes/remaining` - Get remaining code count
**Frontend changes:**
- Show backup codes during 2FA setup
- Add "Download codes" functionality
- Show remaining codes count

#### P2-03: Change Password Endpoint
**Description:** Allow authenticated users to change their password
**Effort:** 2-3 hours
**Backend changes:**
- `POST /auth/change-password` - Verify old password, set new
**Frontend changes:**
- Already implemented in Security Settings, just needs backend connection

#### P2-04: Brute Force Protection
**Description:** Implement account lockout after failed login attempts
**Effort:** 1 day
**Backend changes:**
- Track failed attempts in `LoginAttempt` model
- Lock account after 5 failed attempts (30 min cooldown)
- Return appropriate error message
- Add `GET /auth/account-status` to check lockout status
**Frontend changes:**
- Display lockout message with countdown
- Add CAPTCHA after 3 failed attempts (optional)

### Priority 3: Medium Priority Enhancements

#### P3-01: Email Verification Enforcement
**Description:** Require email verification for certain actions
**Effort:** 4-6 hours
**Backend changes:**
- Add `EmailVerifiedGuard`
- Apply to sensitive endpoints (create link, manage team, etc.)
- Add `POST /auth/resend-verification` endpoint
**Frontend changes:**
- Show verification banner if not verified
- Add "Resend verification email" button
- Gate certain features until verified

#### P3-02: Login Activity Dashboard
**Description:** Show users their login history
**Effort:** 1 day
**Backend changes:**
- `GET /auth/login-activity` - List recent login attempts
- Include IP, device, location, timestamp, success/failure
**Frontend changes:**
- Add Login Activity section to Security Settings
- Show timeline of login attempts
- Highlight suspicious attempts

#### P3-03: Token Rotation
**Description:** Rotate refresh tokens on each use
**Effort:** 4-6 hours
**Backend changes:**
- Generate new refresh token on each refresh request
- Invalidate old refresh token
- Detect token reuse (potential theft)

#### P3-04: OAuth Account Linking
**Description:** Link/unlink OAuth accounts to existing users
**Effort:** 1 day
**Backend changes:**
- `POST /auth/oauth/link/:provider` - Link OAuth account
- `DELETE /auth/oauth/unlink/:provider` - Unlink OAuth account
- Handle email conflicts
**Frontend changes:**
- Add "Linked Accounts" section to Profile Settings
- Show connected providers with connect/disconnect buttons

### Priority 4: Future Enhancements (Research Required)

#### P4-01: Passkey/WebAuthn Authentication
**Description:** Add passwordless authentication with passkeys
**Effort:** 2-3 days
**Benefits:**
- Phishing-resistant
- 3x faster login
- Modern user experience
- Competitive advantage (neither Bitly nor Rebrandly offer this)

#### P4-02: Hardware Security Key Support
**Description:** Support YubiKey and other FIDO2 hardware keys
**Effort:** 1-2 days
**Benefits:**
- Enterprise-grade security
- Required for high-security organizations

#### P4-03: SSO (SAML 2.0)
**Description:** Single Sign-On for Enterprise customers
**Effort:** 3-5 days
**Benefits:**
- Enterprise requirement
- Matches Bitly/Rebrandly Enterprise tiers

#### P4-04: Device Fingerprinting & Adaptive Auth
**Description:** Risk-based authentication based on device/behavior
**Effort:** 1 week
**Benefits:**
- Reduced friction for legitimate users
- Better fraud detection
- Modern security approach

---

## 3. Database Schema Updates

### 3.1 No Schema Changes Required for P1
The current schema is comprehensive and supports all Priority 1 features.

### 3.2 Schema Updates for P2-P4 (Future)

```prisma
// Add to User model for P4-01 Passkeys
model Passkey {
  id              String   @id @default(uuid())
  userId          String
  credentialId    String   @unique
  publicKey       Bytes
  counter         Int      @default(0)
  deviceType      String?  // "platform", "cross-platform"
  transports      String[] // "usb", "ble", "nfc", "internal"
  name            String?  // User-friendly device name
  lastUsedAt      DateTime?
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Add to User model for P4-02 Hardware Keys
model SecurityKey {
  id              String   @id @default(uuid())
  userId          String
  credentialId    String   @unique
  publicKey       Bytes
  counter         Int      @default(0)
  name            String   // "YubiKey 5", "Backup Key"
  lastUsedAt      DateTime?
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Add for P4-04 Device Fingerprinting
model TrustedDevice {
  id              String   @id @default(uuid())
  userId          String
  fingerprint     String   // Hashed device fingerprint
  name            String?  // "Chrome on MacBook Pro"
  trustScore      Int      @default(50) // 0-100
  lastSeenAt      DateTime
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, fingerprint])
  @@index([userId])
}
```

---

## 4. API Endpoint Specifications

### 4.1 Existing Endpoints (Working)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh` | Refresh access token | Cookie |
| GET | `/auth/me` | Get current user | JWT |
| POST | `/auth/logout` | Logout (clear cookie) | JWT |
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/github` | Initiate GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub OAuth callback | No |
| POST | `/auth/verify-email` | Verify email with token | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |

### 4.2 Endpoints Needing Registration (P1-01)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/2fa/status` | Get 2FA status | JWT |
| POST | `/auth/2fa/setup` | Generate QR code & secret | JWT |
| POST | `/auth/2fa/verify` | Enable 2FA with TOTP code | JWT |
| POST | `/auth/2fa/disable` | Disable 2FA | JWT |

### 4.3 New Endpoints Required

#### Priority 1: Critical
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login/2fa` | Verify 2FA code during login | Session |

#### Priority 2: High
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/sessions` | List active sessions | JWT |
| DELETE | `/auth/sessions/:id` | Revoke specific session | JWT |
| DELETE | `/auth/sessions` | Revoke all other sessions | JWT |
| POST | `/auth/2fa/backup-codes` | Generate backup codes | JWT |
| POST | `/auth/2fa/backup-codes/verify` | Verify backup code | Session |
| GET | `/auth/2fa/backup-codes/remaining` | Get remaining codes | JWT |
| POST | `/auth/change-password` | Change password | JWT |
| GET | `/auth/account-status` | Check lockout status | No |

#### Priority 3: Medium
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/login-activity` | Get login history | JWT |
| POST | `/auth/resend-verification` | Resend verification email | JWT |
| POST | `/auth/oauth/link/:provider` | Link OAuth account | JWT |
| DELETE | `/auth/oauth/unlink/:provider` | Unlink OAuth account | JWT |

### 4.4 DTO Specifications

```typescript
// register.dto.ts
export class RegisterDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}

// login.dto.ts
export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  password: string;
}

// login-2fa.dto.ts
export class Login2faDto {
  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  sessionToken: string; // Temporary token from initial login
}

// change-password.dto.ts
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  newPassword: string;
}

// forgot-password.dto.ts
export class ForgotPasswordDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;
}

// reset-password.dto.ts
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;
}

// verify-email.dto.ts
export class VerifyEmailDto {
  @IsString()
  token: string;
}
```

---

## 5. Test Cases

### 5.1 Unit Tests (Jest)

#### Auth Service Tests

```typescript
// apps/api/src/auth/__tests__/auth.service.spec.ts

describe('AuthService', () => {
  // Registration Tests
  describe('register', () => {
    it('should create a new user with hashed password');
    it('should create default organization for new user');
    it('should send verification email');
    it('should reject duplicate email');
    it('should validate password strength');
    it('should normalize email to lowercase');
  });

  // Login Tests
  describe('login', () => {
    it('should return tokens for valid credentials');
    it('should reject invalid password');
    it('should reject non-existent user');
    it('should return requires2FA flag if 2FA enabled');
    it('should track login attempt on success');
    it('should track login attempt on failure');
    it('should lock account after 5 failed attempts');
    it('should reject login for locked account');
  });

  // Token Tests
  describe('refresh', () => {
    it('should issue new access token with valid refresh token');
    it('should reject expired refresh token');
    it('should reject invalid refresh token');
    it('should rotate refresh token (optional)');
  });

  // Password Reset Tests
  describe('forgotPassword', () => {
    it('should send reset email for existing user');
    it('should not reveal if email exists (security)');
    it('should create verification token');
    it('should expire old tokens');
  });

  describe('resetPassword', () => {
    it('should reset password with valid token');
    it('should reject expired token');
    it('should reject invalid token');
    it('should invalidate all sessions after reset');
  });

  // Email Verification Tests
  describe('verifyEmail', () => {
    it('should verify email with valid token');
    it('should reject expired token');
    it('should reject already verified email');
  });

  // OAuth Tests
  describe('handleOAuthLogin', () => {
    it('should create new user on first OAuth login');
    it('should login existing OAuth user');
    it('should link OAuth to existing email user');
    it('should create default organization');
  });
});
```

#### Two-Factor Service Tests

```typescript
// apps/api/src/auth/__tests__/two-factor.service.spec.ts

describe('TwoFactorService', () => {
  describe('generateSecret', () => {
    it('should generate TOTP secret');
    it('should return QR code data URL');
    it('should return manual entry key');
  });

  describe('verifyAndEnable', () => {
    it('should enable 2FA with valid code');
    it('should reject invalid code');
    it('should reject if already enabled');
    it('should generate backup codes on enable');
  });

  describe('verify', () => {
    it('should verify valid TOTP code');
    it('should reject expired code');
    it('should reject invalid code');
    it('should accept backup code');
    it('should invalidate used backup code');
  });

  describe('disable', () => {
    it('should disable 2FA with valid code');
    it('should reject invalid code');
    it('should clear secret and backup codes');
  });

  describe('backupCodes', () => {
    it('should generate 10 backup codes');
    it('should hash codes before storing');
    it('should return remaining code count');
  });
});
```

#### Session Service Tests

```typescript
// apps/api/src/auth/__tests__/session.service.spec.ts

describe('SessionService', () => {
  describe('getSessions', () => {
    it('should return all active sessions for user');
    it('should include device info and location');
    it('should mark current session');
  });

  describe('revokeSession', () => {
    it('should revoke specific session');
    it('should reject revoking other user session');
    it('should reject revoking non-existent session');
  });

  describe('revokeAllOtherSessions', () => {
    it('should revoke all sessions except current');
    it('should return revoked count');
  });

  describe('trackSession', () => {
    it('should create session with device info');
    it('should update lastActive on activity');
    it('should extract location from IP');
  });
});
```

#### Brute Force Protection Tests

```typescript
// apps/api/src/auth/__tests__/brute-force.service.spec.ts

describe('BruteForceService', () => {
  describe('recordAttempt', () => {
    it('should record successful login attempt');
    it('should record failed login attempt');
    it('should track attempt count per email');
  });

  describe('isLocked', () => {
    it('should return false for new accounts');
    it('should return true after 5 failed attempts');
    it('should include lockout expiry time');
    it('should auto-unlock after 30 minutes');
  });

  describe('reset', () => {
    it('should reset attempt count on successful login');
  });
});
```

### 5.2 E2E Tests (Playwright)

```typescript
// apps/web/e2e/auth.spec.ts - Enhanced

import { test, expect } from '@playwright/test';

test.describe('User Registration & Authentication', () => {

  // ===== REGISTRATION TESTS =====

  test.describe('Registration', () => {
    test('AUTH-001: Should register new user with valid data', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'newuser@test.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('verification email');
    });

    test('AUTH-002: Should reject weak password', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'test@test.com');
      await page.fill('[data-testid="password-input"]', '123');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('AUTH-003: Should reject duplicate email', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'existing@test.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists');
    });

    test('AUTH-004: Should validate email format', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });
  });

  // ===== LOGIN TESTS =====

  test.describe('Login', () => {
    test('AUTH-010: Should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'user@test.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');
    });

    test('AUTH-011: Should reject invalid password', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'user@test.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('AUTH-012: Should reject non-existent user', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'nonexistent@test.com');
      await page.fill('[data-testid="password-input"]', 'anypassword');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('AUTH-013: Should lock account after 5 failed attempts', async ({ page }) => {
      await page.goto('/login');

      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', 'user@test.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        await page.waitForTimeout(500);
      }

      await expect(page.locator('[data-testid="error-message"]')).toContainText('locked');
    });
  });

  // ===== 2FA TESTS =====

  test.describe('Two-Factor Authentication', () => {
    test('AUTH-020: Should redirect to 2FA page when 2FA is enabled', async ({ page }) => {
      // Login as user with 2FA enabled
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', '2fa-user@test.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/login/2fa');
      await expect(page.locator('[data-testid="2fa-input"]')).toBeVisible();
    });

    test('AUTH-021: Should complete login with valid 2FA code', async ({ page }) => {
      await page.goto('/login/2fa');
      // Assume session token is stored from previous step
      await page.fill('[data-testid="2fa-input"]', '123456');
      await page.click('[data-testid="verify-button"]');

      await expect(page).toHaveURL('/dashboard');
    });

    test('AUTH-022: Should reject invalid 2FA code', async ({ page }) => {
      await page.goto('/login/2fa');
      await page.fill('[data-testid="2fa-input"]', '000000');
      await page.click('[data-testid="verify-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid code');
    });

    test('AUTH-023: Should accept backup code for 2FA', async ({ page }) => {
      await page.goto('/login/2fa');
      await page.click('[data-testid="use-backup-code"]');
      await page.fill('[data-testid="backup-code-input"]', 'ABCD-1234-EFGH');
      await page.click('[data-testid="verify-button"]');

      await expect(page).toHaveURL('/dashboard');
    });

    test('AUTH-024: Should setup 2FA successfully', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/two-factor');

      await page.click('[data-testid="setup-2fa-button"]');
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

      // Simulate entering TOTP code
      await page.fill('[data-testid="verification-code"]', '123456');
      await page.click('[data-testid="enable-2fa-button"]');

      await expect(page.locator('[data-testid="2fa-enabled-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
    });

    test('AUTH-025: Should show backup codes after 2FA setup', async ({ page }) => {
      // After 2FA setup
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
      await expect(page.locator('[data-testid="backup-code"]')).toHaveCount(10);

      await page.click('[data-testid="download-codes-button"]');
      // Verify download triggered
    });

    test('AUTH-026: Should disable 2FA with valid code', async ({ page }) => {
      await loginAsUser(page, 'testuser-with-2fa');
      await page.goto('/dashboard/settings/two-factor');

      await page.click('[data-testid="disable-2fa-button"]');
      await page.fill('[data-testid="verification-code"]', '123456');
      await page.click('[data-testid="confirm-disable-button"]');

      await expect(page.locator('[data-testid="2fa-disabled-badge"]')).toBeVisible();
    });
  });

  // ===== PASSWORD RESET TESTS =====

  test.describe('Password Reset', () => {
    test('AUTH-030: Should request password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', 'user@test.com');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('email sent');
    });

    test('AUTH-031: Should not reveal if email exists', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.fill('[data-testid="email-input"]', 'nonexistent@test.com');
      await page.click('[data-testid="submit-button"]');

      // Same message whether email exists or not
      await expect(page.locator('[data-testid="success-message"]')).toContainText('email sent');
    });

    test('AUTH-032: Should reset password with valid token', async ({ page }) => {
      await page.goto('/reset-password?token=valid-token');
      await page.fill('[data-testid="password-input"]', 'NewSecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePass123!');
      await page.click('[data-testid="reset-button"]');

      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('reset successfully');
    });

    test('AUTH-033: Should reject expired token', async ({ page }) => {
      await page.goto('/reset-password?token=expired-token');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('expired');
    });
  });

  // ===== EMAIL VERIFICATION TESTS =====

  test.describe('Email Verification', () => {
    test('AUTH-040: Should verify email with valid token', async ({ page }) => {
      await page.goto('/verify-email?token=valid-token');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('verified');
      await expect(page).toHaveURL('/login');
    });

    test('AUTH-041: Should reject expired verification token', async ({ page }) => {
      await page.goto('/verify-email?token=expired-token');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('expired');
    });

    test('AUTH-042: Should resend verification email', async ({ page }) => {
      await loginAsUnverifiedUser(page);
      await page.goto('/dashboard');

      await page.click('[data-testid="resend-verification-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('sent');
    });
  });

  // ===== SESSION MANAGEMENT TESTS =====

  test.describe('Session Management', () => {
    test('AUTH-050: Should display active sessions', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await expect(page.locator('[data-testid="sessions-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount.greaterThan(0);
    });

    test('AUTH-051: Should show current session indicator', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await expect(page.locator('[data-testid="current-session-badge"]')).toBeVisible();
    });

    test('AUTH-052: Should revoke other session', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      const otherSession = page.locator('[data-testid="session-item"]:not(:has([data-testid="current-session-badge"]))').first();
      await otherSession.locator('[data-testid="revoke-session-button"]').click();

      await expect(page.locator('[data-testid="success-message"]')).toContainText('revoked');
    });

    test('AUTH-053: Should revoke all other sessions', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.click('[data-testid="revoke-all-sessions-button"]');
      await page.click('[data-testid="confirm-revoke-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('sessions revoked');
    });
  });

  // ===== CHANGE PASSWORD TESTS =====

  test.describe('Change Password', () => {
    test('AUTH-060: Should change password with valid current password', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.fill('[data-testid="current-password-input"]', 'OldPass123!');
      await page.fill('[data-testid="new-password-input"]', 'NewPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');
      await page.click('[data-testid="change-password-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('changed');
    });

    test('AUTH-061: Should reject wrong current password', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.fill('[data-testid="current-password-input"]', 'WrongPass123!');
      await page.fill('[data-testid="new-password-input"]', 'NewPass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!');
      await page.click('[data-testid="change-password-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('incorrect');
    });

    test('AUTH-062: Should show password strength indicator', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.fill('[data-testid="new-password-input"]', 'weak');
      await expect(page.locator('[data-testid="strength-weak"]')).toBeVisible();

      await page.fill('[data-testid="new-password-input"]', 'MediumPass1');
      await expect(page.locator('[data-testid="strength-medium"]')).toBeVisible();

      await page.fill('[data-testid="new-password-input"]', 'StrongPass123!@#');
      await expect(page.locator('[data-testid="strength-strong"]')).toBeVisible();
    });
  });

  // ===== OAUTH TESTS =====

  test.describe('OAuth Authentication', () => {
    test('AUTH-070: Should redirect to Google OAuth', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="google-login-button"]');

      await expect(page.url()).toContain('accounts.google.com');
    });

    test('AUTH-071: Should redirect to GitHub OAuth', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="github-login-button"]');

      await expect(page.url()).toContain('github.com');
    });

    test('AUTH-072: Should handle OAuth callback success', async ({ page }) => {
      // Mock OAuth callback
      await page.goto('/dashboard'); // Backend handles redirect
      await expect(page).toHaveURL('/dashboard');
    });
  });

  // ===== LOGOUT TESTS =====

  test.describe('Logout', () => {
    test('AUTH-080: Should logout successfully', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      await expect(page).toHaveURL('/login');
    });

    test('AUTH-081: Should clear auth state on logout', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Try to access protected route
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/login');
    });
  });

  // ===== LOGIN ACTIVITY TESTS =====

  test.describe('Login Activity', () => {
    test('AUTH-090: Should display login history', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.click('[data-testid="login-activity-tab"]');
      await expect(page.locator('[data-testid="login-activity-list"]')).toBeVisible();
    });

    test('AUTH-091: Should show failed login attempts', async ({ page }) => {
      await loginAsUser(page, 'testuser');
      await page.goto('/dashboard/settings/security');

      await page.click('[data-testid="login-activity-tab"]');
      await expect(page.locator('[data-testid="failed-attempt"]')).toBeVisible();
    });
  });
});
```

### 5.3 Test Data Requirements

```typescript
// apps/web/e2e/fixtures/test-data.ts - Auth section

export const AUTH_TEST_USERS = {
  // Regular user without 2FA
  regular: {
    email: 'e2e-regular@pingtome.test',
    password: 'TestPassword123!',
    name: 'Regular Test User',
  },

  // User with 2FA enabled
  with2FA: {
    email: 'e2e-2fa@pingtome.test',
    password: 'TestPassword123!',
    name: '2FA Test User',
    totpSecret: 'TESTSECRETBASE32', // For generating valid TOTP codes in tests
  },

  // Unverified email user
  unverified: {
    email: 'e2e-unverified@pingtome.test',
    password: 'TestPassword123!',
    name: 'Unverified User',
  },

  // Locked account (for brute force tests)
  locked: {
    email: 'e2e-locked@pingtome.test',
    password: 'TestPassword123!',
    failedAttempts: 5,
  },

  // OAuth user (no password)
  oauth: {
    email: 'e2e-oauth@pingtome.test',
    provider: 'google',
    providerAccountId: 'google-123',
  },
};

export const AUTH_TEST_TOKENS = {
  validVerification: 'valid-verification-token',
  expiredVerification: 'expired-verification-token',
  validPasswordReset: 'valid-reset-token',
  expiredPasswordReset: 'expired-reset-token',
};

export const BACKUP_CODES = [
  'ABCD-1234-EFGH',
  'IJKL-5678-MNOP',
  'QRST-9012-UVWX',
  // ... 7 more
];
```

---

## 6. Implementation Roadmap

### Phase 1: Critical Fixes (Day 1-2)
1. ✅ Register TwoFactorController in auth.module.ts
2. ✅ Create all auth DTOs with validation
3. ✅ Implement 2FA login challenge flow
4. ✅ Write unit tests for new code

### Phase 2: High Priority Security (Day 3-5)
1. ✅ Session management endpoints + UI
2. ✅ Backup codes implementation
3. ✅ Change password endpoint
4. ✅ Brute force protection
5. ✅ E2E tests for new features

### Phase 3: Medium Priority (Day 6-8)
1. ✅ Email verification enforcement
2. ✅ Resend verification endpoint
3. ✅ Login activity dashboard
4. ✅ Token rotation
5. ✅ OAuth account linking

### Phase 4: Polish & Documentation (Day 9-10)
1. ✅ Update API documentation
2. ✅ Add Swagger decorators
3. ✅ Security testing & penetration testing
4. ✅ Performance optimization
5. ✅ Documentation updates

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auth Module Test Coverage | > 90% | Jest coverage report |
| E2E Auth Test Pass Rate | 100% | Playwright results |
| 2FA Adoption Rate | > 20% of users | Analytics |
| Failed Login Detection | < 1 min | Monitoring |
| Account Lockout Effectiveness | 0 brute force success | Security logs |
| Password Reset Success Rate | > 95% | Analytics |
| Average Login Time | < 3 seconds | Performance metrics |

---

## 8. Dependencies & Risks

### Dependencies
- Mail service must be configured for email verification
- Redis/session store for session management (recommended)
- IP geolocation service for login activity (optional)

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| 2FA Controller not working | High | Immediate fix required |
| Brute force attacks | High | Implement lockout ASAP |
| Token leakage | High | Rotate tokens, secure storage |
| OAuth provider downtime | Medium | Fallback to email/password |
| Email delivery issues | Medium | Multiple email providers |

---

## 9. References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [FIDO2/WebAuthn Specification](https://webauthn.guide/)
- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Bitly Security Features](https://bitly.com/pages/security)
- [Rebrandly Enterprise Security](https://www.rebrandly.com/enterprise-security)

---

*Document Version: 1.0*
*Last Updated: 2025-12-08*
*Author: AI System Analyst*
