import type {
  BookTemplateResponse,
  CreateBookTemplateRequest,
} from '@repo/shared';
import { api } from './api';

export const getBookTemplates = async (): Promise<BookTemplateResponse[]> => {
  const response = await api.get<BookTemplateResponse[]>('/book-templates');
  return response.data;
};

export const createBookTemplate = async (
  data: CreateBookTemplateRequest,
): Promise<BookTemplateResponse> => {
  const response = await api.post<BookTemplateResponse>(
    '/book-templates',
    data,
  );
  return response.data;
};
