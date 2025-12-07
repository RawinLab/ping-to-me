import { Module } from "@nestjs/common";
import { BioPageController } from "./biopages.controller";
import { BioPageService } from "./biopages.service";
import { QrCodeModule } from "../qr/qr.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [QrCodeModule, AuthModule],
  controllers: [BioPageController],
  providers: [BioPageService],
})
export class BioPageModule {}
