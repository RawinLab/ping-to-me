import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckQuotaDto {
  @ApiProperty({
    description: 'Resource type to check',
    enum: ['links', 'domains', 'members', 'api_calls'],
    example: 'links'
  })
  @IsString()
  @IsIn(['links', 'domains', 'members', 'api_calls'])
  resource: 'links' | 'domains' | 'members' | 'api_calls';
}

export class QuotaCheckResultDto {
  @ApiProperty({ description: 'Whether the action is allowed' })
  allowed: boolean;

  @ApiPropertyOptional({ description: 'True if limit is unlimited' })
  unlimited?: boolean;

  @ApiProperty({ description: 'Current usage count' })
  currentUsage: number;

  @ApiProperty({ description: 'Maximum limit (-1 for unlimited)' })
  limit: number;

  @ApiProperty({ description: 'Remaining quota (-1 for unlimited)' })
  remaining: number;

  @ApiProperty({ description: 'Percentage used (0-100)' })
  percentUsed: number;
}

export class UsageDataDto {
  @ApiProperty({ description: 'Links created this month' })
  links: number;

  @ApiProperty({ description: 'Custom domains count' })
  domains: number;

  @ApiProperty({ description: 'Team members count' })
  members: number;

  @ApiProperty({ description: 'API calls this month' })
  apiCalls: number;
}

export class PlanLimitsDto {
  @ApiProperty({ description: 'Monthly link limit (-1 = unlimited)' })
  linksPerMonth: number;

  @ApiProperty({ description: 'Custom domains limit (-1 = unlimited)' })
  customDomains: number;

  @ApiProperty({ description: 'Team members limit (-1 = unlimited)' })
  teamMembers: number;

  @ApiProperty({ description: 'Monthly API calls limit (-1 = unlimited)' })
  apiCallsPerMonth: number;

  @ApiProperty({ description: 'Analytics data retention in days' })
  analyticsRetentionDays: number;
}

export class FullQuotaStatusDto {
  @ApiProperty({ description: 'Current plan name' })
  plan: string;

  @ApiProperty({ description: 'Plan limits', type: PlanLimitsDto })
  limits: PlanLimitsDto;

  @ApiProperty({ description: 'Current usage', type: UsageDataDto })
  usage: UsageDataDto;

  @ApiProperty({ description: 'Quota status per resource' })
  quotas: Record<string, QuotaCheckResultDto>;
}

export class UsageHistoryItemDto {
  @ApiProperty({ description: 'Record ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Year-month in YYYY-MM format' })
  yearMonth: string;

  @ApiProperty({ description: 'Links created in this period' })
  linksCreated: number;

  @ApiProperty({ description: 'API calls in this period' })
  apiCalls: number;

  @ApiProperty({ description: 'Record creation date' })
  createdAt: Date;
}
