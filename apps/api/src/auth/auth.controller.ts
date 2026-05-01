import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";
import { LoginSecurityService } from "./login-security.service";
import { AuditService } from "../audit/audit.service";
import { Response } from "express";
import {
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  Login2faDto,
  ChangePasswordDto,
} from "./dto";
import { GetUser } from "./decorators";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly loginSecurityService: LoginSecurityService,
    private readonly auditService: AuditService,
  ) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Req() req, @Body() body: any, @Res({ passthrough: true }) res: Response) {
    const fingerprint = body.fingerprint;
    const result = await this.authService.login(req.user, req, fingerprint);

    // Check if verification is required (high risk)
    if ('requiresVerification' in result && result.requiresVerification) {
      // Return verification challenge (no tokens or cookies yet)
      return result;
    }

    // Check if 2FA is required
    if ('requires2FA' in result && result.requires2FA) {
      // Return 2FA challenge (no tokens or cookies yet)
      return result;
    }

    // Normal login flow - set refresh token cookie
    const { accessToken, refreshToken } = result;
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === "production" ? ".pingto.me" : undefined),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { accessToken, user: req.user, riskScore: result.riskScore };
  }

  @Post("login/2fa")
  async login2fa(@Body() dto: any, @Req() req, @Res({ passthrough: true }) res: Response) {
    const { sessionToken, code, fingerprint } = dto;
    const { accessToken, refreshToken, user } = await this.authService.verify2FAAndLogin(
      sessionToken,
      code,
      req,
      fingerprint,
    );

    // Set refresh token cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === "production" ? ".pingto.me" : undefined),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, user };
  }

  @Post("login/verify-email")
  async verifyLoginEmail(@Body() dto: any, @Req() req, @Res({ passthrough: true }) res: Response) {
    const { verificationToken, fingerprint } = dto;
    const result = await this.authService.verifyLoginEmail(
      verificationToken,
      req,
      fingerprint,
    );

    // Check if 2FA is still required after email verification
    if ('requires2FA' in result && result.requires2FA) {
      return result;
    }

    // Set refresh token cookie
    const { accessToken, refreshToken } = result;
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === "production" ? ".pingto.me" : undefined),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, user: result.user };
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    // Get old refresh token from cookie (handle duplicate cookies from domain migration)
    let oldRefreshToken = req.cookies?.refresh_token;
    if (Array.isArray(oldRefreshToken)) {
      oldRefreshToken = oldRefreshToken[oldRefreshToken.length - 1];
    }

    if (!oldRefreshToken) {
      throw new BadRequestException('Refresh token not found');
    }

    // Rotate refresh token
    const { accessToken } = await this.authService.refresh(
      req.user,
      oldRefreshToken,
      req,
    );

    return { accessToken };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async getProfile(@Req() req) {
    const user = await this.authService.getUserProfile(req.user.id);
    return user;
  }

  @Post("logout")
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    // Get current session from refresh token cookie
    const refreshToken = req.cookies?.refresh_token;
    let userId: string | null = null;

    if (refreshToken) {
      try {
        const session = await this.sessionService.findSessionByToken(refreshToken);
        if (session) {
          userId = session.userId;
          await this.sessionService.invalidateSession(session.id);
        }
      } catch (error) {
        // Log error but continue with logout
        console.error('Error invalidating session:', error);
      }
    }

    // Audit log: Logout (use userId from session if available)
    const auditUserId = req.user?.id || userId;
    if (auditUserId) {
      await this.auditService.logSecurityEvent(auditUserId, "auth.logout", {
        status: "success",
      });
    }

    res.clearCookie("refresh_token");
    return { message: "Logged out successfully" };
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth(@Req() req) {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      req,
    );
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === "production" ? ".pingto.me" : undefined),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Redirect to frontend with access token (or just redirect and let frontend fetch me)
    // Sending token in query param is not ideal but common for initial handoff.
    // Better: Redirect to a frontend page that calls /refresh to get the token?
    // Or just set the refresh cookie and redirect to dashboard, then dashboard calls /refresh?
    // Let's try: Redirect to dashboard, frontend checks cookie? No, frontend can't read httpOnly cookie.
    // Frontend should call /auth/refresh on load if no access token.
    res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?login=success`);
  }

  @Get("github")
  @UseGuards(AuthGuard("github"))
  async githubAuth(@Req() req) {}

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  async githubAuthRedirect(@Req() req, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      req,
    );
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === "production" ? ".pingto.me" : undefined),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?login=success`);
  }

  @Post("verify-email")
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get("account-status")
  async getAccountStatus(@Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }
    return this.loginSecurityService.checkAccountLocked(email);
  }

  @Post("change-password")
  @UseGuards(AuthGuard("jwt"))
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req,
  ) {
    // Get current session ID from refresh token cookie if available
    const refreshToken = req.cookies?.refresh_token;
    let sessionId: string | undefined;

    if (refreshToken) {
      try {
        const session = await this.sessionService.findSessionByToken(refreshToken);
        sessionId = session?.id;
      } catch (error) {
        // Continue without session ID if lookup fails
        console.error('Error looking up session:', error);
      }
    }

    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
      sessionId,
    );
  }

  @Post("resend-verification")
  @UseGuards(AuthGuard("jwt"))
  @Throttle({ default: { limit: 1, ttl: 120000 } }) // 1 request per 2 minutes
  async resendVerification(@Req() req) {
    if (req.user.emailVerified) {
      throw new BadRequestException("Email already verified");
    }
    return this.authService.sendVerificationEmail(req.user.id, req.user.email);
  }

  @Get("linked-accounts")
  @UseGuards(AuthGuard("jwt"))
  async getLinkedAccounts(@GetUser() user: any) {
    return this.authService.getLinkedAccounts(user.id);
  }

  @Get("oauth/link/:provider")
  @UseGuards(AuthGuard("jwt"))
  async initiateOAuthLink(
    @Param("provider") provider: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException("Invalid OAuth provider");
    }

    // Store user ID in session state to link after callback
    const state = Buffer.from(
      JSON.stringify({ userId: user.id, action: "link" }),
    ).toString("base64");

    // Redirect to OAuth provider with state
    const redirectUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/link/${provider}/callback`;
    const callbackUrl =
      provider === "google"
        ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=email profile&state=${state}`
        : `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=user:email&state=${state}`;

    res.redirect(callbackUrl);
  }

  @Get("oauth/link/:provider/callback")
  async handleOAuthLinkCallback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/profile?error=oauth_link_failed`,
      );
    }

    try {
      // Decode state to get user ID
      const { userId, action } = JSON.parse(
        Buffer.from(state, "base64").toString(),
      );

      if (action !== "link") {
        throw new BadRequestException("Invalid OAuth action");
      }

      // Exchange code for token and get profile
      // For Google
      if (provider === "google") {
        const tokenResponse = await fetch(
          "https://oauth2.googleapis.com/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/link/google/callback`,
              grant_type: "authorization_code",
            }),
          },
        );
        const tokens = await tokenResponse.json();

        const profileResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        );
        const profile = await profileResponse.json();

        // Convert Google profile to expected format
        const formattedProfile = {
          id: profile.id,
          emails: [{ value: profile.email }],
          displayName: profile.name,
        };

        await this.authService.linkOAuthAccount(
          userId,
          provider,
          formattedProfile,
        );
      }
      // For GitHub
      else if (provider === "github") {
        const tokenResponse = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              client_id: process.env.GITHUB_ID,
              client_secret: process.env.GITHUB_SECRET,
              redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/link/github/callback`,
            }),
          },
        );
        const tokens = await tokenResponse.json();

        const profileResponse = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await profileResponse.json();

        const emailsResponse = await fetch(
          "https://api.github.com/user/emails",
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        );
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);

        // Convert GitHub profile to expected format
        const formattedProfile = {
          id: profile.id.toString(),
          emails: [{ value: primaryEmail?.email || emails[0]?.email }],
          displayName: profile.name || profile.login,
        };

        await this.authService.linkOAuthAccount(
          userId,
          provider,
          formattedProfile,
        );
      }

      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/profile?success=oauth_linked`,
      );
    } catch (error) {
      console.error("OAuth link error:", error);
      res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/profile?error=oauth_link_failed`,
      );
    }
  }

  @Delete("oauth/unlink/:provider")
  @UseGuards(AuthGuard("jwt"))
  async unlinkOAuth(
    @Param("provider") provider: string,
    @GetUser() user: any,
  ) {
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException("Invalid OAuth provider");
    }

    return this.authService.unlinkOAuthAccount(user.id, provider);
  }
}
