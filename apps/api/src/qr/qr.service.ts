import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrConfigDto } from './dto/qr-config.dto';

export interface QrCodeOptions {
  url: string;
  foregroundColor?: string; // Hex color e.g. #000000
  backgroundColor?: string; // Hex color e.g. #FFFFFF
  logo?: string; // Base64 encoded image or URL
  logoSize?: number; // Logo size as percentage of QR code (10-30%)
  size?: number; // QR code size in pixels (default 300)
  margin?: number; // Margin around QR code (default 2)
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
}

export interface QrCodeConfigResponse {
  id: string;
  linkId: string;
  foregroundColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  logoSizePercent: number;
  errorCorrection: string;
  borderSize: number;
  size: number;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class QrCodeService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) { }

  async generateQrCode(url: string, slug: string) {
    try {
      // Generate QR code as Data URL
      const dataUrl = await QRCode.toDataURL(url);

      // Convert Data URL to Buffer for upload
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to R2
      const key = `qr/${slug}.png`;
      const publicUrl = await this.storageService.uploadFile(key, buffer, 'image/png');

      return { qrCodeUrl: publicUrl };
    } catch (err) {
      console.error('QR Generation Error:', err);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateCustomQr(url: string, options: { color?: string; bgcolor?: string }) {
    try {
      const { color = '#000000', bgcolor = '#ffffff' } = options;

      const dataUrl = await QRCode.toDataURL(url, {
        color: {
          dark: color,
          light: bgcolor,
        },
        margin: 1,
      });

      return { dataUrl };
    } catch (err) {
      console.error('QR Generation Error:', err);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateAdvancedQr(options: QrCodeOptions): Promise<{ dataUrl: string }> {
    const {
      url,
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF',
      logo,
      logoSize = 20,
      size = 300,
      margin = 2,
    } = options;

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      throw new BadRequestException('Invalid URL format');
    }

    // Validate colors
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(foregroundColor)) {
      throw new BadRequestException('Invalid foreground color format. Use hex format like #000000');
    }
    if (!hexColorRegex.test(backgroundColor)) {
      throw new BadRequestException('Invalid background color format. Use hex format like #FFFFFF');
    }

    // Use high error correction when logo is present
    const errorCorrectionLevel = logo ? 'H' : 'M';

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: size,
      margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
      errorCorrectionLevel,
    });

    // If no logo, return the QR code as base64
    if (!logo) {
      return { dataUrl: `data:image/png;base64,${qrBuffer.toString('base64')}` };
    }

    // Process with logo
    try {
      const qrCodeWithLogo = await this.addLogoToQrCode(qrBuffer, logo, size, logoSize);
      return { dataUrl: `data:image/png;base64,${qrCodeWithLogo.toString('base64')}` };
    } catch (e) {
      console.error('Failed to add logo to QR code:', e);
      // Return QR code without logo if logo processing fails
      return { dataUrl: `data:image/png;base64,${qrBuffer.toString('base64')}` };
    }
  }

  private async addLogoToQrCode(
    qrBuffer: Buffer,
    logo: string,
    qrSize: number,
    logoSizePercent: number,
  ): Promise<Buffer> {
    // Calculate logo dimensions (clamp between 10% and 30%)
    const logoMaxSize = Math.floor((qrSize * Math.min(Math.max(logoSizePercent, 10), 30)) / 100);

    // Get logo buffer
    let logoBuffer: Buffer;
    if (logo.startsWith('data:')) {
      // Base64 encoded image
      const base64Data = logo.split(',')[1];
      logoBuffer = Buffer.from(base64Data, 'base64');
    } else if (logo.startsWith('http://') || logo.startsWith('https://')) {
      // URL - fetch the image
      const response = await fetch(logo);
      if (!response.ok) {
        throw new Error('Failed to fetch logo from URL');
      }
      const arrayBuffer = await response.arrayBuffer();
      logoBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new BadRequestException('Logo must be a base64 data URI or a valid URL');
    }

    // Resize logo to fit
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoMaxSize, logoMaxSize, {
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Get logo metadata for positioning
    const logoMetadata = await sharp(resizedLogo).metadata();
    const logoWidth = logoMetadata.width || logoMaxSize;
    const logoHeight = logoMetadata.height || logoMaxSize;

    // Calculate center position
    const left = Math.floor((qrSize - logoWidth) / 2);
    const top = Math.floor((qrSize - logoHeight) / 2);

    // Create white background for logo (for better visibility)
    const padding = 6;
    const bgWidth = logoWidth + padding * 2;
    const bgHeight = logoHeight + padding * 2;

    // Create rounded rectangle background
    const roundedBg = Buffer.from(
      `<svg width="${bgWidth}" height="${bgHeight}">
        <rect x="0" y="0" width="${bgWidth}" height="${bgHeight}" rx="8" ry="8" fill="white"/>
      </svg>`
    );

    // Composite: QR code + white background + logo
    const result = await sharp(qrBuffer)
      .composite([
        {
          input: roundedBg,
          left: left - padding,
          top: top - padding,
        },
        {
          input: resizedLogo,
          left,
          top,
        },
      ])
      .png()
      .toBuffer();

    return result;
  }

  async generateSvgQr(url: string, options: { color?: string; bgcolor?: string; size?: number }): Promise<string> {
    const { color = '#000000', bgcolor = '#FFFFFF', size = 300 } = options;

    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: color,
        light: bgcolor,
      },
      errorCorrectionLevel: 'M',
    });

    return svg;
  }

  // ============ QR Config Persistence Methods ============

  async getQrConfig(linkId: string): Promise<QrCodeConfigResponse | null> {
    const config = await this.prisma.qrCode.findUnique({
      where: { linkId },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      linkId: config.linkId,
      foregroundColor: config.foregroundColor,
      backgroundColor: config.backgroundColor,
      logoUrl: config.logoUrl,
      logoSizePercent: config.logoSizePercent,
      errorCorrection: config.errorCorrection,
      borderSize: config.borderSize,
      size: config.size,
      qrCodeUrl: config.qrCodeUrl,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async saveQrConfig(linkId: string, dto: CreateQrConfigDto): Promise<QrCodeConfigResponse> {
    // Verify link exists
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    // Upload logo to R2 if provided
    let logoUrl: string | undefined;
    if (dto.logo) {
      logoUrl = await this.uploadLogoToR2(dto.logo, linkId);
    }

    // Upsert QR config
    const config = await this.prisma.qrCode.upsert({
      where: { linkId },
      create: {
        linkId,
        foregroundColor: dto.foregroundColor || '#000000',
        backgroundColor: dto.backgroundColor || '#FFFFFF',
        logoUrl,
        logoSizePercent: dto.logoSizePercent || 20,
        errorCorrection: dto.errorCorrection || 'M',
        borderSize: dto.borderSize ?? 2,
        size: dto.size || 300,
      },
      update: {
        foregroundColor: dto.foregroundColor,
        backgroundColor: dto.backgroundColor,
        logoUrl: logoUrl || undefined,
        logoSizePercent: dto.logoSizePercent,
        errorCorrection: dto.errorCorrection,
        borderSize: dto.borderSize,
        size: dto.size,
      },
    });

    return {
      id: config.id,
      linkId: config.linkId,
      foregroundColor: config.foregroundColor,
      backgroundColor: config.backgroundColor,
      logoUrl: config.logoUrl,
      logoSizePercent: config.logoSizePercent,
      errorCorrection: config.errorCorrection,
      borderSize: config.borderSize,
      size: config.size,
      qrCodeUrl: config.qrCodeUrl,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async uploadLogoToR2(base64: string, linkId: string): Promise<string> {
    try {
      // Extract base64 data
      let buffer: Buffer;
      if (base64.startsWith('data:')) {
        const base64Data = base64.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(base64, 'base64');
      }

      // Resize to max 200x200 for storage efficiency
      const resizedBuffer = await sharp(buffer)
        .resize(200, 200, { fit: 'inside' })
        .png()
        .toBuffer();

      // Upload to R2
      const key = `qr-logos/${linkId}.png`;
      const publicUrl = await this.storageService.uploadFile(key, resizedBuffer, 'image/png');

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload logo to R2:', error);
      throw new BadRequestException('Failed to upload logo');
    }
  }

  async deleteQrConfig(linkId: string): Promise<void> {
    await this.prisma.qrCode.deleteMany({
      where: { linkId },
    });
  }
}
