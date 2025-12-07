import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one link ID must be provided' })
  @ArrayMaxSize(100, { message: 'Cannot delete more than 100 links at once' })
  ids: string[];
}
