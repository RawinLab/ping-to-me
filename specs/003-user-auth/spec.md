# Feature Specification: User Authentication

**Feature Branch**: `003-user-auth`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "user registration & authentication, email &password login, oauth google facebook, github, email verifycation, magic link login"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Traditional Registration & Login (Priority: P1)

Users can create an account using their email and password, verify their email address to confirm ownership, and subsequently log in.

**Why this priority**: Fundamental requirement for any user-based system. Provides the baseline access method.

**Independent Test**: Can be fully tested by registering a new email, receiving the verification email, clicking the link, and logging in with the credentials.

**Acceptance Scenarios**:

1. **Given** a visitor on the registration page, **When** they submit valid email and password, **Then** a new account is created (pending verification) and a verification email is sent.
2. **Given** a registered but unverified user, **When** they attempt to login, **Then** the system denies access and prompts to check email for verification.
3. **Given** a user with a verification email, **When** they click the verification link, **Then** their email is marked as verified and they are logged in or redirected to login.
4. **Given** a verified user, **When** they submit valid credentials, **Then** they are successfully authenticated and redirected to the dashboard.

---

### User Story 2 - OAuth Social Login (Priority: P1)

Users can sign up and log in using their existing accounts from Google, GitHub, or Facebook.

**Why this priority**: Reduces friction for onboarding. Many developers (target audience) prefer GitHub/Google login.

**Independent Test**: Can be tested by clicking "Continue with [Provider]" and verifying successful redirection and account creation/login.

**Acceptance Scenarios**:

1. **Given** a visitor on the login/register page, **When** they choose "Continue with Google/GitHub/Facebook", **Then** they are redirected to the provider's consent screen.
2. **Given** a successful OAuth callback, **When** the user is new, **Then** an account is automatically created and verified, and the user is logged in.
3. **Given** a successful OAuth callback, **When** the user already exists (linked by email), **Then** they are logged in.

---

### User Story 3 - Magic Link Login (Priority: P2)

Users can log in by requesting a secure, time-limited link sent to their email, eliminating the need to remember passwords.

**Why this priority**: Improves security and user experience for users who forget passwords or prefer passwordless entry.

**Independent Test**: Can be tested by requesting a magic link, receiving the email, and clicking the link to authenticate.

**Acceptance Scenarios**:

1. **Given** a visitor on the login page, **When** they enter their email and select "Send Magic Link", **Then** the system sends an email with a login link.
2. **Given** a user with a magic link email, **When** they click the link within the expiration time, **Then** they are successfully authenticated.
3. **Given** a user with an expired or invalid magic link, **When** they click the link, **Then** the system denies access and shows an error.

---

### User Story 4 - Password Management (Priority: P2)

Users can reset their password if forgotten.

**Why this priority**: Critical recovery mechanism for email/password users.

**Independent Test**: Can be tested by initiating the "Forgot Password" flow and resetting the password via email link.

**Acceptance Scenarios**:

1. **Given** a user on the login page, **When** they click "Forgot Password" and submit their email, **Then** a password reset link is sent.
2. **Given** a user with a reset link, **When** they click it and submit a new password, **Then** their password is updated and they can login with the new credentials.

---

### Edge Cases

- What happens when a user tries to register with an email that is already used by an OAuth account? (System should prompt to login with OAuth or allow linking if password is set).
- What happens if an OAuth provider returns an email that is already verified via password registration? (System should log the user in and link the provider).
- How does the system handle spam/bot registrations? (Rate limiting on registration/email sending endpoints).
- What happens if the email service provider is down? (System should handle errors gracefully and inform the user).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to register with email and password.
- **FR-002**: System MUST validate email format and password strength (min length, complexity).
- **FR-003**: System MUST send verification emails to new email/password registrants using **Nodemailer (SMTP)**.
- **FR-004**: System MUST prevent login for unverified email/password accounts.
- **FR-005**: System MUST support OAuth 2.0 authentication for Google, GitHub, and Facebook using **NestJS Passport**.
- **FR-006**: System MUST automatically verify emails received from trusted OAuth providers (Google, GitHub, Facebook).
- **FR-007**: System MUST allow users to request a magic link for passwordless login using **NestJS Mailer**.
- **FR-008**: System MUST validate magic link tokens (expiration, single-use).
- **FR-009**: System MUST allow users to request a password reset link.
- **FR-010**: System MUST securely hash and salt user passwords before storage.
- **FR-011**: System MUST implement rate limiting on all authentication and email sending endpoints.

### Key Entities

- **User**: Represents the identity of a person. Attributes: Email, PasswordHash, EmailVerified, CreatedAt, LastLogin.
- **Account/Identity**: Represents a linked authentication method (e.g., Local, Google, GitHub). Attributes: Provider, ProviderId, UserId.
- **VerificationToken**: Represents a temporary token for email verification or password reset. Attributes: Token, Type (Verify/Reset/Magic), Expiry, UserId.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete the registration flow (including email receipt) in under 3 minutes (assuming standard email delivery speed).
- **SC-002**: OAuth login redirect and callback completes in under 5 seconds.
- **SC-003**: Magic links are delivered within 1 minute.
- **SC-004**: System handles 100 concurrent login attempts without performance degradation.

## Clarifications

### Session 2025-12-03

- Q: Which email service provider should be used? -> A: Nodemailer (SMTP)
- Q: What is the authentication architecture? -> A: NestJS Passport (JWT)
