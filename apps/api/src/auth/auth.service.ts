import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  async register(email: string, name?: string) {
    // In real app: Hash password, create user in Supabase Auth
    // Here: Create user in DB directly for MVP simulation
    return this.prisma.user.create({
      data: {
        email,
        name,
      },
    });
  }

  async login(email: string) {
    // In real app: Validate credentials with Supabase Auth
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { accessToken: 'mock-jwt-token', user };
  }
}
