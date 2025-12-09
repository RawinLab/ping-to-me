import {
  IsString,
  IsInt,
  IsDecimal,
  IsOptional,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan internal name (lowercase, no spaces)',
    example: 'pro',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Plan name must be at least 2 characters' })
  @MaxLength(50, { message: 'Plan name must not exceed 50 characters' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Plan name must be lowercase alphanumeric with hyphens only',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  name: string;

  @ApiProperty({
    description: 'Plan display name',
    example: 'Pro',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
  displayName: string;

  @ApiProperty({
    description: 'Links allowed per month (-1 for unlimited)',
    example: 10000,
    minimum: -1,
  })
  @IsInt({ message: 'Links per month must be an integer' })
  @Min(-1, { message: 'Links per month must be -1 (unlimited) or positive' })
  @Type(() => Number)
  linksPerMonth: number;

  @ApiProperty({
    description: 'Number of custom domains allowed',
    example: 5,
    minimum: 0,
  })
  @IsInt({ message: 'Custom domains must be an integer' })
  @Min(0, { message: 'Custom domains must be 0 or positive' })
  @Type(() => Number)
  customDomains: number;

  @ApiProperty({
    description: 'Number of team members allowed',
    example: 10,
    minimum: 1,
  })
  @IsInt({ message: 'Team members must be an integer' })
  @Min(1, { message: 'Team members must be at least 1' })
  @Type(() => Number)
  teamMembers: number;

  @ApiProperty({
    description: 'API calls allowed per month (-1 for unlimited)',
    example: 100000,
    minimum: -1,
  })
  @IsInt({ message: 'API calls per month must be an integer' })
  @Min(-1, { message: 'API calls per month must be -1 (unlimited) or positive' })
  @Type(() => Number)
  apiCallsPerMonth: number;

  @ApiProperty({
    description: 'Analytics retention in days',
    example: 90,
    minimum: 1,
  })
  @IsInt({ message: 'Analytics retention days must be an integer' })
  @Min(1, { message: 'Analytics retention days must be at least 1' })
  @Type(() => Number)
  analyticsRetentionDays: number;

  @ApiProperty({
    description: 'Monthly price in USD',
    example: 29.99,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Monthly price must be a valid decimal with up to 2 decimal places' })
  @Transform(({ value }) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Monthly price must be a positive number');
    }
    return num.toFixed(2);
  })
  priceMonthly: string;

  @ApiProperty({
    description: 'Yearly price in USD',
    example: 299.99,
    type: Number,
  })
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Yearly price must be a valid decimal with up to 2 decimal places' })
  @Transform(({ value }) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Yearly price must be a positive number');
    }
    return num.toFixed(2);
  })
  priceYearly: string;

  @ApiPropertyOptional({
    description: 'Stripe monthly price ID',
    example: 'price_1234567890',
  })
  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @ApiPropertyOptional({
    description: 'Stripe yearly price ID',
    example: 'price_0987654321',
  })
  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;

  @ApiPropertyOptional({
    description: 'Plan features (array of feature strings)',
    example: ['Custom Branding', 'Advanced Analytics', 'Priority Support', 'API Access'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Each feature must be a string' })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Whether the plan is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
