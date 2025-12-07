import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyService } from './api-keys.service';
import { WebhookService } from './webhooks.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';
import { CreateApiKeyDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('developer')
@Controller('developer')
@UseGuards(AuthGuard, PermissionGuard)
export class DeveloperController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) {}

  // API Keys
  @Post('api-keys')
  @Permission({ resource: 'api-key', action: 'create' })
  @ApiOperation({ summary: 'Create a new API key with scopes' })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid scopes or parameters',
  })
  async createApiKey(
    @Request() req,
    @Body(ValidationPipe) dto: CreateApiKeyDto,
  ) {
    // TODO: Verify user has access to orgId
    return this.apiKeyService.createApiKey({
      orgId: dto.orgId,
      name: dto.name,
      scopes: dto.scopes,
      ipWhitelist: dto.ipWhitelist,
      rateLimit: dto.rateLimit,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get('api-keys')
  @Permission({ resource: 'api-key', action: 'read' })
  @ApiOperation({ summary: 'List all API keys for an organization' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
  })
  async listApiKeys(@Request() req) {
    const orgId = req.query.orgId as string;
    return this.apiKeyService.listApiKeys(orgId);
  }

  @Get('api-keys/scopes')
  @Permission({ resource: 'api-key', action: 'read' })
  @ApiOperation({ summary: 'Get all available API scopes' })
  @ApiResponse({
    status: 200,
    description: 'List of available scopes with descriptions',
  })
  getAvailableScopes() {
    return this.apiKeyService.getAvailableScopes();
  }

  @Delete('api-keys/:id')
  @Permission({ resource: 'api-key', action: 'revoke', context: 'own' })
  @ApiOperation({ summary: 'Revoke (delete) an API key' })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
  })
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    const orgId = req.query.orgId as string;
    return this.apiKeyService.revokeApiKey(id, orgId);
  }

  // Webhooks
  @Post('webhooks')
  @Permission({ resource: 'api-key', action: 'create' })
  async createWebhook(@Request() req, @Body() body: { url: string; events: string[]; orgId: string }) {
    return this.webhookService.createWebhook(body.orgId, body.url, body.events);
  }

  @Get('webhooks')
  @Permission({ resource: 'api-key', action: 'read' })
  async listWebhooks(@Request() req) {
    return this.webhookService.listWebhooks(req.query.orgId as string);
  }

  @Delete('webhooks/:id')
  @Permission({ resource: 'api-key', action: 'revoke', context: 'own' })
  async deleteWebhook(@Request() req, @Param('id') id: string) {
    const orgId = req.query.orgId as string;
    return this.webhookService.deleteWebhook(id, orgId);
  }
}
