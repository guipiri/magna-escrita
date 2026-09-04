import { api } from './api';
import type {
  GetBookDetailResponse,
  GetBooksListResponse,
  GenerateBookPdfResponse,
  ScanBooksResult,
  UpdatePageRequest,
  CreateBookRequest,
  CreateScanPresignedUrlsRequest,
  CreateScanPresignedUrlsResponse,
  EnqueueScanBatchRequest,
} from '@repo/shared';

export const createBook = async (
  data: CreateBookRequest,
): Promise<GetBookDetailResponse> => {
  const response = await api.post<GetBookDetailResponse>(
    '/books/backoffice',
    data,
  );
  return response.data;
};

export const getBooks = async (): Promise<GetBooksListResponse[]> => {
  const response = await api.get<GetBooksListResponse[]>('/books/backoffice');
  return response.data;
};

export const getBookById = async (
  id: string,
): Promise<GetBookDetailResponse> => {
  const response = await api.get<GetBookDetailResponse>(
    `/books/backoffice/${id}`,
  );
  return response.data;
};

export const updateBookPage = async (
  bookId: string,
  pageNumber: number,
  data: UpdatePageRequest,
): Promise<void> => {
  await api.patch(`/books/backoffice/${bookId}/pages/${pageNumber}`, data);
};

export const updateBook = async (
  bookId: string,
  data: { title?: string | null },
): Promise<void> => {
  await api.patch(`/books/backoffice/${bookId}`, data);
};

export const updateBookPageDraw = async (
  bookId: string,
  pageNumber: number,
  image: File,
  originalImage?: File,
): Promise<{ drawImageUrl: string; originalImageUrl?: string }> => {
  const formData = new FormData();
  formData.append('image', image);
  if (originalImage) {
    formData.append('originalImage', originalImage);
  }

  const response = await api.patch<{
    drawImageUrl: string;
    originalImageUrl?: string;
  }>(`/books/backoffice/${bookId}/pages/${pageNumber}/draw`, formData);

  return response.data;
};

export const createScanPresignedUrls = async (
  data: CreateScanPresignedUrlsRequest,
): Promise<CreateScanPresignedUrlsResponse> => {
  const response = await api.post<CreateScanPresignedUrlsResponse>(
    '/books/scan/presigned-urls',
    data,
  );
  return response.data;
};

export const enqueueScanBatch = async (
  data: EnqueueScanBatchRequest,
): Promise<ScanBooksResult> => {
  const response = await api.post<ScanBooksResult>('/books/scan/enqueue', data);
  return response.data;
};

export interface UploadProgressCallback {
  completed: number;
  total: number;
  currentFilename?: string;
}

export const scanBooksDirectToR2 = async (
  files: File[],
  onProgress?: (progress: UploadProgressCallback) => void,
  concurrency = 5,
): Promise<ScanBooksResult> => {
  if (files.length === 0) {
    return { received: 0, enqueued: 0, failed: 0 };
  }

  // 1. Obter presigned URLs da API
  const presignedData = await createScanPresignedUrls({
    files: files.map((f) => ({
      filename: f.name,
      mimetype: f.type || 'image/jpeg',
    })),
  });

  const { batchId, uploads } = presignedData;

  const fileQueue = uploads.map((item, index) => ({
    file: files[index]!,
    item,
  }));

  let completed = 0;
  const total = fileQueue.length;
  onProgress?.({ completed, total });

  // 2. Fila concorrente de upload direto para o R2 via PUT
  const activeWorkers = Math.min(concurrency, total);
  let queueIndex = 0;

  const worker = async () => {
    while (queueIndex < fileQueue.length) {
      const currentIndex = queueIndex++;
      const current = fileQueue[currentIndex];
      if (!current) break;

      onProgress?.({
        completed,
        total,
        currentFilename: current.file.name,
      });

      const res = await fetch(current.item.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': current.file.type || 'image/jpeg',
        },
        body: current.file,
      });

      if (!res.ok) {
        throw new Error(
          `Falha no upload de ${current.file.name} para o storage: ${res.statusText}`,
        );
      }

      completed++;
      onProgress?.({ completed, total, currentFilename: current.file.name });
    }
  };

  await Promise.all(Array.from({ length: activeWorkers }, () => worker()));

  // 3. Enfileirar lote no BullMQ
  return enqueueScanBatch({
    batchId,
    items: uploads.map((u, i) => ({
      filename: u.filename,
      storageKey: u.storageKey,
      mimetype: files[i]?.type || 'image/jpeg',
    })),
  });
};

export const scanBooks = async (
  files: File[],
  onProgress?: (progress: UploadProgressCallback) => void,
): Promise<ScanBooksResult> => {
  return scanBooksDirectToR2(files, onProgress);
};

export const generateFinalBookPdf = async (
  bookId: string,
): Promise<GenerateBookPdfResponse> => {
  const response = await api.post<GenerateBookPdfResponse>(
    `/books/backoffice/${bookId}/generate-pdf`,
  );
  return response.data;
};

