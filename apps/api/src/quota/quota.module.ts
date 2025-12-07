import { Module, Global } from "@nestjs/common";
import { QuotaService } from "./quota.service";
import { ApiQuotaGuard } from "./guards/api-quota.guard";

@Global()
@Module({
  providers: [QuotaService, ApiQuotaGuard],
  exports: [QuotaService, ApiQuotaGuard],
})
export class QuotaModule {}
