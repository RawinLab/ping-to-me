# PingTO.Me - URL Shortener Platform

A Bitly-clone URL shortening platform with analytics, QR codes, and team management.

## Project Overview

**Product**: URL Shortener SaaS with link management, analytics, QR codes, and bio pages

**Core Principles** (from constitution):

- **Scalability & Performance First**: Sub-millisecond redirects, caching strategies
- **Security & Privacy by Design**: OAuth/2FA/Passkey, link safety, OWASP compliance
- **API-First Architecture**: All functionality via RESTful APIs
- **Data Integrity & Analytics Accuracy**: Reliable click tracking
- **Multi-Tenancy & RBAC**: Organizations with Owner/Admin/Editor/Viewer roles

## Tech Stack

| Layer            | Technology                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| **Monorepo**     | Turborepo + pnpm                                                             |
| **Frontend**     | Next.js 14, React 18, TailwindCSS                                            |
| **UI Framework** | [shadcn/ui](https://ui.shadcn.com/docs/components) + Radix UI + Lucide Icons |
| **Backend API**  | NestJS 10, TypeScript 5.x                                                    |
| **Redirector**   | Cloudflare Workers + Hono                                                    |
| **Database**     | PostgreSQL + Prisma                                                          |
| **Testing**      | Jest (unit), Playwright (E2E)                                                |
| **Payments**     | Stripe                                                                       |

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
pnpm --filter @pingtome/database db:reset     # Reset and reseed database

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

### Core Models

- **User**: Auth, 2FA, Stripe subscription, plan
- **Organization**: Multi-tenant workspace with plan, logo, timezone
- **OrganizationMember**: RBAC (OWNER/ADMIN/EDITOR/VIEWER)
- **OrganizationSettings**: Security policies (IP allowlist, SSO, 2FA enforcement)
- **OrganizationInvitation**: Team invite tokens with expiration

### Link Management

- **Link**: Short URLs with expiration, password, redirect type, UTM params
- **RedirectRule**: Smart routing rules (device, country, browser, OS, language)
- **LinkVariant**: A/B test variants with traffic weights
- **QrCode**: QR customization (colors, logo, size)
- **Domain**: Custom domains with DNS verification and SSL

### Organization

- **Campaign**: Campaign management with UTM, goals, status
- **Tag**: Link tagging
- **Folder**: Hierarchical link organization

### Analytics

- **ClickEvent**: Click tracking (country, device, browser, referrer, source)
- **AnalyticsDaily**: Aggregated daily analytics cache
- **BioPageAnalytics**: Bio page view tracking

### Bio Pages

- **BioPage**: Link-in-bio pages with themes
- **BioPageLink**: Individual links on bio pages

### Security & Auth

- **Session**: Active sessions with device info, token family
- **Passkey**: WebAuthn/FIDO2 credentials
- **TrustedDevice**: Device fingerprints with trust scoring
- **LoginAttempt**: Failed login tracking with geolocation
- **BackupCode**: 2FA backup codes
- **SSOProvider**: SAML SSO configuration

### Developer Platform

- **ApiKey**: API keys with scopes and rate limits
- **Webhook**: Event webhooks

### Audit & Usage

- **AuditLog**: System audit trail
- **AccessLog**: RBAC permission checks
- **UsageTracking**: Monthly usage metrics
- **UsageEvent**: Usage event log
- **PlanDefinition**: Plan feature matrix

### Other

- **Notification**: User notifications
- **ReportSchedule**: Scheduled analytics reports
- **BlockedDomain**: Domain blacklist

## API Modules (apps/api/src/)

### Core Modules

| Module           | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `auth/`          | Login, register, OAuth, 2FA, JWT, sessions   |
| `links/`         | CRUD, bulk operations, variants, rules       |
| `analytics/`     | Click tracking, stats, export, real-time     |
| `qr/`            | QR code generation with customization        |
| `organizations/` | Workspaces, members, settings                |
| `domains/`       | Custom domains, DNS verification, SSL        |
| `campaigns/`     | Campaign management with UTM                 |
| `tags/`          | Tag CRUD                                     |
| `folders/`       | Folder management with hierarchy             |
| `biopages/`      | Link-in-bio pages                            |
| `payments/`      | Stripe integration                           |
| `notifications/` | User notifications                           |
| `developer/`     | API keys, webhooks                           |
| `audit/`         | Audit logging                                |

### Additional Modules

| Module        | Purpose                                 |
| ------------- | --------------------------------------- |
| `invitations/`| Team invitation management              |
| `quota/`      | Plan quota enforcement                  |
| `plans/`      | Plan management (admin)                 |
| `storage/`    | Storage service abstraction             |
| `tasks/`      | Background jobs (aggregation, expiry)   |
| `mail/`       | Email service                           |

### Auth Sub-modules

| Controller                    | Purpose                           |
| ----------------------------- | --------------------------------- |
| `passkey.controller.ts`       | WebAuthn/hardware key auth        |
| `device-fingerprint.controller.ts` | Device tracking and trust    |
| `session.controller.ts`       | Session management                |
| `oauth-link.controller.ts`    | OAuth account linking             |
| `login-activity.controller.ts`| Failed login tracking             |
| `sso/sso.controller.ts`       | SAML/SSO configuration            |

### Analytics Sub-modules

| Service                  | Purpose                      |
| ------------------------ | ---------------------------- |
| `realtime/`              | WebSocket live analytics     |
| `cache/`                 | Query caching                |
| `pdf/`                   | PDF report generation        |

## Web App Routes (apps/web/app/)

### Public Routes

| Route                                 | Description             |
| ------------------------------------- | ----------------------- |
| `/`                                   | Landing page            |
| `/login`, `/register`                 | Authentication          |
| `/login/2fa`                          | 2FA verification        |
| `/forgot-password`, `/reset-password` | Password recovery       |
| `/verify-email`                       | Email verification      |
| `/invitations/[token]`                | Accept team invitation  |
| `/bio/[slug]`                         | Public bio pages        |
| `/pricing`                            | Pricing page            |
| `/docs`                               | API documentation       |

### Dashboard Routes

| Route                                 | Description             |
| ------------------------------------- | ----------------------- |
| `/dashboard`                          | Main dashboard          |
| `/dashboard/links`                    | Link management         |
| `/dashboard/links/new`                | Create new link         |
| `/dashboard/links/[id]/analytics`     | Link analytics          |
| `/dashboard/links/[id]/settings`      | Link settings           |
| `/dashboard/qr-codes`                 | QR code manager         |
| `/dashboard/analytics`                | Org-level analytics     |
| `/dashboard/bio`                      | Bio pages               |
| `/dashboard/folders`                  | Link folders            |
| `/dashboard/domains`                  | Custom domains          |
| `/dashboard/organization`             | Organization management |

### Settings Routes

| Route                                    | Description          |
| ---------------------------------------- | -------------------- |
| `/dashboard/settings/profile`            | User profile         |
| `/dashboard/settings/security`           | Security settings    |
| `/dashboard/settings/security/sessions`  | Active sessions      |
| `/dashboard/settings/security/activity`  | Login activity       |
| `/dashboard/settings/team`               | Team members         |
| `/dashboard/settings/audit-logs`         | Audit log viewer     |
| `/dashboard/settings/developer`          | Developer tools      |
| `/dashboard/billing`                     | Subscription management |

### Developer Routes

| Route                              | Description     |
| ---------------------------------- | --------------- |
| `/dashboard/developer/api-keys`    | API keys        |
| `/dashboard/developer/webhooks`    | Webhooks        |

## E2E Tests (apps/web/e2e/)

Playwright test suites covering:

### Authentication & Security
- `auth.spec.ts` - Login, register, OAuth flows
- `rbac.spec.ts` - Role-based access control

### Link Management
- `links.spec.ts` - Link CRUD operations
- `links-page.spec.ts` - Links dashboard UI
- `create-link.spec.ts` - Link creation form
- `edit-link.spec.ts` - Link editing
- `status.spec.ts` - Link status control
- `bulk.spec.ts` - Bulk operations

### Analytics
- `analytics.spec.ts` - Analytics views
- `link-analytics.spec.ts` - Link-level analytics
- `dashboard.spec.ts` - Dashboard overview
- `dashboard-real.spec.ts` - Real dashboard tests

### Features
- `qr.spec.ts` - QR code features
- `qr-customizer.spec.ts` - QR customization
- `bio.spec.ts` - Bio pages
- `domains.spec.ts` - Domain management
- `notifications.spec.ts` - Notifications

### Organization
- `organization.spec.ts` - Team management
- `organization-workspace.spec.ts` - Workspace tests
- `link-organization.spec.ts` - Org link management
- `member-invite-remove.spec.ts` - Member management
- `audit-logs.spec.ts` - Audit log viewing
- `quota-plan.spec.ts` - Quota enforcement

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

## UI Components (shadcn/ui)

This project uses **shadcn/ui** as the primary UI framework. Always use shadcn/ui components instead of creating custom components.

**Documentation**: https://ui.shadcn.com/docs/components

**Component Location**: `apps/web/components/ui/`

**Adding New Components**:

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

**Common Components**:
| Component | Usage |
|-----------|-------|
| `Button` | Actions, form submissions |
| `Input`, `Textarea` | Form inputs |
| `Select`, `Combobox` | Dropdowns |
| `Dialog`, `Sheet` | Modals, side panels |
| `Card` | Content containers |
| `Table` | Data display |
| `Tabs` | Tab navigation |
| `Toast` | Notifications |
| `Form` | Form validation (with react-hook-form) |
| `DropdownMenu` | Context menus |
| `Badge` | Status indicators |
| `Skeleton` | Loading states |

**Example Usage**:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

> **Note**: Check the [shadcn/ui docs](https://ui.shadcn.com/docs/components) for component props, variants, and examples.

## Key Features

### Link Management
- Create, edit, bulk import/export
- Tags, folders, campaigns organization
- Custom slugs with availability checking
- Link expiration and password protection
- UTM parameter management

### A/B Testing & Smart Routing
- **Link Variants**: Test multiple destination URLs with traffic distribution
- **Redirect Rules**: Route users based on device, location, browser, OS, language

### Analytics
- Click tracking with referrers, devices, countries
- Time-series visualization
- Real-time analytics via WebSocket
- Aggregated daily analytics cache
- PDF report generation
- Scheduled report delivery

### QR Codes
- Customizable colors and logo overlay
- Multiple export formats (PNG, SVG, PDF)
- Size and error correction options

### Bio Pages
- Multi-link pages with themes
- Custom styling and social links
- View analytics

### Custom Domains
- DNS verification (TXT/CNAME)
- SSL provisioning and management
- Default domain per organization

### Team & Organizations
- Multi-tenant workspaces
- RBAC (Owner/Admin/Editor/Viewer)
- Team invitations with expiration
- Organization settings and branding

### Security
- **2FA**: TOTP with backup codes
- **Passkeys**: WebAuthn/FIDO2 support (YubiKey, Touch ID, Windows Hello)
- **Device Fingerprinting**: Trust scoring and device tracking
- **Trusted Devices**: Reduce 2FA friction
- **SSO/SAML**: Enterprise single sign-on
- **Session Management**: Active session viewing and revocation
- **Login Activity**: Failed attempt tracking with geolocation
- **Token Rotation**: Refresh token families for replay protection

### Developer Platform
- API keys with scopes and rate limits
- Webhooks for event notifications
- IP whitelisting

### Payments
- Stripe subscriptions (Free/Pro/Enterprise)
- Usage-based quota enforcement

### Audit & Compliance
- Comprehensive audit logging
- Access log for RBAC decisions

## Development Notes

- Redirector runs on Cloudflare Workers for edge performance
- Analytics events are async to not block redirects
- Use workspace packages: `@pingtome/database`, `@pingtome/ui`, `@pingtome/types`
- API uses NestJS guards for auth and RBAC
- Frontend uses axios with token refresh interceptor

## Architecture Rules

> **IMPORTANT: Strict Backend Separation**

- **DO NOT** use Next.js API routes, Server Actions, or any Next.js backend features for database access or business logic
- **DO NOT** import `@pingtome/database` or Prisma client in `apps/web`
- **ALL** database operations and backend logic MUST go through the NestJS API (`apps/api`)
- `apps/web` is a **frontend-only** application - it communicates with `apps/api` via HTTP requests using axios
- This separation ensures:
  - Clear API contracts between frontend and backend
  - Consistent authentication/authorization via NestJS guards
  - Proper audit logging and RBAC enforcement
  - Easier testing and maintenance

---

## Reference Documents

For detailed documentation on specific modules, refer to these files:

| Topic                  | Reference File                         | Description                                                                                           |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **RBAC & Permissions** | [`refs/rbac.md`](refs/rbac.md)         | Role-based access control system, permission matrix, guards, decorators, and how to add new resources |
| **Audit Logging**      | [`refs/auditlog.md`](refs/auditlog.md) | Audit logging system, event types, helper methods, and how to add audit logging to new features       |

> **Note:** When working with RBAC, permissions, authorization, or creating new modules that need access control, always read `refs/rbac.md` first.

> **Note:** When creating new features that modify data (CRUD operations), always implement audit logging following `refs/auditlog.md`.
