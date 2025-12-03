# Developer Quickstart

## Prerequisites

- Node.js 20+
- Docker (for local Postgres if not using Supabase directly)
- pnpm (recommended)
- Cloudflare Account (for Workers/R2/KV)

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

    **Required Variables:**

    **Database (Prisma/Supabase):**
    - `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/pingtome`)

    **API (NestJS):**
    - `PORT`: Port to run the API on (default: 3001).
    - `JWT_SECRET`: Secret key for JWT signing.
    - `R2_ACCOUNT_ID`: Cloudflare Account ID.
    - `R2_ACCESS_KEY_ID`: Cloudflare R2 Access Key ID.
    - `R2_SECRET_ACCESS_KEY`: Cloudflare R2 Secret Access Key.
    - `R2_BUCKET_NAME`: Name of the R2 bucket for QR codes.

    **Redirector (Cloudflare Workers):**
    - `CF_KV_NAMESPACE_ID`: ID of the KV Namespace for domain routing.

    **Web (Next.js):**
    - `PORT`: Port to run the Web app on (default: 3000).
    - `NEXT_PUBLIC_API_URL`: URL of the NestJS API (e.g., `http://localhost:3001`).

3.  **Database Setup**

    ```bash
    pnpm db:generate # Generate Prisma Client
    pnpm db:push     # Push schema to database
    ```

4.  **Run Locally**

    ```bash
    pnpm dev
    ```

    - Web: http://localhost:3010
    - API: http://localhost:3011
    - Redirector: http://localhost:8787

## Feature Setup

### Custom Domains

To test custom domains locally:

1.  Add a mapping to your `hosts` file (e.g., `127.0.0.1 my-custom-domain.local`).
2.  In the Dashboard, add `my-custom-domain.local`.
3.  The system will attempt DNS verification (mocked in dev).

### QR Codes

Ensure your R2 bucket is created and CORS is configured to allow uploads/reads.

### Developer Platform

- Go to **Settings > Developer**.
- Generate an API Key to use with `X-API-Key` header.
- Configure Webhooks to receive `link.created` and `link.clicked` events.

## Development Workflow

- **Linting**: `pnpm lint`
- **Type Check**: `pnpm type-check`
- **New UI Component**: `pnpm ui:add <component-name>`
- **DB Migration**: `pnpm db:migrate`
