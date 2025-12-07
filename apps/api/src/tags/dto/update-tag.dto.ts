import { PartialType } from '@nestjs/mapped-types';
import { CreateTagDto } from './create-tag.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateTagDto extends PartialType(OmitType(CreateTagDto, ['orgId'] as const)) {}
