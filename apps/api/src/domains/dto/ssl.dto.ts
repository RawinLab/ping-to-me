import { IsBoolean, IsOptional } from "class-validator";

/**
 * DTO for provisioning SSL certificate
 */
export class ProvisionSslDto {
  // No additional fields needed - domain ID comes from URL params
}

/**
 * DTO for updating SSL settings
 */
export class UpdateSslDto {
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
