import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  type BookTemplateResponse,
  type AuthUser,
  UserRole,
} from '@repo/shared';
import { CreateBookTemplateDto } from './dto/create-book-template.dto.js';
import { UpdateBookTemplateDto } from './dto/update-book-template.dto.js';
import {
  ConflictRemoveUnitWithBooksException,
  ConflictChangePagesWithBooksException,
} from './book-templates.errors.js';

@Injectable()
export class BookTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTemplatesBooksInfo(templateIds: string[]) {
    const classesWithBooks = await this.prisma.class.findMany({
      where: {
        bookTemplateId: { in: templateIds },
        students: {
          some: {
            books: {
              some: {},
            },
          },
        },
      },
      select: {
        bookTemplateId: true,
        unitId: true,
      },
    });

    const map = new Map<string, Set<string>>();
    for (const c of classesWithBooks) {
      if (!map.has(c.bookTemplateId)) {
        map.set(c.bookTemplateId, new Set());
      }
      map.get(c.bookTemplateId)!.add(c.unitId);
    }
    return map;
  }

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
        units: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const booksInfo = await this.getTemplatesBooksInfo(templates.map((t) => t.id));

    const response: BookTemplateResponse[] = templates.map((t) => {
      const bookUnits = booksInfo.get(t.id) ?? new Set<string>();
      return {
        id: t.id,
        name: t.name,
        pageCount: t.bookTemplatePages.length,
        pages: t.bookTemplatePages.map((p) => ({
          pageNumber: p.pageNumber,
          pageType: p.pageType,
        })),
        units: t.units.map((u) => u.id),
        hasBooks: bookUnits.size > 0,
        unitsWithBooks: Array.from(bookUnits),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

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
      include: {
        bookTemplatePages: {
          orderBy: { pageNumber: 'asc' },
        },
        units: {
          select: { id: true },
        },
      },
    });

    return {
      id: template.id,
      name: template.name,
      pageCount: template.bookTemplatePages.length,
      pages: template.bookTemplatePages.map((p) => ({
        pageNumber: p.pageNumber,
        pageType: p.pageType,
      })),
      units: template.units.map((u) => u.id),
      hasBooks: false,
      unitsWithBooks: [],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  async update(
    id: string,
    body: UpdateBookTemplateDto,
  ): Promise<BookTemplateResponse> {
    const { name, pages, units } = body;

    const template = await this.prisma.bookTemplate.findUnique({
      where: { id },
      include: {
        bookTemplatePages: {
          orderBy: { pageNumber: 'asc' },
        },
        units: {
          select: { id: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado.');
    }

    // Rule 2: Remove unit - when there is no book created in any class of the unit using the template in question
    if (units) {
      const currentUnitIds = template.units.map((u) => u.id);
      const unitsToRemove = currentUnitIds.filter((uid) => !units.includes(uid));

      for (const unitId of unitsToRemove) {
        const bookExists = await this.prisma.book.findFirst({
          where: {
            student: {
              class: {
                unitId: unitId,
                bookTemplateId: id,
              },
            },
          },
        });

        if (bookExists) {
          throw new ConflictRemoveUnitWithBooksException();
        }
      }
    }

    // Rule 3: Change template pages - when there are no books created in any class using the template of any unit associated with the template
    if (pages) {
      const pagesChanged =
        template.bookTemplatePages.length !== pages.length ||
        template.bookTemplatePages.some((cp) => {
          const np = pages.find((p) => p.pageNumber === cp.pageNumber);
          return !np || np.pageType !== cp.pageType;
        });

      if (pagesChanged) {
        const bookExists = await this.prisma.book.findFirst({
          where: {
            student: {
              class: {
                bookTemplateId: id,
              },
            },
          },
        });

        if (bookExists) {
          throw new ConflictChangePagesWithBooksException();
        }
      }
    }

    const updatedTemplate = await this.prisma.$transaction(async (tx) => {
      if (pages) {
        await tx.bookTemplatePage.deleteMany({
          where: { bookTemplateId: id },
        });

        await tx.bookTemplatePage.createMany({
          data: pages.map((p) => ({
            bookTemplateId: id,
            pageNumber: p.pageNumber,
            pageType: p.pageType,
          })),
        });
      }

      const unitUpdate = units
        ? {
            set: units.map((uid) => ({ id: uid })),
          }
        : undefined;

      return tx.bookTemplate.update({
        where: { id },
        data: {
          name,
          units: unitUpdate,
        },
        include: {
          bookTemplatePages: {
            orderBy: { pageNumber: 'asc' },
          },
          units: {
            select: { id: true },
          },
        },
      });
    });

    const booksInfo = await this.getTemplatesBooksInfo([id]);
    const bookUnits = booksInfo.get(id) ?? new Set<string>();

    return {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      pageCount: updatedTemplate.bookTemplatePages.length,
      pages: updatedTemplate.bookTemplatePages.map((p) => ({
        pageNumber: p.pageNumber,
        pageType: p.pageType,
      })),
      units: updatedTemplate.units.map((u) => u.id),
      hasBooks: bookUnits.size > 0,
      unitsWithBooks: Array.from(bookUnits),
      createdAt: updatedTemplate.createdAt,
      updatedAt: updatedTemplate.updatedAt,
    };
  }
}
