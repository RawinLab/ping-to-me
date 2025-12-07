# Module 1.7: Link Analytics (Per-Link Dashboard) - Development Plan

## Executive Summary

**Module**: 1.7 Link Analytics
**Status**: ~80% Complete
**Priority**: High
**Complexity**: Medium

The Link Analytics module provides comprehensive click tracking and visualization. The core tracking infrastructure is solid with Cloudflare Workers edge tracking, async event processing, and UA parsing. However, key features like export functionality, browser/OS charts, geographic maps, and custom date ranges are missing.

---

## Current Implementation Status

### Backend Analytics (~85% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Click Event Model | Implemented | schema.prisma:383-398 |
| Real-time Tracking | Implemented | analytics.service.ts:14-55 |
| Dashboard Metrics | Implemented | analytics.service.ts:200-326 |
| Link-Specific Analytics | Implemented | analytics.service.ts:57-198 |
| QR Analytics | Implemented | analytics.service.ts:343-369 |
| Device/Browser/OS Tracking | Implemented | ua-parser-js integration |
| Country Tracking | Implemented | cf-ipcountry header |
| Time-Series | Implemented | Query-time aggregation |
| RBAC Protection | Implemented | Permission guards |
| Audit Logging | Implemented | Track events logged |
| Export (CSV/JSON) | NOT IMPLEMENTED | - |
| City Geolocation | NOT IMPLEMENTED | Field exists, not populated |
| Batch Aggregation | NOT IMPLEMENTED | All at query-time |
| Caching | NOT IMPLEMENTED | - |

### Redirector Click Tracking (~95% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Async Tracking | Implemented | index.ts:101-115 |
| KV Edge Caching | Implemented | 1-hour TTL |
| Source Detection | Implemented | QR/DIRECT/API |
| IP Capture | Implemented | cf-connecting-ip |
| Country Capture | Implemented | cf-ipcountry |
| User Agent Capture | Implemented | Full UA string |
| Fire-and-Forget | Implemented | executionCtx.waitUntil |
| Referrer Capture | NOT IMPLEMENTED | - |
| Bot Filtering | NOT IMPLEMENTED | - |
| API Key Security | NOT IMPLEMENTED | - |

### Frontend Analytics UI (~75% Complete)

| Feature | Status | Location |
|---------|--------|----------|
| Global Dashboard | Implemented | /dashboard/analytics |
| Link Analytics Page | Implemented | /links/[id]/analytics |
| Stats Cards | Implemented | StatsCard.tsx |
| Engagements Chart | Implemented | EngagementsChart.tsx |
| Locations Chart | Implemented | LocationsChart.tsx (list, not map) |
| Devices Chart | Implemented | DevicesChart.tsx |
| Referrers Chart | Implemented | ReferrersChart.tsx |
| Date Range (7/30/90d) | Implemented | Preset buttons |
| Recent Activity Table | Implemented | Link analytics page |
| Browser Chart | NOT IMPLEMENTED | Data available, no UI |
| OS Chart | NOT IMPLEMENTED | Data available, no UI |
| Geographic Map | NOT IMPLEMENTED | - |
| Custom Date Range | NOT IMPLEMENTED | - |
| Hour/Day Analysis | NOT IMPLEMENTED | - |
| Export UI | NOT IMPLEMENTED | Button shows "coming soon" |

### E2E Test Coverage (~90% Complete)

| Test Area | Tests | Status |
|-----------|-------|--------|
| Navigation | 5 tests | Excellent |
| Stats Cards | 5 tests | Excellent |
| Date Range Selector | 6 tests | Excellent |
| Charts Rendering | 14 tests | Excellent |
| Recent Activity | 5 tests | Excellent |
| Responsive Design | 2 tests | Good |
| Data Accuracy | 3 tests | Good |
| Export Tests | 1 test | Mocked only |

---

## Gap Analysis

### Critical Gaps

1. **Analytics Export**
   - RBAC permission defined but endpoint not implemented
   - E2E test exists but mocked
   - No CSV/JSON generation logic
   - Dashboard export button shows "coming soon"

2. **Browser/OS Charts**
   - Backend returns `browsers` and `os` data
   - No frontend components to display
   - Spec explicitly requires these visualizations

3. **Track Endpoint Security**
   - POST /analytics/track is PUBLIC
   - No API key or shared secret
   - Vulnerable to fake click injection

### Important Gaps

4. **Geographic Map**
   - Currently uses text list with progress bars
   - Spec requires "Interactive map visualization"
   - Need map library integration

5. **Custom Date Range**
   - Only 7/30/90d presets
   - No calendar picker for arbitrary ranges
   - Spec requires: "Today, 7d, 30d, 90d, 1y, Custom"

6. **Referrer Collection**
   - HTTP Referer header available but not captured
   - Redirector only sends other data
   - Missing traffic source attribution

7. **City Geolocation**
   - Field exists in ClickEvent model
   - Never populated (only country from CF)
   - Would need GeoIP database

### Enhancement Gaps

8. **Hour/Day Analysis**
   - No hourly heatmap
   - No day-of-week breakdown
   - Backend doesn't aggregate by hour

9. **Bot/Crawler Filtering**
   - All requests tracked including bots
   - Inflates click counts
   - Need UA-based filtering

10. **Unique Visitor Tracking**
    - No session/visitor deduplication
    - Total clicks != unique visitors
    - No fingerprinting or cookies

---

## Database Schema Updates

### No Required Changes
Current ClickEvent model is sufficient.

### Consider Adding (Future)

```prisma
// Pre-aggregated analytics for performance
model AnalyticsDaily {
  id             String   @id @default(cuid())
  linkId         String   @db.Uuid
  date           DateTime @db.Date
  totalClicks    Int      @default(0)
  uniqueClicks   Int      @default(0)
  qrClicks       Int      @default(0)
  directClicks   Int      @default(0)
  deviceBreakdown Json?   // { Desktop: 100, Mobile: 50 }
  countryBreakdown Json?  // { US: 80, TH: 20 }
  browserBreakdown Json?  // { Chrome: 100, Safari: 50 }
  createdAt      DateTime @default(now())

  link           Link     @relation(fields: [linkId], references: [id])

  @@unique([linkId, date])
  @@index([linkId, date])
}

// Session tracking for unique visitors
model AnalyticsSession {
  id             String   @id @default(cuid())
  linkId         String   @db.Uuid
  sessionId      String   // Hash of IP + UA + Day
  firstClick     DateTime @default(now())
  lastClick      DateTime @default(now())
  clickCount     Int      @default(1)

  @@unique([linkId, sessionId])
}
```

---

## Feature Breakdown by Priority

### Priority 0 (Critical) - Must Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ANA-001 | Analytics Export | GET /links/:id/analytics/export | Download button | E2E |
| ANA-002 | Browser Chart | Already returns data | BrowserChart.tsx | E2E |
| ANA-003 | OS Chart | Already returns data | OSChart.tsx | E2E |
| ANA-004 | Track Endpoint Security | Add API key validation | - | Unit |
| ANA-005 | Capture Referrer | Add to redirector | Show in analytics | E2E |

### Priority 1 (High) - Important

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ANA-006 | Custom Date Range | Support arbitrary dates | Date picker modal | E2E |
| ANA-007 | Geographic Map | - | Map component (echarts) | E2E |
| ANA-008 | Dashboard Export | GET /analytics/export | Download button | E2E |
| ANA-009 | Bot Filtering | Filter in redirector | - | Unit |
| ANA-010 | Period Comparison | Compare vs previous | Show % change | E2E |

### Priority 2 (Medium) - Nice to Have

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ANA-011 | Hour-of-Day Heatmap | Aggregate by hour | Heatmap chart | E2E |
| ANA-012 | Day-of-Week Analysis | Aggregate by day | Bar chart | E2E |
| ANA-013 | City Geolocation | MaxMind integration | City filter | Unit |
| ANA-014 | Unique Visitors | Session tracking | Unique vs Total | Unit |
| ANA-015 | Analytics Caching | Redis/in-memory cache | Faster loads | Unit |

### Priority 3 (Low) - Future Enhancement

| ID | Feature | Backend | Frontend | Tests |
|----|---------|---------|----------|-------|
| ANA-016 | Scheduled Reports | Email queue | Report settings | E2E |
| ANA-017 | PDF Reports | pdfkit generation | Download PDF | E2E |
| ANA-018 | Real-time Dashboard | WebSocket updates | Live counter | Integration |
| ANA-019 | Batch Aggregation | Cron job rollup | - | Unit |
| ANA-020 | Click Deduplication | Fingerprinting | - | Unit |

---

## API Endpoint Specifications

### New Endpoints Required

#### GET /links/:id/analytics/export
```typescript
@Get(':id/analytics/export')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'analytics', action: 'export' })
async exportLinkAnalytics(
  @Param('id') linkId: string,
  @Query() filters: ExportFiltersDto,
  @Res() res: Response,
) {
  return this.analyticsService.exportLinkAnalytics(linkId, filters, res);
}

class ExportFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json';

  @IsOptional()
  @IsNumber()
  @Max(10000)
  limit?: number;
}

// Response Headers:
// Content-Type: text/csv or application/json
// Content-Disposition: attachment; filename="analytics-{linkId}-{date}.csv"
```

#### GET /analytics/export
```typescript
@Get('export')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({ resource: 'analytics', action: 'export' })
async exportDashboardAnalytics(
  @Request() req,
  @Query() filters: ExportFiltersDto,
  @Res() res: Response,
) {
  return this.analyticsService.exportDashboard(req.user.id, filters, res);
}
```

#### Updated POST /analytics/track (Security)
```typescript
@Post('track')
async track(
  @Body() body: TrackClickDto,
  @Headers('x-api-key') apiKey?: string,
) {
  // Validate shared secret from redirector
  const validKey = this.configService.get('ANALYTICS_API_KEY');
  if (apiKey !== validKey) {
    throw new ForbiddenException('Invalid API key');
  }
  return this.analyticsService.trackClick(body);
}
```

### Updated Redirector (Referrer Capture)
```typescript
// apps/redirector/src/index.ts
c.executionCtx.waitUntil(
  fetch(`${apiUrl}/analytics/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.ANALYTICS_API_KEY,  // NEW
    },
    body: JSON.stringify({
      slug,
      timestamp: new Date().toISOString(),
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("cf-connecting-ip"),
      country: c.req.header("cf-ipcountry"),
      referrer: c.req.header("referer") || "direct",  // NEW
      source: clickSource,
    }),
  }).catch((err) => console.error("Analytics error:", err)),
);
```

---

## Security Considerations

### Track Endpoint Protection

```typescript
// Environment variable
ANALYTICS_API_KEY=your-secure-random-key-here

// Redirector wrangler.toml
[vars]
ANALYTICS_API_KEY = "your-secure-random-key-here"

// Backend validation
if (!apiKey || apiKey !== process.env.ANALYTICS_API_KEY) {
  throw new ForbiddenException('Invalid API key');
}
```

### Bot Filtering

```typescript
// Bot detection patterns
const BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i,  // Search engines
  /duckduckbot/i, /baiduspider/i,
  /yandex/i, /facebookexternalhit/i,    // Social crawlers
  /twitterbot/i, /linkedinbot/i,
  /curl/i, /wget/i, /python/i,          // CLI tools
  /postman/i, /insomnia/i,              // API clients
  /bot/i, /spider/i, /crawler/i,        // Generic patterns
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// In trackClick:
if (isBot(data.userAgent)) {
  return; // Don't track bot clicks
}
```

### Rate Limiting

```typescript
// Specific rate limit for tracking endpoint
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100/min
@Post('track')
async track(...) { }

// Limit export frequency
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10/min
@Get(':id/analytics/export')
async export(...) { }
```

---

## Unit Test Cases

### Analytics Export Tests

```typescript
describe('AnalyticsService - Export', () => {
  describe('exportLinkAnalytics', () => {
    it('should generate CSV export with all columns', async () => {
      // Create test clicks
      // Call exportLinkAnalytics with format: 'csv'
      // Verify CSV headers: timestamp, country, device, browser, os, referrer, source
      // Verify data rows match click events
    });

    it('should generate JSON export', async () => {
      // format: 'json'
      // Verify JSON array structure
    });

    it('should filter by date range', async () => {
      // Create clicks on different dates
      // Filter by startDate/endDate
      // Verify only matching clicks included
    });

    it('should respect limit parameter', async () => {
      // Create 100 clicks
      // Request limit: 50
      // Verify only 50 rows in export
    });

    it('should reject if user lacks export permission', async () => {
      // Login as VIEWER role
      // Expect ForbiddenException
    });
  });
});
```

### Bot Filtering Tests

```typescript
describe('AnalyticsService - Bot Filtering', () => {
  it('should not track Googlebot clicks', async () => {
    await service.trackClick({
      slug: 'test',
      userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
    });
    const clicks = await prisma.clickEvent.count();
    expect(clicks).toBe(0);
  });

  it('should track legitimate user clicks', async () => {
    await service.trackClick({
      slug: 'test',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    });
    const clicks = await prisma.clickEvent.count();
    expect(clicks).toBe(1);
  });

  it('should not track curl/wget requests', async () => {
    await service.trackClick({
      slug: 'test',
      userAgent: 'curl/7.64.1',
    });
    const clicks = await prisma.clickEvent.count();
    expect(clicks).toBe(0);
  });
});
```

### Track Endpoint Security Tests

```typescript
describe('AnalyticsController - Track Security', () => {
  it('should reject request without API key', async () => {
    const response = await request(app)
      .post('/analytics/track')
      .send({ slug: 'test', timestamp: new Date().toISOString() });

    expect(response.status).toBe(403);
  });

  it('should reject request with invalid API key', async () => {
    const response = await request(app)
      .post('/analytics/track')
      .set('X-Api-Key', 'wrong-key')
      .send({ slug: 'test', timestamp: new Date().toISOString() });

    expect(response.status).toBe(403);
  });

  it('should accept request with valid API key', async () => {
    const response = await request(app)
      .post('/analytics/track')
      .set('X-Api-Key', process.env.ANALYTICS_API_KEY)
      .send({ slug: 'test', timestamp: new Date().toISOString() });

    expect(response.status).toBe(201);
  });
});
```

---

## E2E Test Cases

### New Test Scenarios

```typescript
// apps/web/e2e/link-analytics.spec.ts (extended)

test.describe('Link Analytics - Extended', () => {
  test('LA-130: Browser chart displays', async ({ page }) => {
    // Navigate to link analytics
    // Verify "Browsers" section visible
    // Verify chart shows Chrome, Safari, Firefox, etc.
    // Verify pie chart or bar chart renders
  });

  test('LA-131: OS chart displays', async ({ page }) => {
    // Navigate to link analytics
    // Verify "Operating Systems" section visible
    // Verify chart shows Windows, macOS, iOS, Android, Linux
    // Verify chart renders correctly
  });

  test('LA-132: Export analytics as CSV', async ({ page }) => {
    // Navigate to link analytics
    // Click "Export" button
    // Select CSV format
    // Verify download triggered
    // Verify filename pattern: analytics-{linkId}-{date}.csv
  });

  test('LA-133: Export analytics as JSON', async ({ page }) => {
    // Click "Export" button
    // Select JSON format
    // Verify download triggered
    // Verify content type: application/json
  });

  test('LA-134: Custom date range picker', async ({ page }) => {
    // Click "Custom" date range button
    // Verify calendar picker opens
    // Select start date and end date
    // Click "Apply"
    // Verify charts update with new range
  });

  test('LA-135: Geographic map visualization', async ({ page }) => {
    // Navigate to analytics
    // Verify map component renders
    // Verify country pins/markers visible
    // Hover over country to see details
  });

  test('LA-136: Period comparison', async ({ page }) => {
    // Enable "Compare to previous period"
    // Verify comparison data shows
    // Verify % change indicators accurate
  });

  test('LA-137: Dashboard export', async ({ page }) => {
    // Navigate to /dashboard/analytics
    // Click "Export" button
    // Verify export includes all links data
    // Verify download triggers
  });

  test('LA-138: Viewer cannot export', async ({ page }) => {
    // Login as Viewer role
    // Navigate to analytics
    // Verify Export button hidden or disabled
  });

  test('LA-139: Hour-of-day heatmap', async ({ page }) => {
    // Navigate to analytics
    // Scroll to heatmap section
    // Verify heatmap grid renders (24 hours x 7 days)
    // Verify color intensity represents click count
  });

  test('LA-140: Day-of-week analysis', async ({ page }) => {
    // Verify bar chart for Mon-Sun
    // Verify each day shows click count
    // Verify tooltips work
  });
});
```

---

## Frontend Component Specifications

### New Components Required

#### 1. BrowserChart Component
```tsx
// components/dashboard/BrowserChart.tsx
interface BrowserChartProps {
  data: Record<string, number>;  // { Chrome: 100, Safari: 50 }
}

// Features:
// - Donut/pie chart similar to DevicesChart
// - Colors: Chrome (blue), Safari (gray), Firefox (orange), Edge (green)
// - Center shows total clicks
// - Legend below chart
// - "Show more" for >5 browsers
```

#### 2. OSChart Component
```tsx
// components/dashboard/OSChart.tsx
interface OSChartProps {
  data: Record<string, number>;  // { Windows: 100, macOS: 50 }
}

// Features:
// - Same pattern as BrowserChart
// - Colors: Windows (blue), macOS (gray), iOS (black), Android (green), Linux (orange)
// - Responsive design
```

#### 3. GeographicMap Component
```tsx
// components/dashboard/GeographicMap.tsx
interface GeographicMapProps {
  data: Record<string, number>;  // { US: 100, TH: 50 }
  onCountryClick?: (countryCode: string) => void;
}

// Features:
// - World map using echarts or react-leaflet
// - Country coloring based on click count
// - Tooltips on hover (country name + count)
// - Click to filter by country
// - Zoom/pan controls
```

#### 4. DateRangePicker Component
```tsx
// components/dashboard/DateRangePicker.tsx
interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{ label: string; days: number }>;
}

// Features:
// - Quick presets: Today, 7d, 30d, 90d, 1y
// - "Custom" opens calendar
// - Dual calendar picker (start + end)
// - Date validation (end >= start)
// - "Apply" and "Cancel" buttons
```

#### 5. HourlyHeatmap Component
```tsx
// components/dashboard/HourlyHeatmap.tsx
interface HourlyHeatmapProps {
  data: Array<{ day: number; hour: number; clicks: number }>;
}

// Features:
// - Grid: 7 days (rows) x 24 hours (columns)
// - Color intensity = click count
// - Tooltips: "Monday 2PM: 45 clicks"
// - Legend with color scale
```

### UI Updates Required

#### analytics/page.tsx Updates
1. Add BrowserChart section
2. Add OSChart section
3. Replace LocationsChart with GeographicMap
4. Add DateRangePicker component
5. Implement working export button

#### link-analytics/page.tsx Updates
1. Add BrowserChart after DevicesChart
2. Add OSChart after BrowserChart
3. Update LocationsChart to use map
4. Add custom date range picker
5. Implement CSV/JSON export

---

## Implementation Roadmap

### Phase 1: Critical Features (Week 1)
1. Implement analytics export endpoint
2. Create BrowserChart component
3. Create OSChart component
4. Secure track endpoint with API key
5. Capture referrer in redirector

### Phase 2: Enhanced UI (Week 2)
1. Create DateRangePicker component
2. Integrate custom date range with backend
3. Create GeographicMap component
4. Add bot filtering to redirector

### Phase 3: Dashboard Export (Week 3)
1. Implement dashboard export endpoint
2. Add export UI to dashboard page
3. Add period comparison feature
4. Performance optimization (caching)

### Phase 4: Advanced Analytics (Week 4)
1. Hour-of-day heatmap (backend + frontend)
2. Day-of-week analysis
3. Unique visitor tracking
4. Batch aggregation job

### Phase 5: Testing & Polish (Week 5)
1. Complete E2E tests for all new features
2. Unit tests for security and filtering
3. Performance testing
4. Documentation

---

## Performance Considerations

### Current Issues

1. **Query-Time Aggregation**
   - All aggregations calculated on request
   - No pre-computed metrics
   - Slow for high-traffic links

2. **No Caching**
   - Analytics recalculated every time
   - Expensive for repeated views
   - Consider Redis caching

3. **Large Result Sets**
   - 1000 click limit in getLinkAnalytics
   - No pagination for exports
   - Memory issues for large exports

### Optimization Recommendations

```typescript
// 1. Add caching layer
@Cacheable({ ttl: 300 }) // 5 minute cache
async getLinkAnalytics(linkId: string, days: number) { ... }

// 2. Use database aggregation
const countsByDevice = await prisma.clickEvent.groupBy({
  by: ['device'],
  where: { linkId, timestamp: { gte: startDate } },
  _count: { id: true },
});

// 3. Streaming export for large datasets
const stream = new Readable();
for await (const batch of getBatchedClicks()) {
  stream.push(formatCsv(batch));
}

// 4. Pre-aggregation cron job
@Cron('0 * * * *') // Every hour
async aggregateHourlyStats() {
  // Roll up ClickEvents into AnalyticsDaily
}
```

### Recommended Indexes

```prisma
model ClickEvent {
  // ...
  @@index([linkId, timestamp]) // Fast range queries
  @@index([linkId, source])    // Fast source filtering
  @@index([timestamp])          // Fast global queries
}
```

---

## Competitor Feature Comparison

| Feature | PingTO.Me | Bitly | Rebrandly | Short.io |
|---------|-----------|-------|-----------|----------|
| Real-time Tracking | Yes | Yes | Yes | Yes |
| Device Breakdown | Yes | Yes | Yes | Yes |
| Browser Breakdown | Backend only | Yes | Yes | Yes |
| OS Breakdown | Backend only | Yes | Yes | Yes |
| Geographic Map | No (list) | Yes | Yes | Yes |
| Custom Date Range | No | Yes | Yes | Yes |
| Export CSV | No | Yes | Yes | Yes |
| Export JSON | No | Yes | Yes | Yes |
| Scheduled Reports | No | Yes (paid) | Yes (paid) | Yes |
| Hour/Day Analysis | No | Yes | Yes | Yes |
| Unique Visitors | No | Yes | Yes | Yes |
| Bot Filtering | No | Yes | Yes | Yes |
| Real-time Dashboard | No | Yes | No | Yes |

---

## Summary

Module 1.7 Link Analytics is approximately 80% complete with a solid foundation. The click tracking infrastructure is well-designed with Cloudflare Workers edge tracking, async event processing, and comprehensive data collection. The main gaps are:

**Critical Issues**:
1. No export functionality despite RBAC permission defined
2. Browser/OS charts missing (data available but no UI)
3. Track endpoint is publicly accessible (security risk)

**Priority Actions**:
1. Implement analytics export (CSV/JSON)
2. Add BrowserChart and OSChart components
3. Secure track endpoint with API key
4. Add referrer capture to redirector
5. Implement custom date range picker

**Enhancement Opportunities**:
1. Geographic map visualization
2. Hour/day analysis heatmaps
3. Bot filtering
4. Unique visitor tracking
5. Analytics caching for performance
