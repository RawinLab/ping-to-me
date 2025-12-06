import { IsOptional, IsUUID, IsUrl, IsString, IsNotEmpty } from 'class-validator';

export class CreateBioLinkDto {
  @IsOptional()
  @IsUUID()
  linkId?: string;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  buttonColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;
}
