# Scheduled Tasks

This module contains scheduled background tasks that run periodically to maintain system health and optimize performance.

## Tasks

### 1. Expire Links Task

**File**: `expire-links.task.ts`

**Schedule**: Every hour (`@Cron(CronExpression.EVERY_HOUR)`)

**Purpose**: Automatically expires links that have passed their expiration date.

**Features**:
- Finds all active links with expired dates
- Updates their status to `EXPIRED`
- Syncs status to Cloudflare KV for edge redirector

---

### 2. Analytics Aggregation Task

**File**: `aggregate-analytics.task.ts`

**Schedule**: Daily at 2 AM UTC (`@Cron('0 2 * * *')`)

**Purpose**: Aggregates yesterday's click events into daily summaries for improved analytics query performance.

#### Why Aggregation?

For high-traffic links, querying raw `ClickEvent` records for historical analytics can become slow. This task pre-aggregates data into the `AnalyticsDaily` table, enabling:

- **Faster queries** for time ranges > 7 days
- **Reduced database load** by reading aggregated summaries instead of millions of individual click events
- **Efficient storage** by compressing daily statistics into JSON fields

#### How It Works

1. **Daily Aggregation** (Automatic at 2 AM UTC):
   - Processes all clicks from yesterday
   - Groups by `linkId` and calculates:
     - Total clicks
     - Unique visitors (distinct `sessionId`)
     - Breakdown by country, device, browser, OS, referrer
   - Stores results in `AnalyticsDaily` table

2. **Hybrid Query Strategy** (in `AnalyticsService`):
   - **Short time ranges (≤7 days)**: Uses raw `ClickEvent` data for real-time accuracy
   - **Long time ranges (>7 days)**:
     - Uses `AnalyticsDaily` for historical data (older than 7 days)
     - Uses `ClickEvent` for recent data (last 7 days)
     - Merges both for complete analytics

3. **Backfill Support**:
   - Can retroactively aggregate historical data
   - Useful for initial setup or fixing missing aggregations

#### Database Schema

```prisma
model AnalyticsDaily {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  linkId         String   @db.Uuid
  date           DateTime @db.Date
  totalClicks    Int      @default(0)
  uniqueVisitors Int      @default(0)
  countries      Json?    // { "US": 50, "UK": 30 }
  devices        Json?    // { "Desktop": 60, "Mobile": 40 }
  browsers       Json?    // { "Chrome": 70, "Safari": 20 }
  os             Json?    // { "Windows": 50, "macOS": 30 }
  referrers      Json?    // { "google.com": 40, "direct": 30 }
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  link           Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)

  @@unique([linkId, date])
  @@index([linkId])
  @@index([date])
}
```

#### Manual Triggers (Admin Only)

**Base URL**: `/tasks/aggregate-analytics`

##### 1. Aggregate Yesterday

```bash
POST /tasks/aggregate-analytics/yesterday
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics aggregation for yesterday completed"
}
```

##### 2. Aggregate Specific Link & Date

```bash
POST /tasks/aggregate-analytics/link
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "linkId": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-01-15"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics aggregated for link 123e4567-e89b-12d3-a456-426614174000 on 2024-01-15"
}
```

##### 3. Backfill Date Range

```bash
POST /tasks/aggregate-analytics/backfill
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics backfilled from 2024-01-01 to 2024-01-31 (31 days)"
}
```

**Note**: Maximum 90 days per backfill request to prevent system overload.

#### Performance Considerations

1. **Memory Usage**: Aggregation processes all clicks for a link on a given day in memory. For extremely high-traffic links (>1M clicks/day), consider pagination.

2. **Database Load**: Runs at 2 AM UTC to avoid peak traffic hours.

3. **Idempotency**: Uses `upsert` operation, so running aggregation multiple times for the same date is safe and will update the record.

4. **Index Optimization**: The `ClickEvent` table has a compound index on `[linkId, timestamp]` to speed up aggregation queries.

#### Testing

Run unit tests:

```bash
pnpm --filter api test aggregate-analytics.task.spec.ts
```

**Test Coverage**:
- ✅ Daily aggregation workflow
- ✅ Field aggregation logic (countries, devices, etc.)
- ✅ Unique visitor counting
- ✅ Handling of null/unknown values
- ✅ Backfill functionality
- ✅ Error handling
- ✅ Idempotent upsert behavior

#### Monitoring

The task logs important events:

- **INFO**: Daily aggregation start/completion with link count
- **DEBUG**: Individual link aggregation details
- **ERROR**: Database errors or processing failures

Monitor logs for:
- Abnormal processing times
- Frequent errors
- Missing aggregations (no data for yesterday)

#### Future Enhancements

- [ ] Weekly/Monthly aggregation tables for even faster long-term analytics
- [ ] Automatic cleanup of old `ClickEvent` data after aggregation (data retention)
- [ ] Partitioning strategy for `AnalyticsDaily` table by date
- [ ] Real-time incremental aggregation (update as clicks come in)
- [ ] Compression of JSON fields for high-cardinality data

---

## Adding New Tasks

To add a new scheduled task:

1. Create task file: `src/tasks/my-task.task.ts`
2. Use `@Injectable()` decorator
3. Add `@Cron()` decorator to method(s)
4. Register in `TasksModule` providers
5. Add tests in `src/tasks/__tests__/my-task.task.spec.ts`
6. Document in this README

### Example Task Template

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MyTask {
  private readonly logger = new Logger(MyTask.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runTask(): Promise<void> {
    this.logger.log('Running my task...');

    try {
      // Task logic here
      this.logger.log('Task completed successfully');
    } catch (error) {
      this.logger.error('Error running task:', error);
    }
  }
}
```

---

## Cron Expressions Reference

```javascript
// Every minute
@Cron('* * * * *')

// Every hour
@Cron(CronExpression.EVERY_HOUR) // '0 * * * *'

// Every day at midnight
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // '0 0 * * *'

// Every day at 2 AM
@Cron('0 2 * * *')

// Every Monday at 9 AM
@Cron('0 9 * * 1')

// First day of every month at midnight
@Cron('0 0 1 * *')
```

Format: `second minute hour dayOfMonth month dayOfWeek`

See [@nestjs/schedule documentation](https://docs.nestjs.com/techniques/task-scheduling) for more details.
