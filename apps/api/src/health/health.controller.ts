import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  async check(@Res() res: Response) {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return res.status(HttpStatus.OK).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: "ok",
        },
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
        },
      });
    }
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async ready(@Res() res: Response) {
    try {
      // Readiness requires database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        reason: "Database not connected",
      });
    }
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness check endpoint" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  async live() {
    // Liveness doesn't check external dependencies
    // Just confirms the process is running and can respond
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }
}
