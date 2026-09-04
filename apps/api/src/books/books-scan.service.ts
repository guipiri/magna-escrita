import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../common/redis/redis.service.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import {
  AuthUser,
  CreateScanPresignedUrlsResponse,
  ScanBooksResult,
} from '@repo/shared';
import {
  CreateScanPresignedUrlsDto,
  EnqueueScanBatchDto,
} from './dto/books-scan.dto.js';
import { getRawScanBucketKey } from '../common/bucket/bucket.utils.js';
import {
  BOOK_SCAN_QUEUE_NAME,
  type BookScanQueue,
} from './books-scan.queue.js';

@Injectable()
export class BooksScanService {
  private readonly logger = new Logger(BooksScanService.name);

  constructor(
    @InjectQueue(BOOK_SCAN_QUEUE_NAME)
    private readonly booksScanQueue: BookScanQueue,
    private readonly redisService: RedisService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
  ) {}

  async createPresignedUrls(
    dto: CreateScanPresignedUrlsDto,
    user: AuthUser,
  ): Promise<CreateScanPresignedUrlsResponse> {
    const batchId = randomUUID();
    this.logger.log(
      `Creating presigned upload URLs for batch ${batchId} for user ${user.email} (${dto.files.length} files)`,
    );

    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        const storageKey = getRawScanBucketKey({
          batchId,
          fileId: randomUUID(),
          filename: file.filename,
        });

        const uploadUrl = await this.bucketService.getPresignedUploadUrl({
          key: storageKey,
          contentType: file.mimetype,
          expiresInSeconds: 3600,
        });

        return {
          filename: file.filename,
          storageKey,
          uploadUrl,
        };
      }),
    );

    return {
      batchId,
      uploads,
    };
  }

  async enqueueBatch(
    dto: EnqueueScanBatchDto,
    user: AuthUser,
  ): Promise<ScanBooksResult> {
    const { batchId, items } = dto;
    const batchKey = `scan-batch:${batchId}`;

    this.logger.log(
      `Enqueuing batch ${batchId} for user ${user.email} with ${items.length} items`,
    );

    if (items.length > 0) {
      await this.redisService.getClient().set(
        batchKey,
        JSON.stringify({
          total: items.length,
          completed: 0,
          userEmail: user.email,
          results: [],
        }),
        'EX',
        86400, // 24 hours TTL
      );

      const jobs = items.map((item) => ({
        name: 'scan-page',
        data: {
          batchId,
          filename: item.filename,
          mimetype: item.mimetype,
          storageKey: item.storageKey,
        },
      }));

      await this.booksScanQueue.addBulk(jobs);
    }

    return {
      batchId,
      received: items.length,
      enqueued: items.length,
      failed: 0,
    };
  }
}
