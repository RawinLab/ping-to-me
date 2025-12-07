# Module 2.2: Member Invite/Remove - Development Todolist

## Document Information
- **Module**: 2.2 Member Invite/Remove
- **Source**: `2-2-member-invite-remove-plan.md`
- **Generated**: 2025-12-07
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

### TASK-2.2.1: Create OrganizationInvitation Model
**Priority**: HIGH | **Type**: Database | **Estimated**: 2-3 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `OrganizationInvitation` model with fields:
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
- [ ] Add relations to Organization and User
- [ ] Add unique constraint on `[organizationId, email]`
- [ ] Add indexes on `token`, `tokenHash`, `expiresAt`, `email`

**Acceptance Criteria**:
- Schema validates without errors
- Migration runs successfully
- Prisma client generates correctly

---

### TASK-2.2.2: Update OrganizationMember Model
**Priority**: MEDIUM | **Type**: Database | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `joinedAt` field (DateTime, default now)
- [ ] Add `lastActiveAt` field (DateTime, optional)
- [ ] Add `invitedById` field (UUID, optional, foreign key to User)
- [ ] Add relation to User model for invitedBy

**Acceptance Criteria**:
- Existing members not affected
- New fields are optional/have defaults
- Migration runs without data loss

---

### TASK-2.2.3: Update User Model for Invitation Relation
**Priority**: MEDIUM | **Type**: Database | **Estimated**: 30 minutes
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `sentInvitations` relation (OrganizationInvitation[])
- [ ] Add `invitedMembers` relation (OrganizationMember[])

**Acceptance Criteria**:
- Relations work bidirectionally
- No breaking changes to existing queries

---

## Phase 1: Backend API Development (Week 1-2)

### TASK-2.2.4: Create Invitation Module Structure
**Priority**: HIGH | **Type**: Backend | **Estimated**: 1 hour
**Directory**: `apps/api/src/invitations/`

**Subtasks**:
- [ ] Create `invitations.module.ts`
- [ ] Create `invitations.service.ts`
- [ ] Create `invitations.controller.ts`
- [ ] Create `dto/create-invitation.dto.ts`
- [ ] Create `dto/accept-invitation.dto.ts`
- [ ] Create `dto/bulk-invitation.dto.ts`
- [ ] Register module in `app.module.ts`

**Acceptance Criteria**:
- Module structure follows NestJS conventions
- Module registers without errors

---

### TASK-2.2.5: Implement Token Generation Utilities
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `generateSecureToken()` using `crypto.randomBytes(32)`
- [ ] Implement `hashToken()` for database storage
- [ ] Implement `validateToken()` with timing-safe comparison
- [ ] Implement `generateExpirationDate()` (7 days from now)
- [ ] Add rate limiting for token validation (5 attempts/minute/IP)

**Acceptance Criteria**:
- Tokens are cryptographically secure (32+ bytes)
- Plain tokens never stored in database
- Validation resistant to timing attacks

---

### TASK-2.2.6: Implement Create Invitation Logic
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3-4 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `createInvitation(orgId, dto, userId)` method
- [ ] Check if email already has pending invitation
- [ ] Check if user is already a member
- [ ] Validate inviter has permission (OWNER or ADMIN)
- [ ] Validate role assignment (can't assign higher than own role)
- [ ] Generate secure token and hash
- [ ] Create database record
- [ ] Trigger email sending

**Acceptance Criteria**:
- Proper validation messages
- Token generated and stored securely
- Email sent on success
- Audit log created

---

### TASK-2.2.7: Implement Accept Invitation Logic
**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `acceptInvitation(token, userData?)` method
- [ ] Validate token exists and is not expired
- [ ] Validate invitation not already accepted/declined
- [ ] If user exists: add to organization
- [ ] If new user: create account first, then add to organization
- [ ] Mark invitation as accepted
- [ ] Return organization details and auth tokens for new users

**Acceptance Criteria**:
- Existing users can accept with just token
- New users can register during acceptance
- Proper error messages for invalid/expired tokens
- Member added with correct role

---

### TASK-2.2.8: Implement Decline Invitation Logic
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `declineInvitation(token)` method
- [ ] Validate token exists and is not expired
- [ ] Mark invitation as declined
- [ ] Don't require authentication

**Acceptance Criteria**:
- Invitation marked as declined
- Cannot decline already accepted invitation

---

### TASK-2.2.9: Implement Invitation Management Methods
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `listInvitations(orgId, filters)` with pagination
- [ ] Implement `getInvitationByToken(token)` for public view
- [ ] Implement `resendInvitation(orgId, invitationId, userId)`
  - Generate new token
  - Reset expiration
  - Send new email
- [ ] Implement `cancelInvitation(orgId, invitationId, userId)`
- [ ] Implement `getInvitationHistory(orgId)` for accepted/declined

**Acceptance Criteria**:
- List shows pending invitations with proper filtering
- Resend generates new token with fresh expiry
- Cancel removes pending invitation

---

### TASK-2.2.10: Create Invitation Controller Endpoints
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.controller.ts`

**Subtasks**:
- [ ] `POST /organizations/:id/invitations` - Create invitation (auth required)
- [ ] `GET /organizations/:id/invitations` - List invitations (auth required)
- [ ] `POST /organizations/:id/invitations/:invitationId/resend` - Resend (auth required)
- [ ] `DELETE /organizations/:id/invitations/:invitationId` - Cancel (auth required)
- [ ] `GET /invitations/:token` - Get details (public)
- [ ] `POST /invitations/:token/accept` - Accept (public)
- [ ] `POST /invitations/:token/decline` - Decline (public)

**Acceptance Criteria**:
- Protected endpoints require auth guard
- Public endpoints work without authentication
- Proper DTO validation on all endpoints
- Swagger documentation

---

### TASK-2.2.11: Enhance Member Removal Service
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Subtasks**:
- [ ] Implement `getMemberAssets(orgId, userId)` - count links, campaigns, tags
- [ ] Implement `transferMemberAssets(orgId, fromUserId, toUserId)`
- [ ] Enhance `removeMember()` to:
  - Accept optional `transferAssetsTo` parameter
  - Prevent removing OWNER
  - Prevent ADMIN from removing other ADMINs
  - Create audit log entry
  - Send notification email to removed member

**Acceptance Criteria**:
- Asset counts returned correctly
- Assets can be transferred before removal
- OWNER protected from removal
- Audit log created

---

### TASK-2.2.12: Implement Bulk Invitation
**Priority**: LOW | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/invitations/invitations.service.ts`

**Subtasks**:
- [ ] Implement `bulkInvite(orgId, emails[], role, personalMessage, userId)`
- [ ] Validate all emails first, report issues
- [ ] Skip duplicates and existing members
- [ ] Process valid invitations
- [ ] Return summary (successful/failed with reasons)
- [ ] Add `POST /organizations/:id/invitations/bulk` endpoint

**Acceptance Criteria**:
- Batch processing completes
- Invalid emails reported
- Duplicates handled gracefully
- Rate limiting applied (10/hour/org)

---

### TASK-2.2.13: Create Invitation Email Template
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2-3 hours
**File**: `apps/api/src/mail/mail.service.ts`

**Subtasks**:
- [ ] Create `sendInvitationEmail(params)` method
- [ ] Include accept/decline links
- [ ] Include organization name and logo
- [ ] Include inviter name
- [ ] Include role with permissions preview
- [ ] Include personal message if provided
- [ ] Include expiration date
- [ ] Create HTML template file

**Acceptance Criteria**:
- Email renders correctly in major clients
- Accept/decline links work
- All dynamic content displays
- Mobile-friendly design

---

### TASK-2.2.14: Create Member Removed Email Template
**Priority**: LOW | **Type**: Backend | **Estimated**: 1 hour
**File**: `apps/api/src/mail/mail.service.ts`

**Subtasks**:
- [ ] Create `sendMemberRemovedEmail(params)` method
- [ ] Include organization name
- [ ] Include who removed them
- [ ] Include asset transfer info if applicable

**Acceptance Criteria**:
- Email is informative but not alarming
- Renders correctly

---

## Phase 2: Frontend Development (Week 2-3)

### TASK-2.2.15: Create Invitation Components Directory
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 30 minutes
**Directory**: `apps/web/components/invitation/`

**Subtasks**:
- [ ] Create directory structure
- [ ] Create `index.ts` for exports
- [ ] Plan component hierarchy

---

### TASK-2.2.16: Build Enhanced Invite Member Dialog
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3-4 hours
**File**: `apps/web/components/invitation/InviteMemberDialog.tsx`

**Subtasks**:
- [ ] Create dialog using AlertDialog from shadcn/ui
- [ ] Add email input with validation
- [ ] Add role selector (filtered by current user role)
- [ ] Add personal message textarea (optional, max 500 chars)
- [ ] Add loading state for submit
- [ ] Show success toast on completion
- [ ] Show error messages for failures
- [ ] Display pending invitations count in trigger

**Acceptance Criteria**:
- Form validates email format
- Role options limited based on user's role
- Submits successfully and shows feedback

---

### TASK-2.2.17: Build Invitation Acceptance Page
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4-5 hours
**File**: `apps/web/app/invitations/[token]/page.tsx`

**Subtasks**:
- [ ] Create page route with dynamic token
- [ ] Fetch invitation details using public API
- [ ] Display organization name and logo
- [ ] Display inviter name
- [ ] Display assigned role with permissions preview
- [ ] Display personal message if provided
- [ ] Show Accept and Decline buttons
- [ ] Handle authenticated vs unauthenticated users
- [ ] For new users: show registration form inline
- [ ] Handle expired invitation state
- [ ] Handle already accepted state
- [ ] Handle invalid token state
- [ ] Redirect to dashboard on successful accept

**Acceptance Criteria**:
- Page loads invitation details
- States handled (pending/expired/accepted/declined/invalid)
- Unauthenticated users can register and accept
- Authenticated users can accept directly

---

### TASK-2.2.18: Build Pending Invitations List Component
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/invitation/PendingInvitationsList.tsx`

**Subtasks**:
- [ ] Create list component with table layout
- [ ] Display email, role, expiry countdown for each
- [ ] Add Resend button with confirmation
- [ ] Add Cancel button with confirmation (AlertDialog)
- [ ] Show loading skeleton during fetch
- [ ] Show empty state when no invitations
- [ ] Add status badge (pending/expired)
- [ ] Add inviter name column

**Acceptance Criteria**:
- List displays all pending invitations
- Actions work correctly
- Expiry countdown updates

---

### TASK-2.2.19: Build Remove Member Dialog
**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 2-3 hours
**File**: `apps/web/components/organization/RemoveMemberDialog.tsx`

**Subtasks**:
- [ ] Create AlertDialog for removal confirmation
- [ ] Display member information
- [ ] If member has assets, show count
- [ ] Add transfer target dropdown (other members)
- [ ] Add confirm/cancel buttons
- [ ] Show loading state during removal
- [ ] Show success toast after removal

**Acceptance Criteria**:
- Confirmation required before removal
- Assets can be transferred
- Proper feedback shown

---

### TASK-2.2.20: Integrate Invitations Tab in Team Page
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/app/dashboard/settings/team/page.tsx`

**Subtasks**:
- [ ] Add tabs for "Members" and "Pending Invitations"
- [ ] Integrate PendingInvitationsList in Invitations tab
- [ ] Add invite button in header
- [ ] Show invitation count badge on tab
- [ ] Add status filter (pending/accepted/declined)

**Acceptance Criteria**:
- Both tabs work correctly
- Invitations list shows and updates
- Filters work

---

### TASK-2.2.21: Build Bulk Invite Dialog
**Priority**: LOW | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/invitation/BulkInviteDialog.tsx`

**Subtasks**:
- [ ] Create dialog for bulk invitation
- [ ] Add textarea for comma/newline separated emails
- [ ] Add role selector (applies to all)
- [ ] Add optional personal message
- [ ] Show validation preview before submit
- [ ] Show progress during processing
- [ ] Show results summary (success/failed counts)

**Acceptance Criteria**:
- Multiple emails can be entered
- Validation shows before submit
- Results displayed clearly

---

### TASK-2.2.22: Add API Client Methods for Invitations
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 2 hours
**File**: `apps/web/lib/api/invitations.ts` (new)

**Subtasks**:
- [ ] `createInvitation(orgId, data)` - POST /organizations/:id/invitations
- [ ] `listInvitations(orgId, filters)` - GET /organizations/:id/invitations
- [ ] `resendInvitation(orgId, invitationId)` - POST .../resend
- [ ] `cancelInvitation(orgId, invitationId)` - DELETE
- [ ] `getInvitationByToken(token)` - GET /invitations/:token (public)
- [ ] `acceptInvitation(token, data?)` - POST /invitations/:token/accept
- [ ] `declineInvitation(token)` - POST /invitations/:token/decline
- [ ] `bulkInvite(orgId, data)` - POST .../bulk

**Acceptance Criteria**:
- All API methods implemented
- Proper error handling
- Type safety with TypeScript

---

## Phase 3: Testing (Week 3-4)

### TASK-2.2.23: Write Invitation Service Unit Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/invitations.service.spec.ts`

**Test Cases**:
- [ ] `createInvitation` - should create with secure token
- [ ] `createInvitation` - should fail if email already invited
- [ ] `createInvitation` - should fail if user is member
- [ ] `createInvitation` - should fail if inviter not OWNER/ADMIN
- [ ] `createInvitation` - should store hashed token only
- [ ] `acceptInvitation` - should add user with correct role
- [ ] `acceptInvitation` - should fail if expired
- [ ] `acceptInvitation` - should fail if already accepted
- [ ] `acceptInvitation` - should create new user if needed
- [ ] `declineInvitation` - should mark as declined
- [ ] `resendInvitation` - should generate new token and reset expiry
- [ ] `cancelInvitation` - should delete pending invitation
- [ ] `listPendingInvitations` - should filter correctly
- [ ] `validateToken` - timing-safe comparison works

**Acceptance Criteria**:
- All tests pass
- Coverage > 80%

---

### TASK-2.2.24: Write Token Security Tests
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/token-security.spec.ts`

**Test Cases**:
- [ ] Should generate cryptographically secure tokens
- [ ] Should generate tokens of sufficient length (32+ bytes)
- [ ] Should never expose plain token in database
- [ ] Should use timing-safe comparison
- [ ] Should rate limit validation attempts

**Acceptance Criteria**:
- Security tests pass
- No plain tokens in database

---

### TASK-2.2.25: Write Member Removal Unit Tests
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/organizations/member-removal.spec.ts`

**Test Cases**:
- [ ] `removeMember` - should remove member from organization
- [ ] `removeMember` - should fail if trying to remove OWNER
- [ ] `removeMember` - should fail if user not OWNER/ADMIN
- [ ] `removeMember` - should create audit log entry
- [ ] `transferMemberAssets` - should transfer links correctly
- [ ] `getMemberAssets` - should return correct counts

**Acceptance Criteria**:
- All tests pass
- Edge cases covered

---

### TASK-2.2.26: Write E2E Tests - Send Invitation
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-001: Send invitation to new email
- [ ] MIR-002: Cannot invite existing member
- [ ] MIR-003: Cannot invite duplicate email
- [ ] MIR-004: EDITOR cannot send invitations
- [ ] MIR-005: ADMIN can send invitations
- [ ] MIR-006: ADMIN cannot invite as OWNER role

**Acceptance Criteria**:
- All tests pass
- Tests use proper fixtures

---

### TASK-2.2.27: Write E2E Tests - Accept Invitation
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-010: Accept invitation as existing user
- [ ] MIR-011: Accept invitation as new user
- [ ] MIR-012: Cannot accept expired invitation
- [ ] MIR-013: Cannot accept already accepted invitation
- [ ] MIR-014: Invitation shows correct details

**Acceptance Criteria**:
- All tests pass
- User registration flow tested

---

### TASK-2.2.28: Write E2E Tests - Decline Invitation
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 1 hour
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-020: Decline invitation
- [ ] MIR-021: Cannot decline already declined invitation

**Acceptance Criteria**:
- All tests pass

---

### TASK-2.2.29: Write E2E Tests - Manage Invitations
**Priority**: HIGH | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-030: View pending invitations list
- [ ] MIR-031: Resend invitation
- [ ] MIR-032: Cancel invitation
- [ ] MIR-033: Filter invitations by status

**Acceptance Criteria**:
- All tests pass
- List refreshes correctly after actions

---

### TASK-2.2.30: Write E2E Tests - Remove Member
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-040: Remove member from organization
- [ ] MIR-041: Cannot remove OWNER
- [ ] MIR-042: ADMIN cannot remove other ADMIN
- [ ] MIR-043: Remove member with asset transfer
- [ ] MIR-044: Self-removal from organization
- [ ] MIR-045: OWNER cannot self-remove

**Acceptance Criteria**:
- All tests pass
- Asset transfer verified

---

### TASK-2.2.31: Write E2E Tests - Bulk Invitation (Optional)
**Priority**: LOW | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test Cases**:
- [ ] MIR-050: Bulk invite by list
- [ ] MIR-051: Bulk invite with CSV
- [ ] MIR-052: Bulk invite validation

**Acceptance Criteria**:
- All tests pass
- Invalid emails handled

---

### TASK-2.2.32: Write Integration Tests
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/api/src/invitations/invitations.integration.spec.ts`

**Test Cases**:
- [ ] Email delivery verification (mocked)
- [ ] Token flow end-to-end
- [ ] Permission cascade validation
- [ ] Audit trail verification

**Acceptance Criteria**:
- Integration points tested
- No flaky tests

---

## Summary

| Phase | Task Count | Priority Breakdown |
|-------|------------|-------------------|
| Database & Schema | 3 tasks | 1 HIGH, 2 MEDIUM |
| Backend API | 11 tasks | 8 HIGH, 2 MEDIUM, 1 LOW |
| Frontend | 8 tasks | 5 HIGH, 1 MEDIUM, 2 LOW |
| Testing | 10 tasks | 6 HIGH, 3 MEDIUM, 1 LOW |
| **Total** | **32 tasks** | **20 HIGH, 8 MEDIUM, 4 LOW** |

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
