import { Module } from '@nestjs/common';
import { DomainsController } from './domains.controller';
import { DomainService } from './domains.service';

@Module({
  controllers: [DomainsController],
  providers: [DomainService],
})
export class DomainsModule { }
