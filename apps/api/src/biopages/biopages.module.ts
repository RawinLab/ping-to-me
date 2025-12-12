import { Module } from "@nestjs/common";
import { BioPageController } from "./biopages.controller";
import { BioPageService } from "./biopages.service";
import { QrCodeModule } from "../qr/qr.module";
import { AuthModule } from "../auth/auth.module";
import { DeveloperModule } from "../developer/developer.module";

@Module({
  imports: [QrCodeModule, AuthModule, DeveloperModule],
  controllers: [BioPageController],
  providers: [BioPageService],
})
export class BioPageModule {}
