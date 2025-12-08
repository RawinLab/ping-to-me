# Analytics Aggregation: Migration Guide

This guide walks you through deploying the analytics aggregation system to an existing production environment with historical data.

---

## Pre-Migration Checklist

- [ ] Database backup completed
- [ ] Prisma schema changes reviewed
- [ ] Environment variables verified
- [ ] Admin credentials ready for manual triggers
- [ ] Monitoring/alerting configured
- [ ] Maintenance window scheduled (optional, zero-downtime)

---

## Step 1: Database Schema Migration

### 1.1 Generate Migration (Development)

```bash
cd packages/database
npx prisma migrate dev --name add_analytics_daily_table
```

This creates:
- `/packages/database/prisma/migrations/<timestamp>_add_analytics_daily_table/migration.sql`

### 1.2 Review Generated SQL

```sql
-- Migration: add_analytics_daily_table

-- Create AnalyticsDaily table
CREATE TABLE "analytics_daily" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "linkId" UUID NOT NULL,
  "date" DATE NOT NULL,
  "totalClicks" INTEGER NOT NULL DEFAULT 0,
  "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
  "countries" JSONB,
  "devices" JSONB,
  "browsers" JSONB,
  "os" JSONB,
  "referrers" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
ALTER TABLE "analytics_daily"
  ADD CONSTRAINT "analytics_daily_linkId_date_key"
  UNIQUE ("linkId", "date");

-- Create indexes
CREATE INDEX "analytics_daily_linkId_idx" ON "analytics_daily"("linkId");
CREATE INDEX "analytics_daily_date_idx" ON "analytics_daily"("date");

-- Add foreign key
ALTER TABLE "analytics_daily"
  ADD CONSTRAINT "analytics_daily_linkId_fkey"
  FOREIGN KEY ("linkId")
  REFERENCES "Link"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Add index to ClickEvent for faster aggregation
CREATE INDEX "ClickEvent_linkId_timestamp_idx"
  ON "ClickEvent"("linkId", "timestamp");

-- Add relation to Link model (implicit, no SQL needed)
```

### 1.3 Apply Migration (Production)

**Option A: Automatic**
```bash
cd packages/database
npx prisma migrate deploy
```

**Option B: Manual (Recommended for Production)**
```bash
# 1. Export migration SQL
cat prisma/migrations/<timestamp>_add_analytics_daily_table/migration.sql

# 2. Review with DBA
# 3. Apply during maintenance window
psql $DATABASE_URL < migration.sql
```

**Downtime**: None (creates new table, doesn't modify existing)

---

## Step 2: Deploy Application Code

### 2.1 Build & Test

```bash
# Generate Prisma client with new schema
pnpm --filter @pingtome/database db:generate

# Run unit tests
pnpm --filter api test aggregate-analytics.task.spec.ts

# Build API
pnpm --filter api build
```

### 2.2 Deploy to Production

```bash
# Example: Docker deployment
docker build -t pingtome-api:v1.7.19 .
docker push pingtome-api:v1.7.19
kubectl set image deployment/api api=pingtome-api:v1.7.19
```

**Downtime**: None (backward compatible)

---

## Step 3: Historical Data Backfill

### 3.1 Determine Backfill Window

**Options**:

1. **No Backfill** (Simplest)
   - Start fresh from today
   - Historical queries use raw ClickEvent data
   - Gradually improves as days pass

2. **Partial Backfill** (Recommended)
   - Backfill last 90 days
   - Balances performance gain vs. processing time

3. **Full Backfill** (Most complete)
   - Backfill all historical data
   - Takes longer, but complete optimization

### 3.2 Estimate Backfill Time

**Formula**:
```
Backfill Time = (Total Clicks / 10,000) minutes
```

**Examples**:
| Total Clicks | Estimated Time |
|--------------|----------------|
| 100,000 | ~10 minutes |
| 1,000,000 | ~1.7 hours |
| 10,000,000 | ~17 hours |

### 3.3 Execute Backfill

#### Option A: Single API Call (For small datasets)

```bash
# Backfill last 90 days
curl -X POST https://api.yourdomain.com/tasks/aggregate-analytics/backfill \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-09-09",
    "endDate": "2024-12-07"
  }'
```

**Limits**:
- Max 90 days per request
- Best for < 1M total clicks

#### Option B: Batch Processing (For large datasets)

```bash
#!/bin/bash
# backfill-analytics.sh

ADMIN_TOKEN="your-admin-token"
API_URL="https://api.yourdomain.com"

# Backfill Jan 2024 - Dec 2024 in 30-day chunks
for month in {1..12}; do
  START_DATE="2024-$(printf %02d $month)-01"
  END_DATE="2024-$(printf %02d $month)-30"

  echo "Backfilling $START_DATE to $END_DATE..."

  curl -X POST "$API_URL/tasks/aggregate-analytics/backfill" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"startDate\": \"$START_DATE\",
      \"endDate\": \"$END_DATE\"
    }"

  echo "Sleeping 5 minutes before next batch..."
  sleep 300
done

echo "Backfill complete!"
```

Run:
```bash
chmod +x backfill-analytics.sh
./backfill-analytics.sh
```

#### Option C: Database Script (Fastest for very large datasets)

```sql
-- Direct SQL backfill (advanced users only)
DO $$
DECLARE
  link_record RECORD;
  date_record DATE;
BEGIN
  -- Loop through all links
  FOR link_record IN
    SELECT DISTINCT "linkId" FROM "ClickEvent"
  LOOP
    -- Loop through dates
    FOR date_record IN
      SELECT DISTINCT DATE("timestamp") as click_date
      FROM "ClickEvent"
      WHERE "linkId" = link_record."linkId"
        AND "timestamp" >= '2024-01-01'
      ORDER BY click_date
    LOOP
      -- Aggregate and insert
      INSERT INTO "analytics_daily" (
        "linkId", "date", "totalClicks", "uniqueVisitors",
        "countries", "devices", "browsers", "os", "referrers",
        "createdAt", "updatedAt"
      )
      SELECT
        link_record."linkId",
        date_record,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT "sessionId") as unique_visitors,
        jsonb_object_agg(COALESCE("country", 'Unknown'), country_count) as countries,
        jsonb_object_agg(COALESCE("device", 'Unknown'), device_count) as devices,
        jsonb_object_agg(COALESCE("browser", 'Unknown'), browser_count) as browsers,
        jsonb_object_agg(COALESCE("os", 'Unknown'), os_count) as os,
        jsonb_object_agg(COALESCE("referrer", 'Unknown'), referrer_count) as referrers,
        NOW(),
        NOW()
      FROM (
        SELECT
          "country",
          COUNT(*) as country_count,
          "device",
          COUNT(*) as device_count,
          "browser",
          COUNT(*) as browser_count,
          "os",
          COUNT(*) as os_count,
          "referrer",
          COUNT(*) as referrer_count
        FROM "ClickEvent"
        WHERE "linkId" = link_record."linkId"
          AND DATE("timestamp") = date_record
        GROUP BY "country", "device", "browser", "os", "referrer"
      ) aggregated
      ON CONFLICT ("linkId", "date") DO NOTHING;

    END LOOP;
  END LOOP;
END $$;
```

**Warning**: This bypasses application logic. Use only if comfortable with SQL.

---

## Step 4: Verify Backfill

### 4.1 Check Record Count

```sql
-- Count aggregated records
SELECT COUNT(*) as total_records,
       MIN(date) as earliest_date,
       MAX(date) as latest_date
FROM analytics_daily;
```

Expected:
```
 total_records | earliest_date | latest_date
---------------+---------------+-------------
         10000 | 2024-01-01    | 2024-12-07
```

### 4.2 Spot Check a Link

```sql
-- Compare aggregated vs. raw data for a random link
WITH raw_stats AS (
  SELECT
    "linkId",
    DATE("timestamp") as date,
    COUNT(*) as raw_clicks,
    COUNT(DISTINCT "sessionId") as raw_visitors
  FROM "ClickEvent"
  WHERE DATE("timestamp") = '2024-12-01'
  GROUP BY "linkId", DATE("timestamp")
),
aggregated_stats AS (
  SELECT
    "linkId",
    date,
    "totalClicks" as agg_clicks,
    "uniqueVisitors" as agg_visitors
  FROM analytics_daily
  WHERE date = '2024-12-01'
)
SELECT
  r."linkId",
  r.raw_clicks,
  a.agg_clicks,
  r.raw_clicks - a.agg_clicks as click_diff,
  r.raw_visitors,
  a.agg_visitors,
  r.raw_visitors - a.agg_visitors as visitor_diff
FROM raw_stats r
JOIN aggregated_stats a ON r."linkId" = a."linkId" AND r.date = a.date
WHERE r.raw_clicks != a.agg_clicks
LIMIT 10;
```

**Expected**: 0 rows (perfect match)

### 4.3 Test Analytics Endpoint

```bash
# Get 30-day analytics (should use hybrid query)
curl -X GET "https://api.yourdomain.com/analytics/<link-id>?days=30" \
  -H "Authorization: Bearer ${USER_TOKEN}"
```

Check response time:
- **Before**: 2-5 seconds
- **After**: 0.3-1 second

---

## Step 5: Monitor Daily Job

### 5.1 Check Cron Schedule

```bash
# Verify task is registered
curl -X GET "https://api.yourdomain.com/health" \
  | jq '.scheduledTasks'
```

Expected:
```json
{
  "scheduledTasks": [
    {
      "name": "AggregateAnalyticsTask.aggregateYesterday",
      "schedule": "0 2 * * *",
      "status": "active"
    }
  ]
}
```

### 5.2 Monitor First Run

**Next Morning (after 2:00 AM UTC)**:

Check logs:
```bash
kubectl logs -f deployment/api | grep AggregateAnalyticsTask
```

Expected output:
```
[AggregateAnalyticsTask] Running analytics aggregation job...
[AggregateAnalyticsTask] Aggregating analytics for 2024-12-07
[AggregateAnalyticsTask] Found 1234 links with clicks to aggregate
[AggregateAnalyticsTask] Aggregated 50 clicks for link abc123... on 2024-12-07
[AggregateAnalyticsTask] ...
[AggregateAnalyticsTask] Successfully aggregated analytics for 1234 links
```

### 5.3 Verify Daily Records Created

```sql
-- Check yesterday's aggregation
SELECT COUNT(*) as links_aggregated
FROM analytics_daily
WHERE date = CURRENT_DATE - INTERVAL '1 day';
```

Should match number of links with clicks yesterday.

---

## Step 6: Performance Testing

### 6.1 Benchmark Queries

**Test Script**:
```bash
#!/bin/bash
# benchmark-analytics.sh

LINK_ID="your-test-link-id"
USER_TOKEN="your-user-token"
API_URL="https://api.yourdomain.com"

echo "Testing 7-day query (raw data)..."
time curl -X GET "$API_URL/analytics/$LINK_ID?days=7" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -o /dev/null -s

echo "Testing 30-day query (hybrid)..."
time curl -X GET "$API_URL/analytics/$LINK_ID?days=30" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -o /dev/null -s

echo "Testing 90-day query (mostly aggregated)..."
time curl -X GET "$API_URL/analytics/$LINK_ID?days=90" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -o /dev/null -s
```

**Expected Results**:
```
7-day query:   0.5-1.0 sec  (baseline)
30-day query:  0.3-0.8 sec  (70% faster than before)
90-day query:  0.5-1.5 sec  (90% faster than before)
```

### 6.2 Load Testing

Use Apache Bench or Artillery:

```bash
# Test concurrent analytics requests
ab -n 100 -c 10 \
  -H "Authorization: Bearer $USER_TOKEN" \
  "https://api.yourdomain.com/analytics/$LINK_ID?days=30"
```

Monitor:
- Response times
- Database CPU
- Database connections
- Memory usage

---

## Rollback Plan

### If Issues Occur

#### Rollback Step 1: Disable Aggregation Job

```typescript
// Comment out in tasks.module.ts
@Module({
  providers: [
    // AggregateAnalyticsTask, // DISABLED
  ],
})
```

Redeploy.

#### Rollback Step 2: Revert Analytics Service

```typescript
// In analytics.service.ts, force useAggregatedData = false
const useAggregatedData = false; // days > 7; // DISABLED
```

This reverts to raw ClickEvent queries.

#### Rollback Step 3: Drop Table (Optional)

```sql
-- Only if rolling back completely
DROP TABLE analytics_daily;
```

**Note**: Doesn't affect ClickEvent data, so no data loss.

---

## Troubleshooting

### Issue: Aggregation Job Not Running

**Symptom**: No logs at 2 AM UTC

**Check**:
1. Verify ScheduleModule is imported
2. Check server timezone
3. Verify cron expression

**Fix**:
```bash
# Manually trigger to test
curl -X POST https://api.yourdomain.com/tasks/aggregate-analytics/yesterday \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: Aggregated Data Doesn't Match Raw Data

**Symptom**: Discrepancies in analytics counts

**Diagnosis**:
```sql
-- Run comparison query (Step 4.2)
```

**Possible Causes**:
1. Timezone mismatch
2. Clicks still coming in during aggregation
3. Bot filtering differences

**Fix**:
- Ensure UTC timestamps
- Aggregation uses date ranges with time boundaries
- Re-run aggregation for affected dates

### Issue: Slow Backfill

**Symptom**: Backfill taking too long

**Optimization**:
1. Batch by month instead of 90 days
2. Run during off-peak hours
3. Increase database resources temporarily
4. Use direct SQL script (Option C)

### Issue: High Memory Usage

**Symptom**: API server OOM during aggregation

**Diagnosis**:
- Check link with most clicks
- Monitor memory during aggregation

**Fix**:
```typescript
// In aggregate-analytics.task.ts
// Add pagination for extremely large datasets
const clicks = await this.prisma.clickEvent.findMany({
  where: { linkId, timestamp: { gte: startOfDay, lte: endOfDay } },
  take: 100000, // Limit batch size
});
```

---

## Post-Migration

### Week 1
- [ ] Monitor daily job execution
- [ ] Verify daily records created
- [ ] Check query performance metrics
- [ ] Monitor database CPU/memory

### Week 2
- [ ] Compare analytics accuracy with previous system
- [ ] Gather user feedback on performance
- [ ] Review error logs

### Week 4
- [ ] Evaluate storage growth
- [ ] Consider data retention policy
- [ ] Plan for future optimizations (weekly/monthly aggregation)

---

## Success Metrics

After successful migration:

✅ **Performance**:
- 30-day queries: 70-85% faster
- 90-day queries: 90-95% faster
- No timeout errors

✅ **Reliability**:
- Daily job runs without errors
- Data accuracy 100%
- No user-reported issues

✅ **Efficiency**:
- Database CPU reduced by 60-70%
- Query costs reduced by 60-75%
- Sub-second analytics loading

---

## Support

For issues during migration:

1. Check logs: `/var/log/pingtome/api.log`
2. Review troubleshooting section
3. Test manually: `POST /tasks/aggregate-analytics/yesterday`
4. Rollback if critical

---

**Migration Complete!** 🎉

Your analytics system is now optimized for high performance and scalability.
