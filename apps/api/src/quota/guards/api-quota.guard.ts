import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QuotaService } from "../quota.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ApiQuotaGuard implements CanActivate {
  constructor(
    private quotaService: QuotaService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get API key from header
    const apiKey = request.headers["x-api-key"] as string;
    if (!apiKey) {
      // No API key = not an API call, skip quota check
      return true;
    }

    // Find the API key in database to get organizationId
    // Note: API keys are stored as hashes in the database
    // This is a simplified version - in production, you'd hash the key first
    const apiKeyRecord = await this.prisma.apiKey.findFirst({
      where: {
        // In real implementation, you'd hash the API key and compare
        // For now, we'll get the org from the request context if available
      },
    });

    // Try to get organizationId from request (set by earlier middleware/guard)
    const organizationId = (request as any).organizationId || (request as any).user?.organizationId;

    if (!organizationId) {
      // Can't determine organization, allow but don't track
      return true;
    }

    // Check API call quota
    const quotaCheck = await this.quotaService.checkQuota(organizationId, 'api_calls');

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', quotaCheck.limit === -1 ? 'unlimited' : quotaCheck.limit.toString());
    response.setHeader('X-RateLimit-Remaining', quotaCheck.remaining === -1 ? 'unlimited' : quotaCheck.remaining.toString());
    response.setHeader('X-RateLimit-Reset', this.getEndOfMonth().toISOString());

    if (!quotaCheck.allowed) {
      throw new HttpException(
        {
          code: 'QUOTA_EXCEEDED',
          message: 'Monthly API call limit reached. Please upgrade your plan.',
          currentUsage: quotaCheck.currentUsage,
          limit: quotaCheck.limit,
          upgradeUrl: '/pricing',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment API call count (fire and forget)
    this.quotaService.incrementUsage(organizationId, 'api_calls').catch(() => {});

    return true;
  }

  private getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}
