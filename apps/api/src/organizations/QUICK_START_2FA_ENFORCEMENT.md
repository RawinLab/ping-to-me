# Quick Start: Organization 2FA Enforcement

This guide shows you how to use the organization 2FA enforcement feature.

## For Backend Developers

### Applying the Guard

To enforce 2FA on organization routes, apply the `TwoFactorRequiredGuard`:

```typescript
import { JwtAuthGuard, TwoFactorRequiredGuard } from '../auth/guards';
import { PermissionGuard } from '../auth/rbac';

@Controller('organizations')
@UseGuards(JwtAuthGuard, TwoFactorRequiredGuard, PermissionGuard)
export class OrganizationController {
  // All routes here will automatically enforce 2FA if configured
}
```

**Important**: The guard order matters:
1. `JwtAuthGuard` - Authenticates the user
2. `TwoFactorRequiredGuard` - Checks 2FA requirements
3. `PermissionGuard` - Checks RBAC permissions

### Checking 2FA Programmatically

```typescript
const is2FARequired = await this.organizationService.is2FARequired(
  organizationId,
  userId
);

if (is2FARequired && !user.twoFactorEnabled) {
  throw new ForbiddenException({
    code: '2FA_REQUIRED',
    message: 'Please enable 2FA to access this resource',
    setupUrl: '/dashboard/settings/security'
  });
}
```

## For Frontend Developers

### Fetching Security Settings

```typescript
const getSecuritySettings = async (orgId: string) => {
  const response = await fetch(`/api/organizations/${orgId}/security`);
  return response.json();
};

// Example response:
{
  "enforced2FA": true,
  "enforce2FAForRoles": ["OWNER", "ADMIN"],
  "sessionTimeout": 7200,
  "maxLoginAttempts": 5,
  "lockoutDuration": 30
}
```

### Updating 2FA Enforcement (Owner Only)

```typescript
const update2FAEnforcement = async (
  orgId: string,
  settings: {
    enforce2FA: boolean;
    enforce2FAForRoles?: string[];
  }
) => {
  const response = await fetch(`/api/organizations/${orgId}/security/2fa`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Only organization owners can update 2FA enforcement');
    }
    throw new Error('Failed to update 2FA enforcement');
  }

  return response.json();
};
```

### Handling 2FA Required Errors

```typescript
import { useRouter } from 'next/navigation';

const handleApiCall = async () => {
  try {
    const response = await fetch(`/api/organizations/${orgId}/resource`);

    if (response.status === 403) {
      const error = await response.json();

      if (error.message?.code === '2FA_REQUIRED') {
        // Redirect to 2FA setup
        router.push('/dashboard/settings/security');

        // Show notification
        toast.error(
          'Two-factor authentication is required. Please enable it in your security settings.'
        );
        return;
      }
    }

    // Handle other errors
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

### UI Component Example

```typescript
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';

const SecuritySettingsPanel = ({ orgId }: { orgId: string }) => {
  const [settings, setSettings] = useState({
    enforce2FA: false,
    enforce2FAForRoles: []
  });

  useEffect(() => {
    // Load current settings
    fetch(`/api/organizations/${orgId}/security`)
      .then(res => res.json())
      .then(data => setSettings(data));
  }, [orgId]);

  const handleUpdate = async () => {
    const response = await fetch(`/api/organizations/${orgId}/security/2fa`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (response.ok) {
      toast.success('2FA enforcement settings updated');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="enforce-2fa"
          checked={settings.enforce2FA}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, enforce2FA: checked })
          }
        />
        <Label htmlFor="enforce-2fa">
          Enforce two-factor authentication
        </Label>
      </div>

      {settings.enforce2FA && (
        <MultiSelect
          label="Required for roles"
          options={[
            { value: 'OWNER', label: 'Owner' },
            { value: 'ADMIN', label: 'Admin' },
            { value: 'EDITOR', label: 'Editor' },
            { value: 'VIEWER', label: 'Viewer' }
          ]}
          selected={settings.enforce2FAForRoles}
          onChange={(roles) =>
            setSettings({ ...settings, enforce2FAForRoles: roles })
          }
        />
      )}

      <button onClick={handleUpdate}>Save Changes</button>
    </div>
  );
};
```

## Testing

### Manual Testing Steps

1. **Setup**:
   - Create an organization as OWNER
   - Add a member with ADMIN role
   - Ensure ADMIN user hasn't enabled 2FA

2. **Test Enforcement**:
   ```bash
   # Enable 2FA enforcement for ADMIN role
   curl -X PATCH http://localhost:3001/api/organizations/{orgId}/security/2fa \
     -H "Authorization: Bearer {ownerToken}" \
     -H "Content-Type: application/json" \
     -d '{"enforce2FA": true, "enforce2FAForRoles": ["ADMIN"]}'
   ```

3. **Test Blocking**:
   ```bash
   # Try to access organization resource as ADMIN (should fail)
   curl http://localhost:3001/api/organizations/{orgId} \
     -H "Authorization: Bearer {adminToken}"

   # Expected: 403 Forbidden with 2FA_REQUIRED code
   ```

4. **Enable 2FA**:
   - ADMIN user enables 2FA in settings

5. **Test Access**:
   ```bash
   # Try to access organization resource again (should succeed)
   curl http://localhost:3001/api/organizations/{orgId} \
     -H "Authorization: Bearer {adminToken}"
   ```

### Unit Test Example

```typescript
describe('OrganizationService - 2FA Enforcement', () => {
  it('should return true when 2FA is enforced for user role', async () => {
    // Mock organization settings with 2FA enforced for ADMIN
    prismaService.organizationSettings.findUnique.mockResolvedValue({
      enforced2FA: true,
      enforce2FAForRoles: ['ADMIN']
    });

    // Mock user as ADMIN
    prismaService.organizationMember.findUnique.mockResolvedValue({
      role: 'ADMIN'
    });

    const result = await service.is2FARequired(orgId, userId);

    expect(result).toBe(true);
  });
});
```

## Common Use Cases

### Use Case 1: Require 2FA for All Admins and Owners

```typescript
await update2FAEnforcement(orgId, {
  enforce2FA: true,
  enforce2FAForRoles: ['OWNER', 'ADMIN']
});
```

### Use Case 2: Require 2FA for Everyone

```typescript
await update2FAEnforcement(orgId, {
  enforce2FA: true,
  enforce2FAForRoles: [] // Empty array = all roles
});
```

### Use Case 3: Disable 2FA Enforcement

```typescript
await update2FAEnforcement(orgId, {
  enforce2FA: false
});
```

## Troubleshooting

### "Only organization owners can update 2FA enforcement"

**Solution**: Only users with OWNER role can modify 2FA enforcement. Check user's role:
```bash
GET /api/organizations/{orgId}/members
```

### "Invalid roles: XYZ"

**Solution**: Only valid MemberRole values are accepted: `OWNER`, `ADMIN`, `EDITOR`, `VIEWER`

### Guard not blocking users without 2FA

**Checklist**:
1. Is `TwoFactorRequiredGuard` applied to the route?
2. Is it in the correct order (after JwtAuthGuard)?
3. Is the organization ID in route params (`:id` or `:organizationId`)?
4. Are the settings correctly saved in the database?

### Users with 2FA still blocked

**Checklist**:
1. Verify user's `twoFactorEnabled` field is `true`
2. Check if user's role is in `enforce2FAForRoles` array
3. Verify `enforced2FA` is `true` for the organization

## API Reference

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/organizations/:id/security` | Any member | Get security settings |
| PATCH | `/organizations/:id/security/2fa` | OWNER only | Update 2FA enforcement |

## Related Documentation

- [Full Documentation](./2FA_ENFORCEMENT.md)
- [RBAC Reference](../../refs/rbac.md)
- [Audit Logging](../../refs/auditlog.md)
