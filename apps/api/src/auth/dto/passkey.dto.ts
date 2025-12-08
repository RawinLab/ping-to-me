import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Authenticator type for WebAuthn
 */
export enum AuthenticatorType {
  PLATFORM = 'platform', // Built-in authenticators (Touch ID, Windows Hello)
  CROSS_PLATFORM = 'cross-platform', // External authenticators (YubiKey, security keys)
}

/**
 * DTO for initiating passkey registration
 */
export class RegisterPasskeyOptionsDto {
  @ApiPropertyOptional({
    description: 'Authenticator type: platform (Touch ID, Windows Hello) or cross-platform (YubiKey, security keys)',
    enum: AuthenticatorType,
    example: AuthenticatorType.PLATFORM,
    default: AuthenticatorType.PLATFORM,
  })
  @IsOptional()
  @IsEnum(AuthenticatorType)
  authenticatorType?: AuthenticatorType;

  @ApiPropertyOptional({
    description: 'Friendly name for the passkey or security key',
    example: 'MacBook Pro Touch ID',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO for completing passkey registration
 */
export class VerifyPasskeyRegistrationDto {
  @ApiProperty({
    description: 'Registration response from WebAuthn client',
    example: {
      id: 'base64url-credential-id',
      rawId: 'base64url-raw-id',
      response: {
        clientDataJSON: 'base64url-client-data',
        attestationObject: 'base64url-attestation',
      },
      type: 'public-key',
    },
  })
  @IsNotEmpty()
  registrationResponse: any; // RegistrationResponseJSON from @simplewebauthn/browser

  @ApiPropertyOptional({
    description: 'Friendly name for the passkey',
    example: 'MacBook Pro Touch ID',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO for initiating passkey login
 */
export class PasskeyLoginOptionsDto {
  @ApiPropertyOptional({
    description: 'Email address for user identification',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;
}

/**
 * DTO for completing passkey login
 */
export class VerifyPasskeyLoginDto {
  @ApiProperty({
    description: 'Authentication response from WebAuthn client',
    example: {
      id: 'base64url-credential-id',
      rawId: 'base64url-raw-id',
      response: {
        clientDataJSON: 'base64url-client-data',
        authenticatorData: 'base64url-authenticator-data',
        signature: 'base64url-signature',
        userHandle: 'base64url-user-handle',
      },
      type: 'public-key',
    },
  })
  @IsNotEmpty()
  authenticationResponse: any; // AuthenticationResponseJSON from @simplewebauthn/browser
}

/**
 * DTO for renaming a passkey
 */
export class RenamePasskeyDto {
  @ApiProperty({
    description: 'New name for the passkey',
    example: 'My YubiKey',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
