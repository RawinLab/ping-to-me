import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for rotating an API key
 * Requires password confirmation for security
 */
export class RotateApiKeyDto {
  /**
   * User password for confirmation
   * @example "mySecurePassword123"
   */
  @ApiProperty({
    description: "User password for confirmation",
    example: "mySecurePassword123",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
