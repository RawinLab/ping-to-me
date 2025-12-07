import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionInfoDto {
  @ApiProperty({
    description: 'Session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Device information parsed from user agent',
    example: 'Chrome on Windows',
  })
  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @ApiProperty({
    description: 'Partially masked IP address',
    example: '192.168.1.***',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: 'Geo-resolved location',
    example: 'Bangkok, Thailand',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  lastActive: Date;

  @ApiProperty({
    description: 'Whether this is the current session',
    example: true,
  })
  @IsBoolean()
  isCurrent: boolean;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  createdAt: Date;
}

export class SessionListResponseDto {
  @ApiProperty({
    description: 'List of active sessions',
    type: [SessionInfoDto],
  })
  sessions: SessionInfoDto[];

  @ApiProperty({
    description: 'Total number of active sessions',
    example: 3,
  })
  total: number;
}

export class LogoutSessionResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Session terminated successfully',
  })
  message: string;
}

export class LogoutAllSessionsResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'All other sessions terminated',
  })
  message: string;

  @ApiProperty({
    description: 'Number of sessions terminated',
    example: 2,
  })
  count: number;
}
