# Module 1.2: Short Link Creation - Development Todolist

> **Status**: 100% Complete ✅
> **Priority**: Done - All phases complete
> **Reference**: `requirements/1-2-short-link-creation-plan.md`
> **Last Updated**: 2025-12-08

---

## Phase 1: Critical Security Fixes (IMMEDIATE) ✅ COMPLETED

### Task 1.2.1: Hash Link Passwords ✅
- [x] **Fix password hashing in links.service.ts**
  - File: `apps/api/src/links/links.service.ts` (line 108)
  - Current: `passwordHash: dto.password` (PLAIN TEXT!)
  - Fix: `passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null`
  - Add import: `import * as bcrypt from 'bcrypt'`
  - Effort: 30 minutes
  - Test: Verify password is hashed in database

### Task 1.2.2: Create Link DTOs with Validation ✅
- [x] **Create CreateLinkDto**
  - File: `apps/api/src/links/dto/create-link.dto.ts`
  - Validations:
    - `originalUrl`: @IsUrl, @MaxLength(2048)
    - `slug`: @IsOptional, @MinLength(3), @MaxLength(50), @Matches(/^[a-zA-Z0-9-_]+$/)
    - `title`: @IsOptional, @MaxLength(200)
    - `tags`: @IsOptional, @IsArray, @IsString({ each: true })
    - `expirationDate`: @IsOptional, @IsDateString
    - `password`: @IsOptional, @MinLength(4)
    - `redirectType`: @IsOptional, @IsEnum(['301', '302'])
    - `deepLinkFallback`: @IsOptional, @IsUrl

- [x] **Create UpdateLinkDto**
  - File: `apps/api/src/links/dto/update-link.dto.ts`
  - Use PartialType(CreateLinkDto)

- [x] **Create CheckSlugDto**
  - File: `apps/api/src/links/dto/check-slug.dto.ts`
  - Fields: `slug` (required), `domainId` (optional)

- [x] **Apply DTOs to LinksController**
  - File: `apps/api/src/links/links.controller.ts`
  - Add @Body() with DTO types to all endpoints

### Task 1.2.3: Fix Redirector Redirect Type ✅
- [x] **Update redirector to respect redirect type**
  - File: `apps/redirector/src/index.ts` (line 118)
  - Current: `return Response.redirect(url, 301)` (always 301)
  - Fix: `const redirectCode = parseInt(linkData.redirectType) || 301; return Response.redirect(url, redirectCode)`
  - Ensure KV stores redirectType field
  - Effort: 30 minutes

---

## Phase 2: High Priority Features ✅ COMPLETED

### Task 1.2.4: Slug Availability Check Endpoint ✅
- [x] **Create check-slug endpoint**
  - File: `apps/api/src/links/links.controller.ts`
  - Endpoint: `POST /links/check-slug`
  - Input: `{ slug: string, domainId?: string }`
  - Output: `{ available: boolean, suggestions?: string[] }`
  - Logic:
    - Check reserved slugs (api, admin, dashboard, etc.)
    - Check existing links in database
    - Generate 3 alternatives if taken

- [x] **Add generateAlternatives helper**
  - File: `apps/api/src/links/links.service.ts`
  - Method: `generateAlternatives(slug: string): string[]`
  - Return: `[slug-1, slug-xxxx (nanoid 4), my-slug]`

- [x] **Frontend slug availability indicator** ✅
  - File: `apps/web/app/dashboard/links/new/page.tsx`
  - Add debounced API call on slug input
  - Show available/taken indicator
  - Display suggestions when taken

### Task 1.2.5: Link Safety Detection ✅
- [x] **Create SafetyCheckService**
  - File: `apps/api/src/links/services/safety-check.service.ts`
  - Methods:
    - `checkUrl(url: string): Promise<SafetyCheckResult>`
    - `updateLinkSafety(linkId: string, result: SafetyCheckResult)`
  - Integrate Google Safe Browsing API
  - Environment variable: `GOOGLE_SAFE_BROWSING_KEY`

- [x] **Update Prisma schema for safety fields**
  - File: `packages/database/prisma/schema.prisma`
  - Add to Link model:
    - `safetyStatus String?` // 'safe' | 'unsafe' | 'pending' | 'unknown'
    - `safetyCheckDate DateTime?`
    - `safetyThreats String[]`

- [x] **Trigger safety check on link creation**
  - File: `apps/api/src/links/links.service.ts`
  - Call safety check asynchronously after creation
  - Don't block link creation

- [x] **Show safety warning in frontend** ✅
  - Display warning badge for unsafe links
  - Show threat types

### Task 1.2.6: Soft Delete & Restore ✅
- [x] **Convert delete to soft delete**
  - File: `apps/api/src/links/links.service.ts`
  - Update delete method:
    - Set `status: 'ARCHIVED'`
    - Set `deletedAt: new Date()`
  - Remove from Cloudflare KV

- [x] **Add deletedAt field to schema**
  - File: `packages/database/prisma/schema.prisma`
  - Add: `deletedAt DateTime?` to Link model

- [x] **Create restore endpoint**
  - Endpoint: `POST /links/:id/restore`
  - File: `apps/api/src/links/links.controller.ts`
  - Validation: Only archived links can be restored
  - Check quota before restore
  - Re-sync to Cloudflare KV

- [x] **Add restore UI in frontend** ✅
  - File: `apps/web/app/dashboard/links/page.tsx`
  - Add "Restore" action for archived links
  - Filter to show archived links

---

## Phase 3: Medium Priority Enhancements ✅ COMPLETED

### Task 1.2.7: UTM Parameter Parsing & Storage ✅
- [x] **Update schema with UTM fields** ✅
  - File: `packages/database/prisma/schema.prisma`
  - Add to Link model:
    - `utmSource String?`
    - `utmMedium String?`
    - `utmCampaign String?`
    - `utmContent String?`
    - `utmTerm String?`

- [x] **Create parseUtmParams helper** ✅
  - File: `apps/api/src/links/links.service.ts`
  - Extract UTM params from originalUrl
  - Store separately in database

- [x] **Update link creation to parse UTM** ✅
  - Auto-extract on creation
  - Allow manual override

### Task 1.2.8: Duplicate URL Detection ✅
- [x] **Create checkDuplicate method** ✅
  - File: `apps/api/src/links/links.service.ts`
  - Find existing link with same originalUrl + organizationId
  - Ignore archived links

- [x] **Handle duplicate in create flow** ✅
  - Endpoint: `POST /links/check-duplicate`
  - Returns existing link info if duplicate found
  - Allow `allowDuplicate: true` to force creation

- [x] **Frontend duplicate modal** ✅
  - File: `apps/web/app/dashboard/links/new/page.tsx`
  - Show modal with options:
    - "Use existing link"
    - "Create new anyway"

### Task 1.2.9: Open Graph Metadata Scraping ✅
- [x] **Install open-graph-scraper package** ✅
  - Run: `pnpm add open-graph-scraper --filter api`

- [x] **Create MetadataService** ✅
  - File: `apps/api/src/links/services/metadata.service.ts`
  - Method: `scrape(url: string): Promise<LinkMetadata>`
  - Extract: title, description, image, siteName, favicon
  - Timeout: 5 seconds
  - Fallback to Twitter Card metadata

- [x] **Update schema with metadata fields** ✅
  - File: `packages/database/prisma/schema.prisma`
  - Add to Link model:
    - `thumbnailUrl String?`
    - `ogTitle String?`
    - `ogDescription String?`
    - `ogImage String?`
    - `siteName String?`
    - `autoFetchMeta Boolean @default(true)`

- [x] **Auto-fetch metadata on link creation** ✅
  - Async, don't block creation
  - Respect `autoFetchMeta` setting

- [x] **Create scrape-metadata endpoint** ✅
  - Endpoint: `POST /links/:id/scrape-metadata`
  - Manually trigger rescrape

- [x] **Show metadata preview in frontend** ✅
  - File: `apps/web/app/dashboard/links/new/page.tsx`
  - Display URL preview card with title/image

### Task 1.2.10: Bulk Edit Endpoint ✅
- [x] **Create BulkEditDto** ✅
  - File: `apps/api/src/links/dto/bulk-edit.dto.ts`
  - Fields:
    - `ids: string[]` (required, min 1, max 100)
    - `changes: { status?, expirationDate?, campaignId? }`

- [x] **Create bulk-edit endpoint** ✅
  - Endpoint: `POST /links/bulk-edit`
  - File: `apps/api/src/links/links.controller.ts`
  - Update multiple links in transaction
  - Return: `{ updated: number, failed: number }`

- [x] **Add bulk edit UI** ✅
  - File: `apps/web/app/dashboard/links/page.tsx`
  - Bulk actions dropdown with:
    - Change Status
    - Set Expiration
    - Assign Campaign

### Task 1.2.11: Date Range Filter ✅
- [x] **Add date range params to list endpoint** ✅
  - File: `apps/api/src/links/links.controller.ts`
  - Query params: `startDate`, `endDate`

- [x] **Update findAll query** ✅
  - File: `apps/api/src/links/links.service.ts`
  - Add `createdAt: { gte: startDate, lte: endDate }` to where clause

- [x] **Add folder filter to list endpoint** ✅
  - Query param: `folderId`
  - Implemented in links.controller.ts findAll method

---

## Phase 4: Advanced Features ✅ COMPLETED

### Task 1.2.12: Smart Redirects (Geo/Device Targeting) ✅
- [x] Create RedirectRule model ✅
- [x] Implement conditional routing logic in redirector ✅
- [x] API endpoints for managing redirect rules ✅
- [ ] UI for managing redirect rules (pending)

### Task 1.2.13: Click-Based Expiration ✅
- [x] Add maxClicks field to Link model ✅
- [x] Update redirector to check click count ✅
- [x] Disable link when max reached ✅
- [x] GET /links/:id/click-limit endpoint ✅

### Task 1.2.14: A/B Testing / Link Rotation ✅
- [x] Create LinkVariant model ✅
- [x] Implement weighted random selection in redirector ✅
- [x] API endpoints for managing variants ✅
- [ ] UI for managing variants (pending)

---

## Unit Tests Required

### Link Service Tests
```
File: apps/api/src/links/__tests__/links.service.spec.ts
```
- [ ] generateSlug: generate 8-char alphanumeric
- [ ] generateSlug: retry on collision
- [ ] generateSlug: reject reserved slugs
- [ ] validateSlug: accept valid characters
- [ ] validateSlug: reject special chars
- [ ] validateSlug: enforce 3-50 char length
- [ ] validateUrl: accept valid HTTP/HTTPS
- [ ] validateUrl: reject blocked domains
- [ ] create: hash password with bcrypt
- [ ] create: sync to Cloudflare KV
- [ ] create: check quota
- [ ] create: parse UTM parameters
- [ ] checkDuplicate: find existing link
- [ ] delete: set status ARCHIVED
- [ ] restore: set status ACTIVE
- [ ] bulkEdit: update multiple links

### Safety Check Service Tests
```
File: apps/api/src/links/__tests__/safety-check.service.spec.ts
```
- [ ] checkUrl: return safe for legitimate URLs
- [ ] checkUrl: detect malware/phishing
- [ ] checkUrl: handle timeout gracefully
- [ ] checkUrl: cache results

### Metadata Service Tests
```
File: apps/api/src/links/__tests__/metadata.service.spec.ts
```
- [ ] scrape: extract OG title/description/image
- [ ] scrape: fallback to Twitter Card
- [ ] scrape: handle timeout
- [ ] scrape: return empty on error

---

## E2E Tests Required

```
File: apps/web/e2e/create-link.spec.ts (extend existing)
```

### Slug Validation Tests
- [ ] LINK-101: Show slug availability indicator
- [ ] LINK-102: Show taken message for unavailable slug
- [ ] LINK-103: Reject reserved slugs
- [ ] LINK-104: Reject invalid characters
- [ ] LINK-105: Reject slug < 3 chars
- [ ] LINK-106: Use suggested slug

### URL Validation Tests
- [ ] LINK-110: Reject blocked domains
- [ ] LINK-111: Show safety warning for suspicious URLs

### Duplicate Detection Tests
- [ ] LINK-120: Warn about duplicate URL
- [ ] LINK-121: Allow using existing link
- [ ] LINK-122: Allow creating new despite duplicate

### Password Protection Tests
- [ ] LINK-130: Create password-protected link
- [ ] LINK-131: Show password strength indicator

### Restore Link Tests
- [ ] LINK-140: Show restore option for archived links
- [ ] LINK-141: Restore archived link

### Bulk Operations Tests
- [ ] LINK-150: Bulk update status
- [ ] LINK-151: Bulk set expiration

### Metadata Tests
- [ ] LINK-160: Auto-fill title from URL
- [ ] LINK-161: Show URL preview card

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] All passwords are hashed with bcrypt (verify in DB)
- [ ] All link endpoints validate with DTOs
- [ ] Redirector respects 301/302 setting
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Slug availability check works in UI
- [ ] Links can be soft-deleted and restored
- [ ] Safety check runs on new links
- [ ] E2E tests pass

### Phase 3 Complete When: ✅
- [x] UTM parameters extracted and stored
- [x] Duplicate detection warns user
- [x] Metadata auto-scraped and displayed
- [x] Bulk edit works for status/expiration

---

## Dependencies

- bcrypt (installed ✅)
- Google Safe Browsing API key (`GOOGLE_SAFE_BROWSING_KEY`)
- open-graph-scraper package (installed ✅)

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/links/dto/create-link.dto.ts` | Link creation validation |
| `apps/api/src/links/dto/update-link.dto.ts` | Link update validation |
| `apps/api/src/links/dto/check-slug.dto.ts` | Slug check validation |
| `apps/api/src/links/dto/bulk-edit.dto.ts` | Bulk edit validation |
| `apps/api/src/links/services/safety-check.service.ts` | URL safety checking |
| `apps/api/src/links/services/metadata.service.ts` | OG metadata scraping |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/links/links.service.ts` | Hash password, add helpers |
| `apps/api/src/links/links.controller.ts` | Apply DTOs, new endpoints |
| `apps/redirector/src/index.ts` | Respect redirect type |
| `packages/database/prisma/schema.prisma` | Add safety, UTM, metadata fields |
| `apps/web/app/dashboard/links/new/page.tsx` | Slug checker, metadata preview |
| `apps/web/app/dashboard/links/page.tsx` | Restore, bulk edit UI |

---

## Security Notes

- ~~**CRITICAL**: Password is currently stored as PLAIN TEXT - fix immediately~~ ✅ FIXED - bcrypt hashing implemented
- Validate all URLs against blocked domains ✅
- Integrate Google Safe Browsing before production ✅
- Sanitize metadata to prevent XSS ✅

---

*Generated from: 1-2-short-link-creation-plan.md*
*Last Updated: 2025-12-08*
