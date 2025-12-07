# Module 1.9: Link-in-Bio (Mini-Page) - Development Todolist

> **Status**: ~85-90% Complete (Production Ready)
> **Priority**: Low - Minor enhancements only
> **Reference**: `requirements/1-9-link-in-bio-plan.md`

---

## Overview

Link-in-Bio is **production-ready** with excellent implementation. All tasks below are enhancements.

**Current Features**:
- Bio page CRUD with organization scope
- Beautiful split-view editor with live preview
- 6 theme presets (minimal, dark, colorful, neon, gradient, pastel)
- Full theme customization (colors, backgrounds, button styles)
- Drag-and-drop link management (@dnd-kit)
- Per-link style customization
- Social media integration (9 platforms)
- QR code sharing
- Analytics tracking (page views, link clicks)
- SEO-optimized public pages
- Rate limiting on tracking
- RBAC and audit logging

---

## Phase 1: Minor Enhancements (Optional)

### Task 1.9.1: Add Analytics Dashboard UI
- [ ] **Create BioAnalyticsDashboard component**
  - File: `apps/web/components/bio/BioAnalyticsDashboard.tsx`
  - Note: Backend endpoints already work (/analytics/summary, /analytics/timeseries)
  - Display:
    - Total views, clicks, unique visitors cards
    - Time-series chart (views + clicks over time)
    - Top links by clicks table
    - Geographic breakdown (optional)

- [ ] **Add analytics tab to bio page editor**
  - Navigate to analytics view from editor
  - Link from bio page list

### Task 1.9.2: Add Font Selection UI
- [ ] **Create FontSelector component**
  - File: `apps/web/components/bio/FontSelector.tsx`
  - Available fonts:
    - Inter (sans-serif)
    - Poppins (sans-serif)
    - Playfair Display (serif)
    - JetBrains Mono (monospace)
    - Roboto (sans-serif)
    - Open Sans (sans-serif)
  - Preview text in each font
  - Apply to custom theme

- [ ] **Add font picker to theme customization**
  - Show when "Custom" theme selected
  - Update theme.fontFamily

### Task 1.9.3: Complete E2E Test Coverage
- [ ] **Add link editing test**
  - Test ID: BIO-016
  - Open link style editor
  - Update title, description, colors
  - Save and verify changes

- [ ] **Add link reorder test**
  - Test ID: BIO-017
  - Drag link to new position
  - Verify order changed
  - Verify reorder API called

- [ ] **Add analytics dashboard test**
  - Test ID: BIO-052
  - Navigate to analytics view
  - Verify stats cards render
  - Verify chart renders

---

## Phase 2: Additional Features (Future)

### Task 1.9.4: Custom CSS Support
- [ ] Add customCss field to BioPage model
- [ ] CSS editor in advanced settings
- [ ] Sanitize CSS to prevent XSS

### Task 1.9.5: Block Types (Non-Link Content)
- [ ] Create BioBlock model for headers, text, dividers
- [ ] Block type selector in editor
- [ ] Render blocks in public page

### Task 1.9.6: Link Scheduling
- [ ] Add startDate/endDate to BioPageLink
- [ ] Schedule links to appear/disappear
- [ ] Show scheduling UI in link editor

### Task 1.9.7: A/B Testing
- [ ] Create bio page variants
- [ ] Split traffic between variants
- [ ] Show conversion comparison

---

## Unit Tests (Optional)

### Bio Service Tests
- [ ] Create bio page with all fields
- [ ] Update theme configuration
- [ ] Reorder links transactionally
- [ ] Track page view analytics
- [ ] Track link click analytics

---

## E2E Tests Required

```
File: apps/web/e2e/bio.spec.ts (extend)
```

### Existing Tests (11)
- BIO-001: Create Bio Page
- BIO-002: Edit Title/Description
- BIO-010: Editor UI Structure
- BIO-013: Add Link from Dropdown
- BIO-015: Remove Link
- BIO-020: Theme Selector Visibility
- BIO-021: Select Predefined Theme
- BIO-030: Add Social Link
- BIO-040: Public Page Rendering
- BIO-044: 404 Error Handling
- BIO-051: Share with QR Code

### New Tests
- [ ] BIO-016: Edit link button colors
- [ ] BIO-017: Reorder links via drag-drop
- [ ] BIO-022: Select custom theme colors
- [ ] BIO-031: Edit social link URL
- [ ] BIO-032: Delete social link
- [ ] BIO-041: Track link click on public page
- [ ] BIO-045: Publish/unpublish bio page
- [ ] BIO-052: View analytics summary
- [ ] BIO-053: View clicks by link table

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] Analytics dashboard UI displays stats
- [ ] Font selector works in theme customization
- [ ] All E2E tests pass including new ones

---

## Files to Create/Modify Summary

### New Files (Optional)
| File | Purpose |
|------|---------|
| `apps/web/components/bio/BioAnalyticsDashboard.tsx` | Analytics visualization |
| `apps/web/components/bio/FontSelector.tsx` | Font picker UI |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/web/app/dashboard/bio/[id]/page.tsx` | Add analytics tab |
| `apps/web/components/bio/BioPageBuilder.tsx` | Add font selector |
| `apps/web/e2e/bio.spec.ts` | Add new test cases |

---

## Notes

**No Blockers**: Bio pages feature is ready for production.

**Strengths**:
- Beautiful, intuitive editor
- 6 theme presets with full customization
- Smooth drag-and-drop
- Comprehensive analytics tracking
- Social media integration (9 platforms)
- QR code sharing
- SEO-optimized public pages

**Minor Gaps**:
- Analytics dashboard UI was removed (backend works)
- Font selection not exposed in UI
- Some E2E test coverage gaps

---

*Generated from: 1-9-link-in-bio-plan.md*
*Last Updated: 2025-12-08*
