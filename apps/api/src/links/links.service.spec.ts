import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LinksService', () => {
  let service: LinksService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: PrismaService,
          useValue: {
            link: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            blockedDomain: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a link with auto-generated slug', async () => {
      const dto = { originalUrl: 'https://example.com' };
      const userId = 'user-123';
      const mockLink = {
        id: 'link-123',
        ...dto,
        slug: 'abc12345',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        status: 'ACTIVE',
        tags: [],
        redirectType: 301,
      };

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.link.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.link.create as jest.Mock).mockResolvedValue(mockLink);

      const result = await service.create(userId, dto);

      expect(result).toBeDefined();
      expect(result.slug).toBe('abc12345');
      expect(prisma.link.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const dto = { originalUrl: 'invalid-url' };
      const userId = 'user-123';

      await expect(service.create(userId, dto)).rejects.toThrow('Invalid URL format');
    });

    it('should throw ForbiddenException for blocked domain', async () => {
      const dto = { originalUrl: 'https://phishing.com' };
      const userId = 'user-123';

      (prisma.blockedDomain.findUnique as jest.Mock).mockResolvedValue({ id: '1', domain: 'phishing.com' });

      await expect(service.create(userId, dto)).rejects.toThrow('This domain is blocked');
    });
  });
});
