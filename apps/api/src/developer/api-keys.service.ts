import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import * as crypto from 'crypto';
import { isValidScope, API_SCOPES, SCOPE_DESCRIPTIONS } from '../auth/rbac/api-scopes';
import {
  CreateApiKeyDto,
  ApiKeyCreatedResponseDto,
} from './dto';

/**
 * Options for creating an API key
 */
interface CreateApiKeyOptions {
  /** Organization ID */
  orgId: string;
  /** Human-readable name */
  name: string;
  /** Permission scopes (defaults to ['admin']) */
  scopes?: string[];
  /** IP whitelist */
  ipWhitelist?: string[];
  /** Rate limit in requests per minute */
  rateLimit?: number;
  /** Expiration date */
  expiresAt?: Date;
}

@Injectable()
export class ApiKeyService {
  private prisma = new PrismaClient();

  /**
   * Creates a new API key with specified scopes and restrictions
   *
   * @param options - API key creation options
   * @returns Created API key with plain text key (only shown once)
   * @throws BadRequestException if scopes are invalid
   */
  async createApiKey(
    options: CreateApiKeyOptions,
  ): Promise<ApiKeyCreatedResponseDto> {
    const {
      orgId,
      name,
      scopes = ['admin'],
      ipWhitelist,
      rateLimit,
      expiresAt,
    } = options;

    // Validate scopes
    const invalidScopes = scopes.filter((scope) => !isValidScope(scope));
    if (invalidScopes.length > 0) {
      throw new BadRequestException(
        `Invalid scopes: ${invalidScopes.join(', ')}. Valid scopes: ${API_SCOPES.join(', ')}`,
      );
    }

    // Validate expiration date is in the future
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Generate API key
    const key = `pk_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    // Create API key in database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        keyHash,
        name,
        organizationId: orgId,
        scopes,
        ipWhitelist: ipWhitelist || [],
        rateLimit,
        expiresAt,
      },
    });

    return {
      key, // Only returned once
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
      ipWhitelist: apiKey.ipWhitelist || undefined,
      rateLimit: apiKey.rateLimit || undefined,
      expiresAt: apiKey.expiresAt || undefined,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Lists all API keys for an organization
   * Does NOT include keyHash for security
   *
   * @param orgId - Organization ID
   * @returns Array of API keys with metadata
   */
  async listApiKeys(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        scopes: true,
        ipWhitelist: true,
        rateLimit: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
        // Do NOT select keyHash
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Revokes (deletes) an API key
   *
   * @param id - API key ID
   * @param orgId - Organization ID (for authorization)
   * @returns Delete result
   */
  async revokeApiKey(id: string, orgId: string) {
    return this.prisma.apiKey.deleteMany({
      where: {
        id,
        organizationId: orgId,
      },
    });
  }

  /**
   * Validates an API key and checks if it's expired
   * Updates lastUsedAt timestamp asynchronously
   *
   * @param key - Plain text API key
   * @returns API key with organization if valid, null otherwise
   */
  async validateApiKey(key: string) {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { organization: true },
    });

    if (!apiKey) {
      return null;
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used asynchronously (don't await to avoid blocking)
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(console.error);

    return apiKey;
  }

  /**
   * Gets all available API scopes for display in UI
   * Returns scopes with descriptions grouped by resource
   *
   * @returns Array of scopes with metadata
   */
  getAvailableScopes(): Array<{
    value: string;
    description: string;
    group: string;
  }> {
    return API_SCOPES.map((scope) => {
      const [resource] = scope.split(':');
      return {
        value: scope,
        description: SCOPE_DESCRIPTIONS[scope] || scope,
        group: resource === 'admin' ? 'Full Access' : resource,
      };
    });
  }
}
