# PingTO.Me - URL Shortener Platform

A Bitly-clone URL shortening platform with analytics, QR codes, and team management.

## Project Overview

**Product**: URL Shortener SaaS with link management, analytics, QR codes, and bio pages

**Core Principles** (from constitution):
- **Scalability & Performance First**: Sub-millisecond redirects, caching strategies
- **Security & Privacy by Design**: OAuth/2FA, link safety, OWASP compliance
- **API-First Architecture**: All functionality via RESTful APIs
- **Data Integrity & Analytics Accuracy**: Reliable click tracking
- **Multi-Tenancy & RBAC**: Organizations with Owner/Admin/Editor/Viewer roles

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm |
| **Frontend** | Next.js 14, React 18, TailwindCSS, shadcn/ui |
| **Backend API** | NestJS 10, TypeScript 5.x |
| **Redirector** | Cloudflare Workers + Hono |
| **Database** | PostgreSQL + Prisma |
| **UI Components** | Radix UI, Lucide Icons |
| **Testing** | Jest (unit), Playwright (E2E) |
| **Payments** | Stripe |

## Project Structure

```
pingtome/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   ├── web/          # Next.js frontend (port 3010)
│   └── redirector/   # Cloudflare Workers edge redirector
├── packages/
│   ├── database/     # Prisma schema & client (@pingtome/database)
│   ├── ui/           # Shared UI components (@pingtome/ui)
│   ├── types/        # Shared TypeScript types (@pingtome/types)
│   └── config/       # Shared ESLint/TS configs (@pingtome/config)
├── requirements/     # Feature specs and requirements docs
└── .specify/         # Project memory and templates
```

## Commands

```bash
# Development
pnpm dev              # Start all services (API: 3001, Web: 3010)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier

# Database
pnpm --filter @pingtome/database db:generate  # Generate Prisma client
pnpm --filter @pingtome/database db:push      # Push schema to DB
pnpm --filter @pingtome/database db:seed      # Seed test data

# Testing
pnpm --filter web test                        # Jest unit tests
npx playwright test --project=chromium        # E2E tests
npx playwright test --ui                      # E2E with UI mode

# Individual apps
pnpm --filter api dev                         # API only
pnpm --filter web dev                         # Web only
pnpm --filter api build                       # Build API
pnpm --filter web build                       # Build Web
```

## Database Schema (Key Models)

- **User**: Auth, 2FA, Stripe subscription, plan
- **Organization**: Multi-tenant workspace with plan
- **OrganizationMember**: RBAC (OWNER/ADMIN/EDITOR/VIEWER)
- **Link**: Short URLs with expiration, password, redirect type
- **ClickEvent**: Analytics (country, device, browser, referrer)
- **Domain**: Custom domains with verification
- **Campaign/Tag/Folder**: Link organization
- **BioPage**: Link-in-bio pages
- **ApiKey/Webhook**: Developer platform

## API Modules (apps/api/src/)

| Module | Purpose |
|--------|---------|
| `auth/` | Login, register, OAuth, 2FA, JWT |
| `links/` | CRUD, bulk operations, status |
| `analytics/` | Click tracking, stats, export |
| `qr/` | QR code generation with customization |
| `organizations/` | Workspaces, members, invites |
| `domains/` | Custom domains, DNS verification |
| `campaigns/` | Campaign management |
| `tags/` | Tag CRUD |
| `folders/` | Folder management |
| `biopages/` | Link-in-bio pages |
| `payments/` | Stripe integration |
| `notifications/` | User notifications |
| `developer/` | API keys, webhooks |
| `audit/` | Audit logging |

## Web App Routes (apps/web/app/)

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login`, `/register` | Authentication |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/verify-email` | Email verification |
| `/dashboard` | Main dashboard |
| `/dashboard/links` | Link management |
| `/dashboard/links/create` | Create new link |
| `/dashboard/analytics/[id]` | Link analytics |
| `/dashboard/settings/*` | User settings, 2FA |
| `/dashboard/developer/*` | API keys |
| `/dashboard/billing` | Subscription management |
| `/bio/[slug]` | Public bio pages |
| `/pricing` | Pricing page |
| `/docs` | API documentation |

## E2E Tests (apps/web/e2e/)

Playwright test suites covering:
- `auth.spec.ts` - Login, register, OAuth flows
- `links.spec.ts` - Link CRUD operations
- `links-page.spec.ts` - Links dashboard UI
- `create-link.spec.ts` - Link creation form
- `analytics.spec.ts` - Analytics views
- `dashboard.spec.ts` - Dashboard overview
- `qr.spec.ts` - QR code features
- `bulk.spec.ts` - Bulk operations
- `organization.spec.ts` - Team management
- `domains.spec.ts` - Domain management
- `bio.spec.ts` - Bio pages
- `notifications.spec.ts` - Notifications
- `status.spec.ts` - Link status control

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
REFRESH_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# App URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3010

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_DISABLED=false
```

## Code Style

- **TypeScript**: Strict mode, explicit types
- **React**: Functional components, hooks, server components where possible
- **API**: RESTful conventions, DTOs with class-validator
- **Naming**: camelCase (variables), PascalCase (components/types)
- **Testing**: Unit tests for services, E2E for user flows

## Key Features (per spec)

1. **Link Management**: Create, edit, bulk import/export, tags, folders, campaigns
2. **Analytics**: Clicks, referrers, devices, countries, time-series
3. **QR Codes**: Customizable colors, logo overlay, multiple formats
4. **Bio Pages**: Multi-link pages with themes
5. **Custom Domains**: DNS verification, SSL
6. **Team**: Organizations with RBAC
7. **Developer**: API keys, webhooks, rate limiting
8. **Payments**: Stripe subscriptions (Free/Pro/Enterprise)
9. **Security**: 2FA, OAuth, session management, audit logs

## Development Notes

- Redirector runs on Cloudflare Workers for edge performance
- Analytics events are async to not block redirects
- Use workspace packages: `@pingtome/database`, `@pingtome/ui`, `@pingtome/types`
- API uses NestJS guards for auth and RBAC
- Frontend uses axios with token refresh interceptor

---

## Reference Documents

For detailed documentation on specific modules, refer to these files:

| Topic | Reference File | Description |
|-------|---------------|-------------|
| **RBAC & Permissions** | [`refs/rbac.md`](refs/rbac.md) | Role-based access control system, permission matrix, guards, decorators, and how to add new resources |

> **Note:** When working with RBAC, permissions, authorization, or creating new modules that need access control, always read `refs/rbac.md` first.
