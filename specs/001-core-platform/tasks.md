---
description: "Task list for Core Platform implementation"
---

# Tasks: Core Platform

**Input**: Design documents from `/specs/001-core-platform/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: [US1], [US2], etc.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Turborepo structure with apps (web, api, redirector) and packages (ui, database, config, types)
- [ ] T002 Initialize `packages/config` with shared TSConfig and ESLint rules
- [ ] T003 Initialize `packages/ui` with Shadcn UI installation and Tailwind config
- [ ] T004 Initialize `packages/types` with shared DTOs and interfaces
- [ ] T005 Initialize `packages/database` with Prisma and Supabase connection
- [ ] T006 Initialize `apps/api` (NestJS) with Docker and basic configuration
- [ ] T007 Initialize `apps/web` (Next.js) with Shadcn and Tailwind
- [ ] T008 Initialize `apps/redirector` (Hono/Cloudflare Workers) with Wrangler config

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T009 Define Prisma schema in `packages/database` matching data-model.md
- [ ] T010 Run initial migration to create Supabase tables
- [ ] T011 [P] Implement AuthGuard in `apps/api` (JWT/Supabase Auth)
- [ ] T012 [P] Configure Cloudflare R2 client in `apps/api`
- [ ] T013 [P] Configure Cloudflare KV binding in `apps/redirector`
- [ ] T014 [P] Create base repository pattern in `apps/api` for standardized DB access
- [ ] T015 Setup shared error handling and logging across all apps

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Secure User Access & Core Shortening (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, log in, and create short links that redirect correctly.
**Independent Test**: Register -> Login -> Shorten URL -> Visit Short URL -> Redirect works.

### Implementation for User Story 1

- [ ] T016 [US1] Create `AuthService` in `apps/api` for User registration/login
- [ ] T017 [US1] Create `LinkService` in `apps/api` with `createShortLink` method (slug generation)
- [ ] T018 [US1] Implement `POST /auth/register` and `POST /auth/login` endpoints in `apps/api`
- [ ] T019 [US1] Implement `POST /links` endpoint in `apps/api`
- [ ] T020 [US1] Implement Redirect Logic in `apps/redirector` (KV check -> DB fallback)
- [ ] T021 [US1] Implement `Login` and `Register` pages in `apps/web`
- [ ] T022 [US1] Implement `Dashboard` page in `apps/web` with "Create Link" form
- [ ] T023 [US1] Integrate `apps/web` with `apps/api` for auth and link creation
- [ ] T024 [US1] Implement Spam Protection (Google Safe Browsing check) in `LinkService`

**Checkpoint**: MVP Functional. Users can create and use short links.

---

## Phase 4: User Story 2 - Link Management & Analytics (Priority: P2)

**Goal**: Users can manage links and view analytics.
**Independent Test**: Edit link -> Verify change. Visit link -> Verify analytics count increases.

### Implementation for User Story 2

- [ ] T025 [US2] Update `LinkService` in `apps/api` with `update`, `delete`, `list` methods
- [ ] T026 [US2] Implement `PATCH /links/:id`, `DELETE /links/:id`, `GET /links` endpoints
- [ ] T027 [US2] Implement Async Analytics Queue in `apps/redirector` (send click event to API/Queue)
- [ ] T028 [US2] Implement `AnalyticsService` in `apps/api` to ingest click events
- [ ] T029 [US2] Implement `GET /links/:id/analytics` endpoint in `apps/api`
- [ ] T030 [US2] Update `apps/web` Dashboard to list user links with Edit/Delete actions
- [ ] T031 [US2] Create `AnalyticsView` component in `apps/web` with charts (Recharts/Tremor)

---

## Phase 5: User Story 3 - Advanced Link Features (Priority: P3)

**Goal**: Custom domains, QR codes, and Link-in-bio.
**Independent Test**: Add domain -> Verify. Generate QR -> Scan. Build Bio Page -> View.

### Implementation for User Story 3

- [ ] T032 [US3] Implement `DomainService` in `apps/api` (add, verify DNS)
- [ ] T033 [US3] Implement `QrCodeService` in `apps/api` (generate image, upload to R2)
- [ ] T034 [US3] Implement `BioPageService` in `apps/api` (CRUD bio pages)
- [ ] T035 [US3] Update `apps/redirector` to handle Custom Domain routing
- [ ] T036 [US3] Implement `BioPageBuilder` UI in `apps/web` (Fixed Templates selection)
- [ ] T037 [US3] Implement QR Code download modal in `apps/web`

---

## Phase 6: User Story 4 - Organization & Team Management (Priority: P3)

**Goal**: Team collaboration and RBAC.
**Independent Test**: Invite member -> Member accepts -> Member tries restricted action -> Denied.

### Implementation for User Story 4

- [ ] T038 [US4] Implement `OrganizationService` in `apps/api` (create, invite member)
- [ ] T039 [US4] Implement RBAC Guards in `apps/api` (Owner/Admin/Editor/Viewer)
- [ ] T040 [US4] Update all Link/Domain endpoints to enforce Org-level permissions
- [ ] T041 [US4] Implement `TeamSettings` page in `apps/web` (Member list, Invite form)

---

## Phase 7: User Story 5 - Developer Platform (Priority: P3)

**Goal**: API Keys and Webhooks.
**Independent Test**: Create Key -> Call API -> Success. Trigger Event -> Webhook fires.

### Implementation for User Story 5

- [ ] T042 [US5] Implement `ApiKeyService` in `apps/api` (generate, revoke, validate)
- [ ] T043 [US5] Implement `WebhookService` in `apps/api` (register, dispatch events)
- [ ] T044 [US5] Implement `APIKeyGuard` for external API access
- [ ] T045 [US5] Implement `DeveloperSettings` page in `apps/web`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 Setup CI/CD pipelines (GitHub Actions) for all apps
- [ ] T047 Implement Rate Limiting (ThrottlerGuard) in `apps/api`
- [ ] T048 Run load tests (k6) against `apps/redirector` to verify <100ms latency
- [ ] T049 Finalize UI styling and responsiveness in `apps/web`
- [ ] T050 Write API Documentation (Swagger/OpenAPI)

---

## Dependencies & Execution Order

1. **Setup & Foundation (Phase 1-2)**: BLOCKS EVERYTHING.
2. **User Story 1 (MVP)**: BLOCKS other stories. Must be solid.
3. **User Story 2**: Depends on US1.
4. **User Story 3, 4, 5**: Can run in parallel after US2, or sequentially.

## Implementation Strategy

1. **MVP First**: Focus strictly on T001-T024. Get a working shortener live.
2. **Iterate**: Add Analytics (US2) next as it's core to the value prop.
3. **Expand**: Add Pro features (US3) and Team features (US4) based on priority.
