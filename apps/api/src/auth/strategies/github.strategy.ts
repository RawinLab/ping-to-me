import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-github2";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  private readonly logger = new Logger(GithubStrategy.name);
  private readonly isConfigured: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get("GITHUB_ID");
    const clientSecret = configService.get("GITHUB_SECRET");
    const isConfigured = !!(clientID && clientSecret);

    super({
      clientID: clientID || "not-configured",
      clientSecret: clientSecret || "not-configured",
      callbackURL: `${configService.get("NEXT_PUBLIC_API_URL") || "http://localhost:3001"}/auth/github/callback`,
      scope: ["user:email"],
    });

    this.isConfigured = isConfigured;
    if (!isConfigured) {
      this.logger.warn(
        "GitHub OAuth is disabled - GITHUB_ID and GITHUB_SECRET not configured",
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const user = await this.authService.validateOAuthUser(profile, "github");
    done(null, user);
  }
}
