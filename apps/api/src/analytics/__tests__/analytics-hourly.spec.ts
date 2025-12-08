import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsCacheService } from '../cache/analytics-cache.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AnalyticsService - Hourly Heatmap', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    link: {
      findUnique: jest.fn(),
    },
    clickEvent: {
      findMany: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AnalyticsCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHourlyHeatmap', () => {
    const linkId = 'link-123';
    const userId = 'user-123';

    it('should throw NotFoundException if link does not exist', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(service.getHourlyHeatmap(linkId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getHourlyHeatmap(linkId, userId)).rejects.toThrow(
        'Link not found',
      );
    });

    it('should throw ForbiddenException if user does not own link', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId: 'different-user',
      });

      await expect(service.getHourlyHeatmap(linkId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getHourlyHeatmap(linkId, userId)).rejects.toThrow(
        'Access denied',
      );
    });

    it('should return empty heatmap with maxCount 0 when no clicks exist', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      const result = await service.getHourlyHeatmap(linkId, userId);

      expect(result).toBeDefined();
      expect(result.maxCount).toBe(0);
      expect(result.heatmapData).toHaveLength(168); // 7 days * 24 hours = 168
      expect(result.heatmapData.every((cell) => cell.count === 0)).toBe(true);
    });

    it('should return complete 7x24 grid with all cells', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Verify we have all 168 cells (7 days * 24 hours)
      expect(result.heatmapData).toHaveLength(168);

      // Verify structure of cells
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const cell = result.heatmapData.find(
            (c) => c.day === day && c.hour === hour,
          );
          expect(cell).toBeDefined();
          expect(cell?.count).toBe(0);
        }
      }
    });

    it('should aggregate clicks by day of week and hour correctly', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // Create test clicks - Sunday (0) at 10am UTC
      const sundayMorning = new Date('2024-12-08T10:30:00Z'); // Sunday
      const clicks = [
        { timestamp: sundayMorning },
        { timestamp: sundayMorning },
        { timestamp: sundayMorning },
      ];

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Find the cell for Sunday (0) at 10am
      const cell = result.heatmapData.find((c) => c.day === 0 && c.hour === 10);
      expect(cell?.count).toBe(3);
      expect(result.maxCount).toBe(3);
    });

    it('should use UTC timezone for consistency', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // Monday 11pm UTC
      const mondayNight = new Date('2024-12-09T23:45:00Z');
      // Tuesday 12am UTC
      const tuesdayMorning = new Date('2024-12-10T00:15:00Z');

      const clicks = [
        { timestamp: mondayNight },
        { timestamp: mondayNight },
        { timestamp: tuesdayMorning },
      ];

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Monday (1) at 23:00
      const mondayCell = result.heatmapData.find(
        (c) => c.day === 1 && c.hour === 23,
      );
      expect(mondayCell?.count).toBe(2);

      // Tuesday (2) at 00:00
      const tuesdayCell = result.heatmapData.find(
        (c) => c.day === 2 && c.hour === 0,
      );
      expect(tuesdayCell?.count).toBe(1);
    });

    it('should calculate maxCount correctly across all cells', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      const clicks = [
        // 5 clicks on Monday at 10am
        { timestamp: new Date('2024-12-09T10:00:00Z') },
        { timestamp: new Date('2024-12-09T10:15:00Z') },
        { timestamp: new Date('2024-12-09T10:30:00Z') },
        { timestamp: new Date('2024-12-09T10:45:00Z') },
        { timestamp: new Date('2024-12-09T10:50:00Z') },
        // 3 clicks on Wednesday at 2pm
        { timestamp: new Date('2024-12-11T14:00:00Z') },
        { timestamp: new Date('2024-12-11T14:20:00Z') },
        { timestamp: new Date('2024-12-11T14:40:00Z') },
        // 1 click on Friday at 8pm
        { timestamp: new Date('2024-12-13T20:00:00Z') },
      ];

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      expect(result.maxCount).toBe(5);

      // Verify the counts
      const mondayCell = result.heatmapData.find(
        (c) => c.day === 1 && c.hour === 10,
      );
      expect(mondayCell?.count).toBe(5);

      const wednesdayCell = result.heatmapData.find(
        (c) => c.day === 3 && c.hour === 14,
      );
      expect(wednesdayCell?.count).toBe(3);

      const fridayCell = result.heatmapData.find(
        (c) => c.day === 5 && c.hour === 20,
      );
      expect(fridayCell?.count).toBe(1);
    });

    it('should use default days parameter of 30 when not provided', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      await service.getHourlyHeatmap(linkId, userId);

      // Verify date range is 30 days
      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );

      const call = mockPrismaService.clickEvent.findMany.mock.calls[0][0];
      const startDate = call.where.timestamp.gte;
      const now = new Date();
      const expectedStartDate = new Date(now);
      expectedStartDate.setDate(expectedStartDate.getDate() - 30);

      // Check if dates are within 1 second (to account for execution time)
      expect(Math.abs(startDate.getTime() - expectedStartDate.getTime())).toBeLessThan(1000);
    });

    it('should accept custom days parameter', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      await service.getHourlyHeatmap(linkId, userId, 7);

      const call = mockPrismaService.clickEvent.findMany.mock.calls[0][0];
      const startDate = call.where.timestamp.gte;
      const now = new Date();
      const expectedStartDate = new Date(now);
      expectedStartDate.setDate(expectedStartDate.getDate() - 7);

      expect(Math.abs(startDate.getTime() - expectedStartDate.getTime())).toBeLessThan(1000);
    });

    it('should filter clicks by date range', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      await service.getHourlyHeatmap(linkId, userId, 90);

      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalledWith({
        where: {
          linkId,
          timestamp: {
            gte: expect.any(Date),
          },
        },
        select: {
          timestamp: true,
        },
      });
    });

    it('should handle all days of week (0-6)', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // One click for each day of the week
      const clicks = [
        { timestamp: new Date('2024-12-08T12:00:00Z') }, // Sunday (0)
        { timestamp: new Date('2024-12-09T12:00:00Z') }, // Monday (1)
        { timestamp: new Date('2024-12-10T12:00:00Z') }, // Tuesday (2)
        { timestamp: new Date('2024-12-11T12:00:00Z') }, // Wednesday (3)
        { timestamp: new Date('2024-12-12T12:00:00Z') }, // Thursday (4)
        { timestamp: new Date('2024-12-13T12:00:00Z') }, // Friday (5)
        { timestamp: new Date('2024-12-14T12:00:00Z') }, // Saturday (6)
      ];

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Verify each day has 1 click at noon
      for (let day = 0; day < 7; day++) {
        const cell = result.heatmapData.find((c) => c.day === day && c.hour === 12);
        expect(cell?.count).toBe(1);
      }
    });

    it('should handle all hours (0-23)', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // One click for each hour on Monday
      const clicks = [];
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date('2024-12-09T00:00:00Z');
        timestamp.setUTCHours(hour);
        clicks.push({ timestamp });
      }

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Verify each hour has 1 click on Monday (day 1)
      for (let hour = 0; hour < 24; hour++) {
        const cell = result.heatmapData.find((c) => c.day === 1 && c.hour === hour);
        expect(cell?.count).toBe(1);
      }
    });

    it('should return consistent grid structure regardless of data', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // Test with empty data
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);
      const emptyResult = await service.getHourlyHeatmap(linkId, userId);
      expect(emptyResult.heatmapData).toHaveLength(168);

      // Test with data
      const clicks = [{ timestamp: new Date('2024-12-09T10:00:00Z') }];
      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);
      const withDataResult = await service.getHourlyHeatmap(linkId, userId);
      expect(withDataResult.heatmapData).toHaveLength(168);

      // Both should have same structure
      expect(emptyResult.heatmapData.map((c) => `${c.day}-${c.hour}`)).toEqual(
        withDataResult.heatmapData.map((c) => `${c.day}-${c.hour}`),
      );
    });

    it('should include cells with zero counts in the response', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // Only one click
      const clicks = [{ timestamp: new Date('2024-12-09T10:00:00Z') }];
      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      // Should have 168 cells total
      expect(result.heatmapData).toHaveLength(168);

      // Only 1 cell should have count > 0
      const nonZeroCells = result.heatmapData.filter((c) => c.count > 0);
      expect(nonZeroCells).toHaveLength(1);

      // Remaining cells should be 0
      const zeroCells = result.heatmapData.filter((c) => c.count === 0);
      expect(zeroCells).toHaveLength(167);
    });

    it('should verify link ownership before processing data', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });
      mockPrismaService.clickEvent.findMany.mockResolvedValue([]);

      await service.getHourlyHeatmap(linkId, userId);

      // Verify link lookup was called
      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });

      // Verify both were called
      expect(mockPrismaService.link.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.clickEvent.findMany).toHaveBeenCalled();
    });

    it('should handle large number of clicks efficiently', async () => {
      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      // Generate 1000 unique clicks spread across different times
      const clicks = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date('2024-12-09T00:00:00Z');
        // Add i hours to make each timestamp unique
        date.setUTCHours(date.getUTCHours() + (i % 168));
        date.setUTCMinutes(Math.floor(i / 168) * 5);
        return { timestamp: date };
      });

      mockPrismaService.clickEvent.findMany.mockResolvedValue(clicks);

      const result = await service.getHourlyHeatmap(linkId, userId);

      expect(result.heatmapData).toHaveLength(168);
      expect(result.maxCount).toBeGreaterThan(0);

      // Verify total count equals number of clicks
      const totalCount = result.heatmapData.reduce((sum, cell) => sum + cell.count, 0);
      expect(totalCount).toBe(1000);
    });
  });
});
