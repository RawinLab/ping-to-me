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

      throw new UnauthorizedException(
        `Account is locked due to too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minute(s).`
      );
    }

    // Validate user credentials
    const user = await this.authService.validateUser(email, pass, req);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
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
