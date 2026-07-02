import type { BookPageType } from './books';

export interface BookTemplateThemeResponse {
  id: string;
  name: string;
  coverThemePdfUrl: string | null;
  colorTheme: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookTemplatePage {
  pageNumber: number;
  pageType: BookPageType;
}

export interface CreateBookTemplateRequest {
  name: string;
  units?: string[];
  pages: BookTemplatePage[];
  bookTemplateThemeId: string;
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
  bookTemplateThemeId: string;
  bookTemplateTheme?: BookTemplateThemeResponse;
}

export interface UpdateBookTemplateRequest {
  name?: string;
  units?: string[];
  pages?: BookTemplatePage[];
  bookTemplateThemeId?: string;
}
