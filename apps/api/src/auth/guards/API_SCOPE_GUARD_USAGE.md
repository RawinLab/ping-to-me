# API Scope Guard Usage Guide

## Overview

The `ApiScopeGuard` provides token-based authorization for API routes using the `@RequireScope` decorator. It validates API keys and enforces scope-based access control.

## Features

- **API Key Validation**: Validates API keys from headers
- **Scope Enforcement**: Enforces granular scope requirements
- **Expiration Checking**: Blocks expired API keys
- **IP Whitelisting**: Optional IP-based access control with CIDR support
- **JWT Fallback**: Allows JWT authentication when no API key is present
- **Metadata Attachment**: Attaches API key info to request object
- **Audit Logging**: Logs access attempts for audit purposes

## Installation

The guard is automatically exported from the guards module:

```typescript
import { ApiScopeGuard } from "./auth/guards";
import { RequireScope } from "./auth/rbac";
```

## Basic Usage

### Controller-Level Protection

Apply the guard to an entire controller:

```typescript
import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiScopeGuard } from "../auth/guards";
import { RequireScope } from "../auth/rbac";

@Controller("links")
@UseGuards(ApiScopeGuard)
export class LinksController {
  @Get()
  @RequireScope("link:read")
  async findAll() {
    // Only accessible with 'link:read' or 'admin' scope
  }

  @Post()
  @RequireScope("link:create")
  async create() {
    // Only accessible with 'link:create' or 'admin' scope
  }
}
```

### Route-Level Protection

Apply the guard to specific routes:

```typescript
@Controller("analytics")
export class AnalyticsController {
  @Get("stats")
  @UseGuards(ApiScopeGuard)
  @RequireScope("analytics:read")
  async getStats() {
    // Protected by API scope
  }

  @Get("public")
  async getPublicStats() {
    // Not protected - public route
  }
}
```

## Advanced Usage

### Multiple Scopes (OR Condition)

Allow access if the API key has ANY of the specified scopes:

```typescript
@Post('update')
@UseGuards(ApiScopeGuard)
@RequireScope(['link:update', 'admin'])
async update() {
  // Accessible with either 'link:update' OR 'admin' scope
}
```

### Admin Scope

The special `admin` scope grants access to all routes:

```typescript
@Delete(':id')
@UseGuards(ApiScopeGuard)
@RequireScope('link:delete')
async delete() {
  // Accessible with 'link:delete' OR 'admin' scope
}
```

### Accessing API Key Metadata

The guard attaches API key metadata to the request object:

```typescript
import { Request } from 'express';

@Post()
@UseGuards(ApiScopeGuard)
@RequireScope('link:create')
async create(@Req() req: Request) {
  // Access API key metadata
  console.log(req.apiKey);
  // {
  //   id: 'key-123',
  //   name: 'Production API Key',
  //   organizationId: 'org-456',
  //   scopes: ['link:read', 'link:create']
  // }
}
```

### Combining with JWT Auth

The guard allows both API key and JWT authentication:

```typescript
@Controller("links")
@UseGuards(JwtAuthGuard, ApiScopeGuard)
export class LinksController {
  @Get()
  @RequireScope("link:read")
  async findAll(@Req() req: Request) {
    // If API key is provided, scope is checked
    // If no API key but valid JWT, access is granted
    // If neither, UnauthorizedException is thrown
  }
}
```

## API Key Formats

The guard supports two header formats:

### x-api-key Header

```bash
curl -H "x-api-key: pk_live_1234567890abcdef" \
  https://api.example.com/links
```

### Authorization: Bearer Header

```bash
curl -H "Authorization: Bearer pk_live_1234567890abcdef" \
  https://api.example.com/links
```

## Validation Flow

The guard performs the following validation steps:

1. **Scope Check**: If no `@RequireScope` decorator, allow access (public route)
2. **API Key Extraction**: Extract API key from `x-api-key` or `Authorization` header
3. **JWT Fallback**: If no API key, check for JWT authentication
4. **Key Lookup**: Find API key in database by hash
5. **Expiration Check**: Verify key is not expired (if `expiresAt` is set)
6. **IP Whitelist**: Verify request IP is allowed (if `ipWhitelist` is set)
7. **Scope Validation**: Verify key has required scope
8. **Update LastUsedAt**: Update timestamp (non-blocking)
9. **Attach Metadata**: Add API key info to request object

## IP Whitelisting

API keys can be restricted to specific IP addresses:

### Individual IPs

```typescript
// In database:
{
  ipWhitelist: ["203.0.113.1", "203.0.113.2"];
}
```

### CIDR Notation

```typescript
// In database:
{
  ipWhitelist: ["10.0.0.0/8", "192.168.1.0/24"];
}
```

### Behind Proxies

The guard automatically checks these headers for real IP:

- `X-Forwarded-For` (takes first IP)
- `X-Real-IP`
- Falls back to `request.ip`

## Scope Naming Convention

Scopes follow the format: `resource:action`

### Common Scopes

```typescript
// Links
"link:read"; // Read links
"link:create"; // Create links
"link:update"; // Update links
"link:delete"; // Delete links

// Analytics
"analytics:read"; // Read analytics data
"analytics:export"; // Export analytics data

// Organizations
"organization:read"; // Read organization data
"organization:update"; // Update organization

// Special
"admin"; // Full access to all resources
```

## Error Handling

### UnauthorizedException

Thrown when no valid authentication is present:

```json
{
  "statusCode": 401,
  "message": "API key or valid authentication required"
}
```

```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

### ForbiddenException

Thrown when API key is valid but lacks required permissions:

```json
{
  "statusCode": 403,
  "message": "API key has expired"
}
```

```json
{
  "statusCode": 403,
  "message": "API key is not authorized for IP address: 1.2.3.4"
}
```

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient API key scopes",
  "details": {
    "requiredScopes": "link:delete",
    "availableScopes": ["link:read", "link:create"],
    "keyName": "Production API Key"
  }
}
```

## Testing

### Unit Tests

The guard includes comprehensive unit tests covering:

- Public routes (no scope requirement)
- JWT authentication fallback
- API key extraction (both header formats)
- API key validation (invalid, expired)
- IP whitelist validation (individual IPs, CIDR)
- Scope validation (exact match, admin scope, multiple scopes)
- LastUsedAt updates
- Request metadata attachment
- Integration scenarios

Run tests:

```bash
pnpm --filter api test -- api-scope.guard.spec.ts
```

### Integration Testing

Example test with real API key:

```typescript
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

describe("API Key Integration", () => {
  let app: INestApplication;
  let apiKey: string;

  beforeAll(async () => {
    // Setup app and create API key
  });

  it("should allow access with valid API key", async () => {
    return request(app.getHttpServer())
      .get("/links")
      .set("x-api-key", apiKey)
      .expect(200);
  });

  it("should deny access with invalid scope", async () => {
    return request(app.getHttpServer())
      .delete("/links/123")
      .set("x-api-key", apiKey) // Only has 'link:read'
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe("Insufficient API key scopes");
      });
  });
});
```

## Best Practices

### 1. Use Specific Scopes

```typescript
// Good: Specific scope for the action
@RequireScope('link:delete')

// Bad: Overly broad scope
@RequireScope('admin')
```

### 2. Combine with Other Guards

```typescript
// Combine with JWT auth for dual authentication
@UseGuards(JwtAuthGuard, ApiScopeGuard)
@RequireScope('link:create')
```

### 3. Use Array for Flexible Access

```typescript
// Allow multiple scopes for same action
@RequireScope(['link:update', 'link:delete', 'admin'])
```

### 4. Document Required Scopes

```typescript
/**
 * Delete a link
 * @requires API scope: link:delete or admin
 */
@Delete(':id')
@RequireScope('link:delete')
async delete() { }
```

### 5. Set Expiration on API Keys

```typescript
// In API key creation
{
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
}
```

### 6. Use IP Whitelisting for Sensitive Operations

```typescript
// In API key creation for production servers
{
  ipWhitelist: ['203.0.113.0/24'], // Only allow from production subnet
  scopes: ['link:delete', 'organization:update']
}
```

## Migration from Permission Guard

If you're migrating from the Permission Guard:

```typescript
// Before: Permission-based (user + role)
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'link', action: 'create' })

// After: Dual authentication (supports both)
@UseGuards(JwtAuthGuard, ApiScopeGuard)
@RequireScope('link:create')
// Now works with both JWT (falls through) and API keys (scope checked)
```

## Troubleshooting

### API Key Not Working

1. **Check key hash**: Ensure the key is hashed correctly in the database
2. **Check expiration**: Verify `expiresAt` is null or in the future
3. **Check scopes**: Ensure the scope exists in `scopes` array
4. **Check IP**: If `ipWhitelist` is set, verify your IP is included

### JWT Fallthrough Not Working

1. **Check guard order**: `JwtAuthGuard` must come before `ApiScopeGuard`
2. **Check decorator**: Ensure `@RequireScope` is present
3. **Check user object**: Verify `request.user` is populated by JWT guard

### Scope Always Denied

1. **Check scope format**: Must be `resource:action` (e.g., `link:read`)
2. **Check admin scope**: `admin` scope should grant access to all
3. **Check array syntax**: For multiple scopes, use array: `['scope1', 'scope2']`

## Related Documentation

- [API Scopes Definition](../rbac/api-scopes.ts) - List of all available scopes
- [RequireScope Decorator](../rbac/require-scope.decorator.ts) - Decorator source
- [Permission Guard](../rbac/permission.guard.ts) - Role-based permission guard
- [RBAC System](../rbac/USAGE_EXAMPLES.md) - Overall RBAC documentation
