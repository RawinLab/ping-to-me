import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from '../links.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QrCodeService } from '../../qr/qr.service';
import { AuditService } from '../../audit/audit.service';
import { QuotaService } from '../../quota/quota.service';
import { SafetyCheckService } from '../services/safety-check.service';

describe('LinksService - Import with Failed Rows CSV', () => {
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
            },
            blockedDomain: {
              findUnique: jest.fn(),
            },
            clickEvent: {
              count: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
              link: {
                findUnique: jest.fn(),
                create: jest.fn(),
              },
            })),
          },
        },
        {
          provide: QrCodeService,
          useValue: {
            generateAdvancedQr: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logLinkEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: QuotaService,
          useValue: {
            checkQuota: jest.fn().mockResolvedValue({ allowed: true }),
            incrementUsage: jest.fn(),
          },
        },
        {
          provide: SafetyCheckService,
          useValue: {
            checkAndUpdateLink: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return failedRowsCsv when some rows fail during import', async () => {
    const csvContent = `originalUrl,slug,title,description,tags
https://example.com,valid-slug,Valid Link,Test,
invalid-url,test-slug,Invalid,Test,
https://example2.com,reserved-slug-api,Reserved,Test,`;

    const buffer = Buffer.from(csvContent);
    const userId = 'test-user-id';

    // Mock create to fail for invalid URL and reserved slug
    jest.spyOn(service as any, 'create').mockImplementation(async (uid, dto) => {
      if (dto.originalUrl === 'invalid-url') {
        throw new Error('Invalid URL format');
      }
      if (dto.slug === 'reserved-slug-api') {
        throw new Error('This slug is reserved');
      }
      return { id: 'test-id', slug: dto.slug, originalUrl: dto.originalUrl };
    });

    const result = await service.importLinks(userId, buffer);

    expect(result.total).toBe(3);
    expect(result.success).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.failedRowsCsv).toBeDefined();
    expect(result.failedRowsCsv).toContain('originalUrl,slug,title,description,tags,expirationDate,error');
    expect(result.failedRowsCsv).toContain('invalid-url');
    expect(result.failedRowsCsv).toContain('Invalid URL format');
    expect(result.failedRowsCsv).toContain('reserved-slug-api');
    expect(result.failedRowsCsv).toContain('This slug is reserved');
  });

  it('should return null failedRowsCsv when all rows succeed', async () => {
    const csvContent = `originalUrl,slug,title,description,tags
https://example.com,valid1,Valid Link 1,Test,
https://example2.com,valid2,Valid Link 2,Test,`;

    const buffer = Buffer.from(csvContent);
    const userId = 'test-user-id';

    jest.spyOn(service as any, 'create').mockResolvedValue({
      id: 'test-id',
      slug: 'test-slug',
      originalUrl: 'https://example.com',
    });

    const result = await service.importLinks(userId, buffer);

    expect(result.total).toBe(2);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.failedRowsCsv).toBeNull();
  });

  it('should properly escape CSV fields with quotes', async () => {
    // Use properly escaped CSV format (quotes inside quotes must be doubled)
    const csvContent = `originalUrl,slug,title,description,tags
https://example.com,test,"Title with ""quotes""","Description with ""quotes""",`;

    const buffer = Buffer.from(csvContent);
    const userId = 'test-user-id';

    jest.spyOn(service as any, 'create').mockRejectedValue(new Error('Test error with "quotes"'));

    const result = await service.importLinks(userId, buffer);

    expect(result.failedRowsCsv).toBeDefined();
    // Check that quotes are properly escaped (doubled) in the failed rows CSV
    expect(result.failedRowsCsv).toContain('Title with ""quotes""');
    expect(result.failedRowsCsv).toContain('Description with ""quotes""');
    expect(result.failedRowsCsv).toContain('Test error with ""quotes""');
  });
});
