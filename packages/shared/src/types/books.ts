import type { PriceTierResponse } from './prices.js';

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
  studentId: string;
  studentName: string;
  priceTiers: PriceTierResponse[];
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

export interface GenerateBookPdfResponse {
  message: string;
}

export enum ScanPageStatusEnum {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ENQUEUED = 'ENQUEUED',
}

export type ScanPageStatus = keyof typeof ScanPageStatusEnum;

export interface ScanPageResult {
  filename: string;
  studentId: string;
  pageNumber: number;
  status: ScanPageStatusEnum;
  error?: string;
}

export interface ScanFileInput {
  filename: string;
  mimetype: string;
}

export interface CreateScanPresignedUrlsRequest {
  files: ScanFileInput[];
}

export interface ScanPresignedUrlItem {
  filename: string;
  storageKey: string;
  uploadUrl: string;
}

export interface CreateScanPresignedUrlsResponse {
  batchId: string;
  uploads: ScanPresignedUrlItem[];
}

export interface EnqueueScanItemInput {
  filename: string;
  storageKey: string;
  mimetype: string;
}

export interface EnqueueScanBatchRequest {
  batchId: string;
  items: EnqueueScanItemInput[];
}

export interface ScanBooksResult {
  batchId?: string;
  received: number;
  enqueued: number;
  failed: number;
}

export enum PageStatusEnum {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  REVISED_BY_SCHOOL = 'REVISED_BY_SCHOOL',
  READY = 'READY',
}

export type PageStatus = keyof typeof PageStatusEnum;

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
    bookGenre?: string | null;
    bookGenreExplanation?: string | null;
    thanksMessage?: string | null;
    schoolMessage?: string | null;
    schoolTeam?: string | null;
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
  bookGenre?: string | null;
  bookGenreExplanation?: string | null;
  thanksMessage?: string | null;
  schoolMessage?: string | null;
  schoolTeam?: string | null;
}

export interface CreateBookRequest {
  studentId: string;
  title?: string | null;
}

export interface UpdateBookRequest {
  title?: string | null;
}
