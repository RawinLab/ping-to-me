import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUUID,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO for updating organization details
 */
export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: "Organization name",
    example: "Acme Corporation",
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: "Organization slug (URL-safe identifier)",
    example: "acme-corp",
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({
    description: "Organization logo (base64 encoded image or URL)",
    example: "data:image/png;base64,iVBORw0KGgoAAAANS...",
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description: "Organization description",
    example: "A leading technology company",
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: "Organization timezone (IANA timezone identifier)",
    example: "America/New_York",
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: "Data retention period in days (analytics data)",
    example: 90,
    minimum: 30,
    maximum: 365,
  })
  @IsInt()
  @IsOptional()
  @Min(30)
  @Max(365)
  dataRetentionDays?: number;

  @ApiPropertyOptional({
    description: "Default domain ID for link shortening",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsOptional()
  defaultDomainId?: string;
}
