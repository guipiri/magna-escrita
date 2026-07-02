import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  type BookTemplateResponse,
  type BookTemplateThemeResponse,
  type AuthUser,
  UserRole,
  ErrorKeys,
} from '@repo/shared';
import { CreateBookTemplateDto } from './dto/create-book-template.dto.js';
import { UpdateBookTemplateDto } from './dto/update-book-template.dto.js';
import { CreateBookTemplateThemeDto } from './dto/create-book-template-theme.dto.js';
import {
  ConflictRemoveUnitWithBooksException,
  ConflictChangePagesWithBooksException,
  BookTemplateFirstPageMustBeCoverException,
  BookTemplateLastPageMustBeBackCoverException,
  BookTemplatePagesLengthInvalidException,
  BookTemplatePagesSequentialException,
  BookTemplateThemeRequiredException,
  BookTemplateThemeNameRequiredException,
  BookTemplateThemeColorRequiredException,
  BookTemplateThemeFileRequiredException,
  BookTemplateThemeNotFoundException,
  BookTemplateInteriorCannotHaveCoversException,
} from './book-templates.errors.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import { getBookTemplateThemeCoverBucketKey } from '../common/bucket/bucket.utils.js';
import { PageType } from '@prisma/client';
import { HttpExceptionConstructor } from '../common/filters/http-exception.filter.js';

@Injectable()
export class BookTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
  ) {}

  private validateBookTemplatePages(
    pages: { pageNumber: number; pageType: string }[],
  ) {
    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

    if (sortedPages.length === 0)
      throw new BookTemplateFirstPageMustBeCoverException();

    const firstPage = sortedPages[0];
    if (
      !firstPage ||
      firstPage.pageNumber !== 0 ||
      firstPage.pageType !== PageType.COVER
    ) {
      throw new BookTemplateFirstPageMustBeCoverException();
    }

    const lastPage = sortedPages[sortedPages.length - 1];
    if (!lastPage || lastPage.pageType !== PageType.BACK_COVER) {
      throw new BookTemplateLastPageMustBeBackCoverException();
    }

    const interiorLength = sortedPages.length - 2;
    if (interiorLength < 0 || interiorLength % 4 !== 0) {
      throw new BookTemplatePagesLengthInvalidException();
    }

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      if (!page || page.pageNumber !== i) {
        throw new BookTemplatePagesSequentialException();
      }

      // Do not allow COVER or BACK_COVER in interior pages
      if (i > 0 && i < sortedPages.length - 1) {
        if (
          page.pageType === PageType.COVER ||
          page.pageType === PageType.BACK_COVER
        ) {
          throw new BookTemplateInteriorCannotHaveCoversException();
        }
      }
    }
  }

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
        bookTemplateTheme: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const booksInfo = await this.getTemplatesBooksInfo(
      templates.map((t) => t.id),
    );

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
        bookTemplateThemeId: t.bookTemplateThemeId,
        bookTemplateTheme: t.bookTemplateTheme,
      };
    });

    return response;
  }

  async create(body: CreateBookTemplateDto): Promise<BookTemplateResponse> {
    const { name, pages, units, bookTemplateThemeId } = body;

    if (!bookTemplateThemeId) {
      throw new BookTemplateThemeRequiredException();
    }

    const themeExists = await this.prisma.bookTemplateTheme.findUnique({
      where: { id: bookTemplateThemeId },
    });
    if (!themeExists) throw new BookTemplateThemeNotFoundException();

    this.validateBookTemplatePages(pages);

    const template = await this.prisma.bookTemplate.create({
      data: {
        name,
        bookTemplateThemeId,
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
        bookTemplateTheme: true,
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
      bookTemplateThemeId: template.bookTemplateThemeId,
      bookTemplateTheme: template.bookTemplateTheme,
    };
  }

  async update(
    id: string,
    body: UpdateBookTemplateDto,
  ): Promise<BookTemplateResponse> {
    const { name, pages, units, bookTemplateThemeId } = body;

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

    if (bookTemplateThemeId) {
      const themeExists = await this.prisma.bookTemplateTheme.findUnique({
        where: { id: bookTemplateThemeId },
      });
      if (!themeExists) throw new BookTemplateThemeNotFoundException();
    }

    // Rule 2: Remove unit - when there is no book created in any class of the unit using the template in question
    if (units) {
      const currentUnitIds = template.units.map((u) => u.id);
      const unitsToRemove = currentUnitIds.filter(
        (uid) => !units.includes(uid),
      );

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
      this.validateBookTemplatePages(pages);

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
          bookTemplateThemeId,
          units: unitUpdate,
        },
        include: {
          bookTemplatePages: {
            orderBy: { pageNumber: 'asc' },
          },
          units: {
            select: { id: true },
          },
          bookTemplateTheme: true,
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
      bookTemplateThemeId: updatedTemplate.bookTemplateThemeId,
      bookTemplateTheme: updatedTemplate.bookTemplateTheme,
    };
  }

  async findAllThemes(): Promise<BookTemplateThemeResponse[]> {
    return this.prisma.bookTemplateTheme.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createTheme(
    body: CreateBookTemplateThemeDto,
    file: Express.Multer.File,
  ): Promise<BookTemplateThemeResponse> {
    const { name, colorTheme } = body;

    if (!name) {
      throw new BookTemplateThemeNameRequiredException();
    }
    if (!colorTheme) {
      throw new BookTemplateThemeColorRequiredException();
    }
    if (!file) {
      throw new BookTemplateThemeFileRequiredException();
    }

    const theme = await this.prisma.bookTemplateTheme.create({
      data: {
        name,
        colorTheme,
      },
    });

    try {
      const key = getBookTemplateThemeCoverBucketKey(theme.id);
      const coverThemePdfUrl = await this.bucketService.upload({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });

      return await this.prisma.bookTemplateTheme.update({
        where: { id: theme.id },
        data: { coverThemePdfUrl },
      });
    } catch (error) {
      await this.prisma.bookTemplateTheme.delete({ where: { id: theme.id } });
      throw new BadGatewayException({
        key: ErrorKeys.BAD_GATEWAY_FAILED_TO_UPLOAD_BOOK_TEMPLATE_THEME_COVER,
        message: 'Erro ao criar tema do template.',
      } satisfies HttpExceptionConstructor);
    }
  }
}
