import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { CreateLinkDto } from './create-link.dto';
import { LinkStatus } from '@pingtome/types';

export class UpdateLinkDto extends PartialType(CreateLinkDto) {
  @IsOptional()
  @IsEnum(LinkStatus, {
    message: 'Status must be one of: ACTIVE, EXPIRED, DISABLED, ARCHIVED, BANNED',
  })
  status?: LinkStatus;

  @IsOptional()
  @IsString()
  campaignId?: string | null;
}
