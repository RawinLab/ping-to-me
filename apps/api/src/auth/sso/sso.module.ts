import { Module, forwardRef } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule } from "@nestjs/config";
import { SSOController } from "./sso.controller";
import { SSOService } from "./sso.service";
import { SamlStrategy } from "./saml.strategy";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth.module";
import { AuditModule } from "../../audit/audit.module";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => AuditModule),
  ],
  controllers: [SSOController],
  providers: [SSOService, SamlStrategy],
  exports: [SSOService],
})
export class SSOModule {}
