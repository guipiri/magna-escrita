import type { BookPageType } from './books';

export interface BookTemplatePage {
  pageNumber: number;
  pageType: BookPageType;
}

export interface CreateBookTemplateRequest {
  name: string;
  units?: string[];
  pages: BookTemplatePage[];
}

export interface BookTemplateResponse {
  id: string;
  name: string;
  pageCount: number;
  pages: BookTemplatePage[];
  units?: string[];
  hasBooks?: boolean;
  unitsWithBooks?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateBookTemplateRequest {
  name?: string;
  units?: string[];
  pages?: BookTemplatePage[];
}
