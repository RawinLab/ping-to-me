import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PasskeyService } from './passkey.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import {
  RegisterPasskeyOptionsDto,
  VerifyPasskeyRegistrationDto,
  PasskeyLoginOptionsDto,
  VerifyPasskeyLoginDto,
  RenamePasskeyDto,
} from './dto/passkey.dto';

@ApiTags('Passkeys')
@Controller('auth/passkey')
export class PasskeyController {
  constructor(
    private passkeyService: PasskeyService,
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  /**
   * Generate registration options for adding a new passkey or security key
   */
  @Post('register/options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate registration options for a new passkey or hardware security key' })
  @ApiResponse({ status: 200, description: 'Registration options generated successfully' })
  async generateRegistrationOptions(@Request() req, @Body() dto: RegisterPasskeyOptionsDto) {
    // Support both 'platform' (passkeys) and 'cross-platform' (hardware security keys)
    const authenticatorType = dto.authenticatorType || 'platform';
    const options = await this.passkeyService.generateRegistrationOptions(req.user.id, authenticatorType);
    return { options };
  }

  /**
   * Verify and save a new passkey
   */
  @Post('register/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and save a new passkey' })
  @ApiResponse({ status: 201, description: 'Passkey registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration response' })
  async verifyRegistration(@Request() req, @Body() dto: VerifyPasskeyRegistrationDto) {
    const passkey = await this.passkeyService.verifyRegistration(
      req.user.id,
      dto.registrationResponse,
      dto.name,
    );

    // Audit log
    await this.auditService.log({
      userId: req.user.id,
      action: 'passkey.registered',
      resource: 'Passkey',
      resourceId: passkey.id,
      status: 'success',
      details: {
        passkeyName: passkey.name,
        authenticatorType: passkey.authenticatorType,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return {
      success: true,
      passkey,
      message: 'Passkey registered successfully',
    };
  }

  /**
   * Generate authentication options for passkey login
   */
  @Post('login/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate authentication options for passkey login' })
  @ApiResponse({ status: 200, description: 'Authentication options generated successfully' })
  async generateAuthenticationOptions(@Body() dto: PasskeyLoginOptionsDto) {
    const options = await this.passkeyService.generateAuthenticationOptions(dto.email);
    return { options };
  }

  /**
   * Verify passkey and login
   */
  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify passkey and complete login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid passkey' })
  async verifyAuthentication(@Request() req, @Body() dto: VerifyPasskeyLoginDto) {
    const { userId } = await this.passkeyService.verifyAuthentication(dto.authenticationResponse);

    // Get user details
    const user = await this.authService.validateUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.authService.login(user);

    // Audit log
    await this.auditService.log({
      userId: user.id,
      action: 'passkey.authenticated',
      resource: 'Passkey',
      status: 'success',
      details: {
        email: user.email,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Login successful',
    };
  }

  /**
   * Get all passkeys for the current user
   */
  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all passkeys for the current user' })
  @ApiResponse({ status: 200, description: 'Passkeys retrieved successfully' })
  async listPasskeys(@Request() req) {
    const passkeys = await this.passkeyService.getUserPasskeys(req.user.id);
    return { passkeys };
  }

  /**
   * Delete a passkey
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey deleted successfully' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async deletePasskey(@Request() req, @Param('id') passkeyId: string) {
    // Get passkey info before deletion for audit log
    const passkeys = await this.passkeyService.getUserPasskeys(req.user.id);
    const passkey = passkeys.find((p) => p.id === passkeyId);

    await this.passkeyService.deletePasskey(req.user.id, passkeyId);

    // Audit log
    await this.auditService.log({
      userId: req.user.id,
      action: 'passkey.deleted',
      resource: 'Passkey',
      resourceId: passkeyId,
      status: 'success',
      details: {
        passkeyName: passkey?.name,
        authenticatorType: passkey?.authenticatorType,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return {
      success: true,
      message: 'Passkey deleted successfully',
    };
  }

  /**
   * Rename a passkey
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey renamed successfully' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async renamePasskey(
    @Request() req,
    @Param('id') passkeyId: string,
    @Body() dto: RenamePasskeyDto,
  ) {
    // Get old name for audit log
    const passkeys = await this.passkeyService.getUserPasskeys(req.user.id);
    const oldPasskey = passkeys.find((p) => p.id === passkeyId);

    const passkey = await this.passkeyService.renamePasskey(req.user.id, passkeyId, dto.name);

    // Audit log
    await this.auditService.log({
      userId: req.user.id,
      action: 'passkey.renamed',
      resource: 'Passkey',
      resourceId: passkeyId,
      status: 'success',
      changes: {
        before: { name: oldPasskey?.name },
        after: { name: dto.name },
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return {
      success: true,
      passkey,
      message: 'Passkey renamed successfully',
    };
  }
}
