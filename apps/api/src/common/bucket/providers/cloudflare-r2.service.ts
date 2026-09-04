import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../../filters/http-exception.filter.js';
import { BucketService } from '../bucket.contract.js';

@Injectable()
export class CloudflareR2Service implements BucketService {
  private readonly logger = new Logger(CloudflareR2Service.name);
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
      this.logger.error(`Cloudflare R2 upload failed for key ${key}:`, err);
      throw new InternalServerErrorException({
        key: ErrorKeys.INTERNAL_CLOUDFLARE_UPLOAD_FAILED,
        message: 'Failed to upload image to Cloudflare R2',
      } satisfies HttpExceptionConstructor);
    }

    const cleanBase = this.publicUrl.replace(/\/$/, '');
    this.logger.log(
      `File uploaded to R2 with key: ${key}, accessible at: ${cleanBase}/${key}`,
    );
    return `${cleanBase}/${key}`;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const data = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      const readable = data.Body?.transformToWebStream();

      if (!readable) return null;

      const chunks: Uint8Array[] = [];
      for await (const chunk of readable) chunks.push(chunk);

      return Buffer.concat(chunks);
    } catch (err) {
      this.logger.warn(`Cloudflare R2 get file failed for key ${key}:`, err);
      return null;
    }
  }

  /**
   * Generates a presigned URL for direct client PUT upload to Cloudflare R2.
   */
  async getPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    const { key, contentType, expiresInSeconds = 3600 } = params;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (err) {
      this.logger.error(
        `Failed to generate presigned upload URL for key ${key}:`,
        err,
      );
      throw new InternalServerErrorException({
        key: ErrorKeys.INTERNAL_CLOUDFLARE_UPLOAD_FAILED,
        message: 'Failed to generate presigned upload URL for Cloudflare R2',
      } satisfies HttpExceptionConstructor);
    }
  }
}
