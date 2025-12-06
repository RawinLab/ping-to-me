# QR Analytics Feature

## Overview
The analytics module now supports tracking click sources (DIRECT, QR, API) and provides dedicated QR analytics endpoints to help users understand how their links are being accessed.

## Changes Made

### 1. Analytics Service Updates

#### Updated `trackClick` Method
- Added `source` parameter (optional): `'DIRECT' | 'QR' | 'API'`
- Defaults to `DIRECT` if not specified
- Stores the source in the database for analytics aggregation
- Now also stores parsed device, browser, and OS information

**Example:**
```typescript
await analyticsService.trackClick({
  slug: 'my-link',
  timestamp: new Date().toISOString(),
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.1',
  country: 'US',
  source: 'QR' // New parameter
});
```

#### New `getQrAnalytics` Method
Returns detailed breakdown of click sources for a specific link.

**Endpoint:** `GET /links/:id/analytics/qr`

**Response:**
```json
{
  "totalClicks": 100,
  "qrScans": 60,
  "directClicks": 30,
  "apiClicks": 10,
  "qrPercentage": 60
}
```

**Features:**
- Ownership verification (404 if link not found, 403 if unauthorized)
- Counts clicks by source type
- Calculates QR scan percentage
- Returns all-time statistics (not time-bound like regular analytics)

### 2. Enhanced Link Analytics

The `getLinkAnalytics` method now includes `sources` in the response:

```json
{
  "totalClicks": 150,
  "allTimeClicks": 500,
  // ... other analytics
  "sources": {
    "DIRECT": 80,
    "QR": 60,
    "API": 10
  }
}
```

### 3. New DTO

Created `TrackClickDto` in `/apps/api/src/analytics/dto/track-click.dto.ts`:

```typescript
export class TrackClickDto {
  slug: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  country?: string;
  source?: ClickSource; // 'DIRECT' | 'QR' | 'API'
}
```

Uses class-validator decorators for request validation.

### 4. Controller Updates

Added new endpoint in `LinkAnalyticsController`:

```typescript
@UseGuards(AuthGuard)
@Get(':id/analytics/qr')
async getQrAnalytics(@Request() req, @Param('id') id: string) {
  return this.analyticsService.getQrAnalytics(id, req.user.id);
}
```

## Integration with Redirector

The Cloudflare Workers redirector already detects QR sources and sends the appropriate source:

```typescript
// In apps/redirector/src/index.ts
const clickSource = url.searchParams.get('utm_source') === 'qr' ||
                    url.searchParams.get('qr') === '1'
  ? 'QR'
  : 'DIRECT';

await fetch(`${apiUrl}/analytics/track`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slug,
    timestamp: new Date().toISOString(),
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip'),
    country: c.req.header('cf-ipcountry'),
    source: clickSource, // Sent to API
  }),
});
```

## Usage Examples

### Frontend Integration

#### Display QR Analytics for a Link
```typescript
const response = await fetch(`/api/links/${linkId}/analytics/qr`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const qrStats = await response.json();

console.log(`Total Clicks: ${qrStats.totalClicks}`);
console.log(`QR Scans: ${qrStats.qrScans} (${qrStats.qrPercentage}%)`);
console.log(`Direct Clicks: ${qrStats.directClicks}`);
console.log(`API Clicks: ${qrStats.apiClicks}`);
```

#### Display Source Breakdown in Analytics Dashboard
```typescript
const response = await fetch(`/api/links/${linkId}/analytics?days=30`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const analytics = await response.json();

// Render pie chart or bar chart with sources
const sourceData = analytics.sources; // { DIRECT: 80, QR: 60, API: 10 }
```

## Database Schema

The `ClickEvent` model already includes the `source` field:

```prisma
model ClickEvent {
  id        String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  linkId    String      @db.Uuid
  timestamp DateTime    @default(now())
  ip        String?
  country   String?
  city      String?
  device    String?
  browser   String?
  os        String?
  referrer  String?
  userAgent String?
  source    ClickSource @default(DIRECT)

  link      Link        @relation(fields: [linkId], references: [id])
}

enum ClickSource {
  DIRECT
  QR
  API
}
```

## Testing

Comprehensive unit tests are included in `analytics.service.spec.ts`:

- ✅ Track clicks with DIRECT source (default)
- ✅ Track clicks with QR source
- ✅ Track clicks with API source
- ✅ Ignore clicks for invalid slugs
- ✅ Parse user agent and store device info
- ✅ Get QR analytics for valid link
- ✅ Handle zero clicks
- ✅ Throw NotFoundException for non-existent link
- ✅ Throw ForbiddenException for unauthorized access
- ✅ Calculate percentage correctly
- ✅ Handle missing source types

Run tests:
```bash
cd apps/api
pnpm test analytics.service.spec.ts
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analytics/track` | None | Track a click (called by redirector) |
| GET | `/analytics/dashboard` | JWT | Get dashboard metrics for user |
| GET | `/links/:id/analytics` | JWT | Get detailed analytics for a link |
| GET | `/links/:id/analytics/qr` | JWT | **NEW:** Get QR-specific analytics for a link |

## Future Enhancements

Potential improvements to consider:

1. **Time-based QR Analytics**: Add date range filtering to QR analytics
2. **Source Timeline**: Show QR vs Direct clicks over time in a chart
3. **QR Campaign Analytics**: Group QR analytics by campaign
4. **Source-specific Device Analytics**: Show device breakdown per source type
5. **Source-specific Geographic Analytics**: Show country/city breakdown per source
6. **Webhook Events**: Trigger webhooks for QR scans vs direct clicks
7. **Real-time QR Scan Dashboard**: Live updates when QR codes are scanned
