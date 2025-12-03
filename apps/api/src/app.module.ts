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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    LinksModule,
    AnalyticsModule,
    DomainsModule,
    QrCodeModule,
    BioPageModule,
    OrganizationModule,
    DeveloperModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
