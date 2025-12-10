import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LoginSecurityService } from "./login-security.service";
import { LoginActivityQueryDto, LoginActivityResponseDto } from "./dto/login-activity.dto";

@Controller("auth/login-activity")
@UseGuards(AuthGuard("jwt"))
export class LoginActivityController {
  constructor(private readonly loginSecurityService: LoginSecurityService) {}

  /**
   * GET /auth/login-activity
   * View recent login history for current user (both successful and failed)
   * Supports filtering by success status via query param
   */
  @Get()
  async getLoginActivity(
    @Req() req,
    @Query() query: LoginActivityQueryDto,
  ): Promise<LoginActivityResponseDto> {
    const email = req.user.email;
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const success = query.success;

    return this.loginSecurityService.getLoginActivity(email, page, limit, success);
  }

  /**
   * GET /auth/login-activity/failed
   * View only failed login attempts for current user
   */
  @Get("failed")
  async getFailedLoginActivity(
    @Req() req,
    @Query() query: LoginActivityQueryDto,
  ): Promise<LoginActivityResponseDto> {
    const email = req.user.email;
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;

    return this.loginSecurityService.getFailedLoginActivity(email, page, limit);
  }
}
