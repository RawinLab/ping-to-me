import { Test, TestingModule } from '@nestjs/testing';
import { AggregateAnalyticsTask } from '../aggregate-analytics.task';
import { PrismaService } from '../../prisma/prisma.service';

describe('AggregateAnalyticsTask', () => {
  let task: AggregateAnalyticsTask;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregateAnalyticsTask,
        {
          provide: PrismaService,
          useValue: {
            clickEvent: {
              groupBy: jest.fn(),
              findMany: jest.fn(),
            },
            analyticsDaily: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    task = module.get<AggregateAnalyticsTask>(AggregateAnalyticsTask);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(task).toBeDefined();
  });

  describe('aggregateYesterday', () => {
    it('should aggregate yesterday analytics for all links with clicks', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const mockLinkId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock links with clicks
      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([
        { linkId: mockLinkId, _count: 10 },
      ]);

      // Mock click events for the link
      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue([
        {
          linkId: mockLinkId,
          timestamp: yesterday,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
        {
          linkId: mockLinkId,
          timestamp: yesterday,
          country: 'UK',
          device: 'Mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer: 'direct',
          sessionId: 'session2',
        },
      ]);

      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.aggregateYesterday();

      expect(prisma.clickEvent.groupBy).toHaveBeenCalled();
      expect(prisma.clickEvent.findMany).toHaveBeenCalled();
      expect(prisma.analyticsDaily.upsert).toHaveBeenCalled();
    });

    it('should handle no clicks gracefully', async () => {
      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([]);

      await task.aggregateYesterday();

      expect(prisma.clickEvent.groupBy).toHaveBeenCalled();
      expect(prisma.analyticsDaily.upsert).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (prisma.clickEvent.groupBy as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(task.aggregateYesterday()).resolves.not.toThrow();
    });
  });

  describe('aggregateLinkDay', () => {
    const mockLinkId = '123e4567-e89b-12d3-a456-426614174000';
    const testDate = new Date('2024-01-15T00:00:00Z');

    it('should aggregate clicks correctly', async () => {
      const mockClicks = [
        {
          linkId: mockLinkId,
          timestamp: new Date('2024-01-15T10:30:00Z'),
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
        {
          linkId: mockLinkId,
          timestamp: new Date('2024-01-15T14:20:00Z'),
          country: 'US',
          device: 'Mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer: 'facebook.com',
          sessionId: 'session2',
        },
        {
          linkId: mockLinkId,
          timestamp: new Date('2024-01-15T18:45:00Z'),
          country: 'UK',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'macOS',
          referrer: 'google.com',
          sessionId: 'session3',
        },
      ];

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue(mockClicks);
      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.clickEvent.findMany).toHaveBeenCalledWith({
        where: {
          linkId: mockLinkId,
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        },
      });

      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledWith({
        where: {
          linkId_date: {
            linkId: mockLinkId,
            date: expect.any(Date),
          },
        },
        create: expect.objectContaining({
          linkId: mockLinkId,
          totalClicks: 3,
          uniqueVisitors: 3,
          countries: { US: 2, UK: 1 },
          devices: { Desktop: 2, Mobile: 1 },
          browsers: { Chrome: 2, Safari: 1 },
          os: { Windows: 1, iOS: 1, macOS: 1 },
          referrers: { 'google.com': 2, 'facebook.com': 1 },
        }),
        update: expect.objectContaining({
          totalClicks: 3,
          uniqueVisitors: 3,
        }),
      });
    });

    it('should count unique visitors correctly', async () => {
      const mockClicks = [
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1', // Same session
        },
        {
          linkId: mockLinkId,
          country: 'UK',
          device: 'Mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer: 'direct',
          sessionId: 'session2',
        },
      ];

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue(mockClicks);
      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            totalClicks: 3,
            uniqueVisitors: 2, // Only 2 unique sessions
          }),
        }),
      );
    });

    it('should handle clicks with null sessionId', async () => {
      const mockClicks = [
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: null,
        },
        {
          linkId: mockLinkId,
          country: 'UK',
          device: 'Mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer: 'direct',
          sessionId: 'session1',
        },
      ];

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue(mockClicks);
      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            totalClicks: 2,
            uniqueVisitors: 1, // Only session1 counted
          }),
        }),
      );
    });

    it('should handle no clicks for the day', async () => {
      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue([]);

      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.analyticsDaily.upsert).not.toHaveBeenCalled();
    });

    it('should handle Unknown values for missing data', async () => {
      const mockClicks = [
        {
          linkId: mockLinkId,
          country: null,
          device: null,
          browser: null,
          os: null,
          referrer: null,
          sessionId: 'session1',
        },
      ];

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue(mockClicks);
      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            countries: { Unknown: 1 },
            devices: { Unknown: 1 },
            browsers: { Unknown: 1 },
            os: { Unknown: 1 },
            referrers: { Unknown: 1 },
          }),
        }),
      );
    });

    it('should use upsert for idempotent aggregation', async () => {
      const mockClicks = [
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
      ];

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue(mockClicks);
      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      // Run aggregation twice
      await task.aggregateLinkDay(mockLinkId, testDate);
      await task.aggregateLinkDay(mockLinkId, testDate);

      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            linkId_date: { linkId: mockLinkId, date: expect.any(Date) },
          },
          create: expect.any(Object),
          update: expect.any(Object),
        }),
      );
    });
  });

  describe('backfillDateRange', () => {
    it('should backfill multiple days of analytics', async () => {
      const startDate = new Date('2024-01-10T00:00:00Z');
      const endDate = new Date('2024-01-12T00:00:00Z');
      const mockLinkId = '123e4567-e89b-12d3-a456-426614174000';

      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([
        { linkId: mockLinkId, _count: 5 },
      ]);

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue([
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
      ]);

      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.backfillDateRange(startDate, endDate);

      // Should process 3 days (10th, 11th, 12th)
      expect(prisma.clickEvent.groupBy).toHaveBeenCalledTimes(3);
      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledTimes(3);
    });

    it('should handle single day backfill', async () => {
      const singleDate = new Date('2024-01-15T00:00:00Z');
      const mockLinkId = '123e4567-e89b-12d3-a456-426614174000';

      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([
        { linkId: mockLinkId, _count: 5 },
      ]);

      (prisma.clickEvent.findMany as jest.Mock).mockResolvedValue([
        {
          linkId: mockLinkId,
          country: 'US',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          sessionId: 'session1',
        },
      ]);

      (prisma.analyticsDaily.upsert as jest.Mock).mockResolvedValue({});

      await task.backfillDateRange(singleDate, singleDate);

      expect(prisma.clickEvent.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.analyticsDaily.upsert).toHaveBeenCalledTimes(1);
    });

    it('should skip days with no clicks', async () => {
      const startDate = new Date('2024-01-10T00:00:00Z');
      const endDate = new Date('2024-01-12T00:00:00Z');

      (prisma.clickEvent.groupBy as jest.Mock).mockResolvedValue([]);

      await task.backfillDateRange(startDate, endDate);

      expect(prisma.clickEvent.groupBy).toHaveBeenCalledTimes(3);
      expect(prisma.analyticsDaily.upsert).not.toHaveBeenCalled();
    });
  });

  describe('aggregateField', () => {
    it('should correctly aggregate field values', () => {
      const clicks = [
        { country: 'US', device: 'Desktop' },
        { country: 'US', device: 'Mobile' },
        { country: 'UK', device: 'Desktop' },
        { country: 'US', device: 'Tablet' },
      ];

      // Access private method via type assertion
      const aggregated = (task as any).aggregateField(clicks, 'country');

      expect(aggregated).toEqual({
        US: 3,
        UK: 1,
      });
    });

    it('should handle null/undefined values as Unknown', () => {
      const clicks = [
        { country: 'US' },
        { country: null },
        { country: undefined },
        { country: 'UK' },
      ];

      const aggregated = (task as any).aggregateField(clicks, 'country');

      expect(aggregated).toEqual({
        US: 1,
        Unknown: 2,
        UK: 1,
      });
    });

    it('should handle empty array', () => {
      const clicks: any[] = [];

      const aggregated = (task as any).aggregateField(clicks, 'country');

      expect(aggregated).toEqual({});
    });
  });
});
