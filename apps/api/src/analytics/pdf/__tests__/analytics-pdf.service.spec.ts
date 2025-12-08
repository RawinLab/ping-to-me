import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnalyticsPdfService } from '../analytics-pdf.service';
import { AnalyticsService } from '../../analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AnalyticsPdfService', () => {
  let service: AnalyticsPdfService;
  let analyticsService: AnalyticsService;
  let prismaService: PrismaService;

  const mockLink = {
    id: 'link-1',
    slug: 'test-link',
    title: 'Test Link',
    originalUrl: 'https://example.com',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    status: 'ACTIVE',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAnalytics = {
    totalClicks: 1000,
    uniqueVisitors: 500,
    allTimeClicks: 5000,
    clicksLast7Days: 150,
    weeklyChange: 10,
    periodChange: 5,
    previousPeriodClicks: 950,
    recentClicks: [],
    clicksByDate: [
      { date: '2024-01-01', clicks: 50 },
      { date: '2024-01-02', clicks: 75 },
    ],
    devices: { Desktop: 600, Mobile: 300, Tablet: 100 },
    countries: { US: 500, UK: 300, CA: 200 },
    cities: { 'New York': 200, London: 150 },
    browsers: { Chrome: 600, Firefox: 200, Safari: 200 },
    os: { Windows: 500, macOS: 300, Linux: 200 },
    referrers: { 'google.com': 400, direct: 300, 'twitter.com': 300 },
    sources: { DIRECT: 600, QR: 200, API: 200 },
    days: 30,
  };

  const mockDashboardMetrics = {
    totalLinks: 10,
    totalClicks: 5000,
    allTimeClicks: 20000,
    periodChange: 8,
    previousPeriodClicks: 4630,
    recentClicks: [],
    topLinks: [
      { id: 'link-1', slug: 'top-link', title: 'Top Link', clicks: 1500 },
      { id: 'link-2', slug: 'second-link', title: 'Second Link', clicks: 1000 },
    ],
    clicksByDate: [
      { date: '2024-01-01', clicks: 200 },
      { date: '2024-01-02', clicks: 250 },
    ],
    countries: { US: 2000, UK: 1500, CA: 1500 },
    referrers: { 'google.com': 2000, direct: 1500, 'facebook.com': 1500 },
    devices: { Desktop: 3000, Mobile: 1500, Tablet: 500 },
    browsers: { Chrome: 3000, Firefox: 1000, Safari: 1000 },
    os: { Windows: 2500, macOS: 1500, Linux: 1000 },
    days: 30,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsPdfService,
        {
          provide: AnalyticsService,
          useValue: {
            getLinkAnalytics: jest.fn(),
            getDashboardMetrics: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            link: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsPdfService>(AnalyticsPdfService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateLinkReport', () => {
    it('should generate PDF report for a link', async () => {
      jest.spyOn(prismaService.link, 'findUnique').mockResolvedValue(mockLink as any);
      jest.spyOn(analyticsService, 'getLinkAnalytics').mockResolvedValue(mockAnalytics as any);

      const result = await service.generateLinkReport('link-1', 'user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(prismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-1' },
      });
      expect(analyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        'link-1',
        'user-1',
        30,
      );
    });

    it('should throw NotFoundException if link not found', async () => {
      jest.spyOn(prismaService.link, 'findUnique').mockResolvedValue(null);

      await expect(
        service.generateLinkReport('non-existent', 'user-1', 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the link', async () => {
      jest.spyOn(prismaService.link, 'findUnique').mockResolvedValue({
        ...mockLink,
        userId: 'different-user',
      } as any);

      await expect(
        service.generateLinkReport('link-1', 'user-1', 30),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should generate PDF with different date ranges', async () => {
      jest.spyOn(prismaService.link, 'findUnique').mockResolvedValue(mockLink as any);
      jest.spyOn(analyticsService, 'getLinkAnalytics').mockResolvedValue(mockAnalytics as any);

      // Test 7 days
      const result7d = await service.generateLinkReport('link-1', 'user-1', 7);
      expect(result7d).toBeInstanceOf(Buffer);
      expect(analyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        'link-1',
        'user-1',
        7,
      );

      // Test 90 days
      const result90d = await service.generateLinkReport('link-1', 'user-1', 90);
      expect(result90d).toBeInstanceOf(Buffer);
      expect(analyticsService.getLinkAnalytics).toHaveBeenCalledWith(
        'link-1',
        'user-1',
        90,
      );
    });

    it('should handle analytics with no data', async () => {
      jest.spyOn(prismaService.link, 'findUnique').mockResolvedValue(mockLink as any);
      jest.spyOn(analyticsService, 'getLinkAnalytics').mockResolvedValue({
        totalClicks: 0,
        uniqueVisitors: 0,
        allTimeClicks: 0,
        clicksLast7Days: 0,
        weeklyChange: 0,
        periodChange: 0,
        previousPeriodClicks: 0,
        recentClicks: [],
        clicksByDate: [],
        devices: {},
        countries: {},
        cities: {},
        browsers: {},
        os: {},
        referrers: {},
        sources: {},
        days: 30,
      } as any);

      const result = await service.generateLinkReport('link-1', 'user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateDashboardReport', () => {
    it('should generate PDF report for dashboard', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(analyticsService, 'getDashboardMetrics').mockResolvedValue(
        mockDashboardMetrics as any,
      );

      const result = await service.generateDashboardReport('user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        'user-1',
        30,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.generateDashboardReport('non-existent', 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate PDF with different date ranges', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(analyticsService, 'getDashboardMetrics').mockResolvedValue(
        mockDashboardMetrics as any,
      );

      // Test 7 days
      const result7d = await service.generateDashboardReport('user-1', 7);
      expect(result7d).toBeInstanceOf(Buffer);
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        'user-1',
        7,
      );

      // Test 90 days
      const result90d = await service.generateDashboardReport('user-1', 90);
      expect(result90d).toBeInstanceOf(Buffer);
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledWith(
        'user-1',
        90,
      );
    });

    it('should handle dashboard with no links', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(analyticsService, 'getDashboardMetrics').mockResolvedValue({
        totalLinks: 0,
        totalClicks: 0,
        allTimeClicks: 0,
        periodChange: 0,
        previousPeriodClicks: 0,
        recentClicks: [],
        topLinks: [],
        clicksByDate: [],
        countries: {},
        referrers: {},
        devices: {},
        browsers: {},
        os: {},
        days: 30,
      } as any);

      const result = await service.generateDashboardReport('user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include user name in PDF if available', async () => {
      const userWithName = { ...mockUser, name: 'John Doe' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithName as any);
      jest.spyOn(analyticsService, 'getDashboardMetrics').mockResolvedValue(
        mockDashboardMetrics as any,
      );

      const result = await service.generateDashboardReport('user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fallback to email if user name not available', async () => {
      const userWithoutName = { ...mockUser, name: null };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(userWithoutName as any);
      jest.spyOn(analyticsService, 'getDashboardMetrics').mockResolvedValue(
        mockDashboardMetrics as any,
      );

      const result = await service.generateDashboardReport('user-1', 30);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
