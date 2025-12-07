import { Module } from '@nestjs/common';
import { BioPageController } from './biopages.controller';
import { BioPageService } from './biopages.service';
import { QrCodeModule } from '../qr/qr.module';

@Module({
  imports: [QrCodeModule],
  controllers: [BioPageController],
  providers: [BioPageService],
})
export class BioPageModule { }
