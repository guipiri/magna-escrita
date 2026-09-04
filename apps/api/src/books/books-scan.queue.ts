import { Queue } from 'bullmq';

export const BOOK_SCAN_QUEUE_NAME = 'books-scan';

export interface ScanPageJobPayload {
  batchId: string;
  filename: string;
  mimetype: string;
  storageKey: string;
}

export type BookScanQueue = Queue<ScanPageJobPayload>;
