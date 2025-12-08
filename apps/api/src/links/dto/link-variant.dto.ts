import { IsString, IsOptional, IsInt, IsBoolean, Min, Max, IsUrl, MaxLength } from 'class-validator';

export class CreateLinkVariantDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsUrl()
  targetUrl: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  weight?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateLinkVariantDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsOptional()
  targetUrl?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  weight?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
