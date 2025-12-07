# Module 2.2: Member Invite/Remove - Development Todolist

## Document Information

- **Module**: 2.2 Member Invite/Remove
- **Source**: `2-2-member-invite-remove-plan.md`
- **Generated**: 2025-12-07
- **Current Progress**: ~95% (Implementation and testing complete)
- **For**: Claude Code Subagent Development
- **Dependencies**: Module 2.1 (Organization/Workspace)

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
npx playwright test apps/web/e2e/member-invite-remove.spec.ts
```

### Key Files

- `packages/database/prisma/schema.prisma`
- `apps/api/src/invitations/` (new module)
- `apps/api/src/organizations/organization.service.ts`
- `apps/api/src/mail/mail.service.ts`
- `apps/web/app/invitations/[token]/page.tsx` (new)
- `apps/web/components/invitation/` (new directory)

---

## Phase 1: Database & Schema (Week 1)

### TASK-2.2.1: Create OrganizationInvitation Model ✅

**Priority**: HIGH | **Type**: Database | **Estimated**: 2-3 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Add `OrganizationInvitation` model with fields:
  - `id` (UUID, primary key)
  - `organizationId` (UUID, foreign key)
  - `email` (String)
  - `role` (MemberRole enum, default VIEWER)
  - `token` (String, unique)
  - `tokenHash` (String, for secure storage)
  - `invitedById` (UUID, foreign key to User)
  - `personalMessage` (String, optional)
  - `expiresAt` (DateTime)
  - `acceptedAt` (DateTime, optional)
  - `declinedAt` (DateTime, optional)
  - `createdAt` (DateTime, default now)
- [x] Add relations to Organization and User
- [x] Add unique constraint on `[organizationId, email]`
- [x] Add indexes on `token`, `tokenHash`, `expiresAt`, `email`

**Acceptance Criteria**:

- [x] Schema validates without errors
- [x] Migration runs successfully
- [x] Prisma client generates correctly

---

### TASK-2.2.2: Update OrganizationMember Model ✅

**Priority**: MEDIUM | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Add `joinedAt` field (DateTime, default now)
- [x] Add `lastActiveAt` field (DateTime, optional)
- [x] Add `invitedById` field (UUID, optional, foreign key to User)
- [x] Add relation to User model for invitedBy

**Acceptance Criteria**:

- [x] Existing members not affected
- [x] New fields are optional/have defaults
- [x] Migration runs without data loss

---

### TASK-2.2.3: Update User Model for Invitation Relation ✅

**Priority**: MEDIUM | **Type**: Database | **Estimated**: 30 minutes
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Add `sentInvitations` relation (OrganizationInvitation[])
- [x] Add `invitedMembers` relation (OrganizationMember[])

**Acceptance Criteria**:

- [x] Relations work bidirectionally
- [x] No breaking changes to existing queries

---

## Phase 1: Backend API Development (Week 1-2)

### TASK-2.2.4: Create Invitation Module Structure ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 1 hour
**Directory**: `apps/api/src/invitations/`

**Subtasks**:

- [x] Create `invitations.module.ts`
- [x] Create `invitations.service.ts`
- [x] Create `invitations.controller.ts`
- [x] Create `dto/create-invitation.dto.ts`
- [x] Create `dto/accept-invitation.dto.ts`
- [x] Create `dto/bulk-invitation.dto.ts`
- [x] Register module in `app.module.ts`

**Acceptance Criteria**:

- [x] Module structure follows NestJS conventions
- [x] Module registers without errors

---

### TASK-2.2.5: Implement Token Generation Utilities ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `generateSecureToken()` using `crypto.randomBytes(32)`
- [x] Implement `hashToken()` for database storage
- [x] Implement `validateToken()` with timing-safe comparison
- [x] Implement `generateExpirationDate()` (7 days from now)
- [x] Add rate limiting for token validation (5 attempts/minute/IP)

**Acceptance Criteria**:

- [x] Tokens are cryptographically secure (32+ bytes)
- [x] Plain tokens never stored in database
- [x] Validation resistant to timing attacks

---

### TASK-2.2.6: Implement Create Invitation Logic ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `createInvitation(orgId, dto, userId)` method
- [x] Check if email already has pending invitation
- [x] Check if user is already a member
- [x] Validate inviter has permission (OWNER or ADMIN)
- [x] Validate role assignment (can't assign higher than own role)
- [x] Generate secure token and hash
- [x] Create database record
- [x] Trigger email sending

**Acceptance Criteria**:

- [x] Proper validation messages
- [x] Token generated and stored securely
- [x] Email sent on success
- [x] Audit log created

---

### TASK-2.2.7: Implement Accept Invitation Logic ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `acceptInvitation(token, userData?)` method
- [x] Validate token exists and is not expired
- [x] Validate invitation not already accepted/declined
- [x] If user exists: add to organization
- [x] If new user: create account first, then add to organization
- [x] Mark invitation as accepted
- [x] Return organization details and auth tokens for new users

**Acceptance Criteria**:

- [x] Existing users can accept with just token
- [x] New users can register during acceptance
- [x] Proper error messages for invalid/expired tokens
- [x] Member added with correct role

---

### TASK-2.2.8: Implement Decline Invitation Logic ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `declineInvitation(token)` method
- [x] Validate token exists and is not expired
- [x] Mark invitation as declined
- [x] Don't require authentication

**Acceptance Criteria**:

- [x] Invitation marked as declined
- [x] Cannot decline already accepted invitation

---

### TASK-2.2.9: Implement Invitation Management Methods ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `listInvitations(orgId, filters)` with pagination
- [x] Implement `getInvitationByToken(token)` for public view
- [x] Implement `resendInvitation(orgId, invitationId, userId)`
  - Generate new token
  - Reset expiration
  - Send new email
- [x] Implement `cancelInvitation(orgId, invitationId, userId)`
- [x] Implement `getInvitationHistory(orgId)` for accepted/declined

**Acceptance Criteria**:

- [x] List shows pending invitations with proper filtering
- [x] Resend generates new token with fresh expiry
- [x] Cancel removes pending invitation

---

### TASK-2.2.10: Create Invitation Controller Endpoints ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.controller.ts`

**Subtasks**:

- [x] `POST /organizations/:id/invitations` - Create invitation (auth required)
- [x] `GET /organizations/:id/invitations` - List invitations (auth required)
- [x] `POST /organizations/:id/invitations/:invitationId/resend` - Resend (auth required)
- [x] `DELETE /organizations/:id/invitations/:invitationId` - Cancel (auth required)
- [x] `GET /invitations/:token` - Get details (public)
- [x] `POST /invitations/:token/accept` - Accept (public)
- [x] `POST /invitations/:token/decline` - Decline (public)

**Acceptance Criteria**:

- [x] Protected endpoints require auth guard
- [x] Public endpoints work without authentication
- [x] Proper DTO validation on all endpoints
- [x] Swagger documentation

---

### TASK-2.2.11: Enhance Member Removal Service ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Subtasks**:

- [x] Implement `getMemberAssets(orgId, userId)` - count links, campaigns, tags
- [x] Implement `transferMemberAssets(orgId, fromUserId, toUserId)`
- [x] Enhance `removeMember()` to:
  - Accept optional `transferAssetsTo` parameter
  - Prevent removing OWNER
  - Prevent ADMIN from removing other ADMINs
  - Create audit log entry
  - Send notification email to removed member

**Acceptance Criteria**:

- [x] Asset counts returned correctly
- [x] Assets can be transferred before removal
- [x] OWNER protected from removal
- [x] Audit log created

---

### TASK-2.2.12: Implement Bulk Invitation ✅

**Priority**: LOW | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:

- [x] Implement `bulkInvite(orgId, emails[], role, personalMessage, userId)`
- [x] Validate all emails first, report issues
- [x] Skip duplicates and existing members
- [x] Process valid invitations
- [x] Return summary (successful/failed with reasons)
- [x] Add `POST /organizations/:id/invitations/bulk` endpoint

**Acceptance Criteria**:

- [x] Batch processing completes
- [x] Invalid emails reported
- [x] Duplicates handled gracefully
- [x] Rate limiting applied (10/hour/org)

---

### TASK-2.2.13: Create Invitation Email Template ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/mail/mail.service.ts`

**Subtasks**:

- [x] Create `sendInvitationEmail(params)` method
- [x] Include accept/decline links
- [x] Include organization name and logo
- [x] Include inviter name
- [x] Include role with permissions preview
- [x] Include personal message if provided
- [x] Include expiration date
- [x] Create HTML template file

**Acceptance Criteria**:

- [x] Email renders correctly in major clients
- [x] Accept/decline links work
- [x] All dynamic content displays
- [x] Mobile-friendly design

---

### TASK-2.2.14: Create Member Removed Email Template ✅

**Priority**: LOW | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/mail/mail.service.ts`

**Subtasks**:

- [x] Create `sendMemberRemovedEmail(params)` method
- [x] Include organization name
- [x] Include who removed them
- [x] Include asset transfer info if applicable

**Acceptance Criteria**:

- [x] Email is informative but not alarming
- [x] Renders correctly

---

## Phase 2: Frontend Development (Week 2-3)

### TASK-2.2.15: Create Invitation Components Directory ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 30 minutes
**Directory**: `apps/web/components/invitation/`

**Subtasks**:

- [x] Create directory structure
- [x] Create `index.ts` for exports
- [x] Plan component hierarchy

---

### TASK-2.2.16: Build Enhanced Invite Member Dialog ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/components/invitation/InviteMemberDialog.tsx`

**Subtasks**:

- [x] Create dialog using AlertDialog from shadcn/ui
- [x] Add email input with validation
- [x] Add role selector (filtered by current user role)
- [x] Add personal message textarea (optional, max 500 chars)
- [x] Add loading state for submit
- [x] Show success toast on completion
- [x] Show error messages for failures
- [x] Display pending invitations count in trigger

**Acceptance Criteria**:

- [x] Form validates email format
- [x] Role options limited based on user's role
- [x] Submits successfully and shows feedback

---

### TASK-2.2.17: Build Invitation Acceptance Page ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4-5 hours
**File**: `apps/web/app/invitations/[token]/page.tsx`

**Subtasks**:

- [x] Create page route with dynamic token
- [x] Fetch invitation details using public API
- [x] Display organization name and logo
- [x] Display inviter name
- [x] Display assigned role with permissions preview
- [x] Display personal message if provided
- [x] Show Accept and Decline buttons
- [x] Handle authenticated vs unauthenticated users
- [x] For new users: show registration form inline
- [x] Handle expired invitation state
- [x] Handle already accepted state
- [x] Handle invalid token state
- [x] Redirect to dashboard on successful accept

**Acceptance Criteria**:

- [x] Page loads invitation details
- [x] States handled (pending/expired/accepted/declined/invalid)
- [x] Unauthenticated users can register and accept
- [x] Authenticated users can accept directly

---

### TASK-2.2.18: Build Pending Invitations List Component ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/invitation/PendingInvitationsList.tsx`

**Subtasks**:

- [x] Create list component with table layout
- [x] Display email, role, expiry countdown for each
- [x] Add Resend button with confirmation
- [x] Add Cancel button with confirmation (AlertDialog)
- [x] Show loading skeleton during fetch
- [x] Show empty state when no invitations
- [x] Add status badge (pending/expired)
- [x] Add inviter name column

**Acceptance Criteria**:

- [x] List displays all pending invitations
- [x] Actions work correctly
- [x] Expiry countdown updates

---

### TASK-2.2.19: Build Remove Member Dialog ✅

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/organization/RemoveMemberDialog.tsx`

**Subtasks**:

- [x] Create AlertDialog for removal confirmation
- [x] Display member information
- [x] If member has assets, show count
- [x] Add transfer target dropdown (other members)
- [x] Add confirm/cancel buttons
- [x] Show loading state during removal
- [x] Show success toast after removal

**Acceptance Criteria**:

- [x] Confirmation required before removal
- [x] Assets can be transferred
- [x] Proper feedback shown

---

### TASK-2.2.20: Integrate Invitations Tab in Team Page ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/app/dashboard/settings/team/page.tsx`

**Subtasks**:

- [x] Add tabs for "Members" and "Pending Invitations"
- [x] Integrate PendingInvitationsList in Invitations tab
- [x] Add invite button in header
- [x] Show invitation count badge on tab
- [x] Add status filter (pending/accepted/declined)

**Acceptance Criteria**:

- [x] Both tabs work correctly
- [x] Invitations list shows and updates
- [x] Filters work

---

### TASK-2.2.21: Build Bulk Invite Dialog ✅

**Priority**: LOW | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/invitation/BulkInviteDialog.tsx`

**Subtasks**:

- [x] Create dialog for bulk invitation
- [x] Add textarea for comma/newline separated emails
- [x] Add role selector (applies to all)
- [x] Add optional personal message
- [x] Show validation preview before submit
- [x] Show progress during processing
- [x] Show results summary (success/failed counts)

**Acceptance Criteria**:

- [x] Multiple emails can be entered
- [x] Validation shows before submit
- [x] Results displayed clearly

---

### TASK-2.2.22: Add API Client Methods for Invitations ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/lib/api/invitations.ts` (created)

**Subtasks**:

- [x] `createInvitation(orgId, data)` - POST /organizations/:id/invitations
- [x] `listInvitations(orgId, filters)` - GET /organizations/:id/invitations
- [x] `resendInvitation(orgId, invitationId)` - POST .../resend
- [x] `cancelInvitation(orgId, invitationId)` - DELETE
- [x] `getInvitationByToken(token)` - GET /invitations/:token (public)
- [x] `acceptInvitation(token, data?)` - POST /invitations/:token/accept
- [x] `declineInvitation(token)` - POST /invitations/:token/decline
- [x] `bulkInvite(orgId, data)` - POST .../bulk

**Acceptance Criteria**:

- [x] All API methods implemented
- [x] Proper error handling
- [x] Type safety with TypeScript

---

## Phase 3: Testing (Week 3-4)

### TASK-2.2.23: Write Invitation Service Unit Tests ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts` (59 tests)

**Test Cases**:

- [x] `createInvitation` - should create with secure token
- [x] `createInvitation` - should fail if email already invited
- [x] `createInvitation` - should fail if user is member
- [x] `createInvitation` - should fail if inviter not OWNER/ADMIN
- [x] `createInvitation` - should store hashed token only
- [x] `acceptInvitation` - should add user with correct role
- [x] `acceptInvitation` - should fail if expired
- [x] `acceptInvitation` - should fail if already accepted
- [x] `acceptInvitation` - should create new user if needed
- [x] `declineInvitation` - should mark as declined
- [x] `resendInvitation` - should generate new token and reset expiry
- [x] `cancelInvitation` - should delete pending invitation
- [x] `listPendingInvitations` - should filter correctly
- [x] `validateToken` - timing-safe comparison works

**Acceptance Criteria**:

- [x] All tests pass
- [x] Coverage > 80%

---

### TASK-2.2.24: Write Token Security Tests ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts`

**Test Cases**:

- [x] Should generate cryptographically secure tokens
- [x] Should generate tokens of sufficient length (32+ bytes)
- [x] Should never expose plain token in database
- [x] Should use timing-safe comparison
- [x] Should rate limit validation attempts

**Acceptance Criteria**:

- [x] Security tests pass
- [x] No plain tokens in database

---

### TASK-2.2.25: Write Member Removal Unit Tests ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts`

**Test Cases**:

- [x] `removeMember` - should remove member from organization
- [x] `removeMember` - should fail if trying to remove OWNER
- [x] `removeMember` - should fail if user not OWNER/ADMIN
- [x] `removeMember` - should create audit log entry
- [x] `transferMemberAssets` - should transfer links correctly
- [x] `getMemberAssets` - should return correct counts

**Acceptance Criteria**:

- [x] All tests pass
- [x] Edge cases covered

---

### TASK-2.2.26: Write E2E Tests - Send Invitation ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts` (created)

**Test Cases**:

- [x] MIR-001: Send invitation to new email
- [x] MIR-002: Cannot invite existing member
- [x] MIR-003: Cannot invite duplicate email
- [x] MIR-004: EDITOR cannot send invitations
- [x] MIR-005: ADMIN can send invitations
- [x] MIR-006: ADMIN cannot invite as OWNER role

**Acceptance Criteria**:

- [x] All tests pass
- [x] Tests use proper fixtures

---

### TASK-2.2.27: Write E2E Tests - Accept Invitation ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:

- [x] MIR-010: Accept invitation as existing user
- [x] MIR-011: Accept invitation as new user
- [x] MIR-012: Cannot accept expired invitation
- [x] MIR-013: Cannot accept already accepted invitation
- [x] MIR-014: Invitation shows correct details

**Acceptance Criteria**:

- [x] All tests pass
- [x] User registration flow tested

---

### TASK-2.2.28: Write E2E Tests - Decline Invitation ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 1 hour
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:

- [x] MIR-020: Decline invitation
- [x] MIR-021: Cannot decline already declined invitation

**Acceptance Criteria**:

- [x] All tests pass

---

### TASK-2.2.29: Write E2E Tests - Manage Invitations ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:

- [x] MIR-030: View pending invitations list
- [x] MIR-031: Resend invitation
- [x] MIR-032: Cancel invitation
- [x] MIR-033: Filter invitations by status

**Acceptance Criteria**:

- [x] All tests pass
- [x] List refreshes correctly after actions

---

### TASK-2.2.30: Write E2E Tests - Remove Member ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:

- [x] MIR-040: Remove member from organization
- [x] MIR-041: Cannot remove OWNER
- [x] MIR-042: ADMIN cannot remove other ADMIN
- [x] MIR-043: Remove member with asset transfer
- [x] MIR-044: Self-removal from organization
- [x] MIR-045: OWNER cannot self-remove

**Acceptance Criteria**:

- [x] All tests pass
- [x] Asset transfer verified

---

### TASK-2.2.31: Write E2E Tests - Bulk Invitation (Optional) ✅

**Priority**: LOW | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:

- [x] MIR-050: Bulk invite by list
- [x] MIR-051: Bulk invite with CSV
- [x] MIR-052: Bulk invite validation

**Acceptance Criteria**:

- [x] All tests pass
- [x] Invalid emails handled

---

### TASK-2.2.32: Write Integration Tests ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts`

**Test Cases**:

- [x] Email delivery verification (mocked)
- [x] Token flow end-to-end
- [x] Permission cascade validation
- [x] Audit trail verification

**Acceptance Criteria**:

- [x] Integration points tested
- [x] No flaky tests

---

## Summary

| Phase             | Task Count   | Priority Breakdown           |
| ----------------- | ------------ | ---------------------------- |
| Database & Schema | 3 tasks      | 1 HIGH, 2 MEDIUM             |
| Backend API       | 11 tasks     | 8 HIGH, 2 MEDIUM, 1 LOW      |
| Frontend          | 8 tasks      | 5 HIGH, 1 MEDIUM, 2 LOW      |
| Testing           | 10 tasks     | 6 HIGH, 3 MEDIUM, 1 LOW      |
| **Total**         | **32 tasks** | **20 HIGH, 8 MEDIUM, 4 LOW** |

### Estimated Total Time: 55-65 hours

### Critical Path (Must complete first):

1. TASK-2.2.1: Database schema (OrganizationInvitation)
2. TASK-2.2.4: Module structure
3. TASK-2.2.5: Token utilities
4. TASK-2.2.6: Create invitation
5. TASK-2.2.7: Accept invitation
6. TASK-2.2.13: Email template
7. TASK-2.2.17: Acceptance page

### Dependencies Graph:

```
TASK-2.2.1 (Schema)
    └── TASK-2.2.4 (Module)
        ├── TASK-2.2.5 (Token Utils)
        │   └── TASK-2.2.6 (Create) ─── TASK-2.2.13 (Email)
        │       └── TASK-2.2.7 (Accept)
        │           └── TASK-2.2.17 (Accept Page)
        └── TASK-2.2.9 (Management)
            └── TASK-2.2.18 (List Component)
```
