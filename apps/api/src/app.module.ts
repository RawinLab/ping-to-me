import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { LinksModule } from "./links/links.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { DomainsModule } from "./domains/domains.module";
import { QrCodeModule } from "./qr/qr.module";
import { BioPageModule } from "./biopages/biopages.module";
import { OrganizationModule } from "./organizations/organization.module";
import { DeveloperModule } from "./developer/developer.module";
import { MailModule } from "./mail/mail.module";
import { TagsModule } from "./tags/tags.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { FoldersModule } from "./folders/folders.module";
import { PaymentsModule } from "./payments/payments.module";
import { AuditModule } from "./audit/audit.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { QuotaModule } from "./quota/quota.module";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDisabled = config.get("THROTTLE_DISABLED") === "true";
        const ttl = parseInt(config.get("THROTTLE_TTL") || "60000", 10);
        const limit = parseInt(config.get("THROTTLE_LIMIT") || "100", 10);

        if (isDisabled) {
          // Return very high limits to effectively disable throttling
          return [
            {
              ttl: 1000,
              limit: 10000,
            },
          ];
        }

        return [
          {
            ttl,
            limit,
          },
        ];
      },
    }),
    AuthModule,
    LinksModule,
    AnalyticsModule,
    DomainsModule,
    QrCodeModule,
    BioPageModule,
    OrganizationModule,
    DeveloperModule,
    MailModule,
    TagsModule,
    CampaignsModule,
    NotificationsModule,
    FoldersModule,
    PaymentsModule,
    AuditModule,
    InvitationsModule,
    QuotaModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
