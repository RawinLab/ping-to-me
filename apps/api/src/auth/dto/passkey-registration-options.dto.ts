import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum AuthenticatorType {
  PLATFORM = 'platform',
  CROSS_PLATFORM = 'cross-platform',
}

export class PasskeyRegistrationOptionsDto {
  @IsOptional()
  @IsEnum(AuthenticatorType)
  authenticatorType?: AuthenticatorType;

  @IsOptional()
  @IsString()
  name?: string; // User-friendly device name
}
