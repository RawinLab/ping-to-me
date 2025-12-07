import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { TwoFactorService } from "./two-factor.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import {
  GenerateBackupCodesDto,
  VerifyBackupCodeDto,
  BackupCodesResponseDto,
} from "./dto";

@Controller("auth/2fa")
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("status")
  async getStatus(@Request() req) {
    return this.twoFactorService.getStatus(req.user.id);
  }

  @Post("setup")
  async setup(@Request() req) {
    return this.twoFactorService.generateSecret(req.user.id);
  }

  @Post("verify")
  async verify(@Request() req, @Body() body: { token: string }) {
    return this.twoFactorService.verifyAndEnable(req.user.id, body.token);
  }

  @Post("disable")
  async disable(@Request() req, @Body() body: { token: string }) {
    return this.twoFactorService.disable(req.user.id, body.token);
  }

  /**
   * Generate new backup codes
   * Requires 2FA to be enabled and password confirmation
   */
  @Post("backup-codes")
  async generateBackupCodes(
    @Request() req,
    @Body() dto: GenerateBackupCodesDto,
  ): Promise<BackupCodesResponseDto> {
    // Check if 2FA is enabled
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { twoFactorEnabled: true, password: true },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException("2FA is not enabled");
    }

    // Verify password
    if (!user.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid password");
    }

    // Generate new backup codes
    const codes = await this.twoFactorService.generateBackupCodes(req.user.id);

    return {
      codes,
      message:
        "Backup codes generated successfully. Store them in a safe place. Each code can only be used once.",
    };
  }

  /**
   * Verify a backup code (for testing)
   */
  @Post("verify-backup")
  async verifyBackup(@Request() req, @Body() dto: VerifyBackupCodeDto) {
    const isValid = await this.twoFactorService.verifyBackupCode(
      req.user.id,
      dto.code,
    );

    if (!isValid) {
      throw new BadRequestException("Invalid or already used backup code");
    }

    return { success: true, message: "Backup code verified successfully" };
  }

  /**
   * Get count of remaining unused backup codes
   */
  @Get("backup-codes/remaining")
  async getRemainingBackupCodes(@Request() req) {
    const count =
      await this.twoFactorService.getRemainingBackupCodesCount(req.user.id);

    return {
      remaining: count,
      total: 8,
    };
  }
}
