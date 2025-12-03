# Tasks: User Authentication

**Feature**: User Authentication
**Status**: Plan
**Spec**: [spec.md](spec.md)

## Phase 1: Setup

- [x] T001 Install NextAuth.js dependencies in `apps/web` (`next-auth`, `@hookform/resolvers`, `zod`)
- [x] T002 Install NestJS auth dependencies in `apps/api` (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `nodemailer`)
- [x] T003 Configure environment variables for Auth (NextAuth Secret, OAuth IDs) in `apps/web/.env`
- [x] T004 Configure environment variables for Email (SMTP) in `apps/api/.env`

## Phase 2: Foundational

- [x] T005 Update Prisma schema with `Account`, `Session`, `VerificationToken` models in `packages/database/prisma/schema.prisma`
- [x] T006 Update `User` model in `packages/database/prisma/schema.prisma` with auth fields (password, emailVerified, image, role)
- [x] T007 Run `pnpm db:push` to apply schema changes
- [x] T008 Create shared auth types (`JwtPayload`, `UserProfile`) in `packages/types/src/auth.ts`
- [x] T009 Implement `AuthService` in `apps/api/src/auth/auth.service.ts` (validateUser, login, register)
- [x] T010 Implement `JwtStrategy` in `apps/api/src/auth/jwt.strategy.ts` to verify NextAuth tokens

## Phase 3: User Story 1 - Traditional Registration & Login (P1)

**Goal**: Users can register with email/password and login.
**Test**: Register -> Verify Email -> Login.

- [x] T011 [US1] Create `RegisterForm` component in `apps/web/components/auth/RegisterForm.tsx`
- [x] T012 [US1] Create `LoginForm` component in `apps/web/components/auth/LoginForm.tsx`
- [x] T013 [US1] Implement `POST /api/v1/auth/register` in `apps/api/src/auth/auth.controller.ts`
- [x] T014 [US1] Implement `MailService` in `apps/api/src/mail/mail.service.ts` using Nodemailer
- [x] T015 [US1] Configure NextAuth `CredentialsProvider` in `apps/web/lib/auth.ts`
- [x] T016 [US1] Create NextAuth route handler in `apps/web/app/api/auth/[...nextauth]/route.ts`
- [x] T017 [US1] Create `/register` page in `apps/web/app/register/page.tsx`
- [x] T018 [US1] Create `/login` page in `apps/web/app/login/page.tsx`

## Phase 4: User Story 2 - OAuth Social Login (P1)

**Goal**: Users can login with Google/GitHub.
**Test**: Click "Continue with GitHub" -> Dashboard.

- [x] T019 [US2] Configure `GithubProvider` in `apps/web/lib/auth.ts`
- [x] T020 [US2] Configure `GoogleProvider` in `apps/web/lib/auth.ts`
- [x] T021 [US2] Update `LoginForm` to include Social Login buttons
- [x] T022 [US2] Implement NextAuth `jwt` callback to add user ID/Role to token in `apps/web/lib/auth.ts`
- [x] T023 [US2] Implement NextAuth `session` callback to expose user data to client in `apps/web/lib/auth.ts`

## Phase 5: User Story 3 - Magic Link Login (P2)

**Goal**: Passwordless login via email.
**Test**: Request Link -> Click Link -> Dashboard.

- [x] T024 [US3] Configure `EmailProvider` in `apps/web/lib/auth.ts`
- [x] T025 [US3] Customize Magic Link email template in `apps/web/lib/auth.ts` (or via Nodemailer custom transport)
- [x] T026 [US3] Update `LoginForm` to support Magic Link request

## Phase 6: User Story 4 - Password Management (P2)

**Goal**: Reset forgotten password.
**Test**: Forgot Password -> Reset Link -> New Password -> Login.

- [x] T027 [US4] Implement `POST /api/v1/auth/forgot-password` in `apps/api/src/auth/auth.controller.ts`
- [x] T028 [US4] Implement `POST /api/v1/auth/reset-password` in `apps/api/src/auth/auth.controller.ts`
- [x] T029 [US4] Create `ForgotPasswordForm` in `apps/web/components/auth/ForgotPasswordForm.tsx`
- [x] T030 [US4] Create `ResetPasswordForm` in `apps/web/components/auth/ResetPasswordForm.tsx`
- [x] T031 [US4] Create `/forgot-password` page in `apps/web/app/forgot-password/page.tsx`
- [x] T032 [US4] Create `/reset-password` page in `apps/web/app/reset-password/page.tsx`

## Phase 7: Polish & Cross-Cutting

- [x] T033 Protect dashboard routes with `middleware.ts` in `apps/web`
- [x] T034 Update `LandingHeader` to show User Menu when logged in
- [x] T035 Implement ThrottlerModule for rate limiting in `apps/api/src/app.module.ts`
- [x] T036 Verify rate limiting on auth endpoints
- [x] T037 Ensure accessible form error states

## Phase 8: Migration to NestJS Passport (Completed)

- [x] T038 Remove NextAuth.js dependencies and files
- [x] T039 Implement `LocalStrategy`, `GoogleStrategy`, `GithubStrategy`, `JwtRefreshStrategy` in `apps/api`
- [x] T040 Implement `AuthController` endpoints (`login`, `refresh`, `logout`, `register`)
- [x] T041 Create `AuthContext` and `useAuth` hook in `apps/web`
- [x] T042 Create `api` client with Axios interceptors for token refresh
- [x] T043 Update `middleware.ts` to protect routes using `refresh_token` cookie

## Dependencies

- Phase 1 -> Phase 2 -> Phase 3, 4 (Parallel) -> Phase 5 -> Phase 6 -> Phase 7

## Implementation Strategy

- Start with Database and API foundation.
- Implement NestJS Passport with Credentials first.
- Add OAuth providers via Passport strategies.
- Implement Frontend AuthContext and API Client.
- Add Magic Links (via NestJS Mailer).
- Finish with Password Reset flows.
