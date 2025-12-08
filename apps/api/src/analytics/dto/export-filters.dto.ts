import { IsOptional, IsDateString, IsEnum, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json' = 'csv';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  limit?: number = 10000;
}
