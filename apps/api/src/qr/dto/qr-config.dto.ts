import { IsString, IsOptional, IsNumber, IsIn, Min, Max, Matches } from 'class-validator';

export class CreateQrConfigDto {
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Foreground color must be a valid hex color' })
  foregroundColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background color must be a valid hex color' })
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(30)
  logoSizePercent?: number;

  @IsOptional()
  @IsIn(['L', 'M', 'Q', 'H'])
  errorCorrection?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  borderSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(1000)
  size?: number;
}

export class UpdateQrConfigDto extends CreateQrConfigDto {}
