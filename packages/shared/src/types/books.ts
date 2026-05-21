export const BOOK_PAGE_TYPES = [
  'COVER',
  'TEXT',
  'DRAW',
  'DRAW_TEXT',
  'BLANK',
  'PREFACE',
  'THANKS',
  'BACK_COVER',
] as const;

export type BookPageType = (typeof BOOK_PAGE_TYPES)[number];

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
