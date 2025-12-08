import {
  IsEnum,
  IsOptional,
  Min,
  Max,
  Matches,
  IsEmail,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ReportFrequency } from '@prisma/client';

export class UpdateReportScheduleDto {
  @IsOptional()
  @IsEnum(ReportFrequency)
  frequency?: ReportFrequency;

  @IsOptional()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'time must be in HH:mm format',
  })
  time?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(['pdf', 'csv'])
  format?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
