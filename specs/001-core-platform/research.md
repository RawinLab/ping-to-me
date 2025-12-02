# Research & Architecture: Core Platform

## Technology Stack Selection

### 1. Monorepo Structure (Turborepo)

- **Why**: Efficient build caching, shared dependencies (UI, DB, Types), unified workflow.
- **Workspaces**:
  - `apps/web`: Next.js App Router. Best for SEO, Server Components, and Shadcn integration.
  - `apps/api`: NestJS. Robust, modular architecture for complex business logic (Auth, Billing, Org Management).
  - `apps/redirector`: Cloudflare Workers (Hono). Ultra-low latency edge execution for the critical path (redirects).
  - `packages/database`: Prisma ORM. Type-safe DB access shared by API and Scripts.
  - `packages/ui`: Shadcn/ui components. Consistent design system.

### 2. Database (Supabase / PostgreSQL)

- **Why**: Relational integrity is crucial for multi-tenancy (Orgs -> Links). Supabase provides Auth helpers (optional) and easy RLS if needed, plus excellent dashboard.
- **Schema Strategy**:
  - Centralized `User` and `Organization` tables.
  - `Link` table indexed by `slug` and `org_id`.
  - `ClickEvent` table partitioned by time (hypertable if using Timescale, or standard Postgres partitioning) to handle high write volume.

### 3. Image Storage (Cloudflare R2)

- **Why**: S3-compatible, zero egress fees, edge caching. Perfect for QR codes and User Avatars.
- **Integration**: `aws-sdk` v3 in NestJS.

### 4. Redirect Engine (Hono on Cloudflare Workers)

- **Why**: "Fastest technology" requirement.
- **Mechanism**:
  - Worker receives request `GET /:slug`.
  - Checks KV (Key-Value) cache for `slug -> destination`.
  - If miss, calls Supabase (via REST or connection pool) to fetch link.
  - Asynchronously pushes `ClickEvent` to a queue (Cloudflare Queues or direct HTTP to API) to avoid blocking the redirect.
  - Returns `301/302` to user.

## Architecture Diagram

```mermaid
graph TD
    User[User/Visitor] -->|Visit Short Link| Edge[Redirector (CF Worker)]
    User -->|Manage Links| Web[Web App (Next.js)]

    Edge -->|Cache Hit| KV[Cloudflare KV]
    Edge -->|Cache Miss| DB[(Supabase Postgres)]
    Edge -.->|Async Log| Queue[Analytics Queue]

    Web -->|API Req| API[Backend API (NestJS)]
    API --> DB
    API -->|Upload| R2[Cloudflare R2]

    Queue -->|Process| API
```

## Performance Strategy

1.  **Edge Caching**: Hot links stored in Cloudflare KV. Latency < 50ms.
2.  **Async Analytics**: Redirect happens immediately; logging happens in background.
3.  **Image Optimization**: Next.js Image component + R2 public access.
