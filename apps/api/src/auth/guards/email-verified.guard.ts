import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRE_EMAIL_VERIFICATION_KEY } from "../decorators/require-email-verification.decorator";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route requires email verification
    const requireEmailVerification = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_EMAIL_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If email verification is not required, skip the check
    if (!requireEmailVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let other guards handle auth
    }

    if (!user.emailVerified) {
      throw new ForbiddenException("Email verification required");
    }

    return true;
  }
}
