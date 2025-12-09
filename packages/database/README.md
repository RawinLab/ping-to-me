# @pingtome/database

Prisma database package for PingTO.Me URL shortener platform.

## Prerequisites

- PostgreSQL database running
- `DATABASE_URL` environment variable set

## Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the database
pnpm db:seed
```

---

## 🌱 Seed Data

The seed script (`prisma/seed.ts`) creates comprehensive test data for E2E testing and development.

### Running the Seed

```bash
# From packages/database directory
npx prisma db seed

# Or from project root
pnpm --filter @pingtome/database db:seed

# Or using turbo
turbo run db:seed --filter=@pingtome/database
```

### Resetting Database with Seed

```bash
# Reset database and run seed
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Re-run all migrations
# 3. Execute seed script
```

---

## 📊 Test Data Overview

### Test Users

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `e2e-owner@pingtome.test` | `TestPassword123!` | OWNER | Full organization access |
| `e2e-admin@pingtome.test` | `TestPassword123!` | ADMIN | Admin privileges |
| `e2e-editor@pingtome.test` | `TestPassword123!` | EDITOR | Can create/edit links |
| `e2e-viewer@pingtome.test` | `TestPassword123!` | VIEWER | Read-only access |
| `e2e-new@pingtome.test` | `TestPassword123!` | MEMBER | For invitation tests |

### Test Organizations

| Name | Slug | Plan |
|------|------|------|
| E2E Test Organization | `e2e-test-org` | PRO |
| E2E Secondary Organization | `e2e-secondary-org` | FREE |

### Test Links

| Slug | Status | Features |
|------|--------|----------|
| `e2e-popular` | ACTIVE | High traffic, analytics data |
| `e2e-marketing` | ACTIVE | Campaign, folder, tags |
| `e2e-social` | ACTIVE | Social tags |
| `e2e-expired` | EXPIRED | Expiration date test |
| `e2e-protected` | ACTIVE | Password: `secret123` |
| `e2e-disabled` | DISABLED | Disabled status test |
| `e2e-archived` | ARCHIVED | Archived status test |
| `e2e-banned` | BANNED | Banned status test |
| `e2e-utm-link` | ACTIVE | Full UTM parameters |
| `e2e-max-clicks` | ACTIVE | Max 100 clicks limit |
| `e2e-custom-domain` | ACTIVE | Custom domain attached |
| `e2e-recent-1` to `e2e-recent-5` | ACTIVE | Recent links |

### Test Domains

| Hostname | Status |
|----------|--------|
| `e2e-custom.link` | VERIFIED (with SSL) |
| `e2e-pending.link` | PENDING |
| `e2e-verifying.link` | VERIFYING |
| `e2e-failed.link` | FAILED |

### Additional Test Data

- **Tags**: marketing, social, campaign, important, temporary
- **Campaigns**: 4 campaigns with various statuses (DRAFT, ACTIVE, PAUSED, COMPLETED)
- **Folders**: 4 folders including nested hierarchy
- **Bio Pages**: 2 pages with links and analytics
- **QR Codes**: 3 QR codes with different customizations
- **Invitations**: pending, expired, and accepted invitations
- **Usage Tracking**: Current and historical usage data
- **Audit Logs**: Sample audit log entries
- **Notifications**: Various notification types
- **API Keys**: Active and expired API keys
- **Webhooks**: Active and inactive webhooks

---

## 🧪 Using in E2E Tests

Import test data constants from fixtures:

```typescript
import { 
  TEST_CREDENTIALS, 
  TEST_IDS, 
  TEST_SLUGS,
  PROTECTED_LINK_PASSWORD 
} from './fixtures/test-data';

// Login as owner
await page.fill('[name="email"]', TEST_CREDENTIALS.owner.email);
await page.fill('[name="password"]', TEST_CREDENTIALS.owner.password);

// Navigate to a test link
await page.goto(`/dashboard/links/${TEST_IDS.links.popular}`);

// Use test slugs
expect(link.slug).toBe(TEST_SLUGS.links.popular);
```

---

## 📁 File Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # E2E test data seed
│   ├── seed-blocked-domains.ts  # Blocked domains seed
│   ├── migrations/        # Database migrations
│   └── scripts/           # Utility scripts
├── src/
│   └── index.ts           # Prisma client export
├── package.json
└── README.md
```

---

## 🔧 Useful Commands

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Push schema changes without migration (dev only)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

## ⚠️ Important Notes

1. **Test Data Prefix**: All E2E test data uses `e2e-` prefix for easy identification and cleanup.

2. **Cleanup**: The seed script automatically cleans existing E2E test data before creating new data.

3. **Random Data**: Click events and analytics are randomly generated but follow realistic distributions.

4. **Fixed IDs**: Test entities use fixed UUIDs (starting with `e2e00000-...`) for consistent test references.

5. **Do Not Use in Production**: The seed script is for development and testing only.

