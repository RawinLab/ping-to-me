import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpireLinksTask } from './expire-links.task';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PrismaService, ExpireLinksTask],
  exports: [ExpireLinksTask],
})
export class TasksModule {}
