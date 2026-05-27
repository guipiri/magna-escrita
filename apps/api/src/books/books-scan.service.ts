import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { CloudflareR2Service } from '../common/cloudflare-r2.service.js';
import type { ExtractDrawService } from './providers/extract-draw.service.js';
import type { ExtractTextService } from './providers/extract-text.service.js';
import type { ReadQrCodeService } from './providers/read-qr-code.service.js';
import {
  BadRequestBookTemplateMismatchException,
  BadRequestQrCodeNotReadableException,
  NotFoundActiveEventForEnrollmentException,
  NotFoundBookTemplatePageException,
  NotFoundEnrollmentException,
} from './books-scan.errors.js';
import {
  generateMagnificCode,
  getOriginalPageUploadBucketPath,
  getProcessedPageUploadBucketPath,
} from './books.utils.js';
import { AuthographsEventStatus, PageType } from '@prisma/client';

interface QrCodeData {
  enrollmentId: string;
  templateId: string;
  page: number;
}

export interface ScanPageResult {
  filename: string;
  enrollmentId: string;
  pageNumber: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ScanBooksResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: ScanPageResult[];
}

@Injectable()
export class BooksScanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: CloudflareR2Service,
    @Inject('ExtractDrawService')
    private readonly processDrawService: ExtractDrawService,
    @Inject('ExtractTextService')
    private readonly extractTextService: ExtractTextService,
    @Inject('ReadQrCodeService')
    private readonly readQrCodeService: ReadQrCodeService,
  ) {}

  async scanImages(files: Express.Multer.File[]): Promise<ScanBooksResult> {
    const results: any[] = [];

    for (const file of files) {
      try {
        const result = await this.processImage(file);
        results.push(result);
      } catch (err: unknown) {
        console.error(`Error processing file ${file.originalname}:`, err);
        const message =
          err instanceof Error ? err.message : 'Erro desconhecido';
        results.push({
          filename: file.originalname,
          enrollmentId: '',
          pageNumber: 0,
          status: 'error',
          error: message,
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'success').length;

    return {
      processed: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    };
  }

  private async processImage(
    file: Express.Multer.File,
  ): Promise<ScanPageResult> {
    // 1. Read QR Code locally with Jimp + jsQR
    const qrStringData = await this.readQrCodeService.execute(file);
    if (!qrStringData) throw new BadRequestQrCodeNotReadableException();
    const qrData = this.parseQrPayload(qrStringData);
    console.debug('QR code data extracted:', qrStringData);

    // 2. Fetch enrollment → class → current template
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: qrData.enrollmentId },
      select: {
        id: true,
        class: {
          select: {
            id: true,
            unitId: true,
            schoolYear: true,
            bookTemplateId: true,
          },
        },
      },
    });

    if (!enrollment) throw new NotFoundEnrollmentException();

    // // 3. Validate template consistency
    if (enrollment.class.bookTemplateId !== qrData.templateId) {
      throw new BadRequestBookTemplateMismatchException(
        qrData.templateId,
        enrollment.class.bookTemplateId,
      );
    }

    // 4. Fetch the template page to determine page type
    const templatePage = await this.prisma.bookTemplatePage.findUnique({
      where: {
        bookTemplateId_pageNumber: {
          bookTemplateId: qrData.templateId,
          pageNumber: qrData.page,
        },
      },
      select: { pageType: true },
    });

    if (!templatePage) throw new NotFoundBookTemplatePageException();

    // // 5. Fetch active event for this unit + school year
    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: enrollment.class.unitId,
        schoolYear: enrollment.class.schoolYear,
        status: {
          in: [AuthographsEventStatus.ONGOING, AuthographsEventStatus.PLANNED],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForEnrollmentException();

    // 6. Upsert the Book

    // Generate a unique magnific code for the book
    let magnificCode = generateMagnificCode();
    while (true) {
      const existingBook = await this.prisma.book.findFirst({
        where: { magnificCode },
      });

      if (!existingBook) break;
      magnificCode = generateMagnificCode();
    }

    const book = await this.prisma.book.upsert({
      where: {
        enrollmentId_authographsEventId: {
          enrollmentId: enrollment.id,
          authographsEventId: activeEvent.id,
        },
      },
      create: {
        magnificCode,
        enrollmentId: enrollment.id,
        authographsEventId: activeEvent.id,
        priceId: await this.getDefaultPriceId(),
      },
      update: {},
      select: { id: true },
    });
    console.debug('Book upserted:', book.id);

    // 7. Save the file to R2 before any processing to ensure we have the original image available in case of errors.
    const originalFileBucketPath = getOriginalPageUploadBucketPath({
      unitId: enrollment.class.unitId,
      eventId: activeEvent.id,
      enrollmentId: enrollment.id,
      bookId: book.id,
      pageNumber: qrData.page,
    });
    const originalImageKey = `${originalFileBucketPath}.${this.getExtension(file.mimetype)}`;
    await this.r2.upload({
      key: originalImageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    console.debug('Original image uploaded:', originalFileBucketPath);

    // 8. Process page content based on type
    let textContent: string | undefined;
    let drawImageUrl: string | undefined;

    const pageType = templatePage.pageType;

    if (pageType === PageType.DRAW || pageType === PageType.DRAW_TEXT) {
      console.debug('Processing page type:', pageType);

      const processedDrawKey = `${getProcessedPageUploadBucketPath({
        unitId: enrollment.class.unitId,
        eventId: activeEvent.id,
        enrollmentId: enrollment.id,
        bookId: book.id,
        pageNumber: qrData.page,
      })}.${this.getExtension(file.mimetype)}`;

      const processedDrawFile = await this.processDrawService.execute(file);
      const processedDrawBuffer = Buffer.from(
        await processedDrawFile.arrayBuffer(),
      );

      drawImageUrl = await this.r2.upload({
        key: processedDrawKey,
        body: processedDrawBuffer,
        contentType: processedDrawFile.type || file.mimetype,
      });
      console.debug('Processed draw image uploaded:', processedDrawKey);
    }

    if (pageType === PageType.TEXT || pageType === PageType.DRAW_TEXT)
      textContent = await this.extractTextService.execute(file);

    // 9. Upsert the Page
    await this.prisma.page.upsert({
      where: {
        bookId_number: {
          bookId: book.id,
          number: qrData.page,
        },
      },
      create: {
        bookId: book.id,
        number: qrData.page,
        type: pageType,
        textContent: textContent ?? null,
        drawImageUrl: drawImageUrl ?? null,
        imageUrl: null,
      },
      update: {
        textContent: textContent ?? null,
        drawImageUrl: drawImageUrl ?? null,
      },
    });

    return {
      filename: file.originalname,
      enrollmentId: enrollment.id,
      pageNumber: qrData.page,
      status: 'success',
    };
  }

  private parseQrPayload(payload: string): QrCodeData {
    let parsed: QrCodeData;
    try {
      parsed = JSON.parse(payload) as QrCodeData;
    } catch {
      throw new BadRequestQrCodeNotReadableException();
    }

    if (
      !parsed.enrollmentId ||
      !parsed.templateId ||
      (!parsed.page && parsed.page !== 0)
    )
      throw new BadRequestQrCodeNotReadableException();

    return parsed;
  }

  private async getDefaultPriceId(): Promise<string> {
    // Reuse the first available price or create a zero-price placeholder.
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

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return map[mimeType] ?? 'jpg';
  }
}
