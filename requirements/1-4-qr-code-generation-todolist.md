# Module 1.4: QR Code Generation - Development Todolist

> **Status**: 100% Complete (All Optional Enhancements Done)
> **Priority**: Low - All features implemented
> **Reference**: `requirements/1-4-qr-code-generation-plan.md`

---

## Phase 1: Security Hardening (HIGH PRIORITY) ✅ COMPLETE

### Task 1.4.1: Rate Limiting on QR Endpoints ✅
- [x] **Add rate limiting to generate endpoint**
  - File: `apps/api/src/qr/qr.controller.ts`
  - Add: `@Throttle({ default: { limit: 30, ttl: 60000 } })` to POST /qr/generate
  - 30 requests per minute

- [x] **Add rate limiting to advanced endpoint**
  - Add: `@Throttle({ default: { limit: 20, ttl: 60000 } })` to POST /qr/advanced
  - 20 requests per minute

- [x] **Add rate limiting to batch download**
  - Add: `@Throttle({ default: { limit: 5, ttl: 60000 } })` to POST /qr/batch-download
  - 5 requests per minute

### Task 1.4.2: SSRF Protection for Logo URLs ✅
- [x] **Create validateLogoUrl method**
  - File: `apps/api/src/qr/qr.service.ts`
  - Checks:
    - Only allow HTTPS protocol
    - Resolve DNS and check for private IPs
    - Blocklist localhost, 127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  - Optional: Allowlist specific CDN domains

- [x] **Add isPrivateIP helper**
  - Check for private IP ranges
  - Return true for internal/private IPs

- [x] **Apply validation before logo fetch**
  - Call validateLogoUrl before fetching external logo
  - Throw BadRequestException for invalid URLs

### Task 1.4.3: Batch Size Limit ✅
- [x] **Update BatchDownloadDto**
  - File: `apps/api/src/qr/dto/batch-download.dto.ts`
  - Add: `@ArrayMaxSize(100, { message: 'Maximum 100 QR codes per batch' })`
  - Add: `@IsUUID('4', { each: true })`

- [x] **Add validation in service**
  - File: `apps/api/src/qr/qr.service.ts`
  - Check: `if (dto.linkIds.length > 100) throw BadRequestException`

---

## Phase 2: Batch Download UI ✅ COMPLETE

### Task 1.4.4: Batch Selection in QR Gallery ✅
- [x] **Add selection mode toggle**
  - File: `apps/web/app/dashboard/qr-codes/page.tsx`
  - State: `selectMode`, `selectedLinks[]`
  - Toggle button to enable/disable selection

- [x] **Add checkboxes to QR cards**
  - Show checkbox when selectMode is true
  - Track selected link IDs

- [x] **Add batch action toolbar**
  - Show when items selected
  - Display: selected count, format selector, download button, clear button

### Task 1.4.5: Format Selector & Download ✅
- [x] **Add format dropdown**
  - Options: PNG, SVG, PDF
  - Default: PNG

- [x] **Implement batch download handler**
  - Call `POST /qr/batch-download` with selected IDs and format
  - Download returned ZIP file
  - Show progress indicator

### Task 1.4.6: Batch Selection in Links Table ✅
- [x] **Add batch QR download to links table** (Optional Enhancement)
  - File: `apps/web/components/links/LinksTable.tsx`
  - Add "Download QR Codes" to bulk actions dropdown
  - Reuse batch download logic

---

## Phase 3: QR Analytics Enhancement ✅ COMPLETE

### Task 1.4.7: QR Scan Summary Endpoint ✅
- [x] **Create QR summary endpoint**
  - Endpoint: `GET /analytics/qr-summary`
  - File: `apps/api/src/analytics/analytics.controller.ts`
  - Return:
    - totalClicks: number
    - qrClicks: number (where source = 'QR')
    - qrPercentage: number
    - directClicks: number

- [x] **Implement getQrSummary in AnalyticsService**
  - File: `apps/api/src/analytics/analytics.service.ts`
  - Query clickEvents grouped by source
  - Calculate percentages

### Task 1.4.8: Stats Cards in QR Gallery ✅
- [x] **Add stats cards to QR gallery header**
  - File: `apps/web/app/dashboard/qr-codes/page.tsx`
  - Cards: Total Links, QR Scans, Scan Rate %, Customized QRs

- [x] **Fetch and display analytics** (Already existed)
  - Call qr-summary endpoint
  - Display in stats cards

### Task 1.4.9: QR vs Direct Comparison Chart ✅
- [x] **Add comparison visualization** (Optional Enhancement)
  - Show pie/bar chart of QR vs Direct clicks
  - Use existing charting library (Recharts)

---

## Phase 4: User Experience Enhancements ✅ PARTIAL

### Task 1.4.10: QR Templates (Future)
- [ ] **Add QrTemplate model to schema**
  - File: `packages/database/prisma/schema.prisma`
  - Fields: name, foregroundColor, backgroundColor, logoUrl, logoSizePercent, errorCorrection, borderSize, isDefault

- [ ] **Create template CRUD endpoints**
  - POST `/qr/templates` - Create template
  - GET `/qr/templates` - List templates
  - DELETE `/qr/templates/:id` - Delete template

- [ ] **Add template selector to customizer**
  - Dropdown to select saved template
  - "Save as Template" button

### Task 1.4.11: Auto-Save Configuration ✅
- [x] **Implement debounced auto-save**
  - File: `apps/web/components/qrcode/QrCodeCustomizer.tsx`
  - Debounce: 1500ms after last change
  - Show "Saved" indicator with status (idle/saving/saved)
  - Only save if linkId exists and changes detected

---

## Unit Tests Required

### QR Service Security Tests ✅
```
File: apps/api/src/qr/__tests__/qr.service.spec.ts
```
- [x] validateLogoUrl: reject non-HTTPS URLs
- [x] validateLogoUrl: reject URLs resolving to private IPs
- [x] validateLogoUrl: reject localhost URLs
- [x] validateLogoUrl: allow valid external HTTPS URLs
- [x] batchGenerateQr: reject batch size over 100
- [x] batchGenerateQr: generate ZIP with correct structure
- [x] batchGenerateQr: handle mixed formats

### Rate Limiting Tests
- [ ] Verify rate limits on generate endpoint (Optional - Manual Testing)
- [ ] Verify rate limits on batch endpoint (Optional - Manual Testing)
- [ ] Verify error response when rate limited (Optional - Manual Testing)

---

## E2E Tests Required

```
File: apps/web/e2e/qr-batch.spec.ts
```

### Batch Download Tests (Optional)
- [ ] QRB-001: Enable batch selection mode
- [ ] QRB-002: Select multiple QR codes
- [ ] QRB-003: Download batch as ZIP
- [ ] QRB-004: Show download progress
- [ ] QRB-005: Respect batch size limit (100 max)

### Analytics Tests (Optional)
- [ ] QRA-001: Display QR scan statistics
- [ ] QRA-002: Show QR vs Direct comparison

---

## Acceptance Criteria

### Phase 1 Complete When: ✅
- [x] Rate limiting active on all QR endpoints
- [x] SSRF protection blocks private IPs
- [x] Batch limited to 100 QR codes
- [x] Unit tests pass (39 tests passing)

### Phase 2 Complete When: ✅
- [x] Batch selection works in QR gallery
- [x] Format selector allows PNG/SVG/PDF
- [x] ZIP download works correctly
- [ ] E2E tests pass (Optional)

### Phase 3 Complete When: ✅
- [x] QR summary endpoint returns stats
- [x] Stats cards display in gallery
- [x] Comparison chart visible (Optional Enhancement)

---

## Files to Create/Modify Summary

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/qr/qr.controller.ts` | Add rate limiting decorators |
| `apps/api/src/qr/qr.service.ts` | Add SSRF protection, batch validation |
| `apps/api/src/qr/dto/batch-download.dto.ts` | Add ArrayMaxSize, IsUUID validators |
| `apps/api/src/analytics/analytics.controller.ts` | Add qr-summary endpoint |
| `apps/api/src/analytics/analytics.service.ts` | Add getQrSummary method |
| `apps/web/app/dashboard/qr-codes/page.tsx` | Add batch selection, stats cards |
| `apps/web/components/qrcode/QrCodeCustomizer.tsx` | Add auto-save (optional) |

### Future New Files (Phase 4)
| File | Purpose |
|------|---------|
| `apps/api/src/qr/dto/create-template.dto.ts` | Template creation validation |
| `apps/api/src/qr/qr-templates.controller.ts` | Template CRUD endpoints |

---

## Security Notes

- **CRITICAL**: Implement SSRF protection before allowing external logo URLs
- Rate limit all generation endpoints to prevent abuse
- Validate batch size to prevent resource exhaustion
- Log rate limit violations for monitoring

---

## Competitor Comparison

| Feature | Bitly | Rebrandly | PingTO.Me |
|---------|-------|-----------|-----------|
| Color Customization | Yes | Yes | Yes |
| Logo Overlay | Paid | Paid | All plans |
| Multiple Formats | PNG only | PNG/SVG | PNG/SVG/PDF |
| Batch Download | No | Yes | Yes |
| QR Templates | No | Yes | Planned |
| Error Correction | No | No | Yes |
| Live Preview | Yes | Yes | Yes |

---

*Generated from: 1-4-qr-code-generation-plan.md*
*Last Updated: 2025-12-08*
