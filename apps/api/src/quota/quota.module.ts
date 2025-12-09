import { Module, Global } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { QuotaService } from "./quota.service";
import { QuotaController } from "./quota.controller";
import { QuotaCronService } from "./quota.cron";
import { ApiQuotaGuard } from "./guards/api-quota.guard";

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [QuotaController],
  providers: [QuotaService, QuotaCronService, ApiQuotaGuard],
  exports: [QuotaService, QuotaCronService, ApiQuotaGuard],
})
export class QuotaModule {}
