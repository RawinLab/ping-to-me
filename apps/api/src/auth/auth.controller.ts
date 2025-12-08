import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
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
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user, req);

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
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { accessToken, user: req.user };
  }

  @Post("login/2fa")
  async login2fa(@Body() dto: Login2faDto, @Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.verify2FAAndLogin(
      dto.sessionToken,
      dto.code,
      req,
    );

    // Set refresh token cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, user };
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.refresh(req.user);
    // Optionally rotate refresh token here
    return { accessToken };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    // Get current session from refresh token cookie
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      try {
        const session = await this.sessionService.findSessionByToken(refreshToken);
        if (session) {
          await this.sessionService.invalidateSession(session.id);
        }
      } catch (error) {
        // Log error but continue with logout
        console.error('Error invalidating session:', error);
      }
    }

    // Audit log: Logout
    if (req.user?.id) {
      await this.auditService.logSecurityEvent(req.user.id, "auth.logout", {
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
      sameSite: "lax",
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
      sameSite: "lax",
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
}
