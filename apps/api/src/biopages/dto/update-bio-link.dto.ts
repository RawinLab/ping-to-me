import { PartialType } from '@nestjs/mapped-types';
import { CreateBioLinkDto } from './create-bio-link.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateBioLinkDto extends PartialType(CreateBioLinkDto) {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
