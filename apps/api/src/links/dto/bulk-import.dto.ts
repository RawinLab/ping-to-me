import { IsBoolean, IsOptional, IsString, IsInt, Max, Min } from 'class-validator';

export class BulkImportOptionsDto {
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean; // Preview import without saving

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxRows?: number; // Maximum rows to process (default 1000)

  @IsOptional()
  @IsString()
  organizationId?: string; // Organization context
}
