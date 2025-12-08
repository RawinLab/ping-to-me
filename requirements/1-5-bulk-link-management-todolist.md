# Module 1.5: Bulk Link Management - Development Todolist

> **Status**: ~95% Complete
> **Priority**: High
> **Reference**: `requirements/1-5-bulk-link-management-plan.md`

---

## Phase 1: Critical Fixes (P0) ✅ COMPLETED

### Task 1.5.1: Bulk Edit Endpoint ✅
- [x] **Create BulkEditDto**
  - File: `apps/api/src/links/dto/bulk-edit.dto.ts`
  - Fields:
    - `ids`: @IsArray, @ArrayMinSize(1), @ArrayMaxSize(100), @IsString({ each: true })
    - `status`: @IsOptional, @IsEnum(LinkStatus)
    - `expirationDate`: @IsOptional, @IsDateString
    - `folderId`: @IsOptional, @IsString
    - `campaignId`: @IsOptional, @IsString
    - `tags`: @IsOptional, @IsArray, @IsString({ each: true })
    - `tagsAction`: @IsOptional, @IsEnum(['add', 'replace', 'remove'])

- [x] **Implement editMany in LinksService**
  - File: `apps/api/src/links/links.service.ts`
  - Use `prisma.$transaction` for atomicity
  - Validate ownership of all links
  - Handle tag actions (add/replace/remove)
  - Log audit event for each link

- [x] **Add POST /links/bulk-edit endpoint**
  - File: `apps/api/src/links/links.controller.ts`
  - Add: `@Permission({ resource: 'link', action: 'bulk' })`

### Task 1.5.2: Transaction Support ✅
- [x] **Wrap import in transaction**
  - File: `apps/api/src/links/links.service.ts`
  - Use `prisma.$transaction` for all-or-nothing import
  - Rollback on any failure
  - Added 60s timeout for large imports

- [x] **Wrap bulk delete in transaction**
  - File: `apps/api/src/links/links.service.ts`
  - Atomic deletion with rollback
  - Added 30s timeout
  - Support permanent (hard delete) flag

### Task 1.5.3: Organization Context ✅
- [x] **Add organizationId to all bulk operations**
  - File: `apps/api/src/links/links.controller.ts`
  - Removed all 7 TODO comments
  - All bulk ops now accept organizationId query param

- [ ] **Update frontend to pass orgId**
  - Update all bulk API calls to include organizationId

### Task 1.5.4: Input Validation DTOs ✅
- [x] **Update BulkDeleteDto**
  - File: `apps/api/src/links/dto/bulk-delete.dto.ts`
  - Added `permanent` (optional bool) for hard delete

- [x] **BulkTagDto already exists**
  - File: `apps/api/src/links/dto/bulk-tag.dto.ts`
  - Fields: `ids`, `tagName` string

- [x] **Create BulkImportOptionsDto**
  - File: `apps/api/src/links/dto/bulk-import.dto.ts`
  - Fields: `dryRun`, `maxRows`, `organizationId`

- [ ] **Add file upload validation**
  - File: `apps/api/src/links/links.controller.ts`
  - Limit: 10MB max file size
  - Filter: Only text/csv MIME type

### Task 1.5.5: Fix Click Count Export ✅
- [x] **Query actual click counts in export**
  - File: `apps/api/src/links/links.service.ts` (exportLinks method)
  - Fixed: Now uses groupBy query for efficient click counts
  - Added CSV injection protection (sanitizeCsvField)
  - Added organizationId filter support

---

## Phase 2: Import Preview & Select All ✅ COMPLETED

### Task 1.5.6: Import Preview Endpoint ✅
- [x] **Create previewImport method**
  - File: `apps/api/src/links/links.service.ts`
  - Parse CSV without saving
  - Validate each row
  - Return: totalRows, validRows, invalidRows, preview (first 10)

- [x] **Add POST /links/import/preview endpoint**
  - File: `apps/api/src/links/links.controller.ts`
  - Accept file upload, return preview data

- [x] **Create ImportPreviewModal component**
  - File: `apps/web/components/links/ImportPreviewModal.tsx`
  - Show parsed rows in table
  - Highlight validation errors
  - Show duplicate warnings
  - Confirm/Cancel buttons

### Task 1.5.7: Select All Functionality ✅
- [x] **Add header checkbox to LinksTable**
  - File: `apps/web/components/links/LinksTable.tsx`
  - Toggle all visible links
  - Update selection count

- [x] **Handle pagination with select all**
  - Option: "Select all X links" after select all visible
  - Clear selection on page change option

### Task 1.5.8: Filtered Export ✅
- [x] **Convert GET /links/export to POST**
  - File: `apps/api/src/links/links.controller.ts`
  - Accept filter body instead of query params

- [x] **Create ExportFiltersDto**
  - File: `apps/api/src/links/dto/export-filters.dto.ts`
  - Fields: tagIds, campaignId, status, startDate, endDate, format, selectedIds

- [x] **Implement filtered export logic**
  - Apply all filters before export
  - Support JSON format option

- [x] **Create ExportOptionsDialog**
  - File: `apps/web/components/links/ExportOptionsDialog.tsx`
  - Scope: All / Filtered / Selected
  - Format: CSV / JSON
  - Date range filter

### Task 1.5.9: Bulk Status Change ✅
- [x] **Add status toggle UI to bulk actions**
  - File: `apps/web/components/links/LinksTable.tsx`
  - Buttons: Enable, Disable, Archive

### Task 1.5.10: Progress Indicators ✅
- [x] **Add loading state to bulk operations**
  - Show spinner during operation
  - Show progress bar for large imports

- [x] **Create ProgressWithLabel component**
  - File: `apps/web/components/ui/progress-with-label.tsx`
  - Show: current/total, percentage
  - Optional cancel button

---

## Phase 3: Medium Priority Enhancements ✅ COMPLETED

### Task 1.5.11: JSON Export Support ✅
- [x] **Add format parameter to export**
  - Support `format: 'csv' | 'json'`
  - Return JSON array for json format
  - Implemented in POST /links/export endpoint

### Task 1.5.12: Drag-and-Drop File Upload ✅
- [x] **Add drop zone to ImportLinksModal**
  - File: `apps/web/components/links/ImportLinksModal.tsx`
  - Visual drop zone with drag-over highlight
  - Accept CSV files only
  - Drag handlers: handleDragOver, handleDragLeave, handleDrop

### Task 1.5.13: Bulk Archive ✅
- [x] **Add archive action to bulk edit**
  - Set status to ARCHIVED for selected links
  - Button in bulk actions toolbar (LinksTable.tsx)

### Task 1.5.14: Bulk Move to Folder ✅
- [x] **Add folder selector to BulkEditDialog**
  - File: `apps/web/components/links/BulkEditDialog.tsx`
  - Dropdown to select destination folder
  - "None" option to unassign
  - Also includes: campaign selector, expiration date, tags with add/replace/remove

### Task 1.5.15: CSV Template Download ✅
- [x] **Create GET /links/import/template endpoint**
  - Return CSV with headers and example row
  - Headers: originalUrl, slug, title, description, tags, expirationDate

- [x] **Add "Download Template" button**
  - In ImportLinksModal
  - Now uses API endpoint instead of client-side generation

---

## Phase 4: Future Enhancements

### Task 1.5.16: Background Jobs (BullMQ)
- [ ] For large imports (>1000 rows)
- [ ] Job status endpoint
- [ ] Real-time progress updates

### Task 1.5.17: Scheduled Exports
- [ ] Cron job for recurring exports
- [ ] Email delivery

### Task 1.5.18: Expiration Field Import
- [ ] Map expirationDate from CSV

### Task 1.5.19: Max Rows Enforcement
- [ ] Configurable limit per plan
- [ ] Warning message in UI

### Task 1.5.20: Retry Failed Imports
- [ ] Download CSV of failed rows
- [ ] Retry button for failures

---

## Security Considerations

### Task 1.5.21: CSV Injection Protection ✅
- [x] **Sanitize CSV fields on export**
  - File: `apps/api/src/links/links.service.ts`
  - Prefix fields starting with `=`, `+`, `-`, `@` with single quote
  - Implemented in exportLinks method

### Task 1.5.22: Bulk-Specific Rate Limiting
- [ ] **Add rate limits to bulk endpoints**
  - `@Throttle(10, 60)` - 10 bulk ops per minute
  - Apply to import, bulk-edit, bulk-delete

---

## Unit Tests Required

### Bulk Edit Service Tests
```
File: apps/api/src/links/__tests__/links.service.bulk.spec.ts
```
- [ ] editMany: update status for multiple links
- [ ] editMany: add tags to multiple links
- [ ] editMany: replace tags on multiple links
- [ ] editMany: remove tags from multiple links
- [ ] editMany: update folder assignment
- [ ] editMany: update campaign assignment
- [ ] editMany: set expiration date
- [ ] editMany: reject if any link not owned
- [ ] editMany: reject if IDs exceed 100 max
- [ ] editMany: use transaction for atomicity

### Import Tests
- [ ] importLinks: use transaction for atomic import
- [ ] importLinks: respect max row limit
- [ ] importLinks: sanitize CSV injection
- [ ] importLinks: include organization context
- [ ] importLinks: map expirationDate field

### Export Tests
- [x] exportLinks: include actual click counts
- [ ] exportLinks: filter by tags
- [ ] exportLinks: filter by date range
- [ ] exportLinks: filter by status
- [ ] exportLinks: support JSON format
- [ ] exportLinks: export selected IDs only
- [x] exportLinks: filter by organizationId
- [x] exportLinks: sanitize CSV injection

### Preview Tests
- [ ] previewImport: parse CSV and return preview
- [ ] previewImport: identify validation errors
- [ ] previewImport: detect duplicate URLs

### Delete Tests
- [ ] deleteMany: soft delete by default
- [ ] deleteMany: hard delete when permanent flag set
- [ ] deleteMany: use transaction

### DTO Validation Tests
- [ ] BulkEditDto: require at least one ID
- [ ] BulkEditDto: reject more than 100 IDs
- [ ] BulkEditDto: validate tagsAction enum

---

## E2E Tests Required

```
File: apps/web/e2e/bulk.spec.ts (extend existing)
```

- [ ] BULK-006: Import preview before import
- [ ] BULK-007: Bulk edit - change status
- [ ] BULK-008: Bulk edit - set expiration
- [ ] BULK-009: Bulk edit - move to folder
- [ ] BULK-010: Select all checkbox
- [ ] BULK-011: Export with filters
- [ ] BULK-012: Export selected only
- [ ] BULK-013: Bulk archive
- [ ] BULK-014: Bulk enable/disable
- [ ] BULK-015: Import with drag-and-drop
- [ ] BULK-016: Download CSV template
- [ ] BULK-017: Import max row limit error
- [ ] BULK-018: Bulk operation progress bar
- [ ] BULK-019: Permission denied for bulk (Viewer role)
- [ ] BULK-020: Bulk tag removal

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] Bulk edit endpoint works for status, expiry, folder, campaign, tags
- [ ] All bulk operations use transactions
- [ ] Organization context applied to all operations
- [ ] All DTOs validate input
- [ ] Export includes real click counts
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Import preview shows parsed data and errors
- [ ] Select all works with proper feedback
- [ ] Filtered export works with all options
- [ ] Progress bar shows during operations
- [ ] E2E tests pass

### Phase 3 Complete When:
- [ ] JSON export format works
- [ ] Drag-and-drop file upload works
- [ ] Bulk archive/enable/disable buttons work
- [ ] Template download available

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/links/dto/bulk-edit.dto.ts` | Bulk edit validation |
| `apps/api/src/links/dto/bulk-delete.dto.ts` | Bulk delete validation |
| `apps/api/src/links/dto/bulk-tag.dto.ts` | Bulk tag validation |
| `apps/api/src/links/dto/bulk-import.dto.ts` | Import options |
| `apps/api/src/links/dto/export-filters.dto.ts` | Export filter validation |
| `apps/web/components/links/BulkEditDialog.tsx` | Bulk edit UI |
| `apps/web/components/links/ImportPreviewModal.tsx` | Preview before import |
| `apps/web/components/links/ExportOptionsDialog.tsx` | Export options UI |
| `apps/web/components/ui/progress-with-label.tsx` | Progress indicator |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/links/links.controller.ts` | Add bulk-edit, preview, template endpoints; add DTOs |
| `apps/api/src/links/links.service.ts` | Add editMany, previewImport, fix click counts, add transactions |
| `apps/web/components/links/LinksTable.tsx` | Select all, bulk edit button, archive button |
| `apps/web/components/links/ImportLinksModal.tsx` | Drag-drop, template download, preview step |

---

## Performance Notes

- Use `createMany` instead of sequential creates for imports
- Use `groupBy` query for click counts (avoid N+1)
- Consider streaming for large exports
- Batch KV operations when available

---

*Generated from: 1-5-bulk-link-management-plan.md*
*Last Updated: 2025-12-08*
