import { IsArray, IsUUID, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class LinkOrderDto {
  @IsUUID()
  id: string;

  @IsNumber()
  order: number;
}

export class ReorderLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkOrderDto)
  orderings: LinkOrderDto[];
}
