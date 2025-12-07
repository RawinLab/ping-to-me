import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaClient } from "@pingtome/database";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import {
  isValidScope,
  API_SCOPES,
  SCOPE_DESCRIPTIONS,
} from "../auth/rbac/api-scopes";
import { ApiKeyCreatedResponseDto, ApiKeyRotatedResponseDto } from "./dto";
import { AuditService } from "../audit/audit.service";

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

  constructor(private auditService: AuditService) {}

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
      scopes = ["admin"],
      ipWhitelist,
      rateLimit,
      expiresAt,
    } = options;

    // Validate scopes
    const invalidScopes = scopes.filter((scope) => !isValidScope(scope));
    if (invalidScopes.length > 0) {
      throw new BadRequestException(
        `Invalid scopes: ${invalidScopes.join(", ")}. Valid scopes: ${API_SCOPES.join(", ")}`,
      );
    }

    // Validate expiration date is in the future
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException("Expiration date must be in the future");
    }

    // Generate API key
    const key = `pk_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");

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
        createdAt: "desc",
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
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");
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
      const [resource] = scope.split(":");
      return {
        value: scope,
        description: SCOPE_DESCRIPTIONS[scope] || scope,
        group: resource === "admin" ? "Full Access" : resource,
      };
    });
  }

  /**
   * Rotates an API key by generating a new key value
   * Requires password confirmation for security
   *
   * @param userId - User ID requesting the rotation
   * @param keyId - API key ID to rotate
   * @param password - User password for confirmation
   * @returns New API key (shown only once)
   * @throws NotFoundException if key not found
   * @throws UnauthorizedException if password is incorrect
   */
  async rotateApiKey(
    userId: string,
    keyId: string,
    password: string,
  ): Promise<ApiKeyRotatedResponseDto> {
    // Fetch the user to verify password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid password");
    }

    // Fetch the API key
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    // Verify user has access to this key's organization
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: apiKey.organizationId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException("API key not found");
    }

    // Generate new key value
    const newKey = `pk_${crypto.randomBytes(24).toString("hex")}`;
    const newKeyHash = crypto.createHash("sha256").update(newKey).digest("hex");

    // Update the API key with new hash
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        keyHash: newKeyHash,
      },
    });

    // Audit log: API key rotated
    await this.auditService.logApiKeyEvent(
      userId,
      apiKey.organizationId,
      "api_key.rotated",
      {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
      },
      {
        details: {
          rotatedAt: new Date(),
        },
      },
    );

    return {
      key: newKey,
      message:
        "API key rotated successfully. Store the new key securely - it won't be shown again.",
    };
  }

  /**
   * Sets or clears the expiration date for an API key
   *
   * @param userId - User ID requesting the change
   * @param keyId - API key ID
   * @param expiresAt - New expiration date or null to clear
   * @returns Updated API key info
   * @throws NotFoundException if key not found
   * @throws BadRequestException if expiration date is in the past
   */
  async setExpiration(
    userId: string,
    keyId: string,
    expiresAt: Date | null,
  ): Promise<any> {
    // Validate expiration date is in the future
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException("Expiration date must be in the future");
    }

    // Fetch the API key
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException("API key not found");
    }

    // Verify user has access to this key's organization
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: apiKey.organizationId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException("API key not found");
    }

    // Update expiration
    const updatedApiKey = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        ipWhitelist: true,
        rateLimit: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return updatedApiKey;
  }

  /**
   * Gets API keys expiring within a specified number of days
   *
   * @param organizationId - Organization ID
   * @param days - Number of days to look ahead (default: 7)
   * @returns Array of API keys expiring soon
   */
  async getExpiringKeys(organizationId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.apiKey.findMany({
      where: {
        organizationId,
        expiresAt: {
          gte: now,
          lte: futureDate,
        },
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
  }
}
