import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@pingtome/database";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Connect to database in background to avoid blocking app startup
    // This allows Cloud Run to receive health checks while DB connects
    this.$connect()
      .then(() => {
        this.logger.log("Database connected successfully");
      })
      .catch((error) => {
        this.logger.error("Failed to connect to database:", error.message);
        // Don't throw - let app start and fail on first query if DB is down
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
