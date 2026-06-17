import { Test, TestingModule } from '@nestjs/testing';
import { BookTemplatesService } from './book-templates.service.js';
import { PrismaService } from '../db/db.service.js';
import { ConflictChangePagesWithBooksException, ConflictRemoveUnitWithBooksException } from './book-templates.errors.js';
import { PageType } from '@prisma/client';

describe('BookTemplatesService', () => {
  let service: BookTemplatesService;
  let prisma: PrismaService;

  const mockPrisma = {
    bookTemplate: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookTemplatePage: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    book: {
      findFirst: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookTemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookTemplatesService>(BookTemplatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    const templateId = 'template-1';
    const baseTemplate = {
      id: templateId,
      name: 'Template Teste',
      bookTemplatePages: [
        { pageNumber: 1, pageType: PageType.COVER },
        { pageNumber: 2, pageType: PageType.TEXT },
      ],
      units: [{ id: 'unit-1' }, { id: 'unit-2' }],
    };

    it('should throw NotFoundException if template does not exist', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(null);

      await expect(service.update(templateId, { name: 'New Name' })).rejects.toThrow(
        'Template não encontrado.',
      );
    });

    it('should allow adding a unit always', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(baseTemplate);
      mockPrisma.bookTemplate.update.mockResolvedValue({
        ...baseTemplate,
        units: [{ id: 'unit-1' }, { id: 'unit-2' }, { id: 'unit-3' }],
      });
      mockPrisma.class.findMany.mockResolvedValue([]);

      const result = await service.update(templateId, {
        units: ['unit-1', 'unit-2', 'unit-3'],
      });

      expect(result.units).toEqual(['unit-1', 'unit-2', 'unit-3']);
      expect(mockPrisma.bookTemplate.update).toHaveBeenCalled();
    });

    it('should throw ConflictRemoveUnitWithBooksException when removing a unit that has books using this template', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(baseTemplate);
      // Simulating that book.findFirst finds a book for the unit being removed (unit-2)
      mockPrisma.book.findFirst.mockResolvedValue({ id: 'book-1' });

      await expect(
        service.update(templateId, {
          units: ['unit-1'], // removing unit-2
        }),
      ).rejects.toThrow(ConflictRemoveUnitWithBooksException);

      expect(mockPrisma.book.findFirst).toHaveBeenCalledWith({
        where: {
          student: {
            class: {
              unitId: 'unit-2',
              bookTemplateId: templateId,
            },
          },
        },
      });
    });

    it('should allow removing a unit if there are no books using this template in that unit', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(baseTemplate);
      mockPrisma.book.findFirst.mockResolvedValue(null);
      mockPrisma.bookTemplate.update.mockResolvedValue({
        ...baseTemplate,
        units: [{ id: 'unit-1' }],
      });
      mockPrisma.class.findMany.mockResolvedValue([]);

      const result = await service.update(templateId, {
        units: ['unit-1'], // removing unit-2
      });

      expect(result.units).toEqual(['unit-1']);
      expect(mockPrisma.bookTemplate.update).toHaveBeenCalled();
    });

    it('should throw ConflictChangePagesWithBooksException when changing pages if any books exist using this template', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(baseTemplate);
      // Simulating page changes
      const newPages = [
        { pageNumber: 1, pageType: PageType.COVER },
        { pageNumber: 2, pageType: PageType.DRAW }, // changed from TEXT
      ];
      // Simulating a book exists using this template
      mockPrisma.book.findFirst.mockResolvedValue({ id: 'book-1' });

      await expect(
        service.update(templateId, {
          pages: newPages,
        }),
      ).rejects.toThrow(ConflictChangePagesWithBooksException);

      expect(mockPrisma.book.findFirst).toHaveBeenCalledWith({
        where: {
          student: {
            class: {
              bookTemplateId: templateId,
            },
          },
        },
      });
    });

    it('should allow changing pages if no books exist using this template', async () => {
      mockPrisma.bookTemplate.findUnique.mockResolvedValue(baseTemplate);
      const newPages = [
        { pageNumber: 1, pageType: PageType.COVER },
        { pageNumber: 2, pageType: PageType.DRAW },
      ];
      mockPrisma.book.findFirst.mockResolvedValue(null);
      mockPrisma.bookTemplate.update.mockResolvedValue({
        ...baseTemplate,
        bookTemplatePages: newPages,
      });
      mockPrisma.class.findMany.mockResolvedValue([]);

      const result = await service.update(templateId, {
        pages: newPages,
      });

      expect(result.pages).toEqual(newPages);
      expect(mockPrisma.bookTemplatePage.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.bookTemplatePage.createMany).toHaveBeenCalled();
    });
  });
});
