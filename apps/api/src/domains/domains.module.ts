import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { DomainsController } from "./domains.controller";
import { DomainService } from "./domains.service";
import { SslService } from "./ssl.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  controllers: [DomainsController],
  providers: [DomainService, SslService],
  exports: [SslService], // Export for potential use in other modules
})
export class DomainsModule {}
