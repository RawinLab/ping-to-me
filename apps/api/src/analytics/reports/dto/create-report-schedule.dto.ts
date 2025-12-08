import {
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
  Max,
  Matches,
  IsEmail,
  IsArray,
  IsString,
} from 'class-validator';
import { ReportFrequency } from '@prisma/client';

export class CreateReportScheduleDto {
  @IsOptional()
  @IsUUID()
  linkId?: string;

  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @IsOptional()
  @Min(0)
  @Max(6)
  dayOfWeek?: number; // 0-6 for weekly (0=Sunday)

  @IsOptional()
  @Min(1)
  @Max(31)
  dayOfMonth?: number; // 1-31 for monthly

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
}
