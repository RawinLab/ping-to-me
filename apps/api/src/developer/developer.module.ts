import { Module } from "@nestjs/common";
import { DeveloperController } from "./developer.controller";
import { ApiKeyService } from "./api-keys.service";
import { WebhookService } from "./webhooks.service";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DeveloperController],
  providers: [ApiKeyService, WebhookService],
  exports: [ApiKeyService, WebhookService],
})
export class DeveloperModule {}
