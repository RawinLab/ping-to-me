# Test Case Implementation Tasks

This document breaks down the E2E test scenarios from `03-testcase.md` into actionable implementation tasks.

## 1. Authentication & User Management

- [ ] **TC-1.1: User Registration**
  - [ ] Create `tests/e2e/auth/register.spec.ts`
  - [ ] Implement test: Navigate to `/register`
  - [ ] Implement test: Fill registration form (Name, Email, Password)
  - [ ] Implement test: Submit and verify redirect to `/dashboard`
  - [ ] Verify: Welcome email sent (mocked)

- [ ] **TC-1.2: User Login**
  - [ ] Create `tests/e2e/auth/login.spec.ts`
  - [ ] Implement test: Navigate to `/login`
  - [ ] Implement test: Fill valid credentials
  - [ ] Implement test: Verify redirect to `/dashboard` and session storage

- [ ] **TC-1.3: Invalid Login**
  - [ ] Add to `tests/e2e/auth/login.spec.ts`
  - [ ] Implement test: Fill invalid credentials
  - [ ] Verify: Error message "Invalid credentials" appears

- [ ] **TC-1.4: Logout**
  - [ ] Add to `tests/e2e/auth/logout.spec.ts`
  - [ ] Implement test: Login first (use fixture)
  - [ ] Implement test: Click Avatar -> Logout
  - [ ] Verify: Redirect to Login/Landing page

## 2. Link Management (Core)

- [ ] **TC-2.1: Create Short Link (Random Slug)**
  - [ ] Create `tests/e2e/links/create.spec.ts`
  - [ ] Implement test: Navigate to Dashboard
  - [ ] Implement test: Open Create Modal -> Fill URL -> Submit
  - [ ] Verify: New link appears in `LinksTable` with random slug

- [ ] **TC-2.2: Create Short Link (Custom Slug)**
  - [ ] Add to `tests/e2e/links/create.spec.ts`
  - [ ] Implement test: Fill URL and Custom Slug
  - [ ] Verify: New link appears with specified slug

- [ ] **TC-2.3: Create Duplicate Slug**
  - [ ] Add to `tests/e2e/links/create.spec.ts`
  - [ ] Implement test: Try to create link with existing slug
  - [ ] Verify: Error message "Slug already taken" appears

- [ ] **TC-2.4: Delete Link**
  - [ ] Create `tests/e2e/links/manage.spec.ts`
  - [ ] Implement test: Locate link row
  - [ ] Implement test: Click Delete -> Confirm
  - [ ] Verify: Link is removed from table

- [ ] **TC-2.5: QR Code Generation**
  - [ ] Add to `tests/e2e/links/manage.spec.ts`
  - [ ] Implement test: Click QR button
  - [ ] Verify: QR Modal opens and image loads
  - [ ] Verify: Download button triggers download

## 3. Redirector Service

- [ ] **TC-3.1: Basic Redirection**
  - [ ] Create `tests/e2e/redirector/redirect.spec.ts`
  - [ ] Implement test: Navigate to Short URL (e.g., `http://localhost:8787/slug`)
  - [ ] Verify: Redirects to original destination URL

- [ ] **TC-3.2: 404 Not Found**
  - [ ] Add to `tests/e2e/redirector/redirect.spec.ts`
  - [ ] Implement test: Navigate to non-existent slug
  - [ ] Verify: 404 Page is displayed

- [ ] **TC-3.3: Custom Domain Redirection (Mock)**
  - [ ] Add to `tests/e2e/redirector/domain.spec.ts`
  - [ ] Implement test: Set Host header to custom domain
  - [ ] Verify: Routing logic handles custom domain correctly

## 4. Analytics

- [ ] **TC-4.1: View Link Analytics**
  - [ ] Create `tests/e2e/analytics/view.spec.ts`
  - [ ] Implement test: Navigate to `/dashboard/analytics/[id]`
  - [ ] Verify: Total Clicks card is visible
  - [ ] Verify: Chart component is rendered
  - [ ] Verify: Activity table contains data

## 5. Landing Page

- [ ] **TC-5.1: Navigation**
  - [ ] Create `tests/e2e/landing/navigation.spec.ts`
  - [ ] Implement test: Click "Features" -> Verify scroll
  - [ ] Implement test: Click "Pricing" -> Verify scroll
  - [ ] Implement test: Click "Get Started" -> Verify redirect to `/register`

## 6. API (Developer)

- [ ] **TC-6.1: Public Lookup Endpoint**
  - [ ] Create `tests/e2e/api/lookup.spec.ts`
  - [ ] Implement test: API Request to `/links/:slug/lookup`
  - [ ] Verify: JSON response contains correct `originalUrl`
