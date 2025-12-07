import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for backup codes generation
 */
export class BackupCodesResponseDto {
  /**
   * Array of backup codes (shown only once)
   * @example ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2"]
   */
  @ApiProperty({
    description: "Array of backup codes (shown only once)",
    example: ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2"],
    type: [String],
  })
  codes: string[];

  /**
   * Informational message
   * @example "Backup codes generated successfully. Store them in a safe place."
   */
  @ApiProperty({
    description: "Informational message",
    example: "Backup codes generated successfully. Store them in a safe place.",
  })
  message: string;
}
