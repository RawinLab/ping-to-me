import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { LoginSecurityService } from "../login-security.service";
import { Request } from "express";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private loginSecurityService: LoginSecurityService,
  ) {
    super({
      usernameField: "email",
      passReqToCallback: true // Enable request object in validate method
    });
  }

  async validate(req: Request, email: string, pass: string): Promise<any> {
    // Check if account is locked
    const lockStatus = await this.loginSecurityService.checkAccountLocked(email);

    if (lockStatus.locked) {
      // Log the failed attempt due to account lock
      await this.loginSecurityService.logLoginAttempt(
        email,
        false,
        req,
        "account_locked",
      );

      throw new UnauthorizedException({
        message: `Account is locked due to too many failed login attempts. Try again in ${lockStatus.remainingMinutes} minute(s).`,
        locked: true,
        remainingMinutes: lockStatus.remainingMinutes,
      });
    }

    // Validate user credentials
    const user = await this.authService.validateUser(email, pass, req);

    if (!user) {
      // Log failed login attempt (already logged in authService.validateUser, but not counted in lock check)
      // Note: AuthService already logs this, so we don't need to log again
      throw new UnauthorizedException("Invalid email or password");
    }

    // Log successful login attempt
    await this.loginSecurityService.logLoginAttempt(
      email,
      true,
      req,
    );

    return user;
  }
}
