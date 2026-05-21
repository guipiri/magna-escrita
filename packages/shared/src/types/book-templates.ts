import type { BookPageType } from './books';

export interface BookTemplatePage {
  pageNumber: number;
  pageType: BookPageType;
}

export interface CreateBookTemplateRequest {
  name: string;
  pages: BookTemplatePage[];
}

export interface BookTemplateResponse {
  id: string;
  name: string;
  pageCount: number;
  pages: BookTemplatePage[];
  createdAt?: Date;
  updatedAt?: Date;
}
