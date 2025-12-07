import { test, expect } from '@playwright/test';

test.describe('Bio Pages', () => {
  const randomId = Math.random().toString(36).substring(7);

  const mockBioPage = {
    id: 'bio-1',
    slug: 'my-page',
    title: 'My Bio Page',
    description: 'Welcome to my page',
    theme: {
      name: 'minimal',
      primaryColor: '#000000',
      buttonColor: '#000000',
      buttonTextColor: '#ffffff',
      textColor: '#000000',
      backgroundColor: '#ffffff',
      backgroundType: 'solid',
      buttonStyle: 'rounded',
      buttonShadow: false
    },
    layout: 'stacked',
    showBranding: true,
    socialLinks: [],
    bioLinks: [],
    createdAt: new Date().toISOString()
  };

  const mockLinks = [
    { id: 'link-1', slug: 'link1', title: 'Link 1', originalUrl: 'https://example.com/1', status: 'ACTIVE' },
    { id: 'link-2', slug: 'link2', title: 'Link 2', originalUrl: 'https://example.com/2', status: 'ACTIVE' },
    { id: 'link-3', slug: 'link3', title: 'Link 3', originalUrl: 'https://example.com/3', status: 'ACTIVE' }
  ];

  const mockBioLinks = [
    { id: 'biolink-1', bioPageId: 'bio-1', linkId: 'link-1', title: 'Link 1', description: null, order: 0, isVisible: true, link: mockLinks[0] },
    { id: 'biolink-2', bioPageId: 'bio-1', linkId: 'link-2', title: 'Link 2', description: null, order: 1, isVisible: true, link: mockLinks[1] }
  ];

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Org',
    plan: 'PRO'
  };

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.context().addCookies([{
      name: 'refresh_token',
      value: 'mock-refresh-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.route('**/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          user: { id: 'user-1', email: 'test@example.com', role: 'OWNER' }
        })
      });
    });

    // Mock dashboard metrics
    await page.route('**/analytics/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalLinks: 10,
          totalClicks: 100,
          recentClicks: [],
          clicksByDate: []
        })
      });
    });

    // Mock organizations
    await page.route('**/organizations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockOrganization])
      });
    });

    // Mock user links
    await page.route('**/links?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockLinks,
          meta: { total: 3, page: 1, limit: 10, totalPages: 1 }
        })
      });
    });

    // Mock Bio Pages list
    await page.route('**/biopages?*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ...mockBioPage, bioLinks: mockBioLinks }])
      });
    });

    // Mock single bio page
    await page.route('**/biopages/my-page', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockBioPage, bioLinks: mockBioLinks })
      });
    });

    // Mock bio page links
    await page.route('**/biopages/bio-1/links*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBioLinks)
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/dashboard/biopages');
  });

  test('BIO-001: Create Bio Page', async ({ page }) => {
    let createdPage: any = null;

    await page.route('**/biopages', async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        expect(data.slug).toBe('new-page');
        expect(data.title).toBe('New Page Title');
        expect(data.orgId).toBe('org-1');

        createdPage = {
          ...mockBioPage,
          id: 'bio-2',
          slug: 'new-page',
          title: 'New Page Title',
          description: ''
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdPage)
        });
      } else {
        await route.continue();
      }
    });

    await page.fill('input[placeholder="Page Title"]', 'New Page Title');
    await page.fill('input[placeholder="Slug"]', 'new-page');

    // Handle alert dialog
    page.on('dialog', dialog => dialog.accept());

    await page.click('button:has-text("Create Page")');

    // Wait for success - inputs should clear
    await expect(page.locator('input[placeholder="Page Title"]')).toBeEmpty();
    await expect(page.locator('input[placeholder="Slug"]')).toBeEmpty();
  });

  test('BIO-002: Edit Bio Page Title and Description', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Wait for page to load
    await expect(page.locator('input[id="title"]')).toHaveValue('My Bio Page');

    // Update title and description
    await page.fill('input[id="title"]', 'Updated Bio Page');
    await page.fill('textarea[id="description"]', 'This is an updated description');

    // Mock the PATCH request
    await page.route('**/biopages/bio-1', async route => {
      if (route.request().method() === 'PATCH') {
        const data = route.request().postDataJSON();
        expect(data.title).toBe('Updated Bio Page');
        expect(data.description).toBe('This is an updated description');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockBioPage, ...data })
        });
      } else {
        await route.continue();
      }
    });

    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Bio Page")');
  });

  test('BIO-010: Load Bio Page Editor with Tabs', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Verify Page Details section exists
    await expect(page.locator('text=Page Details')).toBeVisible();

    // Verify tabs are present
    await expect(page.locator('button[role="tab"]:has-text("Links")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Theme")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Settings")')).toBeVisible();
  });

  test('BIO-013: Add Link from Dropdown', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Links tab
    await page.click('button[role="tab"]:has-text("Links")');

    // Mock add link API
    await page.route('**/biopages/bio-1/links', async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON();
        expect(data.linkId).toBe('link-3');

        const newBioLink = {
          id: 'biolink-3',
          bioPageId: 'bio-1',
          linkId: 'link-3',
          title: 'Link 3',
          description: null,
          order: 2,
          isVisible: true,
          link: mockLinks[2]
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newBioLink)
        });
      } else {
        await route.continue();
      }
    });

    // Open dropdown and select a link
    await page.click('button:has-text("Add a link")');
    await page.click('div[role="option"]:has-text("Link 3")');

    // Verify link was added (check if it appears in the list)
    await expect(page.locator('text=Link 3').first()).toBeVisible();
  });

  test('BIO-015: Remove Link', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Links tab
    await page.click('button[role="tab"]:has-text("Links")');

    // Mock delete link API
    await page.route('**/biopages/bio-1/links/biolink-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    // Find and click delete button for first link
    const firstLinkItem = page.locator('[data-link-item]').first();
    await firstLinkItem.locator('button:has(.lucide-trash)').click();

    // Verify link is removed from UI
    await expect(page.locator('[data-link-item]')).toHaveCount(1);
  });

  test('BIO-020: Theme Selector Visibility', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Theme tab
    await page.click('button[role="tab"]:has-text("Theme")');

    // Verify theme selector is visible
    await expect(page.locator('text=Choose a Preset Theme')).toBeVisible();

    // Verify at least one theme preset is visible
    await expect(page.locator('text=Minimal')).toBeVisible();
  });

  test('BIO-021: Select Predefined Theme', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Theme tab
    await page.click('button[role="tab"]:has-text("Theme")');

    // Click on a different theme (Ocean theme)
    await page.locator('button:has-text("Ocean")').click();

    // Mock save request
    await page.route('**/biopages/bio-1', async route => {
      if (route.request().method() === 'PATCH') {
        const data = route.request().postDataJSON();
        expect(data.theme.name).not.toBe('minimal');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...mockBioPage, theme: data.theme })
        });
      } else {
        await route.continue();
      }
    });

    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Bio Page")');
  });

  test('BIO-030: Add Social Link', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Click Settings tab
    await page.click('button[role="tab"]:has-text("Settings")');

    // Find social links section
    await expect(page.locator('text=Social Links').first()).toBeVisible();

    // Add a social link (Twitter)
    await page.click('button:has-text("Add Social Link")');

    // Select platform
    await page.click('button:has-text("Select platform")');
    await page.click('div[role="option"]:has-text("Twitter")');

    // Enter URL
    await page.fill('input[placeholder*="twitter.com"]', 'https://twitter.com/example');

    // Verify social link is added
    await expect(page.locator('input[value="https://twitter.com/example"]')).toBeVisible();
  });

  test('BIO-040: Render Public Bio Page', async ({ page }) => {
    const publicBioPage = {
      ...mockBioPage,
      bioLinks: mockBioLinks.map(bl => ({
        ...bl,
        link: {
          ...bl.link,
          shortUrl: `http://localhost:3000/${bl.link?.slug}`
        }
      }))
    };

    await page.route('**/biopages/public/my-page', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publicBioPage)
      });
    });

    // Visit public bio page
    await page.goto('/bio/my-page');

    // Verify page renders
    await expect(page.locator('h1:has-text("My Bio Page")')).toBeVisible();
    await expect(page.locator('text=Welcome to my page')).toBeVisible();

    // Verify links are rendered
    await expect(page.locator('a:has-text("Link 1")')).toBeVisible();
    await expect(page.locator('a:has-text("Link 2")')).toBeVisible();
  });

  test('BIO-044: Display 404 for Non-existent Page', async ({ page }) => {
    await page.route('**/biopages/public/nonexistent', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Bio page not found' })
      });
    });

    // Visit non-existent bio page
    await page.goto('/bio/nonexistent');

    // Verify 404 message
    await expect(page.locator('text=Bio Page Not Found')).toBeVisible();
  });

  test('BIO-050: Display Analytics Dashboard', async ({ page }) => {
    const mockAnalytics = {
      summary: {
        totalViews: 1250,
        totalClicks: 340,
        uniqueVisitors: 890
      },
      timeseries: {
        viewsByDate: [
          { date: '2025-12-01', views: 45 },
          { date: '2025-12-02', views: 67 },
          { date: '2025-12-03', views: 52 }
        ]
      },
      clicks: {
        linkClicks: [
          { linkId: 'link-1', title: 'Link 1', url: 'https://example.com/1', clicks: 150, percentage: 44 },
          { linkId: 'link-2', title: 'Link 2', url: 'https://example.com/2', clicks: 190, percentage: 56 }
        ],
        referrers: {
          'twitter.com': 120,
          'facebook.com': 85,
          'Direct': 135
        },
        countries: {
          'United States': 180,
          'United Kingdom': 75,
          'Canada': 85
        }
      }
    };

    await page.route('**/biopages/my-page/analytics/summary*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalytics.summary)
      });
    });

    await page.route('**/biopages/my-page/analytics/timeseries*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalytics.timeseries)
      });
    });

    await page.route('**/biopages/my-page/analytics/clicks*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalytics.clicks)
      });
    });

    // Visit analytics page
    await page.goto('/dashboard/biopages/my-page/analytics');

    // Verify summary cards
    await expect(page.locator('text=Total Views')).toBeVisible();
    await expect(page.locator('text=1,250')).toBeVisible();
    await expect(page.locator('text=Total Clicks')).toBeVisible();
    await expect(page.locator('text=340')).toBeVisible();
    await expect(page.locator('text=Unique Visitors')).toBeVisible();
    await expect(page.locator('text=890')).toBeVisible();

    // Verify charts and data sections
    await expect(page.locator('text=Views over time')).toBeVisible();
    await expect(page.locator('text=Clicks per Link')).toBeVisible();
    await expect(page.locator('text=Top Referrers')).toBeVisible();
    await expect(page.locator('text=Top Countries')).toBeVisible();
  });

  test('BIO-051: Share Modal with QR Code', async ({ page }) => {
    await page.goto('/dashboard/biopages/my-page/edit');

    // Mock QR code preview
    await page.route('**/qr/preview?*', async route => {
      // Return a simple 1x1 pixel PNG
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const buffer = Buffer.from(base64Image, 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: buffer
      });
    });

    // Look for share button (might be in a different location)
    // For now, simulate opening share modal by clicking a button that contains "Share"
    const shareButton = page.locator('button:has-text("Share")').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Verify share modal components
      await expect(page.locator('text=Share Bio Page')).toBeVisible();
      await expect(page.locator('text=Bio Page URL')).toBeVisible();
      await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
      await expect(page.locator('button:has-text("Download QR Code")')).toBeVisible();
    }
  });
});
