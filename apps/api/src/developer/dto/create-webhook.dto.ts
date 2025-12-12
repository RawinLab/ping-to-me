import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUrl,
  ArrayMinSize,
  IsIn,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Valid webhook event types that can be subscribed to
 */
export const VALID_WEBHOOK_EVENTS = [
  "link.created",
  "link.clicked",
  "link.updated",
  "link.deleted",
  "bio.viewed",
] as const;

export type WebhookEventType = (typeof VALID_WEBHOOK_EVENTS)[number];

/**
 * DTO for creating a new webhook subscription
 */
export class CreateWebhookDto {
  /**
   * The URL where webhook events will be sent
   * Must be a valid HTTPS URL
   * @example "https://api.example.com/webhooks"
   */
  @ApiProperty({
    description: "The URL where webhook events will be sent (must be HTTPS)",
    example: "https://api.example.com/webhooks",
  })
  @IsUrl(
    { protocols: ["https"], require_protocol: true },
    { message: "URL must be a valid HTTPS URL" },
  )
  @IsNotEmpty({ message: "URL is required" })
  url: string;

  /**
   * Array of event types to subscribe to
   * Must contain at least one valid event type
   * @example ["link.created", "link.clicked"]
   */
  @ApiProperty({
    description: "Array of event types to subscribe to",
    example: ["link.created", "link.clicked"],
    enum: VALID_WEBHOOK_EVENTS,
    isArray: true,
  })
  @IsArray({ message: "Events must be an array" })
  @ArrayMinSize(1, { message: "Select at least one event" })
  @IsString({ each: true })
  @IsIn(VALID_WEBHOOK_EVENTS, {
    each: true,
    message: `Each event must be one of: ${VALID_WEBHOOK_EVENTS.join(", ")}`,
  })
  events: WebhookEventType[];

  /**
   * Organization ID this webhook belongs to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: "Organization ID this webhook belongs to",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  @IsNotEmpty({ message: "Organization ID is required" })
  orgId: string;
}
