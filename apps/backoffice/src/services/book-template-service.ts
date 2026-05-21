import type { BookTemplateResponse } from '@repo/shared';
import { api } from './api';

export const getBookTemplates = async (): Promise<BookTemplateResponse[]> => {
  const response = await api.get<BookTemplateResponse[]>('/book-templates');
  return response.data;
};
