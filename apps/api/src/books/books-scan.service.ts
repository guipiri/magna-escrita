import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../common/redis/redis.service.js';
import type { AuthUser, ScanBooksResult, ScanPageResult } from '@repo/shared';

@Injectable()
export class BooksScanService {
  private readonly logger = new Logger(BooksScanService.name);

  constructor(
    @InjectQueue('books-scan')
    private readonly booksScanQueue: Queue,
    private readonly redisService: RedisService,
  ) {}

  async scanImages(
    files: Express.Multer.File[],
    user: AuthUser,
  ): Promise<ScanBooksResult> {
    const results: ScanPageResult[] = [];
    const batchId = Math.random().toString(36).substring(2, 15);
    const batchKey = `scan-batch:${batchId}`;

    this.logger.log(
      `Starting scan batch ${batchId} for user ${user.email} with ${files.length} file(s)`,
    );

    if (files.length > 0) {
      await this.redisService.getClient().set(
        batchKey,
        JSON.stringify({
          total: files.length,
          completed: 0,
          userEmail: user.email,
          results: [],
        }),
        'EX',
        86400, // 24 hours TTL
      );
    }

    for (const file of files) {
      try {
        await this.booksScanQueue.add('scan-page', {
          batchId,
          filename: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer.toString('base64'),
        });

        results.push({
          filename: file.originalname,
          studentId: '',
          pageNumber: 0,
          status: 'enqueued',
        });
      } catch (err: unknown) {
        this.logger.error(`Error enqueuing file ${file.originalname}:`, err);
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido';
        results.push({
          filename: file.originalname,
          studentId: '',
          pageNumber: 0,
          status: 'error',
          error: message,
        });

        // Decrement total in Redis since it failed to enqueue
        if (files.length > 0) {
          const batchData = await this.redisService.getClient().get(batchKey);
          if (batchData) {
            const batch = JSON.parse(batchData);
            batch.total = Math.max(0, batch.total - 1);
            await this.redisService
              .getClient()
              .set(batchKey, JSON.stringify(batch), 'KEEPTTL');
          }
        }
      }
    }

    const enqueued = results.filter((r) => r.status === 'enqueued').length;
    const failed = results.filter((r) => r.status === 'error').length;

    this.logger.log(
      `Scan batch ${batchId} enqueued: ${enqueued} succeeded, ${failed} failed`,
    );

    return {
      received: results.length,
      enqueued,
      failed,
    };
  }
}
