# Implementation Plan: User Authentication

**Branch**: `003-user-auth` | **Date**: 2025-12-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement secure user authentication using NestJS Passport for the backend (handling OAuth, Magic Links, and Credentials) and React Context for the frontend. Includes email delivery via Nodemailer.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 20+
**Primary Dependencies**:

- Frontend: `axios`, `lucide-react`, `@hookform/resolvers`, `zod`
- Backend: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `passport-local`, `passport-google-oauth20`, `passport-github2`, `nodemailer`
  **Storage**: PostgreSQL (Prisma) - User, Account, VerificationToken tables
  **Testing**: Jest (Unit), Playwright (E2E)
  **Target Platform**: Vercel (Web), Cloudflare (Redirector - Auth agnostic), Docker/Node (API)
  **Project Type**: Monorepo (Web + API)
  **Performance Goals**: Login < 200ms, OAuth Redirect < 5s
  **Constraints**: Stateless JWT for API authentication
  **Scale/Scope**: Support 10k+ users, extensible for future providers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Scalability & Performance First**: Stateless JWTs ensure API scalability.
- [x] **II. Security & Privacy by Design**: NextAuth.js handles sensitive flows (CSRF, encryption). Passwords hashed (bcrypt/argon2).
- [x] **III. API-First Architecture**: Auth is handled by Next.js, but API is secured via standard Bearer tokens.
- [x] **IV. Data Integrity & Analytics Accuracy**: User IDs consistent across systems.
- [x] **V. Multi-Tenancy & Role-Based Access**: User schema supports RBAC (roles field).

## Project Structure

### Documentation (this feature)

```text
specs/003-user-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── context/auth-context.tsx    # Auth Provider
│   ├── lib/api.ts                  # API Client
│   ├── components/auth/            # Login/Register forms
│   └── middleware.ts               # Route protection
├── api/
│   ├── src/auth/                   # Auth module
│   │   ├── strategies/             # Passport Strategies (Local, Google, Github, JWT)
│   │   ├── auth.controller.ts      # Auth Endpoints
│   │   └── auth.service.ts         # Auth Logic
│   └── src/user/                   # User module
└── packages/
    ├── database/                   # Prisma schema updates
    └── types/                      # Shared auth types
```

**Structure Decision**: API-First approach. NestJS handles all Authentication and Authorization via Passport strategies and JWTs. Frontend uses React Context to manage session state.
