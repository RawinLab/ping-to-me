# Research: Landing Page

**Feature**: Landing Page
**Status**: Complete
**Date**: 2025-12-03

## Summary

This feature involves creating a static landing page within the existing Next.js application. No significant technical unknowns or research topics were identified.

## Decisions

### 1. Pricing Data Management

- **Decision**: Hardcode pricing plans in the frontend.
- **Rationale**: Simplest approach for MVP. Avoids database schema changes and API development for static data that rarely changes.
- **Alternatives Considered**:
  - **Database + API**: Overkill for MVP.
  - **Config File**: Good middle ground, but hardcoding in a component or constant file is effectively the same for this scale.

### 2. Routing Structure

- **Decision**: Use Next.js Route Groups `(landing)`
- **Rationale**: Allows for a distinct layout (e.g., different header/footer) for the landing page compared to the dashboard, without affecting the URL structure (landing page remains at `/`).

## Unknowns & Clarifications

- **Resolved**: Pricing data source (Hardcoded).
