# Scheduled Reports Module

## Overview

The Scheduled Reports module allows users to set up automated analytics reports that are sent via email at regular intervals (daily, weekly, or monthly). Reports can be configured for individual links or for the entire dashboard.

## Features

- **Multiple Frequencies**: Daily, weekly, or monthly reports
- **Flexible Scheduling**: Customize time, day of week (for weekly), or day of month (for monthly)
- **Format Options**: CSV or PDF reports
- **Multiple Recipients**: Send reports to additional email addresses
- **Link-Specific or Dashboard**: Create reports for individual links or entire dashboard
- **Timezone Support**: Configure reports to run in specific timezones
- **Enable/Disable**: Toggle reports on/off without deleting them

## Database Schema

### ReportSchedule Model

```prisma
model ReportSchedule {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String          @db.Uuid
  organizationId String?         @db.Uuid
  linkId         String?         @db.Uuid  // null = dashboard report
  frequency      ReportFrequency
  dayOfWeek      Int?            // 0-6 for weekly (0=Sunday)
  dayOfMonth     Int?            // 1-31 for monthly
  time           String          @default("09:00")  // HH:mm format
  timezone       String          @default("UTC")
  format         String          @default("pdf")  // 'pdf' or 'csv'
  recipients     String[]        // Additional email addresses
  enabled        Boolean         @default(true)
  lastSentAt     DateTime?
  nextRunAt      DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization?   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  link           Link?           @relation(fields: [linkId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([nextRunAt])
  @@index([enabled])
}

enum ReportFrequency {
  DAILY
  WEEKLY
  MONTHLY
}
```

## API Endpoints

### Create Schedule

```
POST /analytics/reports/schedules
```

**Request Body:**

```json
{
  "linkId": "uuid-optional",
  "frequency": "DAILY" | "WEEKLY" | "MONTHLY",
  "dayOfWeek": 0-6,  // Required for WEEKLY
  "dayOfMonth": 1-31,  // Required for MONTHLY
  "time": "09:00",  // HH:mm format
  "timezone": "UTC",
  "format": "pdf" | "csv",
  "recipients": ["email1@example.com", "email2@example.com"]
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "linkId": "uuid-or-null",
  "frequency": "DAILY",
  "time": "09:00",
  "timezone": "UTC",
  "format": "pdf",
  "recipients": ["email@example.com"],
  "enabled": true,
  "nextRunAt": "2025-12-09T09:00:00.000Z",
  "createdAt": "2025-12-08T10:00:00.000Z",
  "updatedAt": "2025-12-08T10:00:00.000Z"
}
```

### List Schedules

```
GET /analytics/reports/schedules
```

**Response:**

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "linkId": "uuid-or-null",
    "frequency": "DAILY",
    "time": "09:00",
    "enabled": true,
    "link": {
      "slug": "my-link",
      "title": "My Link"
    }
  }
]
```

### Get Schedule

```
GET /analytics/reports/schedules/:id
```

### Update Schedule

```
PATCH /analytics/reports/schedules/:id
```

**Request Body:** (all fields optional)

```json
{
  "frequency": "WEEKLY",
  "dayOfWeek": 1,
  "time": "10:00",
  "timezone": "America/New_York",
  "format": "csv",
  "recipients": ["new@example.com"],
  "enabled": false
}
```

### Delete Schedule

```
DELETE /analytics/reports/schedules/:id
```

## Cron Job

The `SendScheduledReportsTask` runs every hour (`@Cron('0 * * * *')`) and:

1. Queries all enabled schedules where `nextRunAt <= now`
2. For each due schedule:
   - Generates the report (link-specific or dashboard)
   - Sends email with report attachment
   - Updates `lastSentAt` and calculates new `nextRunAt`

## Service Methods

### ScheduledReportsService

- `createSchedule(userId, dto)` - Create new report schedule
- `updateSchedule(id, userId, dto)` - Update existing schedule
- `deleteSchedule(id, userId)` - Delete schedule
- `getSchedules(userId)` - Get all schedules for user
- `getSchedule(id, userId)` - Get single schedule
- `getDueSchedules()` - Get schedules due to run (called by cron)
- `markScheduleAsSent(scheduleId)` - Update after sending

### Private Methods

- `calculateNextRunAt(frequency, time, timezone, dayOfWeek?, dayOfMonth?)` - Calculate next run date based on frequency

## Email Template

Reports are sent via `MailService.sendScheduledReport()` with:

- Professional HTML email template
- Report details (type, frequency, format)
- Report attached as CSV or PDF
- Link to manage schedules in dashboard

## Examples

### Daily Report at 9 AM UTC

```typescript
await scheduledReportsService.createSchedule(userId, {
  frequency: ReportFrequency.DAILY,
  time: '09:00',
  timezone: 'UTC',
  format: 'pdf',
});
```

### Weekly Report on Mondays

```typescript
await scheduledReportsService.createSchedule(userId, {
  frequency: ReportFrequency.WEEKLY,
  dayOfWeek: 1, // Monday
  time: '08:00',
  timezone: 'America/New_York',
  format: 'csv',
});
```

### Monthly Report on 1st of Month

```typescript
await scheduledReportsService.createSchedule(userId, {
  frequency: ReportFrequency.MONTHLY,
  dayOfMonth: 1,
  time: '00:00',
  timezone: 'UTC',
  format: 'pdf',
  recipients: ['team@example.com'],
});
```

### Link-Specific Report

```typescript
await scheduledReportsService.createSchedule(userId, {
  linkId: 'link-uuid',
  frequency: ReportFrequency.WEEKLY,
  dayOfWeek: 5, // Friday
  time: '17:00',
  format: 'csv',
});
```

## Testing

Run tests:

```bash
pnpm --filter api test scheduled-reports.service.spec.ts
```

Test coverage includes:
- Creating schedules (daily, weekly, monthly)
- Updating schedules
- Deleting schedules
- Getting schedules
- Link ownership verification
- Next run calculation
- Due schedule detection
- Marking schedules as sent

## File Structure

```
apps/api/src/analytics/reports/
├── __tests__/
│   └── scheduled-reports.service.spec.ts
├── dto/
│   ├── create-report-schedule.dto.ts
│   ├── update-report-schedule.dto.ts
│   └── index.ts
├── scheduled-reports.controller.ts
├── scheduled-reports.service.ts
├── index.ts
└── README.md

apps/api/src/tasks/
└── send-scheduled-reports.task.ts
```

## Integration

The module integrates with:

- **AnalyticsService** - For generating reports (exportLinkAnalytics, exportDashboard)
- **MailService** - For sending email with attachments
- **PrismaService** - For database operations
- **TasksModule** - For cron job scheduling

## Next Steps

### Frontend Integration

Create UI components:

1. **ReportScheduleModal.tsx** - Form to create/edit schedules
2. **ReportScheduleList.tsx** - Display user's schedules
3. Add schedule management to:
   - Link analytics page (`/dashboard/analytics/[id]`)
   - Dashboard settings (`/dashboard/settings`)

### Future Enhancements

- PDF generation with charts and visualizations
- Custom date ranges for reports
- Report templates
- Webhook delivery option
- Slack/Discord integration
- Report preview before scheduling
- Pause/resume functionality
- Notification preferences
