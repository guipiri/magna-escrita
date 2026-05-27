import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { NotFoundBookException } from './books.errors.js';
import type { GetBookDetailResponse, GetBooksListResponse } from '@repo/shared';
import type { AuthUser } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';
import { getProcessedPageUploadBucketPath } from './books.utils.js';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: CloudflareR2Service,
  ) {}

  async getAll(user: AuthUser): Promise<GetBooksListResponse[]> {
    const books = await this.prisma.book.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : {
              enrollment: {
                class: {
                  units: {
                    userUnits: { some: { userId: user.id } },
                  },
                },
              },
            },
      select: {
        id: true,
        magnificCode: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        enrollment: {
          select: {
            id: true,
            student: { select: { name: true } },
            class: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
                units: {
                  select: {
                    id: true,
                    name: true,
                    school: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return books.map((book) => ({
      id: book.id,
      magnificCode: book.magnificCode,
      title: book.title,
      status: book.status as GetBooksListResponse['status'],
      enrollment: {
        id: book.enrollment.id,
        studentName: book.enrollment.student.name,
      },
      class: {
        id: book.enrollment.class.id,
        name: book.enrollment.class.name,
        schoolYear: book.enrollment.class.schoolYear,
      },
      unit: {
        id: book.enrollment.class.units.id,
        name: book.enrollment.class.units.name,
        schoolName: book.enrollment.class.units.school.name,
      },
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    })) satisfies GetBooksListResponse[];
  }

  async getById(id: string, user: AuthUser): Promise<GetBookDetailResponse> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        magnificCode: true,
        title: true,
        author: true,
        synopsis: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pages: {
          orderBy: { number: 'asc' },
          select: {
            number: true,
            type: true,
            textContent: true,
            drawImageUrl: true,
            imageUrl: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            student: { select: { name: true } },
            class: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
                units: {
                  select: {
                    id: true,
                    name: true,
                    school: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!book) throw new NotFoundBookException();

    if (user.role !== UserRole.ADMIN) {
      const hasAccess = await this.prisma.userUnit.findFirst({
        where: {
          userId: user.id,
          unitId: book.enrollment.class.units.id,
        },
      });
      if (!hasAccess) throw new NotFoundBookException();
    }

    return {
      id: book.id,
      magnificCode: book.magnificCode,
      title: book.title,
      author: book.author,
      synopsis: book.synopsis,
      status: book.status as GetBookDetailResponse['status'],
      enrollment: {
        id: book.enrollment.id,
        studentName: book.enrollment.student.name,
      },
      class: {
        id: book.enrollment.class.id,
        name: book.enrollment.class.name,
        schoolYear: book.enrollment.class.schoolYear,
      },
      unit: {
        id: book.enrollment.class.units.id,
        name: book.enrollment.class.units.name,
        schoolName: book.enrollment.class.units.school.name,
      },
      pages: book.pages.map((p) => ({
        number: p.number,
        type: p.type as GetBookDetailResponse['pages'][number]['type'],
        textContent: p.textContent,
        drawImageUrl: p.drawImageUrl,
        imageUrl: p.imageUrl,
      })),
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    } satisfies GetBookDetailResponse;
  }

  async updatePage(
    bookId: string,
    pageNumber: number,
    textContent: string | null | undefined,
    user: AuthUser,
  ): Promise<void> {
    // Ensure user has access to this book
    await this.getById(bookId, user);

    await this.prisma.page.update({
      where: { bookId_number: { bookId, number: pageNumber } },
      data: { ...(textContent !== undefined ? { textContent } : {}) },
    });
  }

  async updatePageDraw(
    bookId: string,
    pageNumber: number,
    imageBuffer: Buffer,
    mimeType: string,
    user: AuthUser,
  ): Promise<{ drawImageUrl: string }> {
    const book = await this.getById(bookId, user);

    // Resolve enrollment → class → unit → active event
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: book.enrollment.id },
      select: {
        class: {
          select: {
            unitId: true,
            schoolYear: true,
          },
        },
      },
    });

    if (!enrollment) throw new NotFoundBookException();

    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: enrollment.class.unitId,
        schoolYear: enrollment.class.schoolYear,
        status: { in: ['ONGOING', 'PLANNED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    const ext =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
    const basePath = getProcessedPageUploadBucketPath({
      unitId: enrollment.class.unitId,
      eventId: activeEvent?.id ?? 'manual',
      enrollmentId: book.enrollment.id,
      bookId,
      pageNumber,
    });
    const key = `${basePath}-edited.${ext}`;

    const drawImageUrl = await this.r2.upload({
      key,
      body: imageBuffer,
      contentType: mimeType,
    });

    await this.prisma.page.update({
      where: { bookId_number: { bookId, number: pageNumber } },
      data: { drawImageUrl },
    });

    return { drawImageUrl };
  }

  async findByIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

    if (!uniqueIds.length) {
      return [];
    }

    const books = await this.prisma.book.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        magnificCode: true,
        title: true,
        author: true,
        synopsis: true,
        price: {
          select: {
            amount: true,
          },
        },
      },
    });

    const booksById = new Map(books.map((book) => [book.id, book]));

    const res = uniqueIds.map((id) => {
      const book = booksById.get(id);

      if (!book) {
        throw new NotFoundBookException();
      }

      return {
        ...book,
        price: Number(book.price.amount),
      };
    });

    return res;
  }

  async findByMagnificCode(magnificCode: string) {
    const book = await this.prisma.book.findUnique({
      where: { magnificCode },
      select: {
        id: true,
        magnificCode: true,
        title: true,
        author: true,
        synopsis: true,
        price: {
          select: {
            amount: true,
          },
        },
        pages: {
          orderBy: {
            number: 'asc',
          },
          select: {
            number: true,
            type: true,
            textContent: true,
            drawImageUrl: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!book) throw new NotFoundBookException();

    return {
      ...book,
      price: Number(book.price.amount),
    };
  }
}
