# Invitations Module

Organization invitation system for PingTO.Me with secure token handling, email notifications, and RBAC integration.

## Features

- Secure token generation using `crypto.randomBytes(32)` and base64url encoding
- Token hashing with SHA-256 and timing-safe comparison
- Email invitations with accept/decline links
- Support for new user registration via invitation
- Bulk invitation creation
- Invitation resending and cancellation
- 7-day expiration period
- Full audit logging integration
- RBAC permission enforcement

## File Structure

```
apps/api/src/invitations/
├── invitations.module.ts          # Module definition
├── invitations.service.ts         # Core business logic
├── invitations.controller.ts      # HTTP endpoints
├── dto/
│   ├── create-invitation.dto.ts   # Single invitation DTO
│   ├── accept-invitation.dto.ts   # Accept invitation DTO
│   └── bulk-invitation.dto.ts     # Bulk invitation DTO
└── README.md                      # This file
```

## API Endpoints

### Protected Endpoints (Require Authentication & Permissions)

#### Create Invitation

```http
POST /organizations/:id/invitations
Permission: team:invite

Body:
{
  "email": "user@example.com",
  "role": "EDITOR",
  "personalMessage": "Welcome to the team!" (optional)
}
```

#### Bulk Create Invitations

```http
POST /organizations/:id/invitations/bulk
Permission: team:invite

Body:
{
  "invitations": [
    { "email": "user1@example.com", "role": "EDITOR" },
    { "email": "user2@example.com", "role": "VIEWER" }
  ]
}
```

#### List Invitations

```http
GET /organizations/:id/invitations?status=pending&limit=50&offset=0
Permission: team:read

Query params:
- status: pending | accepted | declined | expired
- limit: number (default: 50)
- offset: number (default: 0)
```

#### Resend Invitation

```http
POST /organizations/:id/invitations/:invitationId/resend
Permission: team:invite
```

#### Cancel Invitation

```http
DELETE /organizations/:id/invitations/:invitationId
Permission: team:invite
```

### Public Endpoints (No Authentication Required)

#### Get Invitation Details

```http
GET /invitations/:token
```

Returns:

- Organization details
- Inviter name
- Role
- Expiration date
- Whether registration is required

#### Accept Invitation

```http
POST /invitations/:token/accept

Body (optional, for new users):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Decline Invitation

```http
POST /invitations/:token/decline
```

## Security Features

### Token Security

- **Generation**: `crypto.randomBytes(32)` → base64url (43 characters)
- **Storage**: Only SHA-256 hash stored in database
- **Validation**: Timing-safe comparison using `crypto.timingSafeEqual`
- **Expiration**: 7 days from creation

### RBAC Integration

- **OWNER**: Can invite any role including other OWNERs
- **ADMIN**: Can invite ADMIN, EDITOR, VIEWER (not OWNER)
- **EDITOR/VIEWER**: Cannot invite members

### Validations

- Prevents duplicate invitations for same email
- Checks if user is already a member
- Validates invitation expiration
- Prevents accepting/declining multiple times
- Enforces role hierarchy

## Email Notification

The `sendInvitationEmail` method sends beautifully formatted emails with:

- Organization name and logo
- Inviter name
- Role badge
- Personal message (if provided)
- Accept and decline buttons
- Expiration date
- Responsive HTML design

## Audit Logging

All actions are logged using the AuditService:

- `member.invited` - When invitation is created
- `member.joined` - When invitation is accepted
- `invitation.resent` - When invitation is resent
- `invitation.cancelled` - When invitation is cancelled

## Usage Examples

### Service Usage

```typescript
import { InvitationsService } from "./invitations/invitations.service";

@Injectable()
export class MyService {
  constructor(private invitationsService: InvitationsService) {}

  async inviteUser(orgId: string, userId: string) {
    // Create invitation
    const invitation = await this.invitationsService.createInvitation(
      orgId,
      {
        email: "newuser@example.com",
        role: MemberRole.EDITOR,
        personalMessage: "Welcome!",
      },
      userId,
    );

    // List pending invitations
    const { invitations, total } =
      await this.invitationsService.listInvitations(orgId, {
        status: "pending",
      });

    // Resend invitation
    await this.invitationsService.resendInvitation(
      orgId,
      invitation.id,
      userId,
    );
  }
}
```

### Controller Usage

```typescript
// Frontend can call these endpoints
const response = await fetch("/api/organizations/org-id/invitations", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    role: "EDITOR",
  }),
});
```

## Database Model

```prisma
model OrganizationInvitation {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId  String     @db.Uuid
  email           String
  role            MemberRole @default(VIEWER)
  token           String     @unique
  tokenHash       String?
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
  @@index([tokenHash])
  @@index([expiresAt])
  @@index([email])
}
```

## Testing

### Unit Tests

Test the service methods:

- Token generation and validation
- Invitation creation with role validation
- Acceptance flow for existing/new users
- Expiration handling
- Duplicate prevention

### Integration Tests

Test the API endpoints:

- Protected endpoints require auth and permissions
- Public endpoints work without auth
- Token validation works correctly
- Email is sent on invitation creation

### E2E Tests

Test the complete flow:

1. Create invitation
2. Receive email
3. Accept invitation via token
4. User added to organization
5. Audit logs created

## Error Handling

The module throws appropriate HTTP exceptions:

- `NotFoundException`: Invitation or organization not found
- `ForbiddenException`: Insufficient permissions
- `ConflictException`: Duplicate invitation or existing member
- `BadRequestException`: Invalid token, expired invitation, validation errors

## Frontend Integration

Example frontend flow:

```typescript
// 1. Admin invites user
await api.post("/organizations/org-id/invitations", {
  email: "user@example.com",
  role: "EDITOR",
});

// 2. User receives email and clicks link → /invitations/:token

// 3. Frontend fetches invitation details
const invitation = await api.get(`/invitations/${token}`);

// 4. User accepts invitation
if (invitation.requiresRegistration) {
  // Show registration form
  await api.post(`/invitations/${token}/accept`, {
    name: "John Doe",
    password: "password123",
  });
} else {
  // Existing user, just accept
  await api.post(`/invitations/${token}/accept`);
}

// 5. Redirect to organization dashboard
```

## Dependencies

- `@nestjs/common` - NestJS framework
- `@prisma/client` - Database access
- `bcrypt` - Password hashing for new users
- `crypto` - Token generation and hashing (Node.js built-in)
- `nodemailer` - Email sending (via MailService)
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Notes

- Tokens are NEVER stored in plain text
- Token validation uses timing-safe comparison to prevent timing attacks
- Email addresses are normalized to lowercase
- Invitation emails include both accept and decline links
- New users automatically have their email verified when accepting invitation
- The `invitedById` field is tracked on `OrganizationMember` for audit purposes
