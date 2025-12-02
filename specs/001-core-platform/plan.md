# Implementation Plan: Core Platform

**Branch**: `001-core-platform` | **Date**: 2025-12-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-core-platform/spec.md`

## Summary

Implementation of the core PingTO.Me platform including User Auth, Link Management, and High-Performance Redirects. The system will be built as a Monorepo using Turborepo, featuring a Next.js frontend (Shadcn UI), NestJS backend API, and a Cloudflare Workers-based redirector for maximum speed. Data will be stored in Supabase (PostgreSQL) with images in Cloudflare R2.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**:

- Frontend: Next.js 14+, React 18, Shadcn UI, TailwindCSS
- Backend: NestJS 10+, Prisma ORM
- Redirector: Hono (Edge), Cloudflare Workers
- Infra: Turborepo, Docker (local dev)
  **Storage**: Supabase (PostgreSQL), Cloudflare R2 (Object Storage)
  **Testing**: Vitest (Unit), Playwright (E2E), k6 (Performance)
  **Target Platform**: Vercel (Web/API), Cloudflare Workers (Redirector)
  **Performance Goals**: <100ms redirect latency (p95), 1000 req/s capacity
  **Constraints**: Strict type safety (shared types), Edge compatibility for redirector

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Scalability**: Cloudflare Workers + Supabase handles high volume.
- **Security**: OAuth/AuthZ in NestJS, RLS in Supabase (optional, but API-level enforcement preferred).
- **API-First**: NestJS provides full REST API.
- **Data Integrity**: Postgres transactional integrity.
- **Multi-Tenancy**: Org-based schema design.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-platform/
├── plan.md              # This file
├── research.md          # Architecture & Tech Stack decisions
├── data-model.md        # Database Schema (Prisma)
├── quickstart.md        # Developer setup guide
├── contracts/           # API Definitions
└── tasks.md             # Implementation Tasks
```

### Source Code (repository root)

```text
apps/
├── web/                 # Next.js + Shadcn (Management Dashboard)
├── api/                 # NestJS (Core REST API)
└── redirector/          # Cloudflare Worker (Hono) - High perf redirects

packages/
├── database/            # Prisma Client & Schema (Supabase)
├── ui/                  # Shared Shadcn UI components
├── config/              # Shared TSConfig, ESLint
└── types/               # Shared DTOs and Interfaces
```

**Structure Decision**: Monorepo (Turborepo) chosen to share types and UI code between apps while keeping services deployable independently.

## Complexity Tracking

| Violation           | Why Needed                        | Simpler Alternative Rejected Because              |
| ------------------- | --------------------------------- | ------------------------------------------------- |
| Monorepo            | Shared types & UI between Web/API | Multiple repos cause drift and versioning pain    |
| Separate Redirector | <100ms latency requirement        | NestJS too heavy/slow for raw redirect throughput |
