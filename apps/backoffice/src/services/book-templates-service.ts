import { api } from './api';
import type {
  BookTemplateResponse,
  CreateBookTemplateRequest,
} from '@repo/shared';

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
