# PingTO.Me Detailed Todo List

Derived from `plan.md` and current project status.

## Phase 1: Core Link & Analytics (End-User Features)

### 1.1 User Registration & Authentication

- [x] **Backend**: Implement `AuthService` (Login, Register, OAuth).
- [x] **Backend**: Setup Passport strategies (Local, Google, GitHub).
- [x] **Frontend**: Create Login page (`/login`).
- [x] **Frontend**: Create Register page (`/register`).
- [ ] **Frontend**: Implement "Forgot Password" flow.
- [ ] **Frontend**: Implement Profile Management (Update name, avatar, password).

### 1.2 Short Link Creation

- [x] **Backend**: Implement `LinksService.create` with validation.
- [x] **Backend**: Implement Slug generation (random & custom).
- [x] **Backend**: Sync links to Cloudflare KV.
- [x] **Frontend**: Create `LinksTable` component.
- [x] **Frontend**: Implement Link Creation Modal/Form in Dashboard.
- [x] **Redirector**: Implement Cloudflare Worker for redirects.
- [x] **Redirector**: Implement API fallback for KV misses.

### 1.3 Custom Domain & Slug

- [x] **Backend**: Support custom slugs in `LinksService`.
- [x] **Redirector**: Support custom domain routing logic.
- [x] **Backend**: Implement Domain CRUD endpoints (`/domains`).
- [x] **Backend**: Implement DNS verification logic.
- [x] **Frontend**: Create Domain Management page (`/dashboard/domains`).
- [x] **Frontend**: Add "Add Domain" wizard with DNS instructions.

### 1.4 QR Code Generation

- [x] **Backend**: Generate QR code data URI in `LinksService`.
- [x] **Frontend**: Display QR code in `LinksTable`.
- [x] **Frontend**: Implement "Download QR" functionality.
- [x] **Frontend**: Add QR Customization options (Color) in UI.

### 1.5 Bulk Link Management

- [x] **Backend**: Implement CSV Import endpoint (`/links/import`).
- [x] **Backend**: Implement Bulk Export endpoint (`/links/export`).
- [x] **Frontend**: Create "Import Links" modal with CSV template.
- [x] **Frontend**: Add "Export to CSV" button in Dashboard.
- [x] **Frontend**: Implement Bulk Actions in `LinksTable` (Select multiple -> Delete/Archive).

### 1.6 Link Organization

- [x] **Backend**: Implement Tags CRUD.
- [x] **Backend**: Implement Campaigns CRUD.
- [x] **Frontend**: Add Tag management UI (Create, Assign to Link).
- [x] **Frontend**: Add Campaign management UI.
- [x] **Frontend**: Add Filters to `LinksTable` (by Tag, Campaign, Date).

### 1.7 Link Analytics (Per-Link)

- [x] **Backend**: Implement `AnalyticsService.trackClick`.
- [x] **Backend**: Implement `AnalyticsService.getLinkAnalytics`.
- [x] **Frontend**: Create Analytics Page (`/dashboard/analytics/[id]`).
- [x] **Frontend**: Implement Charts (Clicks over time).
- [x] **Frontend**: Implement Recent Activity Table.
- [x] **Frontend**: Add Device and Referrer breakdown charts.
- [x] **Frontend**: Add Geographic map visualization.

### 1.8 Dashboard Overview

- [x] **Frontend**: Create Dashboard Layout.
- [x] **Frontend**: Display Recent Links.
- [x] **Backend**: Implement `DashboardService.getOverviewMetrics`.
- [x] **Frontend**: Add Aggregate Metrics Cards (Total Clicks, Active Links).
- [x] **Frontend**: Add "Clicks over time" chart for _all_ links.

### 1.9 Link-in-Bio / Mini-Page

- [x] **Backend**: Define `BioPage` schema (already in Prisma).
- [x] **Backend**: Implement Bio Page CRUD endpoints.
- [x] **Frontend**: Create Bio Page Builder UI.
- [x] **Frontend**: Create Public Bio Page renderer (`/bio/[slug]`).
- [ ] **Frontend**: Add Theme customization options.

### 1.10 Link Status Control

- [x] **Backend**: Support `ACTIVE`, `DISABLED`, `BANNED` status.
- [x] **Frontend**: Display status in `LinksTable`.
- [ ] **Frontend**: Add toggle to Enable/Disable links.
- [ ] **Frontend**: Implement "Archive" functionality.
- [ ] **Backend**: Implement Expiration Date check in Redirector.

### 1.11 Notifications

- [ ] **Backend**: Implement Notification Service.
- [ ] **Frontend**: Add Notification Bell in Header.
- [ ] **Frontend**: Create Notification Center UI.

### 1.12 Plan Upgrade / Payment

- [ ] **Backend**: Integrate Stripe (Checkout, Webhooks).
- [ ] **Frontend**: Create Pricing Page (Public & In-App).
- [ ] **Frontend**: Implement Checkout flow.
- [ ] **Frontend**: Create Billing Portal (View Invoices, Manage Subscription).

## Phase 2: Admin & Team Management

### 2.1 Organization/Workspace

- [x] **Backend**: Define `Organization` schema.
- [ ] **Backend**: Implement Org CRUD.
- [ ] **Frontend**: Create Organization Settings page.
- [ ] **Frontend**: Implement Org Switcher in Header.

### 2.2 Member Invite / Remove

- [ ] **Backend**: Implement Invitation logic (Send Email).
- [ ] **Backend**: Implement "Accept Invite" flow.
- [ ] **Frontend**: Create "Team Members" page.
- [ ] **Frontend**: Add "Invite Member" modal.

### 2.3 Role-Based Access Control (RBAC)

- [ ] **Backend**: Implement RBAC Guards (`@Roles('ADMIN')`).
- [ ] **Backend**: Enforce permissions in Services.
- [ ] **Frontend**: Hide/Disable UI elements based on role.

### 2.4 Security Options

- [ ] **Backend**: Implement 2FA logic (TOTP).
- [ ] **Frontend**: Add 2FA Setup in Profile.
- [ ] **Backend**: Implement Audit Logging.

## Phase 3: Developer / API / Integration

### 3.1 RESTful API

- [ ] **Backend**: Standardize API responses.
- [ ] **Backend**: Generate Swagger/OpenAPI documentation.
- [ ] **Frontend**: Create Developer Documentation portal.

### 3.2 API Key / Token Management

- [ ] **Backend**: Implement API Key generation & hashing.
- [ ] **Backend**: Implement API Key Guard.
- [ ] **Frontend**: Create "API Keys" management page.

### 3.3 Webhooks

- [ ] **Backend**: Implement Webhook dispatching system.
- [ ] **Frontend**: Create Webhook configuration UI.
