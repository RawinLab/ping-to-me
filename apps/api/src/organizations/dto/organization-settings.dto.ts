import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for getting organization settings response
 */
export class GetOrganizationSettingsDto {
  @ApiProperty({
    description: "Settings ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Organization ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  organizationId: string;

  @ApiPropertyOptional({
    description: "IP allowlist (array of IP addresses or CIDR ranges)",
    example: ["192.168.1.1", "10.0.0.0/8"],
    type: [String],
  })
  ipAllowlist?: string[];

  @ApiProperty({
    description: "Whether SSO is enabled",
    example: false,
  })
  ssoEnabled: boolean;

  @ApiPropertyOptional({
    description: "SSO provider ID",
    example: "google-workspace",
  })
  ssoProviderId?: string;

  @ApiProperty({
    description: "Whether 2FA is enforced for all members",
    example: false,
  })
  enforced2FA: boolean;

  @ApiPropertyOptional({
    description: "Roles that require 2FA (e.g., ['OWNER', 'ADMIN'])",
    example: ["OWNER", "ADMIN"],
    type: [String],
  })
  enforce2FAForRoles?: string[];

  @ApiProperty({
    description: "Session timeout in seconds",
    example: 7200,
  })
  sessionTimeout: number;

  @ApiProperty({
    description: "Created at timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Updated at timestamp",
    example: "2024-01-01T00:00:00Z",
  })
  updatedAt: Date;
}

/**
 * DTO for updating organization settings
 */
export class UpdateOrganizationSettingsDto {
  @ApiPropertyOptional({
    description: "IP allowlist (array of IP addresses or CIDR ranges)",
    example: ["192.168.1.1", "10.0.0.0/8"],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  ipAllowlist?: string[];

  @ApiPropertyOptional({
    description: "Whether SSO is enabled",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  ssoEnabled?: boolean;

  @ApiPropertyOptional({
    description: "SSO provider ID",
    example: "google-workspace",
  })
  @IsString()
  @IsOptional()
  ssoProviderId?: string;

  @ApiPropertyOptional({
    description: "Whether 2FA is enforced for all members",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  enforced2FA?: boolean;

  @ApiPropertyOptional({
    description: "Roles that require 2FA (e.g., ['OWNER', 'ADMIN'])",
    example: ["OWNER", "ADMIN"],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  enforce2FAForRoles?: string[];

  @ApiPropertyOptional({
    description: "Session timeout in seconds (min: 300, max: 86400)",
    example: 7200,
    minimum: 300,
    maximum: 86400,
  })
  @IsInt()
  @IsOptional()
  @Min(300) // 5 minutes minimum
  @Max(86400) // 24 hours maximum
  sessionTimeout?: number;
}
