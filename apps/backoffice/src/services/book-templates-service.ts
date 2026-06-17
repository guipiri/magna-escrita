import { api } from './api';
import type {
  BookTemplateResponse,
  CreateBookTemplateRequest,
  UpdateBookTemplateRequest,
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

export const updateBookTemplate = async (
  id: string,
  data: UpdateBookTemplateRequest,
): Promise<BookTemplateResponse> => {
  const response = await api.patch<BookTemplateResponse>(
    `/book-templates/${id}`,
    data,
  );
  return response.data;
};
