import { IsBoolean, IsOptional, IsString, IsDate, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class LoginAttemptDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class LoginActivityQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

export class LoginActivityResponseDto {
  attempts: LoginAttemptDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AccountLockedErrorDto {
  @IsString()
  message: string;

  @IsDate()
  @Type(() => Date)
  lockedUntil: Date;

  @IsInt()
  remainingMinutes: number;
}
