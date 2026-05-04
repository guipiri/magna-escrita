import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface BookPageData {
  id: string;
  magnificCode: string;
  title: string;
  author: string;
  synopsis: string | null;
  price: number;
  pages: Array<{
    number: number;
    type: string;
    textContent: string | null;
    drawImageUrl: string | null;
    imageUrl: string | null;
  }>;
}

export type CartBookData = Omit<BookPageData, 'pages'>;

export const getBookByMagnificCode = async (
  magnificCode: string,
): Promise<BookPageData> => {
  const response = await axios.get<BookPageData>(
    `${API_URL}/books/${encodeURIComponent(magnificCode)}`,
  );

  return response.data;
};

export const getBooksByIds = async (ids: string[]): Promise<CartBookData[]> => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

  if (!uniqueIds.length) {
    return [];
  }

  const response = await axios.get<CartBookData[]>(`${API_URL}/books`, {
    params: {
      ids: uniqueIds.join(','),
    },
  });

  return response.data;
};
