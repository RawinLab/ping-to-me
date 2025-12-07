# Organization Settings API

This document describes the Organization Settings API endpoints and features.

## Overview

The Organization Settings API provides comprehensive organization management capabilities including:

- Organization profile management (name, slug, logo, description, timezone)
- Organization settings (SSO, 2FA enforcement, IP allowlisting, session timeout)
- Logo upload/delete
- Ownership transfer

## New Features

### 1. Organization Profile Fields

The Organization model now includes:

- `logo` - Organization logo (base64 encoded image or URL)
- `description` - Organization description (max 500 chars)
- `timezone` - IANA timezone identifier (default: "UTC")
- `dataRetentionDays` - Analytics data retention period (30-365 days, default: 90)
- `defaultDomainId` - Default domain for link shortening

### 2. Organization Settings

Settings are stored in the `OrganizationSettings` table with the following fields:

- `ipAllowlist` - Array of allowed IP addresses/CIDR ranges
- `ssoEnabled` - Enable SSO authentication
- `ssoProviderId` - SSO provider identifier
- `enforced2FA` - Require 2FA for all organization members
- `sessionTimeout` - Session timeout in seconds (300-86400, default: 7200)

## API Endpoints

### Organization CRUD (Updated)

#### Update Organization

```
PUT /organizations/:id
```

**Permissions**: OWNER, ADMIN

**Body**:

```json
{
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "logo": "data:image/png;base64,...",
  "description": "A leading technology company",
  "timezone": "America/New_York",
  "dataRetentionDays": 90,
  "defaultDomainId": "550e8400-e29b-41d4-a716-446655440000"
}
```

All fields are optional.

---

### Organization Settings

#### Get Organization Settings

```
GET /organizations/:id/settings
```

**Permissions**: OWNER, ADMIN, EDITOR, VIEWER (all members)

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "ipAllowlist": ["192.168.1.1", "10.0.0.0/8"],
  "ssoEnabled": false,
  "ssoProviderId": null,
  "enforced2FA": false,
  "sessionTimeout": 7200,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### Update Organization Settings

```
PATCH /organizations/:id/settings
```

**Permissions**: OWNER, ADMIN

**Body**:

```json
{
  "ipAllowlist": ["192.168.1.0/24"],
  "ssoEnabled": true,
  "ssoProviderId": "google-workspace",
  "enforced2FA": true,
  "sessionTimeout": 3600
}
```

**Validation**:

- `sessionTimeout`: 300-86400 seconds (5 minutes - 24 hours)
- `ipAllowlist`: Array of IP addresses or CIDR notation

**Audit Log**: Creates `org.settings_updated` event with change tracking

---

### Logo Management

#### Upload Organization Logo

```
POST /organizations/:id/logo
```

**Permissions**: OWNER, ADMIN

**Content-Type**: `multipart/form-data`

**Body**:

- `logo` (file): Image file

**Validation**:

- File types: PNG, JPG, JPEG, WebP
- Max size: 2MB
- Image is converted to base64 and stored in database

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corporation",
  "logo": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  ...
}
```

**Audit Log**: Creates `org.logo_uploaded` event

---

#### Delete Organization Logo

```
DELETE /organizations/:id/logo
```

**Permissions**: OWNER, ADMIN

**Response**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Corporation",
  "logo": null,
  ...
}
```

**Audit Log**: Creates `org.logo_deleted` event

---

### Ownership Transfer

#### Transfer Organization Ownership

```
POST /organizations/:id/transfer-ownership
```

**Permissions**: OWNER only

**Body**:

```json
{
  "newOwnerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:

- New owner must be an existing member
- Cannot transfer to yourself
- New owner must have a valid user ID

**Behavior**:

- Current owner is demoted to ADMIN
- New member is promoted to OWNER
- Both updates happen in a transaction

**Response**:

```json
{
  "message": "Ownership transferred successfully",
  "previousOwnerId": "550e8400-e29b-41d4-a716-446655440001",
  "newOwnerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Audit Log**: Creates `org.ownership_transferred` event

---

## Service Methods

### Organization Service

#### `createDefaultSettings(orgId: string)`

- Creates default settings when an organization is created
- Called automatically during organization creation
- Sets default values for all settings

#### `getSettings(orgId: string, userId: string)`

- Returns organization settings
- Checks user membership
- Creates default settings if they don't exist

#### `updateSettings(orgId: string, userId: string, data: UpdateOrganizationSettingsDto)`

- Updates organization settings
- Requires OWNER or ADMIN role
- Tracks changes in audit log

#### `uploadLogo(orgId: string, userId: string, file: Express.Multer.File)`

- Uploads organization logo
- Validates file type and size
- Converts to base64 and stores in database
- Requires OWNER or ADMIN role

#### `deleteLogo(orgId: string, userId: string)`

- Removes organization logo
- Requires OWNER or ADMIN role

#### `transferOwnership(orgId: string, currentOwnerId: string, newOwnerId: string)`

- Transfers organization ownership
- Requires OWNER role
- Updates both members in a transaction
- Creates audit log entry

---

## DTOs

### UpdateOrganizationDto

```typescript
{
  name?: string;           // max 100 chars
  slug?: string;           // max 50 chars
  logo?: string;           // base64 or URL
  description?: string;    // max 500 chars
  timezone?: string;       // IANA timezone
  dataRetentionDays?: number;  // 30-365
  defaultDomainId?: string;    // UUID
}
```

### UpdateOrganizationSettingsDto

```typescript
{
  ipAllowlist?: string[];      // IP addresses or CIDR
  ssoEnabled?: boolean;
  ssoProviderId?: string;
  enforced2FA?: boolean;
  sessionTimeout?: number;     // 300-86400 seconds
}
```

### TransferOwnershipDto

```typescript
{
  newOwnerId: string; // UUID (required)
}
```

---

## Audit Events

All organization settings changes are logged in the audit system:

| Event                       | Description                       |
| --------------------------- | --------------------------------- |
| `org.settings_updated`      | Organization settings changed     |
| `org.logo_uploaded`         | Logo uploaded                     |
| `org.logo_deleted`          | Logo deleted                      |
| `org.ownership_transferred` | Ownership transferred to new user |

---

## Error Handling

### Common Errors

**400 Bad Request**:

- Invalid file type for logo
- File size exceeds 2MB
- Invalid domain ID
- New owner is not a member
- Attempting to transfer to yourself

**403 Forbidden**:

- User lacks required permissions
- Not a member of the organization

**404 Not Found**:

- Organization not found
- Settings not found
- Domain not found

---

## Example Usage

### Upload Logo with curl

```bash
curl -X POST \
  http://localhost:3001/organizations/123/logo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "logo=@/path/to/logo.png"
```

### Update Settings

```bash
curl -X PATCH \
  http://localhost:3001/organizations/123/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enforced2FA": true,
    "sessionTimeout": 3600
  }'
```

### Transfer Ownership

```bash
curl -X POST \
  http://localhost:3001/organizations/123/transfer-ownership \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newOwnerId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Permission Matrix

| Action              | OWNER | ADMIN | EDITOR | VIEWER |
| ------------------- | ----- | ----- | ------ | ------ |
| Get settings        | ✓     | ✓     | ✓      | ✓      |
| Update settings     | ✓     | ✓     | ✗      | ✗      |
| Update organization | ✓     | ✓     | ✗      | ✗      |
| Upload logo         | ✓     | ✓     | ✗      | ✗      |
| Delete logo         | ✓     | ✓     | ✗      | ✗      |
| Transfer ownership  | ✓     | ✗     | ✗      | ✗      |

---

## Database Migration

If you need to run migrations for existing organizations:

```bash
# Generate Prisma client
pnpm --filter @pingtome/database db:generate

# Push schema changes
pnpm --filter @pingtome/database db:push
```

To create default settings for existing organizations, you can run a migration script or call `createDefaultSettings()` for each organization.

---

## Testing

Example test cases to implement:

1. **Settings Management**
   - Create organization → settings auto-created
   - Get settings for member
   - Update settings as OWNER/ADMIN
   - Reject settings update as EDITOR/VIEWER

2. **Logo Upload**
   - Upload valid PNG/JPG/WebP
   - Reject invalid file types
   - Reject files > 2MB
   - Delete logo

3. **Ownership Transfer**
   - Transfer to existing member
   - Reject transfer to non-member
   - Reject transfer to self
   - Verify both members updated
   - Verify audit log created

4. **Audit Logging**
   - All changes logged
   - Changes tracked correctly
   - Sensitive fields excluded
