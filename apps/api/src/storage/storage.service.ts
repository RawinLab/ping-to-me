import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string | undefined;
  private isConfigured = false;

  onModuleInit() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn(
        "R2 storage is not configured. File upload features will be disabled. " +
          "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME to enable.",
      );
      return;
    }

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.isConfigured = true;
    this.logger.log("R2 storage configured successfully");
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      throw new Error(
        "R2 storage is not configured. Cannot upload files.",
      );
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      // Return the public URL (assuming custom domain or R2.dev subdomain)
      return `https://assets.pingto.me/${key}`;
    } catch (error) {
      this.logger.error("Error uploading to R2:", error);
      throw new Error("Failed to upload file");
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }
}
