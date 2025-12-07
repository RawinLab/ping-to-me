# QR Code Module - Implementation Todolist

> สำหรับ Claude Code Agent ใช้ในการพัฒนา QR Code module ต่อจาก implementation ที่มีอยู่
>
> **Reference**: [1-4-qrcode-plan.md](./1-4-qrcode-plan.md)

---

## Pre-Implementation Checklist

ก่อนเริ่มงาน ให้ตรวจสอบ:

- [x] อ่าน [1-4-qrcode-plan.md](./1-4-qrcode-plan.md) เพื่อเข้าใจ context
- [x] รัน `pnpm dev` และตรวจสอบว่า server ทำงานปกติ
- [x] รัน `pnpm build` เพื่อตรวจสอบว่าไม่มี error

---

## Phase 1: Database & Persistence ✅ COMPLETED

**Priority: HIGH** | **Estimated: 2-3 hours**

### 1.1 Database Schema

- [x] **TASK-001**: เพิ่ม QrCode model ใน `packages/database/prisma/schema.prisma`

  ```prisma
  model QrCode {
    id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    linkId           String   @unique @db.Uuid
    link             Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
    foregroundColor  String   @default("#000000")
    backgroundColor  String   @default("#FFFFFF")
    logoUrl          String?
    logoSizePercent  Int      @default(20)
    errorCorrection  String   @default("M")
    borderSize       Int      @default(2)
    size             Int      @default(300)
    qrCodeUrl        String?
    createdAt        DateTime @default(now())
    updatedAt        DateTime @updatedAt
  }
  ```

- [x] **TASK-002**: เพิ่ม relation ใน Link model

  ```prisma
  model Link {
    // ... existing fields
    qrCode  QrCode?
  }
  ```

- [x] **TASK-003**: Generate Prisma client

  ```bash
  pnpm --filter @pingtome/database db:generate
  ```

- [x] **TASK-004**: Push schema to database
  ```bash
  pnpm --filter @pingtome/database db:push
  ```

### 1.2 Types Package

- [x] **TASK-005**: เพิ่ม QR types ใน `packages/types/src/qr.ts`

  ```typescript
  export interface QrCodeConfig {
    id: string;
    linkId: string;
    foregroundColor: string;
    backgroundColor: string;
    logoUrl?: string;
    logoSizePercent: number;
    errorCorrection: "L" | "M" | "Q" | "H";
    borderSize: number;
    size: number;
    qrCodeUrl?: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface CreateQrConfigDto {
    foregroundColor?: string;
    backgroundColor?: string;
    logo?: string; // base64
    logoSizePercent?: number;
    errorCorrection?: "L" | "M" | "Q" | "H";
    borderSize?: number;
    size?: number;
  }

  export interface BatchDownloadDto {
    linkIds: string[];
    format?: "png" | "svg" | "pdf";
    size?: number;
  }
  ```

- [x] **TASK-006**: Export จาก `packages/types/src/index.ts`

  ```typescript
  export * from "./qr";
  ```

- [x] **TASK-007**: Build types package
  ```bash
  pnpm --filter @pingtome/types build
  ```

### 1.3 Backend API - QR Config Endpoints

- [x] **TASK-008**: สร้าง `apps/api/src/qr/dto/qr-config.dto.ts`

  ```typescript
  import {
    IsString,
    IsOptional,
    IsNumber,
    IsIn,
    Min,
    Max,
    Matches,
  } from "class-validator";

  export class CreateQrConfigDto {
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    foregroundColor?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    backgroundColor?: string;

    @IsOptional()
    @IsString()
    logo?: string;

    @IsOptional()
    @IsNumber()
    @Min(10)
    @Max(30)
    logoSizePercent?: number;

    @IsOptional()
    @IsIn(["L", "M", "Q", "H"])
    errorCorrection?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10)
    borderSize?: number;

    @IsOptional()
    @IsNumber()
    @Min(100)
    @Max(1000)
    size?: number;
  }
  ```

- [x] **TASK-009**: เพิ่ม methods ใน `apps/api/src/qr/qr.service.ts`

  ```typescript
  // เพิ่ม methods:
  async getQrConfig(linkId: string): Promise<QrCodeConfig | null>
  async saveQrConfig(linkId: string, dto: CreateQrConfigDto): Promise<QrCodeConfig>
  async uploadLogoToR2(base64: string, linkId: string): Promise<string>
  ```

- [x] **TASK-010**: เพิ่ม endpoints ใน `apps/api/src/links/links.controller.ts`

  ```typescript
  @Get(':id/qr')
  @UseGuards(AuthGuard)
  async getQrConfig(@Param('id') id: string)

  @Post(':id/qr')
  @UseGuards(AuthGuard)
  async saveQrConfig(@Param('id') id: string, @Body() dto: CreateQrConfigDto)
  ```

- [x] **TASK-011**: Update `apps/api/src/links/links.service.ts` - save QR config on link creation
  > Note: QR config is saved via dedicated endpoint, not on link creation

### 1.4 Verification

- [x] **VERIFY-001**: รัน `pnpm build` - ไม่มี error
- [x] **VERIFY-002**: รัน `pnpm dev` - server ทำงานปกติ
- [x] **VERIFY-003**: ทดสอบ API ด้วย curl หรือ Postman

  ```bash
  # Get QR config
  curl -H "Authorization: Bearer TOKEN" http://localhost:3001/links/LINK_ID/qr

  # Save QR config
  curl -X POST -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"foregroundColor":"#FF0000"}' \
    http://localhost:3001/links/LINK_ID/qr
  ```

---

## Phase 2: Enhanced Backend Features ✅ COMPLETED

**Priority: MEDIUM** | **Estimated: 3-4 hours**

### 2.1 Error Correction & Margin

- [x] **TASK-012**: Update `generateAdvancedQr()` ใน `qr.service.ts`
  - เพิ่ม `errorCorrectionLevel` parameter รับค่า L/M/Q/H
  - เพิ่ม `margin` parameter รับค่า 0-10

  ```typescript
  async generateAdvancedQr(options: {
    url: string;
    foregroundColor?: string;
    backgroundColor?: string;
    logo?: string;
    logoSize?: number;
    size?: number;
    margin?: number;           // NEW
    errorCorrection?: string;  // NEW: L, M, Q, H
  }): Promise<{ dataUrl: string }>
  ```

### 2.2 PDF Generation

- [x] **TASK-013**: Install pdfkit

  ```bash
  pnpm --filter @pingtome/api add pdfkit
  pnpm --filter @pingtome/api add -D @types/pdfkit
  ```

- [x] **TASK-014**: เพิ่ม `generatePdfQr()` method ใน `qr.service.ts`

  ```typescript
  async generatePdfQr(options: {
    url: string;
    foregroundColor?: string;
    backgroundColor?: string;
    size?: number;
    title?: string;
  }): Promise<Buffer>
  ```

- [x] **TASK-015**: Update download endpoint รองรับ `format=pdf`

  ```typescript
  @Get('download')
  async download(
    @Query('format') format: 'png' | 'svg' | 'pdf',
    // ... other params
  )
  ```

### 2.3 Batch Download

- [x] **TASK-016**: Install archiver

  ```bash
  pnpm --filter @pingtome/api add archiver
  pnpm --filter @pingtome/api add -D @types/archiver
  ```

- [x] **TASK-017**: สร้าง `apps/api/src/qr/dto/batch-download.dto.ts`

  ```typescript
  import {
    IsArray,
    IsString,
    IsOptional,
    IsIn,
    IsNumber,
  } from "class-validator";

  export class BatchDownloadDto {
    @IsArray()
    @IsString({ each: true })
    linkIds: string[];

    @IsOptional()
    @IsIn(["png", "svg", "pdf"])
    format?: string;

    @IsOptional()
    @IsNumber()
    size?: number;
  }
  ```

- [x] **TASK-018**: เพิ่ม `batchGenerateQr()` method ใน `qr.service.ts`

  ```typescript
  async batchGenerateQr(linkIds: string[], format: string, size: number): Promise<Buffer>
  // Returns ZIP file buffer
  ```

- [x] **TASK-019**: เพิ่ม endpoint `POST /qr/batch-download`

  ```typescript
  @Post('batch-download')
  @UseGuards(AuthGuard)
  async batchDownload(@Body() dto: BatchDownloadDto, @Res() res: Response)
  ```

### 2.4 Verification

- [x] **VERIFY-004**: ทดสอบ error correction ด้วยค่า L, M, Q, H
- [x] **VERIFY-005**: ทดสอบ margin 0-10
- [x] **VERIFY-006**: ทดสอบ PDF download
- [x] **VERIFY-007**: ทดสอบ batch download ZIP

---

## Phase 3: Frontend Updates ✅ COMPLETED

**Priority: MEDIUM** | **Estimated: 2-3 hours**

### 3.1 Update QrCodeCustomizer Component

**File**: `apps/web/components/qrcode/QrCodeCustomizer.tsx`

- [x] **TASK-020**: เพิ่ม Error Correction dropdown

  ```tsx
  const ERROR_CORRECTIONS = [
    { value: "L", label: "Low (7%)", description: "ทนทานต่อความเสียหายต่ำ" },
    { value: "M", label: "Medium (15%)", description: "ทนทานปานกลาง (แนะนำ)" },
    { value: "Q", label: "Quartile (25%)", description: "ทนทานสูง" },
    {
      value: "H",
      label: "High (30%)",
      description: "ทนทานสูงสุด (ใช้กับ logo)",
    },
  ];

  // Add state
  const [errorCorrection, setErrorCorrection] = useState<string>("M");

  // Add Select component
  <Select value={errorCorrection} onValueChange={setErrorCorrection}>
    <SelectTrigger>
      <SelectValue placeholder="Error Correction" />
    </SelectTrigger>
    <SelectContent>
      {ERROR_CORRECTIONS.map((ec) => (
        <SelectItem key={ec.value} value={ec.value}>
          {ec.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>;
  ```

- [x] **TASK-021**: เพิ่ม Border Size slider

  ```tsx
  const [borderSize, setBorderSize] = useState(2);

  <div className="space-y-2">
    <Label>Border Size: {borderSize}</Label>
    <input
      type="range"
      min="0"
      max="10"
      value={borderSize}
      onChange={(e) => setBorderSize(parseInt(e.target.value))}
      className="w-full"
    />
  </div>;
  ```

- [x] **TASK-022**: เพิ่ม PDF download button

  ```tsx
  <Button
    variant="outline"
    onClick={() => downloadQrCode("pdf")}
    disabled={!qrCode}
  >
    PDF
  </Button>
  ```

- [x] **TASK-023**: เพิ่ม logic สำหรับ save/load config

  ```tsx
  // Load saved config when modal opens
  useEffect(() => {
    if (open && linkId) {
      loadSavedConfig(linkId);
    }
  }, [open, linkId]);

  const loadSavedConfig = async (linkId: string) => {
    try {
      const config = await apiRequest(`/links/${linkId}/qr`);
      if (config) {
        setForegroundColor(config.foregroundColor);
        setBackgroundColor(config.backgroundColor);
        setErrorCorrection(config.errorCorrection);
        setBorderSize(config.borderSize);
        setSize(config.size);
        // etc.
      }
    } catch (err) {
      // No saved config, use defaults
    }
  };

  const saveConfig = async () => {
    await apiRequest(`/links/${linkId}/qr`, {
      method: "POST",
      body: JSON.stringify({
        foregroundColor,
        backgroundColor,
        errorCorrection,
        borderSize,
        size,
        logo: logo || undefined,
      }),
    });
  };
  ```

### 3.2 Props Update

- [x] **TASK-024**: เพิ่ม `linkId` prop ให้ QrCodeCustomizer

  ```tsx
  interface QrCodeCustomizerProps {
    url: string;
    linkId?: string; // NEW: for saving config
    initialQrCode?: string;
    trigger?: React.ReactNode;
  }
  ```

### 3.3 LinksTable Integration

**File**: `apps/web/components/links/LinksTable.tsx`

- [x] **TASK-025**: อัพเดต QrCodeModal ให้ใช้ QrCodeCustomizer พร้อม linkId

- [ ] **TASK-026**: (Optional) เพิ่ม Batch Download button

  > Note: Batch download is available via API, frontend integration deferred

  ```tsx
  // In toolbar when links are selected
  {
    selectedLinks.length > 0 && (
      <Button onClick={handleBatchDownloadQr}>
        <Download className="mr-2 h-4 w-4" />
        Download {selectedLinks.length} QR Codes
      </Button>
    );
  }
  ```

### 3.4 Verification

- [x] **VERIFY-008**: เปิด QR customizer และทดสอบ error correction dropdown
- [x] **VERIFY-009**: ทดสอบ border size slider
- [x] **VERIFY-010**: ทดสอบ PDF download
- [x] **VERIFY-011**: ทดสอบ save config และ reload

---

## Phase 4: Analytics Integration ✅ COMPLETED

**Priority: LOW** | **Estimated: 2-3 hours**

### 4.1 Database Update

- [x] **TASK-027**: เพิ่ม `source` field ใน ClickEvent model

  ```prisma
  enum ClickSource {
    DIRECT
    QR
    API
  }

  model ClickEvent {
    // ... existing fields
    source  ClickSource @default(DIRECT)
  }
  ```

- [x] **TASK-028**: Generate และ push schema

### 4.2 Redirector Update

- [x] **TASK-029**: Update redirector ให้ detect QR scans

  ```typescript
  // ถ้า URL มี ?utm_source=qr หรือ ?qr=1
  const source = url.searchParams.get("utm_source") === "qr" ? "QR" : "DIRECT";
  ```

### 4.3 Analytics Endpoint

- [x] **TASK-030**: เพิ่ม endpoint `/links/:id/analytics/qr`

  ```typescript
  @Get(':id/analytics/qr')
  async getQrAnalytics(@Param('id') id: string) {
    return {
      qrScans: number,
      directClicks: number,
      qrPercentage: number,
    };
  }
  ```

### 4.4 Frontend Analytics

- [x] **TASK-031**: แสดง QR vs Direct ใน analytics page

---

## Phase 5: Testing ✅ COMPLETED

**Priority: HIGH** | **Estimated: 2-3 hours**

### 5.1 Unit Tests

**File**: `apps/api/src/qr/__tests__/qr.service.spec.ts`

- [x] **TASK-032**: เขียน unit tests สำหรับ QrService methods ใหม่ (39 test cases)

  ```typescript
  describe("QrService", () => {
    describe("getQrConfig", () => {
      it("should return null for non-existent link");
      it("should return config for existing link");
    });

    describe("saveQrConfig", () => {
      it("should create new config");
      it("should update existing config");
      it("should upload logo to R2");
    });

    describe("generateAdvancedQr", () => {
      it("should apply error correction L");
      it("should apply error correction H");
      it("should apply custom margin");
    });

    describe("generatePdfQr", () => {
      it("should generate valid PDF buffer");
    });

    describe("batchGenerateQr", () => {
      it("should generate ZIP with all QRs");
    });
  });
  ```

### 5.2 E2E Tests

**File**: `apps/web/e2e/qr-customizer.spec.ts`

- [x] **TASK-033**: เขียน E2E tests เพิ่มเติม (46 test cases)

  ```typescript
  test.describe("QR Code Customizer", () => {
    test("should load saved config when opening", async ({ page }) => {
      // ...
    });

    test("should save config when clicking save", async ({ page }) => {
      // ...
    });

    test("error correction dropdown should work", async ({ page }) => {
      // ...
    });

    test("border size slider should work", async ({ page }) => {
      // ...
    });

    test("PDF download should work", async ({ page }) => {
      // ...
    });
  });
  ```

### 5.3 Run Tests

- [x] **VERIFY-012**: รัน unit tests

  ```bash
  pnpm --filter @pingtome/api test
  ```

- [x] **VERIFY-013**: รัน E2E tests
  ```bash
  cd apps/web && npx playwright test e2e/qr-customizer.spec.ts
  ```

---

## Final Verification Checklist

- [x] `pnpm build` passes without errors
- [x] `pnpm dev` starts without errors
- [x] All existing tests still pass (Unit: 39 tests, E2E: 46 tests)
- [x] QR config saves to database
- [x] QR config loads when reopening customizer
- [x] Error correction dropdown works
- [x] Border size slider works
- [x] PDF download works
- [x] (Optional) Batch download works (API implemented)
- [x] (Optional) QR analytics works ✅

---

## Commands Reference

```bash
# Database
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:push
pnpm --filter @pingtome/database db:seed

# Build
pnpm build
pnpm --filter @pingtome/types build
pnpm --filter @pingtome/api build
pnpm --filter @pingtome/web build

# Development
pnpm dev

# Testing
pnpm --filter @pingtome/api test
cd apps/web && npx playwright test e2e/qr-code.spec.ts
cd apps/web && npx playwright test --ui  # UI mode

# Linting
pnpm lint
```

---

## Notes

1. **ทำตามลำดับ Phase** - เริ่มจาก Phase 1 ก่อนเสมอ
2. **Verify หลังทุก Task กลุ่ม** - ตรวจสอบว่าไม่ break existing functionality
3. **Commit บ่อยๆ** - ทำ commit หลังจบแต่ละ Phase
4. **อย่าลืม Types** - Update `@pingtome/types` และ build ทุกครั้งที่เปลี่ยน
5. **Backward Compatible** - QR features เดิมต้องยังทำงานได้
