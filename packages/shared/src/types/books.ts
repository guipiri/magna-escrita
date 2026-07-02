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

export enum BookPageTypeEnum {
  COVER = 'COVER',
  TEXT = 'TEXT',
  DRAW = 'DRAW',
  DRAW_TEXT = 'DRAW_TEXT',
  BLANK = 'BLANK',
  PREFACE = 'PREFACE',
  THANKS = 'THANKS',
  BACK_COVER = 'BACK_COVER',
}

export type BookPageType = keyof typeof BookPageTypeEnum;

export enum BookStatusEnum {
  DRAFT = 'DRAFT',
  REVISED_BY_SCHOOL = 'REVISED_BY_SCHOOL',
  REVISED_BY_MAGNA = 'REVISED_BY_MAGNA',
  READY_FOR_SALE = 'READY_FOR_SALE',
  ARCHIVED = 'ARCHIVED',
}

export type BookStatus = keyof typeof BookStatusEnum;

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
  student: {
    id: string;
    name: string;
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
  coverPdfUrl: string | null;
  interiorPdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScanPageResult {
  filename: string;
  studentId: string;
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

export type PageStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'REVISED_BY_SCHOOL'
  | 'READY';

export interface BookDetailPage {
  number: number;
  type: BookPageType;
  textContent: string | null;
  drawImageUrl: string | null;
  imageUrl: string | null;
  originalImageUrl: string | null;
  status: PageStatus;
}

export interface GetBookDetailResponse {
  id: string;
  magnificCode: string;
  title: string | null;
  author: string | null;
  synopsis: string | null;
  status: BookStatus;
  student: {
    id: string;
    name: string;
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
    logoUrl: string | null;
  };
  pages: BookDetailPage[];
  coverPdfUrl: string | null;
  interiorPdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePageRequest {
  textContent?: string | null;
  status?: PageStatus;
}
