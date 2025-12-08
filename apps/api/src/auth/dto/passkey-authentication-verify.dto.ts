import { IsNotEmpty, IsObject } from 'class-validator';

export class PasskeyAuthenticationVerifyDto {
  @IsNotEmpty()
  @IsObject()
  credential: any; // PublicKeyCredential from WebAuthn
}
