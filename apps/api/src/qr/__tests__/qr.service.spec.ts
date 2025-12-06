import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QrCodeService } from '../qr.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateQrConfigDto } from '../dto/qr-config.dto';
import * as QRCode from 'qrcode';

// Mock QRCode module
jest.mock('qrcode');

// Mock sharp module
jest.mock('sharp', () => {
  const mockSharpInstance = {
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mocked-image-buffer')),
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
    composite: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => mockSharpInstance);
});

// Mock pdfkit module
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(function (this: any, event: string, callback: Function) {
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return this;
    }),
    fontSize: jest.fn(function (this: any) {
      return this;
    }),
    text: jest.fn(function (this: any) {
      return this;
    }),
    moveDown: jest.fn(function (this: any) {
      return this;
    }),
    image: jest.fn(function (this: any) {
      return this;
    }),
    end: jest.fn(),
    y: 100,
    page: {
      width: 595,
      height: 842,
      margins: { left: 50, right: 50, top: 50, bottom: 50 },
    },
  }));
});

// Mock archiver module
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => {
    const archive = {
      pipe: jest.fn(function (this: any, stream: any) {
        // Immediately signal completion
        setImmediate(() => {
          if (stream && typeof stream.end === 'function') {
            stream.end();
          }
        });
        return this;
      }),
      append: jest.fn(),
      finalize: jest.fn(function (this: any) {
        // Trigger the pipe's stream to finish
        return Promise.resolve();
      }),
      on: jest.fn(),
    };
    return archive;
  });
});

describe('QrCodeService', () => {
  let service: QrCodeService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  const mockLink = {
    id: 'link-123',
    slug: 'test-slug',
    originalUrl: 'https://example.com',
    userId: 'user-123',
    organizationId: null,
    title: 'Test Link',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
    password: null,
    redirectType: 'TEMPORARY',
    clicks: 0,
    isActive: true,
  };

  const mockQrConfig = {
    id: 'qr-123',
    linkId: 'link-123',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    logoUrl: null,
    logoSizePercent: 20,
    errorCorrection: 'M',
    borderSize: 2,
    size: 300,
    qrCodeUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      qrCode: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      link: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrCodeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getQrConfig', () => {
    it('should return null for non-existent link', async () => {
      (prismaService.qrCode.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getQrConfig('non-existent-id');

      expect(result).toBeNull();
      expect(prismaService.qrCode.findUnique).toHaveBeenCalledWith({
        where: { linkId: 'non-existent-id' },
      });
    });

    it('should return config for existing link', async () => {
      (prismaService.qrCode.findUnique as jest.Mock).mockResolvedValue(mockQrConfig);

      const result = await service.getQrConfig('link-123');

      expect(result).toEqual({
        id: mockQrConfig.id,
        linkId: mockQrConfig.linkId,
        foregroundColor: mockQrConfig.foregroundColor,
        backgroundColor: mockQrConfig.backgroundColor,
        logoUrl: mockQrConfig.logoUrl,
        logoSizePercent: mockQrConfig.logoSizePercent,
        errorCorrection: mockQrConfig.errorCorrection,
        borderSize: mockQrConfig.borderSize,
        size: mockQrConfig.size,
        qrCodeUrl: mockQrConfig.qrCodeUrl,
        createdAt: mockQrConfig.createdAt.toISOString(),
        updatedAt: mockQrConfig.updatedAt.toISOString(),
      });
      expect(prismaService.qrCode.findUnique).toHaveBeenCalledWith({
        where: { linkId: 'link-123' },
      });
    });
  });

  describe('saveQrConfig', () => {
    const createDto: CreateQrConfigDto = {
      foregroundColor: '#FF0000',
      backgroundColor: '#00FF00',
      errorCorrection: 'H',
      borderSize: 3,
      size: 400,
      logoSizePercent: 25,
    };

    it('should create new config', async () => {
      (prismaService.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (prismaService.qrCode.upsert as jest.Mock).mockResolvedValue(mockQrConfig);

      const result = await service.saveQrConfig('link-123', createDto);

      expect(result.linkId).toBe('link-123');
      expect(prismaService.link.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-123' },
      });
      expect(prismaService.qrCode.upsert).toHaveBeenCalledWith({
        where: { linkId: 'link-123' },
        create: expect.objectContaining({
          linkId: 'link-123',
          foregroundColor: createDto.foregroundColor,
          backgroundColor: createDto.backgroundColor,
          errorCorrection: createDto.errorCorrection,
          borderSize: createDto.borderSize,
          size: createDto.size,
          logoSizePercent: createDto.logoSizePercent,
        }),
        update: expect.objectContaining({
          foregroundColor: createDto.foregroundColor,
          backgroundColor: createDto.backgroundColor,
          errorCorrection: createDto.errorCorrection,
          borderSize: createDto.borderSize,
          size: createDto.size,
          logoSizePercent: createDto.logoSizePercent,
        }),
      });
    });

    it('should update existing config', async () => {
      const updatedConfig = {
        ...mockQrConfig,
        foregroundColor: '#FF0000',
        backgroundColor: '#00FF00',
        updatedAt: new Date('2024-02-01'),
      };

      (prismaService.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (prismaService.qrCode.upsert as jest.Mock).mockResolvedValue(updatedConfig);

      const result = await service.saveQrConfig('link-123', createDto);

      expect(result.foregroundColor).toBe('#FF0000');
      expect(result.backgroundColor).toBe('#00FF00');
      expect(prismaService.qrCode.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent link', async () => {
      (prismaService.link.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.saveQrConfig('non-existent', createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.saveQrConfig('non-existent', createDto)).rejects.toThrow(
        'Link not found',
      );
    });

    it('should upload logo to R2 when provided', async () => {
      const dtoWithLogo: CreateQrConfigDto = {
        ...createDto,
        logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      (prismaService.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (storageService.uploadFile as jest.Mock).mockResolvedValue('https://cdn.example.com/logo.png');
      (prismaService.qrCode.upsert as jest.Mock).mockResolvedValue({
        ...mockQrConfig,
        logoUrl: 'https://cdn.example.com/logo.png',
      });

      const result = await service.saveQrConfig('link-123', dtoWithLogo);

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(result.logoUrl).toBe('https://cdn.example.com/logo.png');
    });
  });

  describe('generateAdvancedQr', () => {
    beforeEach(() => {
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from('qr-code-buffer'));
    });

    it('should generate QR code with default options', async () => {
      const options = {
        url: 'https://example.com',
      };

      const result = await service.generateAdvancedQr(options);

      expect(result.dataUrl).toContain('data:image/png;base64,');
      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300, // default size
        margin: 2, // default margin
        color: {
          dark: '#000000', // default foreground
          light: '#FFFFFF', // default background
        },
        errorCorrectionLevel: 'M', // default when no logo
      });
    });

    it('should apply custom foreground color', async () => {
      const options = {
        url: 'https://example.com',
        foregroundColor: '#FF0000',
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#FF0000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply custom background color', async () => {
      const options = {
        url: 'https://example.com',
        backgroundColor: '#0000FF',
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#0000FF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply error correction L', async () => {
      const options = {
        url: 'https://example.com',
        errorCorrection: 'L' as const,
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'L',
      });
    });

    it('should apply error correction H', async () => {
      const options = {
        url: 'https://example.com',
        errorCorrection: 'H' as const,
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
    });

    it('should apply custom margin', async () => {
      const options = {
        url: 'https://example.com',
        margin: 5,
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 5,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply custom size', async () => {
      const options = {
        url: 'https://example.com',
        size: 500,
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const options = {
        url: 'not-a-valid-url',
      };

      await expect(service.generateAdvancedQr(options)).rejects.toThrow(BadRequestException);
      await expect(service.generateAdvancedQr(options)).rejects.toThrow('Invalid URL format');
    });

    it('should throw BadRequestException for invalid foreground color format', async () => {
      const options = {
        url: 'https://example.com',
        foregroundColor: 'red', // not hex format
      };

      await expect(service.generateAdvancedQr(options)).rejects.toThrow(BadRequestException);
      await expect(service.generateAdvancedQr(options)).rejects.toThrow(
        'Invalid foreground color format',
      );
    });

    it('should throw BadRequestException for invalid background color format', async () => {
      const options = {
        url: 'https://example.com',
        backgroundColor: '#GGGGGG', // invalid hex
      };

      await expect(service.generateAdvancedQr(options)).rejects.toThrow(BadRequestException);
      await expect(service.generateAdvancedQr(options)).rejects.toThrow(
        'Invalid background color format',
      );
    });

    it('should use error correction H when logo is present', async () => {
      const options = {
        url: 'https://example.com',
        logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // automatically set to H when logo present
      });
    });

    it('should apply all custom options together', async () => {
      const options = {
        url: 'https://example.com',
        foregroundColor: '#FF0000',
        backgroundColor: '#0000FF',
        size: 500,
        margin: 4,
        errorCorrection: 'Q' as const,
      };

      await service.generateAdvancedQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 500,
        margin: 4,
        color: {
          dark: '#FF0000',
          light: '#0000FF',
        },
        errorCorrectionLevel: 'Q',
      });
    });
  });

  describe('generatePdfQr', () => {
    beforeEach(() => {
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from('qr-code-buffer'));
    });

    it('should generate valid PDF buffer', async () => {
      const options = {
        url: 'https://example.com',
      };

      const result = await service.generatePdfQr(options);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 200, // default size for PDF
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should include title when provided', async () => {
      const options = {
        url: 'https://example.com',
        title: 'My QR Code',
      };

      const result = await service.generatePdfQr(options);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should apply custom colors in PDF', async () => {
      const options = {
        url: 'https://example.com',
        foregroundColor: '#FF0000',
        backgroundColor: '#00FF00',
      };

      await service.generatePdfQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 200,
        margin: 2,
        color: {
          dark: '#FF0000',
          light: '#00FF00',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply custom size in PDF', async () => {
      const options = {
        url: 'https://example.com',
        size: 300,
      };

      await service.generatePdfQr(options);

      expect(QRCode.toBuffer).toHaveBeenCalledWith('https://example.com', {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });
  });

  describe('generateSvgQr', () => {
    beforeEach(() => {
      (QRCode.toString as jest.Mock).mockResolvedValue('<svg>QR Code</svg>');
    });

    it('should generate valid SVG string', async () => {
      const result = await service.generateSvgQr('https://example.com', {});

      expect(typeof result).toBe('string');
      expect(result).toContain('<svg>');
      expect(QRCode.toString).toHaveBeenCalledWith('https://example.com', {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply custom colors in SVG', async () => {
      await service.generateSvgQr('https://example.com', {
        color: '#FF0000',
        bgcolor: '#0000FF',
      });

      expect(QRCode.toString).toHaveBeenCalledWith('https://example.com', {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#FF0000',
          light: '#0000FF',
        },
        errorCorrectionLevel: 'M',
      });
    });

    it('should apply custom size in SVG', async () => {
      await service.generateSvgQr('https://example.com', {
        size: 500,
      });

      expect(QRCode.toString).toHaveBeenCalledWith('https://example.com', {
        type: 'svg',
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    });
  });

  describe('batchGenerateQr', () => {
    beforeEach(() => {
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(Buffer.from('qr-code-buffer'));
      (QRCode.toString as jest.Mock).mockResolvedValue('<svg>QR Code</svg>');
    });

    it('should generate ZIP with all QRs in PNG format', async () => {
      const links = [
        { ...mockLink, id: 'link-1', slug: 'slug-1', qrCode: mockQrConfig },
        { ...mockLink, id: 'link-2', slug: 'slug-2', qrCode: null },
      ];

      (prismaService.link.findMany as jest.Mock).mockResolvedValue(links);

      const result = await service.batchGenerateQr(['link-1', 'link-2'], 'png', 300);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(prismaService.link.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['link-1', 'link-2'] } },
        include: { qrCode: true },
      });
    });

    it('should generate ZIP with all QRs in SVG format', async () => {
      const links = [
        { ...mockLink, id: 'link-1', slug: 'slug-1', qrCode: mockQrConfig },
        { ...mockLink, id: 'link-2', slug: 'slug-2', qrCode: null },
      ];

      (prismaService.link.findMany as jest.Mock).mockResolvedValue(links);

      const result = await service.batchGenerateQr(['link-1', 'link-2'], 'svg', 300);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(QRCode.toString).toHaveBeenCalled();
    });

    it('should generate ZIP with all QRs in PDF format', async () => {
      const links = [
        { ...mockLink, id: 'link-1', slug: 'slug-1', qrCode: mockQrConfig },
      ];

      (prismaService.link.findMany as jest.Mock).mockResolvedValue(links);

      const result = await service.batchGenerateQr(['link-1'], 'pdf', 300);

      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should throw NotFoundException when no links found', async () => {
      (prismaService.link.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.batchGenerateQr(['non-existent'], 'png', 300)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.batchGenerateQr(['non-existent'], 'png', 300)).rejects.toThrow(
        'No links found',
      );
    });

    it('should use default format when not specified', async () => {
      const links = [
        { ...mockLink, id: 'link-1', slug: 'slug-1', qrCode: mockQrConfig },
      ];

      (prismaService.link.findMany as jest.Mock).mockResolvedValue(links);

      const result = await service.batchGenerateQr(['link-1']);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(QRCode.toBuffer).toHaveBeenCalled();
    });

    it('should handle links with custom QR configs', async () => {
      const customConfig = {
        ...mockQrConfig,
        foregroundColor: '#FF0000',
        backgroundColor: '#0000FF',
        borderSize: 4,
        errorCorrection: 'H',
      };
      const links = [
        { ...mockLink, id: 'link-1', slug: 'slug-1', qrCode: customConfig },
      ];

      (prismaService.link.findMany as jest.Mock).mockResolvedValue(links);

      await service.batchGenerateQr(['link-1'], 'png', 300);

      expect(QRCode.toBuffer).toHaveBeenCalled();
    });
  });

  describe('deleteQrConfig', () => {
    it('should delete QR config for a link', async () => {
      (prismaService.qrCode.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.deleteQrConfig('link-123');

      expect(prismaService.qrCode.deleteMany).toHaveBeenCalledWith({
        where: { linkId: 'link-123' },
      });
    });
  });

  describe('generateQrCode', () => {
    beforeEach(() => {
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      );
      (storageService.uploadFile as jest.Mock).mockResolvedValue('https://cdn.example.com/qr/test-slug.png');
    });

    it('should generate and upload QR code', async () => {
      const result = await service.generateQrCode('https://example.com', 'test-slug');

      expect(result.qrCodeUrl).toBe('https://cdn.example.com/qr/test-slug.png');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('https://example.com');
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        'qr/test-slug.png',
        expect.any(Buffer),
        'image/png',
      );
    });

    it('should throw error when QR generation fails', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'));

      await expect(service.generateQrCode('https://example.com', 'test-slug')).rejects.toThrow(
        'Failed to generate QR code',
      );
    });
  });

  describe('generateCustomQr', () => {
    beforeEach(() => {
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      );
    });

    it('should generate QR code with default colors', async () => {
      const result = await service.generateCustomQr('https://example.com', {});

      expect(result.dataUrl).toContain('data:image/png;base64,');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('https://example.com', {
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        margin: 1,
      });
    });

    it('should generate QR code with custom colors', async () => {
      const result = await service.generateCustomQr('https://example.com', {
        color: '#FF0000',
        bgcolor: '#0000FF',
      });

      expect(result.dataUrl).toContain('data:image/png;base64,');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('https://example.com', {
        color: {
          dark: '#FF0000',
          light: '#0000FF',
        },
        margin: 1,
      });
    });
  });

  describe('uploadLogoToR2', () => {
    beforeEach(() => {
      (storageService.uploadFile as jest.Mock).mockResolvedValue('https://cdn.example.com/qr-logos/link-123.png');
    });

    it('should upload base64 logo with data URI prefix', async () => {
      const base64Logo =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await service.uploadLogoToR2(base64Logo, 'link-123');

      expect(result).toBe('https://cdn.example.com/qr-logos/link-123.png');
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        'qr-logos/link-123.png',
        expect.any(Buffer),
        'image/png',
      );
    });

    it('should upload base64 logo without data URI prefix', async () => {
      const base64Logo =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await service.uploadLogoToR2(base64Logo, 'link-123');

      expect(result).toBe('https://cdn.example.com/qr-logos/link-123.png');
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException when upload fails', async () => {
      (storageService.uploadFile as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      const base64Logo =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await expect(service.uploadLogoToR2(base64Logo, 'link-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadLogoToR2(base64Logo, 'link-123')).rejects.toThrow(
        'Failed to upload logo',
      );
    });
  });
});
