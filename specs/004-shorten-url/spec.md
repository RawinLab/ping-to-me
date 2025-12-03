# Feature Specification: Create Shortened URL

**Feature Branch**: `004-shorten-url`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "add feature for create shorten URL from long URL"

## Clarifications

### Session 2025-12-03

- Q: How should the system check for blocked/blacklisted domains? → A: Internal Database Table: Check input URLs against a local `BlockedDomain` table.
- Q: How should redirection be handled? → A: Use `apps/redirector` (Cloudflare Worker) which reads from KV/DB.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Advanced Short Link (Priority: P1)

As a logged-in user, I want to create a short link with optional metadata (title, tags, campaign) and settings (expiration, password) so that I can manage and secure my links effectively.

**Why this priority**: Core functionality expanded with essential management features.

**Independent Test**: Create a link with all optional fields and verify they are persisted and enforced (e.g., password prompt on access).

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I enter a valid URL and set an expiration date, **Then** the link is created and becomes inactive after that date.
2. **Given** I am creating a link, **When** I add tags "marketing" and "q1", **Then** the link is searchable/filterable by these tags.
3. **Given** I set a password for a link, **When** a user visits the short link, **Then** they are prompted for the password before redirection.
4. **Given** I enter a URL from a blocked domain (phishing), **When** I try to create the link, **Then** the system rejects it with a security warning.

---

### User Story 2 - Custom & Auto-Generated Slugs (Priority: P1)

As a user, I want to either provide a custom alias or have the system generate a secure, random one, ensuring uniqueness and avoiding reserved words.

**Why this priority**: Flexibility in link naming is a key user requirement.

**Independent Test**: Try creating links with reserved words (fail) and valid custom slugs (pass).

**Acceptance Scenarios**:

1. **Given** I leave the slug field empty, **When** I create a link, **Then** a 6-8 character alphanumeric random slug is generated.
2. **Given** I enter a reserved slug like "admin", **When** I create the link, **Then** I receive an error "This slug is reserved".
3. **Given** I enter a custom slug, **When** it collides with an existing one, **Then** I am asked to choose another.

---

### User Story 3 - Link Organization & Tracking (Priority: P2)

As a user, I want to organize links into folders/campaigns and ensure tracking parameters are preserved so I can analyze performance.

**Why this priority**: Critical for power users and marketing use cases.

**Independent Test**: Create a link with UTM params and verify they persist in the redirection.

**Acceptance Scenarios**:

1. **Given** I have a long URL with UTM parameters, **When** I shorten it, **Then** the redirected URL preserves all original parameters.
2. **Given** I select a "Social Media" folder, **When** I create a link, **Then** it appears within that folder view.

### Edge Cases

- **Malicious/Spam URLs**: Input URL is in a blacklist. (System MUST reject).
- **Slug Collision (Auto)**: Random slug already exists. (System MUST retry generation up to N times).
- **Reserved Slugs**: User tries to use "api", "dashboard". (System MUST reject).
- **Expired Link Access**: User visits an expired link. (System MUST show "Link Expired" page).
- **Deep Linking**: Mobile app fallback. (If configured, redirect to app scheme, else web URL).

## Requirements _(mandatory)_

### Functional Requirements

#### URL Input & Validation

- **FR-001**: System MUST accept long URLs up to 2048 characters.
- **FR-002**: System MUST validate HTTP/HTTPS protocol.
- **FR-003**: System MUST check input URL against a blocked/blacklisted domain list (malware/phishing) using an internal `BlockedDomain` table.
- **FR-004**: System MUST perform spam detection (e.g., check for redirects to known spam).
- **FR-005**: System MUST allow an optional Title and Description (max 200 chars) for the link.

#### Auto-Generate Short Link

- **FR-006**: System MUST generate a random alphanumeric slug (6-8 chars) if no custom slug is provided.
- **FR-007**: System MUST ensure slug uniqueness per domain.
- **FR-008**: System MUST prevent usage of reserved slugs (e.g., "api", "dashboard", "admin").
- **FR-009**: System MUST automatically retry slug generation in case of collision (incremental retry).
- **FR-010**: System MUST sync created links to Cloudflare KV for the Redirector service.

#### Link Metadata

- **FR-011**: System MUST support multiple Tags for filtering.
- **FR-012**: System MUST allow assignment to a Campaign/Project.
- **FR-013**: System MUST allow organization into Folders/Categories.
- **FR-014**: System MUST support an optional Expiration Date (auto-disable).
- **FR-015**: System MUST support optional Password Protection (hash stored, prompt on redirect).
- **FR-016**: System MUST allow internal Notes/Description.

#### Link Options

- **FR-017**: System MUST allow selecting Redirect Type (301 Permanent or 302 Temporary).
- **FR-018**: System MUST preserve UTM and query parameters from the original URL.
- **FR-019**: System MUST support Deep Link configuration (mobile app fallback).
- **FR-020**: System MUST auto-generate a QR code for the created short link.

### Key Entities _(include if feature involves data)_

- **Link**:
  - `originalUrl`: String (2048 chars)
  - `slug`: String (unique, indexed)
  - `title`: String? (200 chars)
  - `description`: String?
  - `tags`: String[]
  - `campaignId`: String?
  - `folderId`: String?
  - `expirationDate`: DateTime?
  - `passwordHash`: String?
  - `redirectType`: Enum (301, 302)
  - `deepLinkFallback`: String?
  - `userId`: String (Owner)
  - `createdAt`: DateTime
  - `status`: Enum (Active, Expired, Disabled)

- **BlockedDomain**:
  - `domain`: String (unique, indexed)
  - `reason`: String
  - `createdAt`: DateTime

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Link creation API response time < 500ms (excluding external blacklist checks).
- **SC-002**: 100% of generated slugs are unique and non-reserved.
- **SC-003**: System successfully blocks 100% of URLs matching the internal blacklist.
- **SC-004**: Redirects preserve 100% of original query parameters.
- **SC-005**: Expired links return a 404 or specific "Expired" page 100% of the time after the set date.
