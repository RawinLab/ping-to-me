import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from '../tags.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    tag: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    link: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    logResourceEvent: jest.fn().mockResolvedValue(undefined),
    captureChanges: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockTagId = 'tag-123';
  const mockTag = {
    id: mockTagId,
    name: 'JavaScript',
    color: '#FF5733',
    organizationId: mockOrgId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const newTag = {
        ...mockTag,
        id: 'new-tag-123',
        name: 'Python',
        color: '#3776AB',
      };

      mockPrismaService.tag.create.mockResolvedValue(newTag);

      const result = await service.create(mockUserId, mockOrgId, 'Python', '#3776AB');

      expect(result).toEqual(newTag);
      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Python',
          color: '#3776AB',
          organizationId: mockOrgId,
        },
      });
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.created',
        'Tag',
        newTag.id,
        expect.objectContaining({
          details: {
            name: 'Python',
            color: '#3776AB',
          },
        }),
      );
    });

    it('should create a tag without color', async () => {
      const newTag = {
        ...mockTag,
        id: 'new-tag-456',
        name: 'TypeScript',
        color: undefined,
      };

      mockPrismaService.tag.create.mockResolvedValue(newTag);

      const result = await service.create(mockUserId, mockOrgId, 'TypeScript');

      expect(result).toEqual(newTag);
      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'TypeScript',
          color: undefined,
          organizationId: mockOrgId,
        },
      });
    });

    it('should fire and forget audit logging on error', async () => {
      mockPrismaService.tag.create.mockResolvedValue(mockTag);
      mockAuditService.logResourceEvent.mockRejectedValueOnce(new Error('Audit error'));

      const result = await service.create(mockUserId, mockOrgId, 'JavaScript', '#FF5733');

      expect(result).toEqual(mockTag);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tags for an organization', async () => {
      const tags = [mockTag, { ...mockTag, id: 'tag-456', name: 'Python' }];

      mockPrismaService.tag.findMany.mockResolvedValue(tags);

      const result = await service.findAll(mockUserId, mockOrgId);

      expect(result).toEqual(tags);
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no tags exist', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUserId, mockOrgId);

      expect(result).toEqual([]);
    });
  });

  describe('update - rename tag', () => {
    it('should update tag name and cascade to all links atomically', async () => {
      const updatedTag = { ...mockTag, name: 'TypeScript' };
      const linksWithTag = [
        { id: 'link-1', tags: ['JavaScript', 'Frontend'] },
        { id: 'link-2', tags: ['JavaScript'] },
        { id: 'link-3', tags: ['JavaScript', 'Backend'] },
      ];

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue({
        before: { name: 'JavaScript' },
        after: { name: 'TypeScript' },
      });

      // Mock transaction behavior
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(updatedTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue(linksWithTag),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(mockTx);
      });

      const result = await service.update(mockUserId, mockTagId, { name: 'TypeScript' });

      expect(result).toEqual(updatedTag);
      expect(mockPrismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: mockTagId },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.updated',
        'Tag',
        updatedTag.id,
        expect.objectContaining({
          details: expect.objectContaining({
            name: 'TypeScript',
            affectedLinksCount: 3,
          }),
        }),
      );
    });

    it('should update tag color without cascading to links', async () => {
      const updatedTag = { ...mockTag, color: '#0000FF' };

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue({
        before: { color: '#FF5733' },
        after: { color: '#0000FF' },
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(updatedTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        return callback(mockTx);
      });

      const result = await service.update(mockUserId, mockTagId, { color: '#0000FF' });

      expect(result).toEqual(updatedTag);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.updated',
        'Tag',
        updatedTag.id,
        expect.objectContaining({
          details: expect.objectContaining({
            affectedLinksCount: 0,
          }),
        }),
      );
    });

    it('should update both name and color with cascading', async () => {
      const updatedTag = { ...mockTag, name: 'Node.js', color: '#68A063' };
      const linksWithTag = [{ id: 'link-1', tags: ['JavaScript'] }];

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue({
        before: { name: 'JavaScript', color: '#FF5733' },
        after: { name: 'Node.js', color: '#68A063' },
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(updatedTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue(linksWithTag),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(mockTx);
      });

      const result = await service.update(mockUserId, mockTagId, {
        name: 'Node.js',
        color: '#68A063',
      });

      expect(result).toEqual(updatedTag);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.updated',
        'Tag',
        updatedTag.id,
        expect.any(Object),
      );
    });

    it('should log audit event with affected link count', async () => {
      const updatedTag = { ...mockTag, name: 'TypeScript' };
      const linksWithTag = Array.from({ length: 5 }, (_, i) => ({
        id: `link-${i}`,
        tags: ['JavaScript'],
      }));

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue({
        before: { name: 'JavaScript' },
        after: { name: 'TypeScript' },
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(updatedTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue(linksWithTag),
            update: jest.fn().mockResolvedValue({}),
          },
        };

        return callback(mockTx);
      });

      await service.update(mockUserId, mockTagId, { name: 'TypeScript' });

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.updated',
        'Tag',
        updatedTag.id,
        expect.objectContaining({
          details: expect.objectContaining({
            affectedLinksCount: 5,
          }),
        }),
      );
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockTagId, { name: 'TypeScript' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockAuditService.logResourceEvent).not.toHaveBeenCalled();
    });

    it('should handle update with no actual changes', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(mockTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        return callback(mockTx);
      });

      const result = await service.update(mockUserId, mockTagId, {});

      expect(result).toEqual(mockTag);
    });

    it('should fire and forget audit logging on error', async () => {
      const updatedTag = { ...mockTag, name: 'TypeScript' };

      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockAuditService.captureChanges.mockReturnValue({
        before: { name: 'JavaScript' },
        after: { name: 'TypeScript' },
      });
      mockAuditService.logResourceEvent.mockRejectedValueOnce(new Error('Audit error'));

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          tag: {
            update: jest.fn().mockResolvedValue(updatedTag),
          },
          link: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };

        return callback(mockTx);
      });

      const result = await service.update(mockUserId, mockTagId, { name: 'TypeScript' });

      expect(result).toEqual(updatedTag);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);

      const result = await service.remove(mockUserId, mockTagId);

      expect(result).toEqual(mockTag);
      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: mockTagId },
      });
      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.deleted',
        'Tag',
        mockTagId,
        expect.objectContaining({
          details: { name: 'JavaScript' },
        }),
      );
    });

    it('should fire and forget audit logging on error', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);
      mockAuditService.logResourceEvent.mockRejectedValueOnce(new Error('Audit error'));

      const result = await service.remove(mockUserId, mockTagId);

      expect(result).toEqual(mockTag);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return usage count per tag', async () => {
      const tags = [
        { ...mockTag, id: 'tag-1', name: 'JavaScript' },
        { ...mockTag, id: 'tag-2', name: 'Python' },
        { ...mockTag, id: 'tag-3', name: 'TypeScript' },
      ];

      mockPrismaService.tag.findMany.mockResolvedValue(tags);
      mockPrismaService.link.count
        .mockResolvedValueOnce(10) // JavaScript
        .mockResolvedValueOnce(8) // Python
        .mockResolvedValueOnce(5); // TypeScript

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(result.tags).toHaveLength(3);
      expect(result.tags[0]).toEqual(expect.objectContaining({
        name: 'JavaScript',
        linkCount: 10,
      }));
      expect(result.tags[1]).toEqual(expect.objectContaining({
        name: 'Python',
        linkCount: 8,
      }));
      expect(result.tags[2]).toEqual(expect.objectContaining({
        name: 'TypeScript',
        linkCount: 5,
      }));
      expect(result.totalTags).toBe(3);
      expect(result.usedTags).toBe(3);
      expect(result.unusedTags).toBe(0);
    });

    it('should identify unused tags with linkCount = 0', async () => {
      const tags = [
        { ...mockTag, id: 'tag-1', name: 'JavaScript' },
        { ...mockTag, id: 'tag-2', name: 'Unused1' },
        { ...mockTag, id: 'tag-3', name: 'Python' },
        { ...mockTag, id: 'tag-4', name: 'Unused2' },
      ];

      mockPrismaService.tag.findMany.mockResolvedValue(tags);
      mockPrismaService.link.count
        .mockResolvedValueOnce(10) // JavaScript
        .mockResolvedValueOnce(0) // Unused1
        .mockResolvedValueOnce(5) // Python
        .mockResolvedValueOnce(0); // Unused2

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(result.tags).toHaveLength(4);
      const unusedTags = result.tags.filter((t) => t.linkCount === 0);
      expect(unusedTags).toHaveLength(2);
      expect(unusedTags[0].name).toBe('Unused1');
      expect(unusedTags[1].name).toBe('Unused2');
      expect(result.unusedTags).toBe(2);
      expect(result.usedTags).toBe(2);
    });

    it('should return totalTags and unusedTags count', async () => {
      const tags = Array.from({ length: 15 }, (_, i) => ({
        ...mockTag,
        id: `tag-${i}`,
        name: `Tag${i}`,
      }));

      mockPrismaService.tag.findMany.mockResolvedValue(tags);

      // First 5 unused, rest used
      const linkCounts = [0, 0, 0, 0, 0, ...Array(10).fill(1)];
      linkCounts.forEach((count) => {
        mockPrismaService.link.count.mockResolvedValueOnce(count);
      });

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(result.totalTags).toBe(15);
      expect(result.unusedTags).toBe(5);
      expect(result.usedTags).toBe(10);
      expect(result.tags).toHaveLength(15);
    });

    it('should handle organization with no tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([]);

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(result.tags).toEqual([]);
      expect(result.totalTags).toBe(0);
      expect(result.unusedTags).toBe(0);
      expect(result.usedTags).toBe(0);
    });

    it('should count links correctly with has filter', async () => {
      const tags = [{ ...mockTag, name: 'JavaScript' }];

      mockPrismaService.tag.findMany.mockResolvedValue(tags);
      mockPrismaService.link.count.mockResolvedValue(42);

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(mockPrismaService.link.count).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          tags: { has: 'JavaScript' },
        },
      });
      expect(result.tags[0].linkCount).toBe(42);
    });

    it('should handle all unused tags', async () => {
      const tags = Array.from({ length: 5 }, (_, i) => ({
        ...mockTag,
        id: `tag-${i}`,
        name: `Tag${i}`,
      }));

      mockPrismaService.tag.findMany.mockResolvedValue(tags);
      Array(5).fill(0).forEach(() => {
        mockPrismaService.link.count.mockResolvedValueOnce(0);
      });

      const result = await service.getStatistics(mockUserId, mockOrgId);

      expect(result.totalTags).toBe(5);
      expect(result.unusedTags).toBe(5);
      expect(result.usedTags).toBe(0);
    });
  });

  describe('merge', () => {
    const sourceTagId = 'source-tag-123';
    const targetTagId = 'target-tag-456';
    const sourceTag = {
      ...mockTag,
      id: sourceTagId,
      name: 'JavaScript',
    };
    const targetTag = {
      ...mockTag,
      id: targetTagId,
      name: 'JS',
    };

    it('should replace source tag with target tag in all links', async () => {
      const linksWithSourceTag = [
        { id: 'link-1', tags: ['JavaScript', 'Frontend'] },
        { id: 'link-2', tags: ['JavaScript'] },
        { id: 'link-3', tags: ['Backend', 'JavaScript'] },
      ];

      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue(linksWithSourceTag),
            update: jest.fn().mockResolvedValue({}),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        return callback(mockTx);
      });

      const result = await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(result.success).toBe(true);
      expect(result.mergedLinksCount).toBe(3);
      expect(result.targetTag).toEqual(targetTag);
    });

    it('should delete source tag after merge', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        return callback(mockTx);
      });

      await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.merged',
        'Tag',
        targetTagId,
        expect.objectContaining({
          details: expect.objectContaining({
            sourceTagId,
            targetTagId,
            sourceTagName: 'JavaScript',
            targetTagName: 'JS',
          }),
        }),
      );
    });

    it('should prevent self-merge and throw error', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(sourceTag); // Same ID

      await expect(
        service.merge(mockUserId, sourceTagId, sourceTagId),
      ).rejects.toThrow(BadRequestException);
      expect(mockAuditService.logResourceEvent).not.toHaveBeenCalled();
    });

    it('should prevent merge from different organizations', async () => {
      const otherOrgTag = { ...targetTag, organizationId: 'other-org' };

      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(otherOrgTag);

      await expect(
        service.merge(mockUserId, sourceTagId, targetTagId),
      ).rejects.toThrow(BadRequestException);
      expect(mockAuditService.logResourceEvent).not.toHaveBeenCalled();
    });

    it('should handle links that have both tags without duplicates', async () => {
      const linksWithBothTags = [
        { id: 'link-1', tags: ['JavaScript', 'JS', 'Frontend'] }, // Already has target
        { id: 'link-2', tags: ['JavaScript'] }, // Only source
        { id: 'link-3', tags: ['JavaScript', 'JS'] }, // Has both
      ];

      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue(linksWithBothTags),
            update: jest.fn().mockResolvedValue({}),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        const result = await callback(mockTx);

        // Verify update calls don't create duplicates
        const updateCalls = mockTx.link.update.mock.calls;
        expect(updateCalls[0][0].data.tags).toEqual(['JS', 'Frontend']); // Remove JavaScript, JS already exists
        expect(updateCalls[1][0].data.tags).toEqual(['JS']); // Replace JavaScript with JS
        expect(updateCalls[2][0].data.tags).toEqual(['JS']); // Remove duplicate

        return result;
      });

      const result = await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(result.mergedLinksCount).toBe(3);
    });

    it('should log audit event with merge details', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue(
              Array.from({ length: 7 }, (_, i) => ({
                id: `link-${i}`,
                tags: ['JavaScript'],
              })),
            ),
            update: jest.fn().mockResolvedValue({}),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        return callback(mockTx);
      });

      await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(mockAuditService.logResourceEvent).toHaveBeenCalledWith(
        mockUserId,
        mockOrgId,
        'tag.merged',
        'Tag',
        targetTagId,
        expect.objectContaining({
          details: {
            sourceTagId,
            sourceTagName: 'JavaScript',
            targetTagId,
            targetTagName: 'JS',
            mergedLinksCount: 7,
          },
        }),
      );
    });

    it('should fire and forget audit logging on error', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        return callback(mockTx);
      });

      mockAuditService.logResourceEvent.mockRejectedValueOnce(new Error('Audit error'));

      const result = await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(result.success).toBe(true);
      expect(mockAuditService.logResourceEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source tag not found', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.merge(mockUserId, sourceTagId, targetTagId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target tag not found', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(null);

      await expect(
        service.merge(mockUserId, sourceTagId, targetTagId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle merge with no links having source tag', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(sourceTag)
        .mockResolvedValueOnce(targetTag);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          link: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
          },
          tag: {
            delete: jest.fn().mockResolvedValue(sourceTag),
          },
        };

        return callback(mockTx);
      });

      const result = await service.merge(mockUserId, sourceTagId, targetTagId);

      expect(result.mergedLinksCount).toBe(0);
      expect(result.success).toBe(true);
    });
  });
});
