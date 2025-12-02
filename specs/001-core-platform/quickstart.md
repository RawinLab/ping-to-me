# Developer Quickstart

## Prerequisites

- Node.js 20+
- Docker (for local Postgres if not using Supabase directly)
- pnpm (recommended)
- Cloudflare Account (for Workers/R2)

## Setup

1.  **Clone & Install**

    ```bash
    git clone <repo>
    cd pingtome
    pnpm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` in root and apps.

    ```bash
    cp .env.example .env
    ```

    Required vars:

    - `DATABASE_URL`: Supabase connection string
    - `NEXT_PUBLIC_API_URL`: URL of the NestJS API
    - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: Cloudflare R2 credentials

3.  **Database Setup**

    ```bash
    pnpm db:push  # Push schema to Supabase
    pnpm db:seed  # Seed initial data
    ```

4.  **Run Locally**
    ```bash
    pnpm dev
    ```
    - Web: http://localhost:3000
    - API: http://localhost:3001
    - Redirector: http://localhost:8787

## Development Workflow

- **New UI Component**: `pnpm ui:add <component-name>` (uses Shadcn CLI)
- **DB Migration**: `pnpm db:migrate`
- **Testing**: `pnpm test` (runs Vitest)
