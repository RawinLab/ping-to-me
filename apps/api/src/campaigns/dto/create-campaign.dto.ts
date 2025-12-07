import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsDateString, IsEnum, IsInt, Min } from 'class-validator';

export enum CampaignGoalType {
  CLICKS = 'clicks',
  CONVERSIONS = 'conversions',
}

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  orgId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(CampaignGoalType)
  goalType?: CampaignGoalType;

  @IsOptional()
  @IsInt()
  @Min(1)
  goalTarget?: number;

  // UTM fields
  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmMedium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmTerm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  utmContent?: string;
}
