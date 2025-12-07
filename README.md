# PingTO.Me - Core Platform

PingTO.Me is a high-performance link management platform designed for speed, scalability, and developer flexibility. It features advanced link shortening, analytics, custom domains, QR codes, and a comprehensive developer API.

## 🚀 Features

- **Link Management**: Shorten URLs, manage tags, and track performance.
- **High-Performance Redirects**: Powered by Cloudflare Workers for <100ms global latency.
- **Analytics**: Real-time click tracking with geographic and device data.
- **Custom Domains**: Connect your own domains for branded links.
- **QR Codes**: Generate and customize QR codes for any link.
- **Bio Pages**: Create "Link-in-Bio" pages to showcase multiple links.
- **Team Management**: Collaborate with team members using Role-Based Access Control (RBAC).
- **Developer Platform**: API keys and Webhooks for building integrations.

## 🛠️ Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Backend**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma](https://www.prisma.io/))
- **Edge**: [Cloudflare Workers](https://workers.cloudflare.com/) (Redirector)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)

## 📂 Project Structure

```text
├── apps/
│   ├── web/            # Next.js Dashboard
│   ├── api/            # NestJS Core API
│   └── redirector/     # Cloudflare Worker for Redirects
├── packages/
│   ├── database/       # Prisma Schema & Client
│   ├── ui/             # Shared React Components
│   ├── config/         # Shared Configurations (ESLint, TSConfig)
│   └── types/          # Shared TypeScript Interfaces
```

## 🏁 Getting Started

See the [Developer Quickstart](specs/001-core-platform/quickstart.md) guide for detailed setup instructions.

### Quick Setup

1.  **Install Dependencies**

    ```bash
    pnpm install
    ```

2.  **Configure Environment**

    ```bash
    cp .env.example .env
    # Update .env with your credentials
    ```

3.  **Setup Database**

    ```bash
    pnpm db:generate
    pnpm db:push
    ```

4.  **Run Locally**
    ```bash
    pnpm dev
    ```

## 🧪 Testing

### E2E Tests

The project uses Playwright for end-to-end testing with two modes:

#### Mode 1: Mocked API (Default)

Tests run with mocked API responses - fast and isolated.

```bash
cd apps/web
npx playwright test
```

#### Mode 2: Real Database

Tests run against a real database with seeded test data - more realistic.

```bash
# 1. Seed the database with test data
pnpm --filter @pingtome/database db:seed

# 2. Run tests with real database
cd apps/web
E2E_USE_REAL_DB=true npx playwright test --project=real-db
```

### Test Data Credentials

After seeding, you can use these test accounts:

| Role   | Email                    | Password         |
| ------ | ------------------------ | ---------------- |
| Owner  | e2e-owner@pingtome.test  | TestPassword123! |
| Admin  | e2e-admin@pingtome.test  | TestPassword123! |
| Editor | e2e-editor@pingtome.test | TestPassword123! |
| Viewer | e2e-viewer@pingtome.test | TestPassword123! |

### Seeded Test Data Includes

- 4 users with different roles
- 2 organizations (PRO and FREE plans)
- 10 links with various statuses (active, expired, password-protected)
- 800+ click events with analytics data (countries, devices, referrers)
- Custom domains, tags, campaigns, folders
- Bio page, notifications, API keys, webhooks

### View Test Report

```bash
cd apps/web
npx playwright show-report
```

### Database Commands

```bash
# Seed E2E test data
pnpm --filter @pingtome/database db:seed

# Seed blocked domains
pnpm --filter @pingtome/database db:seed:blocked

# Reset database and re-seed
pnpm --filter @pingtome/database db:reset
```

## 📄 License

This project is licensed under the MIT License.
