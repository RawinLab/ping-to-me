import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@pingtome/database";
import * as crypto from "crypto";

@Injectable()
export class WebhookService {
  private prisma = new PrismaClient();

  async createWebhook(orgId: string, url: string, events: string[]) {
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    return this.prisma.webhook.create({
      data: {
        url,
        events,
        secret,
        organizationId: orgId,
      },
    });
  }

  async listWebhooks(orgId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId: orgId },
    });
  }

  async deleteWebhook(id: string, orgId: string) {
    return this.prisma.webhook.deleteMany({
      where: {
        id,
        organizationId: orgId,
      },
    });
  }

  async triggerWebhook(event: string, payload: any, orgId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      // Fire and forget for MVP
      this.sendWebhook(webhook, event, payload).catch((err) =>
        console.error(`Failed to send webhook ${webhook.id}:`, err),
      );
    }
  }

  private async sendWebhook(webhook: any, event: string, payload: any) {
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PingToMe-Event": event,
        "X-PingToMe-Signature": signature,
      },
      body: JSON.stringify(payload),
    });
  }
}
