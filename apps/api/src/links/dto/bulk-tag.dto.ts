import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, MinLength, MaxLength } from 'class-validator';

export class BulkTagDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one link ID must be provided' })
  @ArrayMaxSize(100, { message: 'Cannot tag more than 100 links at once' })
  ids: string[];

  @IsString()
  @MinLength(1, { message: 'Tag name must not be empty' })
  @MaxLength(50, { message: 'Tag name must not exceed 50 characters' })
  tagName: string;
}
