import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pingtome/database';
import * as dns from 'dns/promises';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DomainService {
  private prisma = new PrismaClient();

  constructor(private readonly auditService: AuditService) {}

  async addDomain(userId: string, orgId: string, hostname: string) {
    // Verify org membership (simplified for now, ideally check OrganizationMember)
    // const member = await this.prisma.organizationMember.findUnique(...)

    // Check if domain exists
    const existing = await this.prisma.domain.findUnique({ where: { hostname } });
    if (existing) throw new Error('Domain already registered');

    const verificationToken = `pingtome-verification=${Math.random().toString(36).substring(7)}`;

    const domain = await this.prisma.domain.create({
      data: {
        hostname,
        organizationId: orgId,
        isVerified: false,
        verificationToken,
      },
    });

    // Audit log - async, non-blocking
    this.auditService
      .logDomainEvent(userId, orgId, 'domain.added', {
        id: domain.id,
        hostname: domain.hostname,
      })
      .catch((err) => console.error('Failed to log domain.added event:', err));

    return domain;
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
        const updatedDomain = await this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });

        // Audit log - domain verified successfully
        this.auditService
          .logDomainEvent(userId, domain.organizationId, 'domain.verified', {
            id: updatedDomain.id,
            hostname: updatedDomain.hostname,
          })
          .catch((err) => console.error('Failed to log domain.verified event:', err));

        return updatedDomain;
      }
      throw new Error('DNS record not found');
    } catch (error) {
      // Allow bypassing for localhost testing if needed, or just fail
      if (domain.hostname.endsWith('.localhost')) {
        const updatedDomain = await this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });

        // Audit log - domain verified (localhost bypass)
        this.auditService
          .logDomainEvent(userId, domain.organizationId, 'domain.verified', {
            id: updatedDomain.id,
            hostname: updatedDomain.hostname,
          }, {
            details: { localhostBypass: true },
          })
          .catch((err) => console.error('Failed to log domain.verified event:', err));

        return updatedDomain;
      }

      // Audit log - domain verification failed
      this.auditService
        .logDomainEvent(userId, domain.organizationId, 'domain.failed', {
          id: domain.id,
          hostname: domain.hostname,
        }, {
          status: 'failure',
          details: {
            reason: (error as any).message,
          },
        })
        .catch((err) => console.error('Failed to log domain.failed event:', err));

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

    const deletedDomain = await this.prisma.domain.delete({
      where: { id },
    });

    // Audit log - domain removed
    this.auditService
      .logDomainEvent(userId, domain.organizationId, 'domain.removed', {
        id: deletedDomain.id,
        hostname: deletedDomain.hostname,
      })
      .catch((err) => console.error('Failed to log domain.removed event:', err));

    return deletedDomain;
  }
}
