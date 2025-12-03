# Quickstart: Create Shortened URL

**Feature**: Create Shortened URL
**Status**: Draft

## Prerequisites

1. **Database Migration**:
   - Ensure `packages/database/prisma/schema.prisma` is updated with `Link` and `BlockedDomain` models.
   - Run `pnpm db:push` to apply changes.

2. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: Base URL for constructing short links (e.g., `http://localhost:3000`).

## Testing the Feature

### 1. Create a Link (API)

```bash
curl -X POST http://localhost:3001/links \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://google.com",
    "slug": "google"
  }'
```

### 2. Create a Link (Frontend)

1. Login to the dashboard.
2. Navigate to `/dashboard/links`.
3. Click "Create Link".
4. Enter `https://example.com` and click "Create".
5. Verify the new link appears in the list.

### 3. Verify Redirection

1. Open the short URL (e.g., `http://localhost:3000/google`).
2. Verify it redirects to `https://google.com`.

### 4. Verify Blocked Domain

1. Add `phishing.com` to `BlockedDomain` table.
2. Try to shorten `https://phishing.com`.
3. Verify it fails with 403 Forbidden.
