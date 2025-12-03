import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // In a real app, these would come from ConfigService
    const accountId = process.env.R2_ACCOUNT_ID || 'mock-account-id';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || 'mock-access-key';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'mock-secret-key';
    this.bucketName = process.env.R2_BUCKET_NAME || 'pingtome-assets';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
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
      console.error('Error uploading to R2:', error);
      throw new Error('Failed to upload file');
    }
  }
}
