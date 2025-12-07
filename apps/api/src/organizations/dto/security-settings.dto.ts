import {
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MemberRole } from "@pingtome/database";

/**
 * DTO for updating 2FA enforcement settings
 * Only OWNER can modify these settings
 */
export class Update2FAEnforcementDto {
  @ApiPropertyOptional({
    description: "Whether 2FA is enforced for organization",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enforce2FA?: boolean;

  @ApiPropertyOptional({
    description: "Roles that require 2FA (valid: OWNER, ADMIN, EDITOR, VIEWER)",
    example: ["OWNER", "ADMIN"],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsEnum(MemberRole, { each: true })
  enforce2FAForRoles?: MemberRole[];
}

/**
 * Response DTO for security settings
 */
export class SecuritySettingsResponseDto {
  @ApiProperty({
    description: "Whether 2FA is enforced",
    example: true,
  })
  enforced2FA: boolean;

  @ApiProperty({
    description: "Roles that require 2FA",
    example: ["OWNER", "ADMIN"],
    type: [String],
  })
  enforce2FAForRoles: string[];

  @ApiPropertyOptional({
    description: "Session timeout in seconds",
    example: 7200,
  })
  sessionTimeout?: number;

  @ApiPropertyOptional({
    description: "Max login attempts before lockout",
    example: 5,
  })
  maxLoginAttempts?: number;

  @ApiPropertyOptional({
    description: "Account lockout duration in minutes",
    example: 30,
  })
  lockoutDuration?: number;
}
