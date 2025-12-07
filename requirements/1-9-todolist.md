# Link-in-Bio Module - Implementation Todolist

> **Module**: 1.9 Link-in-Bio / Mini-Page (Linktree Clone)
> **Created**: 2025-12-07
> **Status**: All Phases Completed
> **Last Updated**: 2025-12-07

## Progress Summary

| Phase | Status | Commit |
|-------|--------|--------|
| Phase 1: Core Bio Page | ✅ Completed | `7e86fa4` |
| Phase 2: Theme System | ✅ Completed | `fdc0901` |
| Phase 3: Drag-and-Drop | ✅ Completed | `9f2743b` |
| Phase 4: Social Links | ✅ Completed | `744772e` |
| Phase 5: Analytics | ✅ Completed | `77983b4` |
| Phase 6: Advanced | ✅ Completed | `ceb3548` |

---

## Overview

This todolist breaks down the Bio Page module implementation into actionable tasks for Claude Code subagents. Each task includes clear scope, acceptance criteria, and verification steps.

---

## Pre-Implementation Setup

### SETUP-001: Analyze Current Implementation
**Priority**: Pre-requisite
**Estimated Complexity**: Low
**Agent Type**: Explore

**Prompt**:
```
Analyze the current Bio Page implementation in the pingtome project:

1. Read and summarize existing files:
   - apps/api/src/biopages/ (all files)
   - apps/web/app/dashboard/bio/page.tsx
   - apps/web/app/dashboard/biopages/[slug]/edit/page.tsx
   - apps/web/app/bio/[slug]/page.tsx
   - apps/web/components/bio/BioPageBuilder.tsx
   - apps/web/components/bio/BioPageRenderer.tsx
   - packages/database/prisma/schema.prisma (BioPage model)

2. Identify:
   - Current functionality vs missing features
   - Known bugs (hardcoded orgId, public access issues)
   - Code patterns used in the project

3. Report findings with file paths and line numbers
```

**Acceptance Criteria**:
- [ ] All existing files documented
- [ ] Current bugs identified with locations
- [ ] Implementation gaps listed

---

## Phase 1: Fix Critical Bugs & Core Features

**Priority**: HIGH
**Dependencies**: SETUP-001

### TASK-001: Create Public Bio Page Endpoint
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Create a public endpoint for Bio Pages that doesn't require authentication.

Location: apps/api/src/biopages/

Requirements:
1. Add new endpoint: GET /biopages/public/:slug
2. Return complete bio page data including:
   - Page info (title, description, avatar, theme, layout)
   - All visible links with full details
   - Social links
3. No authentication required
4. Include proper error handling (404 for non-existent pages)
5. Add response caching headers (Cache-Control: public, max-age=300)

Files to modify:
- biopages.controller.ts - Add new route
- biopages.service.ts - Add getPublicPage method

Follow existing NestJS patterns in the project.
```

**Acceptance Criteria**:
- [ ] Endpoint accessible without auth token
- [ ] Returns complete page data with links
- [ ] 404 response for invalid slugs
- [ ] Cache headers present

---

### TASK-002: Fix Public Bio Page Frontend
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Fix the public bio page rendering at apps/web/app/bio/[slug]/page.tsx

Current Issue: Page cannot fetch bio data without authentication

Requirements:
1. Update to call new public endpoint: GET /biopages/public/:slug
2. Remove any auth requirements for this page
3. Handle loading and error states properly
4. Ensure links are rendered from API response
5. Add proper 404 handling with user-friendly message

Reference the existing BioPageRenderer component for rendering.
Use the project's axios instance pattern but without auth interceptor.
```

**Acceptance Criteria**:
- [ ] Public page loads without login
- [ ] All links display correctly
- [ ] 404 shows for non-existent pages
- [ ] No console errors

---

### TASK-003: Fix Organization Context in BioPageBuilder
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Fix hardcoded orgId in Bio Page components.

Files to fix:
1. apps/web/components/bio/BioPageBuilder.tsx (line ~82)
   - Replace hardcoded "default" with orgId from auth context

2. apps/web/app/dashboard/bio/page.tsx (line ~23)
   - Get orgId from useAuth() or organization context

Use the existing auth patterns in the project:
- Check how other dashboard pages get orgId
- Use useAuth() hook or similar pattern
- Handle case when user has multiple organizations

Do NOT add organization selector UI - just fix the hardcoded value.
```

**Acceptance Criteria**:
- [ ] No hardcoded "default" orgId
- [ ] Uses actual user's organization
- [ ] Works with existing auth system

---

### TASK-004: Create BioPageLink Database Model
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Add BioPageLink model to properly manage bio page links.

Location: packages/database/prisma/schema.prisma

Add new model:
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
  thumbnailUrl String?
  buttonColor String?
  textColor   String?
  order       Int
  isVisible   Boolean  @default(true)
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([bioPageId, order])
}
```

Also update BioPage model to add relation:
- Add: links BioPageLink[]

After modifying schema:
1. Run: pnpm --filter @pingtome/database db:generate
2. Run: pnpm --filter @pingtome/database db:push
```

**Acceptance Criteria**:
- [ ] Model added to schema
- [ ] Relation to BioPage established
- [ ] Optional relation to Link model
- [ ] Prisma client generated successfully

---

### TASK-005: Create Link Management API Endpoints
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Create CRUD endpoints for managing BioPageLinks.

Location: apps/api/src/biopages/

Add these endpoints to biopages.controller.ts:
1. POST /biopages/:id/links - Add link to bio page
2. PATCH /biopages/:id/links/:linkId - Update link
3. DELETE /biopages/:id/links/:linkId - Remove link
4. PATCH /biopages/:id/links/reorder - Reorder links (accepts array of {id, order})

Add corresponding service methods in biopages.service.ts:
- addLink(bioPageId, dto): Create link with auto-increment order
- updateLink(bioPageId, linkId, dto): Update link properties
- removeLink(bioPageId, linkId): Delete and reorder remaining
- reorderLinks(bioPageId, orderings): Batch update orders

Create DTOs:
- CreateBioPageLinkDto
- UpdateBioPageLinkDto
- ReorderLinksDto

Include proper authorization checks (user must own bio page).
```

**Acceptance Criteria**:
- [ ] All 4 endpoints working
- [ ] Authorization checks in place
- [ ] Order auto-managed on add/remove
- [ ] Reorder works with batch update

---

### TASK-006: Migrate Existing JSON Links to BioPageLink Model
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Create a migration script to convert existing JSON links to the new BioPageLink model.

Location: packages/database/prisma/

Create migration script that:
1. Finds all BioPages with links stored as JSON
2. For each link in JSON array:
   - Creates a BioPageLink record
   - Preserves order (array index)
   - Maps fields appropriately
3. After migration, optionally clear the JSON links field

The script should:
- Be idempotent (safe to run multiple times)
- Log progress
- Handle errors gracefully
- Not delete original JSON until verified

Add to package.json scripts:
"db:migrate-bio-links": "ts-node prisma/scripts/migrate-bio-links.ts"
```

**Acceptance Criteria**:
- [ ] Script runs without errors
- [ ] All existing links migrated
- [ ] Order preserved
- [ ] Original data backed up

---

### VERIFY-PHASE-1: Phase 1 Integration Test
**Complexity**: Low
**Agent Type**: test-automator

**Prompt**:
```
Verify Phase 1 implementation is complete:

Manual Testing Checklist:
1. Start dev server: pnpm dev
2. Test public page access:
   - Visit /bio/[existing-slug] without login
   - Verify page renders with links
   - Check no auth errors in console
3. Test dashboard:
   - Login and go to /dashboard/bio
   - Create new bio page
   - Add links to bio page
   - Verify links save correctly
4. Test API directly:
   - GET /biopages/public/:slug returns data
   - POST /biopages/:id/links adds link
   - PATCH reorder works

Run build to check for errors:
pnpm build

Report any issues found with specific error messages.
```

**Acceptance Criteria**:
- [ ] Public page works without auth
- [ ] Link CRUD operations work
- [ ] Build passes
- [ ] No console errors

---

## Phase 2: Theme & Customization System

**Priority**: HIGH
**Dependencies**: Phase 1

### TASK-007: Create Bio Page Type Definitions
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Create TypeScript types for Bio Page theming system.

Location: packages/types/src/biopage.ts (create new file)

Define these types:

export type ThemeName = 'minimal' | 'dark' | 'colorful' | 'neon' | 'gradient' | 'custom';
export type LayoutType = 'stacked' | 'grid' | 'carousel';
export type BackgroundType = 'solid' | 'gradient' | 'image';
export type ButtonStyle = 'rounded' | 'square' | 'pill';

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
  buttonStyle: ButtonStyle;
  buttonShadow: boolean;
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  order: number;
}

export type SocialPlatform =
  | 'instagram' | 'twitter' | 'tiktok' | 'youtube'
  | 'facebook' | 'linkedin' | 'github' | 'email' | 'whatsapp';

export interface BioPageConfig {
  id: string;
  slug: string;
  title: string;
  description?: string;
  avatarUrl?: string;
  theme: BioPageTheme;
  layout: LayoutType;
  socialLinks: SocialLink[];
  showBranding: boolean;
}

Export all types from packages/types/src/index.ts
```

**Acceptance Criteria**:
- [ ] Types file created
- [ ] All types exported
- [ ] No TypeScript errors
- [ ] Types importable from @pingtome/types

---

### TASK-008: Create Theme Presets
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Create predefined theme presets for Bio Pages.

Location: apps/web/lib/biopage-themes.ts (create new file)

Create 6 theme presets with the BioPageTheme structure:

1. minimal - White background, clean look
2. dark - Dark mode with subtle accents
3. colorful - Vibrant multi-color gradient
4. neon - Dark with neon accent colors
5. gradient - Smooth gradient background
6. pastel - Soft pastel colors

Each preset should include:
- All required BioPageTheme fields
- Coordinated color schemes
- Appropriate font families (use web-safe or Google Fonts available in project)

Export:
- THEME_PRESETS: Record<ThemeName, BioPageTheme>
- getThemePreset(name: ThemeName): BioPageTheme
- DEFAULT_THEME: BioPageTheme (use 'minimal')
```

**Acceptance Criteria**:
- [ ] 6 themes created
- [ ] Colors visually appealing
- [ ] All fields properly set
- [ ] Types match BioPageTheme

---

### TASK-009: Create ThemeSelector Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a ThemeSelector component for choosing Bio Page themes.

Location: apps/web/components/bio/ThemeSelector.tsx

Requirements:
1. Display theme presets as preview cards (grid layout)
2. Each card shows:
   - Mini preview of the theme (colored box with button sample)
   - Theme name
   - Selected indicator (checkmark or border)
3. Props:
   - value: ThemeName
   - onChange: (theme: ThemeName) => void
4. Use shadcn/ui components (Card, etc)
5. Responsive: 2 columns on mobile, 3 on desktop

Use existing shadcn components from @pingtome/ui or apps/web/components/ui
```

**Acceptance Criteria**:
- [ ] Shows all 6 themes
- [ ] Visual preview for each
- [ ] Selection state visible
- [ ] Responsive layout

---

### TASK-010: Create Color Picker Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a ColorPicker component for custom theme colors.

Location: apps/web/components/bio/ColorPicker.tsx

Requirements:
1. Show current color as a swatch
2. Click to open popover with:
   - Predefined color palette (8-12 colors)
   - Hex input field
   - Optional: Hue slider for custom colors
3. Props:
   - value: string (hex color)
   - onChange: (color: string) => void
   - label?: string

Use:
- shadcn/ui Popover
- Input for hex value
- Validate hex format

Keep it simple - no need for full color wheel.
```

**Acceptance Criteria**:
- [ ] Shows color swatch
- [ ] Popover with palette
- [ ] Hex input works
- [ ] Valid hex colors only

---

### TASK-011: Create BackgroundPicker Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a BackgroundPicker component for bio page backgrounds.

Location: apps/web/components/bio/BackgroundPicker.tsx

Requirements:
1. Three modes: Solid, Gradient, Image
2. Tab or radio to switch modes
3. Solid mode: ColorPicker for background color
4. Gradient mode:
   - Two ColorPickers (start/end)
   - Direction selector (vertical/horizontal/diagonal)
   - Preview of gradient
5. Image mode:
   - Image URL input
   - Or upload button (use existing upload patterns)
   - Preview of image
6. Props:
   - backgroundType: BackgroundType
   - backgroundColor: string
   - backgroundGradient?: string
   - backgroundImage?: string
   - onChange: (updates) => void

Use Tabs from shadcn/ui
```

**Acceptance Criteria**:
- [ ] All 3 modes work
- [ ] Preview shows correctly
- [ ] Gradient configurable
- [ ] Image upload/URL works

---

### TASK-012: Create ButtonStyleSelector Component
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Create a ButtonStyleSelector component for bio page link buttons.

Location: apps/web/components/bio/ButtonStyleSelector.tsx

Requirements:
1. Show 3 button style options as visual previews:
   - rounded (slight border-radius)
   - square (no border-radius)
   - pill (full border-radius)
2. Each option shows a sample button with that style
3. Props:
   - value: ButtonStyle
   - onChange: (style: ButtonStyle) => void
4. Include toggle for button shadow on/off

Use shadcn/ui RadioGroup or custom toggle buttons
```

**Acceptance Criteria**:
- [ ] 3 styles shown visually
- [ ] Selection works
- [ ] Shadow toggle included
- [ ] Preview matches actual button appearance

---

### TASK-013: Update BioPageBuilder with Theme UI
**Complexity**: High
**Agent Type**: typescript-pro

**Prompt**:
```
Update BioPageBuilder to include theme customization UI.

Location: apps/web/components/bio/BioPageBuilder.tsx

Add Theme Customization Section:
1. Add tabs or sections: "Links" | "Theme" | "Social"
2. Theme tab includes:
   - ThemeSelector for preset selection
   - When "custom" selected, show:
     - ColorPicker for primaryColor
     - ColorPicker for buttonColor
     - ColorPicker for textColor
     - BackgroundPicker
     - ButtonStyleSelector
     - FontSelector (simple dropdown with 5-6 fonts)
3. Save theme changes with existing save mechanism
4. Show "Custom" when any preset value is modified

Preserve existing link management functionality.
Wire up all components to update the bio page state.
```

**Acceptance Criteria**:
- [ ] Theme tab visible
- [ ] Preset selection works
- [ ] Custom options appear when needed
- [ ] Changes save correctly

---

### TASK-014: Create BioPagePreview Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a mobile preview component for Bio Page editor.

Location: apps/web/components/bio/BioPagePreview.tsx

Requirements:
1. Mobile phone mockup frame (iPhone-like)
2. Inside frame, render BioPageRenderer with current config
3. Real-time updates as user edits
4. Props:
   - config: BioPageConfig
   - scale?: number (for sizing)
5. Optional: Toggle between mobile/tablet/desktop sizes
6. Styled with CSS to look like a phone preview

The preview should use the same BioPageRenderer component
that's used for the public page.
```

**Acceptance Criteria**:
- [ ] Phone frame visible
- [ ] Content renders inside
- [ ] Updates in real-time
- [ ] Looks professional

---

### TASK-015: Update BioPageRenderer for Themes
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Update BioPageRenderer to apply theme styles correctly.

Location: apps/web/components/bio/BioPageRenderer.tsx

Requirements:
1. Accept theme configuration from BioPageConfig
2. Apply theme styles:
   - Background (solid/gradient/image)
   - Button colors and styles
   - Text colors
   - Font family
   - Button shadows
3. Support all ButtonStyle options (rounded/square/pill)
4. Ensure mobile-responsive design
5. Apply to both preview and public page

Use inline styles or CSS variables for dynamic theming.
Test that all 6 preset themes render correctly.
```

**Acceptance Criteria**:
- [ ] All theme properties applied
- [ ] Buttons styled correctly
- [ ] Background types work
- [ ] Fonts applied

---

### VERIFY-PHASE-2: Phase 2 Integration Test
**Complexity**: Low
**Agent Type**: test-automator

**Prompt**:
```
Verify Phase 2 theme system is complete:

Testing Checklist:
1. Go to bio page editor
2. Switch to Theme tab
3. Select each preset theme - verify preview updates
4. Test custom theme options:
   - Change primary color
   - Change button color
   - Change background (solid, gradient, image)
   - Change button style
5. Save and view public page - verify theme applied
6. Check mobile responsiveness

Run: pnpm build

Report issues with screenshots or specific errors.
```

**Acceptance Criteria**:
- [ ] All presets work
- [ ] Custom colors apply
- [ ] Preview updates live
- [ ] Public page matches

---

## Phase 3: Drag-and-Drop & Link Styling

**Priority**: MEDIUM
**Dependencies**: Phase 2

### TASK-016: Install and Setup dnd-kit
**Complexity**: Low
**Agent Type**: general-purpose

**Prompt**:
```
Install dnd-kit for drag-and-drop functionality.

Commands to run in apps/web:
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

Verify installation:
- Check package.json has dependencies
- Run pnpm build to ensure no conflicts
```

**Acceptance Criteria**:
- [ ] Packages installed
- [ ] Build still passes
- [ ] No version conflicts

---

### TASK-017: Create SortableLinkList Component
**Complexity**: High
**Agent Type**: typescript-pro

**Prompt**:
```
Create a drag-and-drop sortable link list for bio page editor.

Location: apps/web/components/bio/SortableLinkList.tsx

Requirements:
1. Use @dnd-kit/core and @dnd-kit/sortable
2. Display links as draggable cards
3. Each card shows:
   - Drag handle (6 dots icon)
   - Link title
   - Link URL (truncated)
   - Edit button
   - Delete button
   - Visibility toggle
4. On drop, call onReorder callback
5. Props:
   - links: BioPageLink[]
   - onReorder: (orderings: {id: string, order: number}[]) => void
   - onEdit: (link: BioPageLink) => void
   - onDelete: (linkId: string) => void
   - onToggleVisibility: (linkId: string) => void

Add smooth animations during drag.
Handle empty state with "Add your first link" message.
```

**Acceptance Criteria**:
- [ ] Drag and drop works smoothly
- [ ] Order persists after drop
- [ ] All actions (edit/delete/toggle) work
- [ ] Animation feels polished

---

### TASK-018: Create LinkStyleEditor Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a LinkStyleEditor for customizing individual link appearance.

Location: apps/web/components/bio/LinkStyleEditor.tsx

Requirements:
1. Modal or slide-over panel
2. Edit fields:
   - Title (text input)
   - Description (optional text)
   - Icon (emoji picker or icon selector)
   - Thumbnail URL (image input)
   - Button color (ColorPicker, optional)
   - Text color (ColorPicker, optional)
3. Preview of the link with styles applied
4. Props:
   - link: BioPageLink
   - onSave: (updates: Partial<BioPageLink>) => void
   - onClose: () => void

Use shadcn/ui Dialog for the modal.
```

**Acceptance Criteria**:
- [ ] All fields editable
- [ ] Preview updates live
- [ ] Save persists changes
- [ ] Modal opens/closes properly

---

### TASK-019: Implement Reorder API with Optimistic Updates
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Implement optimistic updates for link reordering.

Location: apps/web/components/bio/BioPageBuilder.tsx (or separate hook)

Requirements:
1. When user drags to reorder:
   - Immediately update UI (optimistic)
   - Call PATCH /biopages/:id/links/reorder in background
   - On error, revert to previous order and show error toast
2. Create custom hook: useLinkReorder(bioPageId)
   - Returns: { reorderLinks, isReordering }
   - Handles API call and error recovery
3. Debounce rapid reorders (300ms)
4. Show subtle loading indicator during save

Use React Query or SWR patterns if project uses them.
```

**Acceptance Criteria**:
- [ ] Reorder feels instant
- [ ] API called correctly
- [ ] Errors handled gracefully
- [ ] Reverts on failure

---

### VERIFY-PHASE-3: Phase 3 Integration Test
**Complexity**: Low
**Agent Type**: test-automator

**Prompt**:
```
Verify Phase 3 drag-and-drop is complete:

Testing Checklist:
1. Open bio page editor
2. Add 3+ links if not present
3. Drag first link to last position
4. Verify order updates immediately
5. Refresh page - verify order persisted
6. Click edit on a link
7. Change icon and button color
8. Save and verify changes visible
9. Delete a link and verify removal

Run: pnpm build

Report issues found.
```

**Acceptance Criteria**:
- [ ] Drag and drop smooth
- [ ] Order persists on refresh
- [ ] Link styling works
- [ ] Delete works correctly

---

## Phase 4: Social Links & Layout Options

**Priority**: MEDIUM
**Dependencies**: Phase 2

### TASK-020: Create SocialLinksEditor Component
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create a SocialLinksEditor for managing social media icons.

Location: apps/web/components/bio/SocialLinksEditor.tsx

Requirements:
1. Support platforms: Instagram, Twitter/X, TikTok, YouTube, Facebook, LinkedIn, GitHub, Email, WhatsApp
2. UI:
   - List of added social links
   - "Add Social Link" button
   - Platform selector (icons or dropdown)
   - URL input field
3. Auto-detect platform from URL:
   - instagram.com -> Instagram
   - twitter.com, x.com -> Twitter
   - etc.
4. Validate URLs match platform
5. Reorder social links (simple up/down or drag)
6. Props:
   - socialLinks: SocialLink[]
   - onChange: (links: SocialLink[]) => void

Icons: Use Lucide icons or simple SVG icons for platforms.
```

**Acceptance Criteria**:
- [ ] All 9 platforms supported
- [ ] Auto-detection works
- [ ] URL validation works
- [ ] Reorder works

---

### TASK-021: Create LayoutSelector Component
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Create a LayoutSelector for choosing bio page link layout.

Location: apps/web/components/bio/LayoutSelector.tsx

Requirements:
1. Three layout options with visual previews:
   - stacked (vertical list - default)
   - grid (2-3 columns)
   - carousel (horizontal scroll - optional, can skip)
2. Each option shows mini preview of layout
3. Props:
   - value: LayoutType
   - onChange: (layout: LayoutType) => void

Use RadioGroup or custom toggle buttons.
```

**Acceptance Criteria**:
- [ ] Shows layout options
- [ ] Visual previews clear
- [ ] Selection works
- [ ] Default is stacked

---

### TASK-022: Update BioPageRenderer for Layouts
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Update BioPageRenderer to support multiple layout types.

Location: apps/web/components/bio/BioPageRenderer.tsx

Requirements:
1. stacked layout: Vertical list (current behavior)
2. grid layout:
   - 2 columns on mobile
   - 3 columns on desktop
   - Equal sized link cards
3. Both layouts responsive
4. Social links always rendered as icon row (same for all layouts)

Use CSS grid or flexbox for layouts.
Test with varying number of links (1, 2, 5, 10).
```

**Acceptance Criteria**:
- [ ] Stacked layout unchanged
- [ ] Grid layout works
- [ ] Responsive on all screens
- [ ] Social icons always visible

---

### TASK-023: Render Social Links on Public Page
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Add social links rendering to BioPageRenderer.

Location: apps/web/components/bio/BioPageRenderer.tsx

Requirements:
1. Display social icons in a row (below avatar, above links)
2. Each icon:
   - Clickable link to social URL
   - Uses platform-specific icon
   - Hover effect
   - Opens in new tab
3. Style to match theme colors
4. Hide section if no social links

Create platform icon mapping component if needed.
```

**Acceptance Criteria**:
- [ ] Social icons display
- [ ] Links open correctly
- [ ] Theme colors applied
- [ ] Hidden when empty

---

### VERIFY-PHASE-4: Phase 4 Integration Test
**Complexity**: Low
**Agent Type**: test-automator

**Prompt**:
```
Verify Phase 4 social links and layouts:

Testing Checklist:
1. Add social links:
   - Add Instagram link
   - Add Twitter link
   - Verify auto-detection works
2. Switch to grid layout
   - Verify preview shows grid
   - View public page - verify grid layout
3. Switch back to stacked
4. View public page - verify social icons visible
5. Click social icons - verify they open correct URLs

Run: pnpm build

Report issues.
```

**Acceptance Criteria**:
- [ ] Social links save and display
- [ ] Grid layout works
- [ ] Icons clickable
- [ ] Build passes

---

## Phase 5: Analytics

**Priority**: MEDIUM
**Dependencies**: Phase 1

### TASK-024: Create BioPageAnalytics Database Model
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Add BioPageAnalytics model for tracking bio page events.

Location: packages/database/prisma/schema.prisma

Add model:
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

Add relation to BioPage:
  analytics BioPageAnalytics[]

Run db:generate and db:push after adding.
```

**Acceptance Criteria**:
- [ ] Model added
- [ ] Indexes created
- [ ] Relation established
- [ ] Prisma client updated

---

### TASK-025: Create Analytics Tracking Endpoint
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Create endpoint for tracking bio page analytics.

Location: apps/api/src/biopages/

Add endpoint: POST /biopages/:id/track (public, no auth)

Request body:
{
  eventType: 'page_view' | 'link_click',
  bioLinkId?: string, // required if link_click
  referrer?: string
}

Implementation:
1. Parse user agent for device/browser/os
2. Get country from IP (use existing geo service if available, or skip)
3. Create BioPageAnalytics record
4. Return 204 No Content
5. Non-blocking (don't slow down client)

Rate limit: 10 requests per IP per minute per page.
```

**Acceptance Criteria**:
- [ ] Endpoint accepts events
- [ ] User agent parsed
- [ ] Records created
- [ ] Rate limited

---

### TASK-026: Add Tracking to Public Bio Page
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Add analytics tracking to public bio page.

Location: apps/web/app/bio/[slug]/page.tsx and BioPageRenderer.tsx

Requirements:
1. Track page_view on page load (once per session)
2. Track link_click when user clicks a link
3. Use navigator.sendBeacon for non-blocking requests
4. Store session flag to prevent duplicate page views
5. Pass referrer from document.referrer

Create tracking utility:
apps/web/lib/bio-analytics.ts
- trackBioPageView(pageId)
- trackBioLinkClick(pageId, linkId)
```

**Acceptance Criteria**:
- [ ] Page view tracked on load
- [ ] Link clicks tracked
- [ ] Non-blocking
- [ ] No duplicate views per session

---

### TASK-027: Create Analytics Summary Endpoint
**Complexity**: Medium
**Agent Type**: backend-architect

**Prompt**:
```
Create endpoints for bio page analytics data.

Location: apps/api/src/biopages/

Add endpoints (all require auth):

1. GET /biopages/:id/analytics/summary
   Returns: { totalViews, totalClicks, uniqueVisitors, topCountries, topReferrers }

2. GET /biopages/:id/analytics/timeseries?period=7d|30d|90d
   Returns: { data: [{date, views, clicks}] }

3. GET /biopages/:id/analytics/clicks
   Returns: { links: [{linkId, title, clicks}] }

Use Prisma aggregations for efficient queries.
Include proper date filtering.
```

**Acceptance Criteria**:
- [ ] Summary returns correct totals
- [ ] Timeseries returns daily data
- [ ] Per-link clicks accurate
- [ ] Auth required

---

### TASK-028: Create Analytics Dashboard Page
**Complexity**: High
**Agent Type**: typescript-pro

**Prompt**:
```
Build the analytics dashboard for bio pages.

Location: apps/web/app/dashboard/biopages/[slug]/analytics/page.tsx

Requirements:
1. Summary cards at top:
   - Total views
   - Total clicks
   - Unique visitors (if available)
2. Time period selector (7d, 30d, 90d)
3. Line chart showing views over time
4. Bar chart showing clicks per link
5. Top referrers list
6. Top countries list (if geo data available)

Use existing chart library in project (recharts or similar).
Match dashboard design patterns from other analytics pages.
```

**Acceptance Criteria**:
- [ ] All stats displayed
- [ ] Charts render correctly
- [ ] Period filter works
- [ ] Responsive design

---

### VERIFY-PHASE-5: Phase 5 Integration Test
**Complexity**: Low
**Agent Type**: test-automator

**Prompt**:
```
Verify Phase 5 analytics:

Testing Checklist:
1. View public bio page (incognito)
2. Click on a link
3. Login to dashboard
4. Go to bio page analytics
5. Verify page view counted
6. Verify link click counted
7. Change time period - verify chart updates
8. Test with multiple pages

Run: pnpm build

Report issues.
```

**Acceptance Criteria**:
- [ ] Views tracked
- [ ] Clicks tracked
- [ ] Dashboard shows data
- [ ] Charts work

---

## Phase 6: Advanced Features

**Priority**: LOW
**Dependencies**: Phase 1-5

### TASK-029: Add QR Code Generation for Bio Pages
**Complexity**: Low
**Agent Type**: backend-architect

**Prompt**:
```
Add QR code endpoint for bio pages.

Location: apps/api/src/biopages/

Add endpoint: GET /biopages/:id/qr?size=300&format=png

Use existing QR service from apps/api/src/qr/.
Generate QR for public bio page URL.
Support size and format parameters.
```

**Acceptance Criteria**:
- [ ] QR endpoint works
- [ ] Uses existing QR service
- [ ] Size configurable

---

### TASK-030: Add Share Modal with QR
**Complexity**: Medium
**Agent Type**: typescript-pro

**Prompt**:
```
Create share modal for bio pages.

Location: apps/web/components/bio/ShareModal.tsx

Features:
1. Copy URL button
2. QR code display
3. Download QR button
4. Social share buttons (Twitter, Facebook, WhatsApp)
5. Embed code (iframe snippet)

Use from bio page editor and dashboard.
```

**Acceptance Criteria**:
- [ ] Modal opens
- [ ] Copy works
- [ ] QR displays
- [ ] Download works

---

### TASK-031: Add SEO Meta Tags to Public Page
**Complexity**: Low
**Agent Type**: typescript-pro

**Prompt**:
```
Add Open Graph and Twitter Card meta tags to public bio pages.

Location: apps/web/app/bio/[slug]/page.tsx

Add metadata:
- title: bio page title
- description: bio page description
- og:image: avatar URL or generated image
- twitter:card: summary

Use Next.js metadata API.
```

**Acceptance Criteria**:
- [ ] OG tags present
- [ ] Twitter card works
- [ ] Dynamic per page

---

## Final Verification

### FINAL-001: Complete E2E Test Suite
**Complexity**: High
**Agent Type**: test-automator

**Prompt**:
```
Create/update E2E tests for Bio Page module.

Location: apps/web/e2e/biopage.spec.ts

Cover all scenarios from requirements doc (BIO-001 through BIO-063).
Focus on critical paths:
- Create bio page
- Add and reorder links
- Apply theme
- View public page
- Analytics tracking

Use Playwright with existing test patterns.
```

**Acceptance Criteria**:
- [ ] All critical tests pass
- [ ] Coverage complete
- [ ] CI integration works

---

### FINAL-002: Build and Lint Check
**Complexity**: Low
**Agent Type**: general-purpose

**Prompt**:
```
Final verification of Bio Page module:

Run and report results:
1. pnpm lint (fix any issues)
2. pnpm build (must pass)
3. pnpm --filter web test (unit tests)
4. npx playwright test e2e/biopage.spec.ts

Document any remaining issues or tech debt.
```

**Acceptance Criteria**:
- [ ] Lint passes
- [ ] Build passes
- [ ] Unit tests pass
- [ ] E2E tests pass

---

## Summary

| Phase | Tasks | Priority | Est. Complexity |
|-------|-------|----------|-----------------|
| Setup | 1 | Pre-req | Low |
| Phase 1 | 6 + verify | HIGH | Medium |
| Phase 2 | 9 + verify | HIGH | Medium-High |
| Phase 3 | 4 + verify | MEDIUM | Medium |
| Phase 4 | 4 + verify | MEDIUM | Low-Medium |
| Phase 5 | 5 + verify | MEDIUM | Medium |
| Phase 6 | 3 | LOW | Low-Medium |
| Final | 2 | Required | Medium |

**Total Tasks**: ~35 implementation tasks + verification steps

---

## Notes for Agent Assignment

1. **Sequential Dependencies**: Phase 1 must complete before Phase 2. Phases 3-5 can run partially in parallel after Phase 2.

2. **Agent Type Selection**:
   - `backend-architect`: API, database, NestJS work
   - `typescript-pro`: React components, frontend logic
   - `test-automator`: Testing tasks
   - `Explore`: Research and analysis
   - `general-purpose`: Setup and mixed tasks

3. **Context Sharing**: Each task should reference existing code patterns in the project.

4. **Verification**: Run verification tasks after each phase before proceeding.

5. **Error Handling**: Each task should include proper error handling matching project patterns.
