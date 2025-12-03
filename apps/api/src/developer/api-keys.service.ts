import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  private prisma = new PrismaClient();

  async createApiKey(orgId: string, name: string) {
    const key = `pk_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    await this.prisma.apiKey.create({
      data: {
        keyHash,
        name,
        organizationId: orgId,
      },
    });

    return { key }; // Only return the plain key once!
  }

  async listApiKeys(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        // Do NOT select keyHash
      },
    });
  }

  async revokeApiKey(id: string, orgId: string) {
    return this.prisma.apiKey.deleteMany({
      where: {
        id,
        organizationId: orgId,
      },
    });
  }

  async validateApiKey(key: string) {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { organization: true },
    });

    if (apiKey) {
      // Update last used asynchronously
      this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(console.error);
    }

    return apiKey;
  }
}
