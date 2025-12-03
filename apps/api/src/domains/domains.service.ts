import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import * as dns from 'dns/promises';

@Injectable()
export class DomainService {
  private prisma = new PrismaClient();

  async addDomain(userId: string, orgId: string, hostname: string) {
    // Verify org membership (simplified for now, ideally check OrganizationMember)
    // const member = await this.prisma.organizationMember.findUnique(...)

    // Check if domain exists
    const existing = await this.prisma.domain.findUnique({ where: { hostname } });
    if (existing) throw new Error('Domain already registered');

    const verificationToken = `pingtome-verification=${Math.random().toString(36).substring(7)}`;

    return this.prisma.domain.create({
      data: {
        hostname,
        organizationId: orgId,
        isVerified: false,
        verificationToken,
      },
    });
  }

  async verifyDomain(userId: string, id: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    if (domain.isVerified) return domain;

    try {
      const records = await dns.resolveTxt(domain.hostname);
      // records is string[][]
      const flatRecords = records.flat();
      const isVerified = flatRecords.includes(domain.verificationToken);

      if (isVerified) {
        return this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });
      }
      throw new Error('DNS record not found');
    } catch (error) {
      // Allow bypassing for localhost testing if needed, or just fail
      if (domain.hostname.endsWith('.localhost')) {
        return this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });
      }
      throw new Error(`Verification failed: ${(error as any).message}`);
    }
  }

  async listDomains(userId: string, orgId: string) {
    return this.prisma.domain.findMany({
      where: { organizationId: orgId },
    });
  }

  async removeDomain(userId: string, id: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    return this.prisma.domain.delete({
      where: { id },
    });
  }
}
