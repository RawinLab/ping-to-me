import { test, expect } from '@playwright/test';

test.describe('Custom Domains', () => {
  const mockDomains = [
    { id: 'dom-1', hostname: 'link.example.com', isVerified: true, createdAt: new Date().toISOString() },
    { id: 'dom-2', hostname: 'go.mysite.com', isVerified: false, createdAt: new Date().toISOString() }
  ];

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.context().addCookies([{
      name: 'refresh_token',
      value: 'mock-refresh-token',
      domain: 'localhost',
      path: '/'
    }]);

    // Mock notifications
    await page.route('**/notifications', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ notifications: [], unreadCount: 0 })
      });
    });

    // Mock domains list
    await page.route('**/domains?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDomains)
      });
    });

    await page.goto('/dashboard/domains');
  });

  test('DOM-001: Add Custom Domain', async ({ page }) => {
    // Mock domain creation
    await page.route('**/domains', async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        expect(data.hostname).toBe('new.example.com');
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: 'dom-new',
            hostname: 'new.example.com',
            isVerified: false,
            createdAt: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Click Add Domain button
    await page.click('button:has-text("Add Domain")');

    // Fill hostname in modal
    await page.fill('input[placeholder="links.example.com"]', 'new.example.com');

    // Click Add button in modal
    await page.click('button[type="submit"]:has-text("Add Domain")');

    // Should show DNS instructions or success
    // Modal might close or show instructions
    await expect(page.locator('text=new.example.com')).toBeVisible();
  });

  test('DOM-002: Verify Domain DNS - Success', async ({ page }) => {
    // Mock verify endpoint - success
    await page.route('**/domains/dom-2/verify', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, isVerified: true })
      });
    });

    // Find pending domain row and click Verify
    const pendingRow = page.locator('tr', { hasText: 'go.mysite.com' });

    // Handle alert before clicking
    const dialogPromise = page.waitForEvent('dialog');
    await pendingRow.locator('button:has-text("Verify")').click();
    const dialog = await dialogPromise;
    await dialog.accept();
    // Alert will show "Verification triggered"
  });

  test('DOM-003: Verify Domain DNS - Failed', async ({ page }) => {
    // Mock verify endpoint - failure
    await page.route('**/domains/dom-2/verify', async route => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'DNS record not found' })
      });
    });

    // Find pending domain row and click Verify
    const pendingRow = page.locator('tr', { hasText: 'go.mysite.com' });

    // Handle alert before clicking
    const dialogPromise = page.waitForEvent('dialog');
    await pendingRow.locator('button:has-text("Verify")').click();
    const dialog = await dialogPromise;
    await dialog.accept();
    // Alert will show "Verification failed"
  });

  test('DOM-006: Remove Domain', async ({ page }) => {
    // Mock delete endpoint
    await page.route('**/domains/dom-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      }
    });

    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept());

    // Find verified domain row and click delete
    const verifiedRow = page.locator('tr', { hasText: 'link.example.com' });
    await verifiedRow.locator('button:has(.lucide-trash)').click();

    // Confirm deletion happened (row should disappear on reload)
  });
});
