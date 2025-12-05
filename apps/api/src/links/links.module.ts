import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QrCodeModule } from '../qr/qr.module';

@Module({
  imports: [PrismaModule, QrCodeModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule { }
