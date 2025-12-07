# Module 2.1: Organization/Workspace - Development Todolist

## Overview

- **Module**: 2.1 Organization/Workspace
- **Current Progress**: ~95% (Implementation and testing complete)
- **Total Estimated Time**: 5 weeks
- **Priority**: HIGH

---

## Phase 1: Database & Schema (Week 1)

### TASK-2.1.1: Update Organization Model in Prisma Schema ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:

- [x] Add `logo` field (String, optional) to Organization model
- [x] Add `description` field (String, optional) to Organization model
- [x] Add `timezone` field (String, default "UTC") to Organization model
- [x] Add `dataRetentionDays` field (Int, default 90) to Organization model
- [x] Add `defaultDomainId` field (String, optional) to Organization model

**Acceptance Criteria**:

- [x] Schema compiles without errors
- [x] Migration runs successfully

---

### TASK-2.1.2: Create OrganizationSettings Model ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `packages/database/prisma/schema.prisma`

**Schema to add**:

```prisma
model OrganizationSettings {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId  String   @unique @db.Uuid
  ipAllowlist     Json?
  ssoEnabled      Boolean  @default(false)
  ssoProviderId   String?
  enforced2FA     Boolean  @default(false)
  sessionTimeout  Int      @default(7200)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

**Subtasks**:

- [x] Add OrganizationSettings model to schema
- [x] Add relation to Organization model
- [x] Run `pnpm --filter @pingtome/database db:generate`

---

### TASK-2.1.3: Create OrganizationInvitation Model ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `packages/database/prisma/schema.prisma`

**Schema to add**:

```prisma
model OrganizationInvitation {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId  String     @db.Uuid
  email           String
  role            MemberRole @default(VIEWER)
  token           String     @unique
  invitedById     String     @db.Uuid
  personalMessage String?
  expiresAt       DateTime
  acceptedAt      DateTime?
  declinedAt      DateTime?
  createdAt       DateTime   @default(now())

  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy       User         @relation("SentInvitations", fields: [invitedById], references: [id])

  @@unique([organizationId, email])
  @@index([token])
  @@index([expiresAt])
  @@index([email])
}
```

**Subtasks**:

- [x] Add OrganizationInvitation model to schema
- [x] Add relations to Organization and User models
- [x] Create indexes for performance

---

### TASK-2.1.4: Update OrganizationMember Model ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Fields to add**:

- [x] Add `joinedAt` field (DateTime, default now())
- [x] Add `lastActiveAt` field (DateTime, optional)
- [x] Add `invitedById` field (String, optional)
- [x] Add relation to invitedBy User

---

### TASK-2.1.5: Run Database Migration ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 30 minutes

**Commands**:

```bash
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:push
```

**Subtasks**:

- [x] Generate Prisma client
- [x] Push schema to database
- [x] Verify migration success
- [x] Test database connections

---

## Phase 1: Backend API Development (Week 1-2)

### TASK-2.1.6: Create Organization Settings DTOs ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**Files**: `apps/api/src/organizations/dto/`

**Subtasks**:

- [x] Create `get-organization-settings.dto.ts`
- [x] Create `update-organization-settings.dto.ts`
- [x] Add validation decorators (class-validator)
- [x] Add Swagger documentation

---

### TASK-2.1.7: Implement Organization Settings Service Methods ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to implement**:

- [x] `getSettings(orgId: string, userId: string): Promise<OrganizationSettings>`
- [x] `updateSettings(orgId: string, userId: string, dto: UpdateSettingsDto): Promise<OrganizationSettings>`
- [x] `createDefaultSettings(orgId: string): Promise<OrganizationSettings>`

**Acceptance Criteria**:

- [x] OWNER/ADMIN can update settings
- [x] Default settings created when org is created
- [x] Proper error handling

---

### TASK-2.1.8: Implement Logo Upload Service ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to implement**:

- [x] `uploadLogo(orgId: string, userId: string, file: Express.Multer.File): Promise<string>`
- [x] `deleteLogo(orgId: string, userId: string): Promise<void>`

**Subtasks**:

- [x] Configure Multer for file upload
- [x] Validate file type (png, jpg, webp)
- [x] Validate file size (max 2MB)
- [x] Store file (local or cloud storage)
- [x] Delete old logo when uploading new
- [x] Return logo URL

---

### TASK-2.1.9: Create Organization Settings Controller Endpoints ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/organizations/organization.controller.ts`

**Endpoints to add**:

- [x] `GET /organizations/:id/settings` - Get org settings
- [x] `PATCH /organizations/:id/settings` - Update org settings
- [x] `POST /organizations/:id/logo` - Upload logo
- [x] `DELETE /organizations/:id/logo` - Remove logo

**Subtasks**:

- [x] Add JwtAuthGuard
- [x] Add permission checks (OWNER/ADMIN)
- [x] Add Swagger documentation
- [x] Add validation pipes

---

### TASK-2.1.10: Create Invitation Service ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 6 hours
**File**: `apps/api/src/invitations/invitations.service.ts` (created)

**Methods to implement**:

- [x] `createInvitation(orgId: string, inviterId: string, dto: CreateInvitationDto): Promise<Invitation>`
- [x] `listPendingInvitations(orgId: string): Promise<Invitation[]>`
- [x] `getInvitationByToken(token: string): Promise<Invitation>`
- [x] `acceptInvitation(token: string, userId?: string): Promise<void>`
- [x] `declineInvitation(token: string): Promise<void>`
- [x] `resendInvitation(invitationId: string): Promise<void>`
- [x] `cancelInvitation(invitationId: string): Promise<void>`
- [x] `generateSecureToken(): string` - Using crypto.randomBytes

**Business Logic**:

- [x] Token expiration: 7 days
- [x] Send email on invitation
- [x] Check if email already invited
- [x] Check if user already a member
- [x] Create user account if not exists on accept

---

### TASK-2.1.11: Integrate Email Service for Invitations ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/mail/mail.service.ts`

**Methods to add**:

- [x] `sendInvitationEmail(email: string, orgName: string, inviterName: string, token: string, personalMessage?: string): Promise<void>`

**Subtasks**:

- [x] Create invitation email template
- [x] Include accept/decline links
- [x] Include organization name and inviter name
- [x] Handle personal message

---

### TASK-2.1.12: Create Invitation Controller Endpoints ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/invitations.controller.ts` (created)

**Endpoints to add**:

- [x] `POST /organizations/:id/invitations` - Send invitation
- [x] `GET /organizations/:id/invitations` - List pending invitations
- [x] `POST /organizations/:id/invitations/:invId/resend` - Resend invitation
- [x] `DELETE /organizations/:id/invitations/:invId` - Cancel invitation
- [x] `POST /invitations/:token/accept` - Accept invitation (public)
- [x] `POST /invitations/:token/decline` - Decline invitation (public)
- [x] `GET /invitations/:token` - Get invitation details (public)

---

### TASK-2.1.13: Enhance Member Management Service ✅

**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to update/add**:

- [x] `getMembers()` - Include joinedAt, lastActiveAt, linksCount
- [x] `transferOwnership(orgId: string, currentOwnerId: string, newOwnerId: string): Promise<void>`
- [x] `updateMemberLastActive(orgId: string, userId: string): Promise<void>`
- [x] `getMemberLinksCount(orgId: string, userId: string): Promise<number>`

---

### TASK-2.1.14: Add Transfer Ownership Endpoint ✅

**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/organizations/organization.controller.ts`

**Endpoint**:

- [x] `POST /organizations/:id/transfer-ownership`

**Business Logic**:

- [x] Only OWNER can transfer
- [x] New owner must be existing member
- [x] Previous owner becomes ADMIN

---

## Phase 2: Frontend Development (Week 2-3)

### TASK-2.1.15: Create Organization Settings Page ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 6 hours
**File**: `apps/web/app/dashboard/organization/[id]/settings/page.tsx` (new)

**Components to build**:

- [x] GeneralSettingsCard (name, slug, description)
- [x] BrandingCard (logo upload)
- [x] PreferencesCard (timezone, data retention, default domain)
- [x] SecurityCard (2FA enforcement, session timeout) - OWNER only
- [x] DangerZoneCard (transfer ownership, delete org) - OWNER only

**Subtasks**:

- [x] Create form with react-hook-form
- [x] Add validation with zod
- [x] Implement logo upload with preview
- [x] Add timezone picker component
- [x] Add success/error toasts
- [x] Handle loading states

---

### TASK-2.1.16: Create Logo Upload Component ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/organization/LogoUploader.tsx` (created)

**Features**:

- [x] Drag and drop support
- [x] File type validation (png, jpg, webp)
- [x] File size validation (max 2MB)
- [x] Preview before upload
- [x] Remove logo option
- [x] Loading state during upload

---

### TASK-2.1.17: Create Invitation Management UI ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 6 hours
**File**: `apps/web/components/invitation/` (created)

**Components to build**:

- [x] InviteMemberDialog (enhanced from existing)
  - [x] Email input
  - [x] Role selector
  - [x] Personal message textarea
  - [x] Validation
- [x] PendingInvitationsList
  - [x] Invitation cards with email, role, expiry
  - [x] Resend button
  - [x] Cancel button with confirmation

---

### TASK-2.1.18: Create Invitation Acceptance Page ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/app/invitations/[token]/page.tsx` (created)

**Features**:

- [x] Display organization info (name, logo)
- [x] Display inviter info (name)
- [x] Display assigned role
- [x] Display personal message if exists
- [x] Accept button
- [x] Decline button
- [x] Registration form for new users
- [x] Handle expired/invalid tokens
- [x] Redirect after acceptance

---

### TASK-2.1.19: Create OrganizationContext ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/contexts/OrganizationContext.tsx` (created)

**Context to provide**:

```typescript
interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  isLoading: boolean;
}
```

**Subtasks**:

- [x] Create context and provider
- [x] Persist selected org in localStorage
- [x] Auto-select first org on login
- [x] Add to app layout

---

### TASK-2.1.20: Create Organization Switcher Component ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/components/organization/OrganizationSwitcher.tsx` (created)

**Features**:

- [x] Current org badge with logo/name
- [x] Dropdown with all user's organizations
- [x] Show role in each organization
- [x] "Create Organization" button
- [x] Keyboard shortcut support (optional)

**Subtasks**:

- [x] Add to dashboard header
- [x] Handle org switching
- [x] Show loading state

---

### TASK-2.1.21: Update Dashboard to Use Organization Context ✅

**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**Files**: `apps/web/app/dashboard/*`

**Subtasks**:

- [x] Update dashboard to show current org name
- [x] Filter data by current organization
- [x] Update links page to use org context
- [x] Update analytics to use org context

---

### TASK-2.1.22: Enhance Member List UI ✅

**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/app/dashboard/organization/page.tsx`

**Enhancements**:

- [x] Show join date for each member
- [x] Show last active date
- [x] Show links count per member
- [x] Add transfer ownership button (OWNER only)
- [x] Add role-based UI hiding

---

## Phase 3: Testing (Week 4-5)

### TASK-2.1.23: Write Unit Tests for Organization Service ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts`

**Test cases**:

- [x] Organization CRUD operations
- [x] Settings CRUD operations
- [x] Permission checks
- [x] Ownership transfer
- [x] Error handling

---

### TASK-2.1.24: Write Unit Tests for Invitation Service ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/invitations/__tests__/invitations.service.spec.ts` (59 tests)

**Test cases**:

- [x] Create invitation with token
- [x] Accept invitation (existing user)
- [x] Accept invitation (new user)
- [x] Decline invitation
- [x] Resend invitation
- [x] Cancel invitation
- [x] Token expiration
- [x] Duplicate invitation handling

---

### TASK-2.1.25: Write E2E Tests for Organization CRUD ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts` (created)

**Test cases**:

- [x] ORG-WS-001: Create new organization
- [x] ORG-WS-002: Update organization name
- [x] ORG-WS-003: Update organization slug
- [x] ORG-WS-004: Delete organization
- [x] ORG-WS-005: Non-owner cannot delete organization

---

### TASK-2.1.26: Write E2E Tests for Organization Settings ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:

- [x] ORG-WS-010: Upload organization logo
- [x] ORG-WS-011: Update organization timezone
- [x] ORG-WS-012: Update organization description
- [x] ORG-WS-013: Set default domain

---

### TASK-2.1.27: Write E2E Tests for Member Invitation ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test cases**:

- [x] ORG-WS-020: Send invitation to new member
- [x] ORG-WS-021: Accept invitation
- [x] ORG-WS-022: Decline invitation
- [x] ORG-WS-023: Resend invitation
- [x] ORG-WS-024: Cancel invitation
- [x] ORG-WS-025: Invitation expires after 7 days
- [x] ORG-WS-026: Cannot invite existing member

---

### TASK-2.1.28: Write E2E Tests for Member Management ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/member-invite-remove.spec.ts`

**Test cases**:

- [x] ORG-WS-030: View member list
- [x] ORG-WS-031: Update member role
- [x] ORG-WS-032: Remove member
- [x] ORG-WS-033: Transfer ownership
- [x] ORG-WS-034: Cannot remove owner
- [x] ORG-WS-035: VIEWER cannot manage members

---

### TASK-2.1.29: Write E2E Tests for Organization Switcher ✅

**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:

- [x] ORG-WS-040: Switch between organizations
- [x] ORG-WS-041: Persist selected organization
- [x] ORG-WS-042: Organization context in dashboard

---

### TASK-2.1.30: Write E2E Tests for Role-Based Access ✅

**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:

- [x] ORG-WS-050: OWNER can access all settings
- [x] ORG-WS-051: ADMIN can manage members
- [x] ORG-WS-052: EDITOR cannot manage members
- [x] ORG-WS-053: VIEWER has read-only access

---

## Summary

### Total Tasks: 30

### By Priority:

- HIGH: 22 tasks
- MEDIUM: 8 tasks

### By Type:

- Backend: 14 tasks
- Frontend: 8 tasks
- Testing: 8 tasks

### Dependencies:

1. TASK-2.1.1 to 2.1.5 must complete before backend API tasks
2. Backend API tasks must complete before frontend integration
3. Frontend components must complete before E2E tests

### Commands Reference:

```bash
# Database
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:push

# Development
pnpm --filter api dev
pnpm --filter web dev

# Testing
pnpm --filter api test
pnpm --filter web test
npx playwright test --project=chromium
```
