import { api } from './api';
import type {
  GetBookDetailResponse,
  GetBooksListResponse,
  ScanBooksResult,
  UpdatePageRequest,
} from '@repo/shared';

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

  const response = await api.patch<{ drawImageUrl: string; originalImageUrl?: string }>(
    `/books/backoffice/${bookId}/pages/${pageNumber}/draw`,
    formData,
  );

  return response.data;
};

export const scanBooks = async (files: File[]): Promise<ScanBooksResult> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await api.post<ScanBooksResult>('/books/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
