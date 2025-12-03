# Quickstart: User Authentication

**Feature**: User Authentication
**Status**: Draft

## Setup

1.  **Environment Variables**:
    Add the following to `apps/web/.env`:

    ```bash
    # NextAuth.js
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your-super-secret-key

    # OAuth Providers
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    GITHUB_ID=
    GITHUB_SECRET=
    FACEBOOK_CLIENT_ID=
    FACEBOOK_CLIENT_SECRET=

    # Email (Nodemailer)
    EMAIL_SERVER_HOST=smtp.example.com
    EMAIL_SERVER_PORT=587
    EMAIL_SERVER_USER=apikey
    EMAIL_SERVER_PASSWORD=key
    EMAIL_FROM=noreply@pingto.me
    ```

2.  **Database Migration**:
    ```bash
    pnpm db:push
    ```

## Running Locally

1.  Start the development server:
    ```bash
    pnpm dev
    ```
2.  Navigate to `/register` or `/login`.

## Verification

### Manual Testing

1.  **Email/Password Registration**:
    - Go to `/register`.
    - Enter email/password.
    - Check console/email for verification link (if using Ethereal/Dev SMTP).
    - Click link -> Verify -> Login.

2.  **OAuth Login**:
    - Go to `/login`.
    - Click "Continue with GitHub".
    - Authorize app.
    - Verify redirection to dashboard.

3.  **Magic Link**:
    - Go to `/login`.
    - Enter email -> "Send Magic Link".
    - Click link in email.
    - Verify login.

### Automated Testing

- **Unit Tests**: Run `pnpm test` in `apps/api` to verify User service logic.
- **E2E Tests**: Run `pnpm test:e2e` (future) to verify login flows.
