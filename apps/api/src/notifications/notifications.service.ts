import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateNotificationSettingsDto } from "./dto/notification-settings.dto";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: "INFO" | "WARNING" | "ERROR",
    title: string,
    message: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailNotificationsEnabled: true, marketingEmailsEnabled: true },
    });
    return {
      emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true,
      marketingEmailsEnabled: user?.marketingEmailsEnabled ?? false,
    };
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { emailNotificationsEnabled: true, marketingEmailsEnabled: true },
    });
  }
}
