import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { NotFoundBookException } from './books.errors.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

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
