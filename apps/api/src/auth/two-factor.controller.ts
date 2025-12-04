import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) { }

  @Get('status')
  async getStatus(@Request() req) {
    return this.twoFactorService.getStatus(req.user.id);
  }

  @Post('setup')
  async setup(@Request() req) {
    return this.twoFactorService.generateSecret(req.user.id);
  }

  @Post('verify')
  async verify(@Request() req, @Body() body: { token: string }) {
    return this.twoFactorService.verifyAndEnable(req.user.id, body.token);
  }

  @Post('disable')
  async disable(@Request() req, @Body() body: { token: string }) {
    return this.twoFactorService.disable(req.user.id, body.token);
  }
}
