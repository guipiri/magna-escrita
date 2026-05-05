import { BookPageData, CartBookData } from '@repo/shared';
import { api } from './api';

export const getBookByMagnificCode = async (
  magnificCode: string,
): Promise<BookPageData> => {
  const response = await api.get<BookPageData>(
    `/books/${encodeURIComponent(magnificCode)}`,
  );

  return response.data;
};

export const getBooksByIds = async (ids: string[]): Promise<CartBookData[]> => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (!uniqueIds.length) {
    return [];
  }

  const response = await api.get<CartBookData[]>(`/books`, {
    params: {
      ids: uniqueIds.join(','),
    },
  });

  return response.data;
};
