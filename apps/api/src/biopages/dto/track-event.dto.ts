import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator";

export enum BioEventType {
  PAGE_VIEW = "page_view",
  LINK_CLICK = "link_click",
}

export class TrackEventDto {
  @IsEnum(BioEventType)
  eventType: BioEventType;

  @IsUUID()
  @IsOptional()
  bioLinkId?: string;

  @IsString()
  @IsOptional()
  referrer?: string;
}
