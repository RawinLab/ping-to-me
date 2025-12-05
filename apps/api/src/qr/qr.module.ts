import { Module } from '@nestjs/common';
import { QrCodeController } from './qr.controller';
import { QrCodeService } from './qr.service';
import { StorageService } from '../storage/storage.service';

@Module({
  controllers: [QrCodeController],
  providers: [QrCodeService, StorageService],
  exports: [QrCodeService],
})
export class QrCodeModule { }
