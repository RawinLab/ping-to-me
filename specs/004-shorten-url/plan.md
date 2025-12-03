# Implementation Plan: Create Shortened URL

**Branch**: `004-shorten-url` | **Date**: 2025-12-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-shorten-url/spec.md`

## Summary

This feature implements the core URL shortening functionality, allowing users to create short links with random or custom slugs. It includes advanced features like metadata (tags, campaigns), security (password protection, blocked domains), and options (redirect type, QR codes). The implementation will use the existing NestJS backend (`apps/api`) for management and sync data to Cloudflare KV for the `apps/redirector` service to handle high-performance redirects.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 20+
**Primary Dependencies**:

- Backend: NestJS, Prisma, `nanoid` (for slug generation), `qrcode` (for QR generation), Cloudflare KV API (for sync)
- Frontend: Next.js 14 (App Router), React Hook Form, Zod, Shadcn UI
- Redirector: Cloudflare Workers (Hono)
  **Storage**: PostgreSQL (via Prisma) + Cloudflare KV (for redirects)
  **Testing**: Jest (Unit/E2E)
  **Target Platform**: Web (Vercel/Docker) + Cloudflare Workers
  **Project Type**: Monorepo (Turbo) - Web App + API + Worker
  **Performance Goals**: Link creation < 500ms, Redirect < 50ms (Edge)
  **Constraints**: Must handle concurrent slug generation and check against blocked domains efficiently. KV sync must be reliable.
  **Scale/Scope**: Core feature, new database models, API endpoints, frontend forms, and worker logic.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Scalability & Performance First**: Redirects handled by Edge Worker (KV) for minimal latency.
- [x] **II. Security & Privacy by Design**: Input validation, blocked domain checks, and password protection included.
- [x] **III. API-First Architecture**: All logic exposed via REST API (`apps/api`) before frontend consumption.
- [x] **IV. Data Integrity & Analytics Accuracy**: Relational integrity via Prisma.
- [x] **V. Multi-Tenancy & Role-Based Access**: Links associated with Users (and implicitly Organizations/Workspaces).

## Project Structure

### Documentation (this feature)

```text
specs/004-shorten-url/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── src/
│   │   ├── links/           # New module
│   │   │   ├── links.controller.ts
│   │   │   ├── links.service.ts
│   │   │   ├── links.module.ts
│   │   │   └── dto/
│   │   └── prisma/          # Existing
│   └── test/
├── redirector/              # Existing Worker
│   ├── src/
│   │   └── index.ts         # Update redirect logic
│   └── wrangler.toml        # Config
└── web/
    ├── app/
    │   └── dashboard/
    │       └── links/       # New page
    ├── components/
    │   └── links/           # New components (CreateLinkForm, etc.)
    └── lib/
        └── api.ts           # Existing API client
packages/
├── database/
│   └── prisma/
│       └── schema.prisma    # Update schema
└── types/
    └── src/
        └── links.ts         # Shared types
```

**Structure Decision**: Standard NestJS module structure for backend and Next.js App Router for frontend. Redirector logic resides in `apps/redirector`.

## Complexity Tracking

| Violation          | Why Needed                 | Simpler Alternative Rejected Because                         |
| ------------------ | -------------------------- | ------------------------------------------------------------ |
| Cloudflare KV Sync | High-performance redirects | Database redirects are too slow for global edge performance. |
