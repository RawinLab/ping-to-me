# Module 1.10: Link Status Control - Development Plan

## Executive Summary

**Module**: 1.10 Link Status Control
**Status**: ~75% Complete
**Priority**: Medium
**Complexity**: Low

Link Status Control allows users to manage link lifecycle (enable/disable/archive). The database schema and API endpoints are implemented, but there's a critical gap: the Cloudflare Workers redirector doesn't validate status, meaning disabled links still redirect.

---

## Current Implementation Status

### Database Schema

```prisma
enum LinkStatus {
  ACTIVE    // Default, link is functional
  EXPIRED   // Past expiration date
  DISABLED  // Manually disabled by user
  BANNED    // Administrative block
}

model Link {
  status LinkStatus @default(ACTIVE)
  expirationDate DateTime?
}
```

**Note**: ARCHIVED is referenced in frontend but NOT in the database enum.

### Backend Status (~80% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Status Enum | Implemented | schema.prisma |
| Status Update | Implemented | links.service.ts |
| Expiration Check (API) | Implemented | lookup method |
| Expiration Check (Redirector) | Implemented | Returns 410 |
| Status Check (Redirector) | NOT IMPLEMENTED | Critical gap |
| Status Filtering | Implemented | List endpoint |
| Audit Logging | Implemented | Status changes logged |
| RBAC | Implemented | Own links only |

### Frontend Status (~85% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Status Badges | Implemented | LinksTable.tsx |
| Enable/Disable Toggle | Implemented | Dropdown menu |
| Archive Action | Implemented | UI only, not in DB enum |
| Status Filter | Implemented | Dropdown filter |
| Visual Indicators | Implemented | Opacity, badges |
| Permission Check | Implemented | canModifyLink() |

### E2E Tests (~80% Complete)

| Test ID | Scenario | Status |
|---------|----------|--------|
| STAT-001 | Disable Link | Active |
| STAT-003 | Archive Link | Active |
| STAT-004 | Restore/Enable Link | Active |

---

## Critical Gap: Redirector Status Validation

### Current Behavior (PROBLEM)

```typescript
// apps/redirector/src/index.ts
// Current KV stores ONLY:
{ url, passwordHash, expirationDate, deepLinkFallback }
// Status is NOT stored or checked!
```

**Impact**: Disabled links still redirect because status isn't validated at edge.

### Required Fix

```typescript
// 1. Update KV value to include status
const kvValue = {
  url: link.originalUrl,
  passwordHash: link.passwordHash,
  expirationDate: link.expirationDate,
  status: link.status, // NEW
};

// 2. Validate status in redirector
if (metadata.status !== 'ACTIVE') {
  return c.text('Link is not active', 403);
}
```

---

## Gap Analysis

### Critical Gaps

1. **Redirector Status Check**
   - Status not stored in Cloudflare KV
   - Disabled links still redirect
   - BANNED links still accessible

2. **ARCHIVED Status**
   - Referenced in frontend
   - Not in database enum
   - Backend may not persist correctly

### Minor Gaps

3. **Restore from Archive**
   - Archive action exists
   - No dedicated "restore" UI
   - Uses same status toggle

4. **Bulk Status Change**
   - No bulk enable/disable
   - Referenced in Module 1.5

---

## Feature Breakdown by Priority

### Priority 0 (Critical) - Must Fix

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| STS-001 | Add status to KV sync | Update sync logic | - | Unit |
| STS-002 | Validate status in redirector | Check in worker | - | Integration |
| STS-003 | Add ARCHIVED to enum | Update schema | - | Unit |

### Priority 1 (Important)

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| STS-004 | Dedicated restore action | - | Restore button | E2E |
| STS-005 | Bulk status change | Add endpoint | Bulk action | E2E |
| STS-006 | Auto-expire cron job | Scheduled task | - | Unit |

---

## Implementation Details

### 1. Fix KV Sync (Critical)

```typescript
// apps/api/src/links/links.service.ts
// Update syncToCloudflare method

private async syncToCloudflare(link: Link) {
  await this.cloudflareKV.put(link.slug, JSON.stringify({
    url: link.originalUrl,
    passwordHash: link.passwordHash,
    expirationDate: link.expirationDate,
    deepLinkFallback: link.deepLinkFallback,
    status: link.status, // ADD THIS
  }));
}
```

### 2. Fix Redirector Validation (Critical)

```typescript
// apps/redirector/src/index.ts

// After parsing metadata
const metadata = JSON.parse(value);

// Check status BEFORE expiration
if (metadata.status && metadata.status !== 'ACTIVE') {
  if (metadata.status === 'DISABLED') {
    return c.text('Link is disabled', 403);
  }
  if (metadata.status === 'BANNED') {
    return c.text('Link has been removed', 410);
  }
  if (metadata.status === 'EXPIRED') {
    return c.text('Link has expired', 410);
  }
  if (metadata.status === 'ARCHIVED') {
    return c.text('Link is archived', 410);
  }
}
```

### 3. Add ARCHIVED to Enum

```prisma
enum LinkStatus {
  ACTIVE
  EXPIRED
  DISABLED
  ARCHIVED  // ADD THIS
  BANNED
}
```

---

## Unit Test Cases

```typescript
describe('Link Status Control', () => {
  describe('syncToCloudflare', () => {
    it('should include status in KV value', async () => {
      // Verify status is synced
    });
  });

  describe('status update', () => {
    it('should change status to DISABLED', async () => {
      // Update and verify
    });

    it('should audit log status changes', async () => {
      // Verify audit entry
    });

    it('should sync to KV after status change', async () => {
      // Verify KV updated
    });
  });

  describe('lookup', () => {
    it('should reject DISABLED links', async () => {
      // Expect ForbiddenException
    });

    it('should reject BANNED links', async () => {
      // Expect ForbiddenException
    });
  });
});
```

## E2E Test Cases

```typescript
test('STS-005: Disabled link returns 403', async ({ page }) => {
  // Navigate to short URL of disabled link
  // Verify 403 response or error page
});

test('STS-006: Bulk disable links', async ({ page }) => {
  // Select multiple links
  // Click bulk disable
  // Verify all links disabled
});
```

---

## Summary

Module 1.10 Link Status Control is approximately 75% complete. The main implementation exists but has a critical gap: **disabled links still redirect because the Cloudflare Workers redirector doesn't check status**.

**Critical Actions**:
1. Add status to KV sync (5 minutes)
2. Validate status in redirector (10 minutes)
3. Add ARCHIVED to enum (migration required)

**Priority**: High - this is a security/functionality bug where disabled links remain accessible.
