# Organization 2FA Enforcement (Module 2.5)

This document describes the 2FA enforcement feature for organizations.

## Overview

Organization owners can enforce two-factor authentication (2FA) for members based on their roles. This ensures that sensitive organization resources are protected by requiring members to enable 2FA before they can access organization features.

## Features

1. **Role-based 2FA Enforcement**: Enforce 2FA for specific roles (OWNER, ADMIN, EDITOR, VIEWER)
2. **Automatic Enforcement**: Users are automatically blocked from accessing organization resources if they haven't enabled 2FA
3. **Security Settings API**: Dedicated endpoints for managing security settings
4. **Audit Logging**: All security setting changes are logged

## Database Schema

### OrganizationSettings

```prisma
model OrganizationSettings {
  enforced2FA        Boolean  @default(false)      // Enable 2FA enforcement
  enforce2FAForRoles String[] @default([])         // Roles that require 2FA
  // ... other fields
}
```

## API Endpoints

### GET /organizations/:id/security

Get security settings for an organization.

**Permissions**: Any member (OWNER, ADMIN, EDITOR, VIEWER)

**Response**:
```json
{
  "enforced2FA": true,
  "enforce2FAForRoles": ["OWNER", "ADMIN"],
  "sessionTimeout": 7200,
  "maxLoginAttempts": 5,
  "lockoutDuration": 30
}
```

### PATCH /organizations/:id/security/2fa

Update 2FA enforcement settings.

**Permissions**: Only OWNER

**Request Body**:
```json
{
  "enforce2FA": true,
  "enforce2FAForRoles": ["OWNER", "ADMIN"]
}
```

**Response**:
```json
{
  "enforced2FA": true,
  "enforce2FAForRoles": ["OWNER", "ADMIN"],
  "sessionTimeout": 7200,
  "maxLoginAttempts": 5,
  "lockoutDuration": 30
}
```

## Service Methods

### OrganizationService

#### `getSecuritySettings(orgId: string, userId: string)`

Get security settings for an organization. Any member can view the settings.

```typescript
const settings = await organizationService.getSecuritySettings(orgId, userId);
```

#### `updateSecuritySettings(orgId: string, userId: string, data: Update2FAEnforcementDto)`

Update 2FA enforcement settings. Only OWNER can modify these settings.

```typescript
const updated = await organizationService.updateSecuritySettings(orgId, userId, {
  enforce2FA: true,
  enforce2FAForRoles: ['OWNER', 'ADMIN']
});
```

#### `is2FARequired(orgId: string, userId: string): Promise<boolean>`

Check if 2FA is required for a user in an organization based on their role.

```typescript
const required = await organizationService.is2FARequired(orgId, userId);
if (required && !user.twoFactorEnabled) {
  // Block access
}
```

**Logic**:
- Returns `false` if 2FA is not enforced for the organization
- Returns `false` if user is not a member
- If `enforce2FAForRoles` is empty but `enforced2FA` is true, requires 2FA for all members
- If `enforce2FAForRoles` has values, checks if user's role is in the array

## TwoFactorRequiredGuard

A NestJS guard that automatically enforces 2FA for organization-scoped routes.

### Usage

Apply the guard to routes that need 2FA enforcement:

```typescript
@Controller('organizations')
@UseGuards(JwtAuthGuard, TwoFactorRequiredGuard, PermissionGuard)
export class OrganizationController {
  @Get(':id/sensitive-data')
  async getSensitiveData(@Param('id') orgId: string) {
    // This route will automatically check if 2FA is required
    // and block access if user hasn't enabled 2FA
  }
}
```

### How it Works

1. Extracts organization ID from route params (`:id` or `:organizationId`)
2. Calls `organizationService.is2FARequired(orgId, userId)`
3. If 2FA is required, checks if user has enabled 2FA
4. If user hasn't enabled 2FA, throws `ForbiddenException` with helpful error message

### Exceptions

The guard allows access to:
- Non-authenticated requests (handled by JwtAuthGuard)
- Routes without organization ID in params
- 2FA setup routes (`/auth/2fa`, `/two-factor`, `/settings/security`)

### Error Response

When a user is blocked due to missing 2FA:

```json
{
  "statusCode": 403,
  "message": {
    "code": "2FA_REQUIRED",
    "message": "Two-factor authentication is required for your role in this organization. Please enable 2FA in your security settings before accessing organization resources.",
    "setupUrl": "/dashboard/settings/security"
  }
}
```

## Audit Logging

All security setting changes are logged with the action `org.security_updated`.

**Example Audit Log**:
```json
{
  "action": "org.security_updated",
  "userId": "user-id",
  "organizationId": "org-id",
  "changes": {
    "before": {
      "enforced2FA": false,
      "enforce2FAForRoles": []
    },
    "after": {
      "enforced2FA": true,
      "enforce2FAForRoles": ["OWNER", "ADMIN"]
    }
  },
  "details": {
    "settingsChanged": ["2FA enforcement"]
  }
}
```

## Frontend Integration

### Checking 2FA Status

```typescript
// Get organization security settings
const response = await fetch(`/api/organizations/${orgId}/security`);
const settings = await response.json();

if (settings.enforced2FA) {
  // Check if current user's role requires 2FA
  const userRole = getCurrentUserRole(orgId);
  if (settings.enforce2FAForRoles.includes(userRole)) {
    // Prompt user to enable 2FA if not already enabled
  }
}
```

### Updating 2FA Enforcement (OWNER only)

```typescript
// Update 2FA enforcement
const response = await fetch(`/api/organizations/${orgId}/security/2fa`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enforce2FA: true,
    enforce2FAForRoles: ['OWNER', 'ADMIN']
  })
});
```

### Handling 2FA Required Error

```typescript
try {
  // Make API call to organization resource
  await fetch(`/api/organizations/${orgId}/some-resource`);
} catch (error) {
  if (error.response?.data?.code === '2FA_REQUIRED') {
    // Redirect to 2FA setup page
    router.push(error.response.data.setupUrl);
    // Show notification
    toast.error(error.response.data.message);
  }
}
```

## Testing

### Example Test Scenarios

1. **Owner enforces 2FA for ADMIN role**
   - Create organization with OWNER and ADMIN members
   - OWNER updates settings to enforce 2FA for ADMIN role
   - ADMIN tries to access organization resource
   - Request is blocked with 2FA_REQUIRED error
   - ADMIN enables 2FA
   - ADMIN can now access organization resources

2. **2FA enforced for all members**
   - OWNER sets `enforce2FA: true` with empty `enforce2FAForRoles`
   - All members (OWNER, ADMIN, EDITOR, VIEWER) are required to enable 2FA
   - Any member without 2FA is blocked from accessing organization resources

3. **2FA not enforced**
   - `enforce2FA` is `false`
   - All members can access organization resources regardless of 2FA status

## Security Considerations

1. **Only OWNER can modify 2FA enforcement**: This prevents privilege escalation
2. **Guard allows 2FA setup routes**: Users must be able to access 2FA setup even if enforcement is enabled
3. **Audit logging**: All security changes are logged for compliance
4. **Graceful error handling**: Clear error messages guide users to enable 2FA

## Migration Path

If enabling 2FA enforcement for existing organizations:

1. Notify all members in advance
2. Enable 2FA enforcement for high-privilege roles first (OWNER, ADMIN)
3. Give members time to enable 2FA
4. Gradually extend enforcement to other roles (EDITOR, VIEWER)
5. Provide support documentation and setup guides
