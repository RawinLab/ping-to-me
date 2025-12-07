# Module 1.7: Link Analytics - Development Todolist

> **Status**: ~80% Complete
> **Priority**: High - Security issue (track endpoint is PUBLIC)
> **Reference**: `requirements/1-7-link-analytics-plan.md`

---

## Phase 1: Critical Features (P0)

### Task 1.7.1: Analytics Export Endpoint
- [ ] **Create ExportFiltersDto**
  - File: `apps/api/src/analytics/dto/export-filters.dto.ts`
  - Fields: startDate, endDate, format ('csv'|'json'), limit (max 10000)

- [ ] **Implement exportLinkAnalytics method**
  - File: `apps/api/src/analytics/analytics.service.ts`
  - Query ClickEvents with date filter
  - Format as CSV or JSON
  - Set response headers for download

- [ ] **Add GET /links/:id/analytics/export endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`
  - Add: `@Permission({ resource: 'analytics', action: 'export' })`
  - Stream response for large exports

- [ ] **Update export button in frontend**
  - File: `apps/web/app/links/[id]/analytics/page.tsx`
  - Remove "coming soon" state
  - Trigger actual download

### Task 1.7.2: Browser Chart Component
- [ ] **Create BrowserChart component**
  - File: `apps/web/components/dashboard/BrowserChart.tsx`
  - Donut/pie chart similar to DevicesChart
  - Colors: Chrome (blue), Safari (gray), Firefox (orange), Edge (green)
  - Legend with percentages
  - Handle >5 browsers with "Other"

- [ ] **Add BrowserChart to link analytics page**
  - After DevicesChart section

### Task 1.7.3: OS Chart Component
- [ ] **Create OSChart component**
  - File: `apps/web/components/dashboard/OSChart.tsx`
  - Same pattern as BrowserChart
  - Colors: Windows (blue), macOS (gray), iOS (black), Android (green), Linux (orange)

- [ ] **Add OSChart to link analytics page**
  - After BrowserChart section

### Task 1.7.4: Secure Track Endpoint
- [ ] **Add API key validation to track endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`
  - Require `X-Api-Key` header
  - Validate against `ANALYTICS_API_KEY` env var
  - Reject without valid key (403 Forbidden)

- [ ] **Update redirector to send API key**
  - File: `apps/redirector/src/index.ts`
  - Add `X-Api-Key` header to track request
  - Add `ANALYTICS_API_KEY` to wrangler.toml vars

- [ ] **Add rate limiting**
  - `@Throttle({ limit: 100, ttl: 60000 })` - 100/min

### Task 1.7.5: Capture Referrer in Redirector
- [ ] **Add referrer to track payload**
  - File: `apps/redirector/src/index.ts`
  - Add: `referrer: c.req.header("referer") || "direct"`

- [ ] **Update TrackClickDto to include referrer**
  - File: `apps/api/src/analytics/dto/track-click.dto.ts`

- [ ] **Store referrer in ClickEvent**
  - Field already exists in schema

---

## Phase 2: Enhanced UI

### Task 1.7.6: Custom Date Range Picker
- [ ] **Create DateRangePicker component**
  - File: `apps/web/components/dashboard/DateRangePicker.tsx`
  - Quick presets: Today, 7d, 30d, 90d, 1y
  - "Custom" opens dual calendar picker
  - Date validation (end >= start)
  - Apply/Cancel buttons

- [ ] **Update analytics pages to support custom dates**
  - Pass custom start/end to API
  - Update URL params for sharing

### Task 1.7.7: Geographic Map Component
- [ ] **Create GeographicMap component**
  - File: `apps/web/components/dashboard/GeographicMap.tsx`
  - Use echarts or react-leaflet
  - Color countries by click count
  - Tooltips on hover (country + count)
  - Zoom/pan controls

- [ ] **Replace LocationsChart with map**
  - Keep list view as alternative
  - Toggle between map/list

### Task 1.7.8: Dashboard Export
- [ ] **Create exportDashboard method**
  - File: `apps/api/src/analytics/analytics.service.ts`
  - Aggregate all user's links analytics
  - Format as CSV/JSON

- [ ] **Add GET /analytics/export endpoint**
  - File: `apps/api/src/analytics/analytics.controller.ts`

- [ ] **Add export button to dashboard**
  - File: `apps/web/app/dashboard/analytics/page.tsx`

### Task 1.7.9: Bot Filtering
- [ ] **Create isBot helper function**
  - File: `apps/api/src/analytics/utils/bot-filter.ts`
  - Patterns: googlebot, bingbot, slurp, duckduckbot, facebookexternalhit, curl, wget, etc.

- [ ] **Filter bots in trackClick**
  - If isBot(userAgent), skip recording
  - Or mark as bot click for separate counting

### Task 1.7.10: Period Comparison
- [ ] **Add compareToPrevious to analytics response**
  - Calculate same metrics for previous period
  - Return percentage change

- [ ] **Show % change in stats cards**
  - Green arrow up / red arrow down
  - +15% or -10% indicator

---

## Phase 3: Advanced Analytics

### Task 1.7.11: Hour-of-Day Heatmap
- [ ] **Add hourly aggregation to backend**
  - Group clicks by hour (0-23) and day (0-6)
  - Return 7x24 grid data

- [ ] **Create HourlyHeatmap component**
  - File: `apps/web/components/dashboard/HourlyHeatmap.tsx`
  - Grid visualization (rows=days, cols=hours)
  - Color intensity = click count
  - Tooltips: "Monday 2PM: 45 clicks"

### Task 1.7.12: Day-of-Week Analysis
- [ ] **Add day-of-week aggregation**
  - Group clicks by weekday

- [ ] **Create bar chart for day breakdown**
  - Mon-Sun bars
  - Show highest/lowest day

### Task 1.7.13: City Geolocation (Optional)
- [ ] MaxMind GeoIP database integration
- [ ] Populate city field in ClickEvent
- [ ] City filter in analytics

### Task 1.7.14: Unique Visitors
- [ ] Session tracking (hash of IP + UA + day)
- [ ] Deduplicate clicks per session
- [ ] Show unique vs total clicks

### Task 1.7.15: Analytics Caching
- [ ] Redis/in-memory cache for analytics queries
- [ ] 5-minute TTL for dashboard stats
- [ ] Invalidate on new clicks

---

## Phase 4: Future Enhancements

### Task 1.7.16: Scheduled Reports
- [ ] Email queue integration
- [ ] Report settings UI
- [ ] Daily/weekly/monthly options

### Task 1.7.17: PDF Reports
- [ ] pdfkit generation
- [ ] Download PDF button

### Task 1.7.18: Real-time Dashboard
- [ ] WebSocket for live updates
- [ ] Live click counter

### Task 1.7.19: Batch Aggregation Job
- [ ] Cron job to roll up ClickEvents
- [ ] Create AnalyticsDaily records
- [ ] Query aggregated data for speed

### Task 1.7.20: Click Deduplication
- [ ] Fingerprinting or cookie-based
- [ ] Unique visitor tracking

---

## Unit Tests Required

### Analytics Export Tests
```
File: apps/api/src/analytics/__tests__/analytics.service.spec.ts
```
- [ ] exportLinkAnalytics: generate CSV with all columns
- [ ] exportLinkAnalytics: generate JSON export
- [ ] exportLinkAnalytics: filter by date range
- [ ] exportLinkAnalytics: respect limit parameter
- [ ] exportLinkAnalytics: reject if user lacks export permission

### Bot Filtering Tests
- [ ] isBot: filter Googlebot clicks
- [ ] isBot: filter curl/wget requests
- [ ] isBot: allow legitimate user clicks

### Track Endpoint Security Tests
- [ ] track: reject request without API key
- [ ] track: reject request with invalid API key
- [ ] track: accept request with valid API key
- [ ] track: respect rate limits

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

### Phase 1 Complete When:
- [ ] Export endpoint downloads CSV/JSON
- [ ] BrowserChart renders with data
- [ ] OSChart renders with data
- [ ] Track endpoint requires valid API key
- [ ] Referrer captured and displayed
- [ ] Unit tests pass

### Phase 2 Complete When:
- [ ] Custom date range works
- [ ] Geographic map renders countries
- [ ] Dashboard export works
- [ ] Bots filtered from counts
- [ ] Period comparison shows % change
- [ ] E2E tests pass

### Phase 3 Complete When:
- [ ] Hourly heatmap displays
- [ ] Day-of-week chart shows
- [ ] Analytics cached for performance

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

- **CRITICAL**: POST /analytics/track is currently PUBLIC - anyone can inject fake clicks
- Add API key validation immediately
- Rate limit track endpoint to prevent abuse
- Filter bot traffic to prevent inflated counts

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
