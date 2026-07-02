import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ErrorKeys } from '@repo/shared';
import { HttpExceptionConstructor } from '../../filters/http-exception.filter.js';
import { BucketService } from '../bucket.contract.js';

@Injectable()
export class CloudflareR2Service implements BucketService {
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
    console.log(
      `File uploaded to R2 with key: ${key}, accessible at: ${cleanBase}`,
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
      // console.error('Cloudflare R2 get file failed:', err);
      return null;
    }
  }
}
