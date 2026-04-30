import { IsString, IsOptional, IsHexColor, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_\-\s]+$/, { message: 'Tag name can only contain letters, numbers, underscores, hyphens, and spaces' })
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}
