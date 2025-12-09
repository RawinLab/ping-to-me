# Backend Separation Audit - apps/web to apps/api Migration Todolist

> **Scan Date**: 2025-12-09
> **Scanned By**: System Analyst / Tech Lead
> **Status**: ✅ 100% Compliant - All issues resolved (2025-12-09)

## Executive Summary

การ scan `apps/web` พบว่า codebase มีความสอดคล้องกับ architecture rules อย่างดีเยี่ยม:
- ไม่มีการ import `@pingtome/database` หรือ Prisma client
- ไม่มี Next.js API routes ที่มี business logic
- ไม่มี Server Actions (`"use server"`)
- ไม่มี direct database queries
- API calls ทั้งหมดผ่าน `apiRequest()` ไปยัง NestJS backend

**พบปัญหาเพียง 2 จุด**: Hardcoded Organization ID ในหน้า Domains

---

## Todo Items for Claude Code Subagents

### Priority: HIGH - Security & Multi-tenancy Fix

#### Task 1: Fix Hardcoded OrgId in Domains List Page
- **File**: `apps/web/app/dashboard/domains/page.tsx`
- **Line**: 50
- **Current Code**:
  ```tsx
  // Mock orgId for now, in real app get from context/auth
  const orgId = "123e4567-e89b-12d3-a456-426614174000";
  ```
- **Required Fix**:
  ```tsx
  import { useOrganization } from "@/contexts/OrganizationContext";

  // Inside component:
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id || "";
  ```
- **Why**: Breaks multi-tenancy isolation, security vulnerability
- **Assigned Agent**: `javascript-typescript:typescript-pro`
- **Status**: [x] Completed (2025-12-09)

#### Task 2: Fix Hardcoded OrgId in Domain Detail Page
- **File**: `apps/web/app/dashboard/domains/[id]/page.tsx`
- **Line**: 63
- **Current Code**:
  ```tsx
  // Mock orgId for now, in real app get from context/auth
  const orgId = "123e4567-e89b-12d3-a456-426614174000";
  ```
- **Required Fix**:
  ```tsx
  import { useOrganization } from "@/contexts/OrganizationContext";

  // Inside component:
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id || "";
  ```
- **Why**: Breaks multi-tenancy isolation, security vulnerability
- **Assigned Agent**: `javascript-typescript:typescript-pro`
- **Status**: [x] Completed (2025-12-09)

---

## Verified Compliant Areas (No Action Required)

### Database Isolation
- [x] No `@pingtome/database` imports in apps/web
- [x] No `@prisma/client` imports
- [x] No `new PrismaClient()` instantiation
- [x] No direct Prisma operations (findUnique, findMany, create, update, delete)

### API Routes
- [x] `/apps/web/app/api/` directory is empty
- [x] No `/pages/api/` directory exists
- [x] No Server Actions (`"use server"` directive)

### API Client Architecture
- [x] `lib/api/api.ts` - Axios config with token refresh interceptor
- [x] `lib/api/domains.ts` - Domain API wrapper functions
- [x] `lib/api/invitations.ts` - Invitation API wrapper functions
- [x] `lib/api/organizations.ts` - Organization API wrapper functions
- [x] `lib/api/security.ts` - Security/session API wrapper functions
- [x] `lib/api/sso.ts` - SAML/SSO configuration API wrapper functions

### Organization Context Usage
Pages correctly using `useOrganization()`:
- [x] `/app/dashboard/organization/page.tsx`
- [x] `/app/dashboard/settings/developer/page.tsx`
- [x] `/app/dashboard/settings/team/page.tsx`
- [x] `/app/dashboard/bio/page.tsx`
- [x] `/app/dashboard/links/new/page.tsx`
- [x] `/app/dashboard/page.tsx`
- [x] `/app/dashboard/billing/page.tsx`
- [x] `/app/dashboard/analytics/page.tsx`

### Server Components
- [x] `/app/bio/[slug]/page.tsx` - Correctly fetches from API: `GET /biopages/public/{slug}`

### E2E Tests
- [x] Test fixtures contain only test data constants
- [x] Playwright tests interact via HTTP API only

---

## API Endpoint Verification Matrix

| Feature | Endpoint | Implementation | Status |
|---------|----------|----------------|--------|
| Domains CRUD | GET/POST/PUT/DELETE `/domains` | `lib/api/domains.ts` | [x] Verified |
| Organizations | GET/POST/PUT/DELETE `/organizations` | `lib/api/organizations.ts` | [x] Verified |
| Team Members | `/organizations/{id}/members` | `lib/api/organizations.ts` | [x] Verified |
| Invitations | `/invitations/*` | `lib/api/invitations.ts` | [x] Verified |
| Sessions | GET/DELETE `/auth/sessions` | `lib/api/security.ts` | [x] Verified |
| Login Activity | GET `/auth/login-activity` | `lib/api/security.ts` | [x] Verified |
| Audit Logs | GET `/audit/logs` | Direct apiRequest | [x] Verified |
| API Keys | `/developer/api-keys` | Direct apiRequest | [x] Verified |
| Webhooks | `/developer/webhooks` | Direct apiRequest | [x] Verified |
| Links | `/links` | `lib/api.ts` apiRequest | [x] Verified |
| Analytics | `/analytics/*` | `lib/api.ts` apiRequest | [x] Verified |
| Tags | `/tags` | `lib/api.ts` apiRequest | [x] Verified |
| QR Codes | `/qr/*` | `lib/api.ts` apiRequest | [x] Verified |
| Bio Pages | `/biopages/*` | `lib/api.ts` apiRequest | [x] Verified |

---

## Execution Instructions for Claude Code

### Run Task 1 & 2 in Parallel:
```
Use subagent_type: javascript-typescript:typescript-pro

Task 1 Prompt:
"Fix hardcoded orgId in apps/web/app/dashboard/domains/page.tsx line 50.
Replace the hardcoded UUID with useOrganization() context hook.
Import { useOrganization } from '@/contexts/OrganizationContext'.
Use const { currentOrg } = useOrganization(); and const orgId = currentOrg?.id || '';
Make sure to handle loading state when currentOrg is undefined.
Follow the pattern used in apps/web/app/dashboard/analytics/page.tsx"

Task 2 Prompt:
"Fix hardcoded orgId in apps/web/app/dashboard/domains/[id]/page.tsx line 63.
Replace the hardcoded UUID with useOrganization() context hook.
Import { useOrganization } from '@/contexts/OrganizationContext'.
Use const { currentOrg } = useOrganization(); and const orgId = currentOrg?.id || '';
Make sure to handle loading state when currentOrg is undefined.
Follow the pattern used in apps/web/app/dashboard/analytics/page.tsx"
```

### Post-Fix Verification:
```bash
# Run E2E tests for domains
npx playwright test --project=chromium domains.spec.ts

# Run lint check
pnpm lint
```

---

## Conclusion

Codebase สอดคล้องกับ architecture rules อย่างดีเยี่ยม มีเพียง 2 จุดที่ต้องแก้ไข ซึ่งเป็น hardcoded orgId ที่เหลือจากการพัฒนา (mock data) การแก้ไขง่ายและตรงไปตรงมา สามารถดำเนินการได้ทันที
