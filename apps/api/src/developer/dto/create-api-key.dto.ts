import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  ArrayMinSize,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for creating a new API key with scopes and optional restrictions
 */
export class CreateApiKeyDto {
  /**
   * Human-readable name for the API key
   * @example "Production API Key"
   */
  @ApiProperty({
    description: "Human-readable name for the API key",
    example: "Production API Key",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /**
   * Organization ID this API key belongs to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: "Organization ID this API key belongs to",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  /**
   * Array of permission scopes granted to this API key
   * If not provided, defaults to ['admin'] for full access
   * Must have at least one scope when provided
   * @example ["link:read", "link:create", "analytics:read"]
   */
  @ApiPropertyOptional({
    description:
      'Array of permission scopes. If not provided, defaults to ["admin"] for full access. Must have at least one scope when provided.',
    example: ["link:read", "link:create", "analytics:read"],
    type: [String],
    default: ["admin"],
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, { message: "At least one scope is required" })
  @IsString({ each: true })
  scopes?: string[];

  /**
   * Optional IP whitelist for additional security
   * Only requests from these IPs will be accepted
   * Supports both IPv4 addresses and CIDR notation
   * @example ["192.168.1.1", "10.0.0.0/8"]
   */
  @ApiPropertyOptional({
    description:
      "Optional IP whitelist. Supports IPv4 addresses and CIDR notation",
    example: ["192.168.1.1", "10.0.0.0/8"],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  ipWhitelist?: string[];

  /**
   * Optional rate limit in requests per minute
   * If not set, organization default or global limit applies
   * @example 1000
   */
  @ApiPropertyOptional({
    description:
      "Optional rate limit in requests per minute. If not set, organization default applies",
    example: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  rateLimit?: number;

  /**
   * Optional expiration date for the API key (ISO 8601 format)
   * If not set, the key never expires
   * @example "2024-12-31T23:59:59Z"
   */
  @ApiPropertyOptional({
    description:
      "Optional expiration date (ISO 8601). If not set, key never expires",
    example: "2024-12-31T23:59:59Z",
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
