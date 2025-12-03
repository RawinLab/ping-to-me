import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // In a real implementation, verify the token with Supabase Auth
      // For now, we'll just check if it exists and decode it if possible
      // const { data, error } = await supabase.auth.getUser(token);
      // if (error) throw new UnauthorizedException();
      // request['user'] = data.user;

      // Mock implementation for Phase 2
      request['user'] = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'mock@example.com' };
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
