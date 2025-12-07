# Module 1.6: Link Organization (Tags, Folders, Campaigns) - Development Plan

## Executive Summary

**Module**: 1.6 Link Organization
**Status**: ~55-60% Complete
**Priority**: High
**Complexity**: Medium

Link Organization provides three primary mechanisms for organizing links: Tags (organization-scoped), Folders (user-scoped), and Campaigns (organization-scoped). While basic CRUD operations are implemented, key features like nested folders, campaign analytics, tag usage statistics, and proper RBAC integration are missing.

---

## Current Implementation Status

### Tags Module (~70% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Create Tag | Implemented | tags.controller.ts:27-38 |
| List Tags | Implemented | tags.controller.ts:40-50 |
| Update Tag | Implemented | tags.controller.ts:52-62 |
| Delete Tag | Implemented | tags.controller.ts:64-69 |
| Tag Color | Implemented | Schema supports color |
| Organization Scoped | Implemented | tags belong to org |
| Audit Logging | Implemented | All CRUD operations |
| Tag Usage Stats | NOT IMPLEMENTED | - |
| Tag Merge | NOT IMPLEMENTED | - |
| Tag Rename Cascade | NOT IMPLEMENTED | - |
| Validation DTOs | NOT IMPLEMENTED | - |

**Key Issue**: Tag rename doesn't update the `tags[]` array on Link records, causing orphaned tag names.

### Folders Module (~50% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Create Folder | Implemented | folders.controller.ts |
| List Folders | Implemented | folders.controller.ts |
| Update Folder | Implemented | folders.controller.ts |
| Delete Folder | Implemented | folders.controller.ts |
| Folder Color | Implemented | Schema supports color |
| Link Count | Implemented | Uses _count.links |
| Add/Remove Link | Implemented | folders.service.ts |
| User Scoped | Implemented | folders belong to user |
| Nested Folders | NOT IMPLEMENTED | No parentId |
| Organization Scoped | NOT IMPLEMENTED | Missing orgId |
| RBAC Integration | NOT IMPLEMENTED | No PermissionGuard |
| Audit Logging | NOT IMPLEMENTED | - |
| Folder Archive | NOT IMPLEMENTED | - |

**Key Issue**: Folders are user-scoped, not organization-scoped, breaking team collaboration patterns.

### Campaigns Module (~60% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Create Campaign | Implemented | campaigns.controller.ts:27-47 |
| List Campaigns | Implemented | campaigns.controller.ts:49-60 |
| Update Campaign | Implemented | campaigns.controller.ts:62-70 |
| Delete Campaign | Implemented | campaigns.controller.ts:72-76 |
| Organization Scoped | Implemented | campaigns belong to org |
| Link Count | Implemented | Uses _count.links |
| Audit Logging | Implemented | All CRUD operations |
| RBAC Permissions | Implemented | Permission decorators |
| Get Single Campaign | NOT IMPLEMENTED | No GET /:id |
| Campaign Analytics | NOT IMPLEMENTED | - |
| UTM Management | NOT IMPLEMENTED | - |
| Start/End Dates | NOT IMPLEMENTED | - |
| Campaign Goals | NOT IMPLEMENTED | - |

### Frontend UI Status

| Feature | Status | Location |
|---------|--------|----------|
| Tags Manager | Implemented | TagsManager.tsx |
| Tag Filtering | Implemented | FiltersModal.tsx |
| Tag Inline Add | Implemented | LinksTable.tsx |
| Folders Page | Implemented | /dashboard/folders |
| Folder Colors | Implemented | 10 preset colors |
| Campaigns Manager | Basic | CampaignsManager.tsx |
| Campaign Assignment | Implemented | EditLinkModal.tsx |
| Campaign Filtering | NOT IMPLEMENTED | - |
| Tags Settings Page | NOT IMPLEMENTED | - |
| Campaigns Page | NOT IMPLEMENTED | - |
| Drag-and-Drop | NOT IMPLEMENTED | - |
| Nested Folder Tree | NOT IMPLEMENTED | - |

### E2E Test Coverage

| Area | Tests | Coverage |
|------|-------|----------|
| Tag CRUD | 5+ tests | Good |
| Tag Filtering | 5+ tests | Good |
| Bulk Tagging | 1 test | Basic |
| Campaign CRUD | 1 test | Limited |
| Campaign Assignment | 3 tests | Good |
| Filter Modal | 10+ tests | Excellent |
| Folder Tests | 0 tests | Missing |

---

## Gap Analysis

### Critical Gaps

1. **Folder Organization Scope**
   - Currently user-scoped, should be organization-scoped
   - Breaks team collaboration (users can't share folders)
   - Inconsistent with Tags/Campaigns pattern

2. **Folder RBAC Missing**
   - No PermissionGuard on folder endpoints
   - No "folder" resource in permission matrix
   - Security concern: any authenticated user can access any folder

3. **Tag Rename Cascade**
   - Updating tag name doesn't update Link.tags[] arrays
   - Creates orphaned tag references
   - Data integrity issue

4. **Campaign Analytics**
   - No aggregated stats for campaign performance
   - Can't measure campaign effectiveness
   - Missing: total clicks, CTR, top links

### Important Gaps

5. **Nested Folder Hierarchy**
   - Spec requires: "Hierarchical folder structure (optional nesting)"
   - No parentId in Folder model
   - Flat structure only

6. **UTM Parameter Management**
   - No UTM fields in Link/Campaign models
   - Zero UTM-related code in codebase
   - Spec mentions UTM tracking

7. **Campaign Dates**
   - No start/end date fields
   - Can't schedule campaigns
   - Can't auto-archive expired campaigns

8. **Tag Usage Statistics**
   - No endpoint to count links per tag
   - Can't identify unused tags
   - No usage-based sorting

---

## Database Schema Updates

### Required Changes

```prisma
// Update Folder model for organization scope and nesting
model Folder {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  color          String?
  description    String?  // NEW
  userId         String   @db.Uuid
  organizationId String?  @db.Uuid  // NEW: Optional org scope
  parentId       String?  @db.Uuid  // NEW: For nesting
  isArchived     Boolean  @default(false)  // NEW
  archivedAt     DateTime?  // NEW
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization? @relation(fields: [organizationId], references: [id])
  parent         Folder?      @relation("FolderHierarchy", fields: [parentId], references: [id])
  children       Folder[]     @relation("FolderHierarchy")
  links          Link[]

  @@unique([userId, name, parentId])  // Updated: unique within parent
  @@unique([organizationId, name, parentId])  // NEW: unique within org parent
  @@index([parentId])
}

// Update Campaign model for dates and goals
model Campaign {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  description    String?
  organizationId String   @db.Uuid
  status         CampaignStatus @default(ACTIVE)  // NEW
  startDate      DateTime?  // NEW
  endDate        DateTime?  // NEW
  goalType       String?    // NEW: 'clicks', 'conversions'
  goalTarget     Int?       // NEW
  utmSource      String?    // NEW
  utmMedium      String?    // NEW
  utmCampaign    String?    // NEW
  utmTerm        String?    // NEW
  utmContent     String?    // NEW
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  links          Link[]
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

// Add Tag usage tracking (optional denormalized field)
model Tag {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String
  color          String?
  description    String?  // NEW
  organizationId String   @db.Uuid
  usageCount     Int      @default(0)  // NEW: Cached count
  lastUsedAt     DateTime?  // NEW
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, name])
}
```

---

## Feature Breakdown by Priority

### Priority 0 (Critical) - Must Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ORG-001 | Folder RBAC Integration | Add PermissionGuard, Permission decorators | - | Unit + E2E |
| ORG-002 | Folder Organization Scope | Add organizationId, update queries | Update folder APIs | E2E |
| ORG-003 | Tag Rename Cascade | Update all Link.tags[] on rename | - | Unit |
| ORG-004 | Validation DTOs | Create DTOs for Tags, Folders, Campaigns | - | Unit |
| ORG-005 | Folder Audit Logging | Add audit events | - | Unit |

### Priority 1 (High) - Important

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ORG-006 | Tag Usage Statistics | GET /tags/statistics | Show usage counts | E2E |
| ORG-007 | Campaign Analytics | GET /campaigns/:id/analytics | Analytics view | E2E |
| ORG-008 | Nested Folders | Add parentId, tree queries | Folder tree UI | E2E |
| ORG-009 | Campaign Dates | Add start/end dates | Date pickers | E2E |
| ORG-010 | Tag Merge | POST /tags/:id/merge | Merge UI | Unit + E2E |

### Priority 2 (Medium) - Nice to Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ORG-011 | UTM Management | Add UTM fields to Campaign | UTM builder UI | E2E |
| ORG-012 | Campaign Goals | Add goal fields | Goal setting UI | E2E |
| ORG-013 | Folder Archive | Add archive/restore | Archive button | E2E |
| ORG-014 | Tag Search | GET /tags?search= | Search input | Unit |
| ORG-015 | Campaign Status | Add status enum | Status badges | E2E |

### Priority 3 (Low) - Future Enhancement

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ORG-016 | Drag-and-Drop | - | DnD library integration | E2E |
| ORG-017 | Campaign Templates | Template CRUD | Template selector | E2E |
| ORG-018 | Folder Sharing | Share endpoints | Share dialog | E2E |
| ORG-019 | Tag Descriptions | Add description field | Tooltip/modal | Unit |
| ORG-020 | Campaign Reports | Export reports | Report builder | E2E |

---

## API Endpoint Specifications

### Tags Module - New/Updated Endpoints

#### GET /tags/statistics
```typescript
@Get('statistics')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'tag', action: 'read' })
async getStatistics(@Query('orgId') orgId: string) {
  return this.tagsService.getStatistics(orgId);
}

// Response
interface TagStatistics {
  tags: Array<{
    id: string;
    name: string;
    color: string;
    linkCount: number;
    lastUsedAt: Date | null;
    createdAt: Date;
  }>;
  totalTags: number;
  totalUsage: number;  // Sum of all linkCounts
  unusedTags: number;  // Tags with linkCount = 0
}
```

#### POST /tags/:id/merge
```typescript
@Post(':id/merge')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'tag', action: 'delete' })
async merge(
  @Param('id') sourceId: string,
  @Body() dto: MergeTagDto,
  @Request() req,
) {
  return this.tagsService.merge(req.user.id, sourceId, dto.targetTagId);
}

class MergeTagDto {
  @IsUUID()
  targetTagId: string;
}
```

#### GET /tags/autocomplete
```typescript
@Get('autocomplete')
@UseGuards(JwtAuthGuard)
async autocomplete(
  @Query('q') query: string,
  @Query('orgId') orgId: string,
  @Query('limit') limit: number = 10,
) {
  return this.tagsService.autocomplete(orgId, query, limit);
}
```

### Folders Module - New/Updated Endpoints

#### Updated GET /folders (with nesting support)
```typescript
@Get()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'folder', action: 'read' })
async findAll(
  @Request() req,
  @Query('orgId') orgId?: string,
  @Query('parentId') parentId?: string,
  @Query('includeArchived') includeArchived?: boolean,
) {
  return this.foldersService.findAll({
    userId: req.user.id,
    organizationId: orgId,
    parentId: parentId || null,
    includeArchived: includeArchived || false,
  });
}

// Response includes children for tree rendering
interface FolderWithChildren {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  _count: { links: number };
  children?: FolderWithChildren[];
}
```

#### POST /folders/:id/archive
```typescript
@Post(':id/archive')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'folder', action: 'update' })
async archive(@Param('id') id: string, @Request() req) {
  return this.foldersService.archive(req.user.id, id);
}
```

#### POST /folders/:id/restore
```typescript
@Post(':id/restore')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'folder', action: 'update' })
async restore(@Param('id') id: string, @Request() req) {
  return this.foldersService.restore(req.user.id, id);
}
```

#### POST /folders/:id/move
```typescript
@Post(':id/move')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'folder', action: 'update' })
async move(
  @Param('id') id: string,
  @Body() dto: MoveFolderDto,
  @Request() req,
) {
  return this.foldersService.move(req.user.id, id, dto.newParentId);
}

class MoveFolderDto {
  @IsOptional()
  @IsUUID()
  newParentId?: string | null;  // null = root level
}
```

### Campaigns Module - New/Updated Endpoints

#### GET /campaigns/:id
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'campaign', action: 'read' })
async findOne(@Param('id') id: string, @Request() req) {
  return this.campaignsService.findOne(id);
}
```

#### GET /campaigns/:id/analytics
```typescript
@Get(':id/analytics')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'campaign', action: 'read' })
async getAnalytics(
  @Param('id') id: string,
  @Query() filters: AnalyticsFiltersDto,
) {
  return this.campaignsService.getAnalytics(id, filters);
}

// Response
interface CampaignAnalytics {
  campaignId: string;
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  clicksByDate: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ linkId: string; slug: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: Array<{ device: string; clicks: number }>;
  goalProgress?: {
    target: number;
    current: number;
    percentage: number;
  };
}
```

#### POST /campaigns/:id/links
```typescript
@Post(':id/links')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'campaign', action: 'update' })
async addLinks(
  @Param('id') campaignId: string,
  @Body() dto: AddLinksDto,
  @Request() req,
) {
  return this.campaignsService.addLinks(campaignId, dto.linkIds);
}

class AddLinksDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  linkIds: string[];
}
```

---

## Validation DTOs

### Tags DTOs

```typescript
// apps/api/src/tags/dto/create-tag.dto.ts
export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores'
  })
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsUUID()
  organizationId: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
```

### Folders DTOs

```typescript
// apps/api/src/folders/dto/create-folder.dto.ts
export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

### Campaigns DTOs

```typescript
// apps/api/src/campaigns/dto/create-campaign.dto.ts
export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['clicks', 'conversions'])
  goalType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  goalTarget?: number;

  // UTM Parameters
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmContent?: string;
}
```

---

## RBAC Permission Matrix Update

### Add Folder Resource

```typescript
// apps/api/src/auth/rbac/permission-matrix.ts

// Add to OWNER permissions
folder: {
  create: '*',
  read: '*',
  update: '*',
  delete: '*',
  archive: '*',
},

// Add to ADMIN permissions
folder: {
  create: '*',
  read: '*',
  update: '*',
  delete: '*',
  archive: '*',
},

// Add to EDITOR permissions
folder: {
  create: '*',
  read: '*',
  update: 'own',
  delete: 'own',
  archive: 'own',
},

// Add to VIEWER permissions
folder: {
  read: '*',
},
```

---

## Unit Test Cases

### Tags Service Tests

```typescript
describe('TagsService', () => {
  describe('rename with cascade', () => {
    it('should update tag name and all Link.tags[] arrays', async () => {
      // Create tag "old-name"
      // Create 3 links with tag "old-name"
      // Rename tag to "new-name"
      // Verify: Tag record updated
      // Verify: All 3 links have "new-name" in tags array
      // Verify: No links have "old-name"
    });

    it('should audit log the rename with affected link count', async () => {
      // Verify audit log includes: { changedLinks: 5 }
    });
  });

  describe('merge', () => {
    it('should merge source tag into target tag', async () => {
      // Create tag "blog"
      // Create tag "blog-posts"
      // Create links with each tag
      // Merge "blog-posts" into "blog"
      // Verify: All links now have "blog"
      // Verify: "blog-posts" tag deleted
    });

    it('should prevent merging into self', async () => {
      // Expect error when sourceId === targetId
    });

    it('should handle duplicate tag prevention', async () => {
      // Link has both tags - after merge, should only have one "blog"
    });
  });

  describe('getStatistics', () => {
    it('should return usage count for each tag', async () => {
      // Create tags and links
      // Call getStatistics
      // Verify linkCount is accurate
    });

    it('should identify unused tags', async () => {
      // Create tag with no links
      // Verify unusedTags count includes it
    });
  });
});
```

### Folders Service Tests

```typescript
describe('FoldersService', () => {
  describe('create with organization scope', () => {
    it('should create folder with organizationId', async () => {
      // Create org-scoped folder
      // Verify folder has organizationId
    });

    it('should create nested folder under parent', async () => {
      // Create parent folder
      // Create child folder with parentId
      // Verify relationship
    });

    it('should prevent duplicate names in same parent', async () => {
      // Create folder "Marketing"
      // Try to create another "Marketing" in same parent
      // Expect ConflictException
    });
  });

  describe('findAll with tree structure', () => {
    it('should return flat list when no parentId specified', async () => {
      // Return root-level folders only
    });

    it('should return children when parentId specified', async () => {
      // Return folders under specific parent
    });

    it('should include nested children count', async () => {
      // Verify recursive count of nested links
    });
  });

  describe('archive', () => {
    it('should mark folder as archived', async () => {
      // Set isArchived = true
      // Set archivedAt timestamp
    });

    it('should archive nested folders recursively', async () => {
      // Parent archived = children archived
    });
  });

  describe('restore', () => {
    it('should restore archived folder', async () => {
      // Clear isArchived and archivedAt
    });
  });

  describe('move', () => {
    it('should move folder to new parent', async () => {
      // Update parentId
      // Verify folder under new parent
    });

    it('should prevent moving folder into its own child', async () => {
      // Circular reference prevention
      // Expect BadRequestException
    });
  });
});
```

### Campaigns Service Tests

```typescript
describe('CampaignsService', () => {
  describe('getAnalytics', () => {
    it('should aggregate clicks from all campaign links', async () => {
      // Create campaign with 3 links
      // Add click events
      // Call getAnalytics
      // Verify totalClicks is sum of all link clicks
    });

    it('should calculate goal progress', async () => {
      // Create campaign with goal: 1000 clicks
      // Add 500 clicks
      // Verify: goalProgress.percentage = 50
    });

    it('should group clicks by date', async () => {
      // Add clicks on different dates
      // Verify clicksByDate array
    });

    it('should identify top performing links', async () => {
      // Links ordered by click count
    });
  });

  describe('addLinks', () => {
    it('should assign links to campaign', async () => {
      // Update links with campaignId
    });

    it('should reject links from different organization', async () => {
      // Links must belong to same org as campaign
    });
  });

  describe('status transitions', () => {
    it('should auto-activate campaign on start date', async () => {
      // Cron job or scheduled task
    });

    it('should auto-complete campaign on end date', async () => {
      // Cron job or scheduled task
    });
  });
});
```

---

## E2E Test Cases

### New Test Scenarios

```typescript
// apps/web/e2e/organization.spec.ts (extended)

test.describe('Link Organization', () => {
  // Existing tests...

  test('ORG-010: Tag usage statistics', async ({ page }) => {
    // 1. Navigate to tag management
    // 2. Verify usage counts displayed
    // 3. Verify unused tags highlighted
    // 4. Sort by usage count
  });

  test('ORG-011: Merge duplicate tags', async ({ page }) => {
    // 1. Select source tag
    // 2. Click "Merge" action
    // 3. Select target tag
    // 4. Confirm merge
    // 5. Verify source tag removed
    // 6. Verify links updated with target tag
  });

  test('ORG-012: Nested folder creation', async ({ page }) => {
    // 1. Create parent folder "Marketing"
    // 2. Open parent folder
    // 3. Create child folder "Q1 Campaigns"
    // 4. Verify hierarchy in tree view
    // 5. Navigate breadcrumbs
  });

  test('ORG-013: Move folder to new parent', async ({ page }) => {
    // 1. Create folders A and B at root
    // 2. Drag folder B under folder A
    // 3. Verify B is now child of A
    // 4. Verify tree updated
  });

  test('ORG-014: Archive folder', async ({ page }) => {
    // 1. Create folder with links
    // 2. Click archive button
    // 3. Confirm dialog
    // 4. Verify folder hidden from main view
    // 5. Show archived folders
    // 6. Verify folder visible in archived section
  });

  test('ORG-015: Campaign analytics view', async ({ page }) => {
    // 1. Navigate to campaign
    // 2. Click "Analytics" tab
    // 3. Verify total clicks displayed
    // 4. Verify click chart rendered
    // 5. Verify top links table
  });

  test('ORG-016: Campaign date range', async ({ page }) => {
    // 1. Create new campaign
    // 2. Set start date (tomorrow)
    // 3. Set end date (+30 days)
    // 4. Save campaign
    // 5. Verify dates displayed
    // 6. Verify status = "Scheduled"
  });

  test('ORG-017: Campaign UTM builder', async ({ page }) => {
    // 1. Create/edit campaign
    // 2. Open UTM settings panel
    // 3. Fill utm_source, utm_medium, utm_campaign
    // 4. Save campaign
    // 5. Create link in campaign
    // 6. Verify UTM params appended to link
  });

  test('ORG-018: Filter links by folder', async ({ page }) => {
    // 1. Create folder with links
    // 2. Open filters modal
    // 3. Select folder filter
    // 4. Apply filter
    // 5. Verify only folder links shown
  });

  test('ORG-019: Filter links by campaign', async ({ page }) => {
    // 1. Create campaign with links
    // 2. Open filters modal
    // 3. Select campaign filter
    // 4. Apply filter
    // 5. Verify only campaign links shown
  });

  test('ORG-020: Bulk move links to folder', async ({ page }) => {
    // 1. Select multiple links
    // 2. Click "Move to Folder"
    // 3. Select destination folder
    // 4. Confirm move
    // 5. Navigate to folder, verify links present
  });
});
```

### Folder E2E Tests (New File)

```typescript
// apps/web/e2e/folders.spec.ts

test.describe('Folders Management', () => {
  test('FLD-001: Create folder with color', async ({ page }) => {
    // Navigate to /dashboard/folders
    // Click "Create Folder"
    // Enter name
    // Select color from palette
    // Save folder
    // Verify folder appears with correct color
  });

  test('FLD-002: View links in folder', async ({ page }) => {
    // Create folder
    // Add links to folder
    // Click "View Links" button
    // Verify redirected to filtered links page
  });

  test('FLD-003: Delete folder', async ({ page }) => {
    // Create folder with links
    // Click delete button
    // Confirm deletion
    // Verify folder removed
    // Verify links still exist (unassigned)
  });

  test('FLD-004: Folder organization scope', async ({ page }) => {
    // Login as team member
    // Create org-scoped folder
    // Login as different team member
    // Verify folder visible
  });

  test('FLD-005: RBAC - Viewer cannot create folder', async ({ page }) => {
    // Login as Viewer role
    // Navigate to folders page
    // Verify "Create Folder" button hidden/disabled
  });
});
```

---

## Frontend Component Specifications

### New Components Required

#### 1. FolderTree Component
```tsx
// components/folders/FolderTree.tsx
interface FolderTreeProps {
  folders: FolderWithChildren[];
  selectedFolderId?: string;
  onSelect: (folderId: string) => void;
  onMove?: (folderId: string, newParentId: string | null) => void;
}

// Features:
// - Collapsible tree structure
// - Drag-and-drop support
// - Color indicators
// - Link count badges
// - Context menu (Edit, Delete, Archive)
```

#### 2. CampaignAnalytics Component
```tsx
// components/campaigns/CampaignAnalytics.tsx
interface CampaignAnalyticsProps {
  campaignId: string;
}

// Features:
// - Total clicks stat card
// - Click trend chart (line chart)
// - Top performing links table
// - Geographic distribution
// - Device breakdown
// - Goal progress bar (if goal set)
```

#### 3. UTMBuilder Component
```tsx
// components/campaigns/UTMBuilder.tsx
interface UTMBuilderProps {
  value: UTMParams;
  onChange: (params: UTMParams) => void;
}

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

// Features:
// - Input fields for each UTM param
// - Auto-suggestions (e.g., "google", "facebook" for source)
// - Preview URL with UTM params
// - Copy preview URL button
```

#### 4. TagMergeDialog Component
```tsx
// components/tags/TagMergeDialog.tsx
interface TagMergeDialogProps {
  sourceTag: Tag;
  onMerge: (targetTagId: string) => void;
  onClose: () => void;
}

// Features:
// - Source tag display
// - Target tag selector (dropdown)
// - Preview: "X links will be updated"
// - Warning about irreversible action
// - Confirm/Cancel buttons
```

### UI Updates Required

#### FiltersModal.tsx Updates
1. Add folder filter dropdown
2. Add campaign filter dropdown
3. Add date range filter for creation date
4. Improve filter chip display

#### TagsManager.tsx Updates
1. Add usage count column
2. Add merge action button
3. Add search input
4. Add sort options (name, usage, date)

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. Add RBAC to Folders controller
2. Add audit logging to Folders
3. Create validation DTOs for all modules
4. Fix tag rename cascade

### Phase 2: Organization Scope (Week 2)
1. Add organizationId to Folder model
2. Update Folder queries for org scope
3. Add folder to permission matrix
4. Create folder E2E tests

### Phase 3: Enhanced Features (Week 3)
1. Implement nested folders (parentId)
2. Create FolderTree component
3. Add folder filtering to links page
4. Implement tag usage statistics

### Phase 4: Campaign Enhancements (Week 4)
1. Add campaign analytics endpoint
2. Create CampaignAnalytics component
3. Add campaign dates support
4. Implement UTM builder

### Phase 5: Polish & Testing (Week 5)
1. Add drag-and-drop support
2. Complete E2E test suite
3. Performance optimization
4. Documentation

---

## Summary

Module 1.6 Link Organization is approximately 55-60% complete. Tags have the most complete implementation, Campaigns are functional but missing analytics, and Folders need significant work including organization scope and RBAC integration.

**Critical Issues**:
1. Folders lack RBAC - security concern
2. Folders are user-scoped - breaks team collaboration
3. Tag rename doesn't cascade - data integrity issue

**Priority Actions**:
1. Add RBAC to Folders immediately
2. Add organizationId to Folders for team sharing
3. Implement tag rename cascade
4. Add campaign analytics for measuring effectiveness
