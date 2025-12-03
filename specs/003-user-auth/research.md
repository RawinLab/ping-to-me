# Research: User Authentication

**Feature**: User Authentication
**Status**: Complete
**Date**: 2025-12-03

## Summary

This feature implements user authentication using **NextAuth.js (Auth.js)** for the frontend and **Nodemailer** for email delivery. The backend (NestJS) will verify JWTs issued by NextAuth.js.

## Decisions

### 1. Authentication Provider

- **Decision**: **NextAuth.js (Auth.js)**
- **Rationale**:
  - Built-in support for OAuth (Google, GitHub, Facebook) and Magic Links.
  - Reduces boilerplate code significantly compared to custom Passport.js implementation.
  - Secure by default (CSRF protection, encrypted JWTs).
  - Seamless integration with Next.js App Router.
- **Alternatives Considered**:
  - **Custom NestJS (Passport.js)**: More control but high effort to implement OAuth/Magic Links securely.
  - **Clerk/Auth0**: Expensive at scale, vendor lock-in.

### 2. Email Service

- **Decision**: **Nodemailer (SMTP)**
- **Rationale**:
  - Standard library for Node.js email sending.
  - Provider-agnostic (works with any SMTP service).
  - Good for development and production (with a reliable SMTP provider).
- **Alternatives Considered**:
  - **Resend/SendGrid SDKs**: Vendor-specific. Nodemailer provides a generic abstraction.

### 3. Token Verification Strategy

- **Decision**: **Stateless JWT Verification**
- **Rationale**:
  - NextAuth.js issues a JWT (session token).
  - NestJS API verifies this token using the same secret.
  - Avoids database lookups for every request (performance).
- **Alternatives Considered**:
  - **Database Sessions**: NextAuth saves session in DB. API queries DB. Slower but allows instant revocation.

## Unknowns & Clarifications

- **Resolved**: Email Provider (Nodemailer).
- **Resolved**: Auth Architecture (NextAuth.js).
