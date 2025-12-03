import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { StorageService } from '../storage/storage.service';

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
}
