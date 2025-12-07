import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { MemberRole } from "@pingtome/database";

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(MemberRole)
  role: MemberRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalMessage?: string;
}
