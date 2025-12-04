# PingTO.Me Detailed Todo List

Derived from `plan.md` and current project status.
**Last Updated:** 2025-12-04

## Phase 1: Core Link & Analytics (End-User Features)

### 1.1 User Registration & Authentication

- [x] **Backend**: Implement `AuthService` (Login, Register, OAuth).
- [x] **Backend**: Setup Passport strategies (Local, Google, GitHub).
- [x] **Frontend**: Create Login page (`/login`).
- [x] **Frontend**: Create Register page (`/register`).
- [x] **Frontend**: Implement "Forgot Password" flow.
- [x] **Frontend**: Implement Profile Management (Update name, avatar, password).
- [x] **Frontend**: Implement Logout functionality.

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
- [x] **Frontend**: Implement Bulk Tagging UI.

### 1.6 Link Organization

- [x] **Backend**: Implement Tags CRUD.
- [x] **Backend**: Implement Campaigns CRUD.
- [x] **Frontend**: Add Tag management UI (Create, Assign to Link).
- [x] **Frontend**: Add Campaign management UI.
- [x] **Frontend**: Add Filters to `LinksTable` (by Tag, Campaign, Date).
- [x] **Frontend**: Implement Edit Link modal (assign campaign).
- [x] **Backend**: Implement Folders CRUD.
- [x] **Frontend**: Add Folder management UI.

### 1.7 Link Analytics (Per-Link)

- [x] **Backend**: Implement `AnalyticsService.trackClick`.
- [x] **Backend**: Implement `AnalyticsService.getLinkAnalytics`.
- [x] **Frontend**: Create Analytics Page (`/dashboard/analytics/[id]`).
- [x] **Frontend**: Implement Charts (Clicks over time).
- [x] **Frontend**: Implement Recent Activity Table.
- [x] **Frontend**: Add Device and Referrer breakdown charts.
- [x] **Frontend**: Add Geographic map visualization.
- [x] **Frontend**: Add Export Analytics button.

### 1.8 Dashboard Overview

- [x] **Frontend**: Create Dashboard Layout.
- [x] **Frontend**: Display Recent Links.
- [x] **Backend**: Implement `DashboardService.getOverviewMetrics`.
- [x] **Frontend**: Add Aggregate Metrics Cards (Total Clicks, Active Links).
- [x] **Frontend**: Add "Clicks over time" chart for _all_ links.
- [x] **Frontend**: Add Date Range Filter buttons.
- [x] **Frontend**: Add Top Performing Links widget.

### 1.9 Link-in-Bio / Mini-Page

- [x] **Backend**: Define `BioPage` schema (already in Prisma).
- [x] **Backend**: Implement Bio Page CRUD endpoints.
- [x] **Frontend**: Create Bio Page Builder UI.
- [x] **Frontend**: Create Public Bio Page renderer (`/bio/[slug]`).
- [x] **Frontend**: Add Theme customization options.
- [x] **Frontend**: Add Link reordering functionality.
- [x] **Frontend**: Add Bio Page Analytics tab.

### 1.10 Link Status Control

- [x] **Backend**: Support `ACTIVE`, `DISABLED`, `BANNED` status.
- [x] **Frontend**: Display status in `LinksTable`.
- [x] **Frontend**: Add toggle to Enable/Disable links.
- [x] **Frontend**: Implement "Archive" functionality.
- [x] **Backend**: Implement Expiration Date check in Redirector.

### 1.11 Notifications

- [x] **Backend**: Implement Notification Service.
- [x] **Frontend**: Add Notification Bell in Header.
- [x] **Frontend**: Create Notification Center UI.
- [x] **Frontend**: Add Mark All as Read functionality.

### 1.12 Plan Upgrade / Payment

- [x] **Backend**: Integrate Stripe (Checkout, Webhooks).
- [x] **Frontend**: Create Pricing Page (Public & In-App).
- [x] **Frontend**: Implement Checkout flow.
- [x] **Frontend**: Create Billing Portal (View Invoices, Manage Subscription).

---

## E2E Test Implementation Status

**Total: 52/75 tests implemented (69%)**

### 1.1 Authentication Tests (9/10)

- [x] `AUTH-001`: User Registration - Success
- [x] `AUTH-002`: User Registration - Invalid Password
- [x] `AUTH-003`: User Registration - Duplicate Email
- [x] `AUTH-004`: User Login - Success
- [x] `AUTH-005`: User Login - Invalid Credentials
- [ ] `AUTH-006`: OAuth Login (Google) - Requires OAuth mock
- [x] `AUTH-007`: Forgot Password
- [x] `AUTH-008`: Profile Update - Needs UI `/settings/profile`
- [x] `AUTH-009`: Change Password - Needs UI `/settings/security`
- [x] `AUTH-010`: Logout

### 1.2 Link Creation Tests (7/12)

- [x] `LINK-001`: Create Short Link - Random Slug
- [x] `LINK-002`: Create Short Link - Custom Slug
- [x] `LINK-003`: Create Short Link - Invalid URL
- [x] `LINK-004`: Create Short Link - Duplicate Custom Slug
- [x] `LINK-005`: Create Short Link - With Tags
- [x] `LINK-006`: Create Short Link - With Expiration
- [x] `LINK-007`: Create Short Link - Password Protected
- [ ] `LINK-008`: Redirect - Basic (Redirector test)
- [ ] `LINK-009`: Redirect - 404 (Redirector test)
- [ ] `LINK-010`: Redirect - Password (Redirector test)
- [ ] `LINK-011`: Redirect - Expired (Redirector test)
- [ ] `LINK-012`: Redirect - Disabled (Redirector test)

### 1.3 Custom Domain Tests (4/6)

- [x] `DOM-001`: Add Custom Domain
- [x] `DOM-002`: Verify Domain DNS
- [x] `DOM-003`: Verify Domain DNS - Failed
- [ ] `DOM-004`: Create Link with Custom Domain
- [ ] `DOM-005`: Check Slug Availability
- [x] `DOM-006`: Remove Domain

### 1.4 QR Code Tests (3/5)

- [x] `QR-001`: Generate QR Code
- [x] `QR-002`: Customize QR Code
- [x] `QR-003`: Download QR Code
- [ ] `QR-004`: Scan QR Code (Simulated)
- [ ] `QR-005`: Batch Download QR

### 1.5 Bulk Management Tests (5/5) ✅

- [x] `BULK-001`: Import Links via CSV
- [x] `BULK-002`: Import Links - Validation Error
- [x] `BULK-003`: Export Links
- [x] `BULK-004`: Bulk Delete
- [x] `BULK-005`: Bulk Tagging

### 1.6 Link Organization Tests (4/7)

- [x] `ORG-001`: Create Tag
- [x] `ORG-002`: Filter by Tag
- [x] `ORG-003`: Create Campaign
- [ ] `ORG-004`: Assign Link to Campaign - Needs Edit Link UI
- [ ] `ORG-005`: Create Folder - Folders not implemented
- [ ] `ORG-006`: Move Link to Folder - Folders not implemented
- [x] `ORG-007`: Delete Tag

### 1.7 Link Analytics Tests (5/7)

- [ ] `ANA-001`: Track Click (Redirector/Backend test)
- [x] `ANA-002`: Track Referrer
- [x] `ANA-003`: Track Device
- [x] `ANA-004`: Geo Location
- [x] `ANA-005`: Time Series Graph
- [x] `ANA-006`: Export Analytics
- [ ] `ANA-007`: Unique Clicks (Backend test)

### 1.8 Dashboard Tests (4/4) ✅

- [x] `DASH-001`: View Metrics
- [x] `DASH-002`: Recent Activity
- [x] `DASH-003`: Date Range Filter
- [x] `DASH-004`: Top Performing Links

### 1.9 Link-in-Bio Tests (5/6)

- [x] `BIO-001`: Create Bio Page
- [x] `BIO-002`: Add Links to Bio Page
- [x] `BIO-003`: Public View
- [x] `BIO-004`: Reorder Links
- [x] `BIO-005`: Customize Theme
- [ ] `BIO-006`: Page Analytics - Needs Analytics tab

### 1.10 Link Status Tests (3/5)

- [x] `STAT-001`: Disable Link
- [ ] `STAT-002`: Verify Disabled Link (Redirector test)
- [x] `STAT-003`: Archive Link
- [x] `STAT-004`: Restore Link
- [ ] `STAT-005`: Link Expiration (Time mock needed)

### 1.11 Notification Tests (3/4)

- [x] `NOTIF-001`: In-App Notification
- [x] `NOTIF-002`: Mark as Read
- [ ] `NOTIF-003`: Email Notification (Backend test)
- [x] `NOTIF-004`: Notification Settings

### 1.12 Payment Tests (0/4)

- [ ] `PAY-001`: View Pricing
- [ ] `PAY-002`: Upgrade Plan
- [ ] `PAY-003`: Downgrade Plan
- [ ] `PAY-004`: Billing History

---

## Phase 2: Admin & Team Management

### 2.1 Organization/Workspace

- [x] **Backend**: Define `Organization` schema.
- [x] **Backend**: Implement Org CRUD.
- [x] **Frontend**: Create Organization Settings page.
- [x] **Frontend**: Implement Org Switcher in Header.

### 2.2 Member Invite / Remove

- [x] **Backend**: Implement Invitation logic (Send Email).
- [x] **Backend**: Implement "Accept Invite" flow.
- [x] **Frontend**: Create "Team Members" page.
- [x] **Frontend**: Add "Invite Member" modal.

### 2.3 Role-Based Access Control (RBAC)

- [x] **Backend**: Implement RBAC Guards (`@Roles('ADMIN')`).
- [x] **Backend**: Enforce permissions in Services.
- [x] **Frontend**: Hide/Disable UI elements based on role.

### 2.4 Security Options

- [x] **Backend**: Implement 2FA logic (TOTP).
- [x] **Frontend**: Add 2FA Setup in Profile.
- [x] **Backend**: Implement Audit Logging.

## Phase 3: Developer / API / Integration

### 3.1 RESTful API

- [x] **Backend**: Standardize API responses.
- [x] **Backend**: Generate Swagger/OpenAPI documentation.
- [x] **Frontend**: Create Developer Documentation portal.

### 3.2 API Key / Token Management

- [x] **Backend**: Implement API Key generation & hashing.
- [x] **Backend**: Implement API Key Guard.
- [x] **Frontend**: Create "API Keys" management page.

### 3.3 Webhooks

- [x] **Backend**: Implement Webhook dispatching system.
- [x] **Frontend**: Create Webhook configuration UI.
