import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiKeyService } from './api-keys.service';
import { WebhookService } from './webhooks.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('developer')
@UseGuards(AuthGuard)
export class DeveloperController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly webhookService: WebhookService,
  ) { }

  // API Keys
  @Post('api-keys')
  async createApiKey(@Request() req, @Body() body: { name: string; orgId: string }) {
    // TODO: Verify user has access to orgId
    return this.apiKeyService.createApiKey(body.orgId, body.name);
  }

  @Get('api-keys')
  async listApiKeys(@Request() req, @Body() body: { orgId: string }) {
    // Note: In a real app, orgId might come from query param or header context
    // For now, we'll accept it in body for list (GET with body is weird, let's assume query param in real impl or just fix it now)
    // Actually, let's use Query param for GET
    return this.apiKeyService.listApiKeys(req.query.orgId as string);
  }

  @Delete('api-keys/:id')
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    const orgId = req.query.orgId as string; // Simplified
    return this.apiKeyService.revokeApiKey(id, orgId);
  }

  // Webhooks
  @Post('webhooks')
  async createWebhook(@Request() req, @Body() body: { url: string; events: string[]; orgId: string }) {
    return this.webhookService.createWebhook(body.orgId, body.url, body.events);
  }

  @Get('webhooks')
  async listWebhooks(@Request() req) {
    return this.webhookService.listWebhooks(req.query.orgId as string);
  }

  @Delete('webhooks/:id')
  async deleteWebhook(@Request() req, @Param('id') id: string) {
    const orgId = req.query.orgId as string;
    return this.webhookService.deleteWebhook(id, orgId);
  }
}
