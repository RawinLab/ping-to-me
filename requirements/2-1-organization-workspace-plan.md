# Module 2.1: Organization/Workspace Development Plan

## Document Information

- **Module**: 2.1 Organization/Workspace
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM

---

## 1. Executive Summary

### Current State Analysis

จากการ explore codebase พบว่า Organization/Workspace module มีการ implement แล้วประมาณ **40-50%** ของ specification

**Implemented Features:**

- Organization CRUD (create, list, get, update, delete)
- Basic member management (add, remove, update role)
- Permission checking (basic)
- Frontend UI for organization management

**Missing Features:**

- Proper invitation system with email
- Organization settings (logo, timezone, description)
- Member metadata (join date, last active, links count)
- Security enforcement (2FA, IP allowlist)
- Audit logging integration
- Organization switcher UX

---

## 2. Feature Breakdown

### 2.1.1 Organization Settings (Priority: HIGH)

**Description:** Extended organization configuration beyond basic name/slug

| Feature                   | Status          | Priority |
| ------------------------- | --------------- | -------- |
| Organization name & slug  | Implemented     | -        |
| Organization logo/avatar  | NOT IMPLEMENTED | HIGH     |
| Organization description  | NOT IMPLEMENTED | MEDIUM   |
| Timezone configuration    | Schema only     | HIGH     |
| Data retention policy     | NOT IMPLEMENTED | MEDIUM   |
| Default domain selection  | NOT IMPLEMENTED | HIGH     |
| IP allowlist (enterprise) | Schema only     | LOW      |
| SSO configuration         | Schema only     | LOW      |

**API Endpoints Required:**

```
GET  /organizations/:id/settings       - Get org settings
PATCH /organizations/:id/settings      - Update org settings
POST /organizations/:id/logo           - Upload org logo
DELETE /organizations/:id/logo         - Remove org logo
```

**Database Schema Changes:**

```prisma
model Organization {
  // Existing fields...
  logo          String?
  description   String?
  timezone      String   @default("UTC")
  dataRetentionDays Int  @default(90)
  defaultDomainId String?
}

model OrganizationSettings {
  id              String @id @default(uuid())
  organizationId  String @unique
  ipAllowlist     Json?  // Array of IP/CIDR
  ssoEnabled      Boolean @default(false)
  ssoProviderId   String?
  enforced2FA     Boolean @default(false)
  sessionTimeout  Int     @default(7200) // seconds
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
}
```

### 2.1.2 Member Invitation System (Priority: HIGH)

**Description:** Proper email-based invitation workflow

| Feature                    | Status          | Priority |
| -------------------------- | --------------- | -------- |
| Send invitation by email   | NOT IMPLEMENTED | HIGH     |
| Invitation expiry (7 days) | NOT IMPLEMENTED | HIGH     |
| Accept invitation          | NOT IMPLEMENTED | HIGH     |
| Decline invitation         | NOT IMPLEMENTED | MEDIUM   |
| Resend invitation          | NOT IMPLEMENTED | MEDIUM   |
| Cancel invitation          | NOT IMPLEMENTED | MEDIUM   |
| Pending invitations list   | NOT IMPLEMENTED | HIGH     |
| Bulk invite                | NOT IMPLEMENTED | LOW      |

**API Endpoints Required:**

```
POST   /organizations/:id/invitations           - Send invitation
GET    /organizations/:id/invitations           - List pending invitations
GET    /organizations/:id/invitations/:id       - Get invitation details
POST   /organizations/:id/invitations/:id/resend  - Resend invitation
DELETE /organizations/:id/invitations/:id       - Cancel invitation
POST   /invitations/:token/accept               - Accept invitation (public)
POST   /invitations/:token/decline              - Decline invitation (public)
```

**Database Schema:**

```prisma
model OrganizationInvitation {
  id              String    @id @default(uuid())
  organizationId  String
  email           String
  role            MemberRole @default(VIEWER)
  token           String    @unique
  invitedById     String
  personalMessage String?
  expiresAt       DateTime
  acceptedAt      DateTime?
  declinedAt      DateTime?
  createdAt       DateTime  @default(now())

  organization    Organization @relation(fields: [organizationId], references: [id])
  invitedBy       User @relation(fields: [invitedById], references: [id])

  @@unique([organizationId, email])
  @@index([token])
  @@index([expiresAt])
}
```

### 2.1.3 Member Management Enhancement (Priority: MEDIUM)

**Description:** Enhanced member information and management

| Feature                 | Status          | Priority |
| ----------------------- | --------------- | -------- |
| View member list        | Implemented     | -        |
| Update member role      | Implemented     | -        |
| Remove member           | Implemented     | -        |
| Member join date        | NOT IMPLEMENTED | MEDIUM   |
| Member last active date | NOT IMPLEMENTED | MEDIUM   |
| Member links count      | NOT IMPLEMENTED | LOW      |
| Transfer ownership      | NOT IMPLEMENTED | HIGH     |
| Bulk role update        | NOT IMPLEMENTED | LOW      |

**API Endpoints Enhancement:**

```
GET    /organizations/:id/members           - Enhanced with metadata
PATCH  /organizations/:id/members/:userId   - Update role
DELETE /organizations/:id/members/:userId   - Remove member
POST   /organizations/:id/transfer-ownership - Transfer to another owner
GET    /organizations/:id/members/:userId/activity - Member activity
```

**Database Schema Changes:**

```prisma
model OrganizationMember {
  // Existing fields...
  joinedAt       DateTime @default(now())
  lastActiveAt   DateTime?
  invitedById    String?

  invitedBy      User? @relation("InvitedBy", fields: [invitedById], references: [id])
}
```

### 2.1.4 Organization Switcher UX (Priority: MEDIUM)

**Description:** Improved UX for switching between organizations

| Feature                           | Status          | Priority |
| --------------------------------- | --------------- | -------- |
| Organization dropdown in header   | NOT IMPLEMENTED | HIGH     |
| Quick switcher (CMD+K)            | NOT IMPLEMENTED | LOW      |
| Recent organizations              | NOT IMPLEMENTED | LOW      |
| Organization context in dashboard | NOT IMPLEMENTED | HIGH     |
| Persist selected organization     | NOT IMPLEMENTED | MEDIUM   |

**Frontend Components:**

```
- OrganizationSwitcher (header dropdown)
- OrganizationContext (React context for current org)
- OrganizationBadge (show current org in header)
- OrganizationPicker (modal for switching)
```

### 2.1.5 Organization Branding (Priority: LOW)

**Description:** Custom branding for organization workspace

| Feature               | Status          | Priority |
| --------------------- | --------------- | -------- |
| Organization logo     | NOT IMPLEMENTED | MEDIUM   |
| Primary color         | NOT IMPLEMENTED | LOW      |
| Custom favicon        | NOT IMPLEMENTED | LOW      |
| Link preview branding | NOT IMPLEMENTED | LOW      |

---

## 3. Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### Backend Tasks

1. **Database Schema Updates**
   - Add missing fields to Organization model
   - Create OrganizationSettings model
   - Create OrganizationInvitation model
   - Run migrations

2. **Organization Settings API**
   - Create DTOs for settings CRUD
   - Implement settings service methods
   - Create settings controller endpoints
   - Add file upload for logo

3. **Invitation System Backend**
   - Create invitation service
   - Implement email sending (integration with email service)
   - Create token generation and validation
   - Implement invitation CRUD endpoints

#### Frontend Tasks

1. **Organization Settings Page**
   - Create `/dashboard/organization/settings` page
   - Build settings form (name, slug, description, timezone)
   - Add logo upload component
   - Implement timezone picker

2. **Invitation Management UI**
   - Create invitation form component
   - Build pending invitations list
   - Create invitation email preview
   - Add resend/cancel actions

### Phase 2: Enhancement (Week 3-4)

#### Backend Tasks

1. **Member Management Enhancement**
   - Add join date and last active tracking
   - Create member activity aggregation
   - Implement ownership transfer
   - Add member links count query

2. **Security Integration**
   - Add organization-level 2FA enforcement
   - Implement session timeout settings
   - Create IP allowlist validation

#### Frontend Tasks

1. **Organization Switcher**
   - Create OrganizationContext
   - Build header organization switcher
   - Implement organization persistence
   - Add organization badge in sidebar

2. **Enhanced Member Management**
   - Show member metadata (join date, activity)
   - Add ownership transfer UI
   - Create member activity view

### Phase 3: Polish (Week 5)

#### Tasks

1. **Integration Testing**
   - Verify all API endpoints
   - Test email delivery
   - Test role-based access

2. **E2E Testing**
   - Organization CRUD flows
   - Invitation workflows
   - Settings management

3. **Documentation**
   - API documentation
   - User guide for organization management

---

## 4. Test Cases

### 4.1 Unit Tests (Backend)

#### Organization Service Tests

```typescript
describe("OrganizationService", () => {
  describe("create", () => {
    it("should create organization and add creator as OWNER");
    it("should generate unique slug if not provided");
    it("should fail if slug already exists");
  });

  describe("update", () => {
    it("should update organization name");
    it("should update organization slug");
    it("should fail if user is not OWNER or ADMIN");
    it("should fail if new slug already exists");
  });

  describe("delete", () => {
    it("should soft delete organization");
    it("should fail if user is not OWNER");
    it("should cascade delete members");
  });

  describe("getSettings", () => {
    it("should return organization settings");
    it("should create default settings if not exist");
  });

  describe("updateSettings", () => {
    it("should update organization timezone");
    it("should update data retention policy");
    it("should update logo URL");
    it("should fail if user is not OWNER or ADMIN");
  });
});

describe("OrganizationMemberService", () => {
  describe("getMembers", () => {
    it("should return members with user details");
    it("should include join date and last active");
    it("should include member links count");
    it("should fail if user is not member");
  });

  describe("updateRole", () => {
    it("should update member role");
    it("should fail if trying to demote OWNER");
    it("should fail if user is not OWNER or ADMIN");
  });

  describe("removeMember", () => {
    it("should remove member from organization");
    it("should fail if removing OWNER");
    it("should fail if user is not OWNER or ADMIN");
  });

  describe("transferOwnership", () => {
    it("should transfer ownership to another member");
    it("should demote previous owner to ADMIN");
    it("should fail if target is not a member");
    it("should fail if user is not OWNER");
  });
});

describe("InvitationService", () => {
  describe("create", () => {
    it("should create invitation with unique token");
    it("should set expiration to 7 days");
    it("should send invitation email");
    it("should fail if email already invited");
    it("should fail if user already a member");
    it("should fail if user is not OWNER or ADMIN");
  });

  describe("accept", () => {
    it("should add user to organization");
    it("should mark invitation as accepted");
    it("should fail if invitation expired");
    it("should fail if invitation already accepted");
    it("should create new user if not exists");
  });

  describe("decline", () => {
    it("should mark invitation as declined");
    it("should fail if invitation expired");
  });

  describe("resend", () => {
    it("should reset expiration date");
    it("should resend invitation email");
    it("should fail if invitation already accepted");
  });

  describe("cancel", () => {
    it("should delete invitation");
    it("should fail if invitation already accepted");
  });

  describe("listPending", () => {
    it("should return pending invitations");
    it("should not return expired invitations");
    it("should not return accepted invitations");
  });
});
```

#### Organization Settings Tests

```typescript
describe("OrganizationSettingsService", () => {
  describe("uploadLogo", () => {
    it("should upload logo and return URL");
    it("should delete old logo when uploading new");
    it("should validate file type (png, jpg, webp)");
    it("should validate file size (max 2MB)");
  });

  describe("updateTimezone", () => {
    it("should update timezone");
    it("should validate timezone string");
  });

  describe("updateDataRetention", () => {
    it("should update data retention days");
    it("should enforce minimum based on plan");
  });

  describe("updateIpAllowlist", () => {
    it("should update IP allowlist");
    it("should validate IP/CIDR format");
    it("should fail if not enterprise plan");
  });
});
```

### 4.2 E2E Tests

#### File: `apps/web/e2e/organization-workspace.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Organization Workspace", () => {
  test.describe("Organization CRUD", () => {
    test("ORG-WS-001: Create new organization", async ({ page }) => {
      // 1. Login as authenticated user
      // 2. Navigate to /dashboard/organization
      // 3. Click "Create Organization" button
      // 4. Fill in organization name and slug
      // 5. Submit form
      // 6. Verify organization appears in list
      // 7. Verify user is OWNER
    });

    test("ORG-WS-002: Update organization name", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Update organization name
      // 4. Save changes
      // 5. Verify name updated
    });

    test("ORG-WS-003: Update organization slug", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Update organization slug
      // 4. Save changes
      // 5. Verify slug updated
      // 6. Verify navigation uses new slug
    });

    test("ORG-WS-004: Delete organization", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Click delete organization
      // 4. Confirm deletion
      // 5. Verify organization removed from list
    });

    test("ORG-WS-005: Non-owner cannot delete organization", async ({
      page,
    }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization settings
      // 3. Verify delete button not visible or disabled
    });
  });

  test.describe("Organization Settings", () => {
    test("ORG-WS-010: Upload organization logo", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Upload logo image
      // 4. Verify logo preview
      // 5. Save changes
      // 6. Verify logo displayed in organization list
    });

    test("ORG-WS-011: Update organization timezone", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization settings
      // 3. Select new timezone from dropdown
      // 4. Save changes
      // 5. Verify timezone updated
    });

    test("ORG-WS-012: Update organization description", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization settings
      // 3. Update description
      // 4. Save changes
      // 5. Verify description saved
    });

    test("ORG-WS-013: Set default domain", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Select default domain from dropdown
      // 4. Save changes
      // 5. Verify default domain used in link creation
    });
  });

  test.describe("Member Invitation", () => {
    test("ORG-WS-020: Send invitation to new member", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization members
      // 3. Click "Invite Member"
      // 4. Enter email and select role
      // 5. Submit invitation
      // 6. Verify invitation appears in pending list
    });

    test("ORG-WS-021: Accept invitation", async ({ page }) => {
      // 1. Create invitation via API
      // 2. Open invitation link
      // 3. Login/register as invited user
      // 4. Verify user added to organization
      // 5. Verify role matches invitation
    });

    test("ORG-WS-022: Decline invitation", async ({ page }) => {
      // 1. Create invitation via API
      // 2. Open invitation link
      // 3. Click decline button
      // 4. Verify invitation marked as declined
      // 5. Verify user not added to organization
    });

    test("ORG-WS-023: Resend invitation", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to pending invitations
      // 3. Click resend on invitation
      // 4. Verify new email sent
      // 5. Verify expiration reset
    });

    test("ORG-WS-024: Cancel invitation", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to pending invitations
      // 3. Click cancel on invitation
      // 4. Confirm cancellation
      // 5. Verify invitation removed from list
    });

    test("ORG-WS-025: Invitation expires after 7 days", async ({ page }) => {
      // 1. Create invitation with past expiration via DB
      // 2. Try to accept invitation
      // 3. Verify error message about expiration
    });

    test("ORG-WS-026: Cannot invite existing member", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to invite member
      // 3. Enter email of existing member
      // 4. Submit invitation
      // 5. Verify error message
    });
  });

  test.describe("Member Management", () => {
    test("ORG-WS-030: View member list", async ({ page }) => {
      // 1. Login as member
      // 2. Navigate to organization members
      // 3. Verify member list displayed
      // 4. Verify member details (name, email, role, join date)
    });

    test("ORG-WS-031: Update member role", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization members
      // 3. Change member role via dropdown
      // 4. Verify role updated
    });

    test("ORG-WS-032: Remove member", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization members
      // 3. Click remove on member
      // 4. Confirm removal
      // 5. Verify member removed from list
    });

    test("ORG-WS-033: Transfer ownership", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization settings
      // 3. Click transfer ownership
      // 4. Select new owner
      // 5. Confirm transfer
      // 6. Verify new owner has OWNER role
      // 7. Verify previous owner is now ADMIN
    });

    test("ORG-WS-034: Cannot remove owner", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization members
      // 3. Verify remove button not shown for OWNER
    });

    test("ORG-WS-035: VIEWER cannot manage members", async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Navigate to organization members
      // 3. Verify no edit/remove buttons visible
    });
  });

  test.describe("Organization Switcher", () => {
    test("ORG-WS-040: Switch between organizations", async ({ page }) => {
      // 1. Login as user with multiple organizations
      // 2. Verify organization switcher in header
      // 3. Click switcher
      // 4. Select different organization
      // 5. Verify dashboard shows selected org data
    });

    test("ORG-WS-041: Persist selected organization", async ({ page }) => {
      // 1. Login and select organization
      // 2. Navigate to different page
      // 3. Verify selected organization persists
      // 4. Refresh page
      // 5. Verify selected organization still active
    });

    test("ORG-WS-042: Organization context in dashboard", async ({ page }) => {
      // 1. Login and select organization
      // 2. Navigate to dashboard
      // 3. Verify organization name shown
      // 4. Verify stats are for selected organization
    });
  });

  test.describe("Role-Based Access", () => {
    test("ORG-WS-050: OWNER can access all settings", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Verify access to organization settings
      // 3. Verify access to member management
      // 4. Verify access to danger zone (delete)
    });

    test("ORG-WS-051: ADMIN can manage members", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Verify access to member management
      // 3. Verify can invite members
      // 4. Verify cannot delete organization
    });

    test("ORG-WS-052: EDITOR cannot manage members", async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Navigate to organization
      // 3. Verify member management restricted
    });

    test("ORG-WS-053: VIEWER has read-only access", async ({ page }) => {
      // 1. Login as VIEWER
      // 2. Navigate to organization
      // 3. Verify can view members
      // 4. Verify cannot make changes
    });
  });
});
```

### 4.3 Integration Tests

```typescript
describe("Organization Integration Tests", () => {
  describe("Invitation Email Flow", () => {
    it("should send email when invitation created");
    it("should include correct invitation link");
    it("should include inviter name and org name");
  });

  describe("Organization Cascade Operations", () => {
    it("should cascade delete members when org deleted");
    it("should cascade delete invitations when org deleted");
    it("should NOT cascade delete links (soft delete)");
  });

  describe("Permission Matrix", () => {
    it("OWNER can perform all operations");
    it("ADMIN can manage members but not delete org");
    it("EDITOR can only view org and members");
    it("VIEWER can only view org and members");
  });
});
```

---

## 5. API Specification

### 5.1 Organization Settings Endpoints

#### GET /organizations/:id/settings

```yaml
description: Get organization settings
auth: Required (member of organization)
response:
  200:
    content:
      id: string
      name: string
      slug: string
      logo: string | null
      description: string | null
      timezone: string
      dataRetentionDays: number
      defaultDomainId: string | null
      settings:
        ipAllowlist: string[] | null
        ssoEnabled: boolean
        enforced2FA: boolean
        sessionTimeout: number
```

#### PATCH /organizations/:id/settings

```yaml
description: Update organization settings
auth: Required (OWNER or ADMIN)
body:
  name?: string
  slug?: string
  description?: string
  timezone?: string
  dataRetentionDays?: number
  defaultDomainId?: string
response:
  200: Updated organization
  400: Validation error
  403: Insufficient permissions
```

#### POST /organizations/:id/logo

```yaml
description: Upload organization logo
auth: Required (OWNER or ADMIN)
body:
  file: multipart/form-data (image/png, image/jpeg, image/webp)
  maxSize: 2MB
response:
  200:
    logoUrl: string
  400: Invalid file type or size
```

### 5.2 Invitation Endpoints

#### POST /organizations/:id/invitations

```yaml
description: Send invitation to email
auth: Required (OWNER or ADMIN)
body:
  email: string (required)
  role: MemberRole (default: VIEWER)
  personalMessage?: string
response:
  201:
    id: string
    email: string
    role: string
    expiresAt: string
    createdAt: string
  400: Email already invited
  409: User already a member
```

#### GET /organizations/:id/invitations

```yaml
description: List pending invitations
auth: Required (OWNER or ADMIN)
response:
  200:
    items:
      - id: string
        email: string
        role: string
        invitedBy:
          id: string
          name: string
        expiresAt: string
        createdAt: string
    total: number
```

#### POST /invitations/:token/accept

```yaml
description: Accept invitation (public endpoint)
auth: Optional (creates account if not logged in)
body:
  name?: string (required if not logged in)
  password?: string (required if not logged in)
response:
  200:
    organization:
      id: string
      name: string
    role: string
  400: Invalid or expired token
  409: Already a member
```

### 5.3 Member Enhancement Endpoints

#### GET /organizations/:id/members

```yaml
description: List organization members with metadata
auth: Required (member of organization)
response:
  200:
    items:
      - userId: string
        user:
          id: string
          name: string
          email: string
          avatar: string | null
        role: MemberRole
        joinedAt: string
        lastActiveAt: string | null
        linksCount: number
        invitedBy:
          id: string
          name: string
    total: number
```

#### POST /organizations/:id/transfer-ownership

```yaml
description: Transfer organization ownership
auth: Required (OWNER only)
body:
  newOwnerId: string (required)
response:
  200:
    message: "Ownership transferred successfully"
  400: Target is not a member
  403: Not the owner
```

---

## 6. Frontend Components Specification

### 6.1 Organization Settings Page

**Route:** `/dashboard/organization/[id]/settings`

**Components:**

```
OrganizationSettingsPage
├── GeneralSettingsCard
│   ├── OrganizationNameInput
│   ├── OrganizationSlugInput
│   └── OrganizationDescriptionTextarea
├── BrandingCard
│   ├── LogoUploader
│   └── LogoPreview
├── PreferencesCard
│   ├── TimezoneSelector
│   ├── DataRetentionSelector
│   └── DefaultDomainSelector
├── SecurityCard (OWNER only)
│   ├── Enforce2FAToggle
│   ├── SessionTimeoutSelector
│   └── IPAllowlistManager
└── DangerZoneCard (OWNER only)
    ├── TransferOwnershipButton
    └── DeleteOrganizationButton
```

### 6.2 Invitation Management

**Components:**

```
InvitationManager
├── InviteMemberDialog
│   ├── EmailInput
│   ├── RoleSelector
│   ├── PersonalMessageInput
│   └── SendButton
├── PendingInvitationsList
│   └── InvitationCard
│       ├── InviteeEmail
│       ├── InvitedRole
│       ├── ExpirationCountdown
│       ├── ResendButton
│       └── CancelButton
└── InvitationAcceptPage (public)
    ├── OrganizationInfo
    ├── InviterInfo
    ├── AcceptButton
    └── DeclineButton
```

### 6.3 Organization Switcher

**Components:**

```
OrganizationSwitcher
├── CurrentOrgBadge
│   ├── OrgLogo
│   └── OrgName
├── OrgDropdown
│   ├── OrgList
│   │   └── OrgItem
│   │       ├── OrgLogo
│   │       ├── OrgName
│   │       └── MemberRole
│   ├── Divider
│   └── CreateOrgButton
└── OrganizationContext (React Context)
    ├── currentOrg
    ├── setCurrentOrg
    ├── organizations
    └── refreshOrganizations
```

---

## 7. Research Recommendations

จากการ research best practices จาก Bitly, Short.io, Rebrandly และ industry standards พบ features เพิ่มเติมที่ควรพิจารณา:

### High Priority (Recommended)

1. **Audit Logs Integration** - Track all organization changes
2. **Workspace-level Default Settings** - Default UTM params, tags
3. **Member Request/Approval Workflow** - Allow users to request joining
4. **Per-Organization Resource Quotas** - Track usage limits

### Medium Priority

5. **Role Hierarchy with Inheritance** - Simplified permission model
6. **Organization Member Activity Timeline** - Recent actions by team
7. **Notification Preferences at Org Level** - Organization-wide defaults

### Lower Priority (Enterprise)

8. **Team/Department Sub-organizations** - Nested structures
9. **White-Label Capabilities** - Custom branding
10. **SSO & SCIM Integration** - Enterprise identity management

---

## 8. Dependencies

### External Dependencies

- Email service integration (for invitations)
- File storage (for logo upload)
- Timezone database (for timezone picker)

### Internal Dependencies

- Auth module (JWT, user management)
- Notification module (for invitation emails)
- Audit module (for logging changes)

---

## 9. Risks & Mitigations

| Risk                   | Impact                         | Mitigation                              |
| ---------------------- | ------------------------------ | --------------------------------------- |
| Email delivery failure | Invitations not received       | Implement retry logic, allow resend     |
| Token security         | Invitation hijacking           | Use secure random tokens, short expiry  |
| Data migration         | Existing orgs missing settings | Create default settings on first access |
| Performance            | Large member lists slow        | Implement pagination, caching           |
| Concurrent edits       | Data conflicts                 | Implement optimistic locking            |

---

## 10. Success Metrics

- **Invitation acceptance rate** > 70%
- **Average time to accept** < 24 hours
- **Organization creation rate** increase by 20%
- **Member management operations** < 500ms response time
- **Zero security incidents** from invitation system

---

## 11. Timeline Summary

| Phase     | Duration    | Deliverables                              |
| --------- | ----------- | ----------------------------------------- |
| Phase 1   | 2 weeks     | Organization settings, Invitation system  |
| Phase 2   | 2 weeks     | Member enhancement, Organization switcher |
| Phase 3   | 1 week      | Testing, Documentation                    |
| **Total** | **5 weeks** | Complete Module 2.1                       |

---

## Appendix A: Current Implementation Files

**Backend:**

- `apps/api/src/organizations/organization.controller.ts`
- `apps/api/src/organizations/organization.service.ts`
- `apps/api/src/organizations/organization.module.ts`

**Frontend:**

- `apps/web/app/dashboard/organization/page.tsx`
- `apps/web/app/dashboard/settings/team/page.tsx`
- `apps/web/components/InviteMemberModal.tsx`

**Database:**

- `packages/database/prisma/schema.prisma` (Organization, OrganizationMember)

---

## Appendix B: References

1. Bitly Dashboard Features - https://bitly.com/blog/bitly-dashboard/
2. Short.io Team Management - https://blog.short.io/
3. Rebrandly Workspaces - https://www.rebrandly.com/collaborate-workspaces
4. Multi-tenant SaaS Architecture - WorkOS Guide
5. Enterprise Audit Logging - enterpriseready.io
