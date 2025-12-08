import {
  IsString,
  IsBoolean,
  IsOptional,
  IsIn,
  IsUrl,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ConfigureSAMLDto {
  @ApiPropertyOptional({
    description: "Display name for the SSO provider",
    example: "Company SAML SSO",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "IdP Entity ID (Issuer)",
    example: "https://idp.example.com/metadata",
  })
  @IsString()
  @MinLength(1)
  entityId: string;

  @ApiProperty({
    description: "IdP Single Sign-On URL",
    example: "https://idp.example.com/sso",
  })
  @IsUrl()
  ssoUrl: string;

  @ApiPropertyOptional({
    description: "IdP Single Logout URL",
    example: "https://idp.example.com/slo",
  })
  @IsUrl()
  @IsOptional()
  sloUrl?: string;

  @ApiProperty({
    description: "IdP X.509 certificate (PEM format)",
    example:
      "-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----",
  })
  @IsString()
  @MinLength(1)
  certificate: string;

  @ApiPropertyOptional({
    description: "Whether to sign SAML requests",
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  signRequests?: boolean;

  @ApiPropertyOptional({
    description: "Signature algorithm",
    example: "sha256",
    enum: ["sha1", "sha256", "sha512"],
  })
  @IsString()
  @IsOptional()
  @IsIn(["sha1", "sha256", "sha512"])
  signatureAlgorithm?: string;

  @ApiPropertyOptional({
    description: "NameID format",
    example: "emailAddress",
    enum: ["emailAddress", "persistent", "transient", "unspecified"],
  })
  @IsString()
  @IsOptional()
  @IsIn(["emailAddress", "persistent", "transient", "unspecified"])
  nameIdFormat?: string;

  @ApiPropertyOptional({
    description: "SAML attribute name for email",
    example: "email",
    default: "email",
  })
  @IsString()
  @IsOptional()
  emailAttribute?: string;

  @ApiPropertyOptional({
    description: "SAML attribute name for display name",
    example: "displayName",
    default: "displayName",
  })
  @IsString()
  @IsOptional()
  nameAttribute?: string;
}

export class UpdateSAMLStatusDto {
  @ApiProperty({
    description: "Enable or disable SSO",
    example: true,
  })
  @IsBoolean()
  isEnabled: boolean;
}

export class SAMLMetadataResponseDto {
  @ApiProperty({
    description: "Service Provider Entity ID",
    example: "https://api.pingtome.io/auth/sso/saml/metadata",
  })
  spEntityId: string;

  @ApiProperty({
    description: "Service Provider Assertion Consumer Service URL",
    example: "https://api.pingtome.io/auth/sso/saml/callback",
  })
  spAcsUrl: string;

  @ApiProperty({
    description: "Service Provider metadata XML",
    example: "<?xml version='1.0'?>...",
  })
  metadataXml: string;
}

export class TestSAMLConnectionDto {
  @ApiPropertyOptional({
    description: "Test email address for connection test",
    example: "user@example.com",
  })
  @IsString()
  @IsOptional()
  testEmail?: string;
}
