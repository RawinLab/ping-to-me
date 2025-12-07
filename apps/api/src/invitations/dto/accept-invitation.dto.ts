import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class AcceptInvitationDto {
  // For new users who need to create an account
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
