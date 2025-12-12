# PingTO.Me - UAT Test Documentation Index

## Overview

This directory contains consolidated UAT test documentation for PingTO.Me URL Shortener platform.

---

## Module 15: Developer API Keys

**Total Tests: 30 | Passed: 29 | Blocked: 1 (97%)**

| File | Test Cases | Status | Description |
|------|------------|--------|-------------|
| [01-DEV-001-002-page-access.md](01-DEV-001-002-page-access.md) | DEV-001, DEV-002 | ✅ 2/2 PASS | Page Access & Quick Start Guide |
| [02-DEV-010-014-create-api-key.md](02-DEV-010-014-create-api-key.md) | DEV-010 to DEV-014 | ✅ 5/5 PASS | Create API Key Dialog & Validation |
| [03-DEV-020-021-api-scopes.md](03-DEV-020-021-api-scopes.md) | DEV-020, DEV-021 | ✅ 2/2 PASS | API Scopes Display & Selection |
| [04-DEV-030-036-key-management.md](04-DEV-030-036-key-management.md) | DEV-030 to DEV-036 | ✅ 7/7 PASS | Key Management (Rotate, Expire, Delete) |
| [05-DEV-040-045-status-badges.md](05-DEV-040-045-status-badges.md) | DEV-040 to DEV-045 | ✅ 6/6 PASS | Status Badges Display |
| [06-DEV-050-071-auth-rbac.md](06-DEV-050-071-auth-rbac.md) | DEV-050-054, DEV-070-071 | ⚠️ 6/7 PASS | API Key Auth & RBAC |

---

## Module 14: RBAC (Role-Based Access Control)

**Overall Status: Mostly Working | Some Frontend RBAC Missing**

| File | Test Cases | Status | Description |
|------|------------|--------|-------------|
| [07-RBAC-organization-settings.md](07-RBAC-organization-settings.md) | RBAC-001 to RBAC-004 | ✅ 4/4 PASS | Organization Settings Access |
| [08-RBAC-team-management.md](08-RBAC-team-management.md) | RBAC-010 to RBAC-013 | ✅ 4/4 PASS | Team Management Access |
| [09-RBAC-links-access.md](09-RBAC-links-access.md) | RBAC-030 to RBAC-033 | ⚠️ 12/20 PASS | Links Management Access |
| [10-RBAC-custom-domains.md](10-RBAC-custom-domains.md) | DOM-050 to DOM-054 | ⚠️ 11/23 PASS | Custom Domains RBAC |

---

## Module 05: Organization Features

| File | Test Cases | Status | Description |
|------|------------|--------|-------------|
| [11-folder-management.md](11-folder-management.md) | FLD-001 to FLD-005 | ⚠️ 3/5 PASS | Folder Management |

---

## Summary by Category

### Developer API Keys (Module 15)
- **Page Access**: 100% PASS
- **Create API Key**: 100% PASS
- **API Scopes**: 100% PASS
- **Key Management**: 100% PASS
- **Status Badges**: 100% PASS
- **API Authentication**: 80% (1 BLOCKED - requires expired key)
- **API Key RBAC**: 100% PASS

### RBAC Tests (Module 14)
- **Organization Settings**: 100% PASS
- **Team Management**: 100% PASS
- **Links Access**: 60% (Known issue with update/delete)
- **Custom Domains**: 48% (Frontend RBAC not implemented)

### Organization Features (Module 05)
- **Folder Management**: 60% (Backend ready, UI pending)

---

## Test Specifications

Full test specifications are located in `/user-tests/testcase/`:

| File | Module |
|------|--------|
| 01-authentication.md | Authentication |
| 02-dashboard.md | Dashboard |
| 03-link-management.md | Link Management |
| 04-link-analytics.md | Analytics |
| 05-organization.md | Organization |
| 06-custom-domains.md | Custom Domains |
| 07-qr-codes.md | QR Codes |
| 08-bio-pages.md | Bio Pages |
| 09-bulk-operations.md | Bulk Operations |
| 10-notifications.md | Notifications |
| 11-audit-logs.md | Audit Logs |
| 12-billing-quota.md | Billing & Quota |
| 13-team-management.md | Team Management |
| 14-rbac.md | RBAC |
| 15-developer-api-keys.md | API Keys |
| 16-developer-webhooks.md | Webhooks |

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

Original detailed reports have been moved to `./archive/` directory:
- Developer API Keys reports (22 files)
- RBAC test reports
- Folder management report
- Test scripts

---

## Known Issues

### 1. Links Update/Delete RBAC
OWNER, ADMIN, EDITOR cannot update/delete links despite having permissions.
- **Root cause**: Possible OrganizationMember records issue
- **Workaround**: `pnpm --filter @pingtome/database db:reset`

### 2. Custom Domains Frontend RBAC
Add/Delete/Verify buttons visible to VIEWER and EDITOR roles.
- **Root cause**: Missing `PermissionGate` wrappers
- **Impact**: UX issue only (backend blocks unauthorized actions)

### 3. Folder UI Features
Move link to folder and nested folders not implemented in UI.
- **Backend**: Fully implemented
- **Frontend**: UI pending

---

*Last Updated: December 12, 2025*
