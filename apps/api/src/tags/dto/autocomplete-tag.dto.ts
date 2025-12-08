import { IsString, IsOptional, IsUUID, IsInt, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AutocompleteTagDto {
  @IsString()
  @MinLength(1)
  q: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
