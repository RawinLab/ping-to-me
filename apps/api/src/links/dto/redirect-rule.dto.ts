import { IsString, IsOptional, IsArray, IsInt, IsBoolean, Min, Max, IsUrl, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRedirectRuleDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  devices?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  browsers?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  os?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsObject()
  @IsOptional()
  dateRange?: { start?: string; end?: string };

  @IsObject()
  @IsOptional()
  timeRange?: { start?: string; end?: string };

  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  targetUrl: string;

  @IsInt()
  @Min(301)
  @Max(302)
  @IsOptional()
  redirectType?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRedirectRuleDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  devices?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  browsers?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  os?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsObject()
  @IsOptional()
  dateRange?: { start?: string; end?: string };

  @IsObject()
  @IsOptional()
  timeRange?: { start?: string; end?: string };

  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  @IsOptional()
  targetUrl?: string;

  @IsInt()
  @Min(301)
  @Max(302)
  @IsOptional()
  redirectType?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ReorderRedirectRulesDto {
  @IsArray()
  @IsString({ each: true })
  ruleIds: string[];
}
