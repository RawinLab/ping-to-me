import { Injectable, BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';

export interface QrCodeOptions {
  url: string;
  foregroundColor?: string; // Hex color e.g. #000000
  backgroundColor?: string; // Hex color e.g. #FFFFFF
  logo?: string; // Base64 encoded image or URL
  logoSize?: number; // Logo size as percentage of QR code (10-30%)
  size?: number; // QR code size in pixels (default 300)
  margin?: number; // Margin around QR code (default 2)
}

@Injectable()
export class QrCodeService {
  constructor(private readonly storageService: StorageService) { }

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
}
