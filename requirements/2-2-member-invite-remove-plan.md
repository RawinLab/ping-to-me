# Module 2.2: Member Invite/Remove Development Plan

## Document Information

- **Module**: 2.2 Member Invite/Remove
- **Version**: 1.0
- **Created**: 2025-12-07
- **Author**: System Analyst / PM
- **Dependencies**: Module 2.1 (Organization/Workspace)

---

## 1. Executive Summary

### Current State Analysis

จากการ explore codebase พบว่า Member Invite/Remove มีการ implement แบบ **basic/MVP** ประมาณ **30-40%**

**Current Implementation:**

- Direct member addition (requires existing user)
- Basic member removal
- Role update functionality
- No email notifications
- No token-based invitation system

**Major Gaps:**

- No `OrganizationInvitation` table in database
- No email sending for invitations
- No token-based acceptance flow
- No invitation expiry mechanism
- No pending invitations management
- No bulk invitation support

---

## 2. Feature Breakdown

### 2.2.1 Invitation System Core (Priority: HIGH)

**Description:** Token-based email invitation with acceptance flow

| Feature                              | Status          | Priority |
| ------------------------------------ | --------------- | -------- |
| Send invitation by email             | NOT IMPLEMENTED | HIGH     |
| Generate secure token                | NOT IMPLEMENTED | HIGH     |
| Invitation expiry (7 days)           | NOT IMPLEMENTED | HIGH     |
| Accept invitation                    | NOT IMPLEMENTED | HIGH     |
| Decline invitation                   | NOT IMPLEMENTED | MEDIUM   |
| Create account on accept (new users) | NOT IMPLEMENTED | HIGH     |
| Personal message in invite           | NOT IMPLEMENTED | MEDIUM   |

**API Endpoints Required:**

```
POST   /organizations/:id/invitations           - Create & send invitation
POST   /invitations/:token/accept               - Accept invitation (public)
POST   /invitations/:token/decline              - Decline invitation (public)
GET    /invitations/:token                      - Get invitation details (public)
```

**Database Schema:**

```prisma
model OrganizationInvitation {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId  String     @db.Uuid
  email           String
  role            MemberRole @default(VIEWER)
  token           String     @unique
  tokenHash       String     // Store hashed token for security
  invitedById     String     @db.Uuid
  personalMessage String?
  expiresAt       DateTime
  acceptedAt      DateTime?
  declinedAt      DateTime?
  createdAt       DateTime   @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invitedBy    User         @relation("SentInvitations", fields: [invitedById], references: [id])

  @@unique([organizationId, email])
  @@index([token])
  @@index([tokenHash])
  @@index([expiresAt])
  @@index([email])
}
```

### 2.2.2 Invitation Management (Priority: HIGH)

**Description:** Admin interface for managing pending invitations

| Feature                  | Status          | Priority |
| ------------------------ | --------------- | -------- |
| List pending invitations | NOT IMPLEMENTED | HIGH     |
| Resend invitation        | NOT IMPLEMENTED | HIGH     |
| Cancel invitation        | NOT IMPLEMENTED | HIGH     |
| View invitation status   | NOT IMPLEMENTED | MEDIUM   |
| Invitation history       | NOT IMPLEMENTED | LOW      |

**API Endpoints Required:**

```
GET    /organizations/:id/invitations           - List pending invitations
GET    /organizations/:id/invitations/:id       - Get invitation details
POST   /organizations/:id/invitations/:id/resend - Resend invitation
DELETE /organizations/:id/invitations/:id       - Cancel invitation
GET    /organizations/:id/invitations/history   - Invitation history (accepted/declined)
```

### 2.2.3 Member Removal Enhancement (Priority: MEDIUM)

**Description:** Enhanced member removal with proper offboarding

| Feature                  | Status          | Priority |
| ------------------------ | --------------- | -------- |
| Remove member (basic)    | Implemented     | -        |
| Confirmation dialog      | NOT IMPLEMENTED | HIGH     |
| Transfer links ownership | NOT IMPLEMENTED | MEDIUM   |
| Notify removed member    | NOT IMPLEMENTED | LOW      |
| Grace period option      | NOT IMPLEMENTED | LOW      |
| Audit log integration    | NOT IMPLEMENTED | MEDIUM   |

**API Endpoints Required:**

```
DELETE /organizations/:id/members/:userId              - Remove member (existing)
POST   /organizations/:id/members/:userId/transfer     - Transfer member's assets
GET    /organizations/:id/members/:userId/assets       - List member's assets
```

### 2.2.4 Bulk Invitation (Priority: LOW)

**Description:** Invite multiple members at once

| Feature                | Status          | Priority |
| ---------------------- | --------------- | -------- |
| Bulk invite by CSV     | NOT IMPLEMENTED | MEDIUM   |
| Bulk invite by list    | NOT IMPLEMENTED | MEDIUM   |
| Shareable invite link  | NOT IMPLEMENTED | LOW      |
| Domain-restricted link | NOT IMPLEMENTED | LOW      |

**API Endpoints Required:**

```
POST   /organizations/:id/invitations/bulk      - Bulk invite from list
POST   /organizations/:id/invitations/import    - Import from CSV
POST   /organizations/:id/invite-links          - Create shareable link
GET    /organizations/:id/invite-links          - List active links
DELETE /organizations/:id/invite-links/:id      - Revoke link
```

### 2.2.5 Invitation Email System (Priority: HIGH)

**Description:** Email templates and delivery for invitations

| Feature                         | Status          | Priority |
| ------------------------------- | --------------- | -------- |
| Invitation email template       | NOT IMPLEMENTED | HIGH     |
| Accept/decline buttons in email | NOT IMPLEMENTED | HIGH     |
| Inviter name in email           | NOT IMPLEMENTED | HIGH     |
| Organization info in email      | NOT IMPLEMENTED | HIGH     |
| Personal message support        | NOT IMPLEMENTED | MEDIUM   |
| Email delivery tracking         | NOT IMPLEMENTED | LOW      |

---

## 3. Implementation Plan

### Phase 1: Core Invitation System (Week 1-2)

#### Backend Tasks

1. **Database Schema Update**

   ```bash
   # Add to schema.prisma
   model OrganizationInvitation { ... }

   # Run migration
   pnpm --filter @pingtome/database db:push
   ```

2. **Create Invitation Service**
   - `apps/api/src/invitations/invitation.service.ts`
   - Token generation with crypto.randomBytes
   - Token hashing for storage
   - Expiration validation
   - Email integration

3. **Create Invitation Controller**
   - `apps/api/src/invitations/invitation.controller.ts`
   - Public endpoints for accept/decline
   - Protected endpoints for management

4. **Update Mail Service**
   - Add `sendInvitationEmail()` method
   - Create email template
   - Include accept/decline links

#### Frontend Tasks

1. **Enhanced Invite Modal**
   - Add personal message field
   - Show pending invitations count
   - Add validation feedback

2. **Invitation Acceptance Page**
   - Route: `/invitations/[token]`
   - Show organization and inviter info
   - Accept/decline buttons
   - Account creation for new users

3. **Pending Invitations Tab**
   - List view with status
   - Resend/cancel actions
   - Expiration countdown

### Phase 2: Management Features (Week 3)

#### Backend Tasks

1. **Invitation CRUD Operations**
   - List pending with filters
   - Get invitation details
   - Resend with new expiry
   - Cancel invitation

2. **Member Removal Enhancement**
   - Asset transfer service
   - Notification on removal
   - Audit logging

#### Frontend Tasks

1. **Invitation Management UI**
   - Full invitation list page
   - Status indicators
   - Bulk actions

2. **Member Removal Dialog**
   - Confirmation with AlertDialog
   - Asset transfer option
   - Success notification

### Phase 3: Advanced Features (Week 4)

#### Tasks

1. **Bulk Invitation**
   - CSV import parsing
   - Batch processing
   - Progress tracking

2. **Shareable Invite Links**
   - Generate link with code
   - Domain restrictions
   - Usage limits

3. **Integration Testing**
   - Email delivery tests
   - Token security tests
   - Expiration tests

---

## 4. Test Cases

### 4.1 Unit Tests (Backend)

#### Invitation Service Tests

```typescript
describe("InvitationService", () => {
  describe("createInvitation", () => {
    it("should create invitation with secure token");
    it("should set expiration to 7 days from now");
    it("should send invitation email");
    it("should fail if email already has pending invitation");
    it("should fail if user is already a member");
    it("should fail if inviter is not OWNER or ADMIN");
    it("should include personal message in email if provided");
    it("should store hashed token, not plain token");
  });

  describe("acceptInvitation", () => {
    it("should add user to organization with correct role");
    it("should mark invitation as accepted");
    it("should fail if token is invalid");
    it("should fail if invitation has expired");
    it("should fail if invitation already accepted");
    it("should fail if invitation was cancelled");
    it("should create new user if email not registered");
    it("should link existing user if already registered");
  });

  describe("declineInvitation", () => {
    it("should mark invitation as declined");
    it("should fail if token is invalid");
    it("should fail if invitation has expired");
    it("should fail if invitation already accepted");
  });

  describe("resendInvitation", () => {
    it("should reset expiration date");
    it("should resend email");
    it("should generate new token");
    it("should fail if invitation already accepted");
    it("should fail if inviter no longer has permission");
  });

  describe("cancelInvitation", () => {
    it("should delete pending invitation");
    it("should fail if invitation already accepted");
    it("should fail if user is not OWNER or ADMIN");
  });

  describe("listPendingInvitations", () => {
    it("should return only pending invitations");
    it("should not return expired invitations");
    it("should not return accepted invitations");
    it("should include inviter details");
    it("should order by created date desc");
  });

  describe("validateToken", () => {
    it("should return invitation for valid token");
    it("should return null for invalid token");
    it("should return null for expired token");
    it("should include organization details");
  });

  describe("cleanupExpiredInvitations", () => {
    it("should delete invitations expired more than 90 days");
    it("should not delete recently expired invitations");
    it("should log cleanup results");
  });
});
```

#### Token Security Tests

```typescript
describe("Token Security", () => {
  it("should generate cryptographically secure tokens");
  it("should generate tokens of sufficient length (32+ bytes)");
  it("should never expose plain token in database");
  it("should use timing-safe comparison for token validation");
  it("should rate limit token validation attempts");
});
```

#### Member Removal Tests

```typescript
describe("MemberRemovalService", () => {
  describe("removeMember", () => {
    it("should remove member from organization");
    it("should fail if trying to remove OWNER");
    it("should fail if user is not OWNER or ADMIN");
    it("should fail if user is not a member");
    it("should create audit log entry");
  });

  describe("removeMemberWithTransfer", () => {
    it("should transfer links to specified member");
    it("should fail if transfer target is not a member");
    it("should update link ownership");
    it("should send notification to removed member");
  });

  describe("getMemberAssets", () => {
    it("should return count of member links");
    it("should return count of member campaigns");
    it("should return count of member tags");
  });
});
```

### 4.2 E2E Tests

#### File: `apps/web/e2e/member-invite-remove.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Member Invitation", () => {
  test.describe("Send Invitation", () => {
    test("MIR-001: Send invitation to new email", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization members
      // 3. Click "Invite Member"
      // 4. Enter new email and select role
      // 5. Add optional personal message
      // 6. Submit invitation
      // 7. Verify success toast
      // 8. Verify invitation appears in pending list
    });

    test("MIR-002: Cannot invite existing member", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Try to invite email of existing member
      // 3. Verify error message
    });

    test("MIR-003: Cannot invite duplicate email", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Send invitation to email
      // 3. Try to send another invitation to same email
      // 4. Verify error message about pending invitation
    });

    test("MIR-004: EDITOR cannot send invitations", async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Navigate to organization members
      // 3. Verify invite button is hidden or disabled
    });

    test("MIR-005: ADMIN can send invitations", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Send invitation successfully
      // 3. Verify invitation created
    });

    test("MIR-006: ADMIN cannot invite as OWNER role", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Try to invite with OWNER role
      // 3. Verify OWNER option not available or error
    });
  });

  test.describe("Accept Invitation", () => {
    test("MIR-010: Accept invitation as existing user", async ({ page }) => {
      // 1. Create invitation via API
      // 2. Open invitation link
      // 3. Login as existing user with invited email
      // 4. Click accept button
      // 5. Verify redirected to organization dashboard
      // 6. Verify user is now a member with correct role
    });

    test("MIR-011: Accept invitation as new user", async ({ page }) => {
      // 1. Create invitation to unregistered email
      // 2. Open invitation link
      // 3. Verify registration form displayed
      // 4. Complete registration
      // 5. Verify automatically added to organization
    });

    test("MIR-012: Cannot accept expired invitation", async ({ page }) => {
      // 1. Create invitation with past expiry via DB
      // 2. Open invitation link
      // 3. Verify error message about expiration
      // 4. Verify option to request new invitation
    });

    test("MIR-013: Cannot accept already accepted invitation", async ({
      page,
    }) => {
      // 1. Create and accept invitation
      // 2. Try to access same invitation link again
      // 3. Verify appropriate message
    });

    test("MIR-014: Invitation shows correct details", async ({ page }) => {
      // 1. Create invitation with personal message
      // 2. Open invitation link
      // 3. Verify organization name displayed
      // 4. Verify inviter name displayed
      // 5. Verify role displayed
      // 6. Verify personal message displayed
    });
  });

  test.describe("Decline Invitation", () => {
    test("MIR-020: Decline invitation", async ({ page }) => {
      // 1. Create invitation via API
      // 2. Open invitation link
      // 3. Click decline button
      // 4. Verify confirmation dialog
      // 5. Confirm decline
      // 6. Verify success message
      // 7. Verify invitation marked as declined
    });

    test("MIR-021: Cannot decline already declined invitation", async ({
      page,
    }) => {
      // 1. Decline invitation
      // 2. Try to access same link again
      // 3. Verify appropriate message
    });
  });

  test.describe("Manage Invitations", () => {
    test("MIR-030: View pending invitations list", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to invitations tab
      // 3. Verify pending invitations displayed
      // 4. Verify shows email, role, expiry, inviter
    });

    test("MIR-031: Resend invitation", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to pending invitations
      // 3. Click resend on invitation
      // 4. Verify success toast
      // 5. Verify expiry date reset
    });

    test("MIR-032: Cancel invitation", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to pending invitations
      // 3. Click cancel on invitation
      // 4. Confirm cancellation
      // 5. Verify invitation removed from list
    });

    test("MIR-033: Filter invitations by status", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to invitations
      // 3. Filter by pending
      // 4. Verify only pending shown
      // 5. Filter by accepted
      // 6. Verify only accepted shown
    });
  });

  test.describe("Remove Member", () => {
    test("MIR-040: Remove member from organization", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Navigate to organization members
      // 3. Click remove on member
      // 4. Verify confirmation dialog
      // 5. Confirm removal
      // 6. Verify member removed from list
    });

    test("MIR-041: Cannot remove OWNER", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Navigate to organization members
      // 3. Verify remove button not shown for OWNER
    });

    test("MIR-042: ADMIN cannot remove other ADMIN", async ({ page }) => {
      // 1. Login as ADMIN
      // 2. Verify cannot remove other ADMIN
    });

    test("MIR-043: Remove member with asset transfer", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Remove member who has links
      // 3. Select transfer target in dialog
      // 4. Confirm removal
      // 5. Verify links transferred
      // 6. Verify member removed
    });

    test("MIR-044: Self-removal from organization", async ({ page }) => {
      // 1. Login as EDITOR
      // 2. Leave organization option
      // 3. Confirm leave
      // 4. Verify removed from organization
    });

    test("MIR-045: OWNER cannot self-remove", async ({ page }) => {
      // 1. Login as OWNER
      // 2. Verify cannot leave organization
      // 3. Must transfer ownership first
    });
  });
});

test.describe("Bulk Invitation", () => {
  test("MIR-050: Bulk invite by list", async ({ page }) => {
    // 1. Login as OWNER
    // 2. Open bulk invite modal
    // 3. Enter multiple emails
    // 4. Select role for all
    // 5. Submit
    // 6. Verify all invitations created
  });

  test("MIR-051: Bulk invite with CSV", async ({ page }) => {
    // 1. Login as OWNER
    // 2. Open bulk invite modal
    // 3. Upload CSV file
    // 4. Verify preview shown
    // 5. Confirm import
    // 6. Verify invitations created
  });

  test("MIR-052: Bulk invite validation", async ({ page }) => {
    // 1. Login as OWNER
    // 2. Try bulk invite with invalid emails
    // 3. Verify validation errors shown
    // 4. Verify valid emails still processable
  });
});

test.describe("Shareable Invite Links", () => {
  test("MIR-060: Create shareable invite link", async ({ page }) => {
    // 1. Login as OWNER
    // 2. Create invite link with role
    // 3. Verify link generated
    // 4. Copy link
  });

  test("MIR-061: Join via invite link", async ({ page }) => {
    // 1. Create invite link
    // 2. Open link as new user
    // 3. Register/login
    // 4. Verify added to organization
  });

  test("MIR-062: Invite link with domain restriction", async ({ page }) => {
    // 1. Create link restricted to @company.com
    // 2. Try to join with @other.com email
    // 3. Verify rejection
    // 4. Join with @company.com email
    // 5. Verify success
  });

  test("MIR-063: Revoke invite link", async ({ page }) => {
    // 1. Create invite link
    // 2. Revoke link
    // 3. Try to use revoked link
    // 4. Verify error
  });
});
```

### 4.3 Integration Tests

```typescript
describe("Invitation Integration Tests", () => {
  describe("Email Delivery", () => {
    it("should send email when invitation created");
    it("should include correct accept link");
    it("should include correct decline link");
    it("should include inviter name");
    it("should include organization name");
    it("should include personal message if provided");
  });

  describe("Token Flow", () => {
    it("should generate unique token for each invitation");
    it("should validate token correctly");
    it("should reject modified tokens");
    it("should reject expired tokens");
  });

  describe("Permission Cascade", () => {
    it("OWNER can invite any role");
    it("ADMIN can invite ADMIN, EDITOR, VIEWER");
    it("EDITOR cannot invite anyone");
    it("VIEWER cannot invite anyone");
  });

  describe("Audit Trail", () => {
    it("should log invitation creation");
    it("should log invitation acceptance");
    it("should log invitation decline");
    it("should log invitation cancellation");
    it("should log member removal");
  });
});
```

---

## 5. API Specification

### 5.1 Create Invitation

#### POST /organizations/:id/invitations

```yaml
description: Send invitation email to new member
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID (UUID)
body:
  email: string (required, valid email)
  role: MemberRole (default: VIEWER)
  personalMessage: string? (max 500 chars)
response:
  201:
    id: string
    email: string
    role: MemberRole
    expiresAt: string (ISO date)
    createdAt: string
    invitedBy:
      id: string
      name: string
  400:
    code: "INVALID_EMAIL" | "EMAIL_ALREADY_INVITED"
    message: string
  403:
    code: "INSUFFICIENT_PERMISSION"
    message: "Only OWNER or ADMIN can invite members"
  409:
    code: "USER_ALREADY_MEMBER"
    message: "User is already a member of this organization"
```

### 5.2 Accept Invitation

#### POST /invitations/:token/accept

```yaml
description: Accept organization invitation (public endpoint)
auth: Optional
params:
  token: Invitation token
body:
  # If not authenticated and user doesn't exist:
  name: string (required for new users)
  password: string (required for new users, min 8 chars)
response:
  200:
    message: "Successfully joined organization"
    organization:
      id: string
      name: string
      slug: string
    role: MemberRole
    # If new user created:
    user:
      id: string
      email: string
      name: string
    accessToken: string (if new user)
    refreshToken: string (if new user)
  400:
    code: "INVALID_TOKEN" | "INVITATION_EXPIRED" | "ALREADY_ACCEPTED"
    message: string
  409:
    code: "USER_ALREADY_MEMBER"
    message: string
```

### 5.3 Decline Invitation

#### POST /invitations/:token/decline

```yaml
description: Decline organization invitation (public endpoint)
auth: Not required
params:
  token: Invitation token
response:
  200:
    message: "Invitation declined"
  400:
    code: "INVALID_TOKEN" | "INVITATION_EXPIRED" | "ALREADY_DECLINED"
    message: string
```

### 5.4 Get Invitation Details

#### GET /invitations/:token

```yaml
description: Get invitation details for display (public endpoint)
auth: Not required
params:
  token: Invitation token
response:
  200:
    id: string
    email: string
    role: MemberRole
    status: "pending" | "expired" | "accepted" | "declined"
    expiresAt: string
    organization:
      id: string
      name: string
      logo: string?
    invitedBy:
      name: string
      email: string
    personalMessage: string?
  404:
    code: "INVITATION_NOT_FOUND"
    message: string
```

### 5.5 List Pending Invitations

#### GET /organizations/:id/invitations

```yaml
description: List organization invitations
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID
query:
  status: "pending" | "accepted" | "declined" | "expired" | "all" (default: pending)
  page: number (default: 1)
  limit: number (default: 20)
response:
  200:
    items:
      - id: string
        email: string
        role: MemberRole
        status: string
        expiresAt: string
        createdAt: string
        invitedBy:
          id: string
          name: string
    pagination:
      page: number
      limit: number
      total: number
      totalPages: number
```

### 5.6 Resend Invitation

#### POST /organizations/:id/invitations/:invitationId/resend

```yaml
description: Resend invitation email with new expiry
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID
  invitationId: Invitation ID
response:
  200:
    message: "Invitation resent successfully"
    newExpiresAt: string
  400:
    code: "ALREADY_ACCEPTED" | "ALREADY_DECLINED"
    message: string
  404:
    code: "INVITATION_NOT_FOUND"
    message: string
```

### 5.7 Cancel Invitation

#### DELETE /organizations/:id/invitations/:invitationId

```yaml
description: Cancel pending invitation
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID
  invitationId: Invitation ID
response:
  200:
    message: "Invitation cancelled"
  400:
    code: "ALREADY_ACCEPTED"
    message: "Cannot cancel accepted invitation"
  404:
    code: "INVITATION_NOT_FOUND"
    message: string
```

### 5.8 Remove Member

#### DELETE /organizations/:id/members/:userId

```yaml
description: Remove member from organization
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID
  userId: User ID to remove
body:
  transferAssetsTo: string? (User ID to transfer assets)
response:
  200:
    message: "Member removed successfully"
    assetsTransferred:
      links: number
      campaigns: number
  400:
    code: "CANNOT_REMOVE_OWNER"
    message: string
  403:
    code: "INSUFFICIENT_PERMISSION"
    message: string
  404:
    code: "MEMBER_NOT_FOUND"
    message: string
```

### 5.9 Bulk Invite

#### POST /organizations/:id/invitations/bulk

```yaml
description: Send multiple invitations at once
auth: Required (OWNER or ADMIN)
params:
  id: Organization ID
body:
  invitations:
    - email: string
      role: MemberRole (default: VIEWER)
  personalMessage: string? (applies to all)
response:
  200:
    successful: number
    failed: number
    results:
      - email: string
        status: "sent" | "failed"
        error: string? (if failed)
        invitationId: string? (if sent)
```

---

## 6. Email Templates

### 6.1 Invitation Email Template

```html
Subject: {{inviterName}} invited you to join {{organizationName}} on PingTO.Me

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>You've been invited!</h1>

  <p>
    <strong>{{inviterName}}</strong> has invited you to join
    <strong>{{organizationName}}</strong> on PingTO.Me as a
    <strong>{{roleName}}</strong>.
  </p>

  {{#if personalMessage}}
  <div
    style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;"
  >
    <p style="font-style: italic;">"{{personalMessage}}"</p>
    <p style="text-align: right;">- {{inviterName}}</p>
  </div>
  {{/if}}

  <p>As a {{roleName}}, you will be able to:</p>
  <ul>
    {{#if isOwner}}
    <li>Full control over the organization</li>
    <li>Manage billing and subscription</li>
    <li>Add and remove team members</li>
    {{/if}} {{#if isAdmin}}
    <li>Manage team members and invitations</li>
    <li>Create and manage all links</li>
    <li>View all analytics</li>
    {{/if}} {{#if isEditor}}
    <li>Create and manage links</li>
    <li>View analytics</li>
    {{/if}} {{#if isViewer}}
    <li>View links and analytics</li>
    {{/if}}
  </ul>

  <div style="text-align: center; margin: 32px 0;">
    <a
      href="{{acceptUrl}}"
      style="background: #0066FF; color: white; padding: 12px 32px;
              text-decoration: none; border-radius: 8px; font-weight: bold;"
    >
      Accept Invitation
    </a>
  </div>

  <p style="color: #666; font-size: 14px;">
    This invitation will expire on {{expiresAt}}.
  </p>

  <p style="color: #666; font-size: 14px;">
    Not interested? <a href="{{declineUrl}}">Decline this invitation</a>
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />

  <p style="color: #999; font-size: 12px;">
    This email was sent by PingTO.Me. If you didn't expect this invitation, you
    can safely ignore this email.
  </p>
</div>
```

### 6.2 Member Removed Email Template

```html
Subject: You have been removed from {{organizationName}}

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Organization Access Removed</h1>

  <p>
    You have been removed from <strong>{{organizationName}}</strong>
    by {{removerName}}.
  </p>

  <p>
    You no longer have access to the organization's links, analytics, and other
    resources.
  </p>

  {{#if assetsTransferred}}
  <p>
    Your {{assetCount}} links have been transferred to {{transferredToName}}.
  </p>
  {{/if}}

  <p style="color: #666; font-size: 14px;">
    If you believe this was done in error, please contact the organization
    administrator.
  </p>
</div>
```

---

## 7. Frontend Components Specification

### 7.1 Invitation Modal (Enhanced)

**Location:** `apps/web/components/invitation/InviteMemberDialog.tsx`

```typescript
interface InviteMemberDialogProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: MemberRole;
}

// Features:
// - Email input with validation
// - Role selector (filtered by current user's role)
// - Personal message textarea (optional)
// - Submit button with loading state
// - Error display
// - Success toast on completion
```

### 7.2 Invitation Acceptance Page

**Route:** `/invitations/[token]/page.tsx`

```typescript
interface InvitationAcceptPageProps {
  params: { token: string };
}

// Features:
// - Display organization info (name, logo)
// - Display inviter info (name)
// - Display role with permissions preview
// - Display personal message if provided
// - Accept button
// - Decline button
// - Login/Register form for unauthenticated users
// - Error states (expired, invalid, already accepted)
```

### 7.3 Pending Invitations List

**Location:** `apps/web/components/invitation/PendingInvitationsList.tsx`

```typescript
interface PendingInvitationsListProps {
  organizationId: string;
}

// Features:
// - List of pending invitations
// - Email, role, expiry countdown for each
// - Resend button
// - Cancel button with confirmation
// - Empty state
// - Loading skeleton
```

### 7.4 Member Removal Dialog

**Location:** `apps/web/components/organization/RemoveMemberDialog.tsx`

```typescript
interface RemoveMemberDialogProps {
  member: OrganizationMember;
  organizationId: string;
  onConfirm: (transferTo?: string) => Promise<void>;
  onCancel: () => void;
}

// Features:
// - Member info display
// - Asset count if member has links
// - Transfer dropdown if has assets
// - Confirm/Cancel buttons
// - Loading state
```

---

## 8. Security Considerations

### 8.1 Token Security

- Generate tokens using `crypto.randomBytes(32)`
- Store only hashed tokens in database
- Use timing-safe comparison for validation
- Rate limit token validation (5 attempts per minute per IP)

### 8.2 Permission Hierarchy

- Users can only invite roles <= their own role
- OWNER can invite any role
- ADMIN can invite ADMIN, EDITOR, VIEWER
- EDITOR and VIEWER cannot invite

### 8.3 Email Security

- Verify email ownership for new users
- Rate limit invitation sending (10 per hour per organization)
- Include organization context in emails to prevent phishing confusion

### 8.4 Data Privacy

- Don't leak member information to declined invitees
- Audit log all invitation actions
- Allow users to opt-out of invitation emails

---

## 9. Dependencies

### External Dependencies

- Email service (nodemailer) - existing
- Crypto module (Node.js built-in)

### Internal Dependencies

- Auth module (for user creation on accept)
- Mail module (for sending emails)
- Audit module (for logging)
- Organization module (for member management)

---

## 10. Migration Plan

### Database Migration

```sql
-- Create OrganizationInvitation table
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
  token VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  invited_by_id UUID NOT NULL REFERENCES users(id),
  personal_message TEXT,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, email)
);

CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_token_hash ON organization_invitations(token_hash);
CREATE INDEX idx_invitations_expires_at ON organization_invitations(expires_at);
CREATE INDEX idx_invitations_email ON organization_invitations(email);

-- Update OrganizationMember table
ALTER TABLE organization_members
ADD COLUMN joined_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN last_active_at TIMESTAMP,
ADD COLUMN invited_by_id UUID REFERENCES users(id);
```

---

## 11. Timeline Summary

| Phase     | Duration    | Deliverables                                     |
| --------- | ----------- | ------------------------------------------------ |
| Phase 1   | 2 weeks     | Core invitation system (create, accept, decline) |
| Phase 2   | 1 week      | Invitation management (list, resend, cancel)     |
| Phase 3   | 1 week      | Advanced features (bulk, links)                  |
| **Total** | **4 weeks** | Complete Module 2.2                              |

---

## 12. Success Metrics

- **Invitation delivery rate** > 95%
- **Invitation acceptance rate** > 60%
- **Average time to accept** < 48 hours
- **Failed invitation rate** < 5%
- **Zero security incidents** related to invitation tokens

---

## Appendix A: Current Implementation Files

**Backend:**

- `apps/api/src/organizations/organization.service.ts` - Current invite logic
- `apps/api/src/organizations/organization.controller.ts` - Current endpoints
- `apps/api/src/mail/mail.service.ts` - Email service (needs extension)

**Frontend:**

- `apps/web/components/InviteMemberModal.tsx` - Current modal
- `apps/web/app/dashboard/organization/page.tsx` - Organization management
- `apps/web/app/dashboard/settings/team/page.tsx` - Team settings

**Database:**

- `packages/database/prisma/schema.prisma` - Current schema

---

## Appendix B: Research Sources

1. SaaSFrame - Invitation Email Examples
2. UserPilot - Onboarding Invited Users
3. PageFlows - Invite Teammates User Flow
4. Auth0 - B2B SaaS User Onboarding
5. Security Stack Exchange - Token Expiration Best Practices
6. Microsoft Learn - Bulk Invite B2B Users
7. EnterpriseReady - RBAC Guide
