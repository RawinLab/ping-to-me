import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenamePasskeyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}
