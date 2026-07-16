import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ScanPageResult {
  filename: string;
  studentId: string;
  pageNumber: number;
  status: 'success' | 'error' | 'enqueued';
  error?: string;
}

export interface ScanBooksResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: ScanPageResult[];
}

@Injectable()
export class BooksScanService {
  constructor(
    @InjectQueue('books-scan')
    private readonly booksScanQueue: Queue,
  ) {}

  async scanImages(files: Express.Multer.File[]): Promise<ScanBooksResult> {
    const results: ScanPageResult[] = [];

    for (const file of files) {
      try {
        await this.booksScanQueue.add('scan-page', {
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
        console.error(`Error enqueuing file ${file.originalname}:`, err);
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido';
        results.push({
          filename: file.originalname,
          studentId: '',
          pageNumber: 0,
          status: 'error',
          error: message,
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'enqueued').length;

    return {
      processed: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    };
  }
}
