# Module 1.10: Link Status Control - Development Todolist

> **Status**: ~75% Complete
> **Priority**: CRITICAL - Bug where disabled links still redirect!
> **Reference**: `requirements/1-10-link-status-control-plan.md`

---

## CRITICAL BUG

**Problem**: Disabled links still redirect because the Cloudflare Workers redirector doesn't check status.

**Impact**: Users cannot actually disable links - disabled links remain accessible to anyone with the short URL.

**Root Cause**: Status is not stored in Cloudflare KV, and redirector doesn't validate status before redirecting.

---

## Phase 1: Critical Fixes (IMMEDIATE - P0)

### Task 1.10.1: Add Status to KV Sync
- [ ] **Update syncToCloudflare method**
  - File: `apps/api/src/links/links.service.ts`
  - Add `status: link.status` to KV value
  - Current KV stores: url, passwordHash, expirationDate, deepLinkFallback
  - Must add: status

```typescript
// BEFORE
const kvValue = {
  url: link.originalUrl,
  passwordHash: link.passwordHash,
  expirationDate: link.expirationDate,
  deepLinkFallback: link.deepLinkFallback,
};

// AFTER
const kvValue = {
  url: link.originalUrl,
  passwordHash: link.passwordHash,
  expirationDate: link.expirationDate,
  deepLinkFallback: link.deepLinkFallback,
  status: link.status, // ADD THIS
};
```

### Task 1.10.2: Validate Status in Redirector
- [ ] **Add status check in redirector worker**
  - File: `apps/redirector/src/index.ts`
  - Check status BEFORE processing redirect
  - Return appropriate error for non-ACTIVE statuses

```typescript
// After parsing metadata from KV
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

### Task 1.10.3: Add ARCHIVED to Enum
- [ ] **Update Prisma schema**
  - File: `packages/database/prisma/schema.prisma`
  - Add ARCHIVED to LinkStatus enum
  - Run migration

```prisma
enum LinkStatus {
  ACTIVE
  EXPIRED
  DISABLED
  ARCHIVED  // ADD THIS
  BANNED
}
```

- [ ] **Run database migration**
  - `pnpm --filter @pingtome/database db:push`
  - Or create proper migration

---

## Phase 2: Important Features

### Task 1.10.4: Dedicated Restore Action
- [ ] **Add restore UI for archived links**
  - File: `apps/web/components/links/LinksTable.tsx`
  - Show "Restore" button for archived links
  - Call status update API to set ACTIVE

### Task 1.10.5: Bulk Status Change
- [ ] **Add bulk enable/disable to bulk edit**
  - Extends Module 1.5 bulk edit functionality
  - Add status options: Enable All, Disable All, Archive All

- [ ] **Add bulk action buttons to toolbar**
  - File: `apps/web/components/links/LinksTable.tsx`
  - Buttons: Enable, Disable, Archive

### Task 1.10.6: Auto-Expire Cron Job
- [ ] **Create scheduled task to expire links**
  - File: `apps/api/src/tasks/expire-links.task.ts`
  - Run every hour
  - Find links where expirationDate < now() AND status = ACTIVE
  - Update status to EXPIRED
  - Update Cloudflare KV for each

---

## Unit Tests Required

### KV Sync Tests
```
File: apps/api/src/links/__tests__/links.service.spec.ts
```
- [ ] syncToCloudflare: include status in KV value
- [ ] syncToCloudflare: update KV when status changes

### Status Update Tests
- [ ] updateStatus: change status to DISABLED
- [ ] updateStatus: change status to ARCHIVED
- [ ] updateStatus: audit log status changes
- [ ] updateStatus: sync to KV after status change

### Lookup Tests
- [ ] lookup: reject DISABLED links (403)
- [ ] lookup: reject BANNED links (403)
- [ ] lookup: reject ARCHIVED links (410)
- [ ] lookup: accept ACTIVE links

---

## E2E Tests Required

```
File: apps/web/e2e/status.spec.ts (extend)
```

### Existing Tests
- STAT-001: Disable Link
- STAT-003: Archive Link
- STAT-004: Restore/Enable Link

### New Tests
- [ ] STAT-005: Disabled link returns 403 at redirect
- [ ] STAT-006: Bulk disable multiple links
- [ ] STAT-007: Bulk enable multiple links
- [ ] STAT-008: Archived link returns 410 at redirect
- [ ] STAT-009: Banned link returns 410 at redirect

---

## Acceptance Criteria

### Phase 1 Complete When:
- [ ] Status is included in Cloudflare KV sync
- [ ] Redirector validates status before redirecting
- [ ] DISABLED links return 403 (not redirect)
- [ ] BANNED links return 410 (not redirect)
- [ ] ARCHIVED enum value exists in database
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Restore button works for archived links
- [ ] Bulk status change works
- [ ] Auto-expire job runs successfully
- [ ] E2E tests pass

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/tasks/expire-links.task.ts` | Auto-expire cron job |

### Files to Modify
| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add ARCHIVED to LinkStatus enum |
| `apps/api/src/links/links.service.ts` | Add status to syncToCloudflare |
| `apps/redirector/src/index.ts` | Validate status before redirect |
| `apps/web/components/links/LinksTable.tsx` | Restore button, bulk actions |

---

## Migration Checklist

### Before Deployment
1. [ ] Add ARCHIVED to Prisma enum
2. [ ] Run database migration
3. [ ] Deploy API with updated KV sync
4. [ ] Re-sync all existing links to KV (to add status)
5. [ ] Deploy redirector with status validation

### Re-sync Script
```typescript
// One-time script to add status to all existing KV entries
const links = await prisma.link.findMany({
  where: { status: 'ACTIVE' }
});

for (const link of links) {
  await cloudflareKV.put(link.slug, JSON.stringify({
    url: link.originalUrl,
    passwordHash: link.passwordHash,
    expirationDate: link.expirationDate,
    deepLinkFallback: link.deepLinkFallback,
    status: link.status, // Now included
  }));
}
```

---

## Priority Notes

**This is a CRITICAL bug fix module.**

Users expect disabled links to be inaccessible. Currently:
- User disables link → Database status = DISABLED
- Someone accesses short URL → Link still redirects!
- **Status check happens in API but not in edge redirector**

Fix effort: ~30 minutes to implement, but requires coordinated deployment.

---

*Generated from: 1-10-link-status-control-plan.md*
*Last Updated: 2025-12-08*
