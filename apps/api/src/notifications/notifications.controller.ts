import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  Post,
  Body,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("notifications")
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationsService.findAll(req.user.id),
      this.notificationsService.getUnreadCount(req.user.id),
    ]);
    return { notifications, unreadCount };
  }

  @Patch("read-all")
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(":id/read")
  async markAsRead(@Request() req, @Param("id") id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  // For testing purposes, allow creating notifications via API
  @Post()
  async create(
    @Request() req,
    @Body()
    body: {
      type: "INFO" | "WARNING" | "ERROR";
      title: string;
      message: string;
    },
  ) {
    return this.notificationsService.create(
      req.user.id,
      body.type,
      body.title,
      body.message,
    );
  }
}
