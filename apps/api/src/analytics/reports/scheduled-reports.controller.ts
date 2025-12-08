import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ScheduledReportsService } from './scheduled-reports.service';
import { CreateReportScheduleDto, UpdateReportScheduleDto } from './dto';

@Controller('analytics/reports/schedules')
@UseGuards(JwtAuthGuard)
export class ScheduledReportsController {
  constructor(
    private readonly scheduledReportsService: ScheduledReportsService,
  ) {}

  @Post()
  async createSchedule(@Request() req, @Body() dto: CreateReportScheduleDto) {
    return this.scheduledReportsService.createSchedule(req.user.id, dto);
  }

  @Get()
  async getSchedules(@Request() req) {
    return this.scheduledReportsService.getSchedules(req.user.id);
  }

  @Get(':id')
  async getSchedule(@Request() req, @Param('id') id: string) {
    return this.scheduledReportsService.getSchedule(id, req.user.id);
  }

  @Patch(':id')
  async updateSchedule(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateReportScheduleDto,
  ) {
    return this.scheduledReportsService.updateSchedule(id, req.user.id, dto);
  }

  @Delete(':id')
  async deleteSchedule(@Request() req, @Param('id') id: string) {
    return this.scheduledReportsService.deleteSchedule(id, req.user.id);
  }
}
