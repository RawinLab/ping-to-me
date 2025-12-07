# Link-in-Bio / Mini-Page Module - Implementation Plan

> **Module 1.9**: Link-in-Bio / Mini-Page (Linktree Clone)
>
> **Reference**: [bitly-clone-spec.md](./bitly-clone-spec.md) Section 1.9
>
> **Status**: MVP Implemented, Needs Enhancement

---

## Executive Summary

This module provides a "Link-in-Bio" feature similar to Linktree, allowing users to create customizable landing pages that aggregate multiple links into a single shareable URL. The current implementation has basic CRUD functionality but lacks key features like themes, analytics, drag-and-drop reordering, and proper public access.

---

## Current Implementation Analysis

### What's Already Implemented

| Component       | Status  | Completeness | Notes                                               |
| --------------- | ------- | ------------ | --------------------------------------------------- |
| Database Schema | Basic   | 30%          | Missing relationships, analytics, theme structure   |
| API Endpoints   | Working | 50%          | Missing analytics, embed, proper public endpoints   |
| Dashboard Page  | Working | 70%          | Missing delete confirmation, no filtering           |
| Public Page     | Broken  | 30%          | Public link fetching issue                          |
| Page Builder    | Partial | 40%          | No theme UI, no reordering, no customization        |
| Page Renderer   | Working | 30%          | No themes, single layout, no analytics              |
| E2E Tests       | Mock    | 20%          | Aspirational tests, not testing real implementation |

### Existing Files

**API**:

- `apps/api/src/biopages/biopages.controller.ts`
- `apps/api/src/biopages/biopages.service.ts`
- `apps/api/src/biopages/biopages.module.ts`

**Frontend**:

- `apps/web/app/dashboard/bio/page.tsx` - Dashboard listing
- `apps/web/app/dashboard/biopages/[slug]/edit/page.tsx` - Editor
- `apps/web/app/dashboard/biopages/[slug]/analytics/page.tsx` - Analytics (empty)
- `apps/web/app/bio/[slug]/page.tsx` - Public page
- `apps/web/components/bio/BioPageBuilder.tsx` - Builder component
- `apps/web/components/bio/BioPageRenderer.tsx` - Renderer component

**Database**:

- `packages/database/prisma/schema.prisma` (BioPage model, lines 128-141)

### Known Issues (TODOs in Code)

1. **hardcoded `orgId: "default"`** - BioPageBuilder.tsx:82, dashboard/bio/page.tsx:23
2. **Public link fetching broken** - bio/[slug]/page.tsx:26-68
3. **Simplified ownership check** - biopages.service.ts:49-58
4. **E2E tests expect non-existent UI** - bio.spec.ts

---

## Feature Requirements

### Phase 1: Fix Critical Bugs & Core Features (Priority: HIGH)

#### 1.1 Fix Public Bio Page Access

**Problem**: Public bio pages cannot fetch links without authentication.

**Solution**:

- Create dedicated public endpoint that returns bio page with full link details
- Remove authentication requirement for public page rendering
- Ensure links are returned with all necessary display data

**Tasks**:

- [ ] **TASK-001**: Create `GET /biopages/public/:slug` endpoint that returns complete data
- [ ] **TASK-002**: Update `BioPage` response to include full link objects (not just IDs)
- [ ] **TASK-003**: Fix `apps/web/app/bio/[slug]/page.tsx` to use public endpoint
- [ ] **TASK-004**: Add caching for public bio pages (performance)

#### 1.2 Fix Organization Context

**Problem**: `orgId` is hardcoded as "default" throughout the code.

**Solution**:

- Use proper organization context from authenticated user
- Add organization selector if user has multiple orgs

**Tasks**:

- [ ] **TASK-005**: Fix `BioPageBuilder.tsx` to get orgId from auth context
- [ ] **TASK-006**: Fix `dashboard/bio/page.tsx` to use proper orgId
- [ ] **TASK-007**: Add proper authorization guards in service layer

#### 1.3 Proper Link Management

**Problem**: Links are stored as JSON array without proper relationships.

**Solution**:

- Create `BioPageLink` model with proper ordering and styling
- Implement proper CRUD for bio page links

**Tasks**:

- [ ] **TASK-008**: Add `BioPageLink` model to Prisma schema

  ```prisma
  model BioPageLink {
    id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    bioPageId   String   @db.Uuid
    bioPage     BioPage  @relation(fields: [bioPageId], references: [id], onDelete: Cascade)
    linkId      String?  @db.Uuid
    link        Link?    @relation(fields: [linkId], references: [id])
    externalUrl String?
    title       String
    description String?
    icon        String?
    buttonStyle Json?
    order       Int
    isVisible   Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([bioPageId, order])
  }
  ```

- [ ] **TASK-009**: Run `db:generate` and `db:push`
- [ ] **TASK-010**: Migrate existing JSON links to new model
- [ ] **TASK-011**: Create API endpoints for link management:
  - `POST /biopages/:id/links` - Add link
  - `PATCH /biopages/:id/links/:linkId` - Update link
  - `DELETE /biopages/:id/links/:linkId` - Remove link
  - `PATCH /biopages/:id/links/reorder` - Reorder links

---

### Phase 2: Theme & Customization System (Priority: HIGH)

#### 2.1 Theme Model & Presets

**Tasks**:

- [ ] **TASK-012**: Create theme types in `packages/types/src/biopage.ts`

  ```typescript
  export type ThemeName =
    | "minimal"
    | "dark"
    | "colorful"
    | "neon"
    | "gradient"
    | "custom";
  export type LayoutType = "stacked" | "grid" | "carousel";
  export type BackgroundType = "solid" | "gradient" | "image";

  export interface BioPageTheme {
    name: ThemeName;
    primaryColor: string;
    backgroundColor: string;
    buttonColor: string;
    buttonTextColor: string;
    textColor: string;
    fontFamily: string;
    backgroundType: BackgroundType;
    backgroundImage?: string;
    backgroundGradient?: string;
    buttonStyle: "rounded" | "square" | "pill";
    buttonShadow: boolean;
  }

  export interface BioPageConfig {
    id: string;
    slug: string;
    title: string;
    description?: string;
    avatarUrl?: string;
    theme: BioPageTheme;
    layout: LayoutType;
    socialLinks: SocialLink[];
    links: BioPageLink[];
    showBranding: boolean;
  }
  ```

- [ ] **TASK-013**: Create predefined theme presets (6-8 themes)
- [ ] **TASK-014**: Update BioPage schema to use structured theme JSON

#### 2.2 Theme Customization UI

**Tasks**:

- [ ] **TASK-015**: Create `ThemeSelector` component with preview cards
- [ ] **TASK-016**: Create `ColorPicker` component for custom colors
- [ ] **TASK-017**: Create `FontSelector` component
- [ ] **TASK-018**: Create `BackgroundPicker` component (solid/gradient/image)
- [ ] **TASK-019**: Create `ButtonStyleSelector` component
- [ ] **TASK-020**: Update `BioPageBuilder.tsx` to include theme customization

#### 2.3 Live Preview

**Tasks**:

- [ ] **TASK-021**: Create `BioPagePreview` component (mobile mockup frame)
- [ ] **TASK-022**: Implement real-time preview updates
- [ ] **TASK-023**: Add responsive preview toggle (mobile/tablet/desktop)

---

### Phase 3: Drag-and-Drop & Link Styling (Priority: MEDIUM)

#### 3.1 Drag-and-Drop Reordering

**Tasks**:

- [ ] **TASK-024**: Install `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] **TASK-025**: Create `SortableLinkList` component
- [ ] **TASK-026**: Implement `PATCH /biopages/:id/links/reorder` API
- [ ] **TASK-027**: Add optimistic updates for smooth UX

#### 3.2 Per-Link Styling

**Tasks**:

- [ ] **TASK-028**: Create `LinkStyleEditor` component (color, icon, thumbnail)
- [ ] **TASK-029**: Add icon picker (emoji or icon library)
- [ ] **TASK-030**: Add thumbnail upload for links
- [ ] **TASK-031**: Update `BioPageRenderer` to apply per-link styles

---

### Phase 4: Social Links & Layout Options (Priority: MEDIUM)

#### 4.1 Social Links Section

**Tasks**:

- [ ] **TASK-032**: Create `SocialLinksEditor` component
- [ ] **TASK-033**: Support platforms: Instagram, Twitter/X, TikTok, YouTube, Facebook, LinkedIn, GitHub, Email, WhatsApp
- [ ] **TASK-034**: Auto-detect social platform from URL
- [ ] **TASK-035**: Create social link icons/buttons renderer

#### 4.2 Multiple Layouts

**Tasks**:

- [ ] **TASK-036**: Implement `stacked` layout (default, vertical list)
- [ ] **TASK-037**: Implement `grid` layout (2-3 columns)
- [ ] **TASK-038**: Create `LayoutSelector` component
- [ ] **TASK-039**: Update renderer to support all layouts

---

### Phase 5: Analytics (Priority: MEDIUM)

#### 5.1 Analytics Tracking

**Tasks**:

- [ ] **TASK-040**: Create `BioPageAnalytics` model

  ```prisma
  model BioPageAnalytics {
    id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    bioPageId   String   @db.Uuid
    bioPage     BioPage  @relation(fields: [bioPageId], references: [id], onDelete: Cascade)
    eventType   String   // 'page_view', 'link_click'
    bioLinkId   String?  @db.Uuid
    timestamp   DateTime @default(now())
    ip          String?
    country     String?
    city        String?
    device      String?
    browser     String?
    os          String?
    referrer    String?
    userAgent   String?

    @@index([bioPageId, timestamp])
    @@index([bioPageId, eventType])
  }
  ```

- [ ] **TASK-041**: Create `POST /biopages/:id/track` endpoint (public, no auth)
- [ ] **TASK-042**: Add tracking to public bio page renderer
- [ ] **TASK-043**: Track page views on load
- [ ] **TASK-044**: Track link clicks

#### 5.2 Analytics Dashboard

**Tasks**:

- [ ] **TASK-045**: Create `GET /biopages/:id/analytics/summary` endpoint
- [ ] **TASK-046**: Create `GET /biopages/:id/analytics/timeseries` endpoint
- [ ] **TASK-047**: Create `GET /biopages/:id/analytics/clicks` endpoint (per-link)
- [ ] **TASK-048**: Update `apps/web/app/dashboard/biopages/[slug]/analytics/page.tsx`
- [ ] **TASK-049**: Create analytics charts (line chart, bar chart, pie chart)
- [ ] **TASK-050**: Show click counts on links in builder

---

### Phase 6: Advanced Features (Priority: LOW)

#### 6.1 QR Code for Bio Page

**Tasks**:

- [ ] **TASK-051**: Create `GET /biopages/:id/qr` endpoint
- [ ] **TASK-052**: Add QR download button in dashboard
- [ ] **TASK-053**: Display QR in share modal

#### 6.2 Embed Support

**Tasks**:

- [ ] **TASK-054**: Create embed code generator
- [ ] **TASK-055**: Create `GET /biopages/:slug/embed` endpoint (iframe-friendly)
- [ ] **TASK-056**: Track embed views separately

#### 6.3 Share & SEO

**Tasks**:

- [ ] **TASK-057**: Add Open Graph meta tags to public page
- [ ] **TASK-058**: Add Twitter Card meta tags
- [ ] **TASK-059**: Create share modal with copy URL, QR, social share buttons
- [ ] **TASK-060**: Add favicon support per bio page

---

## Database Schema Changes

### New/Modified Models

```prisma
// ============= BIO PAGE MODELS =============

model BioPage {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug           String   @unique
  title          String
  description    String?
  avatarUrl      String?
  theme          Json     @default("{}")  // BioPageTheme structure
  layout         String   @default("stacked") // 'stacked' | 'grid' | 'carousel'
  socialLinks    Json     @default("[]")  // SocialLink[] array
  showBranding   Boolean  @default(true)
  isPublished    Boolean  @default(true)
  organizationId String   @db.Uuid
  userId         String   @db.Uuid
  viewCount      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization     @relation(fields: [organizationId], references: [id])
  user           User             @relation(fields: [userId], references: [id])
  links          BioPageLink[]
  analytics      BioPageAnalytics[]
}

model BioPageLink {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bioPageId   String   @db.Uuid
  linkId      String?  @db.Uuid  // Reference to Link model (optional)
  externalUrl String?            // For external URLs not in Link model
  title       String
  description String?
  icon        String?            // Emoji or icon name
  thumbnailUrl String?
  buttonColor String?
  textColor   String?
  order       Int
  isVisible   Boolean  @default(true)
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bioPage     BioPage  @relation(fields: [bioPageId], references: [id], onDelete: Cascade)
  link        Link?    @relation(fields: [linkId], references: [id])

  @@index([bioPageId, order])
}

model BioPageAnalytics {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bioPageId   String   @db.Uuid
  eventType   String   // 'page_view', 'link_click'
  bioLinkId   String?  @db.Uuid
  timestamp   DateTime @default(now())
  ip          String?
  country     String?
  city        String?
  device      String?
  browser     String?
  os          String?
  referrer    String?
  userAgent   String?

  bioPage     BioPage  @relation(fields: [bioPageId], references: [id], onDelete: Cascade)

  @@index([bioPageId, timestamp])
  @@index([bioPageId, eventType])
}
```

---

## API Endpoints

### Existing (Need Enhancement)

| Method | Endpoint        | Auth | Description                  |
| ------ | --------------- | ---- | ---------------------------- |
| POST   | `/biopages`     | Yes  | Create bio page              |
| GET    | `/biopages`     | Yes  | List user's bio pages        |
| GET    | `/biopages/:id` | Yes  | Get bio page (authenticated) |
| PATCH  | `/biopages/:id` | Yes  | Update bio page              |
| DELETE | `/biopages/:id` | Yes  | Delete bio page              |

### New Endpoints

| Method | Endpoint                             | Auth | Description                       |
| ------ | ------------------------------------ | ---- | --------------------------------- |
| GET    | `/biopages/public/:slug`             | No   | Get public bio page with all data |
| POST   | `/biopages/:id/links`                | Yes  | Add link to bio page              |
| PATCH  | `/biopages/:id/links/:linkId`        | Yes  | Update link on bio page           |
| DELETE | `/biopages/:id/links/:linkId`        | Yes  | Remove link from bio page         |
| PATCH  | `/biopages/:id/links/reorder`        | Yes  | Reorder links                     |
| POST   | `/biopages/:id/track`                | No   | Track page view or link click     |
| GET    | `/biopages/:id/analytics/summary`    | Yes  | Get analytics summary             |
| GET    | `/biopages/:id/analytics/timeseries` | Yes  | Get time-series data              |
| GET    | `/biopages/:id/analytics/clicks`     | Yes  | Get per-link click data           |
| GET    | `/biopages/:id/qr`                   | Yes  | Generate QR code                  |
| GET    | `/biopages/:slug/embed`              | No   | Embed-friendly page render        |

---

## Test Cases

### Unit Tests (`apps/api/src/biopages/__tests__/biopages.service.spec.ts`)

```typescript
describe("BiopagesService", () => {
  describe("create", () => {
    it("should create a bio page with valid data");
    it("should fail if slug is taken");
    it("should fail if user has no access to organization");
    it("should initialize default theme and layout");
  });

  describe("findBySlug", () => {
    it("should return bio page with links");
    it("should return null for non-existent slug");
  });

  describe("getPublicPage", () => {
    it("should return complete bio page for public access");
    it("should return only visible links");
    it("should return links in order");
    it("should increment view count");
  });

  describe("update", () => {
    it("should update bio page fields");
    it("should validate theme structure");
    it("should fail if user is not owner");
  });

  describe("delete", () => {
    it("should soft delete bio page");
    it("should cascade delete links");
    it("should fail if user is not owner");
  });

  describe("addLink", () => {
    it("should add link to bio page");
    it("should auto-increment order");
    it("should allow both internal and external links");
  });

  describe("updateLink", () => {
    it("should update link properties");
    it("should validate link belongs to bio page");
  });

  describe("removeLink", () => {
    it("should remove link from bio page");
    it("should reorder remaining links");
  });

  describe("reorderLinks", () => {
    it("should update link orders");
    it("should handle gaps in order numbers");
  });

  describe("trackEvent", () => {
    it("should record page view event");
    it("should record link click event");
    it("should parse user agent data");
    it("should detect country from IP");
  });

  describe("getAnalytics", () => {
    it("should return summary statistics");
    it("should return time-series data");
    it("should return per-link click data");
  });
});
```

### E2E Tests (`apps/web/e2e/biopage.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";
import { loginAsUser } from "./fixtures/auth";

test.describe("Bio Page Module", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test.describe("Bio Page Dashboard", () => {
    test("BIO-001: should display bio pages list", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await expect(page.locator("h1")).toContainText("Bio Pages");
      await expect(
        page.locator('[data-testid="create-biopage-btn"]'),
      ).toBeVisible();
    });

    test("BIO-002: should create new bio page", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.click('[data-testid="create-biopage-btn"]');
      await page.fill('[data-testid="slug-input"]', "my-test-page");
      await page.fill('[data-testid="title-input"]', "My Test Page");
      await page.click('[data-testid="save-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });

    test("BIO-003: should show error for duplicate slug", async ({ page }) => {
      // Create first page, then try same slug
      await page.goto("/dashboard/bio");
      await page.click('[data-testid="create-biopage-btn"]');
      await page.fill('[data-testid="slug-input"]', "duplicate-slug");
      await page.fill('[data-testid="title-input"]', "First Page");
      await page.click('[data-testid="save-btn"]');
      // Try again
      await page.click('[data-testid="create-biopage-btn"]');
      await page.fill('[data-testid="slug-input"]', "duplicate-slug");
      await expect(page.locator('[data-testid="slug-error"]')).toContainText(
        "already taken",
      );
    });

    test("BIO-004: should delete bio page", async ({ page }) => {
      await page.goto("/dashboard/bio");
      await page.click('[data-testid="biopage-menu-btn"]');
      await page.click('[data-testid="delete-btn"]');
      await page.click('[data-testid="confirm-delete-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toContainText(
        "deleted",
      );
    });
  });

  test.describe("Bio Page Editor", () => {
    test("BIO-010: should load bio page editor", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await expect(
        page.locator('[data-testid="biopage-builder"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
    });

    test("BIO-011: should update bio page title", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.fill('[data-testid="title-input"]', "Updated Title");
      await page.click('[data-testid="save-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });

    test("BIO-012: should upload avatar", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.setInputFiles(
        '[data-testid="avatar-input"]',
        "test-avatar.png",
      );
      await expect(
        page.locator('[data-testid="avatar-preview"]'),
      ).toBeVisible();
    });

    test("BIO-013: should add link from dropdown", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="add-link-btn"]');
      await page.click('[data-testid="link-option"]:first-child');
      await expect(page.locator('[data-testid="link-item"]')).toHaveCount(1);
    });

    test("BIO-014: should add external link", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="add-external-link-btn"]');
      await page.fill(
        '[data-testid="external-url-input"]',
        "https://example.com",
      );
      await page.fill('[data-testid="link-title-input"]', "Example Site");
      await page.click('[data-testid="add-link-confirm-btn"]');
      await expect(page.locator('[data-testid="link-item"]')).toContainText(
        "Example Site",
      );
    });

    test("BIO-015: should remove link", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="link-item-menu-btn"]');
      await page.click('[data-testid="remove-link-btn"]');
      await expect(page.locator('[data-testid="link-item"]')).toHaveCount(0);
    });

    test("BIO-016: should reorder links via drag and drop", async ({
      page,
    }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      const firstLink = page.locator('[data-testid="link-item"]:first-child');
      const secondLink = page.locator('[data-testid="link-item"]:nth-child(2)');
      await firstLink.dragTo(secondLink);
      // Verify order changed
      await expect(
        page.locator('[data-testid="link-item"]:first-child'),
      ).not.toContainText("First");
    });
  });

  test.describe("Theme Customization", () => {
    test("BIO-020: should display theme selector", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="theme-tab"]');
      await expect(
        page.locator('[data-testid="theme-selector"]'),
      ).toBeVisible();
    });

    test("BIO-021: should select predefined theme", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="theme-tab"]');
      await page.click('[data-testid="theme-dark"]');
      await expect(page.locator('[data-testid="preview-panel"]')).toHaveClass(
        /dark/,
      );
    });

    test("BIO-022: should customize primary color", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="theme-tab"]');
      await page.fill('[data-testid="primary-color-input"]', "#FF5500");
      await page.click('[data-testid="save-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });

    test("BIO-023: should change button style", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="theme-tab"]');
      await page.click('[data-testid="button-style-pill"]');
      await expect(
        page.locator('[data-testid="preview-link-btn"]'),
      ).toHaveClass(/rounded-full/);
    });

    test("BIO-024: should upload background image", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="theme-tab"]');
      await page.click('[data-testid="bg-type-image"]');
      await page.setInputFiles('[data-testid="bg-image-input"]', "test-bg.jpg");
      await expect(page.locator('[data-testid="bg-preview"]')).toBeVisible();
    });
  });

  test.describe("Social Links", () => {
    test("BIO-030: should add social link", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="social-tab"]');
      await page.click('[data-testid="add-social-btn"]');
      await page.click('[data-testid="platform-instagram"]');
      await page.fill(
        '[data-testid="social-url-input"]',
        "https://instagram.com/mypage",
      );
      await page.click('[data-testid="save-social-btn"]');
      await expect(
        page.locator('[data-testid="social-instagram"]'),
      ).toBeVisible();
    });

    test("BIO-031: should remove social link", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="social-tab"]');
      await page.click('[data-testid="social-instagram-remove"]');
      await expect(
        page.locator('[data-testid="social-instagram"]'),
      ).not.toBeVisible();
    });
  });

  test.describe("Public Bio Page", () => {
    test("BIO-040: should render public bio page", async ({ page }) => {
      await page.goto("/bio/test-page");
      await expect(page.locator('[data-testid="biopage-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="biopage-links"]')).toBeVisible();
    });

    test("BIO-041: should apply theme to public page", async ({ page }) => {
      await page.goto("/bio/test-page");
      // Check theme is applied
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(0, 0, 0)",
      );
    });

    test("BIO-042: should track page view", async ({ page }) => {
      // This tests analytics tracking
      await page.goto("/bio/test-page");
      // Wait for tracking request
      await page.waitForResponse((resp) => resp.url().includes("/track"));
    });

    test("BIO-043: should track link click", async ({ page }) => {
      await page.goto("/bio/test-page");
      await page.click('[data-testid="biopage-link"]:first-child');
      // Wait for tracking request
      await page.waitForResponse((resp) => resp.url().includes("/track"));
    });

    test("BIO-044: should display 404 for non-existent page", async ({
      page,
    }) => {
      await page.goto("/bio/non-existent-page");
      await expect(page.locator("text=Page not found")).toBeVisible();
    });

    test("BIO-045: should display social links", async ({ page }) => {
      await page.goto("/bio/test-page");
      await expect(page.locator('[data-testid="social-links"]')).toBeVisible();
    });
  });

  test.describe("Bio Page Analytics", () => {
    test("BIO-050: should display analytics dashboard", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/analytics");
      await expect(
        page.locator('[data-testid="analytics-summary"]'),
      ).toBeVisible();
    });

    test("BIO-051: should show page view count", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/analytics");
      await expect(page.locator('[data-testid="total-views"]')).toBeVisible();
    });

    test("BIO-052: should show per-link click counts", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/analytics");
      await expect(
        page.locator('[data-testid="link-clicks-chart"]'),
      ).toBeVisible();
    });

    test("BIO-053: should filter by date range", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/analytics");
      await page.click('[data-testid="date-range-7d"]');
      await expect(
        page.locator('[data-testid="timeseries-chart"]'),
      ).toBeVisible();
    });
  });

  test.describe("Share & QR Code", () => {
    test("BIO-060: should open share modal", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="share-btn"]');
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    });

    test("BIO-061: should copy public URL", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="share-btn"]');
      await page.click('[data-testid="copy-url-btn"]');
      await expect(page.locator('[data-testid="copied-toast"]')).toBeVisible();
    });

    test("BIO-062: should display QR code", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="share-btn"]');
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    });

    test("BIO-063: should download QR code", async ({ page }) => {
      await page.goto("/dashboard/biopages/test-page/edit");
      await page.click('[data-testid="share-btn"]');
      const downloadPromise = page.waitForEvent("download");
      await page.click('[data-testid="download-qr-btn"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain("qr");
    });
  });
});
```

---

## Implementation Checklist

### Pre-Implementation

- [ ] Read existing code in `apps/api/src/biopages/`
- [ ] Read existing code in `apps/web/components/bio/`
- [ ] Run `pnpm dev` and verify current implementation
- [ ] Run `pnpm build` to check for errors

### Phase 1: Fix Critical Bugs (Priority: HIGH)

- [ ] **TASK-001**: Create public endpoint with full data
- [ ] **TASK-002**: Update BioPage response with full link objects
- [ ] **TASK-003**: Fix public page frontend to use public endpoint
- [ ] **TASK-004**: Add caching for public pages
- [ ] **TASK-005**: Fix orgId in BioPageBuilder
- [ ] **TASK-006**: Fix orgId in dashboard page
- [ ] **TASK-007**: Add proper auth guards
- [ ] **TASK-008**: Create BioPageLink model
- [ ] **TASK-009**: Run db:generate and db:push
- [ ] **TASK-010**: Migrate existing JSON links
- [ ] **TASK-011**: Create link management endpoints
- [ ] **VERIFY-001**: Public page loads without auth
- [ ] **VERIFY-002**: Links display correctly on public page
- [ ] **Commit**: Phase 1 complete

### Phase 2: Theme & Customization (Priority: HIGH)

- [ ] **TASK-012**: Create biopage types
- [ ] **TASK-013**: Create theme presets
- [ ] **TASK-014**: Update schema for structured theme
- [ ] **TASK-015**: Create ThemeSelector component
- [ ] **TASK-016**: Create ColorPicker component
- [ ] **TASK-017**: Create FontSelector component
- [ ] **TASK-018**: Create BackgroundPicker component
- [ ] **TASK-019**: Create ButtonStyleSelector component
- [ ] **TASK-020**: Update BioPageBuilder with theme UI
- [ ] **TASK-021**: Create BioPagePreview component
- [ ] **TASK-022**: Implement real-time preview
- [ ] **TASK-023**: Add responsive preview toggle
- [ ] **VERIFY-003**: Themes apply correctly
- [ ] **VERIFY-004**: Preview updates in real-time
- [ ] **Commit**: Phase 2 complete

### Phase 3: Drag-and-Drop & Link Styling (Priority: MEDIUM)

- [ ] **TASK-024**: Install dnd-kit
- [ ] **TASK-025**: Create SortableLinkList component
- [ ] **TASK-026**: Implement reorder API
- [ ] **TASK-027**: Add optimistic updates
- [ ] **TASK-028**: Create LinkStyleEditor component
- [ ] **TASK-029**: Add icon picker
- [ ] **TASK-030**: Add thumbnail upload
- [ ] **TASK-031**: Update renderer for per-link styles
- [ ] **VERIFY-005**: Drag-and-drop works smoothly
- [ ] **VERIFY-006**: Per-link styling applies
- [ ] **Commit**: Phase 3 complete

### Phase 4: Social Links & Layout (Priority: MEDIUM)

- [ ] **TASK-032**: Create SocialLinksEditor component
- [ ] **TASK-033**: Support 9 social platforms
- [ ] **TASK-034**: Auto-detect platform from URL
- [ ] **TASK-035**: Create social icons renderer
- [ ] **TASK-036**: Implement stacked layout
- [ ] **TASK-037**: Implement grid layout
- [ ] **TASK-038**: Create LayoutSelector component
- [ ] **TASK-039**: Update renderer for layouts
- [ ] **VERIFY-007**: Social links display correctly
- [ ] **VERIFY-008**: All layouts render properly
- [ ] **Commit**: Phase 4 complete

### Phase 5: Analytics (Priority: MEDIUM)

- [ ] **TASK-040**: Create BioPageAnalytics model
- [ ] **TASK-041**: Create track endpoint
- [ ] **TASK-042**: Add tracking to public renderer
- [ ] **TASK-043**: Track page views
- [ ] **TASK-044**: Track link clicks
- [ ] **TASK-045**: Create analytics summary endpoint
- [ ] **TASK-046**: Create timeseries endpoint
- [ ] **TASK-047**: Create per-link clicks endpoint
- [ ] **TASK-048**: Update analytics dashboard page
- [ ] **TASK-049**: Create analytics charts
- [ ] **TASK-050**: Show click counts in builder
- [ ] **VERIFY-009**: Analytics tracking works
- [ ] **VERIFY-010**: Dashboard shows data
- [ ] **Commit**: Phase 5 complete

### Phase 6: Advanced Features (Priority: LOW)

- [ ] **TASK-051**: Create QR endpoint
- [ ] **TASK-052**: Add QR download button
- [ ] **TASK-053**: Display QR in share modal
- [ ] **TASK-054**: Create embed code generator
- [ ] **TASK-055**: Create embed endpoint
- [ ] **TASK-056**: Track embed views
- [ ] **TASK-057**: Add OG meta tags
- [ ] **TASK-058**: Add Twitter Card meta tags
- [ ] **TASK-059**: Create share modal
- [ ] **TASK-060**: Add favicon support
- [ ] **VERIFY-011**: QR generation works
- [ ] **VERIFY-012**: Embed code works
- [ ] **VERIFY-013**: Social sharing works
- [ ] **Commit**: Phase 6 complete

### Final Verification

- [ ] `pnpm build` passes
- [ ] `pnpm dev` runs without errors
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Public bio pages load for non-authenticated users
- [ ] Themes apply correctly on public pages
- [ ] Analytics tracking works
- [ ] Mobile responsive design works

---

## Commands Reference

```bash
# Database
pnpm --filter @pingtome/database db:generate
pnpm --filter @pingtome/database db:push

# Development
pnpm dev
pnpm --filter api dev
pnpm --filter web dev

# Build
pnpm build

# Testing
pnpm --filter api test
cd apps/web && npx playwright test e2e/biopage.spec.ts

# Linting
pnpm lint
```

---

## Notes

1. **Prioritize fixing public access** - This is critical for the feature to be useful
2. **Use proper types** - Create types in `@pingtome/types` for all bio page structures
3. **Mobile-first design** - Bio pages are primarily viewed on mobile devices
4. **Performance** - Cache public pages, lazy load images
5. **Accessibility** - Ensure proper ARIA labels and keyboard navigation
6. **SEO** - Add proper meta tags for social sharing

---

## References

- [Linktree](https://linktr.ee) - Primary inspiration
- [Bitly Clone Spec](./bitly-clone-spec.md) - Section 1.9
- [Linktree Pricing Features](https://linktr.ee/s/pricing) - Feature comparison
