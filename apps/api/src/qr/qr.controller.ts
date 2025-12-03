import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { QrCodeService } from './qr.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('qr')
@UseGuards(AuthGuard)
export class QrCodeController {
  constructor(private readonly qrService: QrCodeService) { }

  @Post('generate')
  async generate(@Request() req, @Body() body: { url: string; slug: string }) {
    return this.qrService.generateQrCode(body.url, body.slug);
  }

  @Post('custom')
  async custom(@Body() body: { url: string; color?: string; bgcolor?: string }) {
    return this.qrService.generateCustomQr(body.url, {
      color: body.color,
      bgcolor: body.bgcolor,
    });
  }
}
