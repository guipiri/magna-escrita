import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  NotFoundBookException,
  ForbiddenBookReadyException,
  ConflictBookAlreadyExistsException,
  BadRequestPageWithoutContentException,
  BadRequestInvalidStatusForRoleException,
  BadRequestPageNotRevisedBySchoolException,
  NotFoundPageException,
  ForbiddenPageUpdateException,
} from './books.errors.js';
import type { GetBookDetailResponse, GetBooksListResponse } from '@repo/shared';
import type { AuthUser } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { BookStatus, PageStatus, PageType } from '@prisma/client';
import { PdfService } from '../pdf/pdf.service.js';
import {
  getBookCoverBucketKey,
  getBookInteriorBucketKey,
  getOriginalPageUploadBucketPath,
  getProcessedPageUploadBucketPath,
} from '../common/bucket/bucket.utils.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import {
  NotFoundActiveEventForStudentException,
  NotFoundStudentException,
} from './books-scan.errors.js';
import {
  NotFoundBookTemplateException,
  UnauthorizedUserNoAccessToUnitException,
} from '../schools/schools.errors.js';
import { generateMagnificCode } from './books.utils.js';
import { CreateBookDto } from './dto/create-book.dto.js';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
    private readonly pdfService: PdfService,
  ) {}

  async getAll(user: AuthUser): Promise<GetBooksListResponse[]> {
    const books = await this.prisma.book.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : {
              student: {
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
        coverPdfUrl: true,
        interiorPdfUrl: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            name: true,
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
      status: book.status,
      student: {
        id: book.student.id,
        name: book.student.name,
      },
      class: {
        id: book.student.class.id,
        name: book.student.class.name,
        schoolYear: book.student.class.schoolYear,
      },
      unit: {
        id: book.student.class.units.id,
        name: book.student.class.units.name,
        schoolName: book.student.class.units.school.name,
      },
      coverPdfUrl: book.coverPdfUrl,
      interiorPdfUrl: book.interiorPdfUrl,
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
        coverPdfUrl: true,
        interiorPdfUrl: true,
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
            originalImageUrl: true,
            status: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
                bookGenre: true,
                bookGenreExplanation: true,
                thanksMessage: true,
                schoolMessage: true,
                schoolTeam: true,
                units: {
                  select: {
                    id: true,
                    name: true,
                    logoUrl: true,
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
          unitId: book.student.class.units.id,
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
      status: book.status,
      student: {
        id: book.student.id,
        name: book.student.name,
      },
      class: {
        id: book.student.class.id,
        name: book.student.class.name,
        schoolYear: book.student.class.schoolYear,
        bookGenre: book.student.class.bookGenre,
        bookGenreExplanation: book.student.class.bookGenreExplanation,
        thanksMessage: book.student.class.thanksMessage,
        schoolMessage: book.student.class.schoolMessage,
        schoolTeam: book.student.class.schoolTeam,
      },
      unit: {
        id: book.student.class.units.id,
        name: book.student.class.units.name,
        schoolName: book.student.class.units.school.name,
        logoUrl: book.student.class.units.logoUrl,
      },
      pages: book.pages.map((p) => ({
        number: p.number,
        type: p.type,
        textContent: p.textContent,
        drawImageUrl: p.drawImageUrl,
        imageUrl: p.imageUrl,
        originalImageUrl: p.originalImageUrl,
        status: p.status as any,
      })),
      coverPdfUrl: book.coverPdfUrl,
      interiorPdfUrl: book.interiorPdfUrl,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    } satisfies GetBookDetailResponse;
  }

  async updatePage(
    bookId: string,
    pageNumber: number,
    data: {
      textContent?: string | null;
      status?: PageStatus;
      bookGenre?: string | null;
      bookGenreExplanation?: string | null;
      thanksMessage?: string | null;
      schoolMessage?: string | null;
      schoolTeam?: string | null;
    },
    user: AuthUser,
  ): Promise<void> {
    // Ensure user has access to this book
    const bookDetail = await this.getById(bookId, user);

    const forbiddenBySchoolStatusList: BookStatus[] = [
      BookStatus.REVISED_BY_MAGNA,
      BookStatus.READY_FOR_SALE,
      BookStatus.ARCHIVED,
    ];

    if (
      user.role === UserRole.SCHOOL &&
      forbiddenBySchoolStatusList.includes(bookDetail.status)
    ) {
      throw new ForbiddenBookReadyException();
    }

    const page = bookDetail.pages.find((p) => p.number === pageNumber);
    if (!page) throw new NotFoundPageException();

    const finalStatus = data.status !== undefined ? data.status : page.status;

    const statusWithContent: PageStatus[] = [
      PageStatus.REVISED_BY_SCHOOL,
      PageStatus.READY,
    ];

    if (
      statusWithContent.includes(finalStatus) &&
      page.type !== PageType.BLANK
    ) {
      let hasTextContent = false;
      if (page.type === PageType.PREFACE) {
        const bookRecord = await this.prisma.book.findUnique({
          where: { id: bookId },
          select: {
            student: {
              select: { class: { select: { bookGenreExplanation: true } } },
            },
          },
        });
        const explanation =
          data.bookGenreExplanation !== undefined
            ? data.bookGenreExplanation
            : bookRecord?.student?.class?.bookGenreExplanation;
        hasTextContent = !!explanation?.trim();
      } else if (page.type === PageType.THANKS) {
        const bookRecord = await this.prisma.book.findUnique({
          where: { id: bookId },
          select: {
            student: {
              select: {
                class: {
                  select: {
                    thanksMessage: true,
                    schoolMessage: true,
                    schoolTeam: true,
                  },
                },
              },
            },
          },
        });
        const msg =
          data.thanksMessage !== undefined
            ? data.thanksMessage
            : bookRecord?.student?.class?.thanksMessage;
        const schoolMsg =
          data.schoolMessage !== undefined
            ? data.schoolMessage
            : bookRecord?.student?.class?.schoolMessage;
        const team =
          data.schoolTeam !== undefined
            ? data.schoolTeam
            : bookRecord?.student?.class?.schoolTeam;
        hasTextContent = !!msg?.trim() || !!schoolMsg?.trim() || !!team?.trim();
      } else {
        const finalContent =
          data.textContent !== undefined ? data.textContent : page.textContent;
        hasTextContent = !!finalContent?.trim();
      }

      const hasImageContent =
        !!page.drawImageUrl || !!page.imageUrl || !!page.originalImageUrl;

      if (!hasTextContent && !hasImageContent) {
        throw new BadRequestPageWithoutContentException();
      }
    }

    const updateData: any = {};
    if (data.textContent !== undefined) {
      updateData.textContent = data.textContent;
    }

    if (data.status !== undefined) {
      if (user.role === UserRole.SCHOOL) {
        if (
          data.status !== PageStatus.REVISED_BY_SCHOOL &&
          data.status !== PageStatus.IN_PROGRESS
        ) {
          throw new BadRequestInvalidStatusForRoleException('escola');
        }
        updateData.status = data.status;
      } else if (user.role === UserRole.ADMIN) {
        if (
          data.status === PageStatus.READY &&
          page.status !== PageStatus.REVISED_BY_SCHOOL &&
          page.status !== PageStatus.READY
        ) {
          throw new BadRequestPageNotRevisedBySchoolException();
        }
        updateData.status = data.status;
      } else {
        throw new ForbiddenPageUpdateException();
      }
    }

    await this.prisma.page.update({
      where: { bookId_number: { bookId, number: pageNumber } },
      data: updateData,
    });

    if (page.type === PageType.PREFACE) {
      const bookRecord = await this.prisma.book.findUnique({
        where: { id: bookId },
        select: { student: { select: { classId: true } } },
      });
      if (bookRecord?.student?.classId) {
        await this.prisma.class.update({
          where: { id: bookRecord.student.classId },
          data: {
            bookGenre:
              data.bookGenre !== undefined ? data.bookGenre : undefined,
            bookGenreExplanation:
              data.bookGenreExplanation !== undefined
                ? data.bookGenreExplanation
                : undefined,
          },
        });
      }
    } else if (page.type === PageType.THANKS) {
      const bookRecord = await this.prisma.book.findUnique({
        where: { id: bookId },
        select: { student: { select: { classId: true } } },
      });
      if (bookRecord?.student?.classId) {
        await this.prisma.class.update({
          where: { id: bookRecord.student.classId },
          data: {
            thanksMessage:
              data.thanksMessage !== undefined ? data.thanksMessage : undefined,
            schoolMessage:
              data.schoolMessage !== undefined ? data.schoolMessage : undefined,
            schoolTeam:
              data.schoolTeam !== undefined ? data.schoolTeam : undefined,
          },
        });
      }
    }

    if (data.status !== undefined) {
      const allPages = await this.prisma.page.findMany({
        where: { bookId },
      });

      const allRevised = allPages.every(
        (p) =>
          p.status === PageStatus.REVISED_BY_SCHOOL ||
          p.status === PageStatus.READY,
      );
      const allReady = allPages.every((p) => p.status === PageStatus.READY);

      let newBookStatus: BookStatus = BookStatus.DRAFT;
      if (allReady) {
        newBookStatus = BookStatus.REVISED_BY_MAGNA;
      } else if (allRevised) {
        newBookStatus = BookStatus.REVISED_BY_SCHOOL;
      }

      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: newBookStatus },
      });
    }
  }

  async updateBook(
    bookId: string,
    data: { title?: string | null },
    user: AuthUser,
  ): Promise<void> {
    const bookDetail = await this.getById(bookId, user); // Ensure user has access

    if (
      user.role === UserRole.SCHOOL &&
      bookDetail.status !== BookStatus.DRAFT
    ) {
      throw new ForbiddenBookReadyException();
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data,
    });
  }

  async updatePageDraw(
    bookId: string,
    pageNumber: number,
    image: Express.Multer.File,
    originalImage: Express.Multer.File | undefined,
    user: AuthUser,
  ): Promise<{ drawImageUrl: string; originalImageUrl?: string }> {
    const book = await this.getById(bookId, user);

    if (user.role === UserRole.SCHOOL && book.status !== BookStatus.DRAFT) {
      throw new ForbiddenBookReadyException();
    }

    // Resolve student → class → unit → active event
    const student = await this.prisma.student.findUnique({
      where: { id: book.student.id },
      select: {
        class: {
          select: {
            unitId: true,
            schoolYear: true,
          },
        },
      },
    });

    if (!student) throw new NotFoundBookException();

    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: student.class.unitId,
        schoolYear: student.class.schoolYear,
        status: { in: ['ONGOING', 'PLANNED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new Error('Active event not found');

    const getExt = (mimeType: string) =>
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';

    const ext = getExt(image.mimetype);
    const key = getProcessedPageUploadBucketPath({
      unitId: student.class.unitId,
      eventId: activeEvent.id,
      studentId: book.student.id,
      bookId,
      pageNumber,
      ext,
    });

    const drawImageUrl = await this.bucketService.upload({
      key,
      body: image.buffer,
      contentType: image.mimetype,
    });

    let originalImageUrl: string | undefined = undefined;
    if (originalImage) {
      const origExt = getExt(originalImage.mimetype);
      const origKey = getOriginalPageUploadBucketPath({
        unitId: student.class.unitId,
        studentId: book.student.id,
        pageNumber,
        bookId,
        eventId: activeEvent.id,
        ext: origExt,
      });
      originalImageUrl = await this.bucketService.upload({
        key: origKey,
        body: originalImage.buffer,
        contentType: originalImage.mimetype,
      });
    }

    await this.prisma.page.update({
      where: { bookId_number: { bookId, number: pageNumber } },
      data: {
        drawImageUrl,
        ...(originalImageUrl ? { originalImageUrl } : {}),
      },
    });

    return { drawImageUrl, originalImageUrl };
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
        price: book.price ? Number(book.price.amount) : 0,
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
      price: book.price ? Number(book.price.amount) : 0,
    };
  }

  async generateFinalBookPdf(
    bookId: string,
    user: AuthUser,
  ): Promise<{ interiorPdfUrl: string; coverPdfUrl: string }> {
    const bookDetail = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        status: true,
        student: {
          select: {
            id: true,
            class: {
              select: {
                unitId: true,
                schoolYear: true,
              },
            },
          },
        },
      },
    });

    if (!bookDetail) throw new NotFoundBookException();

    // Check user unit access if not admin
    if (user.role !== UserRole.ADMIN) {
      const hasAccess = await this.prisma.userUnit.findFirst({
        where: {
          userId: user.id,
          unitId: bookDetail.student.class.unitId,
        },
      });
      if (!hasAccess) throw new NotFoundBookException();
    }

    // Resolve active event
    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: bookDetail.student.class.unitId,
        schoolYear: bookDetail.student.class.schoolYear,
        status: { in: ['ONGOING', 'PLANNED'] },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForStudentException();

    const [interiorBookPdf, coverBookPdf] = await Promise.all([
      this.pdfService.generateBookInteriorPdf(bookId, user),
      this.pdfService.generateBookCoverPdf(bookId),
    ]);

    const interiorBookKey = getBookInteriorBucketKey({
      eventId: activeEvent.id,
      unitId: bookDetail.student.class.unitId,
      studentId: bookDetail.student.id,
      bookId,
    });

    const coverBookKey = getBookCoverBucketKey({
      unitId: bookDetail.student.class.unitId,
      eventId: activeEvent.id,
      studentId: bookDetail.student.id,
      bookId,
    });

    const [interiorPdfUrl, coverPdfUrl] = await Promise.all([
      this.bucketService.upload({
        key: interiorBookKey,
        body: interiorBookPdf,
        contentType: 'application/pdf',
      }),
      this.bucketService.upload({
        key: coverBookKey,
        body: coverBookPdf,
        contentType: 'application/pdf',
      }),
    ]);

    await this.prisma.book.update({
      where: { id: bookId },
      data: { interiorPdfUrl, coverPdfUrl },
    });

    return { interiorPdfUrl, coverPdfUrl };
  }

  async createBook(
    body: CreateBookDto,
    user: AuthUser,
  ): Promise<GetBookDetailResponse> {
    const student = await this.prisma.student.findUnique({
      where: { id: body.studentId },
      include: {
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundStudentException();
    }

    if (user.role !== UserRole.ADMIN) {
      const hasAccess = await this.prisma.userUnit.findFirst({
        where: {
          userId: user.id,
          unitId: student.class.unitId,
        },
      });

      if (!hasAccess) throw new UnauthorizedUserNoAccessToUnitException();
    }

    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: student.class.unitId,
        schoolYear: student.class.schoolYear,
        status: {
          in: ['ONGOING', 'PLANNED'],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForStudentException();

    const existingBook = await this.prisma.book.findUnique({
      where: {
        studentId_authographsEventId: {
          studentId: student.id,
          authographsEventId: activeEvent.id,
        },
      },
    });

    if (existingBook) throw new ConflictBookAlreadyExistsException();

    let magnificCode = generateMagnificCode();
    while (true) {
      const existingBookCode = await this.prisma.book.findFirst({
        where: { magnificCode },
      });

      if (!existingBookCode) break;
      magnificCode = generateMagnificCode();
    }

    const template = await this.prisma.bookTemplate.findUnique({
      where: {
        id: student.class.bookTemplateId,
      },
      select: {
        bookTemplatePages: {
          select: { pageNumber: true, pageType: true },
        },
      },
    });

    if (!template) throw new NotFoundBookTemplateException();

    const priceId = await this.getDefaultPriceId();

    const book = await this.prisma.book.create({
      data: {
        magnificCode,
        studentId: student.id,
        authographsEventId: activeEvent.id,
        priceId,
        title: body.title || null,
        author: student.name,
        status: BookStatus.DRAFT,
      },
    });

    await Promise.all(
      template.bookTemplatePages.map(async (p) => {
        await this.prisma.page.create({
          data: {
            bookId: book.id,
            number: p.pageNumber,
            type: p.pageType,
            status:
              p.pageType === PageType.BLANK
                ? PageStatus.READY
                : PageStatus.NOT_STARTED,
          },
        });
      }),
    );

    return this.getById(book.id, user);
  }

  private async getDefaultPriceId(): Promise<string> {
    const price = await this.prisma.price.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (price) return price.id;

    const created = await this.prisma.price.create({
      data: { amount: 0 },
      select: { id: true },
    });
    return created.id;
  }
}
