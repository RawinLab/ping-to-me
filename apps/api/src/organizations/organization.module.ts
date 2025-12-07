import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    MulterModule.register({
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
