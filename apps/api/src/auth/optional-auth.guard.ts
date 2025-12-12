import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import * as jwt from "jsonwebtoken";

/**
 * Optional Auth Guard
 *
 * This guard attempts to authenticate via JWT but does NOT throw an error
 * if no JWT token is present. This allows API key authentication to work
 * alongside JWT authentication.
 *
 * Use this guard BEFORE ApiScopeGuard when endpoints should support both:
 * - JWT token authentication (via Authorization: Bearer <jwt>)
 * - API key authentication (via x-api-key header)
 *
 * Order of guards matters:
 * @UseGuards(OptionalAuthGuard, ApiScopeGuard, PermissionGuard)
 *
 * Flow:
 * 1. OptionalAuthGuard tries to extract JWT - if found, sets request.user
 * 2. If no JWT, request.user remains undefined (no error thrown)
 * 3. ApiScopeGuard checks for API key - if found, validates and sets request.apiKey
 * 4. ApiScopeGuard allows if request.user exists (JWT) OR valid API key
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // If no token, allow request to proceed (API key auth may handle it)
    if (!token) {
      return true;
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        // No JWT secret configured, allow to proceed
        return true;
      }
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      request["user"] = { id: payload.sub, email: payload.email };
    } catch {
      // Token validation failed, but allow to proceed (API key may work)
      // Don't throw error - just don't set user
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
