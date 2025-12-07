import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { AuditService } from '../audit/audit.service';
import {
  SessionListResponseDto,
  LogoutSessionResponseDto,
  LogoutAllSessionsResponseDto,
} from './dto/session.dto';

@ApiTags('auth/sessions')
@Controller('auth/sessions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all active sessions for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: SessionListResponseDto,
  })
  async listActiveSessions(@Req() req): Promise<SessionListResponseDto> {
    const userId = req.user.id;

    // Extract current session token from cookies or authorization header
    const currentSessionToken = this.extractSessionToken(req);

    const sessions = await this.sessionService.getActiveSessions(
      userId,
      currentSessionToken,
    );

    // Audit log: User viewed their active sessions
    await this.auditService.logSecurityEvent(
      userId,
      'session.list_viewed',
      {
        status: 'success',
        details: { sessionCount: sessions.length },
      },
    );

    return {
      sessions,
      total: sessions.length,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Logout specific session' })
  @ApiResponse({
    status: 200,
    description: 'Session terminated successfully',
    type: LogoutSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete current session',
  })
  @ApiResponse({
    status: 403,
    description: 'Session does not belong to user',
  })
  async logoutSession(
    @Req() req,
    @Param('id') sessionId: string,
  ): Promise<LogoutSessionResponseDto> {
    const userId = req.user.id;

    // Get the session to verify ownership
    const session = await this.sessionService.findSessionByToken(
      this.extractSessionToken(req),
    );

    // Verify the session being deleted exists
    const targetSession = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      throw new BadRequestException('Session not found');
    }

    // Verify the session belongs to the current user
    if (targetSession.userId !== userId) {
      throw new ForbiddenException('Cannot delete session of another user');
    }

    // Cannot delete current session using this endpoint (must use regular logout)
    if (session && session.id === sessionId) {
      throw new BadRequestException(
        'Cannot delete current session. Use /auth/logout instead',
      );
    }

    // Invalidate the session
    await this.sessionService.invalidateSession(sessionId);

    // Audit log: Session terminated
    await this.auditService.logSecurityEvent(
      userId,
      'session.terminated',
      {
        status: 'success',
        details: {
          sessionId,
          deviceInfo: targetSession.deviceInfo,
          ipAddress: targetSession.ipAddress,
        },
      },
    );

    return {
      message: 'Session terminated successfully',
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Logout all other sessions (keep current)' })
  @ApiResponse({
    status: 200,
    description: 'All other sessions terminated',
    type: LogoutAllSessionsResponseDto,
  })
  async logoutAllOtherSessions(@Req() req): Promise<LogoutAllSessionsResponseDto> {
    const userId = req.user.id;

    // Get current session
    const currentSession = await this.sessionService.findSessionByToken(
      this.extractSessionToken(req),
    );

    // Invalidate all sessions except current
    const count = await this.sessionService.invalidateAllSessions(
      userId,
      currentSession?.id,
    );

    // Audit log: All other sessions terminated
    await this.auditService.logSecurityEvent(
      userId,
      'session.all_other_terminated',
      {
        status: 'success',
        details: { count },
      },
    );

    return {
      message: 'All other sessions terminated',
      count,
    };
  }

  /**
   * Extract session token from request
   * First tries refresh_token cookie, then falls back to Authorization header
   */
  private extractSessionToken(req: any): string | undefined {
    // Try to get refresh token from cookie
    if (req.cookies?.refresh_token) {
      return req.cookies.refresh_token;
    }

    // Fallback: try to extract from Authorization header
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  // Inject PrismaService for session verification
  private get prisma() {
    return this.sessionService['prisma'];
  }
}
