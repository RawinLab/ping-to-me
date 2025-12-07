# Module 2.5: Security Options - Development Todolist

## Document Information

- **Module**: 2.5 Security Options
- **Source**: `2-5-security-options-plan.md`
- **Generated**: 2025-12-07
- **For**: Claude Code Subagent Development
- **Current Implementation**: ~50% Complete

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
npx playwright test apps/web/e2e/security-options.spec.ts
```

### Key Files

- `packages/database/prisma/schema.prisma`
- `apps/api/src/auth/two-factor.service.ts`
- `apps/api/src/auth/two-factor.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/web/app/dashboard/settings/two-factor/page.tsx`
- `apps/web/app/dashboard/settings/security/page.tsx`

---

## Phase 1: Database Schema Updates (Week 1)

### TASK-2.5.1: Create BackupCode Model

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Create `BackupCode` model with fields:
  - `id` (UUID, primary key)
  - `userId` (UUID, foreign key to User)
  - `code` (String, hashed)
  - `usedAt` (DateTime, optional)
  - `createdAt` (DateTime, default now)
- [ ] Add relation to User model
- [ ] Add index on `userId`

**Acceptance Criteria**:

- Model created successfully
- Relation to User works

---

### TASK-2.5.2: Create Session Model

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Create `Session` model with fields:
  - `id` (UUID, primary key)
  - `userId` (UUID, foreign key to User)
  - `token` (String, unique, hashed refresh token)
  - `deviceInfo` (String, optional, parsed user agent)
  - `ipAddress` (String, optional)
  - `location` (String, optional, geo-resolved)
  - `lastActive` (DateTime, default now)
  - `expiresAt` (DateTime)
  - `createdAt` (DateTime, default now)
- [ ] Add relation to User model
- [ ] Add indexes on `userId`, `expiresAt`

**Acceptance Criteria**:

- Model supports multiple sessions per user
- Sessions can be queried efficiently

---

### TASK-2.5.3: Create LoginAttempt Model

**Priority**: HIGH | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Create `LoginAttempt` model with fields:
  - `id` (UUID, primary key)
  - `email` (String)
  - `success` (Boolean)
  - `ipAddress` (String, optional)
  - `userAgent` (String, optional)
  - `location` (String, optional)
  - `reason` (String, optional - 'invalid_password', 'user_not_found', '2fa_failed')
  - `createdAt` (DateTime, default now)
- [ ] Add indexes on `[email, createdAt]`, `[ipAddress, createdAt]`

**Acceptance Criteria**:

- Login attempts can be tracked
- Can query by email or IP efficiently

---

### TASK-2.5.4: Create OrganizationSecuritySettings Model

**Priority**: MEDIUM | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [ ] Create `OrganizationSecuritySettings` model with fields:
  - `id` (UUID, primary key)
  - `organizationId` (UUID, unique, foreign key)
  - `enforce2FA` (Boolean, default false)
  - `enforce2FAForRoles` (String[], roles that require 2FA)
  - `sessionTimeoutMinutes` (Int, default 480 = 8 hours)
  - `ipAllowlist` (String[], CIDR notation)
  - `maxLoginAttempts` (Int, default 5)
  - `lockoutDuration` (Int, default 30 minutes)
- [ ] Add relation to Organization model
- [ ] Create default settings when organization created

**Acceptance Criteria**:

- Settings created per organization
- Defaults are sensible

---

## Phase 1: Enhanced 2FA (Week 1-2)

### TASK-2.5.5: Implement Backup Codes Generation

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/two-factor.service.ts`

**Subtasks**:

- [ ] Implement `generateBackupCodes(userId)` method
- [ ] Generate 8 unique codes using crypto.randomBytes
- [ ] Format codes as XXXX-XXXX (8 chars with dash)
- [ ] Hash codes before storing in database
- [ ] Delete any existing backup codes for user
- [ ] Return plain codes (shown only once)
- [ ] Mark 2FA setup as complete

**Acceptance Criteria**:

- 8 unique codes generated
- Codes are hashed in database
- Plain codes returned only on generation

---

### TASK-2.5.6: Implement Backup Code Verification

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/auth/two-factor.service.ts`

**Subtasks**:

- [ ] Implement `verifyBackupCode(userId, code)` method
- [ ] Normalize input (remove dashes, uppercase)
- [ ] Compare against hashed codes
- [ ] Mark code as used (set `usedAt`) on success
- [ ] Return false for already-used codes
- [ ] Log backup code usage

**Acceptance Criteria**:

- Valid codes authenticate user
- Codes are single-use
- Used codes rejected

---

### TASK-2.5.7: Add Backup Code Verification to Login Flow

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/auth/auth.service.ts`

**Subtasks**:

- [ ] Update `verifyTwoFactor()` to accept backup codes
- [ ] Check if input looks like backup code (XXXX-XXXX format)
- [ ] If backup code format, call `verifyBackupCode()`
- [ ] If TOTP format, call existing TOTP verification
- [ ] Return same result regardless of method used

**Acceptance Criteria**:

- Users can login with TOTP or backup code
- Seamless fallback to backup codes

---

### TASK-2.5.8: Create Backup Code Endpoints

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/auth/two-factor.controller.ts`

**Subtasks**:

- [ ] Add `POST /auth/2fa/backup-codes` - Generate new backup codes
  - Require 2FA to be enabled
  - Require current password confirmation
  - Return new codes
- [ ] Add `POST /auth/2fa/verify-backup` - Verify with backup code (login flow)
- [ ] Add `GET /auth/2fa/backup-codes/remaining` - Get count of unused codes

**Acceptance Criteria**:

- Endpoints work correctly
- Password confirmation required for regeneration
- Remaining count returned

---

### TASK-2.5.9: Implement Organization 2FA Enforcement

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Subtasks**:

- [ ] Create `getSecuritySettings(orgId)` method
- [ ] Create `updateSecuritySettings(orgId, settings)` method
- [ ] Implement `is2FARequired(orgId, userId)` check
- [ ] Check if user's role is in `enforce2FAForRoles`
- [ ] Add middleware to check 2FA requirement on org access
- [ ] Block users without 2FA from org if enforced

**Acceptance Criteria**:

- Org admins can enforce 2FA
- Users without 2FA blocked when required
- Role-based enforcement works

---

### TASK-2.5.10: Create 2FA Enforcement Endpoint

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/organizations/organization.controller.ts`

**Subtasks**:

- [ ] Add `PATCH /organizations/:id/security/2fa` endpoint
- [ ] Accept `enforce2FA` (boolean) and `enforce2FAForRoles` (string[])
- [ ] Only OWNER can change this setting
- [ ] Update OrganizationSecuritySettings

**Acceptance Criteria**:

- Only OWNER can modify
- Settings saved correctly

---

## Phase 2: Session Management (Week 2-3)

### TASK-2.5.11: Implement Session Tracking

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/auth/session.service.ts` (new)

**Subtasks**:

- [ ] Create `SessionService` class
- [ ] Implement `createSession(userId, refreshToken, request)` method
  - Extract IP address, user agent
  - Parse user agent for device info
  - Optionally geo-resolve IP to location
  - Hash refresh token for storage
  - Create Session record
- [ ] Implement `updateSessionActivity(sessionId)` method
- [ ] Implement `invalidateSession(sessionId)` method
- [ ] Implement `invalidateAllSessions(userId, exceptSessionId?)` method

**Acceptance Criteria**:

- Sessions created on login
- Activity tracked on API calls
- Sessions can be invalidated

---

### TASK-2.5.12: Integrate Session Tracking with Auth

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/auth/auth.service.ts`

**Subtasks**:

- [ ] Update `login()` to create session record
- [ ] Update `refreshToken()` to update session activity
- [ ] Update `logout()` to invalidate session
- [ ] Associate refresh tokens with session records
- [ ] Clean up expired sessions periodically

**Acceptance Criteria**:

- Login creates session
- Logout invalidates session
- Refresh updates activity

---

### TASK-2.5.13: Create Active Sessions Endpoints

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/profile/profile.controller.ts` or new sessions controller

**Subtasks**:

- [ ] Add `GET /profile/sessions` - List active sessions
  - Return device info, IP, location, last active, is current
  - Mark current session
- [ ] Add `DELETE /profile/sessions/:id` - Logout specific session
  - Cannot delete current session here
- [ ] Add `DELETE /profile/sessions` - Logout all other sessions
  - Keep only current session

**Acceptance Criteria**:

- Users can view their sessions
- Can logout other sessions
- Current session protected

---

### TASK-2.5.14: Implement Session Timeout

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/auth/session.service.ts`

**Subtasks**:

- [ ] Check session timeout on each request
- [ ] Use org's `sessionTimeoutMinutes` setting
- [ ] Compare `lastActive` + timeout with current time
- [ ] Invalidate timed-out sessions
- [ ] Return 401 for timed-out sessions

**Acceptance Criteria**:

- Sessions expire after timeout
- Timeout configurable per org
- Clear error for expired sessions

---

### TASK-2.5.15: Create Session Timeout Endpoint

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/organizations/organization.controller.ts`

**Subtasks**:

- [ ] Add `PATCH /organizations/:id/security/session-timeout` endpoint
- [ ] Accept `sessionTimeoutMinutes` (min 30, max 10080 = 7 days)
- [ ] Only OWNER/ADMIN can change
- [ ] Update OrganizationSecuritySettings

**Acceptance Criteria**:

- Timeout configurable within limits
- Validation prevents extreme values

---

## Phase 2: API Key Security Enhancement (Week 2-3)

### TASK-2.5.16: Implement API Key Rotation

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/developer/developer.service.ts`

**Subtasks**:

- [ ] Implement `rotateApiKey(userId, keyId)` method
- [ ] Generate new key value
- [ ] Keep same key ID and metadata
- [ ] Update `keyHash` and optionally `keyPrefix`
- [ ] Return new key (shown only once)
- [ ] Log rotation in audit log

**Acceptance Criteria**:

- Key rotated successfully
- Old key immediately invalid
- New key returned once

---

### TASK-2.5.17: Implement API Key Expiration

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/developer/developer.service.ts`

**Subtasks**:

- [ ] Add expiration check to API key validation
- [ ] Update `validateApiKey()` to check `expiresAt`
- [ ] Implement `setExpiration(keyId, expiresAt)` method
- [ ] Add `PATCH /developer/api-keys/:id/expiry` endpoint
- [ ] Send notification before key expiry (7 days)

**Acceptance Criteria**:

- Expired keys rejected
- Expiration can be set/updated
- Notification sent before expiry

---

### TASK-2.5.18: Create API Key Rotation Endpoint

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/developer/developer.controller.ts`

**Subtasks**:

- [ ] Add `POST /developer/api-keys/:id/rotate` endpoint
- [ ] Require password confirmation
- [ ] Return new key value
- [ ] Update last rotation timestamp

**Acceptance Criteria**:

- Endpoint works with password confirmation
- New key returned securely

---

## Phase 3: Login Activity & Security (Week 3-4)

### TASK-2.5.19: Implement Login Attempt Logging

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/auth.service.ts`

**Subtasks**:

- [ ] Create `logLoginAttempt(email, success, request, reason?)` method
- [ ] Extract IP address and user agent from request
- [ ] Optionally geo-resolve IP to location
- [ ] Create LoginAttempt record
- [ ] Log both successful and failed attempts
- [ ] Include failure reason for failed attempts

**Acceptance Criteria**:

- All login attempts logged
- Failure reasons captured
- IP and device info stored

---

### TASK-2.5.20: Implement Account Lockout

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/auth.service.ts`

**Subtasks**:

- [ ] Create `checkAccountLocked(email)` method
- [ ] Count failed attempts in last `lockoutDuration` minutes
- [ ] If count >= `maxLoginAttempts`, account is locked
- [ ] Return lockout status with remaining time
- [ ] Add lockout check to login flow
- [ ] Return informative error when locked

**Acceptance Criteria**:

- Account locked after max attempts
- Lockout expires after duration
- Clear error message shown

---

### TASK-2.5.21: Create Login Activity Endpoints

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1-2 hours
**File**: `apps/api/src/security/security.controller.ts` (new)

**Subtasks**:

- [ ] Create SecurityController
- [ ] Add `GET /security/login-activity` - View recent login history
  - Paginated list of LoginAttempts for current user
  - Show success/failure, IP, device, location, time
- [ ] Add `GET /security/failed-attempts` - View failed attempts
  - Filter by current user's email

**Acceptance Criteria**:

- Users can view their login history
- Failed attempts visible

---

### TASK-2.5.22: Implement IP Allowlist (Enterprise)

**Priority**: LOW | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/auth/guards/ip-allowlist.guard.ts` (new)

**Subtasks**:

- [ ] Create `IpAllowlistGuard` that checks request IP
- [ ] Parse CIDR notation from org settings
- [ ] Block requests from non-allowed IPs
- [ ] Skip check if allowlist is empty
- [ ] Add endpoint to manage allowlist
- [ ] Support temporary override for emergencies

**Acceptance Criteria**:

- IPs checked against allowlist
- CIDR ranges supported
- Empty list = allow all

---

## Phase 4: Frontend Development (Week 3-4)

### TASK-2.5.23: Create Backup Codes UI

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/settings/two-factor/page.tsx`

**Subtasks**:

- [ ] Add "Generate Backup Codes" button (visible when 2FA enabled)
- [ ] Show password confirmation dialog before generation
- [ ] Display generated codes in copyable format
- [ ] Show warning: "Store these securely, shown only once"
- [ ] Add "Download" and "Copy" buttons
- [ ] Show remaining backup codes count
- [ ] Add "Regenerate" option (invalidates old codes)

**Acceptance Criteria**:

- Codes can be generated and displayed
- Clear security warnings shown
- Easy to copy/download

---

### TASK-2.5.24: Create Active Sessions Page

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/settings/security/sessions/page.tsx` (new)

**Subtasks**:

- [ ] Create sessions list page
- [ ] Display for each session:
  - Device type icon (desktop, mobile, tablet)
  - Browser and OS
  - IP address (partially masked)
  - Location (city, country)
  - Last active time
  - "Current session" badge
- [ ] Add "Sign out" button for each non-current session
- [ ] Add "Sign out all other devices" button
- [ ] Confirm dialog before sign out

**Acceptance Criteria**:

- Sessions displayed clearly
- Current session identified
- Sign out works correctly

---

### TASK-2.5.25: Create Login Activity Page

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/app/dashboard/settings/security/activity/page.tsx` (new)

**Subtasks**:

- [ ] Create login activity list page
- [ ] Display for each attempt:
  - Success/failure status with icon
  - Date and time
  - IP address
  - Device info
  - Location
  - Failure reason (if failed)
- [ ] Add filtering by success/failure
- [ ] Add date range filter
- [ ] Highlight suspicious activity (new location, multiple failures)

**Acceptance Criteria**:

- Activity displayed chronologically
- Filters work correctly
- Suspicious items highlighted

---

### TASK-2.5.26: Create Organization Security Settings Page

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/app/dashboard/settings/organization/security/page.tsx` (new)

**Subtasks**:

- [ ] Create org security settings page
- [ ] 2FA Enforcement section:
  - Toggle for enforce 2FA
  - Checkbox list for roles requiring 2FA
- [ ] Session Timeout section:
  - Input for timeout minutes
  - Preset options (1h, 4h, 8h, 24h, 7d)
- [ ] Login Security section:
  - Max attempts input
  - Lockout duration input
- [ ] IP Allowlist section (Enterprise):
  - List of allowed IPs/CIDRs
  - Add/remove functionality
- [ ] Save button with confirmation

**Acceptance Criteria**:

- All settings editable
- Only OWNER can access
- Changes saved correctly

---

### TASK-2.5.27: Enhance API Keys Page with Security Features

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/app/dashboard/developer/page.tsx`

**Subtasks**:

- [ ] Add "Rotate" button for each key
- [ ] Show expiration date for each key
- [ ] Add expiration warning badge (expires soon)
- [ ] Add "Set Expiration" action
- [ ] Show last used timestamp
- [ ] Show rotation history/date

**Acceptance Criteria**:

- Rotation works with confirmation
- Expiration visible and settable
- Last used displayed

---

### TASK-2.5.28: Add 2FA Enforcement Banner

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 1-2 hours
**File**: `apps/web/components/TwoFactorEnforcementBanner.tsx` (new)

**Subtasks**:

- [ ] Create banner component
- [ ] Show when user's org requires 2FA but user hasn't enabled
- [ ] Display message: "Your organization requires 2FA"
- [ ] Include "Set up now" button linking to 2FA settings
- [ ] Optionally block access until 2FA enabled

**Acceptance Criteria**:

- Banner shows for users needing 2FA
- Links to setup page
- Can be enforced (block access)

---

## Phase 4: Testing (Week 4)

### TASK-2.5.29: Write 2FA Unit Tests

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/two-factor.service.spec.ts`

**Test Cases**:

- [ ] Generate 8 unique backup codes
- [ ] Backup codes are properly hashed
- [ ] Valid backup code authenticates
- [ ] Used backup code rejected
- [ ] Invalid backup code rejected
- [ ] Regeneration invalidates old codes

**Acceptance Criteria**:

- All tests pass
- Edge cases covered

---

### TASK-2.5.30: Write Session Service Unit Tests

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/api/src/auth/session.service.spec.ts`

**Test Cases**:

- [ ] Session created on login
- [ ] Session updated on activity
- [ ] Session invalidated on logout
- [ ] All sessions invalidated except current
- [ ] Expired sessions rejected
- [ ] Session timeout works

**Acceptance Criteria**:

- All tests pass
- Session lifecycle tested

---

### TASK-2.5.31: Write Login Security Unit Tests

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/auth/auth.service.spec.ts`

**Test Cases**:

- [ ] Failed login logged
- [ ] Successful login logged
- [ ] Account locked after max attempts
- [ ] Account unlocked after lockout duration
- [ ] Lockout check works correctly

**Acceptance Criteria**:

- All tests pass
- Lockout logic verified

---

### TASK-2.5.32: Write E2E Tests - 2FA

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2-3 hours
**File**: `apps/web/e2e/security-options.spec.ts`

**Test Cases**:

- [ ] SEC-001: Setup 2FA with TOTP
- [ ] SEC-002: Disable 2FA
- [ ] SEC-003: Generate backup codes
- [ ] SEC-004: Login with backup code
- [ ] SEC-005: Org-wide 2FA enforcement
- [ ] SEC-006: User without 2FA blocked when enforced

**Acceptance Criteria**:

- All 2FA tests pass

---

### TASK-2.5.33: Write E2E Tests - Sessions

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/security-options.spec.ts`

**Test Cases**:

- [ ] SEC-010: View active sessions
- [ ] SEC-011: Logout specific session
- [ ] SEC-012: Logout all other sessions
- [ ] SEC-013: Session timeout enforcement

**Acceptance Criteria**:

- All session tests pass

---

### TASK-2.5.34: Write E2E Tests - API Keys

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/security-options.spec.ts`

**Test Cases**:

- [ ] SEC-020: Rotate API key
- [ ] SEC-021: Set API key expiration
- [ ] SEC-022: Expired API key rejected
- [ ] SEC-023: API key scope enforcement

**Acceptance Criteria**:

- All API key tests pass

---

### TASK-2.5.35: Write E2E Tests - Login Activity

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/security-options.spec.ts`

**Test Cases**:

- [ ] SEC-040: View login history
- [ ] SEC-041: Account lockout after 5 failed attempts
- [ ] SEC-042: Lockout cooldown (30 min)

**Acceptance Criteria**:

- All login activity tests pass

---

## Summary

| Phase              | Task Count   | Priority Breakdown           |
| ------------------ | ------------ | ---------------------------- |
| Database Schema    | 4 tasks      | 3 HIGH, 1 MEDIUM             |
| Enhanced 2FA       | 6 tasks      | 6 HIGH                       |
| Session Management | 5 tasks      | 4 HIGH, 1 MEDIUM             |
| API Key Security   | 3 tasks      | 3 HIGH                       |
| Login Activity     | 4 tasks      | 2 HIGH, 1 MEDIUM, 1 LOW      |
| Frontend           | 6 tasks      | 3 HIGH, 3 MEDIUM             |
| Testing            | 7 tasks      | 4 HIGH, 3 MEDIUM             |
| **Total**          | **35 tasks** | **25 HIGH, 8 MEDIUM, 2 LOW** |

### Estimated Total Time: 60-75 hours

### Critical Path (Must complete first):

1. TASK-2.5.1-3: Database models
2. TASK-2.5.5-7: Backup codes
3. TASK-2.5.11-12: Session tracking
4. TASK-2.5.19-20: Login security

### Dependencies Graph:

```
TASK-2.5.1 (BackupCode Model)
    └── TASK-2.5.5 (Generate Codes)
        └── TASK-2.5.6 (Verify Codes)
            └── TASK-2.5.7 (Login Flow)
                └── TASK-2.5.8 (Endpoints)

TASK-2.5.2 (Session Model)
    └── TASK-2.5.11 (Session Service)
        └── TASK-2.5.12 (Auth Integration)
            └── TASK-2.5.13 (Endpoints)
                └── TASK-2.5.24 (UI)

TASK-2.5.3 (LoginAttempt Model)
    └── TASK-2.5.19 (Logging)
        └── TASK-2.5.20 (Lockout)
            └── TASK-2.5.21 (Endpoints)
                └── TASK-2.5.25 (UI)

TASK-2.5.4 (OrgSecuritySettings Model)
    └── TASK-2.5.9 (2FA Enforcement)
        └── TASK-2.5.10 (Endpoint)
            └── TASK-2.5.26 (UI)
```

### Security Checklist:

- [ ] Backup codes hashed before storage
- [ ] Sessions tied to hashed refresh tokens
- [ ] IP addresses logged but not exposed fully
- [ ] Account lockout prevents brute force
- [ ] 2FA enforcement cannot be bypassed
- [ ] API keys can be rotated instantly
- [ ] Session invalidation is immediate
