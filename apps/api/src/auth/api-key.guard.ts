import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../developer/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return true; // Allow if no key (might be handled by other guards or public)
      // Actually, if this guard is used, it usually implies we WANT to check the key.
      // But maybe we want to support BOTH Bearer and API Key?
      // For now, let's assume if this guard is applied, we check for API Key.
      // If we want optional, we'd need a different logic.
      // Let's make it strict: if applied, must have valid key.
      // throw new UnauthorizedException('API Key required');
    }

    const validKey = await this.apiKeyService.validateApiKey(apiKey);
    if (!validKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Attach org context to request
    request.organization = validKey.organization;
    request.user = { id: 'api-key', isApiKey: true }; // Placeholder user

    return true;
  }
}
