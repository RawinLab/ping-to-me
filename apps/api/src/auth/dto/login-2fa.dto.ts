import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Login2faDto {
  @ApiProperty({
    description: 'Temporary session token received from initial login',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @ApiProperty({
    description: '6-digit TOTP code or 8-character backup code (format: XXXX-XXXX)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 9) // 6 digits for TOTP, 8-9 chars for backup code (XXXXXXXX or XXXX-XXXX)
  code: string;
}
