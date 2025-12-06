import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum ClickSource {
  DIRECT = 'DIRECT',
  QR = 'QR',
  API = 'API',
}

export class TrackClickDto {
  @IsString()
  slug: string;

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsEnum(ClickSource)
  @IsOptional()
  source?: ClickSource;
}
