import { api } from './api';
import type { BookTemplateResponse } from '@repo/shared';

export const getBookTemplates = async (): Promise<BookTemplateResponse[]> => {
  const response = await api.get<BookTemplateResponse[]>('/book-templates');
  return response.data;
};
