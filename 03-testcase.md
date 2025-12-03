# PingTO.Me E2E Test Cases (Playwright)

This document outlines the End-to-End (E2E) test scenarios for the PingTO.Me platform, covering Frontend (Web), Backend (API), and Redirector services.

## Test Environment Setup

- **Base URL (Web)**: `http://localhost:3000`
- **Base URL (API)**: `http://localhost:3001`
- **Redirector URL**: `http://localhost:8787`
- **Test User**: `test@example.com` / `Password123!`

---

## 1. Authentication & User Management

### 1.1 User Registration

**Scenario**: User signs up with valid credentials.

- **Steps**:
  1. Navigate to `/register`.
  2. Fill in "Full Name", "Email", "Password".
  3. Click "Create Account".
- **Expected Result**:
  - User is redirected to `/dashboard`.
  - Database contains new user record.
  - Welcome email is sent (mocked).

### 1.2 User Login

**Scenario**: User logs in with existing credentials.

- **Steps**:
  1. Navigate to `/login`.
  2. Enter `test@example.com` and `Password123!`.
  3. Click "Sign In".
- **Expected Result**:
  - User is redirected to `/dashboard`.
  - JWT token is stored in cookies/local storage.

### 1.3 Invalid Login

**Scenario**: User attempts login with incorrect password.

- **Steps**:
  1. Navigate to `/login`.
  2. Enter `test@example.com` and `WrongPassword`.
  3. Click "Sign In".
- **Expected Result**:
  - Error message "Invalid credentials" is displayed.
  - User remains on `/login`.

### 1.4 Logout

**Scenario**: Authenticated user logs out.

- **Steps**:
  1. Click User Avatar in Header.
  2. Click "Log out".
- **Expected Result**:
  - User is redirected to `/login` or Landing Page.
  - Session is cleared.

---

## 2. Link Management (Core)

### 2.1 Create Short Link (Random Slug)

**Scenario**: User creates a short link with an auto-generated slug.

- **Steps**:
  1. Login and navigate to `/dashboard`.
  2. Click "Create Link".
  3. Enter Destination URL: `https://google.com`.
  4. Leave "Slug" empty.
  5. Click "Create".
- **Expected Result**:
  - New link appears in `LinksTable`.
  - Slug is a random 6-8 char string (e.g., `aBc123`).
  - QR code button is visible.

### 2.2 Create Short Link (Custom Slug)

**Scenario**: User creates a short link with a custom slug.

- **Steps**:
  1. Login and navigate to `/dashboard`.
  2. Click "Create Link".
  3. Enter Destination URL: `https://github.com`.
  4. Enter Slug: `my-git`.
  5. Click "Create".
- **Expected Result**:
  - New link `/my-git` appears in the table.
  - API returns 201 Created.

### 2.3 Create Duplicate Slug

**Scenario**: User tries to create a link with an existing slug.

- **Steps**:
  1. Try to create a link with slug `my-git` again.
- **Expected Result**:
  - Error message "Slug already taken" is displayed.

### 2.4 Delete Link

**Scenario**: User deletes a link.

- **Steps**:
  1. In `LinksTable`, find a link.
  2. Click "..." (Actions) -> "Delete".
  3. Confirm deletion in dialog.
- **Expected Result**:
  - Link disappears from the table.
  - API returns 200 OK.

### 2.5 QR Code Generation

**Scenario**: User views and downloads QR code.

- **Steps**:
  1. Click "QR" icon on a link row.
  2. Verify QR code image is displayed.
  3. Click "Download".
- **Expected Result**:
  - QR code modal opens.
  - Image is downloaded as PNG.

---

## 3. Redirector Service

### 3.1 Basic Redirection

**Scenario**: Visitor accesses a valid short link.

- **Steps**:
  1. Navigate to `http://localhost:8787/my-git` (Redirector URL).
- **Expected Result**:
  - Browser redirects to `https://github.com` (301 Moved Permanently).
  - Click count increments in Analytics.

### 3.2 404 Not Found

**Scenario**: Visitor accesses a non-existent link.

- **Steps**:
  1. Navigate to `http://localhost:8787/non-existent-slug`.
- **Expected Result**:
  - Browser shows 404 Page ("Link not found").

### 3.3 Custom Domain Redirection (Mock)

**Scenario**: Visitor accesses link via custom domain.

- **Steps**:
  1. Mock request header `Host: links.mybrand.com`.
  2. Navigate to `/promo`.
- **Expected Result**:
  - Redirects to configured destination for that domain/slug.

---

## 4. Analytics

### 4.1 View Link Analytics

**Scenario**: User views analytics for a specific link.

- **Steps**:
  1. In `LinksTable`, click "Analytics" or "..." -> "Analytics".
  2. Navigate to `/dashboard/analytics/[id]`.
- **Expected Result**:
  - "Total Clicks" card shows correct count.
  - "Clicks Over Time" chart is rendered.
  - "Recent Activity" table shows recent clicks with IP/Country.

---

## 5. Landing Page

### 5.1 Navigation

**Scenario**: Visitor navigates the landing page.

- **Steps**:
  1. Navigate to `/`.
  2. Click "Features" in nav.
  3. Click "Pricing" in nav.
- **Expected Result**:
  - Page scrolls to respective sections.
  - "Get Started" buttons link to `/register`.

---

## 6. API (Developer)

### 6.1 Public Lookup Endpoint

**Scenario**: Redirector queries API for link info.

- **Steps**:
  1. Send GET request to `/links/my-git/lookup`.
- **Expected Result**:
  - Returns JSON: `{ "originalUrl": "https://github.com", ... }`.
  - Status 200 OK.
