import { IsDateString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for setting or clearing API key expiration
 */
export class SetExpirationDto {
  /**
   * Expiration date in ISO 8601 format, or null to remove expiration
   * Must be in the future if provided
   * @example "2025-12-31T23:59:59Z"
   */
  @ApiPropertyOptional({
    description:
      "Expiration date (ISO 8601). Set to null to remove expiration. Must be in future if provided.",
    example: "2025-12-31T23:59:59Z",
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;
}
