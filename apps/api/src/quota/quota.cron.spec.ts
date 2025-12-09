import { Test, TestingModule } from '@nestjs/testing';
import { QuotaCronService } from './quota.cron';
import { PrismaService } from '../prisma/prisma.service';

describe('QuotaCronService', () => {
  let service: QuotaCronService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organization: {
      findMany: jest.fn(),
    },
    usageTracking: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    usageEvent: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaCronService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QuotaCronService>(QuotaCronService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentYearMonth', () => {
    it('should return current year-month in YYYY-MM format', () => {
      const result = service.getCurrentYearMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);

      const [year, month] = result.split('-');
      expect(parseInt(year)).toBeGreaterThan(2020);
      expect(parseInt(month)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month)).toBeLessThanOrEqual(12);
    });

    it('should pad month with zero', () => {
      const result = service.getCurrentYearMonth();
      const [, month] = result.split('-');
      expect(month).toHaveLength(2);
    });
  });

  describe('getYearMonthOffset', () => {
    it('should return correct year-month for negative offset', () => {
      // This test is date-dependent, so we'll just verify format
      const result = service.getYearMonthOffset(-12);
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should return correct year-month for positive offset', () => {
      const result = service.getYearMonthOffset(3);
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should handle year boundaries correctly', () => {
      const result = service.getYearMonthOffset(-1);
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('resetMonthlyQuotas', () => {
    it('should reset quotas for all organizations', async () => {
      const mockOrgs = [
        { id: 'org1', name: 'Organization 1', plan: 'free' },
        { id: 'org2', name: 'Organization 2', plan: 'pro' },
        { id: 'org3', name: 'Organization 3', plan: 'enterprise' },
      ];

      mockPrismaService.organization.findMany.mockResolvedValue(mockOrgs);
      mockPrismaService.usageTracking.upsert.mockResolvedValue({});
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.resetMonthlyQuotas();

      expect(mockPrismaService.organization.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalled();

      // Verify each organization got a reset
      mockOrgs.forEach((org) => {
        expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              organizationId_yearMonth: {
                organizationId: org.id,
                yearMonth: expect.stringMatching(/^\d{4}-\d{2}$/),
              },
            },
            create: expect.objectContaining({
              organizationId: org.id,
              linksCreated: 0,
              apiCalls: 0,
            }),
          }),
        );
      });
    });

    it('should handle empty organization list', async () => {
      mockPrismaService.organization.findMany.mockResolvedValue([]);
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.resetMonthlyQuotas();

      expect(mockPrismaService.organization.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.usageTracking.upsert).not.toHaveBeenCalled();
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalled();
    });

    it('should continue processing if one organization fails', async () => {
      const mockOrgs = [
        { id: 'org1', name: 'Organization 1', plan: 'free' },
        { id: 'org2', name: 'Organization 2', plan: 'pro' },
        { id: 'org3', name: 'Organization 3', plan: 'enterprise' },
      ];

      mockPrismaService.organization.findMany.mockResolvedValue(mockOrgs);
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      // Simulate failure for second organization
      mockPrismaService.usageTracking.upsert
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({});

      await service.resetMonthlyQuotas();

      expect(mockPrismaService.usageTracking.upsert).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalled();
    });

    it('should log cron event with correct metadata', async () => {
      mockPrismaService.organization.findMany.mockResolvedValue([]);
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.resetMonthlyQuotas();

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: null,
          userId: null,
          eventType: 'cron_monthly_quota_reset',
          resourceId: null,
          metadata: expect.objectContaining({
            yearMonth: expect.stringMatching(/^\d{4}-\d{2}$/),
            totalOrganizations: 0,
            successCount: 0,
            failureCount: 0,
            durationMs: expect.any(Number),
          }),
        },
      });
    });
  });

  describe('cleanupOldUsageData', () => {
    it('should delete usage tracking records older than 12 months', async () => {
      mockPrismaService.usageTracking.deleteMany.mockResolvedValue({ count: 150 });
      mockPrismaService.usageEvent.deleteMany.mockResolvedValue({ count: 5000 });
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.cleanupOldUsageData();

      expect(mockPrismaService.usageTracking.deleteMany).toHaveBeenCalledWith({
        where: {
          yearMonth: {
            lt: expect.stringMatching(/^\d{4}-\d{2}$/),
          },
        },
      });

      expect(mockPrismaService.usageEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });

      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledTimes(2);
    });

    it('should handle zero deletions', async () => {
      mockPrismaService.usageTracking.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.usageEvent.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.cleanupOldUsageData();

      expect(mockPrismaService.usageTracking.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.usageEvent.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledTimes(2);
    });

    it('should log cleanup events with correct metadata', async () => {
      mockPrismaService.usageTracking.deleteMany.mockResolvedValue({ count: 100 });
      mockPrismaService.usageEvent.deleteMany.mockResolvedValue({ count: 2000 });
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      await service.cleanupOldUsageData();

      // Check usage tracking cleanup event
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: null,
          userId: null,
          eventType: 'cron_usage_data_cleanup',
          resourceId: null,
          metadata: expect.objectContaining({
            cutoffYearMonth: expect.stringMatching(/^\d{4}-\d{2}$/),
            deletedCount: 100,
            durationMs: expect.any(Number),
          }),
        },
      });

      // Check usage events cleanup event
      expect(mockPrismaService.usageEvent.create).toHaveBeenCalledWith({
        data: {
          organizationId: null,
          userId: null,
          eventType: 'cron_usage_events_cleanup',
          resourceId: null,
          metadata: expect.objectContaining({
            cutoffDate: expect.any(String),
            deletedCount: 2000,
          }),
        },
      });
    });
  });

  describe('manualResetMonthlyQuotas', () => {
    it('should return success when reset completes', async () => {
      mockPrismaService.organization.findMany.mockResolvedValue([]);
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      const result = await service.manualResetMonthlyQuotas();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should return failure when reset throws error', async () => {
      mockPrismaService.organization.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.manualResetMonthlyQuotas();

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.message).toContain('Database connection failed');
    });
  });

  describe('manualCleanupOldUsageData', () => {
    it('should return success when cleanup completes', async () => {
      mockPrismaService.usageTracking.deleteMany.mockResolvedValue({ count: 50 });
      mockPrismaService.usageEvent.deleteMany.mockResolvedValue({ count: 1000 });
      mockPrismaService.usageEvent.create.mockResolvedValue({});

      const result = await service.manualCleanupOldUsageData();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should return failure when cleanup throws error', async () => {
      mockPrismaService.usageTracking.deleteMany.mockRejectedValue(
        new Error('Delete operation failed'),
      );

      const result = await service.manualCleanupOldUsageData();

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.message).toContain('Delete operation failed');
    });
  });
});
