import {
  IsOptional,
  IsArray,
  IsString,
  IsDateString,
  IsEnum,
  ArrayMaxSize,
} from 'class-validator';
import { LinkStatus } from '@pingtome/types';

export class ExportFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsEnum(LinkStatus)
  status?: LinkStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['csv', 'json'])
  format?: 'csv' | 'json';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(1000)
  selectedIds?: string[];

  @IsOptional()
  @IsString()
  organizationId?: string;
}
