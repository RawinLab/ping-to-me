# Research: Create Shortened URL

**Feature**: Create Shortened URL
**Status**: Complete
**Date**: 2025-12-03

## Summary

This feature involves creating a URL shortening service with advanced options. Key technical decisions involve slug generation, QR code generation, and domain blocking.

## Decisions

### 1. Slug Generation

- **Decision**: Use `nanoid` (custom alphabet).
- **Rationale**:
  - Highly performant and collision-resistant.
  - Allows custom alphabet (alphanumeric) to ensure URL-safe characters.
  - Configurable length (6-8 chars).
- **Alternatives Considered**:
  - `uuid`: Too long for short URLs.
  - Database auto-increment ID (base62 encoded): Predictable (security risk) and requires coordination in distributed systems.

### 2. QR Code Generation

- **Decision**: Use `qrcode` (Node.js library) on the backend.
- **Rationale**:
  - Generates standard QR codes as Data URIs or buffers.
  - Mature and widely used.
  - Allows generating on demand or storing. For now, generate on demand or client-side?
  - _Refinement_: Generate on client-side (`qrcode.react` or similar) to save server resources, OR generate on server if we need to embed it in emails/static exports.
  - _Final Decision_: Server-side generation (API returns Data URI) allows consistent usage across platforms (web, mobile, email) and caching.
- **Alternatives Considered**:
  - Client-side generation: Saves server CPU, but less consistent for non-web clients.

### 3. Blocked Domains

- **Decision**: Internal Database Table (`BlockedDomain`).
- **Rationale**:
  - Zero latency (local lookup).
  - Full control over the list.
  - Can be seeded with public lists.
- **Alternatives Considered**:
  - Google Safe Browsing API: Better coverage but adds latency and complexity (API keys, quotas). Can be added as a second layer later.

## Unknowns & Clarifications

- **Resolved**: Slug generation library (`nanoid`).
- **Resolved**: QR code strategy (Server-side `qrcode`).
- **Resolved**: Blacklist strategy (Internal DB).
