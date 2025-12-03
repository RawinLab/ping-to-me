import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import * as dns from 'dns/promises';

@Injectable()
export class DomainService {
  private prisma = new PrismaClient();

  async addDomain(userId: string, orgId: string, hostname: string) {
    // Check if domain exists
    const existing = await this.prisma.domain.findUnique({ where: { hostname } });
    if (existing) throw new Error('Domain already registered');

    return this.prisma.domain.create({
      data: {
        hostname,
        organizationId: orgId,
        isVerified: false,
      },
    });
  }

  async verifyDomain(userId: string, id: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    // Mock DNS verification or real check
    // In real app: Check TXT record or CNAME pointing to our service
    try {
      // const records = await dns.resolveCname(domain.hostname);
      // const isVerified = records.includes('cname.pingto.me');
      const isVerified = true; // Mock success

      if (isVerified) {
        return this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });
      }
      throw new Error('DNS record not found');
    } catch (error) {
      throw new Error('Verification failed');
    }
  }

  async listDomains(userId: string, orgId: string) {
    return this.prisma.domain.findMany({
      where: { organizationId: orgId },
    });
  }
}
