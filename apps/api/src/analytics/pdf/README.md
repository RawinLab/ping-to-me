# Analytics PDF Reports

This module provides PDF report generation for analytics data.

## Features

- **Link Analytics Reports**: Generate PDF reports for individual link analytics
- **Dashboard Reports**: Generate PDF reports for dashboard-wide analytics
- **Professional Formatting**: Clean, professional PDF layout with tables and statistics
- **Customizable Date Ranges**: Support for 7, 30, and 90-day reports

## API Endpoints

### Link Analytics PDF

```
GET /links/:id/analytics/export/pdf?days=30
```

**Parameters:**
- `id` (path): Link ID
- `days` (query, optional): Number of days (7, 30, or 90), defaults to 30

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="link-analytics-YYYY-MM-DD.pdf"`

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/links/abc123/analytics/export/pdf?days=30" \
  --output link-report.pdf
```

### Dashboard Analytics PDF

```
GET /analytics/export/pdf?days=30
```

**Parameters:**
- `days` (query, optional): Number of days (7, 30, or 90), defaults to 30

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="dashboard-analytics-YYYY-MM-DD.pdf"`

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/analytics/export/pdf?days=30" \
  --output dashboard-report.pdf
```

## PDF Contents

### Link Report Includes:

1. **Link Information**
   - Title, short URL, destination, creation date
   - Report period

2. **Summary Statistics**
   - Total clicks
   - Unique visitors
   - All-time clicks
   - Last 7 days performance
   - Period-over-period change

3. **Top Countries**
   - Country breakdown with click counts and percentages
   - Top 10 countries

4. **Device Breakdown**
   - Desktop, Mobile, Tablet distribution
   - Click counts and percentages

5. **Browser Breakdown**
   - Top 10 browsers
   - Click counts and percentages

6. **Operating System**
   - Top 10 operating systems
   - Click counts and percentages

7. **Top Referrers**
   - Top 10 referral sources
   - Click counts and percentages

8. **Clicks Over Time**
   - Last 14 days of click data
   - Date and click count table

### Dashboard Report Includes:

1. **Overview**
   - Report period
   - Total links
   - Total clicks
   - All-time clicks
   - Period-over-period change

2. **Top Performing Links**
   - Top 5 links by clicks
   - Link slug, title, and click count

3. **Top Countries**
   - Top 10 countries
   - Click counts and percentages

4. **Device Breakdown**
   - Desktop, Mobile, Tablet distribution
   - Click counts and percentages

5. **Browser Breakdown**
   - Top 10 browsers
   - Click counts and percentages

6. **Top Referrers**
   - Top 10 referral sources
   - Click counts and percentages

## Implementation Details

### Dependencies

- **pdfkit**: PDF generation library
- **@types/pdfkit**: TypeScript type definitions

### Service Methods

#### `generateLinkReport(linkId, userId, days)`

Generates a PDF report for a specific link.

**Parameters:**
- `linkId` (string): The link ID
- `userId` (string): The user ID (for ownership verification)
- `days` (number): Number of days to include (default: 30)

**Returns:** `Promise<Buffer>` - PDF file as buffer

**Throws:**
- `NotFoundException`: If link not found
- `ForbiddenException`: If user doesn't own the link

#### `generateDashboardReport(userId, days)`

Generates a PDF report for the user's dashboard.

**Parameters:**
- `userId` (string): The user ID
- `days` (number): Number of days to include (default: 30)

**Returns:** `Promise<Buffer>` - PDF file as buffer

**Throws:**
- `NotFoundException`: If user not found

### PDF Styling

- **Header**: 24pt bold title with generation timestamp
- **Section Headers**: 16pt bold with separator line
- **Tables**: Professional layout with headers, alternating row backgrounds
- **Fonts**: Helvetica (regular and bold)
- **Margins**: 50pt on all sides
- **Pagination**: Automatic page breaks when needed

### Helper Methods

- `drawSectionLine()`: Draws separator line under sections
- `addLabelValue()`: Formats label-value pairs
- `drawTable()`: Renders tables with headers and data
- `truncateText()`: Truncates long text with ellipsis

## Frontend Integration

### Link Analytics Page

```typescript
// Export dropdown with CSV and PDF options
const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
  const endpoint = format === 'pdf'
    ? `/links/${id}/analytics/export/pdf?days=${days}`
    : `/links/${id}/analytics/export`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${date}.${format}`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

### Dashboard Analytics Page

Similar implementation with dashboard-specific endpoint.

## Testing

Unit tests cover:
- PDF generation for links and dashboard
- Different date ranges (7, 30, 90 days)
- Error handling (not found, forbidden)
- Edge cases (no data, no links)
- User name fallback

Run tests:
```bash
pnpm --filter api test -- analytics-pdf.service.spec.ts
```

## Security

- **Authentication Required**: All endpoints require valid JWT token
- **Authorization**: Users can only generate reports for their own links
- **RBAC**: Uses permission guard with `analytics:export` permission
- **Ownership Verification**: Service validates link/user ownership before generation

## Performance Considerations

- PDF generation is synchronous and may take 1-3 seconds for large datasets
- Data is fetched from existing analytics service (no additional DB queries)
- Buffer-based streaming minimizes memory usage
- No file system writes - PDFs generated in memory

## Future Enhancements

- [ ] Add charts/graphs to PDF (using canvas or SVG)
- [ ] Support for custom date ranges (not just preset periods)
- [ ] Email delivery of scheduled reports
- [ ] PDF template customization
- [ ] Logo upload and inclusion in header
- [ ] Multiple language support
- [ ] Compressed/optimized PDF output
