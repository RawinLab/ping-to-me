import { Module } from "@nestjs/common";
import { QrCodeController } from "./qr.controller";
import { QrCodeService } from "./qr.service";
import { StorageService } from "../storage/storage.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [QrCodeController],
  providers: [QrCodeService, StorageService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
