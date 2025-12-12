import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Optional JWT Auth Guard
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
 * @UseGuards(OptionalJwtAuthGuard, ApiScopeGuard, PermissionGuard)
 *
 * Flow:
 * 1. OptionalJwtAuthGuard tries to extract JWT - if found, sets request.user
 * 2. If no JWT, request.user remains undefined (no error thrown)
 * 3. ApiScopeGuard checks for API key - if found, validates and sets request.apiKey
 * 4. ApiScopeGuard allows if request.user exists (JWT) OR valid API key
 * 5. PermissionGuard checks RBAC permissions
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // If there's a user (JWT was valid), return the user
    // If there's no user or an error, don't throw - just return undefined
    // This allows API key authentication to proceed
    if (user) {
      return user;
    }

    // Return undefined instead of throwing - API key auth can still work
    return undefined;
  }

  // Override canActivate to always return true
  // The actual authentication check happens in handleRequest
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate with JWT
      await super.canActivate(context);
    } catch {
      // Ignore JWT auth errors - API key auth may still work
    }
    return true;
  }
}
