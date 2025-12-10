# PingTO.Me - URL Shortener Platform

<div align="center">

![PingTO.Me](https://img.shields.io/badge/PingTO.Me-URL%20Shortener-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node-≥20-brightgreen?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge)

A high-performance link management platform designed for speed, scalability, and developer flexibility.

[Features](#-features) • [Tech Stack](#️-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation)

</div>

---

## 🚀 Features

### Core Features

- **🔗 Link Management** - Shorten URLs, manage tags, folders, and campaigns
- **⚡ High-Performance Redirects** - Powered by Cloudflare Workers for <100ms global latency
- **📊 Real-Time Analytics** - Track clicks with geographic, device, and referrer data
- **🌐 Custom Domains** - Connect your own domains with SSL support
- **📱 QR Codes** - Generate and customize QR codes with logos and colors
- **👤 Bio Pages** - Create "Link-in-Bio" pages to showcase multiple links

### Team & Enterprise

- **👥 Team Management** - Collaborate with Role-Based Access Control (RBAC)
- **🏢 Multi-Tenancy** - Support for multiple organizations per user
- **🔐 Enterprise Security** - 2FA, SSO/SAML, Passkeys, Session Management
- **📝 Audit Logs** - Complete activity tracking for compliance

### Developer Platform

- **🔑 API Keys** - Create and manage API keys with scopes
- **🪝 Webhooks** - Real-time event notifications
- **📚 RESTful API** - Comprehensive API with Swagger documentation

---

## 🛠️ Tech Stack

| Layer        | Technology                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo** | [Turborepo](https://turbo.build/) + pnpm                                                                                      |
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Backend**  | [NestJS 10](https://nestjs.com/), TypeScript 5.x                                                                              |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/)                                                  |
| **Edge**     | [Cloudflare Workers](https://workers.cloudflare.com/) + [Hono](https://hono.dev/)                                             |
| **Storage**  | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)                                                            |
| **Payments** | [Stripe](https://stripe.com/)                                                                                                 |
| **Testing**  | [Jest](https://jestjs.io/) (unit), [Playwright](https://playwright.dev/) (E2E)                                                |

---

## 📂 Project Structure

```
pingtome/
├── apps/
│   ├── api/              # NestJS Backend API (port 3001)
│   ├── web/              # Next.js Dashboard (port 3010)
│   └── redirector/       # Cloudflare Workers Edge Redirector
├── packages/
│   ├── database/         # Prisma Schema & Client (@pingtome/database)
│   ├── ui/               # Shared React Components (@pingtome/ui)
│   ├── types/            # Shared TypeScript Types (@pingtome/types)
│   └── config/           # Shared ESLint/TSConfig (@pingtome/config)
├── requirements/         # Feature specifications
├── refs/                 # Reference documentation (RBAC, Audit)
├── generated-docs/       # Auto-generated documentation
├── docker-compose.yml    # PostgreSQL development setup
├── turbo.json           # Turborepo configuration
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9.0.0
- **PostgreSQL** 15+ (or use Docker)
- **Cloudflare Account** (for Workers deployment)

### Quick Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/your-org/pingtome.git
   cd pingtome
   pnpm install
   ```

2. **Start PostgreSQL** (using Docker)

   ```bash
   docker-compose up -d
   ```

3. **Configure Environment**

   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env

   # Edit with your credentials
   ```

4. **Setup Database**

   ```bash
   # Generate Prisma client
   pnpm --filter @pingtome/database db:generate

   # Push schema to database
   pnpm --filter @pingtome/database db:push

   # Seed test data (optional)
   pnpm --filter @pingtome/database db:seed
   ```

5. **Run Development Servers**

   ```bash
   pnpm dev
   ```

   This starts:
   - **API**: http://localhost:3001
   - **Web**: http://localhost:3010
   - **API Docs**: http://localhost:3001/api/docs

---

## 🔧 Development Commands

### Root Commands

```bash
pnpm dev              # Start all services
pnpm dev:clean        # Start with port cleanup
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier
pnpm kill-ports       # Kill processes on ports 3001, 3010, 3011
```

### Database Commands

```bash
# From root
pnpm --filter @pingtome/database db:generate  # Generate Prisma client
pnpm --filter @pingtome/database db:push      # Push schema changes
pnpm --filter @pingtome/database db:seed      # Seed E2E test data
pnpm --filter @pingtome/database db:reset     # Reset DB and seed

# From packages/database
npx prisma studio                              # Open database GUI
npx prisma migrate dev                         # Create migration
npx prisma migrate reset                       # Reset and re-migrate
```

### App-Specific Commands

```bash
# API (apps/api)
pnpm --filter api dev           # Development mode
pnpm --filter api build         # Production build
pnpm --filter api test          # Run unit tests
pnpm --filter api test:cov      # Test with coverage

# Web (apps/web)
pnpm --filter web dev           # Development mode
pnpm --filter web build         # Production build
pnpm --filter web test          # Run unit tests

# Redirector (apps/redirector)
pnpm --filter redirector dev    # Local development
pnpm --filter redirector deploy # Deploy to Cloudflare
```

---

## 🧪 Testing

### Unit Tests

```bash
# API unit tests
pnpm --filter api test
pnpm --filter api test:cov      # With coverage

# Web unit tests
pnpm --filter web test
```

### E2E Tests (Playwright)

All E2E tests use real API calls against a seeded test database.

#### Prerequisites

```bash
# 1. Ensure database is running
docker-compose up -d

# 2. Seed the test data
pnpm --filter @pingtome/database db:seed

# 3. Start development servers
pnpm dev
```

#### Run Tests

```bash
cd apps/web

# Run all tests (uses existing seeded data)
npx playwright test

# Run with fresh seed before tests
E2E_SEED_DB=true npx playwright test

# Interactive UI mode
npx playwright test --ui

# Run specific test file
npx playwright test e2e/dashboard.spec.ts

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### View Test Report

```bash
cd apps/web
npx playwright show-report
```

### Test Data Credentials

After seeding, use these test accounts:

| Role     | Email                      | Password           |
| -------- | -------------------------- | ------------------ |
| Owner    | `e2e-owner@pingtome.test`  | `TestPassword123!` |
| Admin    | `e2e-admin@pingtome.test`  | `TestPassword123!` |
| Editor   | `e2e-editor@pingtome.test` | `TestPassword123!` |
| Viewer   | `e2e-viewer@pingtome.test` | `TestPassword123!` |
| New User | `e2e-new@pingtome.test`    | `TestPassword123!` |

### Seeded Test Data Includes

- **5 users** with different roles (OWNER, ADMIN, EDITOR, VIEWER)
- **2 organizations** (PRO and FREE plans)
- **16 links** with various statuses (active, expired, disabled, archived, banned)
- **1500+ click events** with realistic analytics data
- **4 domains** with different verification statuses
- **2 bio pages** with links and analytics
- **3 QR codes** with customization
- **5 tags**, **4 campaigns**, **4 folders**
- **3 invitations** (pending, expired, accepted)
- **Usage tracking**, **audit logs**, **notifications**
- **API keys** and **webhooks**

---

## 📋 Environment Variables

### API (`apps/api/.env`)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/pingtome

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudflare R2 Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Email (Nodemailer)
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_DISABLED=false

# App URLs
FRONTEND_URL=http://localhost:3010
```

### Web (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3010
```

### Redirector (`apps/redirector/wrangler.toml`)

```toml
name = "pingtome-redirector"
main = "src/index.ts"

[[kv_namespaces]]
binding = "LINKS_KV"
id = "your-kv-namespace-id"
```

---

## 🏗️ Architecture

### API Modules (`apps/api/src/`)

| Module           | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `auth/`          | Authentication, OAuth, 2FA, Sessions, Passkeys, SSO |
| `links/`         | Link CRUD, bulk operations, status management       |
| `analytics/`     | Click tracking, reports, exports, real-time         |
| `qr/`            | QR code generation with customization               |
| `organizations/` | Workspaces, members, settings                       |
| `invitations/`   | Team invitations                                    |
| `domains/`       | Custom domains, DNS verification, SSL               |
| `campaigns/`     | Campaign management with UTM                        |
| `tags/`          | Tag CRUD                                            |
| `folders/`       | Folder hierarchy                                    |
| `biopages/`      | Link-in-bio pages                                   |
| `payments/`      | Stripe integration                                  |
| `notifications/` | User notifications                                  |
| `developer/`     | API keys, webhooks                                  |
| `audit/`         | Audit logging                                       |
| `quota/`         | Usage tracking and limits                           |
| `plans/`         | Subscription plans                                  |
| `tasks/`         | Scheduled tasks (analytics, reports)                |

### Web Routes (`apps/web/app/`)

| Route                                 | Description             |
| ------------------------------------- | ----------------------- |
| `/`                                   | Landing page            |
| `/login`, `/register`                 | Authentication          |
| `/forgot-password`, `/reset-password` | Password recovery       |
| `/verify-email`                       | Email verification      |
| `/dashboard`                          | Main dashboard          |
| `/dashboard/links`                    | Link management         |
| `/dashboard/links/create`             | Create new link         |
| `/dashboard/links/[id]/edit`          | Edit link               |
| `/dashboard/analytics/[id]`           | Link analytics          |
| `/dashboard/qr/[id]`                  | QR code editor          |
| `/dashboard/bio`                      | Bio page manager        |
| `/dashboard/settings/*`               | User/org settings       |
| `/dashboard/developer/*`              | API keys, webhooks      |
| `/dashboard/billing`                  | Subscription management |
| `/bio/[slug]`                         | Public bio pages        |
| `/pricing`                            | Pricing page            |

---

## 🐳 Docker Deployment

### Development PostgreSQL

```bash
docker-compose up -d
```

### Production API Build

```bash
cd apps/api
docker build -t pingtome-api .
docker run -p 3001:3001 --env-file .env pingtome-api
```

---

## 📖 Documentation

### Reference Documents

| Document            | Location                      | Description                      |
| ------------------- | ----------------------------- | -------------------------------- |
| **RBAC Guide**      | `refs/rbac.md`                | Role-based access control system |
| **Audit Logging**   | `refs/auditlog.md`            | Audit logging implementation     |
| **Database README** | `packages/database/README.md` | Seed data and database commands  |
| **E2E Test Guide**  | `apps/web/e2e/INDEX.md`       | E2E testing documentation        |

### API Documentation

When running the API, Swagger documentation is available at:

```
http://localhost:3001/api/docs
```

---

## 🔐 Security Features

- **Authentication**: Email/Password, OAuth (Google, GitHub)
- **Two-Factor Authentication**: TOTP with backup codes
- **Passkeys/WebAuthn**: Hardware security key support
- **SSO/SAML**: Enterprise single sign-on
- **Session Management**: Token rotation, device tracking
- **Rate Limiting**: Configurable per-endpoint limits
- **RBAC**: Owner, Admin, Editor, Viewer roles
- **Audit Logging**: Complete activity tracking
- **Link Safety**: URL scanning for malicious content

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

Made with ❤️ by the PingTO.Me Team

</div>
