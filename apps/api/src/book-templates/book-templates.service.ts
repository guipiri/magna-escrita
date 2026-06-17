import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  type BookTemplateResponse,
  type AuthUser,
  UserRole,
} from '@repo/shared';
import { CreateBookTemplateDto } from './dto/create-book-template.dto.js';

@Injectable()
export class BookTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser): Promise<BookTemplateResponse[]> {
    const units = await this.prisma.unit.findMany({
      where: {
        userUnits: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const templates = await this.prisma.bookTemplate.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : {
              units: {
                some: { id: { in: units.map((u) => u.id) } },
              },
            },
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

  async create(body: CreateBookTemplateDto): Promise<BookTemplateResponse> {
    const { name, pages, units } = body;

    const template = await this.prisma.bookTemplate.create({
      data: {
        name,
        bookTemplatePages: {
          create: pages.map((p) => ({
            pageNumber: p.pageNumber,
            pageType: p.pageType,
          })),
        },
        units: units
          ? {
              connect: units.map((id) => ({ id })),
            }
          : undefined,
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
