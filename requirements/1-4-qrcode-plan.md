# QR Code Module Development Plan

## Overview

พัฒนา QR Code module ให้ครบถ้วนตาม [bitly-clone-spec.md](./bitly-clone-spec.md) Section 1.4

---

## Current Implementation Status

### Backend (apps/api/src/qr/) - PARTIALLY COMPLETE

**Files:**

- `qr.module.ts`
- `qr.controller.ts`
- `qr.service.ts`

**Implemented Features:**

| Feature             | Status  | Location                                           |
| ------------------- | ------- | -------------------------------------------------- |
| Basic QR generation | DONE    | `generateQrCode()` - สร้าง QR และ upload ไป R2     |
| Custom colors       | DONE    | `generateCustomQr()` - รับ color/bgcolor           |
| Logo overlay        | DONE    | `generateAdvancedQr()` - รับ logo base64, logoSize |
| SVG format          | DONE    | `generateSvgQr()`                                  |
| Error correction    | PARTIAL | Auto H when logo, else M (ไม่มี UI เลือก)          |
| Margin config       | PARTIAL | Hardcoded margin=2                                 |

**API Endpoints (Implemented):**

| Endpoint       | Method | Auth | Description                  |
| -------------- | ------ | ---- | ---------------------------- |
| `/qr/generate` | POST   | Yes  | สร้าง QR พื้นฐาน + upload R2 |
| `/qr/custom`   | POST   | Yes  | สร้าง QR custom colors       |
| `/qr/advanced` | POST   | Yes  | สร้าง QR + logo + colors     |
| `/qr/preview`  | GET    | No   | Preview QR (no auth)         |
| `/qr/download` | GET    | Yes  | Download PNG/SVG             |

### Frontend (apps/web/) - PARTIALLY COMPLETE

**Implemented Components:**

| Component              | Location             | Features                                                                              |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `QrCodeCustomizer.tsx` | `components/qrcode/` | Full customizer dialog with color presets, logo upload, size slider, PNG/SVG download |
| `QrCodeModal.tsx`      | `components/links/`  | Simple modal with colors only (legacy)                                                |

**Pages with QR Integration:**

| Page                            | QR Features                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| `/dashboard/links/new`          | Inline QR customizer with 8 color presets, logo upload, live preview |
| `/dashboard/links` (LinksTable) | QR Code action in dropdown menu, opens QrCodeModal                   |

**Types (packages/types/src/links.ts):**

```typescript
// CreateLinkDto
qrColor?: string;      // Hex color for QR code foreground
qrLogo?: string;       // Base64 encoded image for logo overlay
generateQrCode?: boolean; // Whether to generate QR code

// LinkResponse
qrCode?: string;       // Data URI
```

### E2E Tests (apps/web/e2e/qr.spec.ts) - BASIC ONLY

**Existing Tests (3 tests):**

- `QR-001`: Generate QR Code (open modal)
- `QR-002`: Customize QR Code (change color)
- `QR-003`: Download QR Code (PNG)

### Database - NOT IMPLEMENTED

- ไม่มี `QrCode` table สำหรับเก็บ config
- QR ถูก generate ใหม่ทุกครั้ง ไม่ได้ persist

---

## Gap Analysis (Remaining Features)

### Backend Gaps

| Feature             | Spec Requirement          | Priority | Effort |
| ------------------- | ------------------------- | -------- | ------ |
| QR Config Storage   | Save QR settings per link | HIGH     | Medium |
| Error Correction UI | L/M/Q/H selection         | MEDIUM   | Low    |
| Border/Quiet Zone   | Configurable margin       | LOW      | Low    |
| PDF Export          | Download as PDF           | MEDIUM   | Medium |
| Batch QR Download   | ZIP with multiple QRs     | HIGH     | High   |
| QR Analytics        | Track QR vs direct clicks | HIGH     | High   |

### Frontend Gaps

| Feature             | Spec Requirement       | Priority | Effort |
| ------------------- | ---------------------- | -------- | ------ |
| Dedicated QR Page   | /dashboard/qr gallery  | MEDIUM   | Medium |
| Error Correction UI | Dropdown in customizer | MEDIUM   | Low    |
| Border Size Control | Slider for margin      | LOW      | Low    |
| PDF Download        | Button in customizer   | MEDIUM   | Low    |
| Batch Download UI   | Select multiple, ZIP   | HIGH     | Medium |
| QR Gallery Grid     | View all saved QRs     | MEDIUM   | Medium |

### Database Gaps

| Table    | Status  | Priority |
| -------- | ------- | -------- |
| `QrCode` | Missing | HIGH     |

---

## Implementation Plan

### Phase 1: Database & Persistence (Priority: HIGH)

#### 1.1 Add QrCode Model to Prisma Schema

```prisma
model QrCode {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  linkId           String   @unique @db.Uuid
  link             Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  foregroundColor  String   @default("#000000")
  backgroundColor  String   @default("#FFFFFF")
  logoUrl          String?  // Stored logo URL in R2
  logoSizePercent  Int      @default(20)
  errorCorrection  String   @default("M") // L, M, Q, H
  borderSize       Int      @default(2)
  size             Int      @default(300)
  qrCodeUrl        String?  // Generated QR image URL in R2
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

// Add relation to Link model
model Link {
  // ... existing fields
  qrCode  QrCode?
}
```

#### 1.2 New API Endpoints

| Endpoint                   | Method | Description                     |
| -------------------------- | ------ | ------------------------------- |
| `/links/:id/qr`            | GET    | Get saved QR config             |
| `/links/:id/qr`            | POST   | Create/Update QR config         |
| `/links/:id/qr/regenerate` | POST   | Regenerate QR with saved config |

### Phase 2: Enhanced Backend Features

#### 2.1 QR Service Enhancements

- [ ] Add `errorCorrectionLevel` parameter (L/M/Q/H)
- [ ] Add `margin` parameter (configurable 0-10)
- [ ] Save QR config to database on creation
- [ ] Upload logo to R2 storage (not base64 in DB)

#### 2.2 PDF Generation

- [ ] Install `pdfkit` dependency
- [ ] Add `generatePdfQr()` method
- [ ] Add PDF format to download endpoint

#### 2.3 Batch Operations

- [ ] Install `archiver` dependency
- [ ] Add `POST /qr/batch-download` endpoint
- [ ] Generate ZIP with multiple QRs

### Phase 3: Analytics Integration

#### 3.1 Track QR Scans

- [ ] Add `source` field to ClickEvent model (enum: DIRECT, QR, API)
- [ ] Update redirector to detect QR scan (via utm_source=qr)
- [ ] Add `/links/:id/analytics/qr` endpoint

### Phase 4: Dashboard UI Enhancements

#### 4.1 Enhanced QR Customizer

- [ ] Add Error Correction dropdown (L/M/Q/H)
- [ ] Add Border Size slider
- [ ] Add PDF download button
- [ ] Auto-save config when customizing

#### 4.2 QR Gallery Page (Optional)

- [ ] Create `/dashboard/qr/page.tsx`
- [ ] Grid view of all links with QRs
- [ ] Batch selection for download

---

## Test Cases

### Unit Tests (Jest) - New Tests Needed

```
QR-UNIT-001: generateAdvancedQr with error correction L works
QR-UNIT-002: generateAdvancedQr with error correction H works
QR-UNIT-003: generateAdvancedQr with margin 0 works
QR-UNIT-004: generateAdvancedQr with margin 10 works
QR-UNIT-005: PDF generation creates valid PDF buffer
QR-UNIT-006: Batch ZIP contains all requested QRs
QR-UNIT-007: QR config saved to database correctly
QR-UNIT-008: Logo uploaded to R2 and URL stored
```

### API Integration Tests - New Tests Needed

```
QR-API-001: GET /links/:id/qr returns saved config
QR-API-002: POST /links/:id/qr saves new config
QR-API-003: POST /links/:id/qr updates existing config
QR-API-004: GET /qr/download?format=pdf returns PDF
QR-API-005: POST /qr/batch-download returns ZIP file
QR-API-006: QR analytics endpoint returns QR scan count
```

### E2E Tests (Playwright) - Expand Existing

```typescript
// File: apps/web/e2e/qr-code.spec.ts

test.describe("QR Code Module", () => {
  // === Existing Tests (Update) ===
  test("QR-E2E-001: Open QR customizer from links table");
  test("QR-E2E-002: Change QR color updates preview");
  test("QR-E2E-003: Download PNG works");

  // === New Tests ===

  // Customizer Options
  test("QR-E2E-010: Color presets work correctly");
  test("QR-E2E-011: Custom foreground color picker");
  test("QR-E2E-012: Custom background color picker");
  test("QR-E2E-013: Upload logo displays in preview");
  test("QR-E2E-014: Remove logo button works");
  test("QR-E2E-015: Logo size slider adjusts preview");
  test("QR-E2E-016: QR size slider works");
  test("QR-E2E-017: Error correction dropdown works");
  test("QR-E2E-018: Border size slider works");

  // Download Formats
  test("QR-E2E-020: Download SVG works");
  test("QR-E2E-021: Download PDF works");
  test("QR-E2E-022: SVG disabled when logo present");

  // Create Link Integration
  test("QR-E2E-030: QR toggle in create link page");
  test("QR-E2E-031: QR color presets in create page");
  test("QR-E2E-032: QR logo upload in create page");
  test("QR-E2E-033: QR preview updates on color change");
  test("QR-E2E-034: Created link shows QR code");

  // Persistence
  test("QR-E2E-040: QR config saved when creating link");
  test("QR-E2E-041: Saved config loads when reopening customizer");

  // Batch Operations (Future)
  test("QR-E2E-050: Batch download button visible");
  test("QR-E2E-051: Select multiple links for batch QR");
  test("QR-E2E-052: Batch download creates ZIP file");

  // Error Handling
  test("QR-E2E-060: Error message for invalid color");
  test("QR-E2E-061: Large logo gets compressed");
  test("QR-E2E-062: Network error shows retry option");
});
```

---

## Implementation Checklist for Agent

### Phase 1: Database & Core API

- [ ] **DB-001**: Add QrCode model to `packages/database/prisma/schema.prisma`
- [ ] **DB-002**: Add qrCode relation to Link model
- [ ] **DB-003**: Run `pnpm --filter @pingtome/database db:generate`
- [ ] **DB-004**: Create migration with `pnpm --filter @pingtome/database db:push`
- [ ] **API-001**: Create `apps/api/src/qr/dto/qr-config.dto.ts`
- [ ] **API-002**: Add `getQrConfig(linkId)` method to QrService
- [ ] **API-003**: Add `saveQrConfig(linkId, dto)` method to QrService
- [ ] **API-004**: Add GET `/links/:id/qr` endpoint to LinksController
- [ ] **API-005**: Add POST `/links/:id/qr` endpoint to LinksController
- [ ] **API-006**: Update `create()` in LinksService to save QR config
- [ ] **TEST-001**: Write unit tests for QrService new methods

### Phase 2: Enhanced QR Features

- [ ] **API-007**: Add `errorCorrectionLevel` param to generateAdvancedQr
- [ ] **API-008**: Add `margin` param to generateAdvancedQr
- [ ] **API-009**: Install pdfkit: `pnpm --filter @pingtome/api add pdfkit`
- [ ] **API-010**: Add `generatePdfQr()` method to QrService
- [ ] **API-011**: Add `format=pdf` option to download endpoint
- [ ] **API-012**: Install archiver: `pnpm --filter @pingtome/api add archiver @types/archiver`
- [ ] **API-013**: Add `POST /qr/batch-download` endpoint
- [ ] **API-014**: Implement batch ZIP generation
- [ ] **TEST-002**: Write tests for PDF generation
- [ ] **TEST-003**: Write tests for batch download

### Phase 3: Frontend Updates

- [ ] **UI-001**: Add error correction dropdown to QrCodeCustomizer
- [ ] **UI-002**: Add border size slider to QrCodeCustomizer
- [ ] **UI-003**: Add PDF download button to QrCodeCustomizer
- [ ] **UI-004**: Update QrCodeCustomizer to save config via API
- [ ] **UI-005**: Update QrCodeCustomizer to load saved config
- [ ] **UI-006**: Add batch download button to LinksTable
- [ ] **UI-007**: (Optional) Create `/dashboard/qr/page.tsx` gallery
- [ ] **TEST-004**: Write E2E tests for new customizer features
- [ ] **TEST-005**: Write E2E tests for batch download

### Phase 4: Analytics Integration

- [ ] **ANALYTICS-001**: Add `source` enum to ClickEvent model
- [ ] **ANALYTICS-002**: Update redirector to detect QR scans
- [ ] **ANALYTICS-003**: Add QR analytics endpoint
- [ ] **UI-008**: Show QR vs Direct in link analytics page
- [ ] **TEST-006**: Write tests for QR analytics

---

## API Specification

### GET /links/:linkId/qr

Get saved QR configuration for a link.

**Response:**

```json
{
  "id": "uuid",
  "linkId": "uuid",
  "foregroundColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "logoUrl": "https://r2.../logo.png",
  "logoSizePercent": 20,
  "errorCorrection": "M",
  "borderSize": 2,
  "size": 300,
  "qrCodeUrl": "https://r2.../qr.png",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### POST /links/:linkId/qr

Create or update QR configuration.

**Request:**

```json
{
  "foregroundColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "logo": "data:image/png;base64,...",
  "logoSizePercent": 20,
  "errorCorrection": "H",
  "borderSize": 2,
  "size": 300
}
```

### GET /qr/download

Download QR code in specified format.

**Query Parameters:**

- `url`: string (required)
- `fg`: string (hex color, default: #000000)
- `bg`: string (hex color, default: #FFFFFF)
- `size`: number (default: 300)
- `format`: png | svg | pdf (default: png)

### POST /qr/batch-download

Download multiple QR codes as ZIP.

**Request:**

```json
{
  "linkIds": ["uuid-1", "uuid-2", "uuid-3"],
  "format": "png",
  "size": 300
}
```

**Response:** ZIP file stream

---

## Dependencies

### Backend (apps/api)

```bash
# Already installed
qrcode
sharp

# To install
pnpm --filter @pingtome/api add pdfkit archiver
pnpm --filter @pingtome/api add -D @types/archiver @types/pdfkit
```

### Frontend (apps/web)

```bash
# No new dependencies needed
```

---

## File Structure

### Existing Files (to update)

```
apps/api/src/qr/
├── qr.module.ts          # No changes needed
├── qr.controller.ts      # Add new endpoints
├── qr.service.ts         # Add new methods

apps/api/src/links/
├── links.controller.ts   # Add /links/:id/qr endpoints
├── links.service.ts      # Update to save QR config

apps/web/components/qrcode/
├── QrCodeCustomizer.tsx  # Add error correction, border, PDF, save

packages/database/prisma/
├── schema.prisma         # Add QrCode model

packages/types/src/
├── links.ts              # Update types
```

### New Files (to create)

```
apps/api/src/qr/
├── dto/
│   ├── qr-config.dto.ts       # QR config DTO with validation
│   └── batch-download.dto.ts  # Batch download DTO

apps/web/app/dashboard/qr/
├── page.tsx                   # (Optional) QR gallery page

apps/web/e2e/
├── qr-code.spec.ts            # Update with new tests
```

---

## Success Criteria

1. All existing tests still passing
2. QR config saved to database on link creation
3. QR config loads when opening customizer
4. Error correction level selectable (L/M/Q/H)
5. Border size configurable
6. PDF download working
7. Batch ZIP download working (optional)
8. QR analytics tracking (optional)

---

## Notes for Agent

1. **Start with Phase 1** - Database และ API foundation ก่อน
2. **ทดสอบทุกขั้นตอน** - รัน `pnpm build` และ `pnpm dev` หลังทุก phase
3. **อย่าลืม Types** - Update `@pingtome/types` เมื่อเพิ่ม fields ใหม่
4. **E2E Tests** - เขียน tests ก่อนหรือหลัง implement ก็ได้
5. **Backward Compatible** - ไม่ break existing functionality

## Quick Start Commands

```bash
# 1. Generate Prisma client after schema change
pnpm --filter @pingtome/database db:generate

# 2. Push schema to database
pnpm --filter @pingtome/database db:push

# 3. Build types package
pnpm --filter @pingtome/types build

# 4. Run dev server
pnpm dev

# 5. Run E2E tests
cd apps/web && npx playwright test e2e/qr-code.spec.ts
```
