import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for verifying a backup code
 */
export class VerifyBackupCodeDto {
  /**
   * Backup code in format XXXX-XXXX
   * @example "A1B2-C3D4"
   */
  @ApiProperty({
    description: "Backup code in format XXXX-XXXX",
    example: "A1B2-C3D4",
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
