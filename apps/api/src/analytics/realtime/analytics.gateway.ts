import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface ClickEventData {
  linkId: string;
  timestamp: Date;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  source?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your environment
    credentials: true,
  },
  namespace: '/analytics',
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socket IDs

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from query parameters
      const token = client.handshake.query.token as string;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const secret = this.configService.get('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Store userId in socket data for later use
      client.data.userId = payload.sub;
      client.data.email = payload.email;

      // Track user's sockets
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to analytics stream',
        userId: payload.sub,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Authentication failed for client ${client.id}:`, errorMessage);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);

      // Clean up empty sets
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:link')
  handleSubscribeLink(
    @ConnectedSocket() client: Socket,
    @MessageBody() linkId: string,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join room for this specific link
    client.join(`link:${linkId}`);

    this.logger.log(`User ${userId} subscribed to link:${linkId}`);

    client.emit('subscribed', {
      type: 'link',
      linkId,
      message: `Subscribed to link ${linkId}`,
    });
  }

  @SubscribeMessage('unsubscribe:link')
  handleUnsubscribeLink(
    @ConnectedSocket() client: Socket,
    @MessageBody() linkId: string,
  ) {
    client.leave(`link:${linkId}`);

    this.logger.log(`User ${client.data.userId} unsubscribed from link:${linkId}`);

    client.emit('unsubscribed', {
      type: 'link',
      linkId,
      message: `Unsubscribed from link ${linkId}`,
    });
  }

  @SubscribeMessage('subscribe:dashboard')
  handleSubscribeDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Join room for user's dashboard (all their links)
    client.join(`dashboard:${userId}`);

    this.logger.log(`User ${userId} subscribed to dashboard`);

    client.emit('subscribed', {
      type: 'dashboard',
      message: 'Subscribed to dashboard analytics',
    });
  }

  @SubscribeMessage('unsubscribe:dashboard')
  handleUnsubscribeDashboard(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      client.leave(`dashboard:${userId}`);

      this.logger.log(`User ${userId} unsubscribed from dashboard`);

      client.emit('unsubscribed', {
        type: 'dashboard',
        message: 'Unsubscribed from dashboard analytics',
      });
    }
  }

  /**
   * Emit a click event to all subscribers of this link
   * Called by AnalyticsService when a new click is tracked
   */
  emitClickEvent(linkId: string, userId: string, clickData: ClickEventData) {
    // Emit to link-specific room
    this.server.to(`link:${linkId}`).emit('click', {
      linkId,
      ...clickData,
    });

    // Emit to user's dashboard room
    this.server.to(`dashboard:${userId}`).emit('click', {
      linkId,
      ...clickData,
    });

    this.logger.debug(`Emitted click event for link ${linkId} to user ${userId}`);
  }

  /**
   * Emit dashboard metrics update
   */
  emitDashboardUpdate(userId: string, metrics: any) {
    this.server.to(`dashboard:${userId}`).emit('dashboard:update', metrics);

    this.logger.debug(`Emitted dashboard update for user ${userId}`);
  }

  /**
   * Get the number of active connections
   */
  getActiveConnections(): number {
    return this.server.sockets.sockets.size;
  }

  /**
   * Get the number of active users
   */
  getActiveUsers(): number {
    return this.userSockets.size;
  }
}
