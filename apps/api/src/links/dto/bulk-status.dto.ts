import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, IsEnum } from 'class-validator';
import { LinkStatus } from '@pingtome/types';

export class BulkStatusDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one link ID must be provided' })
  @ArrayMaxSize(100, { message: 'Cannot update status for more than 100 links at once' })
  ids: string[];

  @IsEnum(LinkStatus, {
    message: 'Status must be one of: ACTIVE, EXPIRED, DISABLED, ARCHIVED, BANNED',
  })
  status: LinkStatus;
}
