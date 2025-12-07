import { Module, Global } from "@nestjs/common";
import { QuotaService } from "./quota.service";
import { QuotaController } from "./quota.controller";
import { ApiQuotaGuard } from "./guards/api-quota.guard";

@Global()
@Module({
  controllers: [QuotaController],
  providers: [QuotaService, ApiQuotaGuard],
  exports: [QuotaService, ApiQuotaGuard],
})
export class QuotaModule {}
