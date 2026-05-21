import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import type {
  CreateBookTemplateRequest,
  BookTemplateResponse,
} from '@repo/shared';

@Injectable()
export class BookTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BookTemplateResponse[]> {
    const templates = await this.prisma.bookTemplate.findMany({
      include: {
        bookTemplatePages: {
          orderBy: { pageNumber: 'asc' },
          select: { pageNumber: true, pageType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: BookTemplateResponse[] = templates.map((t) => ({
      id: t.id,
      name: t.name,
      pageCount: t.bookTemplatePages.length,
      pages: t.bookTemplatePages.map((p) => ({
        pageNumber: p.pageNumber,
        pageType: p.pageType,
      })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return response;
  }

  async create(body: CreateBookTemplateRequest): Promise<BookTemplateResponse> {
    const { name, pages } = body;

    const template = await this.prisma.bookTemplate.create({
      data: {
        name,
        bookTemplatePages: {
          create: pages.map((p) => ({
            pageNumber: p.pageNumber,
            pageType: p.pageType,
          })),
        },
      },
      include: { bookTemplatePages: true },
    });

    return {
      id: template.id,
      name: template.name,
      pageCount: template.bookTemplatePages.length,
      pages: template.bookTemplatePages.map((p) => ({
        pageNumber: p.pageNumber,
        pageType: p.pageType,
      })),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
