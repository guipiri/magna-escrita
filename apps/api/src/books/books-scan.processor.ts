import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../db/db.service.js';
import type { ExtractDrawService } from './providers/extract-draw.service.js';
import type { ExtractTextService } from './providers/extract-text.service.js';
import type { ReadQrCodeService } from './providers/read-qr-code.service.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import {
  $Enums,
  AuthographsEventStatus,
  PageStatus,
  PageType,
} from '@prisma/client';
import { generateMagnificCode } from './books.utils.js';
import {
  getOriginalPageUploadBucketPath,
  getProcessedPageUploadBucketPath,
} from '../common/bucket/bucket.utils.js';
import {
  BadRequestBookTemplateMismatchException,
  BadRequestPageAlreadyProcessedException,
  BadRequestQrCodeNotReadableException,
  NotFoundActiveEventForStudentException,
  NotFoundBookTemplatePageException,
  NotFoundStudentException,
} from './books-scan.errors.js';

interface ScanJobPayload {
  filename: string;
  mimetype: string;
  buffer: string; // base64 string
}

interface QrCodeData {
  studentId: string;
  templateId: string;
  page: number;
}

@Processor('books-scan')
@Injectable()
export class BooksScanProcessor extends WorkerHost {
  private readonly logger = new Logger(BooksScanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
    @Inject('ExtractDrawService')
    private readonly processDrawService: ExtractDrawService,
    @Inject('ExtractTextService')
    private readonly extractTextService: ExtractTextService,
    @Inject('ReadQrCodeService')
    private readonly readQrCodeService: ReadQrCodeService,
  ) {
    super();
  }

  async process(job: Job<ScanJobPayload>): Promise<void> {
    const { filename, mimetype, buffer } = job.data;
    this.logger.log(`Processing scan image job ${job.id} for file ${filename}`);

    const fileBuffer = Buffer.from(buffer, 'base64');
    const mockFile: Express.Multer.File = {
      buffer: fileBuffer,
      originalname: filename,
      mimetype,
      size: fileBuffer.length,
      fieldname: 'images',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    try {
      await this.processImage(mockFile);
      this.logger.log(`Successfully processed file ${filename}`);
    } catch (err: unknown) {
      this.logger.error(`Failed to process scan image job ${job.id}:`, err);
      throw err;
    }
  }

  private async processImage(file: Express.Multer.File): Promise<void> {
    // 1. Read QR Code locally with Jimp + jsQR
    const qrStringData = await this.readQrCodeService.execute(file);
    if (!qrStringData) throw new BadRequestQrCodeNotReadableException();

    const qrData = this.parseQrPayload(qrStringData);
    this.logger.debug(`QR code data extracted: ${qrStringData}`);

    // 2. Fetch student → class → current template
    const student = await this.prisma.student.findUnique({
      where: { id: qrData.studentId },
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

    if (!student) throw new NotFoundStudentException();

    // 3. Validate template consistency
    if (student.class.bookTemplateId !== qrData.templateId) {
      throw new BadRequestBookTemplateMismatchException(
        qrData.templateId,
        student.class.bookTemplateId,
      );
    }

    // 4. Fetch the template page to determine page type
    const template = await this.prisma.bookTemplate.findUnique({
      where: {
        id: qrData.templateId,
      },
      select: {
        bookTemplatePages: {
          select: { pageNumber: true, pageType: true },
        },
      },
    });
    const templatePage = template?.bookTemplatePages.find(
      (p) => p.pageNumber === qrData.page,
    );

    if (!template || !templatePage)
      throw new NotFoundBookTemplatePageException();

    // 5. Fetch active event for this unit + school year
    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: student.class.unitId,
        schoolYear: student.class.schoolYear,
        status: {
          in: [AuthographsEventStatus.ONGOING, AuthographsEventStatus.PLANNED],
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvent) throw new NotFoundActiveEventForStudentException();

    // 6. Upsert the Book
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
        studentId_authographsEventId: {
          studentId: student.id,
          authographsEventId: activeEvent.id,
        },
      },
      create: {
        magnificCode,
        studentId: student.id,
        authographsEventId: activeEvent.id,
      },
      update: {},
      select: { id: true, pages: { select: { number: true, status: true } } },
    });

    await Promise.all(
      template.bookTemplatePages.map(async (p) => {
        const pageTypesToCreateWithStatusReady: $Enums.PageType[] = [
          $Enums.PageType.BLANK,
        ];
        const status = pageTypesToCreateWithStatusReady.includes(p.pageType)
          ? PageStatus.READY
          : PageStatus.NOT_STARTED;

        await this.prisma.page.upsert({
          where: {
            bookId_number: {
              bookId: book.id,
              number: p.pageNumber,
            },
          },
          create: {
            bookId: book.id,
            number: p.pageNumber,
            type: p.pageType,
            status,
          },
          update: {},
        });
      }),
    );
    this.logger.debug(`Book upserted: ${book.id}`);

    const allowedStatuses: PageStatus[] = [
      PageStatus.NOT_STARTED,
      PageStatus.IN_PROGRESS,
    ];
    const currentPageStatus = book.pages.find(
      (p) => p.number === qrData.page,
    )?.status;

    if (!currentPageStatus || !allowedStatuses.includes(currentPageStatus)) {
      this.logger.log(
        `Page ${qrData.page} of book ${book.id} is on status ${currentPageStatus} and does not have an allowed status to be processed, skipping file upload`,
      );
      throw new BadRequestPageAlreadyProcessedException(
        qrData.page,
        currentPageStatus,
      );
    }

    // 7. Save the file to R2 before any processing
    const originalFileBucketKey = getOriginalPageUploadBucketPath({
      unitId: student.class.unitId,
      eventId: activeEvent.id,
      studentId: student.id,
      bookId: book.id,
      pageNumber: qrData.page,
      ext: this.getExtension(file.mimetype),
    });
    const originalImageUrl = await this.bucketService.upload({
      key: originalFileBucketKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    this.logger.debug(`Original image uploaded: ${originalImageUrl}`);

    // 8. Process page content based on type
    let textContent: string | undefined;
    let drawImageUrl: string | undefined;

    const pageType = templatePage.pageType;

    if (
      pageType === PageType.DRAW ||
      pageType === PageType.DRAW_TEXT ||
      pageType === PageType.COVER
    ) {
      this.logger.debug(`Processing page type: ${pageType}`);

      const processedDrawKey = getProcessedPageUploadBucketPath({
        unitId: student.class.unitId,
        eventId: activeEvent.id,
        studentId: student.id,
        bookId: book.id,
        pageNumber: qrData.page,
        ext: this.getExtension(file.mimetype),
      });

      const processedDrawFile = await this.processDrawService.execute(file);
      const processedDrawBuffer = Buffer.from(
        await processedDrawFile.arrayBuffer(),
      );

      drawImageUrl = await this.bucketService.upload({
        key: processedDrawKey,
        body: processedDrawBuffer,
        contentType: processedDrawFile.type || file.mimetype,
      });
      this.logger.debug(`Processed draw image uploaded: ${drawImageUrl}`);
    }

    if (pageType === PageType.TEXT || pageType === PageType.DRAW_TEXT)
      textContent = await this.extractTextService.execute(file);

    // 9. Upsert the Page (keeps status as IN_PROGRESS)
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
        originalImageUrl,
        imageUrl: null,
        status: PageStatus.IN_PROGRESS,
      },
      update: {
        type: pageType,
        textContent: textContent ?? null,
        drawImageUrl: drawImageUrl ?? null,
        originalImageUrl,
        imageUrl: null,
        status: PageStatus.IN_PROGRESS,
      },
    });

    if (pageType === PageType.COVER) {
      const title = await this.extractTextService.execute(file);
      await this.prisma.book.update({
        where: { id: book.id },
        data: { title },
      });
    }
  }

  private parseQrPayload(payload: string): QrCodeData {
    let parsed: QrCodeData;
    try {
      parsed = JSON.parse(payload) as QrCodeData;
    } catch {
      throw new BadRequestQrCodeNotReadableException();
    }

    if (
      !parsed.studentId ||
      !parsed.templateId ||
      (!parsed.page && parsed.page !== 0)
    )
      throw new BadRequestQrCodeNotReadableException();

    return parsed;
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
