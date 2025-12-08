import { Module } from "@nestjs/common";
import { LinksService } from "./links.service";
import { LinksController } from "./links.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { QrCodeModule } from "../qr/qr.module";
import { AuthModule } from "../auth/auth.module";
import { QuotaModule } from "../quota/quota.module";
import { SafetyCheckService } from "./services/safety-check.service";
import { MetadataService } from "./services/metadata.service";

@Module({
  imports: [PrismaModule, QrCodeModule, AuthModule, QuotaModule],
  controllers: [LinksController],
  providers: [LinksService, SafetyCheckService, MetadataService],
  exports: [LinksService, SafetyCheckService, MetadataService],
})
export class LinksModule {}
