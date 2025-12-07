import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SafetyCheckResult {
  safe: boolean;
  status: 'safe' | 'unsafe' | 'pending' | 'unknown';
  threats: string[];
  checkedAt: Date;
}

@Injectable()
export class SafetyCheckService {
  private readonly logger = new Logger(SafetyCheckService.name);
  private readonly SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
  private readonly API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

  constructor(private prisma: PrismaService) {}

  async checkUrl(url: string): Promise<SafetyCheckResult> {
    // If no API key, mark as unknown
    if (!this.SAFE_BROWSING_API_KEY) {
      this.logger.warn('Google Safe Browsing API key not configured');
      return {
        safe: true,
        status: 'unknown',
        threats: [],
        checkedAt: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.API_URL}?key=${this.SAFE_BROWSING_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId: 'pingtome',
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`Safe Browsing API error: ${response.status}`);
        return {
          safe: true,
          status: 'unknown',
          threats: [],
          checkedAt: new Date(),
        };
      }

      const data = await response.json();
      const threats = data.matches?.map((m: any) => m.threatType) || [];

      return {
        safe: threats.length === 0,
        status: threats.length === 0 ? 'safe' : 'unsafe',
        threats,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Safe Browsing API check failed:', error);
      return {
        safe: true,
        status: 'unknown',
        threats: [],
        checkedAt: new Date(),
      };
    }
  }

  async updateLinkSafety(linkId: string, result: SafetyCheckResult): Promise<void> {
    await this.prisma.link.update({
      where: { id: linkId },
      data: {
        safetyStatus: result.status,
        safetyCheckDate: result.checkedAt,
        safetyThreats: result.threats,
      },
    });
  }

  async checkAndUpdateLink(linkId: string, url: string): Promise<SafetyCheckResult> {
    const result = await this.checkUrl(url);
    await this.updateLinkSafety(linkId, result);
    return result;
  }
}
