import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from './filters/http-exception.filter.js';

@Injectable()
export class CloudflareR2Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>(
      'CLOUDFLARE_R2_ACCOUNT_ID',
    );

    this.bucketName = this.configService.getOrThrow<string>(
      'CLOUDFLARE_R2_BUCKET_NAME',
    );

    this.publicUrl = this.configService.getOrThrow<string>(
      'CLOUDFLARE_R2_PUBLIC_URL',
    );

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'CLOUDFLARE_R2_ACCESS_KEY_ID',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  /**
   * Uploads a buffer to Cloudflare R2 and returns the public URL.
   */
  async upload(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string> {
    const { key, body, contentType } = params;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      console.error('Cloudflare R2 upload failed:', err);
      throw new InternalServerErrorException({
        key: ErrorKeys.INTERNAL_CLOUDFLARE_UPLOAD_FAILED,
        message: 'Failed to upload image to Cloudflare R2',
      } satisfies HttpExceptionConstructor);
    }

    const cleanBase = this.publicUrl.replace(/\/$/, '');
    return `${cleanBase}/${key}`;
  }
}
