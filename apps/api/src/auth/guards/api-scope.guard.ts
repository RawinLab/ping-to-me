import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SCOPE_KEY } from '../rbac/require-scope.decorator';
import * as crypto from 'crypto';

/**
 * API Scope Guard for token-based API authorization
 *
 * This guard enforces API token scope requirements based on the @RequireScope decorator.
 * It validates:
 * - API key presence and validity (via key hash)
 * - Key expiration (if expiresAt is set)
 * - IP whitelist restrictions (if ipWhitelist is set)
 * - Required scopes (from @RequireScope decorator)
 * - Admin scope grants full access
 *
 * The guard allows requests to proceed if:
 * 1. No @RequireScope decorator is present (public route)
 * 2. No API key is present (assumes JWT auth is used instead)
 * 3. API key is valid and has required scopes
 *
 * API Key Formats Supported:
 * - Header: `x-api-key: <key>`
 * - Header: `Authorization: Bearer <key>`
 *
 * Usage:
 * ```typescript
 * @Controller('links')
 * @UseGuards(ApiScopeGuard)
 * export class LinksController {
 *   @Get()
 *   @RequireScope('link:read')
 *   findAll() {}
 *
 *   @Post()
 *   @RequireScope('link:create')
 *   create() {}
 *
 *   @Delete(':id')
 *   @RequireScope(['link:delete', 'admin'])
 *   delete() {}
 * }
 * ```
 */
@Injectable()
export class ApiScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract required scope metadata from decorator
    const requiredScope = this.reflector.getAllAndOverride<string | string[]>(
      SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no scope requirement, allow access (public route or JWT auth only)
    if (!requiredScope) {
      return true;
    }

    // Extract request
    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);

    // If no API key present, allow JWT auth to handle it
    // This allows routes to work with both API keys and JWT tokens
    if (!apiKey) {
      // If user is authenticated via JWT, allow through
      if (request.user) {
        return true;
      }

      throw new UnauthorizedException(
        'API key or valid authentication required',
      );
    }

    // Hash the provided API key
    const keyHash = this.hashKey(apiKey);

    // Find API key in database
    const apiKeyRecord = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      throw new ForbiddenException('API key has expired');
    }

    // Check IP whitelist if configured
    if (
      apiKeyRecord.ipWhitelist &&
      apiKeyRecord.ipWhitelist.length > 0
    ) {
      const clientIp = this.extractClientIp(request);
      const isIpAllowed = this.checkIpWhitelist(
        clientIp,
        apiKeyRecord.ipWhitelist,
      );

      if (!isIpAllowed) {
        throw new ForbiddenException(
          `API key is not authorized for IP address: ${clientIp}`,
        );
      }
    }

    // Check if API key has required scope
    const hasScope = this.checkScope(requiredScope, apiKeyRecord.scopes);

    if (!hasScope) {
      const requiredScopes = Array.isArray(requiredScope)
        ? requiredScope.join(', ')
        : requiredScope;

      throw new ForbiddenException({
        message: 'Insufficient API key scopes',
        error: 'Forbidden',
        details: {
          requiredScopes,
          availableScopes: apiKeyRecord.scopes,
          keyName: apiKeyRecord.name,
        },
      });
    }

    // Update lastUsedAt timestamp (non-blocking)
    this.updateLastUsedAt(apiKeyRecord.id).catch((error) => {
      // Log error but don't block request
      console.error('Failed to update API key lastUsedAt:', error);
    });

    // Attach API key metadata to request for potential use in controllers
    request.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      organizationId: apiKeyRecord.organizationId,
      scopes: apiKeyRecord.scopes,
    };

    // Log access for audit (optional)
    this.logApiAccess(apiKeyRecord, requiredScope, 'granted');

    return true;
  }

  /**
   * Extract API key from request headers
   * Supports both `x-api-key` and `Authorization: Bearer` formats
   */
  private extractApiKey(request: any): string | undefined {
    // Try x-api-key header
    const xApiKey = request.headers['x-api-key'];
    if (xApiKey) {
      return xApiKey;
    }

    // Try Authorization: Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  /**
   * Hash API key using SHA-256
   * Uses the same hashing algorithm as key generation
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Extract client IP address from request
   * Checks X-Forwarded-For header first (for proxied requests)
   */
  private extractClientIp(request: any): string {
    // Check X-Forwarded-For header (standard proxy header)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Take the first IP if multiple are present
      return forwardedFor.split(',')[0].trim();
    }

    // Check X-Real-IP header (common in nginx)
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    // Fallback to direct connection IP
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * Check if client IP is in whitelist
   * Supports both individual IPs and CIDR notation
   */
  private checkIpWhitelist(clientIp: string, whitelist: string[]): boolean {
    for (const allowedIp of whitelist) {
      // Check for exact match
      if (clientIp === allowedIp) {
        return true;
      }

      // Check for CIDR match (basic implementation)
      if (allowedIp.includes('/')) {
        if (this.isIpInCidr(clientIp, allowedIp)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range
   * Basic implementation for IPv4
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

      const ipNum = this.ipToNumber(ip);
      const rangeNum = this.ipToNumber(range);

      return (ipNum & mask) === (rangeNum & mask);
    } catch (error) {
      console.error('Error checking CIDR:', error);
      return false;
    }
  }

  /**
   * Convert IP address to number for CIDR comparison
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => {
      return (acc << 8) + parseInt(octet, 10);
    }, 0) >>> 0;
  }

  /**
   * Check if API key has required scope
   * Supports:
   * - Single scope: API key must have this scope
   * - Array of scopes (OR): API key must have ANY of these scopes
   * - Admin scope: Grants full access
   */
  private checkScope(
    requiredScope: string | string[],
    availableScopes: string[],
  ): boolean {
    // Admin scope grants full access
    if (availableScopes.includes('admin')) {
      return true;
    }

    // Convert to array for uniform handling
    const requiredScopes = Array.isArray(requiredScope)
      ? requiredScope
      : [requiredScope];

    // Check if API key has ANY of the required scopes (OR condition)
    return requiredScopes.some((scope) => availableScopes.includes(scope));
  }

  /**
   * Update lastUsedAt timestamp for API key
   * Non-blocking operation to avoid slowing down requests
   */
  private async updateLastUsedAt(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Log API access for audit purposes
   * In production, this should integrate with your audit logging system
   */
  private logApiAccess(
    apiKey: any,
    requiredScope: string | string[],
    result: 'granted' | 'denied',
  ): void {
    // Optional: Log to console for development
    // In production, replace with proper audit logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[ApiScopeGuard]', {
        keyId: apiKey.id,
        keyName: apiKey.name,
        organizationId: apiKey.organizationId,
        requiredScope,
        availableScopes: apiKey.scopes,
        result,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
