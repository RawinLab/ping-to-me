# Module 1.2: Short Link Creation - Development Plan

## Executive Summary

This document outlines the development plan for the Short Link Creation module of PingTO.Me. Based on comprehensive codebase analysis, the link creation system is approximately **75-80% complete** with excellent core functionality but missing some security features and advanced capabilities.

---

## 1. Current State Analysis

### 1.1 What's Already Implemented ✅

#### Backend (NestJS)
| Feature | Status | Location |
|---------|--------|----------|
| Create Link Endpoint | ✅ Complete | `links.controller.ts:POST /links` |
| List Links with Pagination | ✅ Complete | `links.controller.ts:GET /links` |
| Get Link Details | ✅ Complete | `links.controller.ts:GET /links/:id` |
| Update Link | ✅ Complete | `links.controller.ts:POST /links/:id` |
| Delete Link | ✅ Complete | `links.controller.ts:DELETE /links/:id` |
| Slug Generation (nanoid 8 chars) | ✅ Complete | `links.service.ts:generateSlug()` |
| Reserved Slug Checking | ✅ Complete | api, admin, dashboard, auth, login, register |
| URL Format Validation | ✅ Complete | `new URL()` check |
| Blocked Domain Checking | ✅ Complete | Via `BlockedDomain` model |
| Custom Domain Selection | ✅ Complete | Auto-select org default domain |
| Expiration Date Handling | ✅ Complete | Stored and checked in redirector |
| Password Field | ⚠️ Partial | Field exists but NOT hashed |
| Redirect Type (301/302) | ⚠️ Partial | Stored but redirector ignores |
| Deep Link Fallback | ✅ Complete | Stored in KV |
| Tags Array | ✅ Complete | Stored on Link model |
| Campaign Association | ✅ Complete | `campaignId` field |
| Folder Association | ✅ Complete | `folderId` field |
| Cloudflare KV Sync | ✅ Complete | On create/update/delete |
| QR Code Generation | ✅ Complete | Via QR module integration |
| Bulk Import (CSV) | ✅ Complete | `POST /links/import` |
| Bulk Export (CSV) | ✅ Complete | `GET /links/export` |
| Bulk Delete | ✅ Complete | `POST /links/bulk-delete` |
| Bulk Tag | ✅ Complete | `POST /links/bulk-tag` |
| Search & Filter | ✅ Complete | tag, campaign, status, search |
| RBAC Permissions | ✅ Complete | `@Permission` decorators |
| Quota Management | ✅ Complete | Check before create, increment usage |
| Audit Logging | ✅ Complete | Via `AuditService` |

#### Frontend (Next.js)
| Feature | Status | Location |
|---------|--------|----------|
| Create Link Page | ✅ Complete | `/dashboard/links/new/page.tsx` |
| Collapsible Form Sections | ✅ Complete | Link Details, Sharing, Advanced |
| URL Input with Validation | ✅ Complete | Zod schema |
| Domain Selector | ✅ Complete | pingto.me + custom domains |
| Custom Slug Input | ✅ Complete | Optional field |
| Title Input | ✅ Complete | Optional |
| Tags Input (comma-separated) | ✅ Complete | With helper text |
| QR Code Toggle & Preview | ✅ Complete | Real-time preview |
| QR Color Presets (8 colors) | ✅ Complete | Visual picker |
| QR Logo Upload | ✅ Complete | With compression |
| Bio Page Integration | ✅ Complete | Toggle + selector |
| UTM Parameters | ✅ Complete | Source, Medium, Campaign |
| Expiration Date Picker | ✅ Complete | datetime-local |
| Password Input | ✅ Complete | Optional field |
| Redirect Type Selector | ✅ Complete | 301/302 dropdown |
| Deep Link Fallback | ✅ Complete | URL input |
| Success State | ✅ Complete | Copy, QR preview, actions |
| Links List Page | ✅ Complete | `/dashboard/links/page.tsx` |
| List/Table/Grid Views | ✅ Complete | View mode toggle |
| Search Input | ✅ Complete | Real-time search |
| Date Range Filter | ✅ Complete | Modal with calendar |
| Advanced Filters | ✅ Complete | Tags, type, QR code |
| Status Filter | ✅ Complete | Dropdown |
| Bulk Selection | ✅ Complete | Checkboxes |
| Edit Link Modal | ✅ Complete | All editable fields |
| Import Links Modal | ✅ Complete | CSV upload |
| Permission Gates | ✅ Complete | PermissionGate component |

#### Database Schema
| Model | Status | Purpose |
|-------|--------|---------|
| Link | ✅ Complete | Core link data |
| Tag | ✅ Complete | Organization-scoped tags |
| Campaign | ✅ Complete | Campaign grouping |
| Folder | ✅ Complete | User folder organization |
| Domain | ✅ Complete | Custom domains |
| BlockedDomain | ✅ Complete | Blocked/blacklisted URLs |

### 1.2 What's Missing or Incomplete ❌

#### Critical Security Issues
| Issue | Priority | Impact |
|-------|----------|--------|
| **Password NOT hashed** | 🔴 Critical | Stored as plain text (line 108) |
| **No DTO validation** | 🔴 Critical | TypeScript interfaces only, no class-validator |
| **Redirector ignores redirect type** | 🟡 High | Always uses 301, ignores link setting |

#### Missing Features
| Feature | Priority | Spec Reference |
|---------|----------|----------------|
| Slug format validation (regex) | 🟡 High | 3-50 chars, alphanumeric + hyphen/underscore |
| Slug length validation | 🟡 High | 3-50 characters |
| Slug availability check endpoint | 🟡 High | `POST /links/check-slug` |
| Slug conflict suggestions | 🟠 Medium | Suggest alternatives |
| Restore deleted link | 🟠 Medium | `POST /links/:id/restore` (soft delete) |
| UTM parameter storage | 🟠 Medium | Parse and store separately |
| Link safety/malware detection | 🟡 High | Google Safe Browsing, PhishTank |
| Open Graph metadata scraping | 🟠 Medium | Auto-fetch title/description/image |
| Import preview | 🟠 Medium | Preview before bulk import |
| Import progress tracking | 🟢 Low | Async job status endpoint |
| Bulk edit (status, expiry) | 🟠 Medium | `POST /links/bulk-edit` |
| JSON export | 🟢 Low | Alternative to CSV |
| Folder filter in list | 🟠 Medium | Currently missing |
| Date range filter | 🟠 Medium | startDate, endDate params |
| Duplicate URL detection | 🟠 Medium | Warn user if URL already shortened |
| Click-based expiration | 🟢 Low | Expire after N clicks |
| Smart redirects (geo/device) | 🟢 Future | Conditional routing |

---

## 2. Feature Breakdown & Priorities

### Priority 1: Critical Security Fixes (Must Fix Immediately)

#### P1-01: Password Hashing
**Description:** Hash link passwords before storage
**Effort:** 30 minutes
**Files to modify:**
- `apps/api/src/links/links.service.ts` (line 108)

**Current Code:**
```typescript
passwordHash: dto.password, // TODO: Hash this in US6
```

**Fix:**
```typescript
import * as bcrypt from 'bcrypt';

passwordHash: dto.password
  ? await bcrypt.hash(dto.password, 10)
  : null,
```

#### P1-02: Create Link DTOs with Validation
**Description:** Add class-validator decorators for proper validation
**Effort:** 2-3 hours
**Files to create:**
- `apps/api/src/links/dto/create-link.dto.ts`
- `apps/api/src/links/dto/update-link.dto.ts`
- `apps/api/src/links/dto/check-slug.dto.ts`

**Example DTO:**
```typescript
import { IsUrl, IsOptional, IsString, MinLength, MaxLength, Matches, IsEnum, IsDateString, IsArray } from 'class-validator';

export class CreateLinkDto {
  @IsUrl({}, { message: 'Please enter a valid URL' })
  @MaxLength(2048)
  originalUrl: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9-_]+$/, { message: 'Slug can only contain letters, numbers, hyphens, and underscores' })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsEnum(['301', '302'])
  redirectType?: '301' | '302';

  @IsOptional()
  @IsUrl()
  deepLinkFallback?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  domainId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}
```

#### P1-03: Fix Redirector Redirect Type
**Description:** Respect link's configured redirect type
**Effort:** 30 minutes
**Files to modify:**
- `apps/redirector/src/index.ts` (line 118)

**Current:**
```typescript
return Response.redirect(url, 301);
```

**Fix:**
```typescript
const redirectCode = parseInt(linkData.redirectType) || 301;
return Response.redirect(url, redirectCode);
```

### Priority 2: High Priority Features

#### P2-01: Slug Availability Check Endpoint
**Description:** Real-time slug availability checking
**Effort:** 2 hours
**New Endpoint:** `POST /links/check-slug`

**Implementation:**
```typescript
@Post('check-slug')
@Public() // Or require auth
async checkSlug(@Body() dto: CheckSlugDto): Promise<{ available: boolean; suggestions?: string[] }> {
  const { slug, domainId } = dto;

  // Check if reserved
  if (this.isReservedSlug(slug)) {
    return { available: false, suggestions: this.generateAlternatives(slug) };
  }

  // Check if taken
  const existing = await this.prisma.link.findFirst({
    where: { slug, domainId, status: { not: 'ARCHIVED' } }
  });

  if (existing) {
    return { available: false, suggestions: this.generateAlternatives(slug) };
  }

  return { available: true };
}

private generateAlternatives(slug: string): string[] {
  return [
    `${slug}-1`,
    `${slug}-${nanoid(4)}`,
    `my-${slug}`,
  ];
}
```

**Frontend Integration:**
```tsx
// In create-link form
const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

const checkSlugAvailability = useDebouncedCallback(async (slug: string) => {
  if (slug.length < 3) return;
  const result = await api.post('/links/check-slug', { slug, domainId });
  setSlugAvailable(result.available);
  if (!result.available) {
    setSuggestions(result.suggestions);
  }
}, 500);
```

#### P2-02: Link Safety Detection
**Description:** Check URLs against malware/phishing databases
**Effort:** 1 day
**New Service:** `SafetyCheckService`

**Implementation:**
```typescript
@Injectable()
export class SafetyCheckService {
  private readonly SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;

  async checkUrl(url: string): Promise<SafetyCheckResult> {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.SAFE_BROWSING_API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        })
      }
    );

    const data = await response.json();
    return {
      safe: !data.matches || data.matches.length === 0,
      threats: data.matches?.map(m => m.threatType) || []
    };
  }
}
```

**Schema Update:**
```prisma
model Link {
  // Existing fields...
  safetyStatus    String?   // 'safe' | 'unsafe' | 'pending' | 'unknown'
  safetyCheckDate DateTime?
  safetyThreats   String[]
}
```

#### P2-03: Soft Delete & Restore
**Description:** Implement soft delete with restore capability
**Effort:** 3-4 hours
**Files to modify:**
- `apps/api/src/links/links.service.ts`
- `apps/api/src/links/links.controller.ts`

**New Endpoint:** `POST /links/:id/restore`

**Implementation:**
```typescript
// Change delete to soft delete
async delete(id: string, userId: string) {
  await this.prisma.link.update({
    where: { id },
    data: {
      status: LinkStatus.ARCHIVED,
      deletedAt: new Date()
    }
  });
}

// Add restore endpoint
@Post(':id/restore')
@Permission({ action: 'update', resource: 'link' })
async restore(@Param('id') id: string, @Req() req: RequestWithUser) {
  const link = await this.prisma.link.findUnique({ where: { id } });

  if (link.status !== LinkStatus.ARCHIVED) {
    throw new BadRequestException('Link is not archived');
  }

  return this.prisma.link.update({
    where: { id },
    data: {
      status: LinkStatus.ACTIVE,
      deletedAt: null
    }
  });
}
```

### Priority 3: Medium Priority Enhancements

#### P3-01: UTM Parameter Parsing & Storage
**Description:** Extract and store UTM parameters separately
**Effort:** 3-4 hours

**Schema Update:**
```prisma
model Link {
  // Existing fields...
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  utmContent  String?
  utmTerm     String?
}
```

**Service Update:**
```typescript
private parseUtmParams(url: string): UtmParams {
  const urlObj = new URL(url);
  return {
    utmSource: urlObj.searchParams.get('utm_source'),
    utmMedium: urlObj.searchParams.get('utm_medium'),
    utmCampaign: urlObj.searchParams.get('utm_campaign'),
    utmContent: urlObj.searchParams.get('utm_content'),
    utmTerm: urlObj.searchParams.get('utm_term'),
  };
}

async create(dto: CreateLinkDto, userId: string) {
  const utmParams = this.parseUtmParams(dto.originalUrl);

  return this.prisma.link.create({
    data: {
      ...linkData,
      ...utmParams,
    }
  });
}
```

#### P3-02: Duplicate URL Detection
**Description:** Warn when shortening an already-shortened URL
**Effort:** 2 hours

**Implementation:**
```typescript
async checkDuplicate(originalUrl: string, organizationId: string): Promise<Link | null> {
  return this.prisma.link.findFirst({
    where: {
      originalUrl,
      organizationId,
      status: { in: [LinkStatus.ACTIVE, LinkStatus.DISABLED] }
    }
  });
}

async create(dto: CreateLinkDto, userId: string) {
  // Check for duplicate
  if (!dto.allowDuplicate) {
    const existing = await this.checkDuplicate(dto.originalUrl, dto.organizationId);
    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_URL',
        message: 'This URL already has a short link',
        existingLink: {
          id: existing.id,
          slug: existing.slug,
          shortUrl: this.buildShortUrl(existing)
        }
      });
    }
  }

  // Continue with creation...
}
```

**Frontend:**
- Show modal: "This URL already has a short link. Use existing or create new?"

#### P3-03: Open Graph Metadata Scraping
**Description:** Auto-fetch metadata from destination URL
**Effort:** 4-6 hours
**Dependencies:** `open-graph-scraper` npm package

**Implementation:**
```typescript
import ogs from 'open-graph-scraper';

@Injectable()
export class MetadataService {
  async scrape(url: string): Promise<LinkMetadata> {
    try {
      const { result } = await ogs({ url, timeout: 5000 });
      return {
        title: result.ogTitle || result.twitterTitle || result.dcTitle,
        description: result.ogDescription || result.twitterDescription,
        image: result.ogImage?.[0]?.url,
        siteName: result.ogSiteName,
        favicon: result.favicon,
      };
    } catch {
      return {};
    }
  }
}
```

**Schema Update:**
```prisma
model Link {
  // Existing fields...
  thumbnailUrl  String?
  ogTitle       String?
  ogDescription String?
  ogImage       String?
  siteName      String?
  autoFetchMeta Boolean @default(true)
}
```

#### P3-04: Bulk Edit Endpoint
**Description:** Batch update links (status, expiry, tags)
**Effort:** 3-4 hours
**New Endpoint:** `POST /links/bulk-edit`

**Implementation:**
```typescript
@Post('bulk-edit')
@Permission({ action: 'bulk', resource: 'link' })
async bulkEdit(@Body() dto: BulkEditDto) {
  const { ids, changes } = dto;

  const result = await this.prisma.link.updateMany({
    where: { id: { in: ids } },
    data: {
      ...(changes.status && { status: changes.status }),
      ...(changes.expirationDate && { expirationDate: new Date(changes.expirationDate) }),
      ...(changes.campaignId !== undefined && { campaignId: changes.campaignId }),
    }
  });

  return { updated: result.count };
}
```

#### P3-05: Date Range Filter
**Description:** Filter links by creation date range
**Effort:** 1-2 hours

**Update list endpoint:**
```typescript
@Get()
async findAll(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  // ... other params
) {
  const where = {
    // ... existing filters
    ...(startDate && {
      createdAt: {
        gte: new Date(startDate),
        ...(endDate && { lte: new Date(endDate) })
      }
    })
  };
}
```

### Priority 4: Future Enhancements

#### P4-01: Smart Redirects (Geo/Device Targeting)
**Description:** Conditional redirects based on user context
**Effort:** 1 week

**Schema:**
```prisma
model RedirectRule {
  id         String @id @default(uuid())
  linkId     String @db.Uuid
  priority   Int    @default(0)
  conditions Json   // { device: 'mobile', country: 'US' }
  targetUrl  String
  createdAt  DateTime @default(now())

  link Link @relation(fields: [linkId], references: [id])
  @@index([linkId, priority])
}
```

#### P4-02: Click-Based Expiration
**Description:** Expire links after N clicks
**Effort:** 3-4 hours

**Schema Update:**
```prisma
model Link {
  maxClicks        Int?
  currentClicks    Int @default(0)
  expirationAction String @default("disable") // 'disable' | 'redirect'
  expirationUrl    String?
}
```

#### P4-03: A/B Testing / Link Rotation
**Description:** Split traffic between multiple destinations
**Effort:** 1 week

**Schema:**
```prisma
model LinkVariant {
  id        String @id @default(uuid())
  linkId    String @db.Uuid
  targetUrl String
  weight    Int    @default(50) // Percentage
  clicks    Int    @default(0)

  link Link @relation(fields: [linkId], references: [id])
}
```

---

## 3. Database Schema Updates

### 3.1 Immediate Updates (P1-P2)

```prisma
model Link {
  // Existing fields...

  // Safety (P2-02)
  safetyStatus    String?   // 'safe' | 'unsafe' | 'pending' | 'unknown'
  safetyCheckDate DateTime?
  safetyThreats   String[]

  // Soft delete (P2-03)
  deletedAt       DateTime?
}
```

### 3.2 Medium-Term Updates (P3)

```prisma
model Link {
  // UTM Parameters (P3-01)
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmContent    String?
  utmTerm       String?

  // Metadata (P3-03)
  thumbnailUrl  String?
  ogTitle       String?
  ogDescription String?
  ogImage       String?
  siteName      String?
  autoFetchMeta Boolean @default(true)
}
```

### 3.3 Future Updates (P4)

```prisma
model Link {
  // Click-based expiration
  maxClicks        Int?
  expirationAction String @default("disable")
  expirationUrl    String?

  // Relations
  redirectRules RedirectRule[]
  variants      LinkVariant[]
}

model RedirectRule {
  id         String   @id @default(uuid())
  linkId     String   @db.Uuid
  priority   Int      @default(0)
  conditions Json
  targetUrl  String
  createdAt  DateTime @default(now())
  link       Link     @relation(fields: [linkId], references: [id])
  @@index([linkId, priority])
}

model LinkVariant {
  id        String @id @default(uuid())
  linkId    String @db.Uuid
  targetUrl String
  weight    Int    @default(50)
  clicks    Int    @default(0)
  link      Link   @relation(fields: [linkId], references: [id])
}
```

---

## 4. API Endpoint Specifications

### 4.1 Existing Endpoints (Working)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/links` | Create new link | JWT |
| GET | `/links` | List links with filters | JWT |
| GET | `/links/:id` | Get link details | JWT |
| POST | `/links/:id` | Update link | JWT |
| DELETE | `/links/:id` | Delete link | JWT |
| GET | `/links/:slug/lookup` | Lookup by slug (redirector) | API Key |
| POST | `/links/import` | Bulk import CSV | JWT |
| GET | `/links/export` | Export to CSV | JWT |
| POST | `/links/bulk-delete` | Delete multiple | JWT |
| POST | `/links/bulk-tag` | Add tag to multiple | JWT |

### 4.2 New Endpoints Required

#### Priority 2: High
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/links/check-slug` | Check slug availability | JWT |
| POST | `/links/:id/restore` | Restore archived link | JWT |
| POST | `/links/:id/safety-check` | Trigger safety check | JWT |

#### Priority 3: Medium
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/links/bulk-edit` | Batch update links | JWT |
| GET | `/links/export/json` | Export as JSON | JWT |
| GET | `/links/:id/metadata` | Get scraped OG metadata | JWT |
| POST | `/links/:id/scrape-metadata` | Trigger metadata scrape | JWT |

### 4.3 Endpoint Request/Response Specifications

#### POST `/links/check-slug`
**Request:**
```json
{
  "slug": "my-custom-slug",
  "domainId": "uuid-of-domain"
}
```

**Response (available):**
```json
{
  "available": true
}
```

**Response (taken):**
```json
{
  "available": false,
  "suggestions": ["my-custom-slug-1", "my-custom-slug-a7b3", "my-my-custom-slug"]
}
```

#### POST `/links/:id/restore`
**Response:**
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "restoredAt": "2025-12-08T10:00:00Z"
}
```

#### POST `/links/bulk-edit`
**Request:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"],
  "changes": {
    "status": "DISABLED",
    "expirationDate": "2025-12-31T23:59:59Z",
    "campaignId": "campaign-uuid"
  }
}
```

**Response:**
```json
{
  "updated": 3,
  "failed": 0
}
```

---

## 5. Test Cases

### 5.1 Unit Tests (Jest)

#### Link Service Tests

```typescript
// apps/api/src/links/__tests__/links.service.spec.ts

describe('LinksService', () => {
  // Slug Generation Tests
  describe('generateSlug', () => {
    it('should generate 8-character alphanumeric slug');
    it('should retry on collision up to 5 times');
    it('should throw after 5 collision retries');
    it('should reject reserved slugs (api, admin, dashboard)');
    it('should be case-insensitive for reserved words');
  });

  // Slug Validation Tests
  describe('validateSlug', () => {
    it('should accept alphanumeric slugs');
    it('should accept hyphens and underscores');
    it('should reject special characters');
    it('should reject slugs shorter than 3 chars');
    it('should reject slugs longer than 50 chars');
    it('should reject reserved slugs');
  });

  // URL Validation Tests
  describe('validateUrl', () => {
    it('should accept valid HTTP URLs');
    it('should accept valid HTTPS URLs');
    it('should reject invalid URL format');
    it('should reject URLs longer than 2048 chars');
    it('should reject blocked domains');
    it('should reject URLs without protocol');
  });

  // Link Creation Tests
  describe('create', () => {
    it('should create link with auto-generated slug');
    it('should create link with custom slug');
    it('should hash password before storing');
    it('should select default domain if not specified');
    it('should sync to Cloudflare KV');
    it('should log audit event');
    it('should check and enforce quota');
    it('should throw on quota exceeded');
    it('should parse and store UTM parameters');
    it('should trigger safety check asynchronously');
  });

  // Duplicate Detection Tests
  describe('checkDuplicate', () => {
    it('should find existing link for same URL');
    it('should scope to organization');
    it('should ignore archived links');
    it('should return null if no duplicate');
  });

  // Password Tests
  describe('password handling', () => {
    it('should hash password with bcrypt');
    it('should store hashed password in KV');
    it('should verify password correctly');
    it('should reject incorrect password');
  });

  // Soft Delete Tests
  describe('delete', () => {
    it('should set status to ARCHIVED');
    it('should set deletedAt timestamp');
    it('should remove from Cloudflare KV');
    it('should decrement quota usage');
  });

  // Restore Tests
  describe('restore', () => {
    it('should set status to ACTIVE');
    it('should clear deletedAt');
    it('should re-sync to Cloudflare KV');
    it('should throw if link not archived');
    it('should check quota before restore');
  });

  // Bulk Operations Tests
  describe('bulkEdit', () => {
    it('should update multiple links');
    it('should only update specified fields');
    it('should log audit event for each link');
    it('should return update count');
    it('should respect ownership permissions');
  });

  // Search & Filter Tests
  describe('findAll', () => {
    it('should filter by tag');
    it('should filter by campaign');
    it('should filter by folder');
    it('should filter by status');
    it('should filter by date range');
    it('should search by title');
    it('should search by slug');
    it('should search by originalUrl');
    it('should paginate results');
    it('should sort by createdAt desc');
  });
});
```

#### Safety Check Service Tests

```typescript
// apps/api/src/links/__tests__/safety-check.service.spec.ts

describe('SafetyCheckService', () => {
  describe('checkUrl', () => {
    it('should return safe for legitimate URLs');
    it('should detect malware URLs');
    it('should detect phishing URLs');
    it('should detect unwanted software URLs');
    it('should handle API timeout gracefully');
    it('should cache results');
  });

  describe('updateLinkSafety', () => {
    it('should update link safety status');
    it('should store threat types');
    it('should update check timestamp');
  });
});
```

#### Metadata Service Tests

```typescript
// apps/api/src/links/__tests__/metadata.service.spec.ts

describe('MetadataService', () => {
  describe('scrape', () => {
    it('should extract Open Graph title');
    it('should extract Open Graph description');
    it('should extract Open Graph image');
    it('should fallback to Twitter Card data');
    it('should extract favicon');
    it('should handle timeout gracefully');
    it('should return empty object on error');
  });
});
```

### 5.2 E2E Tests (Playwright)

```typescript
// apps/web/e2e/create-link-extended.spec.ts

test.describe('Short Link Creation - Extended', () => {

  // ===== SLUG VALIDATION TESTS =====

  test.describe('Slug Validation', () => {
    test('LINK-101: Should show slug availability indicator', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'my-custom-slug');

      // Wait for debounced check
      await page.waitForTimeout(600);

      await expect(page.locator('[data-testid="slug-available"]')).toBeVisible();
    });

    test('LINK-102: Should show taken message for unavailable slug', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'existing-slug');

      await page.waitForTimeout(600);

      await expect(page.locator('[data-testid="slug-taken"]')).toBeVisible();
      await expect(page.locator('[data-testid="slug-suggestions"]')).toBeVisible();
    });

    test('LINK-103: Should reject reserved slugs', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'admin');

      await page.waitForTimeout(600);

      await expect(page.locator('[data-testid="slug-reserved"]')).toContainText('reserved');
    });

    test('LINK-104: Should reject invalid characters', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'my slug!');

      await expect(page.locator('[data-testid="slug-error"]')).toContainText('letters, numbers');
    });

    test('LINK-105: Should reject slug shorter than 3 chars', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'ab');

      await expect(page.locator('[data-testid="slug-error"]')).toContainText('at least 3');
    });

    test('LINK-106: Should use suggested slug', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="slug-input"]', 'existing-slug');
      await page.waitForTimeout(600);

      await page.click('[data-testid="use-suggestion-0"]');

      await expect(page.locator('[data-testid="slug-input"]')).toHaveValue('existing-slug-1');
    });
  });

  // ===== URL VALIDATION TESTS =====

  test.describe('URL Validation', () => {
    test('LINK-110: Should reject blocked domains', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://blocked-domain.com/page');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('blocked');
    });

    test('LINK-111: Should show safety warning for suspicious URLs', async ({ page }) => {
      // Mock API to return unsafe status
      await page.route('**/links', async (route) => {
        await route.fulfill({
          status: 201,
          json: {
            id: 'uuid',
            slug: 'test',
            safetyStatus: 'unsafe',
            safetyThreats: ['phishing']
          }
        });
      });

      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://suspicious-site.com');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="safety-warning"]')).toBeVisible();
    });
  });

  // ===== DUPLICATE DETECTION TESTS =====

  test.describe('Duplicate Detection', () => {
    test('LINK-120: Should warn about duplicate URL', async ({ page }) => {
      await page.route('**/links', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 409,
            json: {
              code: 'DUPLICATE_URL',
              message: 'This URL already has a short link',
              existingLink: {
                id: 'existing-uuid',
                slug: 'existing-slug',
                shortUrl: 'https://pingto.me/existing-slug'
              }
            }
          });
        }
      });

      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://already-shortened.com');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="duplicate-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="existing-link"]')).toContainText('existing-slug');
    });

    test('LINK-121: Should allow using existing link', async ({ page }) => {
      // After duplicate modal appears
      await page.click('[data-testid="use-existing-button"]');

      await expect(page).toHaveURL(/\/dashboard\/links$/);
    });

    test('LINK-122: Should allow creating new link despite duplicate', async ({ page }) => {
      // After duplicate modal appears
      await page.click('[data-testid="create-new-button"]');

      // Should resubmit with allowDuplicate: true
      await expect(page.locator('[data-testid="success-state"]')).toBeVisible();
    });
  });

  // ===== PASSWORD PROTECTION TESTS =====

  test.describe('Password Protection', () => {
    test('LINK-130: Should create password-protected link', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://example.com');

      // Expand advanced settings
      await page.click('[data-testid="advanced-settings-toggle"]');
      await page.fill('[data-testid="password-input"]', 'SecurePass123');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-protected-badge"]')).toBeVisible();
    });

    test('LINK-131: Should show password strength indicator', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.click('[data-testid="advanced-settings-toggle"]');

      await page.fill('[data-testid="password-input"]', '123');
      await expect(page.locator('[data-testid="password-weak"]')).toBeVisible();

      await page.fill('[data-testid="password-input"]', 'Password123');
      await expect(page.locator('[data-testid="password-medium"]')).toBeVisible();

      await page.fill('[data-testid="password-input"]', 'SecurePass123!@#');
      await expect(page.locator('[data-testid="password-strong"]')).toBeVisible();
    });
  });

  // ===== RESTORE LINK TESTS =====

  test.describe('Restore Archived Links', () => {
    test('LINK-140: Should show restore option for archived links', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/links');

      // Filter to archived
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-archived"]');

      await page.click('[data-testid="link-actions-dropdown"]');

      await expect(page.locator('[data-testid="restore-link-button"]')).toBeVisible();
    });

    test('LINK-141: Should restore archived link', async ({ page }) => {
      await page.click('[data-testid="restore-link-button"]');

      await expect(page.locator('[data-testid="success-toast"]')).toContainText('restored');
    });
  });

  // ===== BULK OPERATIONS TESTS =====

  test.describe('Bulk Edit', () => {
    test('LINK-150: Should bulk update status', async ({ page }) => {
      await loginAsUser(page, 'owner');
      await page.goto('/dashboard/links');

      // Select multiple links
      await page.click('[data-testid="link-checkbox-0"]');
      await page.click('[data-testid="link-checkbox-1"]');
      await page.click('[data-testid="link-checkbox-2"]');

      await page.click('[data-testid="bulk-actions-button"]');
      await page.click('[data-testid="bulk-edit-status"]');
      await page.click('[data-testid="status-disabled"]');
      await page.click('[data-testid="confirm-bulk-edit"]');

      await expect(page.locator('[data-testid="success-toast"]')).toContainText('3 links updated');
    });

    test('LINK-151: Should bulk set expiration', async ({ page }) => {
      // Select links
      await page.click('[data-testid="select-all-checkbox"]');

      await page.click('[data-testid="bulk-actions-button"]');
      await page.click('[data-testid="bulk-set-expiration"]');
      await page.fill('[data-testid="expiration-date-input"]', '2025-12-31');
      await page.click('[data-testid="confirm-bulk-edit"]');

      await expect(page.locator('[data-testid="success-toast"]')).toContainText('updated');
    });
  });

  // ===== METADATA SCRAPING TESTS =====

  test.describe('Metadata Scraping', () => {
    test('LINK-160: Should auto-fill title from URL', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://example.com/article');

      // Wait for metadata fetch
      await page.waitForTimeout(1000);

      await expect(page.locator('[data-testid="title-input"]')).toHaveValue(/Example/);
    });

    test('LINK-161: Should show URL preview card', async ({ page }) => {
      await page.goto('/dashboard/links/new');
      await page.fill('[data-testid="url-input"]', 'https://example.com');

      await page.waitForTimeout(1000);

      await expect(page.locator('[data-testid="url-preview-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-image"]')).toBeVisible();
    });
  });
});
```

### 5.3 Test Data Requirements

```typescript
// apps/web/e2e/fixtures/test-data.ts - Links section

export const LINK_TEST_DATA = {
  // Valid URLs for creation
  validUrls: [
    'https://example.com',
    'https://example.com/page?param=value',
    'https://example.com/path/to/page',
  ],

  // Invalid URLs
  invalidUrls: [
    'not-a-url',
    'ftp://example.com',
    'javascript:alert(1)',
  ],

  // Blocked domains (must match seed data)
  blockedDomains: [
    'malware-site.com',
    'phishing-example.com',
  ],

  // Reserved slugs
  reservedSlugs: ['api', 'admin', 'dashboard', 'auth', 'login', 'register'],

  // Existing slugs (must match seed data)
  existingSlugs: ['test-link', 'demo-link', 'existing-slug'],

  // Test passwords
  passwords: {
    weak: '123',
    medium: 'Password123',
    strong: 'SecurePass123!@#',
  },

  // UTM parameters
  utmParams: {
    source: 'twitter',
    medium: 'social',
    campaign: 'summer-2025',
  },
};

export const LINK_TEST_IDS = {
  existingLink: 'e2e-existing-link-id',
  archivedLink: 'e2e-archived-link-id',
  expiredLink: 'e2e-expired-link-id',
  passwordProtectedLink: 'e2e-password-link-id',
};
```

---

## 6. Implementation Roadmap

### Phase 1: Critical Security Fixes (Day 1)
1. ✅ Hash passwords with bcrypt
2. ✅ Create DTOs with class-validator
3. ✅ Fix redirector to respect redirect type
4. ✅ Write unit tests for fixes

### Phase 2: High Priority Features (Day 2-3)
1. ✅ Slug availability check endpoint
2. ✅ Frontend slug checker integration
3. ✅ Soft delete implementation
4. ✅ Restore endpoint
5. ✅ Link safety check integration
6. ✅ E2E tests for new features

### Phase 3: Medium Priority (Day 4-6)
1. ✅ UTM parameter parsing & storage
2. ✅ Duplicate URL detection
3. ✅ Open Graph metadata scraping
4. ✅ Bulk edit endpoint
5. ✅ Date range filter
6. ✅ Folder filter
7. ✅ Updated E2E tests

### Phase 4: Polish & Documentation (Day 7)
1. ✅ Swagger documentation
2. ✅ Error message improvements
3. ✅ Performance optimization
4. ✅ Full test suite verification

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Links Module Test Coverage | > 85% | Jest coverage report |
| E2E Link Creation Tests | 100% pass | Playwright results |
| Link Creation Latency | < 500ms | API metrics |
| Password Security | 0 plain text | Security audit |
| Slug Collision Rate | < 0.01% | Monitoring |
| Safety Check Coverage | 100% new links | Monitoring |
| Duplicate Detection Rate | Track | Analytics |

---

## 8. Dependencies & Risks

### Dependencies
- Google Safe Browsing API key (environment variable)
- `open-graph-scraper` npm package for metadata
- `bcrypt` (already available in project)

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Password stored in plain text | 🔴 Critical | Immediate fix with bcrypt |
| Safety API rate limits | Medium | Cache results, async checking |
| Metadata scraping failures | Low | Graceful fallback, optional feature |
| Slug collision at scale | Medium | Increase slug length, retry mechanism |
| Redirector type ignored | High | Update Cloudflare Worker immediately |

---

## 9. Competitor Feature Comparison

| Feature | Bitly | Rebrandly | PingTO.Me Current | PingTO.Me Planned |
|---------|-------|-----------|-------------------|-------------------|
| Custom Slug | ✅ | ✅ | ✅ | ✅ |
| Slug Validation | ✅ | ✅ | ⚠️ Partial | ✅ Full |
| Slug Suggestions | ✅ | ✅ | ❌ | ✅ |
| Password Protection | ✅ | ✅ | ⚠️ No hash | ✅ Hashed |
| Link Safety | ✅ | ✅ | ❌ | ✅ |
| UTM Builder | ✅ | ✅ | ⚠️ Frontend only | ✅ Full |
| Duplicate Detection | ❌ | ❌ | ❌ | ✅ |
| OG Metadata | ✅ | ✅ | ❌ | ✅ |
| Smart Redirects | ✅ Paid | ✅ Paid | ❌ | 🟡 Future |
| Click Expiration | ❌ | ❌ | ❌ | 🟡 Future |
| A/B Testing | ❌ | ❌ | ❌ | 🟡 Future |

---

## 10. References

- [Google Safe Browsing API](https://developers.google.com/safe-browsing)
- [Open Graph Protocol](https://ogp.me/)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Bitly API Documentation](https://dev.bitly.com/)
- [Rebrandly API Documentation](https://developers.rebrandly.com/)

---

*Document Version: 1.0*
*Last Updated: 2025-12-08*
*Author: AI System Analyst*
