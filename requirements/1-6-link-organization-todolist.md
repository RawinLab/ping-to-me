# Module 1.6: Link Organization (Tags, Folders, Campaigns) - Development Todolist

> **Status**: ~55-60% Complete
> **Priority**: High - CRITICAL security issue (Folders lack RBAC)
> **Reference**: `requirements/1-6-link-organization-plan.md`

---

## Phase 1: Critical Fixes (P0 - IMMEDIATE)

### Task 1.6.1: Add RBAC to Folders Controller
- [ ] **Add PermissionGuard and decorators to all folder endpoints**
  - File: `apps/api/src/folders/folders.controller.ts`
  - Add `@UseGuards(JwtAuthGuard, PermissionGuard)` to controller
  - Add `@Permission({ resource: 'folder', action: 'create' })` to POST
  - Add `@Permission({ resource: 'folder', action: 'read' })` to GET
  - Add `@Permission({ resource: 'folder', action: 'update' })` to PATCH
  - Add `@Permission({ resource: 'folder', action: 'delete' })` to DELETE

- [ ] **Add folder to permission matrix**
  - File: `apps/api/src/auth/rbac/permission-matrix.ts`
  - OWNER: all actions = '*'
  - ADMIN: all actions = '*'
  - EDITOR: create/read = '*', update/delete = 'own'
  - VIEWER: read = '*'

### Task 1.6.2: Add Organization Scope to Folders
- [ ] **Update Prisma schema for Folder**
  - File: `packages/database/prisma/schema.prisma`
  - Add: `organizationId String? @db.Uuid`
  - Add relation: `organization Organization? @relation(...)`
  - Add index: `@@index([organizationId])`

- [ ] **Update FoldersService for org scope**
  - File: `apps/api/src/folders/folders.service.ts`
  - Add organizationId to create/findAll queries
  - Validate org ownership on update/delete

- [ ] **Update FoldersController**
  - Add `@Query('orgId')` parameter to all endpoints

- [ ] **Update frontend to pass orgId**
  - Update folder API calls to include organizationId

### Task 1.6.3: Implement Tag Rename Cascade
- [ ] **Update tags in Link.tags[] arrays on rename**
  - File: `apps/api/src/tags/tags.service.ts`
  - When renaming tag:
    1. Find all links with old tag name in tags array
    2. Replace old name with new name in each array
    3. Use transaction for atomicity
  - Log affected link count in audit

### Task 1.6.4: Create Validation DTOs
- [ ] **Create CreateTagDto**
  - File: `apps/api/src/tags/dto/create-tag.dto.ts`
  - Fields: name (@MinLength(1), @MaxLength(50), @Matches regex), color (@IsHexColor), description, organizationId

- [ ] **Create UpdateTagDto**
  - File: `apps/api/src/tags/dto/update-tag.dto.ts`
  - Partial of CreateTagDto

- [ ] **Create CreateFolderDto**
  - File: `apps/api/src/folders/dto/create-folder.dto.ts`
  - Fields: name, color, description, parentId, organizationId

- [ ] **Create UpdateFolderDto**
  - File: `apps/api/src/folders/dto/update-folder.dto.ts`
  - Partial of CreateFolderDto

- [ ] **Create CreateCampaignDto**
  - File: `apps/api/src/campaigns/dto/create-campaign.dto.ts`
  - Fields: name, description, organizationId, startDate, endDate, goalType, goalTarget, UTM fields

- [ ] **Apply DTOs to all controllers**

### Task 1.6.5: Add Audit Logging to Folders
- [ ] **Log all folder CRUD operations**
  - File: `apps/api/src/folders/folders.service.ts`
  - Events: folder.created, folder.updated, folder.deleted
  - Include: folderId, userId, organizationId, changes

---

## Phase 2: High Priority Features

### Task 1.6.6: Tag Usage Statistics
- [ ] **Create getStatistics method**
  - File: `apps/api/src/tags/tags.service.ts`
  - Query link counts per tag using groupBy
  - Return: tags with linkCount, totalTags, unusedTags count

- [ ] **Add GET /tags/statistics endpoint**
  - File: `apps/api/src/tags/tags.controller.ts`

- [ ] **Update TagsManager UI to show counts**
  - File: `apps/web/components/tags/TagsManager.tsx`
  - Add usage count column
  - Highlight unused tags
  - Sort by usage option

### Task 1.6.7: Campaign Analytics Endpoint
- [ ] **Create getAnalytics method**
  - File: `apps/api/src/campaigns/campaigns.service.ts`
  - Aggregate clicks from all campaign links
  - Return: totalLinks, totalClicks, uniqueClicks, clicksByDate, topLinks, clicksByCountry, goalProgress

- [ ] **Add GET /campaigns/:id/analytics endpoint**
  - File: `apps/api/src/campaigns/campaigns.controller.ts`

- [ ] **Create CampaignAnalytics component**
  - File: `apps/web/components/campaigns/CampaignAnalytics.tsx`
  - Stats cards, click chart, top links table
  - Goal progress bar if goal set

### Task 1.6.8: Nested Folders
- [ ] **Update Prisma schema with parentId**
  - File: `packages/database/prisma/schema.prisma`
  - Add: `parentId String? @db.Uuid`
  - Add self-relation: `parent Folder?`, `children Folder[]`
  - Update unique constraint: `@@unique([userId, name, parentId])`

- [ ] **Update findAll for tree queries**
  - Support `parentId` query parameter
  - Include children count
  - Return nested structure option

- [ ] **Add POST /folders/:id/move endpoint**
  - Move folder to new parent
  - Prevent circular references

- [ ] **Create FolderTree component**
  - File: `apps/web/components/folders/FolderTree.tsx`
  - Collapsible tree structure
  - Link count badges
  - Context menu actions

### Task 1.6.9: Campaign Dates
- [ ] **Update Campaign schema**
  - Add: `startDate DateTime?`, `endDate DateTime?`
  - Add: `status CampaignStatus` enum (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)

- [ ] **Add date pickers to campaign form**
  - Start and end date inputs
  - Status badge based on dates

### Task 1.6.10: Tag Merge
- [ ] **Create merge method**
  - File: `apps/api/src/tags/tags.service.ts`
  - Replace sourceTag with targetTag in all Link.tags[]
  - Delete source tag
  - Use transaction

- [ ] **Add POST /tags/:id/merge endpoint**
  - Body: `{ targetTagId: string }`

- [ ] **Create TagMergeDialog component**
  - File: `apps/web/components/tags/TagMergeDialog.tsx`
  - Source tag display
  - Target tag selector
  - Preview affected links count

---

## Phase 3: Medium Priority Enhancements

### Task 1.6.11: UTM Parameter Management
- [ ] **Add UTM fields to Campaign**
  - utmSource, utmMedium, utmCampaign, utmTerm, utmContent

- [ ] **Create UTMBuilder component**
  - File: `apps/web/components/campaigns/UTMBuilder.tsx`
  - Input fields for each param
  - Auto-suggestions
  - Preview URL with params

### Task 1.6.12: Campaign Goals
- [ ] **Add goal fields to Campaign**
  - goalType: 'clicks' | 'conversions'
  - goalTarget: number

- [ ] **Show goal progress in analytics**
  - Progress bar
  - Percentage complete

### Task 1.6.13: Folder Archive
- [ ] **Add archive fields to Folder**
  - isArchived: boolean
  - archivedAt: DateTime?

- [ ] **Add archive/restore endpoints**
  - POST /folders/:id/archive
  - POST /folders/:id/restore

- [ ] **Archive nested folders recursively**

- [ ] **Add archive UI**
  - Archive button in folder card
  - Show/hide archived toggle

### Task 1.6.14: Tag Search
- [ ] **Add GET /tags/autocomplete endpoint**
  - Query param: `q` for search
  - Fuzzy match on tag name

- [ ] **Add search input to TagsManager**

### Task 1.6.15: Campaign Status
- [ ] **Add status enum handling**
  - Auto-set ACTIVE on startDate
  - Auto-set COMPLETED on endDate
  - Manual PAUSED option

- [ ] **Show status badges in UI**

---

## Phase 4: Future Enhancements

### Task 1.6.16: Drag-and-Drop for Folders
- [ ] DnD library integration
- [ ] Drag folders to reorder/nest
- [ ] Drag links to folders

### Task 1.6.17: Campaign Templates
- [ ] Save campaign as template
- [ ] Load template when creating

### Task 1.6.18: Folder Sharing
- [ ] Share folder with team members
- [ ] Permission levels per share

### Task 1.6.19: Tag Descriptions
- [ ] Add description field
- [ ] Show in tooltip/modal

### Task 1.6.20: Campaign Reports
- [ ] Export campaign performance report
- [ ] PDF generation

---

## Unit Tests Required

### Tags Service Tests
```
File: apps/api/src/tags/__tests__/tags.service.spec.ts
```
- [ ] rename: update tag name and all Link.tags[] arrays
- [ ] rename: audit log with affected link count
- [ ] merge: replace source with target in all links
- [ ] merge: delete source tag after merge
- [ ] merge: prevent self-merge
- [ ] merge: handle links with both tags
- [ ] getStatistics: return usage count per tag
- [ ] getStatistics: identify unused tags

### Folders Service Tests
```
File: apps/api/src/folders/__tests__/folders.service.spec.ts
```
- [ ] create: with organizationId
- [ ] create: nested under parent
- [ ] create: prevent duplicate names in same parent
- [ ] findAll: return flat list or tree structure
- [ ] findAll: include children count
- [ ] archive: mark as archived
- [ ] archive: archive children recursively
- [ ] restore: clear archived flag
- [ ] move: update parentId
- [ ] move: prevent circular reference

### Campaigns Service Tests
```
File: apps/api/src/campaigns/__tests__/campaigns.service.spec.ts
```
- [ ] getAnalytics: aggregate clicks from all campaign links
- [ ] getAnalytics: calculate goal progress
- [ ] getAnalytics: group clicks by date
- [ ] addLinks: assign links to campaign
- [ ] addLinks: reject links from different org

---

## E2E Tests Required

```
File: apps/web/e2e/organization.spec.ts (extend)
```

### Tag Tests
- [ ] ORG-010: Tag usage statistics display
- [ ] ORG-011: Merge duplicate tags

### Folder Tests
- [ ] ORG-012: Nested folder creation
- [ ] ORG-013: Move folder to new parent
- [ ] ORG-014: Archive folder
- [ ] FLD-001: Create folder with color
- [ ] FLD-002: View links in folder
- [ ] FLD-003: Delete folder (links unassigned)
- [ ] FLD-004: Folder organization scope
- [ ] FLD-005: RBAC - Viewer cannot create folder

### Campaign Tests
- [ ] ORG-015: Campaign analytics view
- [ ] ORG-016: Campaign date range
- [ ] ORG-017: Campaign UTM builder

### Filter Tests
- [ ] ORG-018: Filter links by folder
- [ ] ORG-019: Filter links by campaign
- [ ] ORG-020: Bulk move links to folder

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] All folder endpoints have RBAC guards
- [ ] Folders support organization scope
- [ ] Tag rename updates all Link.tags[] arrays
- [ ] All DTOs validate input
- [ ] Folder operations logged to audit
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Tag usage counts displayed
- [ ] Campaign analytics shows clicks/goals
- [ ] Nested folders work with tree UI
- [ ] Campaign dates can be set
- [ ] Tags can be merged
- [ ] E2E tests pass

### Phase 3 Complete When:
- [ ] UTM builder works in campaigns
- [ ] Goals displayed with progress
- [ ] Folders can be archived/restored
- [ ] Tag search works

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/tags/dto/create-tag.dto.ts` | Tag creation validation |
| `apps/api/src/tags/dto/update-tag.dto.ts` | Tag update validation |
| `apps/api/src/folders/dto/create-folder.dto.ts` | Folder creation validation |
| `apps/api/src/folders/dto/update-folder.dto.ts` | Folder update validation |
| `apps/api/src/campaigns/dto/create-campaign.dto.ts` | Campaign validation |
| `apps/web/components/folders/FolderTree.tsx` | Nested folder UI |
| `apps/web/components/campaigns/CampaignAnalytics.tsx` | Campaign stats |
| `apps/web/components/campaigns/UTMBuilder.tsx` | UTM param builder |
| `apps/web/components/tags/TagMergeDialog.tsx` | Tag merge UI |

### Files to Modify
| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Folder organizationId/parentId, Campaign dates/status/UTM |
| `apps/api/src/auth/rbac/permission-matrix.ts` | Add folder resource |
| `apps/api/src/folders/folders.controller.ts` | Add RBAC, new endpoints |
| `apps/api/src/folders/folders.service.ts` | Org scope, nesting, archive |
| `apps/api/src/tags/tags.service.ts` | Rename cascade, merge, statistics |
| `apps/api/src/tags/tags.controller.ts` | Statistics, merge endpoints |
| `apps/api/src/campaigns/campaigns.controller.ts` | Analytics endpoint |
| `apps/api/src/campaigns/campaigns.service.ts` | Analytics, dates, goals |
| `apps/web/components/tags/TagsManager.tsx` | Usage counts, merge |
| `apps/web/app/dashboard/folders/page.tsx` | Tree view, archive |

---

## Security Notes

- **CRITICAL**: Folders currently have NO RBAC - fix immediately
- Folders are user-scoped instead of org-scoped - breaks team collaboration
- Tag rename doesn't cascade - causes data integrity issues

---

*Generated from: 1-6-link-organization-plan.md*
*Last Updated: 2025-12-08*
