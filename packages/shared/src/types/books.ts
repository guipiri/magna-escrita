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

export type BookStatus = 'DRAFT' | 'FOR_REVIEW' | 'READY' | 'ARCHIVED';

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

export interface GetBooksListResponse {
  id: string;
  magnificCode: string;
  title: string | null;
  status: BookStatus;
  enrollment: {
    id: string;
    studentName: string;
  };
  class: {
    id: string;
    name: string;
    schoolYear: string;
  };
  unit: {
    id: string;
    name: string | null;
    schoolName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScanPageResult {
  filename: string;
  enrollmentId: string;
  pageNumber: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ScanBooksResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: ScanPageResult[];
}

export interface BookDetailPage {
  number: number;
  type: BookPageType;
  textContent: string | null;
  drawImageUrl: string | null;
  imageUrl: string | null;
  originalImageUrl: string | null;
}

export interface GetBookDetailResponse {
  id: string;
  magnificCode: string;
  title: string | null;
  author: string | null;
  synopsis: string | null;
  status: BookStatus;
  enrollment: {
    id: string;
    studentName: string;
  };
  class: {
    id: string;
    name: string;
    schoolYear: string;
  };
  unit: {
    id: string;
    name: string | null;
    schoolName: string;
  };
  pages: BookDetailPage[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePageRequest {
  textContent?: string | null;
}
