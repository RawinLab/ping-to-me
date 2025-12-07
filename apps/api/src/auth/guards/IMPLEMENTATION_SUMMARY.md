# API Scope Guard Implementation Summary

## Tasks Completed

### TASK-2.3.22: Create @RequireScope Decorator ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/rbac/require-scope.decorator.ts`

**Implementation**:

- Created `SCOPE_KEY` constant for metadata storage
- Implemented `RequireScope` decorator using `SetMetadata`
- Supports single scope: `@RequireScope('link:read')`
- Supports multiple scopes (OR): `@RequireScope(['link:read', 'link:create'])`
- Includes comprehensive JSDoc documentation with examples

**Key Features**:

- Type-safe scope parameter: `string | string[]`
- Clear documentation of scope format: `resource:action`
- Examples for single, multiple, and admin scopes
- Usage examples with NestJS controllers

---

### TASK-2.3.21: Create API Scope Guard ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/guards/api-scope.guard.ts`

**Implementation**:
The guard implements comprehensive API key validation and scope enforcement:

#### 1. **API Key Extraction**

- Supports `x-api-key` header: `x-api-key: <key>`
- Supports `Authorization` header: `Authorization: Bearer <key>`
- Prefers `x-api-key` if both are present

#### 2. **JWT Fallback**

- If no API key is present, checks for JWT authentication
- Allows `request.user` to pass through if present
- Throws `UnauthorizedException` if neither API key nor JWT is present

#### 3. **API Key Validation**

- Hashes provided key using SHA-256
- Looks up key in database by `keyHash`
- Validates key exists (throws `UnauthorizedException` if invalid)

#### 4. **Expiration Check**

- Checks `expiresAt` field if set
- Throws `ForbiddenException` if key is expired
- Allows non-expired keys to proceed

#### 5. **IP Whitelist Validation**

- Checks `ipWhitelist` field if set
- Supports individual IP addresses: `['192.168.1.1', '203.0.113.1']`
- Supports CIDR notation: `['10.0.0.0/8', '192.168.1.0/24']`
- Empty array = no restrictions
- Extracts IP from `X-Forwarded-For`, `X-Real-IP`, or `request.ip`
- Throws `ForbiddenException` if IP is not whitelisted

#### 6. **Scope Validation**

- Checks if API key has required scope(s)
- Supports single scope check
- Supports multiple scopes (OR condition) - needs ANY of the scopes
- Special `admin` scope grants full access
- Throws `ForbiddenException` with detailed error if scope is missing

#### 7. **LastUsedAt Update**

- Updates `lastUsedAt` timestamp on successful access
- Non-blocking operation (doesn't slow down requests)
- Catches and logs errors without blocking

#### 8. **Request Metadata Attachment**

- Attaches API key metadata to `request.apiKey`:
  ```typescript
  {
    id: string;
    name: string;
    organizationId: string;
    scopes: string[];
  }
  ```

#### 9. **Audit Logging**

- Logs access attempts in development mode
- Includes key ID, name, organization, scopes, and result
- Ready for production audit system integration

**Dependencies**:

- `@nestjs/common`: Guard, ExecutionContext, exceptions
- `@nestjs/core`: Reflector
- `PrismaService`: Database access
- `crypto`: SHA-256 hashing

---

### Additional Files Created/Updated

#### 1. **Guards Index** ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/guards/index.ts`

Exports all guards:

```typescript
export { JwtAuthGuard } from "./jwt-auth.guard";
export { RolesGuard } from "./roles.guard";
export { ApiScopeGuard } from "./api-scope.guard";
```

#### 2. **RBAC Index Updated** ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/rbac/index.ts`

Added exports for:

- `RequireScope` decorator
- `SCOPE_KEY` constant

#### 3. **Comprehensive Tests** ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/guards/__tests__/api-scope.guard.spec.ts`

**Test Coverage**: 25 unit tests covering:

- ✅ Public routes (no scope requirement)
- ✅ JWT authentication fallback
- ✅ API key extraction (both header formats)
- ✅ API key validation (invalid, expired)
- ✅ IP whitelist validation (individual IPs, CIDR, proxy headers)
- ✅ Scope validation (exact match, missing scope, admin scope, multiple scopes)
- ✅ LastUsedAt updates
- ✅ Request metadata attachment
- ✅ Integration scenarios (complete validation flow)

**All tests passing**: ✅ 25/25

#### 4. **Usage Documentation** ✅

**File**: `/Users/earn/Projects/rawinlab/pingtome/apps/api/src/auth/guards/API_SCOPE_GUARD_USAGE.md`

Complete documentation including:

- Overview and features
- Installation and basic usage
- Advanced usage patterns
- API key formats
- Validation flow
- IP whitelisting
- Scope naming conventions
- Error handling
- Testing examples
- Best practices
- Migration guide
- Troubleshooting

---

## Database Schema

The implementation uses the existing `ApiKey` model from Prisma schema:

```prisma
model ApiKey {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  keyHash        String    @unique
  name           String
  organizationId String    @db.Uuid
  scopes         String[]  // List of allowed scopes
  ipWhitelist    String[]  @default([]) // IP restrictions (empty = no restriction)
  rateLimit      Int?      // Optional requests per minute override
  expiresAt      DateTime? // Optional expiration date
  lastUsedAt     DateTime?
  createdAt      DateTime  @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
}
```

**Note**: Schema was updated to change `ipWhitelist` from `String[]?` to `String[] @default([])` to comply with Prisma's requirement that arrays cannot be optional.

---

## Usage Examples

### Basic Controller Protection

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
    // Accessible with 'link:read' or 'admin' scope
  }

  @Post()
  @RequireScope("link:create")
  async create() {
    // Accessible with 'link:create' or 'admin' scope
  }

  @Delete(":id")
  @RequireScope(["link:delete", "admin"])
  async delete() {
    // Accessible with 'link:delete' OR 'admin' scope
  }
}
```

### Dual Authentication (JWT + API Key)

```typescript
@Controller("analytics")
@UseGuards(JwtAuthGuard, ApiScopeGuard)
export class AnalyticsController {
  @Get("stats")
  @RequireScope("analytics:read")
  async getStats() {
    // Works with both JWT tokens and API keys
    // If API key is present, scope is checked
    // If no API key but valid JWT, access is granted
  }
}
```

### Accessing API Key Metadata

```typescript
import { Request } from 'express';

@Post()
@UseGuards(ApiScopeGuard)
@RequireScope('link:create')
async create(@Req() req: Request) {
  console.log(req.apiKey);
  // {
  //   id: 'key-123',
  //   name: 'Production API Key',
  //   organizationId: 'org-456',
  //   scopes: ['link:read', 'link:create']
  // }
}
```

---

## API Client Usage

### Using cURL with x-api-key

```bash
curl -H "x-api-key: pk_live_1234567890abcdef" \
  https://api.example.com/links
```

### Using cURL with Authorization Bearer

```bash
curl -H "Authorization: Bearer pk_live_1234567890abcdef" \
  https://api.example.com/links
```

### Using JavaScript fetch

```javascript
fetch("https://api.example.com/links", {
  headers: {
    "x-api-key": "pk_live_1234567890abcdef",
  },
});
```

---

## Error Responses

### Invalid API Key (401)

```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

### Expired API Key (403)

```json
{
  "statusCode": 403,
  "message": "API key has expired"
}
```

### IP Not Whitelisted (403)

```json
{
  "statusCode": 403,
  "message": "API key is not authorized for IP address: 1.2.3.4"
}
```

### Insufficient Scopes (403)

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

---

## Testing

### Run Unit Tests

```bash
pnpm --filter api test -- api-scope.guard.spec.ts
```

**Result**: ✅ All 25 tests passing

### Run Full API Test Suite

```bash
pnpm --filter api test
```

### Build Verification

```bash
pnpm --filter api build
```

**Result**: ✅ Build successful, no TypeScript errors

---

## Integration Points

### Works With

1. **JwtAuthGuard**: Can be used together for dual authentication
2. **PermissionGuard**: Can be used alongside for RBAC
3. **@RequireScope Decorator**: Primary decorator for scope enforcement
4. **PrismaService**: Database integration for API key lookup
5. **@nestjs/common Guards**: Standard NestJS guard pattern

### Compatible With

- **Express Request Object**: Attaches metadata to `request.apiKey`
- **Cloudflare Workers**: API keys work with edge redirector
- **Rate Limiting**: Can be combined with rate limit guards
- **Audit Logging**: Includes logging hooks for audit systems

---

## Files Summary

| File                         | Lines | Purpose                                        |
| ---------------------------- | ----- | ---------------------------------------------- |
| `require-scope.decorator.ts` | 52    | Scope requirement decorator                    |
| `api-scope.guard.ts`         | 315   | API key validation and scope enforcement guard |
| `api-scope.guard.spec.ts`    | 616   | Comprehensive unit tests (25 tests)            |
| `API_SCOPE_GUARD_USAGE.md`   | 600+  | Complete usage documentation                   |
| `guards/index.ts`            | 5     | Guards module exports                          |

**Total**: ~1,600 lines of implementation, tests, and documentation

---

## Next Steps

### Recommended Follow-ups

1. **API Key Management Controller**
   - Create/revoke API keys
   - Update scopes and IP whitelist
   - List keys and usage stats

2. **Rate Limiting Integration**
   - Use `rateLimit` field from API key
   - Implement per-key rate limiting
   - Track usage metrics

3. **Audit Logging**
   - Integrate with audit logging system
   - Log all API key access attempts
   - Track scope usage patterns

4. **API Key Rotation**
   - Implement key rotation mechanism
   - Deprecation warnings
   - Multi-key support per organization

5. **Scope Management UI**
   - Admin interface for scope assignment
   - Visual scope selector
   - Scope templates for common use cases

---

## Validation Checklist

- ✅ Decorator created with TypeScript types
- ✅ Guard implements all required validations
- ✅ SHA-256 key hashing implemented
- ✅ Expiration check implemented
- ✅ IP whitelist with CIDR support
- ✅ Scope validation with admin support
- ✅ JWT fallback support
- ✅ LastUsedAt update (non-blocking)
- ✅ Request metadata attachment
- ✅ Comprehensive error messages
- ✅ 25 unit tests all passing
- ✅ TypeScript compilation successful
- ✅ Build successful
- ✅ Complete documentation
- ✅ Usage examples provided
- ✅ Error handling documented

---

## Performance Considerations

1. **Non-Blocking Updates**: `lastUsedAt` update is asynchronous
2. **Single DB Query**: Only one query per request for key lookup
3. **Hash-Based Lookup**: Uses indexed `keyHash` field for fast lookups
4. **CIDR Caching**: Consider caching CIDR calculations for high-traffic scenarios
5. **Admin Scope**: Short-circuits scope checking for admin keys

---

## Security Notes

1. **Key Hashing**: API keys are hashed with SHA-256 before storage
2. **No Key Exposure**: Raw API keys are never logged or returned
3. **IP Validation**: Supports proxy headers for accurate IP detection
4. **Expiration Enforcement**: Expired keys are always rejected
5. **Detailed Errors**: Production should customize error messages to avoid information leakage

---

## Conclusion

The API Scope Guard implementation is complete, tested, and production-ready. It provides a robust, flexible, and secure way to enforce token-based authorization in the PingTO.Me platform.

**Status**: ✅ **READY FOR PRODUCTION**
