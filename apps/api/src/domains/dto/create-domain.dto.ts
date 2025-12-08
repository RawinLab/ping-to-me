import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDomainDto {
  @ApiProperty({
    description: 'Domain hostname (e.g., links.example.com)',
    example: 'links.example.com',
    minLength: 3,
    maxLength: 253,
  })
  @IsString()
  @MinLength(3, { message: 'Hostname must be at least 3 characters long' })
  @MaxLength(253, { message: 'Hostname must not exceed 253 characters' })
  @Matches(
    /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
    {
      message: 'Invalid domain format. Must be a valid hostname (e.g., links.example.com)',
    },
  )
  @Transform(({ value }) => value?.toLowerCase().trim())
  hostname: string;

  @ApiProperty({
    description: 'Organization ID that owns this domain',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  orgId: string;

  @ApiPropertyOptional({
    description: 'DNS verification method',
    enum: ['txt', 'cname'],
    default: 'txt',
    example: 'txt',
  })
  @IsOptional()
  @IsEnum(['txt', 'cname'], {
    message: 'Verification type must be either "txt" or "cname"',
  })
  verificationType?: 'txt' | 'cname';
}
