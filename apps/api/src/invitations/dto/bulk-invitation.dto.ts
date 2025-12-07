import { IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { CreateInvitationDto } from "./create-invitation.dto";

export class BulkInvitationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvitationDto)
  invitations: CreateInvitationDto[];
}
