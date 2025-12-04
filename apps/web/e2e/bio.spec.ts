import { test, expect } from '@playwright/test';

test.describe('Bio Pages', () => {
  const mockBioPage = {
    id: 'bio-1',
    slug: 'my-page',
    title: 'My Bio Page',
    description: 'Welcome to my page',
    theme: 'light',
    buttonColor: '#000000',
    content: {
      links: [
        { title: 'Link 1', url: 'https://example.com/1' },
        { title: 'Link 2', url: 'https://example.com/2' }
      ]
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

    // Mock dashboard metrics (if needed)
    await page.route('**/analytics/dashboard', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    // Mock Bio Pages list
    await page.route('**/biopages?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockBioPage])
      });
    });

    // Mock Single Bio Page
    await page.route('**/biopages/my-page', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBioPage)
      });
    });

    await page.goto('/dashboard/biopages');
  });

  test('BIO-001: Create Bio Page', async ({ page }) => {
    // Mock create
    await page.route('**/biopages', async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        expect(data.slug).toBe('new-page');
        expect(data.title).toBe('New Page');
        await route.fulfill({
          status: 201,
          body: JSON.stringify({ ...mockBioPage, slug: 'new-page', title: 'New Page' })
        });
      } else {
        await route.continue();
      }
    });

    await page.fill('input[placeholder="Page Title"]', 'New Page');
    await page.fill('input[placeholder="Slug"]', 'new-page');
    await page.click('button:has-text("Create Page")');

    // Should reload list
    // We can check if inputs cleared
    await expect(page.locator('input[placeholder="Page Title"]')).toBeEmpty();
  });

  test('BIO-002: Add Links to Bio Page', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Add Link
    await page.click('button:has-text("+ Add Link")');

    // Fill new link details (it's the last one)
    const links = page.locator('.border.rounded.bg-gray-50');
    const lastLink = links.last();
    await lastLink.locator('input[placeholder="Link Title"]').fill('New Link');
    await lastLink.locator('input[placeholder="URL"]').fill('https://new.com');

    // Verify Preview updates
    await expect(page.locator('a[href="https://new.com"]')).toBeVisible();

    // Save
    await page.route(`**/biopages/${mockBioPage.id}`, async route => {
      const data = route.request().postDataJSON();
      expect(data.content.links).toHaveLength(3);
      expect(data.content.links[2].url).toBe('https://new.com');
      await route.fulfill({ status: 200, body: JSON.stringify(data) });
    });

    // Handle alert
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button:has-text("Save Changes")');
    const dialog = await dialogPromise;
    await dialog.accept();
  });

  test('BIO-004: Reorder Links', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Initial order: Link 1, Link 2
    // Click "Down" on Link 1 (first link)
    const firstLink = page.locator('.border.rounded.bg-gray-50').first();
    await firstLink.locator('button:has-text("↓")').click();

    // Verify order in inputs
    const inputs = page.locator('input[placeholder="Link Title"]');
    await expect(inputs.nth(0)).toHaveValue('Link 2');
    await expect(inputs.nth(1)).toHaveValue('Link 1');

    // Verify Preview order
    const previewLinks = page.locator('.h-full.overflow-y-auto a');
    await expect(previewLinks.nth(0)).toHaveText('Link 2');
    await expect(previewLinks.nth(1)).toHaveText('Link 1');
  });

  test('BIO-005: Customize Theme', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Change Theme to Dark
    await page.selectOption('select', 'dark');

    // Change Button Color
    await page.fill('input[type="color"]', '#00ff00');

    // Verify Preview
    // Dark theme bg
    await expect(page.locator('.bg-gray-900')).toBeVisible();

    // Button color (check style attribute)
    const previewLink = page.locator('.h-full.overflow-y-auto a').first();
    await expect(previewLink).toHaveAttribute('style', /color: rgb\(255, 255, 255\)/); // Text color should be white on colored button
    // Note: hex #00ff00 might be converted to rgb.
    // We can just check if style contains the color.

    // Save
    await page.route(`**/biopages/${mockBioPage.id}`, async route => {
      const data = route.request().postDataJSON();
      expect(data.theme).toBe('dark');
      expect(data.buttonColor).toBe('#00ff00');
      await route.fulfill({ status: 200, body: JSON.stringify(data) });
    });

    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button:has-text("Save Changes")');
    const dialog = await dialogPromise;
    await dialog.accept();
  });
});
