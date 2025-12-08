import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ScheduledReportsService } from '../scheduled-reports.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportFrequency } from '@prisma/client';

describe('ScheduledReportsService', () => {
  let service: ScheduledReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    link: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    reportSchedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScheduledReportsService>(ScheduledReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSchedule', () => {
    it('should create a daily report schedule', async () => {
      const userId = 'user-123';
      const dto = {
        frequency: ReportFrequency.DAILY,
        time: '09:00',
        timezone: 'UTC',
        format: 'pdf' as const,
        recipients: ['test@example.com'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        memberships: [],
      });

      mockPrismaService.reportSchedule.create.mockResolvedValue({
        id: 'schedule-123',
        userId,
        organizationId: null,
        linkId: null,
        frequency: ReportFrequency.DAILY,
        time: '09:00',
        timezone: 'UTC',
        format: 'pdf',
        recipients: ['test@example.com'],
        enabled: true,
        nextRunAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createSchedule(userId, dto);

      expect(result).toBeDefined();
      expect(result.frequency).toBe(ReportFrequency.DAILY);
      expect(mockPrismaService.reportSchedule.create).toHaveBeenCalled();
    });

    it('should create a weekly report schedule with dayOfWeek', async () => {
      const userId = 'user-123';
      const dto = {
        frequency: ReportFrequency.WEEKLY,
        dayOfWeek: 1, // Monday
        time: '10:00',
        timezone: 'UTC',
        format: 'csv' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        memberships: [],
      });

      mockPrismaService.reportSchedule.create.mockResolvedValue({
        id: 'schedule-124',
        userId,
        frequency: ReportFrequency.WEEKLY,
        dayOfWeek: 1,
        time: '10:00',
      });

      const result = await service.createSchedule(userId, dto);

      expect(result).toBeDefined();
      expect(result.frequency).toBe(ReportFrequency.WEEKLY);
      expect(result.dayOfWeek).toBe(1);
    });

    it('should create a monthly report schedule with dayOfMonth', async () => {
      const userId = 'user-123';
      const dto = {
        frequency: ReportFrequency.MONTHLY,
        dayOfMonth: 15,
        time: '08:00',
        timezone: 'UTC',
        format: 'pdf' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        memberships: [],
      });

      mockPrismaService.reportSchedule.create.mockResolvedValue({
        id: 'schedule-125',
        userId,
        frequency: ReportFrequency.MONTHLY,
        dayOfMonth: 15,
      });

      const result = await service.createSchedule(userId, dto);

      expect(result).toBeDefined();
      expect(result.frequency).toBe(ReportFrequency.MONTHLY);
    });

    it('should verify link ownership if linkId provided', async () => {
      const userId = 'user-123';
      const linkId = 'link-456';
      const dto = {
        linkId,
        frequency: ReportFrequency.DAILY,
      };

      mockPrismaService.link.findUnique.mockResolvedValue({
        id: linkId,
        userId,
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        memberships: [],
      });

      mockPrismaService.reportSchedule.create.mockResolvedValue({
        id: 'schedule-126',
        linkId,
      });

      await service.createSchedule(userId, dto);

      expect(mockPrismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: linkId },
      });
    });

    it('should throw NotFoundException if link not found', async () => {
      const userId = 'user-123';
      const dto = {
        linkId: 'nonexistent-link',
        frequency: ReportFrequency.DAILY,
      };

      mockPrismaService.link.findUnique.mockResolvedValue(null);

      await expect(service.createSchedule(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own link', async () => {
      const userId = 'user-123';
      const dto = {
        linkId: 'link-456',
        frequency: ReportFrequency.DAILY,
      };

      mockPrismaService.link.findUnique.mockResolvedValue({
        id: 'link-456',
        userId: 'different-user',
      });

      await expect(service.createSchedule(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateSchedule', () => {
    it('should update a report schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';
      const dto = {
        enabled: false,
        format: 'csv' as const,
      };

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId,
        frequency: ReportFrequency.DAILY,
        time: '09:00',
        timezone: 'UTC',
        nextRunAt: new Date(),
      });

      mockPrismaService.reportSchedule.update.mockResolvedValue({
        id: scheduleId,
        ...dto,
      });

      const result = await service.updateSchedule(scheduleId, userId, dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.reportSchedule.update).toHaveBeenCalled();
    });

    it('should recalculate nextRunAt when frequency changes', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';
      const dto = {
        frequency: ReportFrequency.WEEKLY,
        dayOfWeek: 2,
      };

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId,
        frequency: ReportFrequency.DAILY,
        time: '09:00',
        timezone: 'UTC',
        nextRunAt: new Date(),
      });

      mockPrismaService.reportSchedule.update.mockResolvedValue({
        id: scheduleId,
        frequency: ReportFrequency.WEEKLY,
      });

      await service.updateSchedule(scheduleId, userId, dto);

      const updateCall = mockPrismaService.reportSchedule.update.mock.calls[0][0];
      expect(updateCall.data.nextRunAt).toBeDefined();
    });

    it('should throw NotFoundException if schedule not found', async () => {
      const userId = 'user-123';
      const scheduleId = 'nonexistent';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSchedule(scheduleId, userId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId: 'different-user',
      });

      await expect(
        service.updateSchedule(scheduleId, userId, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a report schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId,
      });

      mockPrismaService.reportSchedule.delete.mockResolvedValue({
        id: scheduleId,
      });

      const result = await service.deleteSchedule(scheduleId, userId);

      expect(result.message).toBeDefined();
      expect(mockPrismaService.reportSchedule.delete).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
    });

    it('should throw NotFoundException if schedule not found', async () => {
      const userId = 'user-123';
      const scheduleId = 'nonexistent';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSchedule(scheduleId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId: 'different-user',
      });

      await expect(
        service.deleteSchedule(scheduleId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSchedules', () => {
    it('should return all schedules for a user', async () => {
      const userId = 'user-123';
      const mockSchedules = [
        {
          id: 'schedule-1',
          userId,
          frequency: ReportFrequency.DAILY,
          link: null,
        },
        {
          id: 'schedule-2',
          userId,
          frequency: ReportFrequency.WEEKLY,
          link: { slug: 'test-link', title: 'Test Link' },
        },
      ];

      mockPrismaService.reportSchedule.findMany.mockResolvedValue(
        mockSchedules,
      );

      const result = await service.getSchedules(userId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.reportSchedule.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          link: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getSchedule', () => {
    it('should return a single schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId,
        frequency: ReportFrequency.DAILY,
      });

      const result = await service.getSchedule(scheduleId, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(scheduleId);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      const userId = 'user-123';
      const scheduleId = 'nonexistent';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue(null);

      await expect(service.getSchedule(scheduleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own schedule', async () => {
      const userId = 'user-123';
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        userId: 'different-user',
      });

      await expect(service.getSchedule(scheduleId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getDueSchedules', () => {
    it('should return schedules that are due to run', async () => {
      const now = new Date();
      const mockSchedules = [
        {
          id: 'schedule-1',
          enabled: true,
          nextRunAt: new Date(now.getTime() - 3600000), // 1 hour ago
          user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
          link: null,
        },
      ];

      mockPrismaService.reportSchedule.findMany.mockResolvedValue(
        mockSchedules,
      );

      const result = await service.getDueSchedules();

      expect(result).toHaveLength(1);
      expect(mockPrismaService.reportSchedule.findMany).toHaveBeenCalledWith({
        where: {
          enabled: true,
          nextRunAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          link: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      });
    });
  });

  describe('markScheduleAsSent', () => {
    it('should update lastSentAt and calculate next run time', async () => {
      const scheduleId = 'schedule-123';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue({
        id: scheduleId,
        frequency: ReportFrequency.DAILY,
        time: '09:00',
        timezone: 'UTC',
        dayOfWeek: null,
        dayOfMonth: null,
      });

      mockPrismaService.reportSchedule.update.mockResolvedValue({
        id: scheduleId,
      });

      await service.markScheduleAsSent(scheduleId);

      const updateCall = mockPrismaService.reportSchedule.update.mock.calls[0][0];
      expect(updateCall.data.lastSentAt).toBeInstanceOf(Date);
      expect(updateCall.data.nextRunAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      const scheduleId = 'nonexistent';

      mockPrismaService.reportSchedule.findUnique.mockResolvedValue(null);

      await expect(service.markScheduleAsSent(scheduleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
