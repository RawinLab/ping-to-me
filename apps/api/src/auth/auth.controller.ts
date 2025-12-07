import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) { }

  @Post('register')
  async register(@Body() body: { email: string; password?: string; name?: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
    );
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return { accessToken, user: req.user };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.refresh(req.user);
    // Optionally rotate refresh token here
    return { accessToken };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    // Audit log: Logout
    if (req.user?.id) {
      await this.auditService.logSecurityEvent(req.user.id, 'auth.logout', {
        status: 'success',
      });
    }

    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
    );
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
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

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Req() req) { }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req, @Res() res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
    );
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?login=success`);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
