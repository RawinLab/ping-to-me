# Module 2.1: Organization/Workspace - Development Todolist

## Overview
- **Module**: 2.1 Organization/Workspace
- **Current Progress**: ~40-50%
- **Total Estimated Time**: 5 weeks
- **Priority**: HIGH

---

## Phase 1: Database & Schema (Week 1)

### TASK-2.1.1: Update Organization Model in Prisma Schema
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `packages/database/prisma/schema.prisma`

**Subtasks**:
- [ ] Add `logo` field (String, optional) to Organization model
- [ ] Add `description` field (String, optional) to Organization model
- [ ] Add `timezone` field (String, default "UTC") to Organization model
- [ ] Add `dataRetentionDays` field (Int, default 90) to Organization model
- [ ] Add `defaultDomainId` field (String, optional) to Organization model

**Acceptance Criteria**:
- Schema compiles without errors
- Migration runs successfully

---

### TASK-2.1.2: Create OrganizationSettings Model
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
- [ ] Add OrganizationSettings model to schema
- [ ] Add relation to Organization model
- [ ] Run `pnpm --filter @pingtome/database db:generate`

---

### TASK-2.1.3: Create OrganizationInvitation Model
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
- [ ] Add OrganizationInvitation model to schema
- [ ] Add relations to Organization and User models
- [ ] Create indexes for performance

---

### TASK-2.1.4: Update OrganizationMember Model
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 1 hour
**File**: `packages/database/prisma/schema.prisma`

**Fields to add**:
- [ ] Add `joinedAt` field (DateTime, default now())
- [ ] Add `lastActiveAt` field (DateTime, optional)
- [ ] Add `invitedById` field (String, optional)
- [ ] Add relation to invitedBy User

---

### TASK-2.1.5: Run Database Migration
**Priority**: HIGH | **Type**: Backend | **Estimated**: 30 minutes

**Commands**:
```bash
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:push
```

**Subtasks**:
- [ ] Generate Prisma client
- [ ] Push schema to database
- [ ] Verify migration success
- [ ] Test database connections

---

## Phase 1: Backend API Development (Week 1-2)

### TASK-2.1.6: Create Organization Settings DTOs
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**Files**: `apps/api/src/organizations/dto/`

**Subtasks**:
- [ ] Create `get-organization-settings.dto.ts`
- [ ] Create `update-organization-settings.dto.ts`
- [ ] Add validation decorators (class-validator)
- [ ] Add Swagger documentation

---

### TASK-2.1.7: Implement Organization Settings Service Methods
**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to implement**:
- [ ] `getSettings(orgId: string, userId: string): Promise<OrganizationSettings>`
- [ ] `updateSettings(orgId: string, userId: string, dto: UpdateSettingsDto): Promise<OrganizationSettings>`
- [ ] `createDefaultSettings(orgId: string): Promise<OrganizationSettings>`

**Acceptance Criteria**:
- OWNER/ADMIN can update settings
- Default settings created when org is created
- Proper error handling

---

### TASK-2.1.8: Implement Logo Upload Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to implement**:
- [ ] `uploadLogo(orgId: string, userId: string, file: Express.Multer.File): Promise<string>`
- [ ] `deleteLogo(orgId: string, userId: string): Promise<void>`

**Subtasks**:
- [ ] Configure Multer for file upload
- [ ] Validate file type (png, jpg, webp)
- [ ] Validate file size (max 2MB)
- [ ] Store file (local or cloud storage)
- [ ] Delete old logo when uploading new
- [ ] Return logo URL

---

### TASK-2.1.9: Create Organization Settings Controller Endpoints
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/organizations/organization.controller.ts`

**Endpoints to add**:
- [ ] `GET /organizations/:id/settings` - Get org settings
- [ ] `PATCH /organizations/:id/settings` - Update org settings
- [ ] `POST /organizations/:id/logo` - Upload logo
- [ ] `DELETE /organizations/:id/logo` - Remove logo

**Subtasks**:
- [ ] Add JwtAuthGuard
- [ ] Add permission checks (OWNER/ADMIN)
- [ ] Add Swagger documentation
- [ ] Add validation pipes

---

### TASK-2.1.10: Create Invitation Service
**Priority**: HIGH | **Type**: Backend | **Estimated**: 6 hours
**File**: `apps/api/src/organizations/invitation.service.ts` (new file)

**Methods to implement**:
- [ ] `createInvitation(orgId: string, inviterId: string, dto: CreateInvitationDto): Promise<Invitation>`
- [ ] `listPendingInvitations(orgId: string): Promise<Invitation[]>`
- [ ] `getInvitationByToken(token: string): Promise<Invitation>`
- [ ] `acceptInvitation(token: string, userId?: string): Promise<void>`
- [ ] `declineInvitation(token: string): Promise<void>`
- [ ] `resendInvitation(invitationId: string): Promise<void>`
- [ ] `cancelInvitation(invitationId: string): Promise<void>`
- [ ] `generateSecureToken(): string` - Using crypto.randomBytes

**Business Logic**:
- [ ] Token expiration: 7 days
- [ ] Send email on invitation
- [ ] Check if email already invited
- [ ] Check if user already a member
- [ ] Create user account if not exists on accept

---

### TASK-2.1.11: Integrate Email Service for Invitations
**Priority**: HIGH | **Type**: Backend | **Estimated**: 3 hours
**File**: `apps/api/src/mail/mail.service.ts`

**Methods to add**:
- [ ] `sendInvitationEmail(email: string, orgName: string, inviterName: string, token: string, personalMessage?: string): Promise<void>`

**Subtasks**:
- [ ] Create invitation email template
- [ ] Include accept/decline links
- [ ] Include organization name and inviter name
- [ ] Handle personal message

---

### TASK-2.1.12: Create Invitation Controller Endpoints
**Priority**: HIGH | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/invitation.controller.ts` (new file)

**Endpoints to add**:
- [ ] `POST /organizations/:id/invitations` - Send invitation
- [ ] `GET /organizations/:id/invitations` - List pending invitations
- [ ] `POST /organizations/:id/invitations/:invId/resend` - Resend invitation
- [ ] `DELETE /organizations/:id/invitations/:invId` - Cancel invitation
- [ ] `POST /invitations/:token/accept` - Accept invitation (public)
- [ ] `POST /invitations/:token/decline` - Decline invitation (public)
- [ ] `GET /invitations/:token` - Get invitation details (public)

---

### TASK-2.1.13: Enhance Member Management Service
**Priority**: MEDIUM | **Type**: Backend | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/organization.service.ts`

**Methods to update/add**:
- [ ] `getMembers()` - Include joinedAt, lastActiveAt, linksCount
- [ ] `transferOwnership(orgId: string, currentOwnerId: string, newOwnerId: string): Promise<void>`
- [ ] `updateMemberLastActive(orgId: string, userId: string): Promise<void>`
- [ ] `getMemberLinksCount(orgId: string, userId: string): Promise<number>`

---

### TASK-2.1.14: Add Transfer Ownership Endpoint
**Priority**: HIGH | **Type**: Backend | **Estimated**: 2 hours
**File**: `apps/api/src/organizations/organization.controller.ts`

**Endpoint**:
- [ ] `POST /organizations/:id/transfer-ownership`

**Business Logic**:
- [ ] Only OWNER can transfer
- [ ] New owner must be existing member
- [ ] Previous owner becomes ADMIN

---

## Phase 2: Frontend Development (Week 2-3)

### TASK-2.1.15: Create Organization Settings Page
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 6 hours
**File**: `apps/web/app/dashboard/organization/[id]/settings/page.tsx` (new)

**Components to build**:
- [ ] GeneralSettingsCard (name, slug, description)
- [ ] BrandingCard (logo upload)
- [ ] PreferencesCard (timezone, data retention, default domain)
- [ ] SecurityCard (2FA enforcement, session timeout) - OWNER only
- [ ] DangerZoneCard (transfer ownership, delete org) - OWNER only

**Subtasks**:
- [ ] Create form with react-hook-form
- [ ] Add validation with zod
- [ ] Implement logo upload with preview
- [ ] Add timezone picker component
- [ ] Add success/error toasts
- [ ] Handle loading states

---

### TASK-2.1.16: Create Logo Upload Component
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/components/organization/LogoUploader.tsx` (new)

**Features**:
- [ ] Drag and drop support
- [ ] File type validation (png, jpg, webp)
- [ ] File size validation (max 2MB)
- [ ] Preview before upload
- [ ] Remove logo option
- [ ] Loading state during upload

---

### TASK-2.1.17: Create Invitation Management UI
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 6 hours
**File**: `apps/web/components/organization/InvitationManager.tsx` (new)

**Components to build**:
- [ ] InviteMemberDialog (enhanced from existing)
  - [ ] Email input
  - [ ] Role selector
  - [ ] Personal message textarea
  - [ ] Validation
- [ ] PendingInvitationsList
  - [ ] Invitation cards with email, role, expiry
  - [ ] Resend button
  - [ ] Cancel button with confirmation

---

### TASK-2.1.18: Create Invitation Acceptance Page
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/app/invitations/[token]/page.tsx` (new)

**Features**:
- [ ] Display organization info (name, logo)
- [ ] Display inviter info (name)
- [ ] Display assigned role
- [ ] Display personal message if exists
- [ ] Accept button
- [ ] Decline button
- [ ] Registration form for new users
- [ ] Handle expired/invalid tokens
- [ ] Redirect after acceptance

---

### TASK-2.1.19: Create OrganizationContext
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/contexts/OrganizationContext.tsx` (new)

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
- [ ] Create context and provider
- [ ] Persist selected org in localStorage
- [ ] Auto-select first org on login
- [ ] Add to app layout

---

### TASK-2.1.20: Create Organization Switcher Component
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 4 hours
**File**: `apps/web/components/organization/OrganizationSwitcher.tsx` (new)

**Features**:
- [ ] Current org badge with logo/name
- [ ] Dropdown with all user's organizations
- [ ] Show role in each organization
- [ ] "Create Organization" button
- [ ] Keyboard shortcut support (optional)

**Subtasks**:
- [ ] Add to dashboard header
- [ ] Handle org switching
- [ ] Show loading state

---

### TASK-2.1.21: Update Dashboard to Use Organization Context
**Priority**: HIGH | **Type**: Frontend | **Estimated**: 3 hours
**Files**: `apps/web/app/dashboard/*`

**Subtasks**:
- [ ] Update dashboard to show current org name
- [ ] Filter data by current organization
- [ ] Update links page to use org context
- [ ] Update analytics to use org context

---

### TASK-2.1.22: Enhance Member List UI
**Priority**: MEDIUM | **Type**: Frontend | **Estimated**: 3 hours
**File**: `apps/web/app/dashboard/organization/page.tsx`

**Enhancements**:
- [ ] Show join date for each member
- [ ] Show last active date
- [ ] Show links count per member
- [ ] Add transfer ownership button (OWNER only)
- [ ] Add role-based UI hiding

---

## Phase 3: Testing (Week 4-5)

### TASK-2.1.23: Write Unit Tests for Organization Service
**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/__tests__/organization.service.spec.ts`

**Test cases**:
- [ ] Organization CRUD operations
- [ ] Settings CRUD operations
- [ ] Permission checks
- [ ] Ownership transfer
- [ ] Error handling

---

### TASK-2.1.24: Write Unit Tests for Invitation Service
**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/api/src/organizations/__tests__/invitation.service.spec.ts`

**Test cases**:
- [ ] Create invitation with token
- [ ] Accept invitation (existing user)
- [ ] Accept invitation (new user)
- [ ] Decline invitation
- [ ] Resend invitation
- [ ] Cancel invitation
- [ ] Token expiration
- [ ] Duplicate invitation handling

---

### TASK-2.1.25: Write E2E Tests for Organization CRUD
**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts` (new)

**Test cases**:
- [ ] ORG-WS-001: Create new organization
- [ ] ORG-WS-002: Update organization name
- [ ] ORG-WS-003: Update organization slug
- [ ] ORG-WS-004: Delete organization
- [ ] ORG-WS-005: Non-owner cannot delete organization

---

### TASK-2.1.26: Write E2E Tests for Organization Settings
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:
- [ ] ORG-WS-010: Upload organization logo
- [ ] ORG-WS-011: Update organization timezone
- [ ] ORG-WS-012: Update organization description
- [ ] ORG-WS-013: Set default domain

---

### TASK-2.1.27: Write E2E Tests for Member Invitation
**Priority**: HIGH | **Type**: Testing | **Estimated**: 4 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:
- [ ] ORG-WS-020: Send invitation to new member
- [ ] ORG-WS-021: Accept invitation
- [ ] ORG-WS-022: Decline invitation
- [ ] ORG-WS-023: Resend invitation
- [ ] ORG-WS-024: Cancel invitation
- [ ] ORG-WS-025: Invitation expires after 7 days
- [ ] ORG-WS-026: Cannot invite existing member

---

### TASK-2.1.28: Write E2E Tests for Member Management
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:
- [ ] ORG-WS-030: View member list
- [ ] ORG-WS-031: Update member role
- [ ] ORG-WS-032: Remove member
- [ ] ORG-WS-033: Transfer ownership
- [ ] ORG-WS-034: Cannot remove owner
- [ ] ORG-WS-035: VIEWER cannot manage members

---

### TASK-2.1.29: Write E2E Tests for Organization Switcher
**Priority**: MEDIUM | **Type**: Testing | **Estimated**: 2 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:
- [ ] ORG-WS-040: Switch between organizations
- [ ] ORG-WS-041: Persist selected organization
- [ ] ORG-WS-042: Organization context in dashboard

---

### TASK-2.1.30: Write E2E Tests for Role-Based Access
**Priority**: HIGH | **Type**: Testing | **Estimated**: 3 hours
**File**: `apps/web/e2e/organization-workspace.spec.ts`

**Test cases**:
- [ ] ORG-WS-050: OWNER can access all settings
- [ ] ORG-WS-051: ADMIN can manage members
- [ ] ORG-WS-052: EDITOR cannot manage members
- [ ] ORG-WS-053: VIEWER has read-only access

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
