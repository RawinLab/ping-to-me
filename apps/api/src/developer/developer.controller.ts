import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiKeyService } from './api-keys.service';
import { WebhookService } from './webhooks.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard, Permission } from '../auth/rbac';

@Controller('developer')
@UseGuards(AuthGuard, PermissionGuard)
export class DeveloperController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) { }

  // API Keys
  @Post('api-keys')
  @Permission({ resource: 'api-key', action: 'create' })
  async createApiKey(@Request() req, @Body() body: { name: string; orgId: string }) {
    // TODO: Verify user has access to orgId
    return this.apiKeyService.createApiKey(body.orgId, body.name);
  }

  @Get('api-keys')
  @Permission({ resource: 'api-key', action: 'read' })
  async listApiKeys(@Request() req, @Body() body: { orgId: string }) {
    // Note: In a real app, orgId might come from query param or header context
    // For now, we'll accept it in body for list (GET with body is weird, let's assume query param in real impl or just fix it now)
    // Actually, let's use Query param for GET
    return this.apiKeyService.listApiKeys(req.query.orgId as string);
  }

  @Delete('api-keys/:id')
  @Permission({ resource: 'api-key', action: 'revoke', context: 'own' })
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    const orgId = req.query.orgId as string; // Simplified
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
