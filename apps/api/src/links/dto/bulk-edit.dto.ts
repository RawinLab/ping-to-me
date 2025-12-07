import {
  IsArray,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LinkStatus } from '@pingtome/types';

class BulkChangesDto {
  @IsOptional()
  @IsEnum(LinkStatus, {
    message: 'Status must be one of: ACTIVE, DISABLED, ARCHIVED',
  })
  status?: LinkStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO 8601 date string' })
  expirationDate?: string;

  @IsOptional()
  @IsString()
  campaignId?: string | null;
}

export class BulkEditDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one link ID must be provided' })
  @ArrayMaxSize(100, { message: 'Cannot edit more than 100 links at once' })
  ids: string[];

  @ValidateNested()
  @Type(() => BulkChangesDto)
  changes: BulkChangesDto;
}
