# Developer API Keys - UAT Test Documentation Index

## Overview

This directory contains consolidated UAT test documentation for the Developer API Keys feature (Module 15).

**Total Tests: 30 | Passed: 29 | Blocked: 1 (97%)**

---

## Documentation Structure

| File | Test Cases | Status | Description |
|------|------------|--------|-------------|
| [01-DEV-001-002-page-access.md](01-DEV-001-002-page-access.md) | DEV-001, DEV-002 | ✅ 2/2 PASS | Page Access & Quick Start Guide |
| [02-DEV-010-014-create-api-key.md](02-DEV-010-014-create-api-key.md) | DEV-010 to DEV-014 | ✅ 5/5 PASS | Create API Key Dialog & Validation |
| [03-DEV-020-021-api-scopes.md](03-DEV-020-021-api-scopes.md) | DEV-020, DEV-021 | ✅ 2/2 PASS | API Scopes Display & Selection |
| [04-DEV-030-036-key-management.md](04-DEV-030-036-key-management.md) | DEV-030 to DEV-036 | ✅ 7/7 PASS | Key Management (Rotate, Expire, Delete) |
| [05-DEV-040-045-status-badges.md](05-DEV-040-045-status-badges.md) | DEV-040 to DEV-045 | ✅ 6/6 PASS | Status Badges Display |
| [06-DEV-050-071-auth-rbac.md](06-DEV-050-071-auth-rbac.md) | DEV-050-054, DEV-070-071 | ⚠️ 6/7 PASS | API Key Auth & RBAC |

---

## Test Summary by Feature

### 1. Page Access (DEV-001 to DEV-002)
- Access API Keys page at `/dashboard/developer/api-keys`
- Quick Start Guide with cURL examples
- **Status: 100% PASS**

### 2. Create API Key (DEV-010 to DEV-014)
- Create dialog with all form elements
- Name and scope validation
- Advanced settings (IP whitelist, rate limit, expiration)
- **Status: 100% PASS**

### 3. API Scopes (DEV-020 to DEV-021)
- Display 25+ scopes across 7 categories
- Checkbox selection/deselection
- Scope descriptions and tooltips
- **Status: 100% PASS**

### 4. Key Management (DEV-030 to DEV-036)
- List API keys with metadata
- Copy masked key preview
- Rotate key with password confirmation
- Set/clear expiration dates
- Revoke/delete keys
- **Status: 100% PASS**

### 5. Status Badges (DEV-040 to DEV-045)
- Active (green), Never Used (gray)
- IP Restricted (blue), Rate Limited (purple)
- Expired (red), Expiring Soon (orange)
- **Status: 100% PASS**

### 6. API Authentication (DEV-050 to DEV-054)
- Valid API key authentication
- Scope validation (403 for insufficient)
- Invalid/revoked key rejection (401)
- **Status: 4/5 PASS (1 BLOCKED)**

### 7. RBAC (DEV-070 to DEV-071)
- VIEWER cannot access API Keys
- EDITOR cannot create API Keys
- **Status: 100% PASS**

---

## E2E Test Files

| File | Coverage |
|------|----------|
| `uat-dev-001-002-simple.spec.ts` | DEV-001, DEV-002 |
| `uat-dev-001-002-api-keys-access.spec.ts` | DEV-001, DEV-002 (comprehensive) |
| `dev-api-keys-validation.spec.ts` | DEV-010 to DEV-014 |
| `uat-dev-api-scopes.spec.ts` | DEV-020, DEV-021 |
| `uat-developer-api-keys.spec.ts` | DEV-030 to DEV-036 |
| `dev-040-045-api-key-badges.spec.ts` | DEV-040 to DEV-045 |
| `dev-070-rbac-viewer-api-keys.spec.ts` | DEV-070 |
| `dev-071-rbac-editor-api-keys.spec.ts` | DEV-071 |

### Run All Tests
```bash
cd apps/web
npx playwright test --project=chromium e2e/dev-*.spec.ts e2e/uat-dev*.spec.ts
```

---

## Test Environment

| Component | Value |
|-----------|-------|
| Web Application | http://localhost:3010 |
| API Server | http://localhost:3011 |
| Test User | e2e-owner@pingtome.test / TestPassword123! |
| Test Framework | Playwright 1.57.0 |
| Browser | Chromium |

---

## Archive

Original detailed reports have been moved to `./archive/` directory for reference.

---

*Last Updated: December 12, 2025*
