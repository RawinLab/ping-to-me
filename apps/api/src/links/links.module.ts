import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
import { LinkService } from './links.service';

@Module({
  controllers: [LinksController],
  providers: [LinkService],
})
export class LinksModule { }
