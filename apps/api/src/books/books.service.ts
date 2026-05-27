import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { NotFoundBookException } from './books.errors.js';
import type { GetBooksListResponse } from '@repo/shared';
import type { AuthUser } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

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
