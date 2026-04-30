import {
  IsUrl,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateLinkDto {
  @IsUrl({}, { message: 'Original URL must be a valid URL' })
  @MaxLength(2048, { message: 'Original URL must not exceed 2048 characters' })
  originalUrl: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Slug must be at least 3 characters long' })
  @MaxLength(50, { message: 'Slug must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Slug can only contain letters, numbers, hyphens, and underscores',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid ISO 8601 date string' })
  expirationDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxClicks?: number;

  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password?: string;

  @IsOptional()
  @IsEnum([301, 302], { message: 'Redirect type must be either 301 or 302' })
  redirectType?: 301 | 302;

  @IsOptional()
  @IsUrl({}, { message: 'Deep link fallback must be a valid URL' })
  deepLinkFallback?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  domainId?: string;

  @IsOptional()
  @IsString()
  qrColor?: string;

  @IsOptional()
  @IsString()
  qrLogo?: string;

  @IsOptional()
  @IsBoolean()
  generateQrCode?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDuplicate?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: 'Show interstitial page before redirect' })
  interstitial?: boolean;

  @IsOptional()
  @IsInt()
  @IsIn([0, 5, 10, 15, 30], { message: 'Countdown must be 0, 5, 10, 15, or 30 seconds' })
  @ApiProperty({ required: false, description: 'Countdown timer seconds (0, 5, 10, 15, 30)', enum: [0, 5, 10, 15, 30] })
  countdownSeconds?: number;
}
