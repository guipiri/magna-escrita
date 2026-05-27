import { api } from './api';
import type { GetBooksListResponse, ScanBooksResult } from '@repo/shared';

export const getBooks = async (): Promise<GetBooksListResponse[]> => {
  const response = await api.get<GetBooksListResponse[]>('/books/backoffice');
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
