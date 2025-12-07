import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for API key rotation
 * Contains the new plain key which is only shown once
 */
export class ApiKeyRotatedResponseDto {
  /**
   * The new plain text API key - ONLY shown once
   * Must be stored securely by the client
   * @example "pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
   */
  @ApiProperty({
    description: "New plain text API key - only shown once",
    example: "pk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  })
  key: string;

  /**
   * Confirmation message
   * @example "API key rotated successfully. Store the new key securely - it won't be shown again."
   */
  @ApiProperty({
    description: "Confirmation message",
    example:
      "API key rotated successfully. Store the new key securely - it won't be shown again.",
  })
  message: string;
}
