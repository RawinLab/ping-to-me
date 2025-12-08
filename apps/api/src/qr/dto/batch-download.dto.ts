import {
  IsArray,
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
  IsUUID,
} from "class-validator";

export class BatchDownloadDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 link ID required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 QR codes per batch' })
  @IsUUID('4', { each: true, message: 'Each link ID must be a valid UUID' })
  linkIds: string[];

  @IsOptional()
  @IsIn(["png", "svg", "pdf"])
  format?: "png" | "svg" | "pdf";

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(1000)
  size?: number;
}
