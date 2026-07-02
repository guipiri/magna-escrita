import { api } from './api';
import type {
  BookTemplateResponse,
  BookTemplateThemeResponse,
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

export const getBookTemplateThemes = async (): Promise<BookTemplateThemeResponse[]> => {
  const response = await api.get<BookTemplateThemeResponse[]>('/book-templates/themes');
  return response.data;
};

export const createBookTemplateTheme = async (
  data: FormData,
): Promise<BookTemplateThemeResponse> => {
  const response = await api.post<BookTemplateThemeResponse>(
    '/book-templates/themes',
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};
