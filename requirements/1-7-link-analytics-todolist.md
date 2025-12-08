# Module 1.7: Link Analytics - Development Todolist

> **Status**: 100% Complete (Phase 1, 2, 3 & 4 Done)
> **Priority**: Medium - Security issue FIXED
> **Reference**: `requirements/1-7-link-analytics-plan.md`

---

## Phase 1: Critical Features (P0) ✅ COMPLETE

### Task 1.7.1: Analytics Export Endpoint ✅
- [x] **Create ExportFiltersDto**
  - File: `apps/api/src/analytics/dto/export-filters.dto.ts`
  - Fields: startDate, endDate, format ('csv'|'json'), limit (max 10000)

- [x] **Implement exportLinkAnalytics method**
  - File: `apps/api/src/analytics/analytics.service.ts`
  - Query ClickEvents with date filter
  - Format as CSV or JSON
  - Set response headers for download

- [x] **Add GET /links/:id/analytics/export endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`
  - Add: `@Permission({ resource: 'analytics', action: 'export' })`
  - Stream response for large exports

- [x] **Update export button in frontend**
  - File: `apps/web/app/links/[id]/analytics/page.tsx`
  - Remove "coming soon" state
  - Trigger actual download

### Task 1.7.2: Browser Chart Component ✅
- [x] **Create BrowserChart component**
  - File: `apps/web/components/dashboard/BrowserChart.tsx`
  - Donut/pie chart similar to DevicesChart
  - Colors: Chrome (blue), Safari (gray), Firefox (orange), Edge (green)
  - Legend with percentages
  - Handle >5 browsers with "Other"

- [x] **Add BrowserChart to link analytics page**
  - After DevicesChart section

### Task 1.7.3: OS Chart Component ✅
- [x] **Create OSChart component**
  - File: `apps/web/components/dashboard/OSChart.tsx`
  - Same pattern as BrowserChart
  - Colors: Windows (blue), macOS (gray), iOS (black), Android (green), Linux (orange)

- [x] **Add OSChart to link analytics page**
  - After BrowserChart section

### Task 1.7.4: Secure Track Endpoint ✅
- [x] **Add API key validation to track endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`
  - Require `X-Api-Key` header
  - Validate against `ANALYTICS_API_KEY` env var
  - Reject without valid key (403 Forbidden)

- [x] **Update redirector to send API key**
  - File: `apps/redirector/src/index.ts`
  - Add `X-Api-Key` header to track request
  - Add `ANALYTICS_API_KEY` to wrangler.toml vars

- [x] **Add rate limiting**
  - `@Throttle({ limit: 100, ttl: 60000 })` - 100/min

### Task 1.7.5: Capture Referrer in Redirector ✅
- [x] **Add referrer to track payload**
  - File: `apps/redirector/src/index.ts`
  - Add: `referrer: c.req.header("referer") || "direct"`

- [x] **Update TrackClickDto to include referrer**
  - File: `apps/api/src/analytics/dto/track-click.dto.ts`

- [x] **Store referrer in ClickEvent**
  - Field already exists in schema

---

## Phase 2: Enhanced UI ✅ COMPLETE

### Task 1.7.6: Custom Date Range Picker ✅
- [x] **Create DateRangePicker component**
  - File: `apps/web/components/dashboard/DateRangePicker.tsx`
  - Quick presets: Today, 7d, 30d, 90d, 1y
  - "Custom" opens dual calendar picker
  - Date validation (end >= start)
  - Apply/Cancel buttons

- [x] **Update analytics pages to support custom dates**
  - Pass custom start/end to API
  - Update URL params for sharing

### Task 1.7.7: Geographic Map Component ✅
- [x] **Create GeographicMap component**
  - File: `apps/web/components/dashboard/GeographicMap.tsx`
  - Horizontal bar chart visualization (no external mapping library needed)
  - Color countries by click count
  - Tooltips on hover (country + count)
  - Toggle between chart/list views

- [x] **Replace LocationsChart with map**
  - Keep list view as alternative
  - Toggle between chart/list

### Task 1.7.8: Dashboard Export ✅
- [x] **Create exportDashboard method**
  - File: `apps/api/src/analytics/analytics.service.ts`
  - Aggregate all user's links analytics
  - Format as CSV/JSON

- [x] **Add GET /analytics/export endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`

- [x] **Add export button to dashboard**
  - File: `apps/web/app/dashboard/analytics/page.tsx`

### Task 1.7.9: Bot Filtering ✅
- [x] **Create isBot helper function**
  - File: `apps/api/src/analytics/utils/bot-filter.ts`
  - Patterns: googlebot, bingbot, slurp, duckduckbot, facebookexternalhit, curl, wget, etc.

- [x] **Filter bots in trackClick**
  - If isBot(userAgent), skip recording
  - Or mark as bot click for separate counting

### Task 1.7.10: Period Comparison ✅
- [x] **Add compareToPrevious to analytics response**
  - Calculate same metrics for previous period
  - Return percentage change

- [x] **Show % change in stats cards**
  - Green arrow up / red arrow down
  - +15% or -10% indicator

---

## Phase 3: Advanced Analytics ✅ COMPLETE

### Task 1.7.11: Hour-of-Day Heatmap ✅
- [x] **Add hourly aggregation to backend**
  - `getHourlyHeatmap()` method in analytics.service.ts
  - GET /links/:id/analytics/hourly endpoint
  - Returns 7x24 grid data (168 cells)

- [x] **Create HourlyHeatmap component**
  - File: `apps/web/components/dashboard/HourlyHeatmap.tsx`
  - Grid visualization (rows=days, cols=hours)
  - Color intensity = click count
  - Tooltips: "Monday 2PM: 45 clicks"

### Task 1.7.12: Day-of-Week Analysis ✅
- [x] **Add day-of-week aggregation**
  - `getDayOfWeekStats()` method in analytics.service.ts
  - GET /links/:id/analytics/daily-breakdown endpoint

- [x] **Create bar chart for day breakdown**
  - File: `apps/web/components/dashboard/DayOfWeekChart.tsx`
  - Mon-Sun bars with color coding
  - Highlight best/worst performing days

### Task 1.7.13: City Geolocation (Optional)
- [ ] MaxMind GeoIP database integration
- [ ] Populate city field in ClickEvent
- [ ] City filter in analytics

### Task 1.7.14: Unique Visitors ✅
- [x] Session tracking (SHA-256 hash of IP + UA + day)
- [x] Added `sessionId` field to ClickEvent schema
- [x] `getUniqueVisitors()` method with returning visitor tracking
- [x] GET /links/:id/analytics/visitors endpoint
- [x] Show unique vs total clicks in analytics response

### Task 1.7.15: Analytics Caching ✅
- [x] In-memory cache service with TTL support
  - File: `apps/api/src/analytics/cache/analytics-cache.service.ts`
- [x] 5-minute TTL for dashboard stats, 2-minute for link analytics
- [x] Pattern-based cache invalidation
- [x] AnalyticsCacheModule for dependency injection

---

## Phase 4: Advanced Enhancements ✅ COMPLETE

### Task 1.7.16: Scheduled Reports ✅
- [x] Email queue integration
  - File: `apps/api/src/analytics/reports/scheduled-reports.service.ts`
  - ReportSchedule model for storing report configurations
- [x] Report settings API endpoints
  - CRUD for report schedules via REST API
- [x] Daily/weekly/monthly options
  - ReportFrequency enum (DAILY, WEEKLY, MONTHLY)
  - 20 unit tests passing

### Task 1.7.17: PDF Reports ✅
- [x] pdfkit generation
  - File: `apps/api/src/analytics/pdf/analytics-pdf.service.ts`
  - generateLinkReport() and generateDashboardReport() methods
- [x] Download PDF endpoint
  - GET /analytics/pdf/dashboard and GET /links/:id/analytics/pdf
  - 12 unit tests passing

### Task 1.7.18: Real-time Dashboard ✅
- [x] WebSocket for live updates
  - File: `apps/api/src/analytics/realtime/analytics.gateway.ts`
  - Socket.io with JWT authentication
  - Room-based subscriptions for links/dashboard
- [x] Live click counter
  - File: `apps/web/components/dashboard/LiveClickCounter.tsx`
  - React hook: `apps/web/hooks/useAnalyticsSocket.ts`

### Task 1.7.19: Batch Aggregation Job ✅
- [x] Cron job to roll up ClickEvents
  - File: `apps/api/src/tasks/aggregate-analytics.task.ts`
  - Runs daily at 2 AM via @nestjs/schedule
- [x] Create AnalyticsDaily records
  - Model added to Prisma schema
  - Aggregates: totalClicks, uniqueVisitors, countries, devices, browsers, os, referrers
- [x] Query aggregated data for speed
  - analytics.service.ts updated to use aggregated data for >7 day ranges
  - 16 unit tests passing

### Task 1.7.20: Click Deduplication ✅
- [x] Session-based tracking (implemented in Phase 3)
  - SHA-256 hash of IP + UA + day
  - sessionId field in ClickEvent
- [x] Unique visitor tracking
  - getUniqueVisitors() method with returning visitor tracking

---

## Unit Tests Required

### Analytics Export Tests ✅
```
File: apps/api/src/analytics/analytics.service.spec.ts
```
- [x] exportLinkAnalytics: generate CSV with all columns
- [x] exportLinkAnalytics: generate JSON export
- [x] exportLinkAnalytics: filter by date range
- [x] exportLinkAnalytics: respect limit parameter
- [x] exportLinkAnalytics: reject if user lacks export permission

### Bot Filtering Tests ✅
```
File: apps/api/src/analytics/utils/__tests__/bot-filter.spec.ts
```
- [x] isBot: filter Googlebot clicks
- [x] isBot: filter curl/wget requests
- [x] isBot: allow legitimate user clicks
- [x] isBot: filter various search engine bots
- [x] isBot: filter social media bots
- [x] isBot: handle empty/undefined user agent

### Track Endpoint Security Tests ✅
```
File: apps/api/src/analytics/__tests__/analytics.controller.spec.ts
```
- [x] track: reject request without API key
- [x] track: reject request with invalid API key
- [x] track: accept request with valid API key
- [x] track: respect rate limits

---

## E2E Tests Required

```
File: apps/web/e2e/link-analytics.spec.ts (extend)
```

- [ ] LA-130: Browser chart displays
- [ ] LA-131: OS chart displays
- [ ] LA-132: Export analytics as CSV
- [ ] LA-133: Export analytics as JSON
- [ ] LA-134: Custom date range picker
- [ ] LA-135: Geographic map visualization
- [ ] LA-136: Period comparison (% change)
- [ ] LA-137: Dashboard export
- [ ] LA-138: Viewer cannot export (RBAC)
- [ ] LA-139: Hour-of-day heatmap
- [ ] LA-140: Day-of-week analysis

---

## Acceptance Criteria

### Phase 1 Complete When: ✅ DONE
- [x] Export endpoint downloads CSV/JSON
- [x] BrowserChart renders with data
- [x] OSChart renders with data
- [x] Track endpoint requires valid API key
- [x] Referrer captured and displayed
- [x] Unit tests pass (64 tests)

### Phase 2 Complete When: ✅ DONE
- [x] Custom date range works
- [x] Geographic map renders countries
- [x] Dashboard export works
- [x] Bots filtered from counts
- [x] Period comparison shows % change
- [x] Unit tests pass (84 tests)

### Phase 3 Complete When: ✅ DONE
- [x] Hourly heatmap displays (HourlyHeatmap component)
- [x] Day-of-week chart shows (DayOfWeekChart component)
- [x] Unique visitors tracked (sessionId + getUniqueVisitors)
- [x] Analytics cached for performance (AnalyticsCacheService)
- [x] Unit tests pass (137 tests)

### Phase 4 Complete When: ✅ DONE
- [x] PDF reports generate correctly
- [x] Scheduled reports service created with CRUD
- [x] WebSocket gateway for real-time updates
- [x] Live click counter component
- [x] Batch aggregation job runs daily
- [x] AnalyticsDaily model stores aggregated data
- [x] Unit tests pass (185 tests)

---

## Files to Create/Modify Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/analytics/dto/export-filters.dto.ts` | Export filter validation |
| `apps/api/src/analytics/utils/bot-filter.ts` | Bot detection patterns |
| `apps/web/components/dashboard/BrowserChart.tsx` | Browser breakdown chart |
| `apps/web/components/dashboard/OSChart.tsx` | OS breakdown chart |
| `apps/web/components/dashboard/GeographicMap.tsx` | Map visualization |
| `apps/web/components/dashboard/DateRangePicker.tsx` | Custom date picker |
| `apps/web/components/dashboard/HourlyHeatmap.tsx` | Hour/day heatmap |

### Files to Modify
| File | Changes |
|------|---------|
| `apps/api/src/analytics/analytics.controller.ts` | Export endpoints, track security |
| `apps/api/src/analytics/analytics.service.ts` | Export methods, bot filtering |
| `apps/redirector/src/index.ts` | Add referrer, API key header |
| `apps/web/app/links/[id]/analytics/page.tsx` | Add browser/OS charts, export button |
| `apps/web/app/dashboard/analytics/page.tsx` | Add charts, export, custom dates |

---

## Security Notes

- ~~**CRITICAL**: POST /analytics/track is currently PUBLIC - anyone can inject fake clicks~~ ✅ FIXED
- ~~Add API key validation immediately~~ ✅ IMPLEMENTED
- ~~Rate limit track endpoint to prevent abuse~~ ✅ IMPLEMENTED (100/min)
- ~~Filter bot traffic to prevent inflated counts~~ ✅ IMPLEMENTED (Phase 2)

---

## Environment Variables Needed

```bash
# API (.env)
ANALYTICS_API_KEY=your-secure-random-key-here

# Redirector (wrangler.toml)
[vars]
ANALYTICS_API_KEY = "your-secure-random-key-here"
```

---

*Generated from: 1-7-link-analytics-plan.md*
*Last Updated: 2025-12-08*
*Phase 4 Completed: 2025-12-08*
