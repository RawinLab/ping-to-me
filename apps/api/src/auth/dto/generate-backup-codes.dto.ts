import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for generating new backup codes
 * Requires password confirmation for security
 */
export class GenerateBackupCodesDto {
  /**
   * Current user password for confirmation
   * @example "MySecurePassword123!"
   */
  @ApiProperty({
    description: "Current user password for confirmation",
    example: "MySecurePassword123!",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
