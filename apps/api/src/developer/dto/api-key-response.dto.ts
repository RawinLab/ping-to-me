import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Response DTO for API key creation
 * Contains the plain key which is only shown once
 */
export class ApiKeyCreatedResponseDto {
  /**
   * The plain text API key - ONLY shown once during creation
   * Must be stored securely by the client
   * @example "pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
   */
  @ApiProperty({
    description: "Plain text API key - only shown once",
    example: "pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  })
  key: string;

  /**
   * API key ID for future reference
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: "API key ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  /**
   * Human-readable name
   * @example "Production API Key"
   */
  @ApiProperty({
    description: "API key name",
    example: "Production API Key",
  })
  name: string;

  /**
   * Array of permission scopes granted to this API key
   * @example ["link:read", "link:create", "analytics:read"]
   */
  @ApiProperty({
    description: "Permission scopes",
    example: ["link:read", "link:create", "analytics:read"],
    type: [String],
  })
  scopes: string[];

  /**
   * IP whitelist if configured
   * @example ["192.168.1.1", "10.0.0.0/8"]
   */
  @ApiPropertyOptional({
    description: "IP whitelist",
    example: ["192.168.1.1", "10.0.0.0/8"],
    type: [String],
  })
  ipWhitelist?: string[];

  /**
   * Rate limit in requests per minute
   * @example 1000
   */
  @ApiPropertyOptional({
    description: "Rate limit in requests per minute",
    example: 1000,
  })
  rateLimit?: number;

  /**
   * Expiration date if set
   * @example "2024-12-31T23:59:59.000Z"
   */
  @ApiPropertyOptional({
    description: "Expiration date",
    example: "2024-12-31T23:59:59.000Z",
  })
  expiresAt?: Date;

  /**
   * Creation timestamp
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;
}

/**
 * Response DTO for listing API keys
 * Does NOT include the plain key or keyHash for security
 */
export class ApiKeyListItemDto {
  /**
   * API key ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: "API key ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  /**
   * Human-readable name
   * @example "Production API Key"
   */
  @ApiProperty({
    description: "API key name",
    example: "Production API Key",
  })
  name: string;

  /**
   * Array of permission scopes
   * @example ["link:read", "link:create", "analytics:read"]
   */
  @ApiProperty({
    description: "Permission scopes",
    example: ["link:read", "link:create", "analytics:read"],
    type: [String],
  })
  scopes: string[];

  /**
   * IP whitelist if configured
   */
  @ApiPropertyOptional({
    description: "IP whitelist",
    example: ["192.168.1.1"],
    type: [String],
  })
  ipWhitelist?: string[];

  /**
   * Rate limit if configured
   */
  @ApiPropertyOptional({
    description: "Rate limit in requests per minute",
    example: 1000,
  })
  rateLimit?: number;

  /**
   * Expiration date if set
   */
  @ApiPropertyOptional({
    description: "Expiration date",
    example: "2024-12-31T23:59:59.000Z",
  })
  expiresAt?: Date;

  /**
   * Last used timestamp
   */
  @ApiPropertyOptional({
    description: "Last used timestamp",
    example: "2024-01-15T10:30:00.000Z",
  })
  lastUsedAt?: Date;

  /**
   * Creation timestamp
   */
  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;
}
