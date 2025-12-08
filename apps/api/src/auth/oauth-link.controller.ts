import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Response, Request } from "express";

/**
 * OAuth Account Linking Controller
 * Handles linking/unlinking OAuth providers to existing user accounts
 */
@Controller("auth/oauth")
export class OAuthLinkController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get all linked OAuth accounts for the current user
   * GET /auth/oauth/accounts
   */
  @Get("accounts")
  @UseGuards(AuthGuard("jwt"))
  async getLinkedAccounts(@Req() req: any) {
    const accounts = await this.authService.getLinkedAccounts(req.user.id);

    // Return user-friendly format
    return {
      accounts: accounts.map((account: any) => ({
        provider: account.provider,
        linkedAt: account.createdAt,
      })),
    };
  }

  /**
   * Initiate Google account linking flow
   * GET /auth/oauth/link/google?token=<jwt>
   *
   * The token parameter should contain the user's JWT access token
   * This will be stored in session state and verified on callback
   */
  @Get("link/google")
  async linkGoogleInitiate(@Query("token") token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException("Authentication token required");
    }

    // Verify token is valid
    try {
      this.authService.verifyToken(token);
    } catch (error) {
      throw new BadRequestException("Invalid authentication token");
    }

    // Redirect to Google OAuth with state parameter containing token
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?state=${encodeURIComponent(JSON.stringify({ mode: 'link', token }))}`;
    res.redirect(googleAuthUrl);
  }

  /**
   * Google OAuth callback for account linking
   * GET /auth/oauth/link/google/callback
   */
  @Get("link/google/callback")
  @UseGuards(AuthGuard("google"))
  async linkGoogleCallback(
    @Req() req: any,
    @Res() res: Response,
    @Query("state") state: string,
  ) {
    try {
      // Parse state to get original token
      const stateData = JSON.parse(decodeURIComponent(state || "{}"));

      if (!stateData.token || stateData.mode !== 'link') {
        throw new BadRequestException("Invalid linking session");
      }

      // Verify the token is still valid
      const decoded = this.authService.verifyToken(stateData.token);
      const userId = decoded.sub;

      // Link the OAuth account
      await this.authService.linkOAuthAccount(userId, "google", req.user);

      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/security?oauth=linked&provider=Google`
      );
    } catch (error: any) {
      const message = error.message || "Failed to link account";
      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/security?oauth=error&message=${encodeURIComponent(message)}`
      );
    }
  }

  /**
   * Initiate GitHub account linking flow
   * GET /auth/oauth/link/github?token=<jwt>
   */
  @Get("link/github")
  async linkGithubInitiate(@Query("token") token: string, @Res() res: Response) {
    if (!token) {
      throw new BadRequestException("Authentication token required");
    }

    // Verify token is valid
    try {
      this.authService.verifyToken(token);
    } catch (error) {
      throw new BadRequestException("Invalid authentication token");
    }

    // Redirect to GitHub OAuth with state parameter containing token
    const githubAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/github?state=${encodeURIComponent(JSON.stringify({ mode: 'link', token }))}`;
    res.redirect(githubAuthUrl);
  }

  /**
   * GitHub OAuth callback for account linking
   * GET /auth/oauth/link/github/callback
   */
  @Get("link/github/callback")
  @UseGuards(AuthGuard("github"))
  async linkGithubCallback(
    @Req() req: any,
    @Res() res: Response,
    @Query("state") state: string,
  ) {
    try {
      // Parse state to get original token
      const stateData = JSON.parse(decodeURIComponent(state || "{}"));

      if (!stateData.token || stateData.mode !== 'link') {
        throw new BadRequestException("Invalid linking session");
      }

      // Verify the token is still valid
      const decoded = this.authService.verifyToken(stateData.token);
      const userId = decoded.sub;

      // Link the OAuth account
      await this.authService.linkOAuthAccount(userId, "github", req.user);

      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/security?oauth=linked&provider=GitHub`
      );
    } catch (error: any) {
      const message = error.message || "Failed to link account";
      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/security?oauth=error&message=${encodeURIComponent(message)}`
      );
    }
  }

  /**
   * Unlink an OAuth provider from the user's account
   * DELETE /auth/oauth/unlink/:provider
   */
  @Delete("unlink/:provider")
  @UseGuards(AuthGuard("jwt"))
  async unlinkOAuth(@Req() req: any, @Param("provider") provider: string) {
    const validProviders = ["google", "github"];

    if (!validProviders.includes(provider.toLowerCase())) {
      throw new BadRequestException(`Invalid provider. Must be one of: ${validProviders.join(", ")}`);
    }

    return this.authService.unlinkOAuthAccount(req.user.id, provider.toLowerCase());
  }
}
