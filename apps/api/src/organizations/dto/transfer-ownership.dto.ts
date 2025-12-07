import { IsString, IsNotEmpty, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for transferring organization ownership
 */
export class TransferOwnershipDto {
  @ApiProperty({
    description: "User ID of the new owner (must be an existing member)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  newOwnerId: string;
}
