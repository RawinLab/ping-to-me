# Bitly Clone Platform: Comprehensive Feature Specification

---

## 1. End-User Features (Core Link & Analytics)

### 1.1 User Registration & Authentication

**Description:**
ระบบการจดทะเบียนและการเข้าสู่ระบบสำหรับผู้ใช้ปลายทาง

**Detailed Features:**

- **Sign-Up:**
  - Email/password registration with validation (email format, password strength ≥8 chars, 1 uppercase, 1 number, 1 special)
  - OAuth integration: Google, Facebook, GitHub (future: LinkedIn)
  - Email verification (send OTP/link, valid 24 hours)
  - Terms of service & privacy policy acceptance
  - Optional: CAPTCHA for spam prevention

- **Login:**
  - Email/password login with remember-me option
  - Magic link login (email-based, no password)
  - OAuth login flow
  - Session timeout configurable per plan
  - Account lockout after 5 failed attempts (30 min cooldown)

- **Profile Management:**
  - Edit name, profile picture, email
  - Change password with current password verification
  - Email preferences (notifications, marketing)
  - Delete account with 30-day grace period
  - Two-Factor Authentication (2FA) optional: TOTP apps (Google Authenticator, Authy)

**API Endpoints:**

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/magic-link` - Request magic link
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `POST /profile/enable-2fa` - Enable 2FA
- `POST /profile/verify-2fa` - Verify 2FA setup
- `DELETE /profile` - Delete account

**Database Schema:**
CREATE TABLE users (
id UUID PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255),
full_name VARCHAR(255),
avatar_url VARCHAR(500),
email_verified BOOLEAN DEFAULT FALSE,
verified_at TIMESTAMP,
twofa_enabled BOOLEAN DEFAULT FALSE,
twofa_secret VARCHAR(32),
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
deleted_at TIMESTAMP
);

CREATE TABLE oauth_accounts (
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
provider VARCHAR(50),
provider_id VARCHAR(255),
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(provider, provider_id)
);

---

### 1.2 Short Link Creation

**Description:**
สร้าง short URL จาก long URL พร้อมการตรวจสอบความปลอดภัย

**Detailed Features:**

- **URL Input & Validation:**
  - Accept long URL input (max 2048 characters)
  - Validate URL format (HTTP/HTTPS protocol required)
  - Check for blocked/blacklisted domains (malware, phishing databases)
  - Spam detection: check if URL redirects to known spam
  - Optional title/description for link (max 200 chars)

- **Auto-Generate Short Link:**
  - Generate random slug (alphanumeric, 6-8 chars) if not custom
  - Ensure uniqueness per domain
  - Check slug not reserved (e.g., "api", "dashboard", "admin")
  - Incrementally retry if collision

- **Link Metadata:**
  - Title (optional): display name for link management
  - Tags (multiple): for organization and filtering
  - Campaign assignment: link to campaign/project
  - Folder/category: hierarchical organization
  - Expiration date (optional): auto-disable after date
  - Password protection (optional): require password on redirect
  - Note/description: internal notes for team

- **Link Options:**
  - Redirect type: 301 (permanent) / 302 (temporary)
  - Track parameters: preserve UTM params from original long URL
  - Deep link: mobile app fallback URL
  - QR enabled: auto-generate QR code

**API Endpoints:**

- `POST /links` - Create new short link
- `GET /links` - List user's links (with pagination, filters)
- `GET /links/:id` - Get link details
- `PATCH /links/:id` - Update link (target URL, title, tags, etc.)
- `DELETE /links/:id` - Soft delete link
- `POST /links/:id/restore` - Restore deleted link

**Database Schema:**
CREATE TABLE links (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
user_id UUID REFERENCES users(id),
domain_id UUID REFERENCES domains(id),
slug VARCHAR(50) NOT NULL,
target_url VARCHAR(2048) NOT NULL,
title VARCHAR(200),
description TEXT,
status VARCHAR(20) DEFAULT 'active', -- active, disabled, archived
redirect_type VARCHAR(10) DEFAULT '301', -- 301, 302
password_hash VARCHAR(255),
expires_at TIMESTAMP,
deep_link_ios VARCHAR(500),
deep_link_android VARCHAR(500),
qr_enabled BOOLEAN DEFAULT TRUE,
click_count INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
UNIQUE(domain_id, slug)
);

CREATE TABLE link_tags (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id) ON DELETE CASCADE,
tag_name VARCHAR(100),
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(link_id, tag_name)
);

CREATE TABLE link_metadata (
link_id UUID PRIMARY KEY REFERENCES links(id),
campaign_id UUID REFERENCES campaigns(id),
folder_id UUID REFERENCES folders(id),
created_at TIMESTAMP DEFAULT NOW()
);

---

### 1.3 Custom Domain & Slug

**Description:**
ให้ผู้ใช้ใช้ domain ของตนเองหรือ slug ที่กำหนดเอง

**Detailed Features:**

- **Custom Slug:**
  - User-defined slug (alphanumeric, hyphens, underscores; no spaces)
  - Slug length: 3-50 characters
  - Slug format validation (no reserved words)
  - Availability check in real-time
  - Conflict resolution: suggest alternatives if taken

- **Domain Management (User Level):**
  - Select from organization's verified domains
  - Bitly's default short domain (e.g., brnd.ly) available if no custom
  - Future: support per-link domain override

- **Domain Verification:**
  - DNS validation: CNAME or TXT record check
  - Automated verification (check hourly)
  - Manual re-verify option
  - Certificate/SSL auto-provisioning (HTTPS enforcement)

**API Endpoints:**

- `POST /links/check-slug` - Check slug availability
- `GET /domains` - List available domains for user/org
- `POST /domains` - Add new domain (org level)
- `PATCH /domains/:id` - Update domain settings
- `POST /domains/:id/verify` - Trigger DNS verification

**Database Schema:**
CREATE TABLE domains (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
domain_name VARCHAR(255) UNIQUE NOT NULL,
status VARCHAR(20) DEFAULT 'pending', -- pending, verified, failed
verification_method VARCHAR(10), -- cname, txt
verification_value VARCHAR(500),
verified_at TIMESTAMP,
is_default BOOLEAN DEFAULT FALSE,
ssl_status VARCHAR(20), -- provisioning, active
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

---

### 1.4 QR Code Generation

**Description:**
สร้างและดาวน์โหลด QR code สำหรับแต่ละลิงก์

**Detailed Features:**

- **QR Generation:**
  - Generate QR code from short link URL
  - Library: `qrcode` npm package or similar
  - Encode link with optional metadata (e.g., utm params)
  - Multiple format support: PNG, SVG, PDF
  - Multiple size options: 200px, 300px, 500px, 1000px

- **QR Customization:**
  - Color: foreground/background color picker (hex codes)
  - Logo overlay: upload and embed brand logo (center, configurable size)
  - Error correction level: L (7%), M (15%), Q (25%), H (30%)
  - Border/quiet zone: configurable margin

- **QR Download:**
  - One-click download as PNG/SVG/PDF
  - Batch download: ZIP file with multiple QRs
  - Print-friendly: PDF generation with link info

- **QR Analytics:**
  - Track clicks from QR separately (if scannable tracked)
  - Link shortener can differentiate QR vs direct link clicks

**API Endpoints:**

- `POST /links/:id/qr` - Generate QR code
- `GET /links/:id/qr` - Fetch QR (PNG/SVG/PDF)
- `POST /links/:id/qr/download` - Download QR
- `POST /links/batch-qr/download` - Batch download multiple QRs

**QR Config Schema:**
CREATE TABLE qr_codes (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id) ON DELETE CASCADE,
foreground_color VARCHAR(7) DEFAULT '#000000',
background_color VARCHAR(7) DEFAULT '#FFFFFF',
logo_url VARCHAR(500),
logo_size_percent INTEGER DEFAULT 20,
error_correction VARCHAR(1) DEFAULT 'M',
border_size INTEGER DEFAULT 2,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

---

### 1.5 Bulk Link Management

**Description:**
นำเข้า/ส่งออกและแก้ไขลิงก์หลายรายการพร้อมกัน

**Detailed Features:**

- **Bulk Import:**
  - Upload CSV file: columns = long_url, slug (optional), title, tags, expires_at
  - Validation: check each row, report errors
  - Preview before import: show parsed data, allow edit
  - Batch create: all at once or scheduled over time
  - Max rows per upload: configurable (e.g., 1000)

- **Bulk Export:**
  - Export user's links to CSV/JSON
  - Configurable columns: slug, domain, target_url, title, tags, clicks, created_at, status
  - Filter before export: by tag, campaign, date range, status
  - Scheduled export: auto-email periodic CSV

- **Bulk Edit:**
  - Multi-select links from table
  - Batch actions: add tag, change status, set expiry, move to campaign
  - Confirm changes before apply

- **Bulk Delete/Archive:**
  - Select multiple links
  - Archive or permanently delete
  - Confirmation dialog with undo option (for archive)

**API Endpoints:**

- `POST /links/import` - Bulk import from CSV
- `POST /links/export` - Bulk export to CSV/JSON
- `POST /links/bulk-edit` - Apply changes to multiple links
- `POST /links/bulk-delete` - Soft delete multiple links
- `GET /links/import-status/:taskId` - Check import progress

---

### 1.6 Link Organization (Tags, Folders, Campaigns)

**Description:**
จัดกลุ่มและค้นหาลิงก์อย่างมีประสิทธิภาพ

**Detailed Features:**

- **Tags:**
  - Create/manage tags (flat structure)
  - Assign multiple tags per link
  - Tag autocomplete in UI
  - Color-coded tags (optional)
  - Rename/delete tags (batch rename if used across links)
  - Tag suggestions based on usage

- **Folders/Categories:**
  - Hierarchical folder structure (optional nesting)
  - Drag-and-drop to move links between folders
  - Folder permissions: inherit org-level RBAC
  - Archive entire folder with all links

- **Campaigns:**
  - Define campaigns (e.g., "Black Friday 2025", "Product Launch Q1")
  - Link multiple links to one campaign
  - Campaign performance aggregation: total clicks, unique clicks
  - Campaign-level analytics dashboard
  - Campaign date range (start/end)

- **Search & Filter:**
  - Full-text search: by title, description, slug, target URL
  - Filter by: tag, campaign, folder, domain, status, date range
  - Saved filters: bookmark frequently used filter combinations
  - Advanced search: combine multiple filters with AND/OR logic

**API Endpoints:**

- `POST /tags` - Create tag
- `GET /tags` - List tags
- `PATCH /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag
- `POST /folders` - Create folder
- `GET /folders` - List folders
- `PATCH /folders/:id` - Update folder
- `DELETE /folders/:id` - Delete folder
- `POST /campaigns` - Create campaign
- `GET /campaigns` - List campaigns
- `GET /campaigns/:id/stats` - Campaign analytics
- `POST /links/search` - Search links with filters

**Database Schema:**
CREATE TABLE tags (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
name VARCHAR(100) NOT NULL,
color VARCHAR(7),
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(org_id, name)
);

CREATE TABLE folders (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
name VARCHAR(255) NOT NULL,
parent_folder_id UUID REFERENCES folders(id),
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaigns (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
name VARCHAR(255) NOT NULL,
description TEXT,
start_date DATE,
end_date DATE,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_links (
campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
link_id UUID REFERENCES links(id) ON DELETE CASCADE,
PRIMARY KEY (campaign_id, link_id)
);

---

### 1.7 Link Analytics (Per-Link Dashboard)

**Description:**
แสดงรายละเอียดการคลิกและพฤติกรรมผู้ใช้ต่อลิงก์

**Detailed Features:**

- **Click Metrics:**
  - Total clicks (sum of all clicks)
  - Unique clicks (unique user sessions/IP-based deduplication)
  - Click-through rate (CTR) if impression data available
  - Clicks over time: hourly, daily, weekly, monthly aggregates
  - Trending: compare current period vs previous period (% change)

- **Traffic Sources:**
  - Top referrers: which sites/apps sent traffic
  - Direct traffic: no referrer header
  - Social media platforms detected
  - Search engine traffic if available
  - QR code vs direct link clicks (if UTM tracked)

- **Geographic Analytics:**
  - Clicks by country (top 10 countries)
  - Clicks by city (for users' location available)
  - Interactive map visualization
  - Data source: GeoIP database (MaxMind or similar)

- **Device & Browser Analytics:**
  - Device type breakdown: mobile, desktop, tablet (pie chart)
  - Top operating systems: iOS, Android, Windows, macOS, Linux
  - Browser breakdown: Chrome, Safari, Firefox, Edge, etc.
  - Device models (optional, for breakdown)

- **User Agent & Platform:**
  - Aggregate user-agent info (hashed/anonymized)
  - Detect app opens vs web browsers
  - Bot detection (optional)

- **Time-Series Data:**
  - Display graphs by time range: 7d, 30d, 90d, 1y, custom
  - Hour-of-day heatmap: when users click most
  - Day-of-week pattern analysis

- **Export & Reports:**
  - Download analytics as CSV/JSON for selected period
  - Email scheduled reports (daily/weekly/monthly)
  - PDF report generation with charts

**API Endpoints:**

- `GET /links/:id/analytics/summary` - Total clicks, unique clicks, top referrers
- `GET /links/:id/analytics/timeseries` - Clicks by time (hourly/daily)
- `GET /links/:id/analytics/geo` - Geographic breakdown
- `GET /links/:id/analytics/devices` - Device/browser breakdown
- `GET /links/:id/analytics/referrers` - Referrer sources
- `GET /links/:id/analytics/export` - Export data
- `POST /links/:id/analytics/schedule-report` - Schedule email report

**Database Schema:**
CREATE TABLE link_clicks_raw (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id),
timestamp TIMESTAMP DEFAULT NOW(),
referrer VARCHAR(2048),
user_agent_hash VARCHAR(64),
ip_hash VARCHAR(64),
country_code VARCHAR(2),
city VARCHAR(100),
device_type VARCHAR(20), -- mobile, desktop, tablet
browser VARCHAR(50),
os VARCHAR(50),
session_id VARCHAR(100),
INDEX(link_id, timestamp)
);

CREATE TABLE stats_daily (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id),
date DATE,
total_clicks INTEGER DEFAULT 0,
unique_clicks INTEGER DEFAULT 0,
top_referrer VARCHAR(500),
top_device VARCHAR(50),
top_country VARCHAR(2),
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(link_id, date)
);

CREATE TABLE referrer_stats (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id),
referrer VARCHAR(500),
click_count INTEGER DEFAULT 0,
last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE device_stats (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id),
device_type VARCHAR(20),
browser VARCHAR(50),
os VARCHAR(50),
click_count INTEGER DEFAULT 0,
last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE geo_stats (
id UUID PRIMARY KEY,
link_id UUID REFERENCES links(id),
country_code VARCHAR(2),
city VARCHAR(100),
click_count INTEGER DEFAULT 0,
last_updated TIMESTAMP DEFAULT NOW()
);

---

### 1.8 Dashboard Overview (Aggregate View)

**Description:**
แดชบอร์ดรวมที่แสดงภาพรวมตัวชี้วัดหลัก

**Detailed Features:**

- **Key Metrics Cards:**
  - Total links created (all-time)
  - Total clicks (all-time or this month)
  - Total unique visitors
  - Average clicks per link
  - Status: # active, # disabled, # archived

- **Period Selector:**
  - Quick select: Today, 7 days, 30 days, 90 days, 1 year, Custom range
  - Compare periods: current vs previous (show % change)

- **Charts & Visualizations:**
  - Line chart: clicks over time (selected period, daily granularity)
  - Bar chart: top 10 links by clicks
  - Pie chart: device breakdown
  - Geo map: geographic click distribution (optional)
  - Referrer breakdown (bar chart)

- **Recent Activity Feed:**
  - Latest links created (last 5-10)
  - Recent clicks (sample of latest clicks)
  - Team activity: if in organization, show recent changes
  - Notifications: plan upgrade reminders, quota warnings

- **Quick Actions:**
  - "Create Link" button
  - "View All Links" link to list page
  - "Export Report" button
  - "Share Dashboard" (if public dashboard feature)

- **Customizable Dashboard:**
  - Drag-and-drop widget arrangement
  - Pin/unpin widgets
  - Save custom dashboard layouts

**Frontend Components (React/shadcn):**

- MetricCard (KPI display)
- LineChart, BarChart, PieChart (Recharts or Chart.js)
- DataTable (recent activity)
- DateRangePicker (period selector)
- PeriodComparison (show delta)

**API Endpoints:**

- `GET /dashboard/metrics` - Get KPI data
- `GET /dashboard/analytics/overview` - Chart data
- `GET /dashboard/links/top` - Top 10 links
- `GET /dashboard/activity` - Recent activity feed
- `POST /dashboard/save-layout` - Save dashboard layout

---

### 1.9 Link-in-Bio / Mini-Page

**Description:**
สร้างหน้าที่รวมลิงก์หลายรายการที่สามารถแก้ไขได้

**Detailed Features:**

- **Page Creation:**
  - Create link-in-bio page, assign short URL/slug
  - Public shareable link (e.g., brnd.ly/mypage)
  - Editable title, bio/description, profile picture
  - Social media icons/links (optional)

- **Link Management on Page:**
  - Add/remove/reorder links via drag-and-drop
  - Each link shows: title, icon, click count (optional)
  - Links can be from same org or external URLs
  - Support button styling per link

- **Theme/Customization:**
  - Pre-built themes: minimalist, colorful, dark mode, neon, gradient
  - Color customization: primary color, background color, button color
  - Font selection: system fonts + custom font import
  - Background: solid color, gradient, image upload

- **Layout Options:**
  - Stacked (vertical list) - default
  - Grid (2-3 columns)
  - Carousel (swipe through links)
  - Tabs (group links by category)

- **Analytics on Page:**
  - Track page views (unique visitors)
  - Track clicks per link on the page
  - Traffic source for page view
  - Device/geo breakdown for page visitors

- **Sharing & Embedding:**
  - Generate QR code for the page
  - Embed option: embed link-in-bio on own website via iframe/script
  - Share to social media (pre-fill text)
  - Copy shareable URL

**API Endpoints:**

- `POST /link-in-bio` - Create new page
- `GET /link-in-bio/:id` - Get page details (public access)
- `PATCH /link-in-bio/:id` - Update page content/theme
- `DELETE /link-in-bio/:id` - Delete page
- `POST /link-in-bio/:id/links` - Add link to page
- `PATCH /link-in-bio/:id/links/:linkId` - Update link on page
- `DELETE /link-in-bio/:id/links/:linkId` - Remove link from page
- `GET /link-in-bio/:id/analytics` - Page analytics
- `GET /link-in-bio/:slug` - Public page render (no auth)

**Database Schema:**
CREATE TABLE link_in_bio_pages (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
user_id UUID REFERENCES users(id),
slug VARCHAR(50) UNIQUE NOT NULL,
title VARCHAR(200),
bio TEXT,
profile_picture_url VARCHAR(500),
theme_name VARCHAR(50),
primary_color VARCHAR(7),
background_color VARCHAR(7),
background_image_url VARCHAR(500),
layout_type VARCHAR(20), -- stacked, grid, carousel, tabs
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
views_count INTEGER DEFAULT 0
);

CREATE TABLE link_in_bio_items (
id UUID PRIMARY KEY,
page_id UUID REFERENCES link_in_bio_pages(id) ON DELETE CASCADE,
link_id UUID REFERENCES links(id),
title VARCHAR(200),
icon_url VARCHAR(500),
display_order INTEGER,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE link_in_bio_analytics (
id UUID PRIMARY KEY,
page_id UUID REFERENCES link_in_bio_pages(id),
date DATE,
page_views INTEGER DEFAULT 0,
unique_visitors INTEGER DEFAULT 0,
click_count INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT NOW()
);

---

### 1.10 Link Status Control

**Description:**
เปิด/ปิดลิงก์และจัดการสถานะอื่นๆ

**Detailed Features:**

- **Link Status:**
  - Active: link works normally
  - Disabled: link returns 404 or custom message (owner can re-enable)
  - Archived: hidden from main list but recoverable
  - Expired: auto-disabled after expiration date

- **Actions:**
  - Toggle active/disabled via button/switch in UI
  - Archive multiple links (batch action)
  - Restore archived links
  - Permanently delete (after grace period)
  - Set expiration date (auto-disable on date)

- **On Redirect:**
  - If disabled: serve placeholder page with message (e.g., "This link is no longer available")
  - Custom message per link (optional)
  - Redirect to fallback URL (optional)

- **Notifications:**
  - Notify user when link is about to expire (7 days, 1 day before)
  - Option to auto-renew or extend expiry

**API Endpoints:**

- `PATCH /links/:id/status` - Change link status
- `PATCH /links/:id/expiry` - Set/update expiration date
- `POST /links/:id/disable` - Disable link
- `POST /links/:id/enable` - Enable link
- `POST /links/:id/archive` - Archive link
- `POST /links/:id/restore` - Restore link
- `DELETE /links/:id/permanent` - Permanently delete

---

### 1.11 Notifications

**Description:**
แจ้งเตือนเกี่ยวกับเหตุการณ์สำคัญและโควต้า

**Detailed Features:**

- **In-App Notifications:**
  - Bell icon in header showing unread count
  - Notification center dropdown/modal
  - Mark as read, clear old notifications

- **Notification Types:**
  - Plan quota warnings: "You've used 80% of links this month"
  - Link expiry reminders: "3 links expiring in 7 days"
  - Team invitations: "You've been invited to join Team X"
  - Analytics milestones: "This link reached 1000 clicks!"
  - Plan upgrade available: "Premium features you might like"
  - Security alerts: "New device login detected"

- **Email Notifications:**
  - Configurable per notification type (opt-in/opt-out)
  - Digest email: daily or weekly summary
  - Immediate alerts: for critical events (security, plan exceeded)

- **Notification History:**
  - View past notifications (60-90 day retention)
  - Filter by type, date range
  - Delete individual notifications

**API Endpoints:**

- `GET /notifications` - List user notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `DELETE /notifications/:id` - Delete notification
- `PATCH /notifications/settings` - Update notification preferences
- `POST /notifications/send-test` - Send test notification

**Database Schema:**
CREATE TABLE notifications (
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
type VARCHAR(50), -- quota_warning, link_expiry, team_invite, etc.
title VARCHAR(255),
message TEXT,
related_link_id UUID REFERENCES links(id),
read_at TIMESTAMP,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
user_id UUID PRIMARY KEY REFERENCES users(id),
quota_warning_email BOOLEAN DEFAULT TRUE,
link_expiry_email BOOLEAN DEFAULT TRUE,
team_invite_email BOOLEAN DEFAULT TRUE,
milestone_in_app BOOLEAN DEFAULT TRUE,
digest_email_frequency VARCHAR(20), -- daily, weekly, none
created_at TIMESTAMP DEFAULT NOW()
);

---

### 1.12 Plan Upgrade / Payment Portal

**Description:**
จัดการการสมัครสมาชิกและการชำระเงิน

**Detailed Features:**

- **Plan Tiers:**
  - Free: 50 links/month, basic analytics, 30-day retention
  - Pro: 1000 links/month, advanced analytics, 90-day retention, custom domains, team features ($9.99/month or yearly)
  - Enterprise: unlimited, SLA, dedicated support, custom features (quote-based)

- **Pricing Page:**
  - Display plan comparison table (features, limits, price)
  - Annual vs monthly billing toggle (show discount)
  - Sign-up buttons per plan
  - FAQ section
  - Feature highlights

- **Billing Management:**
  - Payment method management: add/update/delete credit card
  - Billing history: invoices, payment receipts (downloadable PDF)
  - Invoice details: items, taxes, total
  - Auto-renewal status (on/off)
  - Next billing date display

- **Upgrade/Downgrade Flow:**
  - Upgrade: click "Upgrade" button, select plan, enter payment
  - Downgrade: confirm data retention policy, effective date
  - Prorated billing: calculate credit for mid-month changes
  - Cancellation: cancel subscription with grace period option

- **Payment Processing:**
  - Stripe integration for payment gateway
  - Secure card tokenization (PCI compliant)
  - 3D Secure/SCA for international cards
  - Invoice generation and emailing

- **Usage Dashboard:**
  - Current plan details
  - Usage bar: links used vs limit, analytics retention
  - Upgrade recommendation if near quota

**API Endpoints:**

- `GET /billing/plans` - List available plans
- `GET /billing/current-plan` - Get current user's plan
- `POST /billing/upgrade` - Upgrade to plan
- `POST /billing/downgrade` - Downgrade plan
- `POST /billing/cancel` - Cancel subscription
- `GET /billing/invoices` - List invoices
- `GET /billing/invoices/:id` - Download invoice
- `PATCH /billing/payment-method` - Update payment method
- `POST /billing/payment-method` - Add new payment method

---

## 2. Admin & Team Management Features

### 2.1 Organization/Workspace

**Description:**
สร้างและจัดสรรทีมพร้อมระบบบทบาท

**Detailed Features:**

- **Organization Creation:**
  - Name, logo, default domain
  - Type: personal, small team, enterprise (affects features/limits)
  - Time zone (for analytics display, scheduled reports)

- **Multi-Role System:**
  - **OWNER:** Full access, can delete org, manage billing, manage roles
  - **ADMIN:** Create links, manage team members, manage domains, view analytics
  - **EDITOR:** Create/edit/delete own links and any org links, view analytics
  - **VIEWER:** View-only access to links and analytics, cannot create/edit

- **Organization Settings:**
  - Edit name, logo, description
  - Time zone configuration
  - Default domain selection
  - Data retention policy (for org)
  - IP allowlist (enterprise feature, optional)

- **Member Visibility:**
  - List all org members with roles
  - See member join date, last active date
  - View member's created links count

**API Endpoints:**

- `POST /orgs` - Create organization
- `GET /orgs` - List user's organizations
- `GET /orgs/:id` - Get org details
- `PATCH /orgs/:id` - Update org settings
- `DELETE /orgs/:id` - Delete organization (owner only)
- `GET /orgs/:id/members` - List org members
- `GET /orgs/:id/settings` - Get org settings

**Database Schema:**
CREATE TABLE organizations (
id UUID PRIMARY KEY,
owner_id UUID REFERENCES users(id),
name VARCHAR(255) NOT NULL,
logo_url VARCHAR(500),
description TEXT,
timezone VARCHAR(50) DEFAULT 'UTC',
data_retention_days INTEGER DEFAULT 90,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE org_members (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
user_id UUID REFERENCES users(id),
role VARCHAR(20), -- owner, admin, editor, viewer
joined_at TIMESTAMP DEFAULT NOW(),
invited_by UUID REFERENCES users(id),
UNIQUE(org_id, user_id)
);

CREATE TABLE org_settings (
org_id UUID PRIMARY KEY REFERENCES organizations(id),
timezone VARCHAR(50),
ip_allowlist TEXT, -- JSON array of IPs
sso_enabled BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

---

### 2.2 Member Invite / Remove

**Description:**
เชิญสมาชิกใหม่และจัดการการเป็นสมาชิก

**Detailed Features:**

- **Invite Member:**
  - Enter email address (can invite multiple at once)
  - Select role (admin, editor, viewer)
  - Optional personal message
  - Send invitation email with accept link (valid 7 days)
  - Track invited-pending status

- **Invitation Email:**
  - Personalized invitation message
  - Accept/decline buttons
  - Link to organization setup page
  - Sender info (who invited them)

- **Accept Invitation:**
  - Invitee clicks link, signs up or logs in
  - Auto-join organization with assigned role
  - Email confirmation of successful join

- **Remove Member:**
  - Admin/Owner can remove members
  - Confirmation dialog (can't undo immediately)
  - Removed member loses org access
  - Can be re-invited after removal
  - Offboarding: option to transfer links ownership

- **Resend Invitation:**
  - If invitee hasn't accepted, resend link (resets expiry to 7 days)
  - Cancel invitation (before acceptance)

**API Endpoints:**

- `POST /orgs/:id/invite` - Send invite to email
- `GET /orgs/:id/invitations` - List pending invitations
- `POST /orgs/:id/invitations/:inviteId/accept` - Accept invite
- `POST /orgs/:id/invitations/:inviteId/decline` - Decline invite
- `DELETE /orgs/:id/members/:userId` - Remove member
- `PATCH /orgs/:id/members/:userId/role` - Change member role
- `POST /orgs/:id/invitations/:inviteId/resend` - Resend invitation

**Database Schema:**
CREATE TABLE org_invitations (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
email VARCHAR(255) NOT NULL,
role VARCHAR(20),
invited_by UUID REFERENCES users(id),
created_at TIMESTAMP DEFAULT NOW(),
expires_at TIMESTAMP,
accepted_at TIMESTAMP,
UNIQUE(org_id, email)
);

---

### 2.3 Role-Based Access Control (RBAC)

**Description:**
ระบบควบคุมการเข้าถึงที่มีรายละเอียด

**Detailed Features:**

- **Permission Matrix:**
  - Define which role can perform which action on which resource
  - Resources: links, domains, team members, analytics, billing
  - Actions: create, read, update, delete, share, export

- **Link-Level Permissions:**
  - OWNER: full control (create, edit, delete all)
  - ADMIN: create/edit/delete org links, can edit others' links
  - EDITOR: create own links, can edit/delete own; can view others' links
  - VIEWER: view-only (no create/edit/delete)

- **Domain-Level Permissions:**
  - OWNER: manage all domains
  - ADMIN: manage org domains
  - EDITOR/VIEWER: can select from org domains, cannot create new

- **Team-Level Permissions:**
  - OWNER: manage members, roles, invites
  - ADMIN: manage members (cannot change owner role)
  - EDITOR/VIEWER: cannot manage team

- **Analytics Visibility:**
  - All roles can view analytics (but VIEWER cannot act on data)

- **API Access:**
  - API tokens inherit user role
  - Can create narrower-scope tokens (e.g., read-only, specific link)

- **Audit Logging:**
  - Log access attempts (both granted and denied)
  - Log data access by user/time/resource
  - Report suspicious access patterns

**API Endpoints:**

- `GET /rbac/permissions` - Get permissions matrix for user/role
- `GET /rbac/audit-log` - View audit log (admin/owner only)
- `POST /rbac/audit-log/export` - Export audit log

---

### 2.4 Branded Domains

**Description:**
เพิ่มและตรวจสอบโดเมนแบรนด์เฉพาะ

**Detailed Features:**

- **Add Custom Domain:**
  - Enter domain name (must own the domain)
  - System generates DNS verification record (CNAME or TXT)
  - Display instructions for adding DNS record

- **DNS Verification:**
  - Manual check: user clicks "Verify" after adding DNS record
  - Automated check: system polls DNS provider every 30 min (up to 48 hours)
  - Success: mark domain as verified, enable usage
  - Failure: display error message, guide to troubleshooting

- **Domain Assignment:**
  - Mark domain as default for organization
  - Use domain when creating new links
  - Override domain per link if needed
  - Support multiple domains per org

- **Domain Management:**
  - List all org's domains (with status: pending, verified, failed)
  - Edit domain settings (e.g., redirect policy, SSL options)
  - Remove domain (soft delete, can re-add)
  - View links using this domain
  - DNS record display for reference

- **SSL/HTTPS:**
  - Auto-provision SSL certificate (Let's Encrypt via Cloudflare/AWS)
  - Enforce HTTPS for all links
  - Certificate renewal automation

- **Domain Features:**
  - Subdomain support (optional): e.g., links.company.com
  - Wildcard records (future): \*.company.com
  - Custom IP geolocation redirect (future, enterprise)

**API Endpoints:**

- `POST /orgs/:id/domains` - Add domain
- `GET /orgs/:id/domains` - List org domains
- `GET /orgs/:id/domains/:domainId` - Get domain details
- `POST /orgs/:id/domains/:domainId/verify` - Trigger verification
- `PATCH /orgs/:id/domains/:domainId` - Update domain settings
- `DELETE /orgs/:id/domains/:domainId` - Remove domain
- `GET /orgs/:id/domains/:domainId/dns-record` - Get DNS record info

**Database Schema:**
CREATE TABLE domain_verification (
domain_id UUID PRIMARY KEY REFERENCES domains(id),
verification_type VARCHAR(10), -- cname, txt
cname_target VARCHAR(500),
txt_value VARCHAR(500),
verified_at TIMESTAMP,
verification_attempts INTEGER DEFAULT 0,
last_check TIMESTAMP
);

CREATE TABLE domain_certificates (
domain_id UUID PRIMARY KEY REFERENCES domains(id),
certificate_provider VARCHAR(50), -- letsencrypt, etc.
cert_thumbprint VARCHAR(255),
issued_at TIMESTAMP,
expires_at TIMESTAMP,
auto_renew BOOLEAN DEFAULT TRUE
);

---

### 2.5 Security Options

**Description:**
ตัวเลือกด้านความปลอดภัยในระดับ org/user

**Detailed Features:**

- **Two-Factor Authentication (2FA):**
  - User-level 2FA (already in Auth section)
  - Organization-wide enforcement (require 2FA for all members, configurable by role)
  - TOTP-based (Google Authenticator, Authy)
  - Backup codes for account recovery
  - Recovery option: email + security questions

- **Session Management:**
  - Session timeout (configurable: 30 min, 2 hours, 8 hours, never)
  - Auto-logout on tab close (optional)
  - View active sessions list
  - Force logout from other devices
  - Geographic anomaly detection (alert if login from unusual location)

- **API Key Security:**
  - Rotate API keys (generate new, deprecate old)
  - Key expiration dates (auto-expire after 90 days, optional)
  - Scope restrictions (read-only, write-only, specific endpoints)
  - Rate limiting per key
  - Track API key usage (calls, endpoints)

- **IP Allowlist (Enterprise):**
  - Restrict org access to specific IP addresses
  - CIDR notation support
  - Whitelist ranges for office networks
  - Override for specific situations (temp approval)

- **Login Activity:**
  - Log all login attempts (successful and failed)
  - Show user: device, location, IP, timestamp
  - Alert on suspicious activity
  - Block repeated failed login attempts

- **Data Access Logs:**
  - Log all resource access (links, analytics, team members)
  - Track who accessed what, when, from where
  - Export logs for compliance

**API Endpoints:**

- `PATCH /orgs/:id/security/2fa-enforcement` - Enable/disable 2FA requirement
- `PATCH /orgs/:id/security/session-timeout` - Set session timeout
- `GET /profile/sessions` - List active sessions
- `DELETE /profile/sessions/:sessionId` - Logout other session
- `PATCH /profile/security/ip-allowlist` - Update IP allowlist
- `GET /security/login-activity` - View login logs
- `GET /security/access-logs` - View data access logs

---

### 2.6 Audit / Activity Logs

**Description:**
บันทึกกิจกรรมและการเปลี่ยนแปลงสำหรับการตรวจสอบ

**Detailed Features:**

- **Audit Log Entry:**
  - Timestamp, user ID, action, resource (link/domain/member), change details
  - Before/after values for edit actions
  - IP address, user agent
  - Success/failure status

- **Logged Events:**
  - Link: created, updated (target_url changed, title changed, tags changed, status changed), deleted (soft), archived, restored, permanently deleted
  - Domain: added, verified, removed, SSL cert updated
  - Team: member added, role changed, member removed, invitation sent/cancelled
  - Org: settings changed, billing plan changed
  - Security: 2FA enabled, login attempt, API key created/rotated

- **Audit Log Viewer:**
  - Filter by: user, action, resource type, date range, resource ID
  - Export as CSV/JSON (admin/owner only)
  - Retention: keep logs for 1 year (configurable per plan)
  - Search within logs

- **Admin Dashboard Widget:**
  - Recent activity feed (last 20 events)
  - Activity summary by user
  - Anomaly detection: unusual activity alerts

**API Endpoints:**

- `GET /orgs/:id/audit-log` - List audit logs
- `GET /orgs/:id/audit-log/:id` - Get audit log entry details
- `GET /orgs/:id/audit-log/export` - Export audit logs
- `POST /orgs/:id/audit-log/search` - Search audit logs

**Database Schema:**
CREATE TABLE audit_logs (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
user_id UUID REFERENCES users(id),
action VARCHAR(100),
resource_type VARCHAR(50), -- link, domain, member, org, etc.
resource_id UUID,
change_details JSONB, -- before/after values
ip_address VARCHAR(45),
user_agent VARCHAR(500),
status VARCHAR(20), -- success, failure
error_message TEXT,
created_at TIMESTAMP DEFAULT NOW(),
INDEX(org_id, created_at),
INDEX(user_id, created_at)
);

---

### 2.7 Quota / Plan Management

**Description:**
จัดการข้อจำกัดตามแผนบริการ

**Detailed Features:**

- **Plan Limits:**
  - Links per month: 50 (free), 1000 (pro), unlimited (enterprise)
  - Custom domains: 1 (free), 5 (pro), unlimited (enterprise)
  - Team members: 1 (free), 10 (pro), unlimited (enterprise)
  - API calls per month: none (free), 10K (pro), unlimited (enterprise)
  - Analytics retention: 30 days (free), 90 days (pro), 2 years (enterprise)

- **Usage Tracking:**
  - Track current month's link creation count
  - Track API calls in real-time
  - Store historical usage for billing

- **Quota Enforcement:**
  - Block link creation if monthly limit reached
  - Block new domain addition if limit reached
  - Block new member invite if limit reached
  - Show upgrade prompt

- **Upgrade Prompts:**
  - Show usage bar in dashboard (e.g., "45/50 links used")
  - Email warning at 80% usage
  - Offer upgrade option when limit hit
  - Show feature comparison table

- **Plan Downgrades & Limits:**
  - Downgrade handling: if exceeding new plan's limits, warn user
  - Grace period: allow temporary overage (e.g., 7 days)
  - Auto-enforce: disable excess resources if not upgraded

**API Endpoints:**

- `GET /orgs/:id/usage` - Get current usage stats
- `GET /orgs/:id/usage/history` - Usage history (monthly)
- `POST /orgs/:id/upgrade-prompt` - Log that upgrade prompt was shown
- `GET /plans` - Get plan definitions with limits

**Database Schema:**
CREATE TABLE plan_definitions (
id UUID PRIMARY KEY,
plan_name VARCHAR(50) UNIQUE, -- free, pro, enterprise
links_per_month INTEGER,
custom_domains INTEGER,
team_members INTEGER,
api_calls_per_month INTEGER,
analytics_retention_days INTEGER,
price_monthly DECIMAL(10, 2),
price_yearly DECIMAL(10, 2),
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_tracking (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
year_month DATE, -- YYYY-MM-01
links_created INTEGER DEFAULT 0,
api_calls INTEGER DEFAULT 0,
team_members_active INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT NOW(),
UNIQUE(org_id, year_month)
);

---

## 3. Developer / API / Integration Features

### 3.1 RESTful API (Core Operations)

**Description:**
API ที่ให้นักพัฒนาสามารถสร้าง/อ่าน/แก้ไข/ลบลิงก์ผ่านระบบภายนอก

**Detailed Features:**

- **Link CRUD Endpoints:**
  - POST /links - Create link
  - GET /links - List links (pagination, filtering)
  - GET /links/:id - Get link details
  - PATCH /links/:id - Update link
  - DELETE /links/:id - Delete (soft delete)
  - POST /links/:id/restore - Restore deleted link

- **Campaign CRUD:**
  - POST /campaigns - Create campaign
  - GET /campaigns - List campaigns
  - PATCH /campaigns/:id - Update campaign
  - DELETE /campaigns/:id - Delete campaign
  - POST /campaigns/:id/links - Add link to campaign
  - DELETE /campaigns/:id/links/:linkId - Remove link from campaign

- **Domain CRUD (limited):**
  - GET /domains - List org's domains (read-only for API users)
  - POST /domains (admin-only)

- **Organization CRUD (limited):**
  - GET /orgs/:id - Get org info
  - GET /orgs/:id/usage - Get usage stats

- **Request/Response Format:**
  - JSON request/response bodies
  - Include metadata: created_at, updated_at, created_by
  - Pagination: limit, offset, total_count
  - Filtering: query params (tag, campaign, status, date_from, date_to)
  - Error responses: HTTP status + error code + message

**Example API Calls:**
POST /api/v1/links
{
"target_url": "https://example.com/page",
"slug": "my-link",
"title": "My Campaign Link",
"tags": ["campaign-2025", "promo"],
"domain_id": "domain-123",
"expires_at": "2025-12-31"
}

GET /api/v1/links?tag=campaign-2025&status=active&limit=20&offset=0

PATCH /api/v1/links/link-123
{
"target_url": "https://new-target.com",
"status": "disabled"
}

---

### 3.2 Analytics API

**Description:**
API สำหรับดึงข้อมูลวิเคราะห์ลิงก์/แคมเปญ

**Detailed Features:**

- **Analytics Summary Endpoint:**
  - GET /links/:id/analytics/summary
  - Response: total_clicks, unique_clicks, clicks_today, clicks_this_month, top_referrer, top_device, top_country

- **Time-Series Analytics:**
  - GET /links/:id/analytics/timeseries?period=7d&granularity=daily
  - Response: array of {date/hour, clicks, unique_clicks}
  - Support periods: 1d, 7d, 30d, 90d, 1y
  - Granularities: hourly, daily, weekly, monthly

- **Geographic Analytics:**
  - GET /links/:id/analytics/geo
  - Response: array of {country, city, clicks, percentage}
  - Optionally filter by country

- **Device & Browser Analytics:**
  - GET /links/:id/analytics/devices
  - Response: {device_type: {mobile, desktop, tablet}, {browser: Chrome, Safari, ...}}

- **Referrer Analytics:**
  - GET /links/:id/analytics/referrers
  - Response: array of {referrer_url, clicks, percentage}

- **Campaign Analytics:**
  - GET /campaigns/:id/analytics/summary
  - Response: aggregate stats across all campaign links

- **Rate Limits:**
  - Standard: 100 requests/minute per API key
  - Premium: 1000 requests/minute
  - Alert user when approaching limit

**API Response Example:**
{
"link_id": "link-123",
"summary": {
"total_clicks": 5000,
"unique_clicks": 3200,
"clicks_today": 150,
"clicks_this_month": 4500,
"click_conversion_rate": 64
},
"top_referrer": {
"referrer": "twitter.com",
"clicks": 1200
},
"top_device": {
"device": "mobile",
"clicks": 3000
},
"top_country": {
"country": "US",
"clicks": 2000
}
}

---

### 3.3 API Key / Token Management

**Description:**
จัดการกุญแจ API และการเข้าถึง

**Detailed Features:**

- **Token Types:**
  - Personal API key: tied to user, inherits user role
  - Organization API key: tied to org, for service accounts

- **Create API Key:**
  - Generate random token (alphanumeric, 32+ chars)
  - Assign scopes: read:links, write:links, read:analytics, write:campaigns, etc.
  - Optional expiration date (default: never, recommend 90 days)
  - Optional rate limit override
  - Display key once (user must copy and save)

- **API Key Management:**
  - List user's/org's API keys with creation date, last used date
  - Edit: change scopes, expiration, name/description
  - Rotate: generate new key, deprecate old (old still works for grace period, e.g., 7 days)
  - Revoke: immediately disable key
  - Delete: remove key entirely

- **API Key Usage:**
  - Track last used timestamp
  - Track calls per key (for analytics)
  - Detect suspicious activity (sudden spike in calls)
  - Alert if key hasn't been used in 30+ days

- **Scope System:**
  - read:links - view links
  - write:links - create/edit/delete links
  - read:analytics - view analytics
  - read:campaigns - view campaigns
  - write:campaigns - create/edit campaigns
  - Combination: users can select specific scopes

- **Authentication Header:**
  - Request: `Authorization: Bearer YOUR_API_KEY`
  - Alternative: `X-API-Key: YOUR_API_KEY`

**API Endpoints:**

- `POST /api-keys` - Create new API key
- `GET /api-keys` - List API keys
- `PATCH /api-keys/:id` - Update API key (name, scopes, expiry)
- `POST /api-keys/:id/rotate` - Rotate (generate new, keep old with grace period)
- `DELETE /api-keys/:id` - Revoke API key
- `GET /api-keys/:id/usage` - View key usage stats

**Database Schema:**
CREATE TABLE api_keys (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
user_id UUID REFERENCES users(id),
key_hash VARCHAR(255) UNIQUE NOT NULL,
key_prefix VARCHAR(10),
name VARCHAR(255),
scopes TEXT NOT NULL, -- comma-separated or JSON array
expires_at TIMESTAMP,
last_used_at TIMESTAMP,
created_at TIMESTAMP DEFAULT NOW(),
revoked_at TIMESTAMP
);

CREATE TABLE api_key_usage (
id UUID PRIMARY KEY,
api_key_id UUID REFERENCES api_keys(id),
endpoint VARCHAR(100),
method VARCHAR(10),
status_code INTEGER,
timestamp TIMESTAMP DEFAULT NOW()
);

---

### 3.4 Webhooks

**Description:**
ส่งการแจ้งเตือน webhook สำหรับ event สำคัญ

**Detailed Features:**

- **Webhook Events:**
  - link.created: new link created
  - link.updated: link details changed (target_url, title, status, etc.)
  - link.deleted: link deleted
  - link.archived: link archived
  - campaign.created: new campaign created
  - campaign.updated: campaign updated
  - campaign.deleted: campaign deleted
  - click.milestone_reached: e.g., link reached 100 clicks, 1000 clicks, etc.
  - domain.verified: custom domain verified
  - team.member_added: new member joined org
  - team.member_removed: member removed from org

- **Webhook Subscription:**
  - Create subscription: POST /webhooks, specify events, target URL
  - Verify subscription: send test webhook, require response with secret
  - Manage subscriptions: list, update, delete
  - Retry policy: exponential backoff (1s, 10s, 100s) up to 5 retries

- **Webhook Payload:**
  - Standard format: { event_type, timestamp, data: {...}, event_id }
  - Include signature (HMAC-SHA256) for verification
  - Max payload size: 5MB

- **Webhook Testing:**
  - Send test webhook to verify setup
  - Replay past webhook (for debugging)
  - View webhook delivery history (status, response)

**Example Webhook Payload:**
{
"event_id": "evt_123",
"event_type": "link.created",
"timestamp": "2025-12-03T12:00:00Z",
"organization_id": "org-123",
"data": {
"link_id": "link-456",
"slug": "my-link",
"target_url": "https://example.com",
"created_by": "user-789"
},
"signature": "sha256=abcdef1234567890..."
}

**API Endpoints:**

- `POST /webhooks` - Create webhook subscription
- `GET /webhooks` - List webhooks
- `PATCH /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- `POST /webhooks/:id/test` - Send test webhook
- `GET /webhooks/:id/deliveries` - View delivery history
- `POST /webhooks/:id/deliveries/:deliveryId/replay` - Replay webhook

**Database Schema:**
CREATE TABLE webhooks (
id UUID PRIMARY KEY,
org_id UUID REFERENCES organizations(id),
target_url VARCHAR(2048) NOT NULL,
events TEXT NOT NULL, -- comma-separated event types
secret VARCHAR(255),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
id UUID PRIMARY KEY,
webhook_id UUID REFERENCES webhooks(id),
event_id VARCHAR(100),
payload_hash VARCHAR(64),
status_code INTEGER,
response_body TEXT,
retry_count INTEGER DEFAULT 0,
created_at TIMESTAMP DEFAULT NOW()
);

---

### 3.5 Developer Console / API Docs

**Description:**
อินเทอร์เฟซสำหรับนักพัฒนาในการจัดการ API

**Detailed Features:**

- **API Documentation:**
  - Endpoint reference: method, path, description, parameters, response
  - Request/response examples
  - Error codes and meanings
  - Rate limits and quota info
  - Authentication methods
  - Changelog: track API updates
  - Sidebar navigation for all endpoints

- **Interactive API Explorer:**
  - Try endpoint in browser: input parameters, see response
  - Pre-filled auth headers (using user's API key)
  - Request/response viewer
  - cURL command generator
  - Code samples: JavaScript, Python, cURL, PHP

- **Developer Dashboard:**
  - API key management (create, rotate, revoke)
  - Usage stats: requests/month, top endpoints, errors
  - Webhook management
  - Integration tutorials
  - Status page: API availability, incident logs

- **Onboarding & Tutorials:**
  - Getting started guide
  - Example projects (GitHub repos)
  - Video tutorials
  - FAQ section
  - Community forum or support chat

- **Tools & Utilities:**
  - API Client Generator: create client library for language
  - Test Data Generator: bulk test data for development
  - Webhook Testing Tool: validate webhook receiver

**Frontend Components (React/shadcn):**

- APIEndpointCard: display endpoint with try-it button
- CodeSample: syntax-highlighted code blocks
- ParameterTable: table of params, types, descriptions
- ResponseViewer: formatted JSON response
- UsageChart: API call trends

**API Endpoints:**

- `GET /docs` - Redirect to API docs page
- `GET /docs/openapi.json` - OpenAPI spec (Swagger format)
- `GET /docs/endpoints` - List all endpoints
- `GET /docs/webhooks` - Webhook event types

---

## Summary Table: Features by Component

| Feature        | User-Facing      | Backend | DB  | API Endpoint Count |
| -------------- | ---------------- | ------- | --- | ------------------ |
| Auth & Profile | Yes              | Yes     | Yes | 7                  |
| Link CRUD      | Yes              | Yes     | Yes | 6                  |
| QR Code        | Yes              | Yes     | No  | 4                  |
| Bulk Ops       | Yes              | Yes     | No  | 4                  |
| Organization   | Yes              | Yes     | Yes | 7                  |
| Analytics      | Yes              | Yes     | Yes | 6                  |
| Domains        | Yes              | Yes     | Yes | 7                  |
| Security       | Yes              | Yes     | Yes | 7                  |
| Audit Logs     | Yes              | Yes     | Yes | 4                  |
| Link-in-Bio    | Yes              | Yes     | Yes | 8                  |
| Billing        | Yes              | Yes     | Yes | 6                  |
| API Keys       | Yes (Dev Portal) | Yes     | Yes | 6                  |
| Webhooks       | No (Dev Feature) | Yes     | Yes | 7                  |
| **Total**      |                  |         |     | **92+ endpoints**  |

---

## References

[1] Bitly Official Feature List and Blog  
[2] Bitly API Documentation  
[3] Shadcn UI Library  
[4] Supabase Postgres/Auth Docs  
[5] NestJS Best Practices  
[6] Next.js App Router Patterns  
[7] Industry Standard SRS & API Design  
[8] OWASP Security Best Practices  
[9] Stripe Payment Integration Guide  
[10] GeoIP and MaxMind Services
