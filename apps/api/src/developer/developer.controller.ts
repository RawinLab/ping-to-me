import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { ApiKeyService } from "./api-keys.service";
import { WebhookService } from "./webhooks.service";
import { AuthGuard } from "../auth/auth.guard";
import { PermissionGuard, Permission } from "../auth/rbac";
import {
  CreateApiKeyDto,
  RotateApiKeyDto,
  SetExpirationDto,
  ApiKeyRotatedResponseDto,
  CreateWebhookDto,
} from "./dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("developer")
@Controller("developer")
@UseGuards(AuthGuard, PermissionGuard)
export class DeveloperController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) {}

  // API Keys
  @Post("api-keys")
  @Permission({ resource: "api-key", action: "create" })
  @ApiOperation({ summary: "Create a new API key with scopes" })
  @ApiResponse({
    status: 201,
    description: "API key created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid scopes or parameters",
  })
  async createApiKey(
    @Request() req,
    @Body(ValidationPipe) dto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.createApiKey({
      orgId: dto.orgId,
      name: dto.name,
      scopes: dto.scopes,
      ipWhitelist: dto.ipWhitelist,
      rateLimit: dto.rateLimit,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get("api-keys")
  @Permission({ resource: "api-key", action: "read" })
  @ApiOperation({ summary: "List all API keys for an organization" })
  @ApiResponse({
    status: 200,
    description: "List of API keys",
  })
  async listApiKeys(@Request() req) {
    const orgId = req.query.orgId as string;
    return this.apiKeyService.listApiKeys(orgId);
  }

  @Get("api-keys/scopes")
  @Permission({ resource: "api-key", action: "read" })
  @ApiOperation({ summary: "Get all available API scopes" })
  @ApiResponse({
    status: 200,
    description: "List of available scopes with descriptions",
  })
  getAvailableScopes() {
    return this.apiKeyService.getAvailableScopes();
  }

  @Delete("api-keys/:id")
  @Permission({ resource: "api-key", action: "revoke", context: "own" })
  @ApiOperation({ summary: "Revoke (delete) an API key" })
  @ApiResponse({
    status: 200,
    description: "API key revoked successfully",
  })
  async revokeApiKey(@Request() req, @Param("id") id: string) {
    const orgId = req.query.orgId as string;
    return this.apiKeyService.revokeApiKey(id, orgId);
  }

  @Post("api-keys/:id/rotate")
  @Permission({ resource: "api-key", action: "create" })
  @ApiOperation({
    summary: "Rotate an API key",
    description:
      "Generates a new key value while keeping the same ID and metadata. Requires password confirmation.",
  })
  @ApiResponse({
    status: 200,
    description: "API key rotated successfully",
    type: ApiKeyRotatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid password",
  })
  @ApiResponse({
    status: 404,
    description: "API key not found",
  })
  async rotateApiKey(
    @Request() req,
    @Param("id") id: string,
    @Body(ValidationPipe) dto: RotateApiKeyDto,
  ) {
    return this.apiKeyService.rotateApiKey(req.user.id, id, dto.password);
  }

  @Patch("api-keys/:id/expiry")
  @Permission({ resource: "api-key", action: "create" })
  @ApiOperation({
    summary: "Set or clear API key expiration",
    description:
      "Updates the expiration date for an API key. Set to null to remove expiration.",
  })
  @ApiResponse({
    status: 200,
    description: "Expiration updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid expiration date (must be in future)",
  })
  @ApiResponse({
    status: 404,
    description: "API key not found",
  })
  async setExpiration(
    @Request() req,
    @Param("id") id: string,
    @Body(ValidationPipe) dto: SetExpirationDto,
  ) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return this.apiKeyService.setExpiration(req.user.id, id, expiresAt);
  }

  @Get("api-keys/expiring")
  @Permission({ resource: "api-key", action: "read" })
  @ApiOperation({
    summary: "Get API keys expiring soon",
    description:
      "Returns API keys that will expire within the specified number of days",
  })
  @ApiResponse({
    status: 200,
    description: "List of expiring API keys",
  })
  async getExpiringKeys(
    @Request() req,
    @Query("orgId") orgId: string,
    @Query("days") days?: string,
  ) {
    const daysAhead = days ? parseInt(days, 10) : 7;
    return this.apiKeyService.getExpiringKeys(orgId, daysAhead);
  }

  // Webhooks
  @Post("webhooks")
  @Permission({ resource: "api-key", action: "create" })
  @ApiOperation({ summary: "Create a new webhook subscription" })
  @ApiResponse({
    status: 201,
    description: "Webhook created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid URL or events",
  })
  async createWebhook(
    @Request() req,
    @Body(ValidationPipe) dto: CreateWebhookDto,
  ) {
    return this.webhookService.createWebhook(dto.orgId, dto.url, dto.events);
  }

  @Get("webhooks")
  @Permission({ resource: "api-key", action: "read" })
  async listWebhooks(@Request() req) {
    return this.webhookService.listWebhooks(req.query.orgId as string);
  }

  @Delete("webhooks/:id")
  @Permission({ resource: "api-key", action: "revoke", context: "own" })
  async deleteWebhook(@Request() req, @Param("id") id: string) {
    const orgId = req.query.orgId as string;
    return this.webhookService.deleteWebhook(id, orgId);
  }
}
