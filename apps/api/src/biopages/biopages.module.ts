import { Module } from '@nestjs/common';
import { BioPageController } from './biopages.controller';
import { BioPageService } from './biopages.service';

@Module({
  controllers: [BioPageController],
  providers: [BioPageService],
})
export class BioPageModule { }
