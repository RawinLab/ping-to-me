import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DomainsModule } from './domains/domains.module';
import { QrCodeModule } from './qr/qr.module';
import { BioPageModule } from './biopages/biopages.module';
import { OrganizationModule } from './organizations/organization.module';
import { DeveloperModule } from './developer/developer.module';
import { MailModule } from './mail/mail.module';
import { TagsModule } from './tags/tags.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FoldersModule } from './folders/folders.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
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
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
