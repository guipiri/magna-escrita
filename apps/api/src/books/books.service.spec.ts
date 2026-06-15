import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service.js';
import { PrismaService } from '../db/db.service.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { PageStatus, PageType } from '@prisma/client';

describe('BooksService', () => {
  let service: BooksService;
  let prisma: PrismaService;

  const mockPrisma = {
    book: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    page: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    userUnit: {
      findFirst: jest.fn(),
    },
  };

  const mockR2 = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudflareR2Service, useValue: mockR2 },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePage', () => {
    const user = { id: 'user-1', role: UserRole.SCHOOL };
    const bookId = 'book-1';
    const pageNumber = 2;

    const baseBookDetail = {
      id: bookId,
      magnificCode: '123456',
      title: 'Livro de Teste',
      author: 'Autor',
      synopsis: 'Sinopse',
      status: 'DRAFT',
      student: {
        id: 'student-1',
        name: 'Estudante',
        class: {
          id: 'class-1',
          name: 'Turma',
          schoolYear: '2026',
          units: {
            id: 'unit-1',
            name: 'Unidade',
            logoUrl: null,
            school: { name: 'Escola' },
          },
        },
      },
      pages: [
        {
          number: 2,
          type: 'TEXT' as PageType,
          textContent: null,
          drawImageUrl: null,
          imageUrl: null,
          originalImageUrl: null,
          status: 'IN_PROGRESS' as PageStatus,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw BadRequestException if marking non-BLANK page as REVISED_BY_SCHOOL when it has no content', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(baseBookDetail);
      mockPrisma.userUnit.findFirst.mockResolvedValue({ id: 'userUnit-1' });

      await expect(
        service.updatePage(
          bookId,
          pageNumber,
          { status: 'REVISED_BY_SCHOOL' as PageStatus },
          user as any,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Não é permitido marcar uma página sem conteúdo como revisada.',
        ),
      );
    });

    it('should allow marking non-BLANK page as REVISED_BY_SCHOOL if it has text content', async () => {
      mockPrisma.book.findUnique.mockResolvedValue(baseBookDetail);
      mockPrisma.userUnit.findFirst.mockResolvedValue({ id: 'userUnit-1' });
      mockPrisma.page.update.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await expect(
        service.updatePage(
          bookId,
          pageNumber,
          {
            status: 'REVISED_BY_SCHOOL' as PageStatus,
            textContent: 'Algum texto',
          },
          user as any,
        ),
      ).resolves.not.toThrow();

      expect(mockPrisma.page.update).toHaveBeenCalled();
    });

    it('should allow marking BLANK page as REVISED_BY_SCHOOL even if it has no content', async () => {
      const blankBookDetail = {
        ...baseBookDetail,
        pages: [
          {
            ...baseBookDetail.pages[0],
            type: 'BLANK' as PageType,
          },
        ],
      };
      mockPrisma.book.findUnique.mockResolvedValue(blankBookDetail);
      mockPrisma.userUnit.findFirst.mockResolvedValue({ id: 'userUnit-1' });
      mockPrisma.page.update.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await expect(
        service.updatePage(
          bookId,
          pageNumber,
          { status: 'REVISED_BY_SCHOOL' as PageStatus },
          user as any,
        ),
      ).resolves.not.toThrow();

      expect(mockPrisma.page.update).toHaveBeenCalled();
    });

    it('should allow marking non-BLANK page as REVISED_BY_SCHOOL if it has image content', async () => {
      const imageBookDetail = {
        ...baseBookDetail,
        pages: [
          {
            ...baseBookDetail.pages[0],
            drawImageUrl: 'https://r2.bucket/image.png',
          },
        ],
      };
      mockPrisma.book.findUnique.mockResolvedValue(imageBookDetail);
      mockPrisma.userUnit.findFirst.mockResolvedValue({ id: 'userUnit-1' });
      mockPrisma.page.update.mockResolvedValue({});
      mockPrisma.page.findMany.mockResolvedValue([]);

      await expect(
        service.updatePage(
          bookId,
          pageNumber,
          { status: 'REVISED_BY_SCHOOL' as PageStatus },
          user as any,
        ),
      ).resolves.not.toThrow();

      expect(mockPrisma.page.update).toHaveBeenCalled();
    });
  });
});
