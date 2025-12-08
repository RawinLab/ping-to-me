import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsPdfService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate PDF report for a single link
   */
  async generateLinkReport(
    linkId: string,
    userId: string,
    days: number = 30,
  ): Promise<Buffer> {
    // Verify ownership
    const link = await this.prisma.link.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    if (link.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get analytics data
    const analytics = await this.analyticsService.getLinkAnalytics(
      linkId,
      userId,
      days,
    );

    return this.generatePdfDocument(
      `Link Analytics Report: ${link.title || link.slug}`,
      link,
      analytics,
      days,
    );
  }

  /**
   * Generate PDF report for dashboard summary
   */
  async generateDashboardReport(
    userId: string,
    days: number = 30,
  ): Promise<Buffer> {
    // Get user info
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get dashboard metrics
    const metrics = await this.analyticsService.getDashboardMetrics(
      userId,
      days,
    );

    return this.generateDashboardPdfDocument(user, metrics, days);
  }

  /**
   * Generate PDF document for link analytics
   */
  private async generatePdfDocument(
    title: string,
    link: any,
    analytics: any,
    days: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('PingTO.Me Analytics Report', { align: 'center' });
        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated: ${new Date().toLocaleString()}`, {
            align: 'center',
          });
        doc.moveDown(2);

        // Link Information Section
        doc.fontSize(16).font('Helvetica-Bold').text('Link Information');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        this.addLabelValue(doc, 'Title:', link.title || 'N/A');
        this.addLabelValue(doc, 'Short URL:', `https://ptm.to/${link.slug}`);
        this.addLabelValue(doc, 'Destination:', link.originalUrl);
        this.addLabelValue(
          doc,
          'Created:',
          new Date(link.createdAt).toLocaleDateString(),
        );
        this.addLabelValue(doc, 'Report Period:', `Last ${days} days`);
        doc.moveDown(1.5);

        // Summary Statistics Section
        doc.fontSize(16).font('Helvetica-Bold').text('Summary Statistics');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        this.addLabelValue(
          doc,
          'Total Clicks:',
          analytics.totalClicks.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'Unique Visitors:',
          analytics.uniqueVisitors.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'All-Time Clicks:',
          analytics.allTimeClicks.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'Last 7 Days:',
          `${analytics.clicksLast7Days.toLocaleString()} clicks (${analytics.weeklyChange >= 0 ? '+' : ''}${analytics.weeklyChange}%)`,
        );
        this.addLabelValue(
          doc,
          'Period Change:',
          `${analytics.periodChange >= 0 ? '+' : ''}${analytics.periodChange}% vs previous ${days} days`,
        );
        doc.moveDown(1.5);

        // Top Countries Section
        doc.fontSize(16).font('Helvetica-Bold').text('Top Countries');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topCountries = Object.entries(analytics.countries)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topCountries.length > 0) {
          this.drawTable(
            doc,
            ['Country', 'Clicks', 'Percentage'],
            topCountries.map(([country, clicks]: any) => [
              country,
              clicks.toLocaleString(),
              `${Math.round((clicks / analytics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Device Breakdown Section
        doc.fontSize(16).font('Helvetica-Bold').text('Device Breakdown');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const devices = Object.entries(analytics.devices);
        if (devices.length > 0) {
          this.drawTable(
            doc,
            ['Device', 'Clicks', 'Percentage'],
            devices.map(([device, clicks]: any) => [
              device,
              clicks.toLocaleString(),
              `${Math.round((clicks / analytics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Browser Breakdown Section (new page if needed)
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Browser Breakdown');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topBrowsers = Object.entries(analytics.browsers)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topBrowsers.length > 0) {
          this.drawTable(
            doc,
            ['Browser', 'Clicks', 'Percentage'],
            topBrowsers.map(([browser, clicks]: any) => [
              browser,
              clicks.toLocaleString(),
              `${Math.round((clicks / analytics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Operating System Breakdown Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Operating System');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topOS = Object.entries(analytics.os)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topOS.length > 0) {
          this.drawTable(
            doc,
            ['Operating System', 'Clicks', 'Percentage'],
            topOS.map(([os, clicks]: any) => [
              os,
              clicks.toLocaleString(),
              `${Math.round((clicks / analytics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Top Referrers Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Top Referrers');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topReferrers = Object.entries(analytics.referrers)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topReferrers.length > 0) {
          this.drawTable(
            doc,
            ['Referrer', 'Clicks', 'Percentage'],
            topReferrers.map(([referrer, clicks]: any) => [
              referrer === 'direct' ? 'Direct Traffic' : this.truncateText(referrer, 40),
              clicks.toLocaleString(),
              `${Math.round((clicks / analytics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Clicks Over Time Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Clicks Over Time');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        if (analytics.clicksByDate && analytics.clicksByDate.length > 0) {
          // Show summary table with date ranges
          const clicksData = analytics.clicksByDate.slice(-14); // Last 14 days
          this.drawTable(
            doc,
            ['Date', 'Clicks'],
            clicksData.map((item: any) => [
              new Date(item.date).toLocaleDateString(),
              item.clicks.toLocaleString(),
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }

        // Footer
        doc.fontSize(8).font('Helvetica').text(
          `Report generated by PingTO.Me - ${new Date().toISOString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF document for dashboard analytics
   */
  private async generateDashboardPdfDocument(
    user: any,
    metrics: any,
    days: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Dashboard Analytics Report', { align: 'center' });
        doc.moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`User: ${user.name || user.email}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, {
          align: 'center',
        });
        doc.moveDown(2);

        // Summary Statistics Section
        doc.fontSize(16).font('Helvetica-Bold').text('Overview');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        this.addLabelValue(doc, 'Report Period:', `Last ${days} days`);
        this.addLabelValue(
          doc,
          'Total Links:',
          metrics.totalLinks.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'Total Clicks:',
          metrics.totalClicks.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'All-Time Clicks:',
          metrics.allTimeClicks.toLocaleString(),
        );
        this.addLabelValue(
          doc,
          'Period Change:',
          `${metrics.periodChange >= 0 ? '+' : ''}${metrics.periodChange}% vs previous ${days} days`,
        );
        doc.moveDown(1.5);

        // Top Performing Links Section
        doc.fontSize(16).font('Helvetica-Bold').text('Top Performing Links');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        if (metrics.topLinks && metrics.topLinks.length > 0) {
          this.drawTable(
            doc,
            ['Link', 'Title', 'Clicks'],
            metrics.topLinks.map((link: any) => [
              link.slug || 'N/A',
              this.truncateText(link.title || 'Untitled', 30),
              link.clicks.toLocaleString(),
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Top Countries Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Top Countries');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topCountries = Object.entries(metrics.countries || {})
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topCountries.length > 0) {
          this.drawTable(
            doc,
            ['Country', 'Clicks', 'Percentage'],
            topCountries.map(([country, clicks]: any) => [
              country,
              clicks.toLocaleString(),
              `${Math.round((clicks / metrics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Device Breakdown Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Device Breakdown');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const devices = Object.entries(metrics.devices || {});
        if (devices.length > 0) {
          this.drawTable(
            doc,
            ['Device', 'Clicks', 'Percentage'],
            devices.map(([device, clicks]: any) => [
              device,
              clicks.toLocaleString(),
              `${Math.round((clicks / metrics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Browser Breakdown Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Browser Breakdown');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topBrowsers = Object.entries(metrics.browsers || {})
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topBrowsers.length > 0) {
          this.drawTable(
            doc,
            ['Browser', 'Clicks', 'Percentage'],
            topBrowsers.map(([browser, clicks]: any) => [
              browser,
              clicks.toLocaleString(),
              `${Math.round((clicks / metrics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }
        doc.moveDown(1.5);

        // Top Referrers Section
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(16).font('Helvetica-Bold').text('Top Referrers');
        this.drawSectionLine(doc);
        doc.moveDown(0.5);

        const topReferrers = Object.entries(metrics.referrers || {})
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 10);

        if (topReferrers.length > 0) {
          this.drawTable(
            doc,
            ['Referrer', 'Clicks', 'Percentage'],
            topReferrers.map(([referrer, clicks]: any) => [
              referrer === 'direct' ? 'Direct Traffic' : this.truncateText(referrer, 40),
              clicks.toLocaleString(),
              `${Math.round((clicks / metrics.totalClicks) * 100)}%`,
            ]),
          );
        } else {
          doc.fontSize(10).font('Helvetica').text('No data available');
        }

        // Footer
        doc.fontSize(8).font('Helvetica').text(
          `Report generated by PingTO.Me - ${new Date().toISOString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Draw a section line
   */
  private drawSectionLine(doc: typeof PDFDocument.prototype) {
    const y = doc.y;
    doc
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .stroke();
    doc.moveDown(0.3);
  }

  /**
   * Helper: Add label-value pair
   */
  private addLabelValue(
    doc: typeof PDFDocument.prototype,
    label: string,
    value: string,
  ) {
    doc
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(` ${value}`);
  }

  /**
   * Helper: Draw a simple table
   */
  private drawTable(
    doc: typeof PDFDocument.prototype,
    headers: string[],
    rows: string[][],
  ) {
    const startX = 50;
    const startY = doc.y;
    const columnWidth = (doc.page.width - 100) / headers.length;
    const rowHeight = 20;

    // Draw header
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, startX + i * columnWidth, startY, {
        width: columnWidth - 10,
        align: 'left',
      });
    });

    // Draw header line
    const headerLineY = startY + rowHeight - 5;
    doc
      .strokeColor('#D1D5DB')
      .lineWidth(1)
      .moveTo(startX, headerLineY)
      .lineTo(doc.page.width - 50, headerLineY)
      .stroke();

    // Draw rows
    doc.fontSize(9).font('Helvetica');
    let currentY = startY + rowHeight;

    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      row.forEach((cell, colIndex) => {
        doc.text(cell, startX + colIndex * columnWidth, currentY, {
          width: columnWidth - 10,
          align: 'left',
        });
      });

      currentY += rowHeight;

      // Draw alternating row background (light gray for even rows)
      if (rowIndex % 2 === 0) {
        doc
          .rect(startX, currentY - rowHeight, doc.page.width - 100, rowHeight)
          .fillOpacity(0.05)
          .fill('#F3F4F6')
          .fillOpacity(1);
      }
    });

    // Update doc position
    doc.y = currentY;
  }

  /**
   * Helper: Truncate text to max length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
