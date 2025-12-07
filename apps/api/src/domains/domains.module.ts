import { Module } from '@nestjs/common';
import { DomainsController } from './domains.controller';
import { DomainService } from './domains.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DomainsController],
  providers: [DomainService],
})
export class DomainsModule { }
