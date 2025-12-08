import { IsOptional, IsBoolean, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDomainDto {
  @ApiPropertyOptional({
    description: 'Set this domain as the default for the organization',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean value' })
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'DNS verification method',
    enum: ['txt', 'cname'],
    example: 'txt',
  })
  @IsOptional()
  @IsEnum(['txt', 'cname'], {
    message: 'Verification type must be either "txt" or "cname"',
  })
  verificationType?: 'txt' | 'cname';

  @ApiPropertyOptional({
    description: 'Redirect policy configuration (for future use)',
    example: 'default',
  })
  @IsOptional()
  @IsString({ message: 'Redirect policy must be a string' })
  redirectPolicy?: string;
}
