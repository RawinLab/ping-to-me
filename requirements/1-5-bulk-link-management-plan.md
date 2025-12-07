# Module 1.5: Bulk Link Management - Development Plan

## Executive Summary

**Module**: 1.5 Bulk Link Management
**Status**: ~60-65% Complete
**Priority**: High
**Complexity**: High

The bulk link management system provides CSV import/export, bulk delete, and bulk tagging. However, critical features like bulk edit, progress tracking, import preview, transaction support, and advanced export filtering are missing.

---

## Current Implementation Analysis

### Backend Status (apps/api/src/links/)

| Feature | Status | Location |
|---------|--------|----------|
| CSV Import | Implemented | links.service.ts:536-603 |
| CSV Export | Implemented | links.service.ts:605-640 |
| Bulk Delete | Implemented | links.service.ts:642-695 |
| Bulk Tag | Implemented | links.service.ts:697-722 |
| Bulk Edit | NOT IMPLEMENTED | - |
| Progress Tracking | NOT IMPLEMENTED | - |
| Transaction Support | NOT IMPLEMENTED | - |
| Import Preview | NOT IMPLEMENTED | - |

### Frontend Status (apps/web/)

| Feature | Status | Location |
|---------|--------|----------|
| Checkbox Selection | Implemented | LinksTable.tsx:418-423 |
| Bulk Actions Toolbar | Implemented | LinksTable.tsx:996-1026 |
| Import Modal | Implemented | ImportLinksModal.tsx |
| Export Button | Implemented | LinksTable.tsx:310-335 |
| Select All | NOT IMPLEMENTED | - |
| Progress Bar | NOT IMPLEMENTED | - |
| Drag-Drop Upload | NOT IMPLEMENTED | - |
| Import Preview | NOT IMPLEMENTED | - |
| Bulk Edit Dialog | NOT IMPLEMENTED | - |

### E2E Test Coverage

| Test ID | Scenario | Status |
|---------|----------|--------|
| BULK-001 | Import Links via CSV | Implemented |
| BULK-002 | Import with Validation Errors | Implemented |
| BULK-003 | Export Links | Implemented |
| BULK-004 | Bulk Delete | Implemented |
| BULK-005 | Bulk Tagging | Implemented |

---

## Gap Analysis & Required Features

### 1. Critical Missing Features

#### 1.1 Bulk Edit Endpoint
**Priority**: P0 (Critical)
```typescript
// Required endpoint: POST /links/bulk-edit
interface BulkEditDto {
  ids: string[];
  updates: {
    status?: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
    expirationDate?: string | null;
    folderId?: string | null;
    campaignId?: string | null;
    tags?: string[];
    tagsAction?: 'add' | 'replace' | 'remove';
  };
}
```

#### 1.2 Transaction Support
**Priority**: P0 (Critical)
- Import operations should use `prisma.$transaction()`
- All-or-nothing semantics for bulk operations
- Rollback on failure

#### 1.3 Import Preview
**Priority**: P1 (High)
```typescript
// Required endpoint: POST /links/import/preview
// Returns parsed data for user review before import
interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: Array<{
    rowNumber: number;
    data: ParsedLinkData;
    errors?: string[];
  }>;
  warnings: string[];
}
```

#### 1.4 Organization Context
**Priority**: P0 (Critical)
- All bulk operations must be organization-scoped
- Currently only user-scoped (multi-tenancy gap)
- 7 TODO comments in controller: `// TODO: Add organizationId to request`

### 2. Important Missing Features

#### 2.1 Advanced Export Options
- Filter by tag, campaign, date range, status
- JSON export format
- Export selected items only
- Click data in export (currently hardcoded to 0)

#### 2.2 Input Validation DTOs
- `BulkDeleteDto` with proper class-validator decorators
- `BulkTagDto` with validation
- `BulkImportOptionsDto` with max rows, dry-run flag
- File upload validation (size, MIME type)

#### 2.3 Progress Tracking
- Background job processing for large imports
- Real-time progress updates
- Cancel operation capability

### 3. Enhancement Features

#### 3.1 UI Improvements
- Select All / Deselect All checkbox
- Drag-and-drop file upload
- Progress bar with percentage
- Bulk archive action
- Bulk enable/disable status

#### 3.2 Template Management
- Downloadable CSV template with examples
- Field mapping UI
- Saved import configurations

---

## Feature Breakdown by Priority

### Priority 0 (Critical) - Must Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| BLK-001 | Bulk Edit Endpoint | Create POST /links/bulk-edit | Bulk Edit Dialog | Unit + E2E |
| BLK-002 | Transaction Support | Add $transaction to import/delete | - | Unit |
| BLK-003 | Organization Context | Add orgId to all bulk operations | Pass orgId in requests | E2E |
| BLK-004 | Input Validation DTOs | Create DTOs with class-validator | - | Unit |
| BLK-005 | Fix Click Count Export | Query ClickEvent.count() | - | Unit |

### Priority 1 (High) - Important

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| BLK-006 | Import Preview | POST /links/import/preview | Preview Modal | E2E |
| BLK-007 | Filtered Export | POST /links/export with filters | Export Options Modal | E2E |
| BLK-008 | Select All | - | Header checkbox | E2E |
| BLK-009 | Bulk Status Change | Extend bulk-edit | Status toggle UI | E2E |
| BLK-010 | Progress Indicators | Job status endpoint | Progress bar component | E2E |

### Priority 2 (Medium) - Nice to Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| BLK-011 | JSON Export | Add format param | Format selector | Unit |
| BLK-012 | Drag-Drop Upload | - | Drop zone component | E2E |
| BLK-013 | Bulk Archive | Extend bulk-edit | Archive button | E2E |
| BLK-014 | Bulk Move Folder | Extend bulk-edit | Folder selector | E2E |
| BLK-015 | CSV Template Download | GET /links/import/template | Template button | - |

### Priority 3 (Low) - Future Enhancement

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| BLK-016 | Background Jobs | BullMQ integration | Job status page | Integration |
| BLK-017 | Scheduled Exports | Cron job + email | Schedule settings | E2E |
| BLK-018 | Expiration Field Import | Add expirationDate mapping | - | Unit |
| BLK-019 | Max Rows Enforcement | Add configurable limit | Warning message | Unit |
| BLK-020 | Retry Failed Imports | Download failures CSV | Retry button | E2E |

---

## Database Schema Updates

### No Schema Changes Required
Current Link model supports all bulk operations.

### Consider Adding (Future)

```prisma
model BulkOperation {
  id            String   @id @default(cuid())
  type          BulkOperationType // IMPORT, EXPORT, DELETE, EDIT
  status        BulkOperationStatus // PENDING, PROCESSING, COMPLETED, FAILED
  userId        String
  organizationId String?
  totalItems    Int
  processedItems Int     @default(0)
  successCount  Int      @default(0)
  failedCount   Int      @default(0)
  errorLog      Json?
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])
  organization  Organization? @relation(fields: [organizationId], references: [id])
}

enum BulkOperationType {
  IMPORT
  EXPORT
  DELETE
  EDIT
}

enum BulkOperationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## API Endpoint Specifications

### Existing Endpoints (Require Updates)

#### POST /links/import
**Current Issues**:
- No transaction support
- No organization context
- No max row limit
- No dry-run mode

**Required Updates**:
```typescript
@Post('import')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv') {
      cb(new BadRequestException('Only CSV files allowed'), false);
    }
    cb(null, true);
  }
}))
async import(
  @Request() req,
  @UploadedFile() file: Express.Multer.File,
  @Query('dryRun') dryRun?: boolean,
  @Query('organizationId') organizationId?: string,
)
```

#### POST /links/bulk-delete
**Required Updates**:
```typescript
// Add DTO with validation
export class BulkDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  @IsBoolean()
  permanent?: boolean; // Default: false (soft delete)
}
```

#### GET /links/export
**Change to POST for filtering**:
```typescript
@Post('export')
async export(
  @Request() req,
  @Body() filters: ExportFiltersDto,
  @Res() res: Response,
) {
  // Filter by tags, campaign, date range, status
  // Support format: csv, json
}

export class ExportFiltersDto {
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  status?: LinkStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedIds?: string[]; // Export specific links only
}
```

### New Endpoints Required

#### POST /links/bulk-edit
```typescript
@Post('bulk-edit')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'link', action: 'bulk' })
async bulkEdit(
  @Request() req,
  @Body() dto: BulkEditDto,
) {
  return this.linksService.editMany(req.user.id, dto);
}

export class BulkEditDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @IsOptional()
  @IsEnum(LinkStatus)
  status?: LinkStatus;

  @IsOptional()
  @IsDateString()
  expirationDate?: string | null;

  @IsOptional()
  @IsString()
  folderId?: string | null;

  @IsOptional()
  @IsString()
  campaignId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['add', 'replace', 'remove'])
  tagsAction?: 'add' | 'replace' | 'remove';
}
```

#### POST /links/import/preview
```typescript
@Post('import/preview')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'link', action: 'bulk' })
@UseInterceptors(FileInterceptor('file'))
async importPreview(
  @UploadedFile() file: Express.Multer.File,
): Promise<ImportPreviewResponse> {
  return this.linksService.previewImport(file.buffer);
}
```

#### GET /links/import/template
```typescript
@Get('import/template')
async downloadTemplate(@Res() res: Response) {
  const template = 'originalUrl,slug,title,description,tags,expirationDate\n' +
    'https://example.com,my-link,Example Link,Description here,"tag1,tag2",2024-12-31\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="import-template.csv"');
  res.send(template);
}
```

---

## Security Considerations

### Current Gaps

1. **CSV Injection Vulnerability**
   - Fields could contain formulas: `=cmd|' !A1`
   - Mitigation: Prefix fields starting with `=`, `+`, `-`, `@` with single quote

2. **File Upload Security**
   - No MIME type validation (fixed in spec above)
   - No file size limit (fixed in spec above)
   - No antivirus scanning (consider for enterprise)

3. **Rate Limiting**
   - Global throttle applies but not bulk-specific
   - Consider: 10 bulk operations per minute per user

4. **Ownership Validation**
   - All links must be owned by user before bulk operations
   - Currently implemented but should use IN query for efficiency

### Recommended Additions

```typescript
// CSV Injection Protection
function sanitizeCsvField(value: string): string {
  const dangerousChars = ['=', '+', '-', '@'];
  if (dangerousChars.some(c => value.startsWith(c))) {
    return `'${value}`;
  }
  return value;
}

// Bulk-specific rate limiting
@Throttle(10, 60) // 10 bulk ops per minute
@Post('bulk-delete')
async bulkDelete(...) { }
```

---

## Unit Test Cases

### BulkEditService Tests

```typescript
// apps/api/src/links/__tests__/links.service.bulk.spec.ts

describe('LinksService - Bulk Operations', () => {
  describe('editMany', () => {
    it('should update status for multiple links', async () => {
      const links = await createTestLinks(3);
      const result = await service.editMany(userId, {
        ids: links.map(l => l.id),
        status: 'DISABLED',
      });
      expect(result.count).toBe(3);
      // Verify all links are disabled
    });

    it('should add tags to multiple links', async () => {
      const links = await createTestLinks(2);
      await service.editMany(userId, {
        ids: links.map(l => l.id),
        tags: ['new-tag'],
        tagsAction: 'add',
      });
      // Verify tags are added without removing existing
    });

    it('should replace tags on multiple links', async () => {
      // tagsAction: 'replace' should overwrite existing tags
    });

    it('should remove tags from multiple links', async () => {
      // tagsAction: 'remove' should only remove specified tags
    });

    it('should update folder assignment', async () => {
      // Move links to different folder
    });

    it('should update campaign assignment', async () => {
      // Assign links to campaign
    });

    it('should set expiration date', async () => {
      // Set expiration for multiple links
    });

    it('should reject if any link not owned by user', async () => {
      // Ownership validation
    });

    it('should reject if IDs exceed maximum', async () => {
      // Max 100 links per operation
    });

    it('should use transaction for atomicity', async () => {
      // All-or-nothing updates
    });
  });

  describe('importLinks', () => {
    it('should use transaction for atomic import', async () => {
      // Rollback on failure
    });

    it('should respect max row limit', async () => {
      // Reject files exceeding limit
    });

    it('should sanitize CSV injection attempts', async () => {
      // Fields starting with = should be escaped
    });

    it('should include organization context', async () => {
      // Links associated with organization
    });

    it('should map expirationDate field', async () => {
      // Currently not mapped
    });
  });

  describe('exportLinks', () => {
    it('should include actual click counts', async () => {
      // Currently hardcoded to 0
    });

    it('should filter by tags', async () => {
      // Export only matching tags
    });

    it('should filter by date range', async () => {
      // Export links created within range
    });

    it('should filter by status', async () => {
      // Export only active/disabled/etc
    });

    it('should support JSON format', async () => {
      // Export as JSON array
    });

    it('should export selected IDs only', async () => {
      // Export specific links
    });
  });

  describe('previewImport', () => {
    it('should parse CSV and return preview', async () => {
      const result = await service.previewImport(csvBuffer);
      expect(result.totalRows).toBe(10);
      expect(result.preview.length).toBeLessThanOrEqual(5);
    });

    it('should identify validation errors', async () => {
      // Invalid URLs marked in preview
    });

    it('should detect duplicate URLs', async () => {
      // Warn about duplicates
    });
  });

  describe('deleteMany', () => {
    it('should soft delete by default', async () => {
      // permanent: false = archive
    });

    it('should hard delete when permanent flag set', async () => {
      // permanent: true = delete
    });

    it('should use transaction', async () => {
      // Atomicity
    });
  });
});
```

### DTO Validation Tests

```typescript
describe('BulkEditDto Validation', () => {
  it('should require at least one ID', async () => {
    const dto = plainToInstance(BulkEditDto, { ids: [] });
    const errors = await validate(dto);
    expect(errors).toContainValidationError('ids', 'arrayMinSize');
  });

  it('should reject more than 100 IDs', async () => {
    const dto = plainToInstance(BulkEditDto, { ids: Array(101).fill('id') });
    const errors = await validate(dto);
    expect(errors).toContainValidationError('ids', 'arrayMaxSize');
  });

  it('should validate tagsAction enum', async () => {
    const dto = plainToInstance(BulkEditDto, {
      ids: ['id1'],
      tagsAction: 'invalid'
    });
    const errors = await validate(dto);
    expect(errors).toContainValidationError('tagsAction', 'isEnum');
  });
});
```

---

## E2E Test Cases

### New Test Scenarios

```typescript
// apps/web/e2e/bulk.spec.ts

test.describe('Bulk Link Management', () => {
  // Existing tests: BULK-001 to BULK-005

  test('BULK-006: Import Preview before import', async ({ page }) => {
    // 1. Click Import button
    // 2. Upload CSV file
    // 3. Click "Preview" button
    // 4. Verify preview modal shows parsed data
    // 5. Verify validation errors highlighted
    // 6. Click "Import" to proceed
    // 7. Verify success message
  });

  test('BULK-007: Bulk Edit - Change status', async ({ page }) => {
    // 1. Select 2 links
    // 2. Click "Edit" button in toolbar
    // 3. Select "Disabled" status
    // 4. Click "Apply"
    // 5. Verify links show disabled status
  });

  test('BULK-008: Bulk Edit - Set expiration', async ({ page }) => {
    // 1. Select links
    // 2. Open bulk edit dialog
    // 3. Set expiration date
    // 4. Apply changes
    // 5. Verify expiration shown on links
  });

  test('BULK-009: Bulk Edit - Move to folder', async ({ page }) => {
    // 1. Select links
    // 2. Open bulk edit dialog
    // 3. Select folder
    // 4. Apply changes
    // 5. Navigate to folder, verify links present
  });

  test('BULK-010: Select All checkbox', async ({ page }) => {
    // 1. Click header checkbox
    // 2. Verify all visible links selected
    // 3. Verify selection count matches
    // 4. Click again to deselect all
    // 5. Verify none selected
  });

  test('BULK-011: Export with filters', async ({ page }) => {
    // 1. Apply tag filter
    // 2. Click Export
    // 3. Verify export options dialog
    // 4. Select "Export filtered only"
    // 5. Download and verify content
  });

  test('BULK-012: Export selected only', async ({ page }) => {
    // 1. Select 2 specific links
    // 2. Click Export
    // 3. Select "Export selected only"
    // 4. Verify only 2 links in export
  });

  test('BULK-013: Bulk Archive', async ({ page }) => {
    // 1. Select links
    // 2. Click Archive button
    // 3. Confirm dialog
    // 4. Verify links moved to archived status
    // 5. Verify can restore from archive
  });

  test('BULK-014: Bulk Enable/Disable', async ({ page }) => {
    // 1. Select active links
    // 2. Click "Disable" in bulk actions
    // 3. Verify links show disabled badge
    // 4. Select disabled links
    // 5. Click "Enable"
    // 6. Verify links active again
  });

  test('BULK-015: Import with drag-and-drop', async ({ page }) => {
    // 1. Open import modal
    // 2. Drag file onto drop zone
    // 3. Verify file accepted
    // 4. Complete import
  });

  test('BULK-016: Download CSV template', async ({ page }) => {
    // 1. Open import modal
    // 2. Click "Download Template"
    // 3. Verify CSV downloaded with headers
  });

  test('BULK-017: Import max row limit', async ({ page }) => {
    // 1. Upload CSV with > max rows
    // 2. Verify error message about limit
    // 3. Suggest splitting file
  });

  test('BULK-018: Bulk operation progress', async ({ page }) => {
    // 1. Start large import (mock slow response)
    // 2. Verify progress bar visible
    // 3. Verify percentage updates
    // 4. Verify completion message
  });

  test('BULK-019: Permission denied for bulk operations', async ({ page }) => {
    // Login as Viewer role
    // 1. Verify checkboxes not visible
    // 2. Verify bulk actions toolbar not available
    // 3. Verify Import button hidden/disabled
  });

  test('BULK-020: Bulk tag removal', async ({ page }) => {
    // 1. Select links with tags
    // 2. Open bulk edit
    // 3. Select "Remove tags" action
    // 4. Select tags to remove
    // 5. Verify tags removed
  });
});
```

---

## Frontend Component Specifications

### New Components Required

#### 1. BulkEditDialog
```tsx
// components/links/BulkEditDialog.tsx
interface BulkEditDialogProps {
  selectedIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

// Features:
// - Status dropdown (Active, Disabled, Archived)
// - Expiration date picker
// - Folder selector
// - Campaign selector
// - Tags multi-select with action (add/replace/remove)
// - Apply button with loading state
// - Preview of changes
```

#### 2. ImportPreviewModal
```tsx
// components/links/ImportPreviewModal.tsx
interface ImportPreviewModalProps {
  file: File;
  onConfirm: () => void;
  onCancel: () => void;
}

// Features:
// - Table showing first 10 rows
// - Error highlighting for invalid rows
// - Warning for duplicates
// - Summary: X valid, Y invalid
// - Confirm/Cancel buttons
```

#### 3. ExportOptionsDialog
```tsx
// components/links/ExportOptionsDialog.tsx
interface ExportOptionsDialogProps {
  selectedIds?: string[];
  activeFilters?: FilterState;
  onExport: (options: ExportOptions) => void;
}

// Features:
// - Scope: All / Filtered / Selected
// - Format: CSV / JSON
// - Date range filter
// - Additional field selection
// - Export button
```

#### 4. ProgressBar Component
```tsx
// components/ui/progress-with-label.tsx
interface ProgressWithLabelProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
}

// Features:
// - Visual progress bar
// - "X of Y" label
// - Percentage display
// - Cancel button (optional)
```

### UI Updates Required

#### LinksTable.tsx Updates
1. Add "Select All" checkbox in header row
2. Add "Edit" button to bulk actions toolbar
3. Add "Archive" button to bulk actions toolbar
4. Add progress bar component for bulk operations
5. Add visual feedback during bulk operations

#### ImportLinksModal.tsx Updates
1. Add drag-and-drop zone
2. Add template download button
3. Add preview step before import
4. Add progress bar during import
5. Improve error display with row numbers

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. Add transaction support to import/delete operations
2. Add organization context to all bulk operations
3. Create validation DTOs for bulk endpoints
4. Fix click count in export (query actual counts)

### Phase 2: Core Features (Week 2)
1. Implement bulk edit endpoint and service
2. Create BulkEditDialog component
3. Add Select All checkbox
4. Implement import preview endpoint

### Phase 3: Enhanced Export (Week 3)
1. Convert export to POST with filters
2. Add JSON export format
3. Add "Export selected only" option
4. Create ExportOptionsDialog

### Phase 4: UX Improvements (Week 4)
1. Add progress bar component
2. Implement drag-and-drop upload
3. Add template download
4. Add bulk archive/enable/disable buttons

### Phase 5: Testing & Polish (Week 5)
1. Write unit tests for all new features
2. Write E2E tests for all scenarios
3. Security audit (CSV injection, validation)
4. Performance testing with large datasets

---

## Performance Considerations

### Current Issues

1. **Sequential Import Processing**
   - Each CSV row calls `create()` sequentially
   - No parallelization
   - Solution: Batch inserts with `createMany()`

2. **KV Synchronization**
   - Bulk delete iterates each KV key
   - Solution: Batch KV API when available

3. **Click Count Export**
   - Currently hardcoded to 0
   - Risk: N+1 queries if counting per link
   - Solution: Use aggregate query or cache counts

4. **Memory for Large Exports**
   - Entire file buffered in memory
   - Solution: Streaming response for large exports

### Optimization Recommendations

```typescript
// Batch create for imports
await prisma.link.createMany({
  data: validRecords,
  skipDuplicates: true,
});

// Efficient click counts
const clickCounts = await prisma.clickEvent.groupBy({
  by: ['linkId'],
  where: { linkId: { in: linkIds } },
  _count: { id: true },
});

// Streaming export for large datasets
const stream = new Readable();
for await (const batch of getBatchedLinks()) {
  stream.push(formatCsv(batch));
}
res.pipe(stream);
```

---

## Competitor Feature Comparison

| Feature | PingTO.Me | Bitly | Rebrandly | Short.io |
|---------|-----------|-------|-----------|----------|
| CSV Import | Yes | Yes | Yes | Yes |
| Excel Import | No | Yes | Yes | Yes |
| Import Preview | No | Yes | Yes | Yes |
| Max Rows | None | 100K | 400K | 100K |
| Bulk Edit | No | Yes | Yes | Yes |
| Bulk Delete | Yes | Yes | Yes | Yes |
| Bulk Archive | No | Yes | Yes | Yes |
| CSV Export | Yes | Yes | Yes | Yes |
| JSON Export | No | Yes | Yes | Yes |
| Filtered Export | No | Yes | Yes | Yes |
| UTM Bulk Edit | No | Yes | Yes | Yes |
| Progress Tracking | No | Yes | Yes | Yes |
| Background Jobs | No | Yes | Yes | Yes |

---

## Summary

Module 1.5 Bulk Link Management is approximately 60-65% complete. The core import, export, delete, and tag operations work, but lack transaction support, organization context, and proper validation. Critical features like bulk edit, import preview, and filtered export are missing entirely.

**Immediate Priorities**:
1. Add transaction support for data integrity
2. Fix organization context for multi-tenancy
3. Implement bulk edit endpoint
4. Add proper input validation DTOs
5. Fix click count export

**Next Steps**:
1. Import preview for user verification
2. Advanced export filtering
3. UI improvements (Select All, progress bar)
4. Comprehensive test coverage
