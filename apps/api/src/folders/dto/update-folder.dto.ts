import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateFolderDto } from './create-folder.dto';

export class UpdateFolderDto extends PartialType(OmitType(CreateFolderDto, ['orgId', 'parentId'] as const)) {}
