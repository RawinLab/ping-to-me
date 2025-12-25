import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);
  private readonly isConfigured: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get("GOOGLE_CLIENT_SECRET");
    const isConfigured = !!(clientID && clientSecret);

    super({
      clientID: clientID || "not-configured",
      clientSecret: clientSecret || "not-configured",
      callbackURL: `${configService.get("NEXT_PUBLIC_API_URL") || "http://localhost:3001"}/auth/google/callback`,
      scope: ["email", "profile"],
    });

    this.isConfigured = isConfigured;
    if (!isConfigured) {
      this.logger.warn(
        "Google OAuth is disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured",
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = await this.authService.validateOAuthUser(profile, "google");
    done(null, user);
  }
}
