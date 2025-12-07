import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CheckSlugDto {
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  @MaxLength(50, { message: 'Slug must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Slug can only contain letters, numbers, hyphens, and underscores',
  })
  slug: string;

  @IsOptional()
  @IsString()
  domainId?: string;
}
