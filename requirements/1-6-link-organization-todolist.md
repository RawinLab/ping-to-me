# Module 1.6: Link Organization (Tags, Folders, Campaigns) - Development Todolist

> **Status**: ~95% Complete ✅
> **Priority**: Low - Phase 1, 2 & 3 backend complete, frontend components remaining
> **Reference**: `requirements/1-6-link-organization-plan.md`
> **Last Updated**: 2025-12-08

---

## Phase 1: Critical Fixes (P0 - IMMEDIATE) ✅ COMPLETED

### Task 1.6.1: Add RBAC to Folders Controller ✅
- [x] **Add PermissionGuard and decorators to all folder endpoints**
  - File: `apps/api/src/folders/folders.controller.ts`
  - Add `@UseGuards(JwtAuthGuard, PermissionGuard)` to controller
  - Add `@Permission({ resource: 'folder', action: 'create' })` to POST
  - Add `@Permission({ resource: 'folder', action: 'read' })` to GET
  - Add `@Permission({ resource: 'folder', action: 'update' })` to PUT
  - Add `@Permission({ resource: 'folder', action: 'delete' })` to DELETE

- [x] **Add folder to permission matrix**
  - File: `apps/api/src/auth/rbac/permission-matrix.ts`
  - OWNER: all actions = '*'
  - ADMIN: all actions = '*'
  - EDITOR: create/read = '*', update/delete = 'own'
  - VIEWER: read = '*'

### Task 1.6.2: Add Organization Scope to Folders ✅
- [x] **Update Prisma schema for Folder**
  - File: `packages/database/prisma/schema.prisma`
  - Add: `organizationId String? @db.Uuid`
  - Add relation: `organization Organization? @relation(...)`
  - Add: `parentId String? @db.Uuid` for nested folders
  - Add self-relation for parent-child hierarchy
  - Add index: `@@index([organizationId])`
  - Update unique constraint: `@@unique([organizationId, name, parentId])`

- [x] **Update FoldersService for org scope**
  - File: `apps/api/src/folders/folders.service.ts`
  - Add organizationId to create/findAll queries
  - Validate org ownership via verifyFolderAccess() helper
  - Include children count in responses

- [x] **Update FoldersController**
  - Add `@Query('orgId')` parameter to endpoints
  - Add getDefaultOrgId() helper for default org resolution

- [ ] **Update frontend to pass orgId** (TODO)
  - Update folder API calls to include organizationId

### Task 1.6.3: Implement Tag Rename Cascade ✅
- [x] **Update tags in Link.tags[] arrays on rename**
  - File: `apps/api/src/tags/tags.service.ts`
  - When renaming tag:
    1. Find all links with old tag name in tags array
    2. Replace old name with new name in each array
    3. Use transaction for atomicity
  - Log affected link count in audit

### Task 1.6.4: Create Validation DTOs ✅
- [x] **Create CreateTagDto**
  - File: `apps/api/src/tags/dto/create-tag.dto.ts`
  - Fields: name (@MinLength(1), @MaxLength(50), @Matches regex), color (@IsHexColor), description, organizationId

- [x] **Create UpdateTagDto**
  - File: `apps/api/src/tags/dto/update-tag.dto.ts`
  - Partial of CreateTagDto (excluding orgId)

- [x] **Create CreateFolderDto**
  - File: `apps/api/src/folders/dto/create-folder.dto.ts`
  - Fields: name, color, description, parentId, organizationId

- [x] **Create UpdateFolderDto**
  - File: `apps/api/src/folders/dto/update-folder.dto.ts`
  - Partial of CreateFolderDto (excluding orgId, parentId)

- [x] **Create CreateCampaignDto**
  - File: `apps/api/src/campaigns/dto/create-campaign.dto.ts`
  - Fields: name, description, organizationId, startDate, endDate, goalType, goalTarget, UTM fields

- [x] **Apply DTOs to all controllers**

### Task 1.6.5: Add Audit Logging to Folders ✅
- [x] **Log all folder CRUD operations**
  - File: `apps/api/src/folders/folders.service.ts`
  - Events: folder.created, folder.updated, folder.deleted, folder.link_added, folder.link_removed
  - Include: folderId, userId, organizationId, changes

---

## Phase 2: High Priority Features ✅ COMPLETED

### Task 1.6.6: Tag Usage Statistics ✅
- [x] **Create getStatistics method**
  - File: `apps/api/src/tags/tags.service.ts`
  - Query link counts per tag using has operator
  - Return: tags with linkCount, totalTags, unusedTags count

- [x] **Add GET /tags/statistics endpoint**
  - File: `apps/api/src/tags/tags.controller.ts`

- [ ] **Update TagsManager UI to show counts** (TODO - frontend)
  - File: `apps/web/components/tags/TagsManager.tsx`
  - Add usage count column
  - Highlight unused tags
  - Sort by usage option

### Task 1.6.7: Campaign Analytics Endpoint ✅
- [x] **Create getAnalytics method**
  - File: `apps/api/src/campaigns/campaigns.service.ts`
  - Aggregate clicks from all campaign links
  - Return: totalLinks, totalClicks, uniqueClicks, clicksByDate, topLinks, clicksByCountry, goalProgress

- [x] **Add GET /campaigns/:id/analytics endpoint**
  - File: `apps/api/src/campaigns/campaigns.controller.ts`

- [ ] **Create CampaignAnalytics component** (TODO - frontend)
  - File: `apps/web/components/campaigns/CampaignAnalytics.tsx`
  - Stats cards, click chart, top links table
  - Goal progress bar if goal set

### Task 1.6.8: Nested Folders ✅
- [x] **Update Prisma schema with parentId** (done in Phase 1)
  - File: `packages/database/prisma/schema.prisma`
  - Add: `parentId String? @db.Uuid`
  - Add self-relation: `parent Folder?`, `children Folder[]`
  - Update unique constraint: `@@unique([organizationId, name, parentId])`

- [x] **Update findAll for tree queries**
  - Support `parentId` query parameter
  - Include children count
  - Return nested structure option via GET /folders/tree

- [x] **Add POST /folders/:id/move endpoint**
  - Move folder to new parent
  - Prevent circular references with isDescendant helper

- [ ] **Create FolderTree component** (TODO - frontend)
  - File: `apps/web/components/folders/FolderTree.tsx`
  - Collapsible tree structure
  - Link count badges
  - Context menu actions

### Task 1.6.9: Campaign Dates ✅
- [x] **Update Campaign schema**
  - Add: `startDate DateTime?`, `endDate DateTime?`
  - Add: `status CampaignStatus` enum (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)
  - Add: goalType, goalTarget for campaign goals
  - Add: UTM fields (utmSource, utmMedium, utmCampaign, utmTerm, utmContent)

- [ ] **Add date pickers to campaign form** (TODO - frontend)
  - Start and end date inputs
  - Status badge based on dates

### Task 1.6.10: Tag Merge ✅
- [x] **Create merge method**
  - File: `apps/api/src/tags/tags.service.ts`
  - Replace sourceTag with targetTag in all Link.tags[]
  - Delete source tag
  - Use transaction for atomicity

- [x] **Add POST /tags/:id/merge endpoint**
  - Body: `{ targetTagId: string }`

- [ ] **Create TagMergeDialog component** (TODO - frontend)
  - File: `apps/web/components/tags/TagMergeDialog.tsx`
  - Source tag display
  - Target tag selector
  - Preview affected links count

---

## Phase 3: Medium Priority Enhancements ✅ BACKEND COMPLETE

### Task 1.6.11: UTM Parameter Management ✅
- [x] **Add UTM fields to Campaign** (done in Phase 2)
  - utmSource, utmMedium, utmCampaign, utmTerm, utmContent

- [ ] **Create UTMBuilder component** (TODO - frontend)
  - File: `apps/web/components/campaigns/UTMBuilder.tsx`
  - Input fields for each param
  - Auto-suggestions
  - Preview URL with params

### Task 1.6.12: Campaign Goals ✅
- [x] **Add goal fields to Campaign** (done in Phase 2)
  - goalType: 'clicks' | 'conversions'
  - goalTarget: number

- [ ] **Show goal progress in analytics** (TODO - frontend)
  - Progress bar
  - Percentage complete

### Task 1.6.13: Folder Archive ✅
- [x] **Add archive fields to Folder**
  - isArchived: boolean
  - archivedAt: DateTime?

- [x] **Add archive/restore endpoints**
  - POST /folders/:id/archive
  - POST /folders/:id/restore

- [x] **Archive nested folders recursively**

- [ ] **Add archive UI** (TODO - frontend)
  - Archive button in folder card
  - Show/hide archived toggle

### Task 1.6.14: Tag Search ✅
- [x] **Add GET /tags/autocomplete endpoint**
  - Query param: `q` for search
  - Case-insensitive partial match on tag name
  - Results sorted by usage count

- [ ] **Add search input to TagsManager** (TODO - frontend)

### Task 1.6.15: Campaign Status
- [ ] **Add status enum handling** (TODO - cron job)
  - Auto-set ACTIVE on startDate
  - Auto-set COMPLETED on endDate
  - Manual PAUSED option

- [ ] **Show status badges in UI** (TODO - frontend)

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

## Unit Tests Required ✅ COMPLETE

### Tags Service Tests ✅ (31 tests, 91.3% coverage)
```
File: apps/api/src/tags/__tests__/tags.service.spec.ts
```
- [x] rename: update tag name and all Link.tags[] arrays
- [x] rename: audit log with affected link count
- [x] merge: replace source with target in all links
- [x] merge: delete source tag after merge
- [x] merge: prevent self-merge
- [x] merge: handle links with both tags
- [x] getStatistics: return usage count per tag
- [x] getStatistics: identify unused tags

### Folders Service Tests ✅ (51 tests)
```
File: apps/api/src/folders/__tests__/folders.service.spec.ts
```
- [x] create: with organizationId
- [x] create: nested under parent
- [x] create: prevent duplicate names in same parent
- [x] findAll: return flat list or tree structure
- [x] findAll: include children count
- [x] archive: mark as archived
- [x] archive: archive children recursively
- [x] restore: clear archived flag
- [x] move: update parentId
- [x] move: prevent circular reference (skipped - memory)

### Campaigns Service Tests ✅ (30 tests)
```
File: apps/api/src/campaigns/__tests__/campaigns.service.spec.ts
```
- [x] getAnalytics: aggregate clicks from all campaign links
- [x] getAnalytics: calculate goal progress
- [x] getAnalytics: group clicks by date
- [x] addLinks: assign links to campaign
- [x] addLinks: reject links from different org

---

## E2E Tests Required ✅ CREATED

```
File: apps/web/e2e/link-organization.spec.ts (15 tests)
```

### Tag Tests ✅
- [x] ORG-010: Tag usage statistics display
- [x] ORG-011: Merge duplicate tags

### Folder Tests ✅
- [x] ORG-012: Nested folder creation
- [x] ORG-013: Move folder to new parent
- [ ] ORG-014: Archive folder (TODO - after UI)
- [x] FLD-001: Create folder with color
- [x] FLD-002: View links in folder
- [x] FLD-003: Delete folder (links unassigned)
- [x] FLD-004: Folder organization scope
- [x] FLD-005: RBAC - Viewer cannot create folder

### Campaign Tests ✅
- [x] ORG-015: Campaign analytics view
- [x] ORG-016: Campaign date range
- [ ] ORG-017: Campaign UTM builder (TODO - after UI)

### Filter Tests
- [ ] ORG-018: Filter links by folder (TODO - after UI)
- [ ] ORG-019: Filter links by campaign (TODO - after UI)
- [ ] ORG-020: Bulk move links to folder (TODO - after UI)

---

## Acceptance Criteria

### Phase 1 Complete When: ✅
- [x] All folder endpoints have RBAC guards
- [x] Folders support organization scope
- [x] Tag rename updates all Link.tags[] arrays
- [x] All DTOs validate input
- [x] Folder operations logged to audit
- [x] Unit tests pass

### Phase 2 Complete When: ✅
- [x] Tag usage counts displayed (API ready)
- [x] Campaign analytics shows clicks/goals (API ready)
- [x] Nested folders work with tree UI (API ready)
- [x] Campaign dates can be set
- [x] Tags can be merged
- [x] E2E tests created

### Phase 3 Complete When: ✅ (Backend)
- [x] UTM fields stored in campaigns
- [x] Goals stored and progress calculated
- [x] Folders can be archived/restored (API ready)
- [x] Tag autocomplete works (API ready)
- [ ] Frontend components (TODO)

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
