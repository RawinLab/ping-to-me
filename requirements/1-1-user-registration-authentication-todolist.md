# Module 1.1: User Registration & Authentication - Development Todolist

> **Status**: ~95% Complete (Phase 1 & 2 Done)
> **Priority**: Medium - Only Phase 3 & 4 remaining
> **Reference**: `requirements/1-1-user-registration-authentication-plan.md`

---

## Phase 1: Critical Fixes (MUST FIX BEFORE PRODUCTION)

### Task 1.1.1: Register TwoFactorController ✅
- [x] **Add TwoFactorController to auth.module.ts**
  - File: `apps/api/src/auth/auth.module.ts`
  - Action: Add `TwoFactorController` to the `controllers` array
  - Effort: 5 minutes
  - Test: Verify 2FA endpoints respond (GET `/auth/2fa/status`)

### Task 1.1.2: Create Auth DTOs with Validation ✅
- [x] **Create RegisterDto**
  - File: `apps/api/src/auth/dto/register.dto.ts`
  - Fields: `email` (IsEmail, Transform lowercase), `password` (MinLength 8, regex for complexity), `name` (optional, MaxLength 100)

- [x] **Create LoginDto**
  - File: `apps/api/src/auth/dto/login.dto.ts`
  - Fields: `email` (IsEmail, Transform lowercase), `password` (IsString)

- [x] **Create Login2faDto**
  - File: `apps/api/src/auth/dto/login-2fa.dto.ts`
  - Fields: `code` (Length 6), `sessionToken` (IsString)

- [x] **Create ChangePasswordDto**
  - File: `apps/api/src/auth/dto/change-password.dto.ts`
  - Fields: `currentPassword`, `newPassword` (with complexity validation)

- [x] **Create ForgotPasswordDto**
  - File: `apps/api/src/auth/dto/forgot-password.dto.ts`
  - Fields: `email` (IsEmail, Transform lowercase)

- [x] **Create ResetPasswordDto**
  - File: `apps/api/src/auth/dto/reset-password.dto.ts`
  - Fields: `token`, `password` (with complexity validation)

- [x] **Create VerifyEmailDto**
  - File: `apps/api/src/auth/dto/verify-email.dto.ts`
  - Fields: `token` (IsString)

- [x] **Apply DTOs to AuthController**
  - File: `apps/api/src/auth/auth.controller.ts`
  - Action: Add `@Body()` decorators with proper DTOs to all endpoints

### Task 1.1.3: Implement 2FA Login Challenge Flow ✅
- [x] **Modify login endpoint to detect 2FA**
  - File: `apps/api/src/auth/auth.service.ts`
  - Action: Return `{ requires2FA: true, sessionToken: '...' }` if user has 2FA enabled
  - Do NOT issue JWT tokens until 2FA verified

- [x] **Create POST /auth/login/2fa endpoint**
  - File: `apps/api/src/auth/auth.controller.ts`
  - Input: `Login2faDto` (code + sessionToken)
  - Action: Verify TOTP code, then issue JWT tokens
  - Store temporary session in cache/Redis with expiry

- [x] **Create /login/2fa frontend page**
  - File: `apps/web/app/(auth)/login/2fa/page.tsx`
  - UI: 6-digit code input with auto-focus
  - Include "Use backup code" option
  - Auto-submit when 6 digits entered

- [x] **Update login flow in AuthContext**
  - File: `apps/web/contexts/AuthContext.tsx`
  - Action: Handle `requires2FA` response, redirect to `/login/2fa`
  - Store sessionToken temporarily

---

## Phase 2: High Priority Security Features

### Task 1.1.4: Session Management Implementation ✅ (Already Implemented)
- [x] **Create SessionService**
  - File: `apps/api/src/auth/services/session.service.ts`
  - Methods: `getSessions(userId)`, `revokeSession(userId, sessionId)`, `revokeAllOtherSessions(userId, currentSessionId)`

- [x] **Add session endpoints to AuthController**
  - GET `/auth/sessions` - List active sessions with device info
  - DELETE `/auth/sessions/:id` - Revoke specific session
  - DELETE `/auth/sessions` - Revoke all other sessions

- [x] **Complete Security Settings UI for sessions**
  - File: `apps/web/app/dashboard/settings/security/page.tsx`
  - Display: Device name, IP, location, last active, "Current" badge
  - Actions: "Sign out" per session, "Sign out all other sessions"

### Task 1.1.5: Backup Codes Implementation ✅ (Already Implemented)
- [x] **Add backup codes generation**
  - File: `apps/api/src/auth/two-factor.service.ts`
  - Method: `generateBackupCodes(userId)` - Generate 10 codes, hash before storing

- [x] **Add backup codes endpoints**
  - POST `/auth/2fa/backup-codes` - Generate new backup codes
  - POST `/auth/2fa/backup-codes/verify` - Verify backup code during login
  - GET `/auth/2fa/backup-codes/remaining` - Get remaining count

- [x] **Update 2FA setup UI to show backup codes**
  - File: `apps/web/app/dashboard/settings/two-factor/page.tsx`
  - Show codes after successful 2FA setup
  - Add "Download as text file" button
  - Show remaining codes count

### Task 1.1.6: Change Password Endpoint ✅
- [x] **Implement change password endpoint**
  - File: `apps/api/src/auth/auth.controller.ts`
  - Endpoint: POST `/auth/change-password`
  - Validate current password before allowing change
  - Invalidate all other sessions after password change

- [x] **Connect Security Settings UI to endpoint**
  - File: `apps/web/app/dashboard/settings/security/page.tsx`
  - Action: Wire up existing form to new endpoint

### Task 1.1.7: Brute Force Protection ✅
- [x] **Create BruteForceService** (LoginSecurityService)
  - File: `apps/api/src/auth/services/brute-force.service.ts`
  - Use `LoginAttempt` model to track failed attempts
  - Lock after 5 failed attempts, 30 min cooldown

- [x] **Add account status endpoint**
  - Endpoint: GET `/auth/account-status?email=xxx`
  - Returns: `{ locked: boolean, remainingAttempts: number, unlockTime?: Date }`

- [x] **Integrate brute force check into login**
  - File: `apps/api/src/auth/auth.service.ts`
  - Check lockout before validating password
  - Record attempt (success/failure)

- [x] **Display lockout message in login UI**
  - File: `apps/web/app/(auth)/login/page.tsx`
  - Show countdown timer when locked

---

## Phase 3: Medium Priority Enhancements

### Task 1.1.8: Email Verification Enforcement
- [ ] **Create EmailVerifiedGuard**
  - File: `apps/api/src/auth/guards/email-verified.guard.ts`
  - Block access to sensitive endpoints if email not verified

- [ ] **Add resend verification endpoint**
  - Endpoint: POST `/auth/resend-verification`
  - Rate limit: 1 per 2 minutes

- [ ] **Apply guard to sensitive endpoints**
  - Link creation, team management, billing, etc.

- [ ] **Show verification banner in dashboard**
  - File: `apps/web/components/EmailVerificationBanner.tsx`
  - Show if user.emailVerified is false
  - Include "Resend email" button

### Task 1.1.9: Login Activity Dashboard
- [ ] **Create login activity endpoint**
  - Endpoint: GET `/auth/login-activity`
  - Return recent LoginAttempt records with parsed device info

- [ ] **Add Login Activity section to Security Settings**
  - File: `apps/web/app/dashboard/settings/security/page.tsx`
  - Show timeline: date, device, IP, location, success/failure
  - Highlight suspicious attempts (new location, failed)

### Task 1.1.10: Token Rotation
- [ ] **Implement refresh token rotation**
  - File: `apps/api/src/auth/auth.service.ts`
  - On each refresh, generate new refresh token
  - Invalidate old refresh token
  - Detect reuse (potential token theft)

### Task 1.1.11: OAuth Account Linking
- [ ] **Add OAuth link/unlink endpoints**
  - POST `/auth/oauth/link/:provider` - Link OAuth to existing account
  - DELETE `/auth/oauth/unlink/:provider` - Unlink OAuth
  - Handle email conflicts

- [ ] **Add Linked Accounts section to Profile Settings**
  - File: `apps/web/app/dashboard/settings/profile/page.tsx`
  - Show connected providers (Google, GitHub)
  - Connect/Disconnect buttons

---

## Phase 4: Future Enhancements (Research Required)

### Task 1.1.12: Passkey/WebAuthn Authentication
- [ ] Research and implement WebAuthn registration
- [ ] Add Passkey model to Prisma schema
- [ ] Create passkey management UI

### Task 1.1.13: Hardware Security Key Support
- [ ] Add FIDO2 hardware key support
- [ ] Add SecurityKey model to Prisma schema
- [ ] Create hardware key management UI

### Task 1.1.14: SSO (SAML 2.0)
- [ ] Research SAML 2.0 integration for Enterprise tier
- [ ] Implement SSO configuration per organization

### Task 1.1.15: Device Fingerprinting & Adaptive Auth
- [ ] Implement device fingerprinting
- [ ] Add TrustedDevice model
- [ ] Risk-based authentication logic

---

## Unit Tests Required

### Auth Service Tests
```
File: apps/api/src/auth/__tests__/auth.service.spec.ts
- [ ] register: create user, hash password, send verification email
- [ ] register: reject duplicate email
- [ ] login: return tokens for valid credentials
- [ ] login: return requires2FA flag if enabled
- [ ] login: lock account after 5 failed attempts
- [ ] refresh: issue new access token
- [ ] forgotPassword: send reset email, not reveal if email exists
- [ ] resetPassword: validate token, update password
- [ ] verifyEmail: validate token, mark verified
```

### Two-Factor Service Tests
```
File: apps/api/src/auth/__tests__/two-factor.service.spec.ts
- [ ] generateSecret: return QR code and manual key
- [ ] verifyAndEnable: enable with valid code
- [ ] verifyAndEnable: generate backup codes
- [ ] verify: accept valid TOTP code
- [ ] verify: accept valid backup code, invalidate it
- [ ] disable: require valid code to disable
```

### Session Service Tests
```
File: apps/api/src/auth/__tests__/session.service.spec.ts
- [ ] getSessions: return all active sessions
- [ ] revokeSession: revoke specific session
- [ ] revokeAllOtherSessions: keep current, revoke others
```

### Brute Force Service Tests
```
File: apps/api/src/auth/__tests__/brute-force.service.spec.ts
- [ ] recordAttempt: track attempts per email
- [ ] isLocked: return true after 5 failures
- [ ] isLocked: auto-unlock after 30 minutes
- [ ] reset: clear attempts on successful login
```

---

## E2E Tests Required

```
File: apps/web/e2e/auth.spec.ts
```

### Registration Tests
- [ ] AUTH-001: Register with valid data
- [ ] AUTH-002: Reject weak password
- [ ] AUTH-003: Reject duplicate email
- [ ] AUTH-004: Validate email format

### Login Tests
- [ ] AUTH-010: Login with valid credentials
- [ ] AUTH-011: Reject invalid password
- [ ] AUTH-012: Reject non-existent user
- [ ] AUTH-013: Lock account after 5 failed attempts

### 2FA Tests
- [ ] AUTH-020: Redirect to 2FA page when enabled
- [ ] AUTH-021: Complete login with valid 2FA code
- [ ] AUTH-022: Reject invalid 2FA code
- [ ] AUTH-023: Accept backup code
- [ ] AUTH-024: Setup 2FA successfully
- [ ] AUTH-025: Show backup codes after setup
- [ ] AUTH-026: Disable 2FA with valid code

### Password Reset Tests
- [ ] AUTH-030: Request password reset
- [ ] AUTH-031: Not reveal if email exists
- [ ] AUTH-032: Reset with valid token
- [ ] AUTH-033: Reject expired token

### Email Verification Tests
- [ ] AUTH-040: Verify with valid token
- [ ] AUTH-041: Reject expired token
- [ ] AUTH-042: Resend verification email

### Session Management Tests
- [ ] AUTH-050: Display active sessions
- [ ] AUTH-051: Show current session indicator
- [ ] AUTH-052: Revoke other session
- [ ] AUTH-053: Revoke all other sessions

### Change Password Tests
- [ ] AUTH-060: Change with valid current password
- [ ] AUTH-061: Reject wrong current password
- [ ] AUTH-062: Show password strength indicator

### OAuth Tests
- [ ] AUTH-070: Redirect to Google OAuth
- [ ] AUTH-071: Redirect to GitHub OAuth

### Logout Tests
- [ ] AUTH-080: Logout successfully
- [ ] AUTH-081: Clear auth state on logout

### Login Activity Tests
- [ ] AUTH-090: Display login history
- [ ] AUTH-091: Show failed login attempts

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] All 2FA endpoints respond correctly
- [ ] DTOs validate input on all auth endpoints
- [ ] 2FA login challenge flow works end-to-end
- [ ] Unit tests pass for new code

### Phase 2 Complete When:
- [ ] Sessions can be viewed and revoked
- [ ] Backup codes can be generated and used
- [ ] Password can be changed
- [ ] Account lockout works after 5 failed attempts
- [ ] E2E tests pass

### Phase 3 Complete When:
- [ ] Unverified users see verification banner
- [ ] Login activity is visible in settings
- [ ] Refresh tokens are rotated
- [ ] OAuth accounts can be linked/unlinked

---

## Dependencies

- Mail service configured for email verification
- Redis/cache for temporary session tokens (2FA flow)
- IP geolocation service (optional, for login activity)

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/auth/dto/register.dto.ts` | Registration validation |
| `apps/api/src/auth/dto/login.dto.ts` | Login validation |
| `apps/api/src/auth/dto/login-2fa.dto.ts` | 2FA login validation |
| `apps/api/src/auth/dto/change-password.dto.ts` | Password change validation |
| `apps/api/src/auth/dto/forgot-password.dto.ts` | Forgot password validation |
| `apps/api/src/auth/dto/reset-password.dto.ts` | Reset password validation |
| `apps/api/src/auth/dto/verify-email.dto.ts` | Email verification validation |
| `apps/api/src/auth/services/session.service.ts` | Session management |
| `apps/api/src/auth/services/brute-force.service.ts` | Login attempt tracking |
| `apps/api/src/auth/guards/email-verified.guard.ts` | Email verification guard |
| `apps/web/app/(auth)/login/2fa/page.tsx` | 2FA verification page |
| `apps/web/components/EmailVerificationBanner.tsx` | Verification reminder |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/auth/auth.module.ts` | Register TwoFactorController |
| `apps/api/src/auth/auth.controller.ts` | Add new endpoints, apply DTOs |
| `apps/api/src/auth/auth.service.ts` | 2FA flow, token rotation, brute force |
| `apps/api/src/auth/two-factor.service.ts` | Backup codes |
| `apps/web/contexts/AuthContext.tsx` | Handle 2FA redirect |
| `apps/web/app/dashboard/settings/security/page.tsx` | Sessions, login activity |
| `apps/web/app/dashboard/settings/two-factor/page.tsx` | Backup codes UI |
| `apps/web/app/dashboard/settings/profile/page.tsx` | OAuth linking |

---

*Generated from: 1-1-user-registration-authentication-plan.md*
*Last Updated: 2025-12-08*
