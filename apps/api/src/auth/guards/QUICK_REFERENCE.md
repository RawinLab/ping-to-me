# API Scope Guard - Quick Reference

## Import

```typescript
import { ApiScopeGuard } from "../auth/guards";
import { RequireScope } from "../auth/rbac";
```

## Basic Usage

```typescript
@Controller("links")
@UseGuards(ApiScopeGuard)
export class LinksController {
  @Get()
  @RequireScope("link:read")
  findAll() {}

  @Post()
  @RequireScope("link:create")
  create() {}
}
```

## Multiple Scopes (OR)

```typescript
@Delete(':id')
@RequireScope(['link:delete', 'admin'])
delete() { }
```

## With JWT Auth

```typescript
@UseGuards(JwtAuthGuard, ApiScopeGuard)
@RequireScope('link:read')
```

## Access API Key Metadata

```typescript
import { Request } from 'express';

@Post()
@RequireScope('link:create')
create(@Req() req: Request) {
  console.log(req.apiKey.organizationId);
  console.log(req.apiKey.scopes);
}
```

## API Client Usage

### cURL

```bash
# x-api-key header
curl -H "x-api-key: pk_live_abc123" \
  https://api.example.com/links

# Authorization Bearer
curl -H "Authorization: Bearer pk_live_abc123" \
  https://api.example.com/links
```

### JavaScript

```javascript
fetch("https://api.example.com/links", {
  headers: { "x-api-key": "pk_live_abc123" },
});
```

## Common Scopes

```typescript
"link:read";
"link:create";
"link:update";
"link:delete";
"analytics:read";
"analytics:export";
"organization:read";
"organization:update";
"admin"; // Full access
```

## Error Responses

| Status | Error               | Cause                      |
| ------ | ------------------- | -------------------------- |
| 401    | Invalid API key     | Key not found in database  |
| 403    | API key has expired | `expiresAt` is in the past |
| 403    | IP not authorized   | IP not in `ipWhitelist`    |
| 403    | Insufficient scopes | Key lacks required scope   |

## API Key Database Schema

```typescript
{
  id: string;
  keyHash: string;  // SHA-256 hash
  name: string;
  organizationId: string;
  scopes: string[];  // Required scopes
  ipWhitelist: string[];  // [] = no restriction
  expiresAt: Date | null;  // null = never expires
  lastUsedAt: Date | null;
}
```

## Testing

```bash
# Run tests
pnpm --filter api test -- api-scope.guard.spec.ts

# Build
pnpm --filter api build
```

## Documentation

- [Full Usage Guide](./API_SCOPE_GUARD_USAGE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [RBAC System](../rbac/USAGE_EXAMPLES.md)
