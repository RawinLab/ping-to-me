import { IsArray, IsString, IsOptional, IsIn, IsNumber, Min, Max } from 'class-validator';

export class BatchDownloadDto {
  @IsArray()
  @IsString({ each: true })
  linkIds: string[];

  @IsOptional()
  @IsIn(['png', 'svg', 'pdf'])
  format?: 'png' | 'svg' | 'pdf';

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(1000)
  size?: number;
}
