# Tasks: Landing Page

**Feature**: Landing Page
**Status**: Plan
**Spec**: [spec.md](spec.md)

## Phase 1: Setup

- [x] T001 Create landing page route group in `apps/web/app/(landing)`
- [x] T002 Create landing page layout in `apps/web/app/(landing)/layout.tsx`
- [x] T003 Create landing page root in `apps/web/app/(landing)/page.tsx`
- [x] T004 Create components directory `apps/web/components/landing`

## Phase 2: Foundational

- [x] T005 Create `PricingPlan` interface in `apps/web/types/landing.ts`
- [x] T006 Define hardcoded pricing data in `apps/web/config/pricing.ts`

## Phase 3: User Story 1 - View Landing Page Overview (P1)

**Goal**: Visitor sees clear value proposition immediately.
**Test**: Visit `/` and verify Hero section.

- [x] T007 [US1] Create `Hero` component in `apps/web/components/landing/Hero.tsx`
- [x] T008 [US1] Implement Hero headline, subheadline, and CTA
- [x] T009 [US1] Integrate `Hero` into `apps/web/app/(landing)/page.tsx`

## Phase 4: User Story 2 - Explore Features (P1)

**Goal**: Visitor can evaluate key features.
**Test**: Scroll to Features section and verify content.

- [x] T010 [US2] Create `Features` component in `apps/web/components/landing/Features.tsx`
- [x] T011 [US2] Implement feature cards (Links, Analytics, QR, Bio Pages)
- [x] T012 [US2] Integrate `Features` into `apps/web/app/(landing)/page.tsx`

## Phase 5: User Story 3 - View Pricing Plans (P1)

**Goal**: Visitor can see pricing options.
**Test**: Scroll to Pricing section and verify tiers.

- [x] T013 [US3] Create `Pricing` component in `apps/web/components/landing/Pricing.tsx`
- [x] T014 [US3] Implement pricing cards using data from `apps/web/config/pricing.ts`
- [x] T015 [US3] Integrate `Pricing` into `apps/web/app/(landing)/page.tsx`

## Phase 6: User Story 4 - Navigation (P1)

**Goal**: Visitor can navigate to Login/Register.
**Test**: Verify Header buttons and Footer links.

- [x] T016 [US4] Create `LandingHeader` component in `apps/web/components/landing/LandingHeader.tsx`
- [x] T017 [US4] Implement Login/Get Started buttons in Header
- [x] T018 [US4] Create `LandingFooter` component in `apps/web/components/landing/LandingFooter.tsx`
- [x] T019 [US4] Integrate Header and Footer into `apps/web/app/(landing)/layout.tsx`

## Phase 7: Polish & Cross-Cutting

- [x] T020 Verify mobile responsiveness for all sections
- [x] T021 Ensure accessibility (aria-labels, contrast)
- [x] T022 Verify CTA links for logged-in vs logged-out users

## Dependencies

- Phase 1 -> Phase 2 -> Phase 3, 4, 5, 6 (Parallelizable) -> Phase 7

## Implementation Strategy

- Implement components in isolation first.
- Integrate into the page one by one.
- Use Shadcn UI components where applicable (Cards, Buttons).
