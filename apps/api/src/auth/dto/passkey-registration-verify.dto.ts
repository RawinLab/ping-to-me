import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PasskeyRegistrationVerifyDto {
  @IsNotEmpty()
  @IsObject()
  credential: any; // PublicKeyCredential from WebAuthn

  @IsOptional()
  @IsString()
  name?: string; // User-friendly device name
}
