import { test, expect } from '@playwright/test';

test.describe('Link Analytics', () => {
  const linkId = 'link-123';
  const mockAnalyticsData = {
    totalClicks: 150,
    recentClicks: [
      { id: 'c1', timestamp: new Date().toISOString(), country: 'US', ip: '1.1.1.1', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
      { id: 'c2', timestamp: new Date(Date.now() - 86400000).toISOString(), country: 'TH', ip: '2.2.2.2', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    ],
    devices: {
      'Mobile': 50,
      'Desktop': 100
    },
    countries: {
      'US': 80,
      'TH': 20,
      'JP': 10
    },
    referrers: {
      'facebook.com': 30,
      'google.com': 20,
      'direct': 100
    }
  };

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.context().addCookies([{
      name: 'refresh_token',
      value: 'mock-refresh-token',
      domain: 'localhost',
      path: '/'
    }]);

    // Mock analytics endpoint
    await page.route(`**/links/${linkId}/analytics`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalyticsData)
      });
    });

    await page.goto(`/dashboard/analytics/${linkId}`);
  });

  test('ANA-003: Track Device', async ({ page }) => {
    // Check Devices chart
    await expect(page.locator('text=Devices')).toBeVisible();
    // Check for Pie chart presence
    // Find the card that contains "Devices" title
    const devicesCard = page.locator('.border', { hasText: 'Devices' }).first();
    await expect(devicesCard.locator('.recharts-surface')).toBeVisible();
  });

  test('ANA-004: Geo Location', async ({ page }) => {
    // Check Top Countries chart
    await expect(page.locator('text=Top Countries')).toBeVisible();
    // Bar chart with layout="vertical" usually renders YAxis labels.
    await expect(page.locator('.recharts-wrapper', { hasText: 'US' })).toBeVisible();
    await expect(page.locator('.recharts-wrapper', { hasText: 'TH' })).toBeVisible();
  });

  test('ANA-005: Time Series Graph', async ({ page }) => {
    // Check Clicks Over Time chart
    await expect(page.locator('text=Clicks Over Time')).toBeVisible();
    // Check if chart is rendered
    await expect(page.locator('.recharts-surface')).toHaveCount(4); // 4 charts total
  });

  test('ANA-002: Track Referrer', async ({ page }) => {
    // Currently NOT implemented in UI.
    // If we want to test it, we need to add it to the page.
    // For now, let's assume we will add it.
    await expect(page.locator('text=Top Referrers')).toBeVisible();
    await expect(page.locator('text=facebook.com')).toBeVisible();
  });

  test('ANA-006: Export Analytics', async ({ page }) => {
    // Currently NOT implemented in UI.
    // Mock export endpoint
    await page.route(`**/links/${linkId}/analytics/export`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="analytics.csv"' },
        body: 'timestamp,clicks\n2023-01-01,10'
      });
    });

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Data")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('analytics.csv');
  });
});
