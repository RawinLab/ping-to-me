# Tasks: Create Shortened URL

**Feature**: Create Shortened URL
**Status**: Plan
**Spec**: [spec.md](spec.md)

## Phase 1: Setup

- [x] T001 Install backend dependencies (`nanoid`, `qrcode`, `@types/qrcode`) in `apps/api`
- [x] T002 Install KV sync dependencies (e.g., `cloudflare` SDK or just `fetch`) in `apps/api`
- [x] T003 Create shared types `CreateLinkDto`, `LinkResponse`, `LinkStatus` in `packages/types/src/links.ts`
- [x] T004 Update `packages/types/src/index.ts` to export new types

## Phase 2: Foundational

- [x] T005 Update Prisma schema with `Link` and `BlockedDomain` models in `packages/database/prisma/schema.prisma`
- [x] T006 Run `pnpm db:push` to apply schema changes
- [x] T007 Create `LinksModule`, `LinksService`, `LinksController` in `apps/api/src/links/`
- [x] T008 Implement `BlockedDomain` seeding script or initial migration

## Phase 3: User Story 1 - Create Advanced Short Link (P1)

**Goal**: Users can create short links with metadata and security checks.
**Independent Test**: Create a link via API/UI and verify DB persistence and blocked domain rejection.

- [x] T009 [US1] Implement `create` method in `LinksService` with basic validation (URL format)
- [x] T010 [US1] Implement `BlockedDomain` check in `LinksService` (reject if domain in blacklist)
- [x] T011 [US1] Implement `POST /links` endpoint in `LinksController`
- [x] T012 [US1] Implement `CreateLinkForm` component in `apps/web/components/links/CreateLinkForm.tsx`
- [x] T013 [US1] Create `/dashboard/links/new` page (or modal) in `apps/web/app/dashboard/links/page.tsx`
- [x] T014 [US1] Integrate `POST /links` API in frontend form

## Phase 4: User Story 2 - Custom & Auto-Generated Slugs (P1)

**Goal**: Support custom slugs and robust random generation.
**Independent Test**: Create links with custom slugs (success/fail on duplicate) and random slugs.

- [x] T015 [US2] Implement `nanoid` slug generation in `LinksService` (if slug not provided)
- [x] T016 [US2] Implement slug uniqueness check and retry logic in `LinksService`
- [x] T017 [US2] Implement reserved slug check (e.g., "api", "admin") in `LinksService`
- [x] T018 [US2] Update `CreateLinkForm` to allow custom slug input and show errors

## Phase 5: User Story 3 - Link Organization & Tracking (P2)

**Goal**: Manage links (list, filter) and ensure tracking params work.
**Independent Test**: List links with pagination/filtering; verify redirect preserves params.

- [x] T019 [US3] Implement `findAll` method in `LinksService` with pagination and filtering (tags, search)
- [x] T020 [US3] Implement `GET /links` endpoint in `LinksController`
- [x] T021 [US3] Create `LinksTable` component in `apps/web/components/links/LinksTable.tsx`
- [x] T022 [US3] Update `/dashboard/links/page.tsx` to list user's links
- [x] T023 [US3] Implement KV sync logic in `LinksService` (push to Cloudflare KV on create/update)
- [x] T024 [US3] Update `apps/redirector/src/index.ts` to handle redirects from KV (ensure logic matches new requirements)

## Phase 6: Polish & Cross-Cutting

- [x] T025 Implement QR code generation in `LinksService` (return Data URI in response)
- [x] T026 Display QR code in `LinksTable` or details view
- [x] T027 Implement Expiration Date check in `apps/redirector` (store expiration in KV value)
- [x] T028 Implement Password Protection check in `apps/redirector` (store hash in KV, serve password page if needed)
- [x] T029 Add unit tests for `LinksService` (slug generation, validation)
- [x] T030 Add E2E tests for `LinksController`

## Dependencies

- Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6

## Implementation Strategy

- Start with the database models and basic API.
- Implement the core creation logic (US1 & US2) to unblock frontend.
- Build the frontend form.
- Add listing logic.
- Implement KV sync in API and update Redirector worker to handle new logic (expiration, etc.).
- Polish with QR codes and advanced security features.
